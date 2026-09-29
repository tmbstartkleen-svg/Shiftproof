import {NextResponse} from 'next/server';import {acceptInvitation} from '@/lib/repository';
export async function POST(req:Request){const b=await req.json();if(!b.token||!b.name)return NextResponse.json({error:'token and name required'},{status:400});try{return NextResponse.json({user:await acceptInvitation(b.token,b.name)})}catch(e:any){return NextResponse.json({error:e.message},{status:400})}}
