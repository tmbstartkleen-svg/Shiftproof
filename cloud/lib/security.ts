function normalizedOrigin(value:string){try{return new URL(value).origin}catch{return ''}}

export function mutationOriginAllowed(req:Request){
  const origin=req.headers.get('origin');
  const fetchSite=req.headers.get('sec-fetch-site');
  if(fetchSite==='cross-site') return false;
  if(!origin) return true;
  const requestOrigin=new URL(req.url).origin;
  const configured=process.env.SHIFTPROOF_BASE_URL ? normalizedOrigin(process.env.SHIFTPROOF_BASE_URL) : '';
  return origin===requestOrigin || Boolean(configured && origin===configured);
}

export function assertTrustedMutation(req:Request){
  if(!mutationOriginAllowed(req)) throw new Error('untrusted_origin');
}
