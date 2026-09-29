'use client';

import {useCallback,useEffect,useMemo,useState} from 'react';

type QueueItem={
  id:string;
  kind:'record'|'evidence';
  createdAt:number;
  facilityId:string;
  payload?:{recordType:string;status:string;title:string;data:Record<string,unknown>};
  file?:Blob;
  fileName?:string;
  fileType?:string;
};

const DB_NAME='shiftproof-floor-v16';
const STORE='outbox';

function requestToPromise<T>(request:IDBRequest<T>){return new Promise<T>((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function db(){
  return await new Promise<IDBDatabase>((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'id'})};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function put(item:QueueItem){const d=await db();const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).put(item);await new Promise<void>((r,j)=>{tx.oncomplete=()=>r();tx.onerror=()=>j(tx.error)});d.close()}
async function remove(id:string){const d=await db();const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);await new Promise<void>((r,j)=>{tx.oncomplete=()=>r();tx.onerror=()=>j(tx.error)});d.close()}
async function all():Promise<QueueItem[]>{const d=await db();const tx=d.transaction(STORE,'readonly');const rows=await requestToPromise(tx.objectStore(STORE).getAll()) as QueueItem[];d.close();return rows.sort((a,b)=>a.createdAt-b.createdAt)}

async function sendRecord(item:QueueItem){
  const r=await fetch(`/api/facilities/${item.facilityId}/records`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(item.payload)});
  if(!r.ok)throw new Error((await r.json().catch(()=>({}))).error||'record sync failed');
}
async function sendEvidence(item:QueueItem){
  if(!item.file)throw new Error('queued evidence file missing');
  const form=new FormData();
  form.append('file',new File([item.file],item.fileName||'floor-proof', {type:item.fileType||item.file.type}));
  const r=await fetch(`/api/facilities/${item.facilityId}/evidence`,{method:'POST',body:form});
  if(!r.ok)throw new Error((await r.json().catch(()=>({}))).error||'evidence sync failed');
}

export default function FloorConsole({facilityId,facilityName,userName,role}:{facilityId:string;facilityName:string;userName:string;role:string}){
  const [online,setOnline]=useState(true);
  const [queueCount,setQueueCount]=useState(0);
  const [syncing,setSyncing]=useState(false);
  const [message,setMessage]=useState('');
  const [recordType,setRecordType]=useState('sanitation');
  const [status,setStatus]=useState('in_progress');
  const [title,setTitle]=useState('');
  const [notes,setNotes]=useState('');
  const [area,setArea]=useState('');
  const [proof,setProof]=useState<File|null>(null);
  const [recent,setRecent]=useState<any[]>([]);

  const refreshQueue=useCallback(async()=>{try{setQueueCount((await all()).length)}catch{}},[]);
  const refreshRecent=useCallback(async()=>{if(!navigator.onLine)return;try{const r=await fetch(`/api/facilities/${facilityId}/records`,{cache:'no-store'});if(r.ok){const j=await r.json();setRecent((j.records||[]).slice(0,8))}}catch{}},[facilityId]);

  const flush=useCallback(async()=>{
    if(!navigator.onLine||syncing)return;
    setSyncing(true);
    let synced=0;
    try{
      for(const item of await all()){
        try{
          if(item.kind==='record')await sendRecord(item);else await sendEvidence(item);
          await remove(item.id);synced++;
        }catch{break}
      }
      if(synced)setMessage(`Synced ${synced} queued item${synced===1?'':'s'}.`);
    }finally{setSyncing(false);await refreshQueue();await refreshRecent()}
  },[refreshQueue,refreshRecent,syncing]);

  useEffect(()=>{
    setOnline(navigator.onLine);
    refreshQueue();refreshRecent();
    const on=()=>{setOnline(true);void flush()};
    const off=()=>setOnline(false);
    window.addEventListener('online',on);window.addEventListener('offline',off);
    return()=>{window.removeEventListener('online',on);window.removeEventListener('offline',off)};
  },[flush,refreshQueue,refreshRecent]);

  const canSubmit=useMemo(()=>title.trim().length>0,[title]);

  async function saveWork(){
    if(!canSubmit)return;
    setMessage('');
    const record:QueueItem={
      id:crypto.randomUUID(),kind:'record',createdAt:Date.now(),facilityId,
      payload:{recordType,status,title:title.trim(),data:{notes:notes.trim(),area:area.trim(),source:'floor-console-v16'}}
    };
    let queued=false;
    if(navigator.onLine){
      try{await sendRecord(record)}catch{await put(record);queued=true}
    }else{await put(record);queued=true}
    if(proof){
      const evidence:QueueItem={id:crypto.randomUUID(),kind:'evidence',createdAt:Date.now()+1,facilityId,file:proof,fileName:proof.name,fileType:proof.type};
      if(navigator.onLine&&!queued){try{await sendEvidence(evidence)}catch{await put(evidence);queued=true}}else{await put(evidence);queued=true}
    }
    setTitle('');setNotes('');setArea('');setProof(null);
    setMessage(queued?'Saved safely on this device. It will sync automatically when online.':'Saved and synced to ShiftProof.');
    await refreshQueue();await refreshRecent();
  }

  return <main className="floorShell">
    <header className="floorTop">
      <div><p className="eyebrow">FACILITY COMMAND · V16</p><h1>{facilityName}</h1><p className="muted">{userName} · {role}</p></div>
      <div className={online?'net online':'net offline'}><span></span>{online?'ONLINE':'OFFLINE'}{queueCount>0&&<b>{queueCount} queued</b>}</div>
    </header>

    <section className="floorGrid">
      <article className="floorAction">
        <div className="floorSectionHead"><div><p className="eyebrow">CAPTURE WORK</p><h2>Log what is happening now</h2></div><button className="btn" onClick={()=>void flush()} disabled={!online||syncing||queueCount===0}>{syncing?'Syncing…':'Sync now'}</button></div>
        <div className="floorTypeGrid">
          {['production','changeover','maintenance','sanitation','preop','quality'].map(x=><button key={x} className={recordType===x?'floorType active':'floorType'} onClick={()=>setRecordType(x)}>{x}</button>)}
        </div>
        <div className="floorForm">
          <label>Area / line<input value={area} onChange={e=>setArea(e.target.value)} placeholder="Line 103, Spiral, Packoff…"/></label>
          <label>Status<select value={status} onChange={e=>setStatus(e.target.value)}><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="completed">Completed</option><option value="needs_review">Needs review</option></select></label>
          <label className="wide">What happened?<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Example: Foamer completed on Line 103"/></label>
          <label className="wide">Notes<textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="Anything the next department or supervisor needs to know"/></label>
          <label className="proofPick wide"><span>Photo / video proof</span><input type="file" accept="image/*,video/*" capture="environment" onChange={e=>setProof(e.target.files?.[0]||null)}/><b>{proof?proof.name:'Tap to capture or choose proof'}</b></label>
        </div>
        <button className="floorSubmit" disabled={!canSubmit} onClick={()=>void saveWork()}>SAVE WORK + PROOF</button>
        {message&&<p className="floorMessage">{message}</p>}
      </article>

      <aside className="floorRecent">
        <p className="eyebrow">SHIFT MEMORY</p><h2>Latest plant events</h2>
        <div className="recentList">{recent.length?recent.map(r=><article key={r.id}><div><b>{r.title}</b><small>{String(r.recordType||'work').toUpperCase()} · {String(r.status||'')}</small></div><span>{r.data?.area||''}</span></article>):<p className="muted">No recent events loaded.</p>}</div>
        <div className="offlineCard"><b>Offline-safe</b><p>Work and proof are stored on this device first when the network drops, then synced automatically in order when connection returns.</p><strong>{queueCount} waiting to sync</strong></div>
      </aside>
    </section>
  </main>
}
