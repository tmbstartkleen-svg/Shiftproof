import Link from 'next/link';
import { deploymentReadiness } from '@/lib/readiness';
import { deploymentControlStatus } from '@/lib/deploy';

export const dynamic = 'force-dynamic';

export default function DeploymentPage() {
  const r = deploymentReadiness();
  const d = deploymentControlStatus();
  const rows = [
    ['Preview application ready', r.previewReady],
    ['Vercel project linked', d.configured.vercelProject],
    ['Managed database', r.checks.database],
    ['Production identity', r.checks.productionIdentity],
    ['Strong session secret', r.checks.sessionSecret],
    ['HTTPS base URL', r.checks.secureBaseUrl],
    ['Production ready', r.productionReady],
  ] as const;
  return <main className="deployPage">
    <div className="deployHero">
      <p className="eyebrow">DEPLOYMENT CONTROL</p>
      <h1>ShiftProof ONE v12</h1>
      <p>Validate → build → preview deploy → smoke test → inspect → promote the exact artifact.</p>
      <div className="deployMeta"><span>{d.environment}</span><span>{d.commit.slice(0, 10)}</span></div>
    </div>
    <section className="deployGrid">
      {rows.map(([label, ok]) => <article key={label} className="deployCard"><span>{label}</span><strong className={ok ? 'ready' : 'pending'}>{ok ? 'READY' : 'PENDING'}</strong></article>)}
    </section>
    <section className="deployPanel">
      <h2>v12 deployment contract</h2>
      <p><b>GitHub secret:</b> <code>VERCEL_TOKEN</code></p>
      <p><b>Optional GitHub variables:</b> <code>VERCEL_SCOPE</code>, <code>VERCEL_PROJECT_NAME</code></p>
      <p><b>Vercel project:</b> <code>shiftproof-one</code> under <code>tblevins-1457s-projects</code></p><p><b>Vercel project root:</b> <code>cloud</code></p>
      <p><b>Preview trigger:</b> push any <code>preview/**</code> branch.</p>
    </section>
    <section className="deployPanel">
      <h2>Live test endpoints</h2>
      <p><code>/api/health</code> — runtime health and capabilities</p>
      <p><code>/api/readiness</code> — preview/production readiness gate</p>
      <p><code>/api/deployment/status</code> — deploy metadata without exposing secrets</p>
      <p><code>/api/auth/login</code> + <code>/api/auth/me</code> — signed-session smoke path</p>
    </section>
    <div className="deployActions"><Link href="/">Home</Link><Link href="/dashboard">Dashboard</Link><Link href="/admin">Admin</Link></div>
  </main>;
}
