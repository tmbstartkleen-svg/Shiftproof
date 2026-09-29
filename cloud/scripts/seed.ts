import postgres from 'postgres';
const url=process.env.DATABASE_URL;if(!url)throw new Error('DATABASE_URL is required');const sql=postgres(url,{ssl:'require',max:1});
const [user]=await sql`insert into users(email,name,identity_provider,external_subject) values('plantmanager@demo.local','Morgan Reed','seed','seed_pm') on conflict(email) do update set name=excluded.name returning id`;
const [org]=await sql`insert into organizations(name,slug) values('Summit Foods Network','summit-foods') on conflict(slug) do update set name=excluded.name returning id`;
await sql`insert into memberships(organization_id,user_id,role,status) values(${org.id},${user.id},'Owner','active') on conflict do nothing`;
const plants=[['Central Plant','SFC-01','Midwest','Contract'],['North Plant','SFN-02','North','Hybrid'],['South Plant','SFS-03','South','In-house']];for(const p of plants){const [f]=await sql`insert into facilities(organization_id,name,code,location,sanitation_model) values(${org.id},${p[0]},${p[1]},${p[2]},${p[3]}) returning id`;await sql`insert into facility_memberships(facility_id,user_id,access_level) values(${f.id},${user.id},'Plant Manager') on conflict do nothing`;}
await sql.end();console.log('ShiftProof seed complete');
