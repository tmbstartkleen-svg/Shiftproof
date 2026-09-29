import {NextResponse} from 'next/server';
import {canAdmin,createSessionToken,getSession,sessionCookie} from '@/lib/auth';
import {createOrganization} from '@/lib/repository';
import {assertTrustedMutation} from '@/lib/security';

export async function POST(req:Request){
  try{assertTrustedMutation(req)}catch{return NextResponse.json({error:'untrusted origin'},{status:403})}
  const s=await getSession();
  if(!s||!canAdmin(s.role)) return NextResponse.json({error:'forbidden'},{status:403});
  const b=await req.json();
  if(!b.name||!b.slug) return NextResponse.json({error:'name and slug required'},{status:400});
  try{
    const organization=await createOrganization({name:b.name,slug:b.slug},s.userId);
    const token=createSessionToken({userId:s.userId,email:s.email,name:s.name,role:'Owner',organizationId:String(organization.id),facilityIds:[]});
    const res=NextResponse.json({organization,sessionRotated:true});
    res.cookies.set(sessionCookie(token));
    return res;
  }catch(e:any){return NextResponse.json({error:e.message},{status:400})}
}
