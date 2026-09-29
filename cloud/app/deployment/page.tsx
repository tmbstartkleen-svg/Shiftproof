import Link from 'next/link';
import { deploymentReadiness } from '@/lib/readiness';

export const dynamic = 'force-dynamic';

export default function DeploymentPage() {
  const r = deploymentReadiness();
  const rows = [
    ['Preview ready', r.previewReady],
    ['Production ready', r.productionReady],
    ['Managed database', r.checks.database],
    ['Production identity', r.checks.productionIdentity],
    ['Strong session secret', r.checks.sessionSecret],
    ['HTTPS base URL', r.checks.secureBaseUrl],
  ] as const;
  return <main className="deployPage">
    <div className="deployHero">
      <p className="eyebrow">DEPLOYMENT CONTROL</p>
      <h1>ShiftProof ONE v11</h1>
      <p>Build, preview, smoke-test, inspect, then promote the exact same artifact.</p>
      <div className="deployMeta"><span>{r.environment}</span><span>{r.commit.slice(0, 10)}</span></div>
    </div>
    <section className="deployGrid">
      {rows.map(([label, ok]) => <article key={label} className="deployCard"><span>{label}</span><strong className={ok ? 'ready' : 'pending'}>{ok ? 'READY' : 'PENDING'}</strong></article>)}
    </section>
    <section className="deployPanel">
      <h2>Test endpoints</h2>
      <p><code>/api/health</code> - app health and activation capabilities</p>
      <p><code>/api/readiness</code> - preview and production readiness gates</p>
      <p><code>/api/auth/login</code> - authenticated preview login smoke test</p>
      <p><code>/api/auth/me</code> - signed-session verification</p>
    </section>
    <div className="deployActions"><Link href="/">Home</Link><Link href="/dashboard">Dashboard</Link><Link href="/admin">Admin</Link></div>
  </main>;
}
