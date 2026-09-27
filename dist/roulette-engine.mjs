import { randomInt } from './ladder-engine.mjs';
const TAU=Math.PI*2;
export const normalizeAngle=angle=>((angle%TAU)+TAU)%TAU;
export function pointedIndex(rotation,count){return Math.min(count-1,Math.floor(normalizeAngle(-rotation)/(TAU/count)));}
export function createRoulette(names,winnerCount){
  if(names.length<2||names.length>50||new Set(names).size!==names.length||!Number.isInteger(winnerCount)||winnerCount<1||winnerCount>=names.length)throw new Error('잘못된 룰렛 설정');
  return{names:[...names],remaining:[...names],winners:[],winnerCount,rotation:0,lastSegments:[...names],done:false,pending:null};
}
export function planSpin(state){
  if(state.done||state.pending)throw new Error('지금은 룰렛을 돌릴 수 없어요.');
  const index=randomInt(state.remaining.length),segments=[...state.remaining],slice=TAU/segments.length;
  const jitter=(randomInt(1001)/1000-.5)*slice*.5;
  const desired=-(index+.5)*slice+jitter;
  const target=state.rotation+6*TAU+normalizeAngle(desired-state.rotation);
  const plan={name:segments[index],index,segments,from:state.rotation,target};
  state.pending=plan;return plan;
}
export function finishSpin(state,plan){
  if(!plan||state.pending!==plan||state.done)throw new Error('진행 중인 추첨이 아니에요.');
  state.rotation=normalizeAngle(plan.target);state.lastSegments=plan.segments;state.winners.push(plan.name);state.remaining=state.remaining.filter(name=>name!==plan.name);state.pending=null;state.done=state.winners.length===state.winnerCount;
  return plan.name;
}
