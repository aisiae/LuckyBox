import { randomInt } from './ladder-engine.mjs';

export function createSlots(names, winnerCount) {
  if (names.length < 2 || names.length > 50 || new Set(names).size !== names.length || !Number.isInteger(winnerCount) || winnerCount < 1 || winnerCount >= names.length) throw new Error('잘못된 슬롯 머신 설정');
  return { names:[...names], remaining:[...names], winners:[], winnerCount, pending:null, done:false };
}

export function planSlotSpin(state) {
  if (state.done || state.pending) throw new Error('지금은 슬롯을 돌릴 수 없어요.');
  const winner = state.remaining[randomInt(state.remaining.length)];
  const plan = { winner, seed: randomInt(1000000) };
  state.pending = plan;
  return plan;
}

export function finishSlotSpin(state, plan) {
  if (!plan || state.pending !== plan || state.done) throw new Error('진행 중인 슬롯이 아니에요.');
  state.winners.push(plan.winner);
  state.remaining = state.remaining.filter(name => name !== plan.winner);
  state.pending = null;
  state.done = state.winners.length === state.winnerCount;
  return plan.winner;
}
