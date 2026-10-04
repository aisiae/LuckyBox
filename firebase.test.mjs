import test from 'node:test';
import assert from 'node:assert/strict';
import { FieldValue } from 'firebase-admin/firestore';
import { recordVisit, readSummary } from './lib/firebase.mjs';

function fakeDatabase() {
  const store = new Map();
  const snapshot = ref => ({ exists: store.has(ref), data: () => store.get(ref) });
  return { store, doc: path => path, getAll: async (...refs) => refs.map(snapshot),
    runTransaction: async operation => {
      const writes = []; const result = await operation({ get: async ref => snapshot(ref), set: (ref, data) => writes.push([ref, data]) });
      for (const [ref, data] of writes) { const next = { ...store.get(ref) }; for (const [key, value] of Object.entries(data)) {
        if (value?.isEqual && value.isEqual(FieldValue.increment(1))) next[key] = (next[key] || 0) + 1;
        else if (value?.isEqual && value.isEqual(FieldValue.increment(0))) next[key] ||= 0;
        else next[key] = value;
      } store.set(ref, next); } return result;
    }
  };
}
test('Firestore counts daily unique browsers, repeat views and cumulative visitor-days', async () => {
  const db=fakeDatabase(), day='2026-10-04', now=Date.parse(day+'T12:00:00+09:00');
  assert.equal(await recordVisit(db,day,'browser-a','home',now),true);
  assert.equal(await recordVisit(db,day,'browser-a','home',now+1000),false);
  assert.equal(await recordVisit(db,day,'browser-a','game',now+1500),true);
  await recordVisit(db,day,'browser-a','home',now+3000);
  await recordVisit(db,day,'browser-b','home',now+4000);
  await recordVisit(db,'2026-10-05','browser-c','home',now+86400000);
  assert.deepEqual(db.store.get('luckyboxDaily/'+day),{date:day,views:4,visitors:2});
  assert.deepEqual(db.store.get('luckyboxStats/totals'),{views:5,visitorDays:3,first:day});
  assert.ok(db.store.get('luckyboxDaily/'+day+'/visitors/browser-a').expiresAt.toMillis()>now);
  assert.equal('expiresAt' in db.store.get('luckyboxDaily/'+day),false);
});
test('summary fills missing days and retains lifetime totals', async () => {
  const db=fakeDatabase();db.store.set('luckyboxStats/totals',{views:1000,visitorDays:400,first:'2026-01-01'});
  db.store.set('luckyboxDaily/2026-10-04',{views:12,visitors:5});
  const result=await readSummary(db,['2026-10-03','2026-10-04'],'2026-10-04');
  assert.equal(result.totals.views,1000);assert.equal(result.first,'2026-01-01');assert.deepEqual(result.days,[{date:'2026-10-03',views:0,visitors:0},{date:'2026-10-04',views:12,visitors:5}]);
});
test('transaction failures propagate rather than reporting successful recording', async () => {
  await assert.rejects(recordVisit({doc:v=>v,runTransaction:async()=>{throw Error('offline')}},'2026-10-04','a','home'));
});
