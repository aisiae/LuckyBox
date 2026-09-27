import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLadder, createResultLadder, splitGroups } from './dist/ladder-engine.mjs';
test('each ladder is a one-to-one mapping with the requested winner count',()=>{
  for(const size of [2,3,6,17,50])for(let iteration=0;iteration<30;iteration++){
    const names=Array.from({length:size},(_,i)=>`Person ${i}`);const count=1+iteration%(size-1);const ladder=createLadder(names,count);
    assert.equal(new Set(ladder.paths.map(p=>p.end)).size,size);
    assert.equal(ladder.paths.filter(p=>p.winner).length,count);
    ladder.rows.forEach(row=>row.forEach((lane,i)=>{assert.ok(lane>=0&&lane<size-1);if(i)assert.ok(lane-row[i-1]>1);}));
    ladder.paths.forEach(path=>{let lane=path.start;for(const row of ladder.rows){const crossing=row.find(left=>left===lane||left+1===lane);if(crossing!==undefined)lane=lane===crossing?lane+1:lane-1;}assert.equal(path.end,lane);assert.equal(path.winner,ladder.outputs[lane]);});
  }
});
test('group splitting preserves everyone exactly once and balances sizes',()=>{
  for(const random of [true,false])for(let count=1;count<=10;count++){const names=Array.from({length:23},(_,i)=>String(i));const groups=splitGroups(names,count,random);assert.deepEqual(groups.flat().sort(),names.sort());assert.ok(Math.max(...groups.map(g=>g.length))-Math.min(...groups.map(g=>g.length))<=1);}
});
test('invalid setups are rejected',()=>{assert.throws(()=>splitGroups(['a','b'],2));assert.throws(()=>createLadder(['a'],1));assert.throws(()=>createLadder(['a','b'],2));assert.throws(()=>createLadder(['a','b'],0));});
test('custom ladder preserves every configured result exactly once',()=>{
  const names=['민수','지은','서준','하린'],results=['10,000원','커피','꽝','꽝'];
  for(let i=0;i<50;i++){const ladder=createResultLadder(names,results);assert.deepEqual([...ladder.outputs].sort(),[...results].sort());assert.deepEqual(ladder.paths.map(path=>path.result).sort(),[...results].sort());assert.equal(new Set(ladder.paths.map(path=>path.end)).size,names.length);}
  assert.throws(()=>createResultLadder(names,['당첨']));assert.throws(()=>createResultLadder(names,['당첨','','꽝','꽝']));
});
