import {NextResponse} from 'next/server';
import {canAdmin,getSession} from '@/lib/auth';
import {processNotificationOutbox} from '@/lib/notifications';
import {assertTrustedMutation} from '@/lib/security';

export async function POST(req:Request){
  try{assertTrustedMutation(req)}catch{return NextResponse.json({error:'untrusted origin'},{status:403})}
  const s=await getSession();
  if(!s||!canAdmin(s.role)) return NextResponse.json({error:'forbidden'},{status:403});
  const body=await req.json().catch(()=>({}));
  return NextResponse.json(await processNotificationOutbox(Number(body.limit||25)));
}
