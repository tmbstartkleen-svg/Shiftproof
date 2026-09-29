import {mutationOriginAllowed} from '../lib/security';

const cases=[
  [new Request('https://shiftproof.example/api/x',{method:'POST',headers:{origin:'https://shiftproof.example','sec-fetch-site':'same-origin'}}),true],
  [new Request('https://shiftproof.example/api/x',{method:'POST',headers:{origin:'https://evil.example','sec-fetch-site':'cross-site'}}),false],
  [new Request('https://shiftproof.example/api/x',{method:'POST'}),true],
] as const;
let passed=0;
for(const [req,expected] of cases){if(mutationOriginAllowed(req)!==expected)throw new Error('security origin assertion failed');passed++}
console.log(`SECURITY_TEST_OK ${passed} mutation-origin assertions passed.`);
