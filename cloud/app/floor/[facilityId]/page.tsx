import {redirect,notFound} from 'next/navigation';
import {getSession} from '@/lib/auth';
import {assertFacilityAccess} from '@/lib/tenant';
import {listFacilities} from '@/lib/repository';
import FloorConsole from '@/components/FloorConsole';

export default async function FloorPage({params}:{params:Promise<{facilityId:string}>}){
  const s=await getSession();
  if(!s)redirect('/');
  const {facilityId}=await params;
  try{assertFacilityAccess(s,facilityId)}catch{notFound()}
  const facilities=await listFacilities(s.organizationId);
  const facility=facilities.find((f:any)=>String(f.id)===facilityId);
  if(!facility)notFound();
  return <FloorConsole facilityId={facilityId} facilityName={facility.name} userName={s.name} role={s.role}/>;
}
