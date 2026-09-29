import fs from 'node:fs';import path from 'node:path';import postgres from 'postgres';
const url=process.env.DATABASE_URL;if(!url)throw new Error('DATABASE_URL is required');const sql=postgres(url,{ssl:'require',max:1});
const root=path.resolve(process.cwd(),'db');const files=[path.join(root,'schema.sql'),...fs.readdirSync(path.join(root,'migrations')).filter(x=>x.endsWith('.sql')).sort().map(x=>path.join(root,'migrations',x))];
for(const file of files){const name=path.basename(file);console.log('Applying',name);await sql.unsafe(fs.readFileSync(file,'utf8'));}await sql.end();console.log('ShiftProof migrations complete');
