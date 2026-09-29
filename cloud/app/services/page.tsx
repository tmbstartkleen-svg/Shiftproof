import { redirect } from 'next/navigation';
import { getSession, canAdmin } from '@/lib/auth';
import { liveServicesStatus } from '@/lib/services';

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const session = await getSession();
  if (!session) redirect('/');
  if (!canAdmin(session.role)) redirect('/dashboard');
  const s = liveServicesStatus();
  const rows = [
    ['Managed Postgres', s.database.configured, s.database.mode],
    ['Private evidence storage', s.evidence.configured, s.evidence.provider],
    ['Production identity', s.identity.productionReady, s.identity.mode],
    ['Notification provider', s.notifications.configured, s.notifications.provider],
    ['Pilot services ready', s.pilotReady, 'database + evidence'],
    ['Production services ready', s.productionReady, 'database + evidence + identity + session secret'],
  ] as const;
  return <main className="content">
    <p className="eyebrow">LIVE SERVICES</p>
    <h1>ShiftProof ONE v13 service activation</h1>
    <p className="muted">Production dependencies are visible here without exposing credentials.</p>
    <div className="metrics">
      {rows.map(([name, ok, detail]) => <div className="metric" key={name}><span>{name}</span><strong>{ok ? 'READY' : 'PENDING'}</strong><small>{detail}</small></div>)}
    </div>
    <section className="panel">
      <h2>Activation order</h2>
      <ol>
        <li>Attach Postgres and set <code>DATABASE_URL</code>.</li>
        <li>Run <code>npm run db:migrate</code> and <code>npm run db:seed</code>.</li>
        <li>Attach a private Vercel Blob store.</li>
        <li>Configure the production identity provider and disable demo auth.</li>
        <li>Configure the notification webhook/provider.</li>
        <li>Deploy preview, run smoke/release checks, then promote the exact artifact.</li>
      </ol>
    </section>
    <p><a className="btn" href="/dashboard">← Dashboard</a> <a className="btn" href="/deployment">Deployment</a></p>
  </main>;
}
