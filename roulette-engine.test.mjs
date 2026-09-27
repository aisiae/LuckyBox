import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRoulette,planSpin,finishSpin,pointedIndex} from './dist/roulette-engine.mjs';
test('roulette selects unique winners and removes each from subsequent spins',()=>{
  const names=['민수','지은','서준','하린','도윤'];const wheel=createRoulette(names,3);
  while(!wheel.done){const before=[...wheel.remaining],plan=planSpin(wheel);assert.ok(before.includes(plan.name));const selected=finishSpin(wheel,plan);assert.equal(selected,plan.name);assert.ok(!wheel.remaining.includes(selected));assert.equal(pointedIndex(wheel.rotation,plan.segments.length),plan.index);}
  assert.equal(wheel.winners.length,3);assert.equal(new Set(wheel.winners).size,3);assert.equal(wheel.remaining.length,2);assert.throws(()=>planSpin(wheel));
});
test('roulette rejects invalid configurations and double completion',()=>{
  assert.throws(()=>createRoulette(['a'],1));assert.throws(()=>createRoulette(['a','a'],1));assert.throws(()=>createRoulette(['a','b'],2));
  const wheel=createRoulette(['a','b','c'],1),plan=planSpin(wheel);finishSpin(wheel,plan);assert.throws(()=>finishSpin(wheel,plan));
});
