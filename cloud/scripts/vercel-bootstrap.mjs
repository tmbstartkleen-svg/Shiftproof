#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const team = process.env.VERCEL_TEAM_SLUG || 'tblevins-1457s-projects';
const project = process.env.VERCEL_PROJECT_NAME || 'shiftproof-one';
const token = process.env.VERCEL_TOKEN || '';
const cli = process.env.VERCEL_CLI_VERSION || '59.19.1';

const commands = [
  ['npx', [`vercel@${cli}`, 'project', 'add', project, '--scope', team]],
  ['npx', [`vercel@${cli}`, 'link', '--yes', '--project', project, '--scope', team]],
];

console.log(`ShiftProof Vercel bootstrap\nTeam: ${team}\nProject: ${project}`);
if (!apply) {
  console.log('\nDry run only. Set VERCEL_TOKEN and run: npm run vercel:bootstrap -- --apply');
  for (const [cmd, rest] of commands) console.log('$', cmd, ...rest, '--token=$VERCEL_TOKEN');
  process.exit(0);
}
if (!token) {
  console.error('VERCEL_TOKEN is required for --apply.');
  process.exit(2);
}
for (const [cmd, rest] of commands) {
  const result = spawnSync(cmd, [...rest, '--token', token], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
const projectFile = '.vercel/project.json';
if (!existsSync(projectFile)) {
  console.error('Vercel link completed but .vercel/project.json was not found.');
  process.exit(3);
}
const linked = JSON.parse(readFileSync(projectFile, 'utf8'));
console.log('\nLINK_OK');
console.log(`VERCEL_ORG_ID=${linked.orgId || ''}`);
console.log(`VERCEL_PROJECT_ID=${linked.projectId || ''}`);
console.log('\nThe project IDs above are informational; the v12 workflow can link by project name.');
console.log('Store only VERCEL_TOKEN as a GitHub Actions repository secret.');
