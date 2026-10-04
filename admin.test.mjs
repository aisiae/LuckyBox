import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import admin from './api/admin.mjs';
import visit from './api/visit.mjs';
import { dayKey, visitor, summary } from './lib/analytics.mjs';
import { dashboard } from './lib/dashboard.mjs';
const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
afterEach(() => { globalThis.fetch = originalFetch; for (const key of ['ADMIN_PASSWORD','ADMIN_USERNAME','FIREBASE_PROJECT_ID','FIREBASE_CLIENT_EMAIL','FIREBASE_PRIVATE_KEY']) { if (originalEnv[key] === undefined) delete process.env[key]; else process.env[key] = originalEnv[key]; } });
const configure = () => { process.env.ADMIN_PASSWORD = 'test-only-password-long-enough'; process.env.FIREBASE_PROJECT_ID = 'test-project'; process.env.FIREBASE_CLIENT_EMAIL = 'test@example.invalid'; process.env.FIREBASE_PRIVATE_KEY = 'test-only-invalid-key'; };
const response = () => ({ statusCode: 200, headers: {}, setHeader(k,v){this.headers[k.toLowerCase()]=v}, end(v=''){this.body=v} });
test('administrator content is never sent before server authentication', async () => {
 configure(); const res=response(); await admin({ method:'GET', url:'/admin', headers:{} },res);
 assert.equal(res.statusCode,401); assert.ok(res.headers['www-authenticate']); assert.ok(!res.body.includes('광고 수익 계산')); assert.equal(res.headers['cache-control'],'private, no-store');
});
test('missing or short password fails closed', async () => {
 process.env.ADMIN_PASSWORD='short'; const res=response();await admin({method:'GET',url:'/admin',headers:{}},res);assert.equal(res.statusCode,503);
});
test('authenticated calculator works without a connected database', async () => {
 configure(); delete process.env.FIREBASE_PRIVATE_KEY; const res=response();await admin({method:'GET',url:'/admin',headers:{authorization:'Basic '+Buffer.from('admin:'+process.env.ADMIN_PASSWORD).toString('base64')}},res);
 assert.equal(res.statusCode,200);assert.ok(res.body.includes('통계 저장소가 연결되지'));assert.ok(res.body.includes('광고 수익 계산'));assert.ok(!res.body.includes(process.env.ADMIN_PASSWORD));
});
test('day boundaries follow Korean midnight', () => {
 assert.equal(dayKey(Date.parse('2026-10-04T14:59:59Z')),'2026-10-04');assert.equal(dayKey(Date.parse('2026-10-04T15:00:00Z')),'2026-10-05');
});
test('signed visit cookie reuses valid visitor and rejects tampering', () => {
 configure();const res=response(),id=visitor({headers:{}},res);const cookie=res.headers['set-cookie'].split(';')[0];assert.equal(visitor({headers:{cookie}},response()),id);assert.notEqual(visitor({headers:{cookie:cookie+'x'}},response()),id);assert.ok(res.headers['set-cookie'].includes('HttpOnly'));
});
test('visit rejects cross-origin requests before storage access', async () => {
 configure();globalThis.fetch=()=>{throw Error('Must not access storage')};const res=response();await visit({method:'POST',headers:{host:'lucky.test',origin:'https://other.test'}},res);assert.equal(res.statusCode,403);
});

test('storage failure stays unavailable rather than becoming fake zero statistics', async () => {
 configure(); await assert.rejects(summary());
});
test('calculator computes revenue and break-even in rendered page', () => {
 const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{value:({daily:'100',pages:'2',rpm:'1',fx:'1400',cost:'20'})[id]||'',style:{},textContent:'',checkValidity:()=>true,replaceChildren(){},append(){},addEventListener(){}});return nodes.get(id)};
 const document={getElementById:node,createElement:()=>({style:{},append(){}})};
 const html=dashboard({data:null,message:''});const script=html.match(/<script>([\s\S]*)<\/script>/)[1];vm.runInNewContext(script,{document});assert.equal(node('revenue').textContent,'$6.00');assert.ok(node('profit').textContent.startsWith('$-14.00'));assert.ok(node('break').textContent.includes('334'));
 node('rpm').value='0';vm.runInNewContext(script,{document});assert.ok(node('break').textContent.includes('충당할 수 없습니다'));
});
