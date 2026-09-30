import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import postgres from 'postgres';

async function main(){
  const url=process.env.DATABASE_URL;
  if(!url) throw new Error('DATABASE_URL is required');

  const sql=postgres(url,{ssl:'require',max:1});

  try{
    const root=path.resolve(process.cwd(),'db');
    const files=[
      path.join(root,'schema.sql'),
      ...fs.readdirSync(path.join(root,'migrations'))
        .filter(x=>x.endsWith('.sql'))
        .sort()
        .map(x=>path.join(root,'migrations',x))
    ];

    await sql.unsafe("create table if not exists schema_migrations(version text primary key, checksum text, applied_at timestamptz not null default now())");
    await sql.unsafe("alter table schema_migrations add column if not exists checksum text");

    for(const file of files){
      const version=path.relative(root,file).replaceAll('\\','/');
      const body=fs.readFileSync(file,'utf8');
      const checksum=crypto.createHash('sha256').update(body).digest('hex');
      const [existing]=await sql`select version,checksum from schema_migrations where version=${version} limit 1`;

      if(existing?.checksum){
        if(existing.checksum!==checksum) throw new Error(`Migration drift detected for ${version}`);
        console.log('Skipping',version,'(already applied)');
        continue;
      }

      console.log('Applying',version);
      await sql.begin(async tx=>{
        await tx.unsafe(body);
        await tx`insert into schema_migrations(version,checksum) values(${version},${checksum})
          on conflict(version) do update set checksum=excluded.checksum,applied_at=now()`;
      });
    }

    console.log('ShiftProof migrations complete with checksum verification');
  } finally {
    await sql.end();
  }
}

main().catch(error=>{
  console.error(error);
  process.exit(1);
});
