import { randomInt, shuffle } from './ladder-engine.mjs';

export const WIDTH = 800, RADIUS = 12;
export const LENGTHS = {
  short:{sections:4,label:'빠르게 · 약 45초'},
  standard:{sections:5,label:'추천 · 약 1분'},
  long:{sections:6,label:'길게 · 약 75초'}
};
export const MAPS = [
  {id:'garden',name:'에메랄드 가든',tag:'EMERALD GARDEN',description:'꽃잎 병목, 갈림길, 재합류 구간이 선두를 계속 바꾸는 코스',color:'#36d9bd',accent:'#a7eb85',surface:'#061719',grid:'#123238'},
  {id:'factory',name:'네온 팩토리',tag:'NEON FACTORY',description:'엇갈린 벽과 연속 회전 날개 사이에서 추월이 반복되는 코스',color:'#b598ff',accent:'#70d7ff',surface:'#0d0920',grid:'#302345'},
  {id:'canyon',name:'선셋 캐니언',tag:'SUNSET CANYON',description:'양쪽 협곡으로 흩어졌다 마지막까지 다시 섞이는 코스',color:'#ffbf70',accent:'#ff8a93',surface:'#1b0e0c',grid:'#422a21'}
];

const segment=(ax,ay,bx,by,bounce=.28)=>({ax,ay,bx,by,bounce});
const peg=(x,y,r=22,bounce=.72)=>({x,y,r,bounce});
const pad=(id,x,y,w,vx,vy=145)=>({id,x,y,w,h:16,vx,vy,type:'switch'});

export function makeMap(id,length='standard') {
  if(!MAPS.some(map=>map.id===id))throw new Error('알 수 없는 맵');
  if(!Object.hasOwn(LENGTHS,length))throw new Error('잘못된 코스 길이');
  const circles=[],segments=[],rotors=[],pads=[],dramaZones=[];
  const sections=LENGTHS[length].sections,sectionHeight=900;
  for(let section=0;section<sections;section++){
    const base=150+section*sectionHeight,flip=section%2?-1:1,variant=section%3;
    dramaZones.push({id:`mix-${section}`,y:base+775,height:90});
    if(id==='garden'){
      if(variant===0){
        segments.push(segment(28,base,315,base+155),segment(772,base,485,base+155));
        for(let row=0;row<3;row++)for(let col=0;col<5;col++)circles.push(peg(130+col*135+(row%2)*62,base+250+row*90,18+(row+col)%2*5));
        rotors.push({x:400,y:base+605,length:178,speed:flip*.84,phase:section*.9,bounce:.9});
      }else if(variant===1){
        segments.push(segment(28,base+35,250,base+145),segment(250,base+145,145,base+300),segment(772,base+80,535,base+210),segment(535,base+210,655,base+365));
        circles.push(peg(330,base+300,24),peg(470,base+390,24),peg(265,base+500,20),peg(590,base+525,27));
        rotors.push({x:365,y:base+610,length:155,speed:-flip*1.02,phase:section*.75,bounce:.92});
      }else{
        segments.push(segment(400,base+90,230,base+285),segment(400,base+90,570,base+285),segment(230,base+285,335,base+450),segment(570,base+285,465,base+450));
        circles.push(peg(145,base+265,31),peg(655,base+265,31),peg(400,base+500,26));
        rotors.push({x:245,y:base+610,length:125,speed:flip*1.1,phase:section,bounce:.93},{x:555,y:base+610,length:125,speed:-flip*1.1,phase:section+1.4,bounce:.93});
      }
      segments.push(segment(28,base+705,285,base+770),segment(772,base+705,515,base+770));
      pads.push(pad(`g-left-${section}`,95,base+805,220,flip*115),pad(`g-right-${section}`,485,base+805,220,-flip*115));
    }else if(id==='factory'){
      if(variant===0){
        segments.push(flip>0?segment(28,base,590,base+190):segment(772,base,210,base+190));
        circles.push(peg(125,base+270,31),peg(400,base+300,24),peg(675,base+270,31));
        rotors.push({x:245,y:base+475,length:145,speed:flip*1.08,phase:section,bounce:.94},{x:555,y:base+535,length:145,speed:-flip*1.02,phase:section+1.35,bounce:.94});
      }else if(variant===1){
        segments.push(segment(28,base+45,260,base+125),segment(260,base+125,175,base+285),segment(772,base+45,540,base+125),segment(540,base+125,625,base+285));
        rotors.push({x:400,y:base+330,length:205,speed:flip*.78,phase:section+.4,bounce:.96});
        for(let col=0;col<5;col++)circles.push(peg(140+col*130,base+540+(col%2)*55,19));
      }else{
        segments.push(segment(170,base+70,360,base+260),segment(630,base+70,440,base+260),segment(340,base+260,250,base+445),segment(460,base+260,550,base+445));
        circles.push(peg(115,base+390,34),peg(685,base+390,34));
        rotors.push({x:265,y:base+585,length:135,speed:-flip*1.18,phase:section+.2,bounce:.95},{x:535,y:base+585,length:135,speed:flip*1.18,phase:section+1.1,bounce:.95});
      }
      segments.push(segment(28,base+665,330,base+755),segment(772,base+665,470,base+755));
      pads.push(pad(`f-left-${section}`,70,base+805,275,flip*135),pad(`f-right-${section}`,455,base+805,275,-flip*135));
    }else{
      if(variant===0){
        segments.push(flip>0?segment(40,base,455,base+125):segment(760,base,345,base+125));
        circles.push(peg(flip>0?655:145,base+230,38),peg(flip>0?175:625,base+380,29),peg(400,base+470,25));
        segments.push(flip>0?segment(755,base+345,455,base+485):segment(45,base+345,345,base+485));
        rotors.push({x:400,y:base+640,length:172,speed:flip*.86,phase:section+.45,bounce:.92});
      }else if(variant===1){
        segments.push(segment(28,base+25,210,base+130),segment(210,base+130,95,base+300),segment(95,base+300,300,base+430),segment(772,base+55,610,base+165),segment(610,base+165,730,base+335),segment(730,base+335,520,base+470));
        rotors.push({x:315,y:base+570,length:150,speed:-flip*.98,phase:section,bounce:.94});
        circles.push(peg(555,base+585,34));
      }else{
        segments.push(segment(28,base+40,300,base+170),segment(772,base+40,500,base+170),segment(300,base+170,180,base+350),segment(500,base+170,620,base+350));
        for(let row=0;row<2;row++)for(let col=0;col<4;col++)circles.push(peg(190+col*140+(row%2)*65,base+425+row*92,18));
        rotors.push({x:400,y:base+650,length:185,speed:flip*.8,phase:section+.6,bounce:.94});
      }
      pads.push(pad(`c-left-${section}`,85,base+805,245,flip*145),pad(`c-right-${section}`,470,base+805,245,-flip*145));
    }
  }
  const finalY=150+sections*sectionHeight;
  segments.push(segment(28,finalY,300,finalY+155),segment(772,finalY,500,finalY+155));
  circles.push(peg(305,finalY+220,32),peg(495,finalY+220,32),peg(400,finalY+315,27),peg(225,finalY+375,20),peg(575,finalY+375,20));
  rotors.push({x:400,y:finalY+470,length:155,speed:-.95,phase:1.2,bounce:.95});
  dramaZones.push({id:'final-mix',y:finalY+540,height:110,final:true});
  pads.push(pad('final-left',70,finalY+565,265,150,150),pad('final-right',465,finalY+565,265,-150,150));
  rotors.forEach((rotor,index)=>rotor.id=`${id}-rotor-${index}`);
  return {id,length,height:finalY+790,sectionHeight,circles,segments,rotors,pads,dramaZones,pace:id==='garden'?1.12:1};
}

export function rotorSegment(rotor,time){
  const angle=time*rotor.speed+rotor.phase;
  return{ax:rotor.x-Math.cos(angle)*rotor.length,ay:rotor.y-Math.sin(angle)*rotor.length,bx:rotor.x+Math.cos(angle)*rotor.length,by:rotor.y+Math.sin(angle)*rotor.length,rotor,bounce:rotor.bounce};
}

export function createRace(names,mapId,length='standard'){
  if(names.length<2||names.length>50||new Set(names).size!==names.length)throw new Error('참가자는 서로 다른 2~50명이어야 해요.');
  const order=shuffle(names);
  return{map:makeMap(mapId,length),time:0,finished:[],leadChanges:0,rotorLifts:0,lastLeader:null,balls:order.map((name,i)=>({name,id:names.indexOf(name),x:75+randomInt(650),y:32-Math.floor(i/12)*28,vx:randomInt(101)-50,vy:20,bestY:-200,stall:0,padCooldown:0,rotorCooldown:0,grab:null,dramaHits:new Set(),finished:false})),done:false};
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

function segmentCollision(ball,wall){
  const dx=wall.bx-wall.ax,dy=wall.by-wall.ay;
  const t=Math.max(0,Math.min(1,((ball.x-wall.ax)*dx+(ball.y-wall.ay)*dy)/(dx*dx+dy*dy)));
  const x=wall.ax+t*dx,y=wall.ay+t*dy,rotor=wall.rotor;
  const distance=Math.hypot(ball.x-x,ball.y-y);
  if(distance>=RADIUS+5)return;
  if(rotor&&!ball.grab&&!ball.rotorCooldown){
    const angle=Math.atan2(dy,dx),cos=Math.cos(angle),sin=Math.sin(angle);
    const along=(x-rotor.x)*cos+(y-rotor.y)*sin;
    const pointVy=(cos*along)*rotor.speed;
    if(pointVy<-26&&Math.abs(along)>42){
      const side=((ball.x-x)*-sin+(ball.y-y)*cos)>=0?1:-1;
      ball.grab={rotor,along,side,elapsed:0,startY:ball.y};
      ball.vx=0;ball.vy=0;
      return;
    }
  }
  collide(ball,x,y,5,rotor?-(y-rotor.y)*rotor.speed:0,rotor?(x-rotor.x)*rotor.speed:0,wall.bounce??.28);
}

function advanceRotorGrab(ball,time,dt,race){
  const grab=ball.grab;if(!grab)return false;
  const {rotor,along,side}=grab,angle=time*rotor.speed+rotor.phase,cos=Math.cos(angle),sin=Math.sin(angle),normal=side*(RADIUS+6);
  ball.x=rotor.x+cos*along-sin*normal;ball.y=rotor.y+sin*along+cos*normal;
  const tangentX=(-sin*along-cos*normal)*rotor.speed,tangentY=(cos*along-sin*normal)*rotor.speed;
  ball.vx=tangentX;ball.vy=tangentY;grab.elapsed+=dt;ball.stall=0;
  const release=(grab.elapsed>.38&&tangentY>18)||grab.elapsed>1.05;
  if(!release)return true;
  if(grab.startY-ball.y>24)race.rotorLifts++;
  ball.grab=null;ball.rotorCooldown=1.05;ball.vx=tangentX*1.18;ball.vy=tangentY*1.18-18;
  return false;
}

function enterDramaZone(ball,zone,rank,total){
  if(ball.dramaHits.has(zone.id))return;
  ball.dramaHits.add(zone.id);
  const trailing=total<2?0:rank/(total-1),direction=randomInt(2)?1:-1;
  ball.vx+=direction*(125+randomInt(90));
  ball.vy=rank===0?72:Math.min(158,112+trailing*46);
  if(zone.final)ball.vx+=direction*55;
  ball.padCooldown=.35;
}

export function stepRace(race,dt=1/120){
  if(race.done)return;
  if(!(dt>0&&dt<=1/30))throw new Error('Use a fixed physics step');
  race.time+=dt;
  const moving=race.map.rotors.map(rotor=>rotorSegment(rotor,race.time));
  const active=race.balls.filter(ball=>!ball.finished).sort((a,b)=>b.y-a.y);
  const ranks=new Map(active.map((ball,index)=>[ball,index])),leader=active[0];
  if(leader&&race.lastLeader!==null&&race.lastLeader!==leader.id)race.leadChanges++;
  if(leader)race.lastLeader=leader.id;
  const leaderY=leader?.y||0,arrivals=[];
  for(const ball of race.balls){
    if(ball.finished)continue;
    ball.rotorCooldown=Math.max(0,ball.rotorCooldown-dt);
    if(advanceRotorGrab(ball,race.time,dt,race))continue;
    const oldY=ball.y,rank=ranks.get(ball)||0,gap=Math.max(0,leaderY-ball.y),draft=1+Math.min(.24,gap/1400);
    const inFinalShuffle=ball.y>race.map.height-760&&race.time<52;
    const speedLimit=(inFinalShuffle?62:155)*race.map.pace;
    ball.vy=Math.min(speedLimit,ball.vy+250*race.map.pace*draft*dt);
    ball.vx*=Math.exp(-.12*dt);ball.padCooldown=Math.max(0,ball.padCooldown-dt);
    ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
    for(const pegItem of race.map.circles)if(Math.abs(ball.y-pegItem.y)<pegItem.r+RADIUS+5)collide(ball,pegItem.x,pegItem.y,pegItem.r,0,0,pegItem.bounce);
    for(const wall of [...race.map.segments,...moving])if(ball.y>Math.min(wall.ay,wall.by)-25&&ball.y<Math.max(wall.ay,wall.by)+25)segmentCollision(ball,wall);
    for(const boost of race.map.pads)if(!ball.padCooldown&&ball.y>boost.y-RADIUS&&ball.y<boost.y+boost.h+RADIUS&&ball.x>boost.x&&ball.x<boost.x+boost.w){ball.vy=Math.min(boost.vy,Math.max(95,ball.vy));ball.vx+=boost.vx;ball.padCooldown=.5;}
    for(const zone of race.map.dramaZones)if(oldY<zone.y&&ball.y>=zone.y)enterDramaZone(ball,zone,rank,active.length);
    if(ball.x<RADIUS+24){ball.x=RADIUS+24;ball.vx=Math.abs(ball.vx)*.82;}
    if(ball.x>WIDTH-RADIUS-24){ball.x=WIDTH-RADIUS-24;ball.vx=-Math.abs(ball.vx)*.82;}
    ball.vx=Math.max(-310,Math.min(310,ball.vx));ball.vy=Math.max(-175,Math.min((inFinalShuffle?68:160)*race.map.pace,ball.vy));
    if(ball.y>ball.bestY+9){ball.bestY=ball.y;ball.stall=0;}else ball.stall+=dt;
    if(ball.stall>1.8){ball.vx+=(randomInt(2)?1:-1)*(95+randomInt(80));ball.vy=92;ball.stall=0;}
    if(ball.y>=race.map.height){ball.finished=true;ball.finishTime=race.time-dt+dt*Math.max(0,Math.min(1,(race.map.height-oldY)/(ball.y-oldY||1)));ball.y=race.map.height;arrivals.push(ball);}
  }
  arrivals.sort((a,b)=>a.finishTime-b.finishTime||a.x-b.x);
  race.finished.push(...arrivals);
  race.done=race.finished.length===race.balls.length;
}
