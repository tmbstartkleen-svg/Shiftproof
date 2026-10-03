import Link from 'next/link';
import {redirect} from 'next/navigation';
import {canAdmin,getSession} from '@/lib/auth';
import {pilotHardeningStatus} from '@/lib/pilot';
import ReleaseActions from '@/components/ReleaseActions';

export const dynamic='force-dynamic';

export default async function PilotPage(){
  const s=await getSession();
  if(!s)redirect('/');
  if(!canAdmin(s.role))redirect('/dashboard');
  const x=await pilotHardeningStatus(s.organizationId);

  return <main className="deployPage">
    <div className="deployHero">
      <p className="eyebrow">CONTROLLED PILOT / RELEASE GATE</p>
      <h1>ShiftProof ONE v18</h1>
      <p>Final foundation gate across tenant security, evidence, identity, recovery, notifications, and release environment.</p>
      <div className="deployMeta"><span>{x.score}% ready</span><span>{x.passed}/{x.total} checks</span></div>
    </div>

    <section className="releaseStateBanner">
      <div><small>CONTROLLED PILOT</small><b className={x.controlledPilotReady?'ready':'pending'}>{x.controlledPilotReady?'READY':'PENDING'}</b></div>
      <div><small>COMMERCIAL RELEASE</small><b className={x.commercialReleaseReady?'ready':'pending'}>{x.commercialReleaseReady?'READY':'PENDING'}</b></div>
      <div><small>RECOVERY DRILL</small><b className={x.recoveryDrill?.status==='passed'?'ready':'pending'}>{x.recoveryDrill?.status==='passed'?'PASSED':'NOT RUN'}</b></div>
    </section>

    <section className="deployGrid">
      {Object.entries(x.checks).map(([n,ok])=><article className="deployCard" key={n}><span>{n}</span><strong className={ok?'ready':'pending'}>{ok?'READY':'PENDING'}</strong></article>)}
    </section>

    <ReleaseActions/>

    <section className="deployPanel">
      <h2>Recovery verification</h2>
      <p>Last application-level drill: <code>{x.recoveryDrill?String(x.recoveryDrill.createdAt):'none recorded'}</code></p>
      <p>Status: <code>{x.recoveryDrill?String(x.recoveryDrill.status):'not run'}</code></p>
      <p className="muted">This gate validates ShiftProof backup structure only; it does not claim a physical managed-Postgres restore has occurred.</p>
    </section>

    <section className="deployPanel">
      <h2>Release state</h2>
      <p><b>Controlled pilot:</b> {x.controlledPilotReady?'READY':'PENDING'}</p>
      <p><b>Commercial release:</b> {x.commercialReleaseReady?'READY':'PENDING'}</p>
      <p><a href="/api/audit/export">Audit CSV</a> · <a href="/api/admin/backup/export">Application backup</a></p>
    </section>

    <div className="deployActions"><Link href="/dashboard">Dashboard</Link><Link href="/services">Live Services</Link><Link href="/deployment">Deployment</Link><Link href="/notifications">Notifications</Link></div>
  </main>;
}
