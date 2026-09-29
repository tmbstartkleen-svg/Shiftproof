import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getOrganization, listFacilities, listInvitations, repositoryMode } from "@/lib/repository";
import { identityStatus } from "@/lib/identity";

export default async function AdminPage(){
  const s=await getSession(); if(!s) redirect("/");
  if(!["Plant Manager","Administrator","Owner"].includes(s.role)) redirect("/dashboard");
  const [org,facilities,invites]=await Promise.all([getOrganization(s.organizationId),listFacilities(s.organizationId),listInvitations(s.organizationId)]);
  const identity=identityStatus();
  return <main style={{padding:32,maxWidth:1200,margin:"0 auto"}}>
    <p><Link href="/dashboard">← Enterprise Command</Link></p>
    <h1>Tenant Administration</h1>
    <p>Organization, facilities, user invitations, and production identity readiness.</p>
    <div className="metrics"><article><span>Organization</span><strong>{org?.name||"Unknown"}</strong><small>{org?.slug||s.organizationId}</small></article><article><span>Repository</span><strong>{repositoryMode().toUpperCase()}</strong><small>{repositoryMode()==="postgres"?"Persistent cloud data":"Demo fallback"}</small></article><article><span>Identity</span><strong>{identity.provider.toUpperCase()}</strong><small>{identity.configured?"Configured":"Needs configuration"}</small></article><article><span>Facilities</span><strong>{facilities.length}</strong><small>Visible tenant facilities</small></article></div>
    <div className="lower"><article className="panel"><h2>Facilities</h2>{facilities.map(f=><div className="statusRow" key={f.id}><span>{f.name}<small style={{display:"block"}}>{f.location}</small></span><b>{f.model}</b></div>)}</article><article className="panel"><h2>Invitations</h2>{invites.length?invites.map((i:any)=><div className="statusRow" key={i.id}><span>{i.email}<small style={{display:"block"}}>{i.role}</small></span><b>{i.status}</b></div>):<p>No persistent invitations yet.</p>}</article></div>
    <article className="panel full"><h2>Admin APIs</h2><p>Persistent tenant setup is exposed through authenticated admin endpoints:</p><code>/api/admin/facilities</code><br/><code>/api/admin/invitations</code><p>These routes require Postgres and an administrator role.</p></article>
  </main>
}