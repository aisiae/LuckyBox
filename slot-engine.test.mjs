import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSlots,planSlotSpin,finishSlotSpin} from './dist/slot-engine.mjs';
test('slots select the requested number of unique winners',()=>{const slots=createSlots(['a','b','c','d'],3);while(!slots.done){const before=[...slots.remaining],plan=planSlotSpin(slots);assert.ok(before.includes(plan.winner));finishSlotSpin(slots,plan);assert.ok(!slots.remaining.includes(plan.winner));}assert.equal(slots.winners.length,3);assert.equal(new Set(slots.winners).size,3);});
test('slots reject invalid setup and duplicate completion',()=>{assert.throws(()=>createSlots(['a'],1));assert.throws(()=>createSlots(['a','a'],1));assert.throws(()=>createSlots(['a','b'],2));const slots=createSlots(['a','b','c'],1),plan=planSlotSpin(slots);finishSlotSpin(slots,plan);assert.throws(()=>finishSlotSpin(slots,plan));});
