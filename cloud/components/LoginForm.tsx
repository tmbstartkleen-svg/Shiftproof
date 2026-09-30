'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {authClient} from '@/lib/neon-auth-client';

export default function LoginForm({demoAuth}:{demoAuth:boolean}){
  const r=useRouter();
  const [email,setEmail]=useState(demoAuth?'plantmanager@demo.local':'');
  const [password,setPassword]=useState(demoAuth?'1111':'');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);

  async function submit(e:React.FormEvent){
    e.preventDefault();
    setBusy(true);
    setError('');

    if(demoAuth){
      const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
      const j=await res.json();
      setBusy(false);
      if(!res.ok){setError(j.error||'Sign in failed');return}
      r.push('/dashboard');
      r.refresh();
      return;
    }

    try{
      const result=await authClient.signIn.email({email,password});
      const authError=(result as any)?.error;
      if(authError){
        setError(authError.message||'Sign in failed');
        setBusy(false);
        return;
      }
      r.push('/dashboard');
      r.refresh();
    }catch{
      setError('Sign in failed');
      setBusy(false);
    }
  }

  return <form onSubmit={submit}>
    <label className="field">Email<input value={email} onChange={e=>setEmail(e.target.value)} type="email" required/></label>
    <label className="field">Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" required/></label>
    <button className="btn primary" disabled={busy} style={{width:'100%'}}>{busy?'Signing in...':'Enter ShiftProof'}</button>
    {error&&<p className="error">{error}</p>}
    <p className="muted" style={{fontSize:11}}>{demoAuth?'Demo: plantmanager@demo.local / 1111':'Production identity powered by Neon Auth'}</p>
  </form>
}
