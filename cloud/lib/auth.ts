import 'server-only';
import crypto from 'node:crypto';
import {cookies} from 'next/headers';
export type Session={userId:string;email:string;name:string;role:string;organizationId:string;facilityIds:string[];exp:number};
const COOKIE='sp_cloud_session',TTL=60*60*12;
function secret(){return process.env.SHIFTPROOF_SESSION_SECRET||'shiftproof-preview-only-change-before-production'}
function sign(v:string){return crypto.createHmac('sha256',secret()).update(v).digest('base64url')}
export function createSessionToken(s:Omit<Session,'exp'>){const body={...s,exp:Math.floor(Date.now()/1000)+TTL};const p=Buffer.from(JSON.stringify(body)).toString('base64url');return `${p}.${sign(p)}`}
export function verifySessionToken(token?:string|null):Session|null{if(!token)return null;const [p,s]=token.split('.');if(!p||!s)return null;const e=sign(p);if(s.length!==e.length||!crypto.timingSafeEqual(Buffer.from(s),Buffer.from(e)))return null;try{const body=JSON.parse(Buffer.from(p,'base64url').toString()) as Session;return body.exp>Math.floor(Date.now()/1000)?body:null}catch{return null}}
export async function getSession(){const c=await cookies();return verifySessionToken(c.get(COOKIE)?.value)}
export function sessionCookie(token:string){return {name:COOKIE,value:token,httpOnly:true,sameSite:'lax' as const,secure:process.env.NODE_ENV==='production',path:'/',maxAge:TTL}}
export function clearSessionCookie(){return {name:COOKIE,value:'',path:'/',maxAge:0}}
export function demoAuthEnabled(){return process.env.SHIFTPROOF_DEMO_AUTH!=='false'}
export function validateDemoCredentials(email:string,password:string){if(!demoAuthEnabled())return null;const ee=process.env.SHIFTPROOF_DEMO_EMAIL||'plantmanager@demo.local',ep=process.env.SHIFTPROOF_DEMO_PASSWORD||'1111';const a=Buffer.from(password),b=Buffer.from(ep);if(email.trim().toLowerCase()!==ee.toLowerCase()||a.length!==b.length||!crypto.timingSafeEqual(a,b))return null;return {userId:'u_pm',email:ee,name:'Morgan Reed',role:'Plant Manager',organizationId:'org_demo',facilityIds:['central','north','south']}}
export function canAdmin(role:string){return ['Plant Manager','Organization Admin','Owner'].includes(role)}
