import {organizationIntelligence} from '@/lib/intelligence';

export function aiStatus(){
  const provider=process.env.SHIFTPROOF_AI_PROVIDER||'none';
  return {provider,model:process.env.SHIFTPROOF_AI_MODEL||'grounded-fallback',cloudReady:provider!=='none'&&Boolean(process.env.SHIFTPROOF_AI_API_KEY),fallback:'deterministic plant intelligence'};
}

function deterministic(question:string,intel:any){
  const q=question.toLowerCase();
  const ordered=[...intel.facilities].sort((a:any,b:any)=>a.pxs-b.pxs);
  const weakest=ordered[0],strongest=ordered[ordered.length-1];
  if(!weakest)return {answer:'No facilities are available in this organization yet.',evidence:[]};
  if(q.includes('risk')||q.includes('attention')||q.includes('problem')){
    const e=weakest.exceptions.length?weakest.exceptions.join('; '):'no active exception flags';
    return {answer:`${weakest.name} currently needs the most attention. PXS ${weakest.pxs}, ProofScore ${weakest.proofScore}. Exceptions: ${e}.`,evidence:[weakest.facilityId]};
  }
  if(q.includes('proof'))return {answer:`Network ProofScore is ${intel.networkProof}. `+intel.facilities.map((f:any)=>`${f.name}: ${f.proofScore}`).join('; ')+'.',evidence:intel.facilities.map((f:any)=>f.facilityId)};
  if(q.includes('best')||q.includes('strongest'))return {answer:`${strongest.name} has the strongest current PXS at ${strongest.pxs}, with ProofScore ${strongest.proofScore}.`,evidence:[strongest.facilityId]};
  if(q.includes('blocked')||q.includes('review')||q.includes('exception'))return {answer:intel.exceptions.length?intel.exceptions.map((e:any)=>`${e.facilityName}: ${e.message}`).join('; '):'No current exception flags were found in the available plant records.',evidence:intel.exceptions.map((e:any)=>e.facilityId)};
  return {answer:`Current network PXS is ${intel.networkPxs} and ProofScore is ${intel.networkProof}. There are ${intel.exceptions.length} active exception flag(s). Ask about risk, proof, blocked work, reviews, or strongest facility for a targeted answer.`,evidence:intel.facilities.map((f:any)=>f.facilityId)};
}

export async function askPlant(question:string,organizationId:string){
  const intel=await organizationIntelligence(organizationId);
  const status=aiStatus();
  const fallback=deterministic(question,intel);
  if(!status.cloudReady)return {provider:'grounded-fallback',...fallback,intelligence:{networkPxs:intel.networkPxs,networkProof:intel.networkProof}};
  const base=process.env.SHIFTPROOF_AI_BASE_URL||'https://api.openai.com/v1';
  const response=await fetch(`${base.replace(/\/$/,'')}/chat/completions`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${process.env.SHIFTPROOF_AI_API_KEY}`},body:JSON.stringify({model:process.env.SHIFTPROOF_AI_MODEL,temperature:.1,messages:[{role:'system',content:'You are ShiftProof Shift Commander. Answer only from the supplied organization intelligence JSON. State uncertainty. Never invent plant facts. Cite facility IDs in brackets when material.'},{role:'user',content:JSON.stringify({question,intelligence:intel})}]})});
  if(!response.ok)return {provider:'grounded-fallback',...fallback,warning:`cloud provider returned ${response.status}`};
  const json=await response.json();
  return {provider:status.provider,answer:json.choices?.[0]?.message?.content||fallback.answer,evidence:intel.facilities.map((f:any)=>f.facilityId),intelligence:{networkPxs:intel.networkPxs,networkProof:intel.networkProof}};
}
