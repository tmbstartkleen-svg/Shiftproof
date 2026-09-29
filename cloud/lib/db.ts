import 'server-only';
import postgres from 'postgres';
let client:ReturnType<typeof postgres>|null=null;
export function databaseConfigured(){return Boolean(process.env.DATABASE_URL)}
export function sql(){if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is not configured');if(!client)client=postgres(process.env.DATABASE_URL,{ssl:'require',max:5,idle_timeout:20});return client}
export function databaseStatus(){return {configured:databaseConfigured(),mode:databaseConfigured()?'managed-postgres':'demo-fallback'}}
