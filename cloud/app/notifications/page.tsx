import {redirect} from 'next/navigation';
import {getSession} from '@/lib/auth';
import {listRecentNotifications} from '@/lib/notifications';
import {notificationStatus} from '@/lib/services';

export default async function NotificationsPage(){
  const session=await getSession();
  if(!session)redirect('/');
  const notifications=await listRecentNotifications(session.organizationId,100);
  const service=notificationStatus();

  return <main className="content">
    <p className="eyebrow">PLANT ALERTS</p>
    <div className="top">
      <div>
        <h1>Notification Center</h1>
        <p className="muted">ShiftProof-owned alert history for sanitation, pre-op, corrective action and plant execution events.</p>
      </div>
      <a className="btn" href="/dashboard">Back to Command</a>
    </div>
    <div className="metrics">
      <div className="metric"><span>Provider</span><strong style={{fontSize:17}}>{service.provider}</strong></div>
      <div className="metric"><span>Configured</span><strong>{service.configured?'YES':'NO'}</strong></div>
      <div className="metric"><span>Recent alerts</span><strong>{notifications.length}</strong></div>
      <div className="metric"><span>Failed/retry</span><strong>{notifications.filter((n:any)=>n.status==='retry'||n.status==='dead_letter').length}</strong></div>
    </div>
    <section className="panel">
      <h2>Recent notifications</h2>
      {notifications.length===0?<p className="muted">No notifications have been generated yet.</p>:
      <table className="table"><thead><tr><th>Time</th><th>Event</th><th>Subject</th><th>Provider</th><th>Status</th></tr></thead>
      <tbody>{notifications.map((n:any)=><tr key={n.id}>
        <td>{n.createdAt?new Date(n.createdAt).toLocaleString():'—'}</td>
        <td>{n.eventType||'shiftproof.notification'}</td>
        <td><b>{n.subject}</b><div className="muted">{n.message}</div></td>
        <td>{n.provider||'—'}</td>
        <td>{n.status}</td>
      </tr>)}</tbody></table>}
    </section>
  </main>;
}
