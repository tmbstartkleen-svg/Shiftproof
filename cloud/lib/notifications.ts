import 'server-only';
import { databaseConfigured, sql } from '@/lib/db';
import { notificationStatus } from '@/lib/services';

type NotificationInput={
  organizationId:string;facilityId?:string|null;channel:string;destination:string;
  subject:string;message:string;eventType?:string;
};

async function deliverPayload(input:NotificationInput){
  const status=notificationStatus();
  if(!status.configured) return {ok:false,status:0,error:'notification_provider_not_configured',provider:status.provider};
  try{
    const headers:Record<string,string>={'content-type':'application/json'};
    if(process.env.SHIFTPROOF_NOTIFICATION_WEBHOOK_TOKEN) headers.authorization=`Bearer ${process.env.SHIFTPROOF_NOTIFICATION_WEBHOOK_TOKEN}`;
    const response=await fetch(process.env.SHIFTPROOF_NOTIFICATION_WEBHOOK_URL!,{
      method:'POST',headers,body:JSON.stringify({
        channel:input.channel,destination:input.destination,subject:input.subject,message:input.message,
        eventType:input.eventType||'shiftproof.notification',organizationId:input.organizationId,facilityId:input.facilityId||null
      })
    });
    return {ok:response.ok,status:response.status,error:response.ok?null:`provider_http_${response.status}`,provider:status.provider};
  }catch(e:any){
    return {ok:false,status:0,error:String(e?.message||e),provider:status.provider};
  }
}

export async function attemptNotificationDelivery(id:string){
  if(!databaseConfigured()) throw new Error('database_required');
  const [row]=await sql()`select id::text,organization_id::text as "organizationId",facility_id::text as "facilityId",
    channel,destination,subject,message,event_type as "eventType",attempts
    from notification_deliveries where id=${id}::uuid limit 1`;
  if(!row) throw new Error('notification_not_found');
  const result=await deliverPayload(row as NotificationInput);
  const attempts=Number(row.attempts||0)+1;
  const nextAttempt=result.ok?null:new Date(Date.now()+Math.min(60,2**Math.min(attempts,6))*60_000).toISOString();
  const status=result.ok?'sent':attempts>=6?'dead_letter':'retry';
  await sql()`update notification_deliveries set status=${status},attempts=${attempts},last_attempt_at=now(),
    next_attempt_at=${nextAttempt},last_error=${result.error||null},
    provider_response=${sql().json({status:result.status,ok:result.ok} as any)}
    where id=${id}::uuid`;
  return {id,status,attempts,nextAttemptAt:nextAttempt,provider:result.provider};
}

export async function processNotificationOutbox(limit=25){
  if(!databaseConfigured()) return {processed:0,results:[],demo:true};
  const rows=await sql()`select id::text from notification_deliveries
    where status in ('pending','retry') and (next_attempt_at is null or next_attempt_at<=now())
    order by created_at asc limit ${Math.max(1,Math.min(limit,100))}`;
  const results=[] as any[];
  for(const row of rows) results.push(await attemptNotificationDelivery(String(row.id)));
  return {processed:results.length,results};
}

export async function sendNotification(input:NotificationInput){
  const status=notificationStatus();
  if(!databaseConfigured()){
    const r=await deliverPayload(input);
    return {id:`demo_notification_${Date.now()}`,status:r.ok?'sent':'skipped',provider:status.provider,demo:true};
  }
  const [row]=await sql()`insert into notification_deliveries(
      organization_id,facility_id,channel,destination,subject,message,event_type,provider,status,provider_response,next_attempt_at
    ) values(
      ${input.organizationId}::uuid,${input.facilityId||null}::uuid,${input.channel},${input.destination},
      ${input.subject},${input.message},${input.eventType||'shiftproof.notification'},${status.provider},
      'pending',${sql().json({} as any)},now()
    ) returning id::text`;
  return await attemptNotificationDelivery(String(row.id));
}
