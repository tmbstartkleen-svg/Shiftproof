'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';

type Result={ok?:boolean;status?:string;error?:string};

export default function ReleaseActions(){
  const router=useRouter();
  const [busy,setBusy]=useState<'notification'|'recovery'|null>(null);
  const [message,setMessage]=useState('Ready to run final production validation.');

  async function run(kind:'notification'|'recovery'){
    setBusy(kind);
    setMessage(kind==='notification'?'Sending in-app production test…':'Running application recovery validation…');
    try{
      const endpoint=kind==='notification'?'/api/notifications/test':'/api/admin/recovery/drill';
      const response=await fetch(endpoint,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:kind==='notification'
          ?JSON.stringify({subject:'ShiftProof production validation',message:'ShiftProof in-app notification provider passed a live production test.'})
          :JSON.stringify({})
      });
      const data:Result=await response.json().catch(()=>({error:'Invalid server response'}));
      if(!response.ok||data.ok===false){
        setMessage('Validation failed: '+(data.error||data.status||response.statusText));
      }else{
        setMessage(kind==='notification'?'Notification test passed and was recorded.':'Recovery drill passed and was recorded.');
        router.refresh();
      }
    }catch(error){
      setMessage('Validation failed: '+(error instanceof Error?error.message:'Unknown error'));
    }finally{
      setBusy(null);
    }
  }

  return <section className="releaseConsole">
    <div className="releaseConsoleHead">
      <div><p className="eyebrow">FINAL VALIDATION CONSOLE</p><h2>Production Activation</h2></div>
      <span className="livePill">ADMIN CONTROL</span>
    </div>
    <p className="muted">Run the two remaining live checks from the browser. Each action is authenticated and recorded in ShiftProof.</p>
    <div className="releaseActionGrid">
      <button className="releaseActionButton" disabled={Boolean(busy)} onClick={()=>run('notification')}>
        <span>01</span>
        <div><b>{busy==='notification'?'Testing notification…':'Test Notification Provider'}</b><small>Create a real in-app production notification and audit event.</small></div>
      </button>
      <button className="releaseActionButton" disabled={Boolean(busy)} onClick={()=>run('recovery')}>
        <span>02</span>
        <div><b>{busy==='recovery'?'Running recovery drill…':'Run Recovery Drill'}</b><small>Validate application backup structure and record the release-gate result.</small></div>
      </button>
    </div>
    <div className="releaseResult">{message}</div>
  </section>;
}
