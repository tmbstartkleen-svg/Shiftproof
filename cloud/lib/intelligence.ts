import 'server-only';
import {databaseConfigured,sql} from '@/lib/db';
import {demoFacilities} from '@/lib/demo';
import {listFacilities,listPlantRecords} from '@/lib/repository';
import {listEvidence} from '@/lib/evidence';

export type FacilityIntelligence={
  facilityId:string;name:string;proofScore:number;pxs:number;
  totalRecords:number;completed:number;blocked:number;needsReview:number;
  evidenceCount:number;exceptions:string[];recent:any[];
};

function clamp(n:number){return Math.max(0,Math.min(100,Math.round(n)))}

export async function facilityIntelligence(orgId:string,facility:any):Promise<FacilityIntelligence>{
  if(!databaseConfigured()){
    const d=demoFacilities.find(x=>String(x.id)===String(facility.id));
    const base=d?.pxs??82;
    return {facilityId:String(facility.id),name:facility.name,proofScore:clamp(base+3),pxs:clamp(base),totalRecords:8,completed:6,blocked:d?.openIssues||0,needsReview:d?.qaBlocks||0,evidenceCount:5,exceptions:[],recent:[]};
  }
  const records=await listPlantRecords(orgId,String(facility.id));
  const evidence=await listEvidence(orgId,String(facility.id));
  const completed=records.filter((r:any)=>r.status==='completed').length;
  const blocked=records.filter((r:any)=>r.status==='blocked').length;
  const needsReview=records.filter((r:any)=>r.status==='needs_review').length;
  const proofScore=records.length?clamp((Math.min(evidence.length,records.length)/records.length)*100):100;
  const completionRate=records.length?completed/records.length:1;
  const exceptionRate=records.length?(blocked+needsReview)/records.length:0;
  const pxs=clamp(completionRate*55+proofScore*.35+(1-exceptionRate)*10);
  const exceptions:string[]=[];
  if(blocked)exceptions.push(`${blocked} blocked work item${blocked===1?'':'s'}`);
  if(needsReview)exceptions.push(`${needsReview} item${needsReview===1?'':'s'} awaiting review`);
  if(proofScore<70)exceptions.push(`ProofScore below 70 (${proofScore})`);
  return {facilityId:String(facility.id),name:facility.name,proofScore,pxs,totalRecords:records.length,completed,blocked,needsReview,evidenceCount:evidence.length,exceptions,recent:records.slice(0,12)};
}

export async function organizationIntelligence(orgId:string){
  const facilities=await listFacilities(orgId);
  const facilityScores=await Promise.all(facilities.map((f:any)=>facilityIntelligence(orgId,f)));
  const networkPxs=facilityScores.length?clamp(facilityScores.reduce((a,b)=>a+b.pxs,0)/facilityScores.length):100;
  const networkProof=facilityScores.length?clamp(facilityScores.reduce((a,b)=>a+b.proofScore,0)/facilityScores.length):100;
  const exceptions=facilityScores.flatMap(f=>f.exceptions.map(message=>({facilityId:f.facilityId,facilityName:f.name,message})));
  return {networkPxs,networkProof,facilities:facilityScores,exceptions};
}

export async function shiftSummary(orgId:string,facilityId:string){
  const facilities=await listFacilities(orgId);
  const facility=facilities.find((f:any)=>String(f.id)===facilityId);
  if(!facility)throw new Error('facility_not_found');
  const intel=await facilityIntelligence(orgId,facility);
  const byType:Record<string,number>={};
  for(const r of intel.recent)byType[String(r.recordType||'other')]=(byType[String(r.recordType||'other')]||0)+1;
  return {facilityId,name:facility.name,pxs:intel.pxs,proofScore:intel.proofScore,exceptions:intel.exceptions,byType,recent:intel.recent.slice(0,8)};
}
