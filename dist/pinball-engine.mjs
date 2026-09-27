import { randomInt, shuffle } from './ladder-engine.mjs';
export const WIDTH = 800, RADIUS = 12;
export const LENGTHS = {short:{sections:3,label:'퀵 · 3구간'},standard:{sections:4,label:'스탠더드 · 4구간'},long:{sections:5,label:'드라마 · 5구간'}};
export const MAPS = [
  {id:'garden',name:'에메랄드 가든',tag:'EMERALD GARDEN',description:'좁은 꽃잎 병목과 반동 패드에서 순위가 계속 뒤집히는 코스',color:'#36d9bd',accent:'#a7eb85',surface:'#061719',grid:'#123238'},
  {id:'factory',name:'네온 팩토리',tag:'NEON FACTORY',description:'엇갈린 네온 벽과 쌍둥이 로터를 한 번에 돌파하는 코스',color:'#b598ff',accent:'#70d7ff',surface:'#0d0920',grid:'#302345'},
  {id:'canyon',name:'선셋 캐니언',tag:'SUNSET CANYON',description:'지그재그 협곡과 마지막 부스터에서 역전을 노리는 코스',color:'#ffbf70',accent:'#ff8a93',surface:'#1b0e0c',grid:'#422a21'}
];
export function makeMap(id,length='standard') {
  if(!MAPS.some(map=>map.id===id))throw new Error('알 수 없는 맵');
  if(!Object.hasOwn(LENGTHS,length))throw new Error('잘못된 코스 길이');
  const circles=[],segments=[],rotors=[],pads=[],sections=LENGTHS[length].sections,sectionHeight=760;
  for(let section=0;section<sections;section++){
    const base=150+section*sectionHeight,flip=section%2?-1:1;
    if(id==='garden'){
      segments.push({ax:28,ay:base,bx:315,by:base+145},{ax:772,ay:base,bx:485,by:base+145});
      for(let row=0;row<3;row++)for(let col=0;col<5;col++)circles.push({x:125+col*138+(row%2)*55,y:base+210+row*88,r:18+(col%2)*5});
      rotors.push({x:400,y:base+515,length:155,speed:flip*.95,phase:section*.8});
      pads.push({id:`g${section}`,x:section%2?115:485,y:base+650,w:200,h:18,vy:460,vx:flip*80,type:'boost'});
    }else if(id==='factory'){
      segments.push(flip>0?{ax:28,ay:base,bx:570,by:base+175}:{ax:772,ay:base,bx:230,by:base+175});
      circles.push({x:145,y:base+245,r:28},{x:400,y:base+275,r:22},{x:655,y:base+245,r:28});
      rotors.push({x:255,y:base+430,length:120,speed:flip*1.25,phase:section},{x:545,y:base+500,length:120,speed:-flip*1.15,phase:section+1.2});
      segments.push({ax:28,ay:base+630,bx:300,by:base+700},{ax:772,ay:base+630,bx:500,by:base+700});
      pads.push({id:`f${section}`,x:310,y:base+680,w:180,h:18,vy:480,vx:-flip*110,type:'boost'});
    }else{
      segments.push(flip>0?{ax:60,ay:base,bx:410,by:base+105}:{ax:740,ay:base,bx:390,by:base+105});
      circles.push({x:flip>0?650:150,y:base+245,r:34},{x:flip>0?190:610,y:base+365,r:25});
      segments.push(flip>0?{ax:740,ay:base+345,bx:480,by:base+440}:{ax:60,ay:base+345,bx:320,by:base+440});
      rotors.push({x:400,y:base+570,length:145,speed:flip*1.05,phase:section+.4});
      pads.push({id:`c${section}`,x:90+(section*137)%430,y:base+690,w:230,h:18,vy:470,vx:flip*135,type:'boost'});
    }
  }
  const finalY=sections*sectionHeight+80;
  segments.push({ax:28,ay:finalY,bx:300,by:finalY+135},{ax:772,ay:finalY,bx:500,by:finalY+135});
  circles.push({x:315,y:finalY+195,r:30},{x:485,y:finalY+195,r:30},{x:400,y:finalY+285,r:24});
  pads.push({id:'final-left',x:70,y:finalY+250,w:205,h:18,vy:500,vx:120,type:'boost'},{id:'final-right',x:525,y:finalY+250,w:205,h:18,vy:500,vx:-120,type:'boost'});
  return {id,length,height:sections*sectionHeight+520,sectionHeight,circles,segments,rotors,pads};
}
export function rotorSegment(rotor,time){const angle=time*rotor.speed+rotor.phase;return{ax:rotor.x-Math.cos(angle)*rotor.length,ay:rotor.y-Math.sin(angle)*rotor.length,bx:rotor.x+Math.cos(angle)*rotor.length,by:rotor.y+Math.sin(angle)*rotor.length,rotor};}
export function createRace(names,mapId,length='standard'){
  if(names.length<2||names.length>50||new Set(names).size!==names.length)throw new Error('참가자는 서로 다른 2~50명이어야 해요.');
  const order=shuffle(names);
  return{map:makeMap(mapId,length),time:0,finished:[],balls:order.map((name,i)=>({name,id:names.indexOf(name),x:70+randomInt(660),y:35-Math.floor(i/12)*30,vx:randomInt(161)-80,vy:0,bestY:-200,stall:0,padCooldown:0,finished:false})),done:false};
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
  collide(ball,x,y,5,rotor?-(y-rotor.y)*rotor.speed:0,rotor?(x-rotor.x)*rotor.speed:0,rotor?.78:.16);
}
export function stepRace(race,dt=1/120){
  if(race.done)return;
  if(!(dt>0&&dt<=1/30))throw new Error('Use a fixed physics step');
  race.time+=dt;
  const moving=race.map.rotors.map(rotor=>rotorSegment(rotor,race.time));
  const leaderY=Math.max(...race.balls.filter(ball=>!ball.finished).map(ball=>ball.y),0);
  const arrivals=[];
  for(const ball of race.balls){
    if(ball.finished)continue;
    const oldY=ball.y;
    const catchup=ball.y<leaderY-260?1.14:1;ball.vy=Math.min(470,ball.vy+680*catchup*dt);ball.vx*=Math.exp(-.18*dt);ball.padCooldown=Math.max(0,ball.padCooldown-dt);
    ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
    for(const peg of race.map.circles)if(Math.abs(ball.y-peg.y)<peg.r+RADIUS+5)collide(ball,peg.x,peg.y,peg.r);
    for(const segment of [...race.map.segments,...moving])if(ball.y>Math.min(segment.ay,segment.by)-25&&ball.y<Math.max(segment.ay,segment.by)+25)segmentCollision(ball,segment);
    for(const pad of race.map.pads)if(!ball.padCooldown&&ball.y>pad.y-RADIUS&&ball.y<pad.y+pad.h+RADIUS&&ball.x>pad.x&&ball.x<pad.x+pad.w){ball.vy=pad.vy;ball.vx+=pad.vx;ball.padCooldown=.45;}
    if(ball.x<RADIUS+24){ball.x=RADIUS+24;ball.vx=Math.abs(ball.vx)*.8;}
    if(ball.x>WIDTH-RADIUS-24){ball.x=WIDTH-RADIUS-24;ball.vx=-Math.abs(ball.vx)*.8;}
    ball.vx=Math.max(-430,Math.min(430,ball.vx));ball.vy=Math.max(-400,Math.min(400,ball.vy));
    if(ball.y>ball.bestY+10){ball.bestY=ball.y;ball.stall=0;}else ball.stall+=dt;
    // A quick diagonal pulse keeps narrow choke points tense without making the race drag.
    if(ball.stall>.9){ball.vx+=(randomInt(2)?1:-1)*(150+randomInt(110));ball.vy=185;ball.stall=0;}
    if(ball.y>=race.map.height){ball.finished=true;ball.finishTime=race.time-dt+dt*Math.max(0,Math.min(1,(race.map.height-oldY)/(ball.y-oldY||1)));ball.y=race.map.height;arrivals.push(ball);}
  }
  arrivals.sort((a,b)=>a.finishTime-b.finishTime||a.x-b.x);
  race.finished.push(...arrivals);
  race.done=race.finished.length===race.balls.length;
}
