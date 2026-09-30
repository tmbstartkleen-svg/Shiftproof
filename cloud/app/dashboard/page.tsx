import {redirect} from 'next/navigation';
import {getSession,canAdmin} from '@/lib/auth';
import {getOrganization,listFacilities,listInvitations} from '@/lib/repository';
import {liveServicesStatus} from '@/lib/services';
import {listRecentNotifications} from '@/lib/notifications';
import LogoutButton from '@/components/LogoutButton';
import InviteForm from '@/components/InviteForm';

export default async function Dashboard(){
  const s=await getSession();
  if(!s)redirect('/');

  const [org,facilities,invites,notifications]=await Promise.all([
    getOrganization(s.organizationId),
    listFacilities(s.organizationId),
    canAdmin(s.role)?listInvitations(s.organizationId):Promise.resolve([]),
    listRecentNotifications(s.organizationId,25)
  ]);

  const services=liveServicesStatus();
  const pendingInvites=invites.filter((x:any)=>x.status==='pending').length;
  const alertFailures=notifications.filter((n:any)=>n.status==='retry'||n.status==='dead_letter').length;
  const sentAlerts=notifications.filter((n:any)=>n.status==='sent').length;
  const readyChecks=[
    services.database.configured,
    services.identity.productionReady,
    services.evidence.configured,
    services.notifications.configured
  ].filter(Boolean).length;

  return <main className="commandShell">
    <aside className="eliteSide">
      <div className="brand eliteBrand">
        <div className="logo">SP</div>
        <div><b>ShiftProof ONE</b><small>PLANT COMMAND · V18</small></div>
      </div>

      <div className="commandBadge"><span className="pulseDot"/> LIVE COMMAND</div>

      <nav className="eliteNav">
        <a className="active" href="/dashboard"><span>◈</span> Enterprise Command</a>
        <a href="/notifications"><span>●</span> Notification Center</a>
        <a href="/intelligence"><span>✦</span> Plant Intelligence</a>
        <a href="/pilot"><span>✓</span> Pilot Gate</a>
        <a href="/services"><span>↯</span> Live Services</a>
        <a href="/onboarding"><span>＋</span> Onboarding</a>
        <a href="/admin"><span>⌘</span> Tenant Admin</a>
        <a href="/deployment"><span>↑</span> Deployment</a>
      </nav>

      <div className="eliteUser">
        <span className="userAvatar">{(s.name||'U').slice(0,1).toUpperCase()}</span>
        <div><b>{s.name}</b><small>{s.role}</small></div>
        <LogoutButton/>
      </div>
    </aside>

    <section className="commandMain">
      <header className="commandHero">
        <div>
          <p className="eyebrow">ENTERPRISE OPERATIONS CONTROL</p>
          <h1>{org?.name||'ShiftProof Organization'}</h1>
          <p>Sanitation-first plant execution, proof, intelligence and release control in one command surface.</p>
        </div>
        <div className="heroActions">
          <a className="btn" href="/notifications">View Alerts</a>
          {canAdmin(s.role)&&<a className="btn primary" href="/onboarding">Configure Plant</a>}
        </div>
      </header>

      <section className="statusRail">
        <div className="railItem"><span className={services.database.configured?'statusLight on':'statusLight'}/><div><small>DATABASE</small><b>{services.database.configured?'ONLINE':'OFFLINE'}</b></div></div>
        <div className="railItem"><span className={services.identity.productionReady?'statusLight on':'statusLight'}/><div><small>IDENTITY</small><b>{services.identity.productionReady?'VERIFIED':'PENDING'}</b></div></div>
        <div className="railItem"><span className={services.evidence.configured?'statusLight on':'statusLight'}/><div><small>EVIDENCE</small><b>{services.evidence.configured?'PRIVATE':'PENDING'}</b></div></div>
        <div className="railItem"><span className={services.notifications.configured?'statusLight on':'statusLight'}/><div><small>NOTIFICATIONS</small><b>{services.notifications.configured?String(services.notifications.provider).toUpperCase():'OFFLINE'}</b></div></div>
      </section>

      <section className="executiveGrid">
        <article className="executiveCard heroMetric">
          <div className="metricIcon">01</div>
          <div><span>Facilities under command</span><strong>{facilities.length}</strong><p>{facilities.length===1?'1 active plant workspace':'Enterprise network footprint'}</p></div>
        </article>
        <article className="executiveCard">
          <div className="metricIcon">02</div>
          <div><span>Release stack</span><strong>{readyChecks}/4</strong><p>Core production services online</p></div>
        </article>
        <article className="executiveCard">
          <div className="metricIcon">03</div>
          <div><span>Recent alerts sent</span><strong>{sentAlerts}</strong><p>{alertFailures?alertFailures+' need attention':'No delivery failures'}</p></div>
        </article>
        <article className="executiveCard">
          <div className="metricIcon">04</div>
          <div><span>Pending invitations</span><strong>{pendingInvites}</strong><p>{invites.length} total tenant invitations</p></div>
        </article>
      </section>

      <section className="commandSplit">
        <div className="commandPanel">
          <div className="panelHead"><div><p className="eyebrow">PLANT NETWORK</p><h2>Facility Command</h2></div><span className="livePill">{facilities.length} CONNECTED</span></div>
          <div className="facilityCommandGrid">
            {facilities.length===0?<div className="emptyCommand"><b>No facilities configured</b><p>Use onboarding to add the first plant.</p></div>:
            facilities.map((f:any)=><article className="facilityCommand" key={f.id}>
              <div className="facilityTop"><span className="plantPulse"/><small>{f.sanitationModel||f.sanitation_model||'PLANT'}</small><b>{f.code||'LIVE'}</b></div>
              <h3>{f.name}</h3>
              <p>{f.location||'Location not set'}</p>
              <div className="facilityLinks"><a href={'/floor/'+f.id}>Open Floor Command</a><a href="/intelligence">View Intelligence</a></div>
            </article>)}
          </div>
        </div>

        <aside className="commandPanel quickPanel">
          <div className="panelHead"><div><p className="eyebrow">MISSION CONTROL</p><h2>Quick Actions</h2></div></div>
          <a className="quickAction" href="/notifications"><span>01</span><div><b>Notification Center</b><small>Plant alerts, retries and delivery history</small></div><i>→</i></a>
          <a className="quickAction" href="/intelligence"><span>02</span><div><b>Plant Intelligence</b><small>ProofScore, PXS and Ask the Plant</small></div><i>→</i></a>
          <a className="quickAction" href="/pilot"><span>03</span><div><b>Release Gate</b><small>Production-readiness control surface</small></div><i>→</i></a>
          <a className="quickAction" href="/services"><span>04</span><div><b>Live Services</b><small>Database, identity, evidence and alerts</small></div><i>→</i></a>
        </aside>
      </section>

      {canAdmin(s.role)&&<section className="commandPanel invitePanel">
        <div className="panelHead"><div><p className="eyebrow">USER ACTIVATION</p><h2>Invite a Plant Leader</h2></div><span className="muted">Role-based tenant access</span></div>
        <InviteForm facilities={facilities.map((f:any)=>({id:f.id,name:f.name}))}/>
      </section>}
    </section>
  </main>;
}
