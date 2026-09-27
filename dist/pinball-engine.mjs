import { randomInt, shuffle } from './ladder-engine.mjs';
export const WIDTH = 800, RADIUS = 12;
export const LENGTHS = {short:{sections:6,label:'숏 코스'},standard:{sections:10,label:'스탠더드 코스'},long:{sections:14,label:'롱 코스'}};
export const MAPS = [
  {id:'garden',name:'에메랄드 가든',tag:'EMERALD GARDEN',description:'범퍼 숲 → 중앙 경사로 → 회전 날개를 통과하는 청록 코스',color:'#36d9bd',accent:'#a7eb85',surface:'#071e21',grid:'#133237'},
  {id:'factory',name:'네온 팩토리',tag:'NEON FACTORY',description:'교차 경사로와 범퍼, 쌍둥이 로터가 이어지는 보라 코스',color:'#b598ff',accent:'#70d7ff',surface:'#16112b',grid:'#302345'},
  {id:'canyon',name:'선셋 캐니언',tag:'SUNSET CANYON',description:'긴 지그재그와 바위 범퍼, 회전 다리가 있는 노을 코스',color:'#ffbf70',accent:'#ff8a93',surface:'#241711',grid:'#422a21'}
];
export function makeMap(id,length='standard') {
  if(!MAPS.some(map=>map.id===id))throw new Error('알 수 없는 맵');
  if(!Object.hasOwn(LENGTHS,length))throw new Error('잘못된 코스 길이');
  const circles=[],segments=[],rotors=[],sections=LENGTHS[length].sections;
  for(let section=0;section<sections;section++){
    const base=250+section*1300;
    if(id==='garden'){
      for(let row=0;row<3;row++)for(let col=0;col<6;col++)circles.push({x:85+col*120+(row%2)*35,y:base+row*125,r:22+(col%3)*4});
      segments.push({ax:28,ay:base+415,bx:305,by:base+560},{ax:772,ay:base+415,bx:495,by:base+560});
      rotors.push({x:400,y:base+805,length:180,speed:section%2?-.75:.75,phase:section*.9});
      circles.push({x:240,y:base+1100,r:32},{x:560,y:base+1100,r:32});
    }else if(id==='factory'){
      segments.push(section%2?{ax:772,ay:base,bx:230,by:base+205}:{ax:28,ay:base,bx:570,by:base+205});
      for(let col=0;col<6;col++)circles.push({x:95+col*122,y:base+390+(col%2)*55,r:27});
      rotors.push({x:230,y:base+705,length:145,speed:.9,phase:section},{x:565,y:base+800,length:140,speed:-1.05,phase:section+1});
      circles.push({x:130,y:base+1085,r:38},{x:400,y:base+1085,r:27},{x:670,y:base+1085,r:38});
    }else{
      segments.push({ax:28,ay:base,bx:580,by:base+215},{ax:772,ay:base+430,bx:220,by:base+630});
      circles.push({x:660,y:base+325,r:30},{x:140,y:base+745,r:26},{x:310,y:base+1170,r:23},{x:590,y:base+1170,r:30});
      rotors.push({x:415,y:base+950,length:165,speed:section%2?-.85:.85,phase:section+.4});
    }
  }
  return {id,length,height:sections*1300+550,circles,segments,rotors};
}
export function rotorSegment(rotor,time){const angle=time*rotor.speed+rotor.phase;return{ax:rotor.x-Math.cos(angle)*rotor.length,ay:rotor.y-Math.sin(angle)*rotor.length,bx:rotor.x+Math.cos(angle)*rotor.length,by:rotor.y+Math.sin(angle)*rotor.length,rotor};}
export function createRace(names,mapId,length='standard'){
  if(names.length<2||names.length>50||new Set(names).size!==names.length)throw new Error('참가자는 서로 다른 2~50명이어야 해요.');
  const order=shuffle(names);
  return{map:makeMap(mapId,length),time:0,finished:[],balls:order.map((name,i)=>({name,id:names.indexOf(name),x:70+randomInt(660),y:35-Math.floor(i/12)*32,vx:randomInt(161)-80,vy:0,bestY:-200,stall:0,finished:false})),done:false};
}
function collide(ball,x,y,r,vx=0,vy=0,bounce=.66){
  let dx=ball.x-x,dy=ball.y-y;const distance=Math.hypot(dx,dy),minimum=RADIUS+r;
  if(distance>=minimum)return;
  if(distance<.00001){dx=.01;dy=-1;}
  const d=Math.hypot(dx,dy),nx=dx/d,ny=dy/d;
  ball.x=x+nx*(minimum+.1);ball.y=y+ny*(minimum+.1);
  const impact=(ball.vx-vx)*nx+(ball.vy-vy)*ny;
  if(impact<0){ball.vx-=(1+bounce)*impact*nx;ball.vy-=(1+bounce)*impact*ny;}
}
function segmentCollision(ball,segment){
  const dx=segment.bx-segment.ax,dy=segment.by-segment.ay;
  const t=Math.max(0,Math.min(1,((ball.x-segment.ax)*dx+(ball.y-segment.ay)*dy)/(dx*dx+dy*dy)));
  const x=segment.ax+t*dx,y=segment.ay+t*dy,rotor=segment.rotor;
  collide(ball,x,y,5,rotor?-(y-rotor.y)*rotor.speed:0,rotor?(x-rotor.x)*rotor.speed:0,rotor?.8:.35);
}
export function stepRace(race,dt=1/120){
  if(race.done)return;
  if(!(dt>0&&dt<=1/30))throw new Error('Use a fixed physics step');
  race.time+=dt;
  const moving=race.map.rotors.map(rotor=>rotorSegment(rotor,race.time));
  const arrivals=[];
  for(const ball of race.balls){
    if(ball.finished)continue;
    const oldY=ball.y;
    ball.vy=Math.min(330,ball.vy+540*dt);ball.vx*=Math.exp(-.15*dt);
    ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
    for(const peg of race.map.circles)if(Math.abs(ball.y-peg.y)<peg.r+RADIUS+5)collide(ball,peg.x,peg.y,peg.r);
    for(const segment of [...race.map.segments,...moving])if(ball.y>Math.min(segment.ay,segment.by)-25&&ball.y<Math.max(segment.ay,segment.by)+25)segmentCollision(ball,segment);
    if(ball.x<RADIUS+24){ball.x=RADIUS+24;ball.vx=Math.abs(ball.vx)*.8;}
    if(ball.x>WIDTH-RADIUS-24){ball.x=WIDTH-RADIUS-24;ball.vx=-Math.abs(ball.vx)*.8;}
    ball.vx=Math.max(-430,Math.min(430,ball.vx));ball.vy=Math.max(-400,Math.min(400,ball.vy));
    if(ball.y>ball.bestY+10){ball.bestY=ball.y;ball.stall=0;}else ball.stall+=dt;
    // A small random sideways air pulse frees a ball resting exactly on a peg.
    if(ball.stall>2.4){ball.vx+=(randomInt(2)?1:-1)*(130+randomInt(100));ball.vy=-100;ball.stall=0;}
    if(ball.y>=race.map.height){ball.finished=true;ball.finishTime=race.time-dt+dt*Math.max(0,Math.min(1,(race.map.height-oldY)/(ball.y-oldY||1)));ball.y=race.map.height;arrivals.push(ball);}
  }
  arrivals.sort((a,b)=>a.finishTime-b.finishTime||a.x-b.x);
  race.finished.push(...arrivals);
  race.done=race.finished.length===race.balls.length;
}
