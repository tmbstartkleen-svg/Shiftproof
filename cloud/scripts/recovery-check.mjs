#!/usr/bin/env node
const base=(process.env.BASE_URL||'').replace(/\/$/,'');if(!base){console.error('BASE_URL is required.');process.exit(2)}for(const path of ['/api/health','/api/readiness','/api/deployment/status']){const res=await fetch(base+path,{redirect:'follow'});console.log(`${path} -> ${res.status}`);if(!res.ok)process.exit(1)}console.log('RECOVERY_PUBLIC_CHECK_OK');
