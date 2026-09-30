import 'server-only';
import {createNeonAuth} from '@neondatabase/auth/next/server';

export function neonAuthConfigured(){
  return Boolean(process.env.NEON_AUTH_BASE_URL);
}

export const neonAuth=createNeonAuth({
  baseUrl:process.env.NEON_AUTH_BASE_URL||'http://localhost:3000/api/auth',
  cookies:{
    secret:process.env.NEON_AUTH_COOKIE_SECRET||process.env.SHIFTPROOF_SESSION_SECRET||'shiftproof-preview-only-change-before-production'
  }
});
