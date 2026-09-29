import { demoFacilities, tenant } from "@/lib/demo";
import { databaseStatus } from "@/lib/db";
import { storageStatus } from "@/lib/storage";
import { notificationStatus } from "@/lib/notifications";
import { aiStatus } from "@/lib/ai";

function statusClass(value: number) {
  if (value >= 95) return "good";
  if (value >= 80) return "watch";
  return "risk";
}

export default function Home() {
  const networkPxs = Math.round(demoFacilities.reduce((sum, f) => sum + f.pxs, 0) / demoFacilities.length);
  const db = databaseStatus();
  const storage = storageStatus();
  const notifications = notificationStatus();
  const ai = aiStatus();
  return (
    <main>
      <aside>
        <div className="brand"><div className="logo">SP</div><div><strong>ShiftProof ONE</strong><small>CLOUD · V7</small></div></div>
        <nav>{["Enterprise Command","Plants","Production","Sanitation","Quality","Maintenance","Proof Ledger","Integrations","Admin"].map((x,i)=><button key={x} className={i===0?"active":""}>{x}</button>)}</nav>
        <div className="tenant"><small>ORGANIZATION</small><strong>{tenant.name}</strong><span>{tenant.subscription}</span></div>
      </aside>
      <section className="content">
        <header><div><p className="eyebrow">ENTERPRISE NETWORK</p><h1>Enterprise Command</h1><p>One operating layer across production, sanitation, quality and maintenance.</p></div><button className="primary">+ Add Facility</button></header>
        <div className="metrics">
          <article><span>Network PXS</span><strong>{networkPxs}</strong><small>3 active facilities</small></article>
          <article><span>Onboarding</span><strong>{tenant.onboarding}%</strong><small>Cloud migration readiness</small></article>
          <article><span>Users</span><strong>{tenant.users}</strong><small>Multi-role tenant model</small></article>
          <article><span>Integrations</span><strong>{tenant.integrations}</strong><small>ERP · CMMS · QA · HRIS</small></article>
        </div>
        <div className="grid">
          {demoFacilities.map((f)=><article className="plant" key={f.id}>
            <div className="plantHead"><div><small>{f.model.toUpperCase()}</small><h2>{f.name}</h2><p>{f.location}</p></div><div className={`score ${statusClass(f.pxs)}`}>{f.pxs}</div></div>
            <dl><div><dt>OEE</dt><dd>{f.oee}%</dd></div><div><dt>Attainment</dt><dd>{f.attainment}%</dd></div><div><dt>QA blocks</dt><dd>{f.qaBlocks}</dd></div><div><dt>Sanitation ETA</dt><dd>{f.sanitationMinutes}m</dd></div><div><dt>Open issues</dt><dd>{f.openIssues}</dd></div></dl>
            <button>Open plant →</button>
          </article>)}
        </div>
        <div className="lower">
          <article className="panel"><p className="eyebrow">CLOUD READINESS</p><h2>Commercial architecture status</h2>
            <div className="statusRow"><span>Database</span><b>{db.configured?"Postgres configured":"Demo adapter"}</b></div>
            <div className="statusRow"><span>Evidence storage</span><b>{storage.provider}</b></div>
            <div className="statusRow"><span>Notifications</span><b>{notifications.ready?"Provider connected":"Adapter ready"}</b></div>
            <div className="statusRow"><span>Shift Commander AI</span><b>{ai.cloudReady?ai.model:"Grounded fallback"}</b></div>
          </article>
          <article className="panel"><p className="eyebrow">ONBOARDING</p><h2>Enterprise activation</h2>
            {["Organization created","Facility hierarchy imported","Roles mapped","Production lines mapped","Sanitation AOR loaded","ERP integration","Cloud evidence storage"].map((x,i)=><div className="check" key={x}><i className={i<5?"done":""}></i><span>{x}</span></div>)}
          </article>
        </div>
      </section>
    </main>
  );
}