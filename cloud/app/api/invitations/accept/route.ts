import {NextResponse} from 'next/server';
import {getSession} from '@/lib/auth';
import {acceptInvitation} from '@/lib/repository';
import {assertTrustedMutation} from '@/lib/security';

export async function POST(req:Request){
  try{assertTrustedMutation(req)}catch{return NextResponse.json({error:'untrusted origin'},{status:403})}
  const s=await getSession();
  if(!s) return NextResponse.json({error:'authenticated verified identity required'},{status:401});
  const b=await req.json();
  if(!b.token||!b.name) return NextResponse.json({error:'token and name required'},{status:400});
  try{return NextResponse.json({user:await acceptInvitation(b.token,b.name,s.email,s.userId)})}
  catch(e:any){return NextResponse.json({error:e.message},{status:400})}
}
