import { MAPS, WIDTH, RADIUS, makeMap, rotorSegment, stepRace } from './pinball-engine.mjs';
const COLORS=['#37dbed','#bf9bff','#ff86b5','#70e3a7','#ffc56b','#8babff','#ff9973','#edb5ff'];
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
function line(ctx,ax,ay,bx,by,color,width){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();}
function circle(ctx,x,y,r,fill,stroke){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
function drawMap(ctx,map,time){
  const HEIGHT=map.height,theme=MAPS.find(m=>m.id===map.id),color=theme.color;
  ctx.fillStyle=theme.surface;ctx.fillRect(24,0,WIDTH-48,HEIGHT);
  for(let y=0;y<HEIGHT;y+=100)line(ctx,24,y,WIDTH-24,y,theme.grid,1);
  line(ctx,24,0,24,HEIGHT,color,5);line(ctx,WIDTH-24,0,WIDTH-24,HEIGHT,color,5);
  for(let y=250,section=1;y<HEIGHT-550;y+=1300,section++){ctx.fillStyle=theme.accent;ctx.font='bold 18px sans-serif';ctx.fillText(`SECTOR ${String(section).padStart(2,'0')}`,48,y-70);}
  map.circles.forEach(p=>circle(ctx,p.x,p.y,p.r,theme.grid,color));
  map.segments.forEach(p=>line(ctx,p.ax,p.ay,p.bx,p.by,theme.accent,9));
  map.rotors.forEach(rotor=>{const p=rotorSegment(rotor,time);line(ctx,p.ax,p.ay,p.bx,p.by,color,12);circle(ctx,rotor.x,rotor.y,16,'#eee5ff');});
  for(let i=0;i<20;i++){ctx.fillStyle=i%2?'#e5efff':'#1d344c';ctx.fillRect(24+i*(WIDTH-48)/20,HEIGHT-14,(WIDTH-48)/20,14);}
  ctx.fillStyle='#8de9d7';ctx.font='bold 26px sans-serif';ctx.fillText('FINISH',WIDTH/2-48,HEIGHT-34);
}
export function mapPicker(container){
  let selected='garden';const root=make('div','map-options');
  MAPS.forEach((map,index)=>{const button=make('button','map-option');button.type='button';button.setAttribute('aria-pressed',String(index===0));button.setAttribute('aria-label',`${map.name} 선택`);const canvas=make('canvas');canvas.width=400;canvas.height=160;canvas.setAttribute('aria-hidden','true');const ctx=canvas.getContext('2d');ctx.fillStyle='#080f1f';ctx.fillRect(0,0,400,160);ctx.save();ctx.scale(.5,.5);ctx.translate(0,-250);const preview=makeMap(map.id);drawMap(ctx,preview,1,75);ctx.restore();button.append(canvas,make('span','map-tag',map.tag),make('strong','',map.name),make('span','map-description',map.description));button.onclick=()=>{selected=map.id;root.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));};root.append(button);});
  container.append(root);return()=>selected;
}
export class PinballView {
  constructor(root,race,winners,onFinish){
    this.root=root;this.race=race;this.winners=winners;this.onFinish=onFinish;this.camera=0;this.speed=1;this.paused=false;this.running=false;this.focus='leader';this.frame=0;this.accumulator=0;this.last=0;this.lastHud=-1;this.destroyed=false;
    root.replaceChildren();const toolbar=make('div','race-toolbar');
    this.timeLabel=make('span','race-clock','00:00');this.stateLabel=make('span','race-state',race.done?'레이스 완료':'출발 대기');
    this.pauseButton=make('button','secondary-button','일시정지');this.pauseButton.disabled=true;this.pauseButton.onclick=()=>{this.paused=!this.paused;this.pauseButton.textContent=this.paused?'계속하기':'일시정지';this.stateLabel.textContent=this.paused?'일시정지':'레이스 진행 중';};
    const speedLabel=make('label','','속도 '),speed=make('select');speed.setAttribute('aria-label','재생 속도');[1,2,4].forEach(value=>{const option=make('option','',`${value}×`);option.value=value;speed.append(option);});speed.onchange=()=>this.speed=Number(speed.value);speedLabel.append(speed);
    const focusLabel=make('label','','카메라 '),focus=make('select');focus.setAttribute('aria-label','카메라 추적');const lead=make('option','','선두 따라가기');lead.value='leader';focus.append(lead);race.balls.forEach(ball=>{const option=make('option','',ball.name);option.value=ball.id;focus.append(option);});focus.onchange=()=>{this.focus=focus.value;this.draw();};focusLabel.append(focus);
    toolbar.append(this.timeLabel,this.stateLabel,this.pauseButton,speedLabel,focusLabel);root.append(toolbar);
    const layout=make('div','race-layout'),stage=make('div','race-stage');this.canvas=make('canvas');this.canvas.setAttribute('role','img');this.canvas.setAttribute('aria-label','핀볼 레이스. 공을 따라 화면이 내려갑니다. 순위는 옆의 실시간 순위 목록에서도 확인할 수 있습니다.');stage.append(this.canvas);
    this.overlay=make('div','race-overlay');this.overlay.append(make('strong','','READY?'),make('span','',`먼저 도착한 ${winners}명이 당첨됩니다.`));stage.append(this.overlay);
    const side=make('aside','race-sidebar');side.append(make('h3','','LIVE RANKING'));this.rank=make('ol','race-ranking');side.append(this.rank);const miniTitle=make('h3','','COURSE MAP');this.mini=make('canvas','course-minimap');this.mini.width=140;this.mini.height=390;this.mini.setAttribute('aria-label','전체 코스와 공 위치');this.mini.setAttribute('role','img');side.append(miniTitle,this.mini);layout.append(stage,side);root.append(layout);
    const note=make('p','race-note','범퍼·회전 날개·경사로가 이어지는 종합 코스예요. 중간 대기 없이 먼저 결승선을 통과한 순서로 결정돼요. 멈춘 공에는 작은 바람이 불어요.');root.append(note);
    this.resize=new ResizeObserver(()=>this.draw());this.resize.observe(stage);this.updateHud();this.draw();
    if(race.done){this.showFinish();this.camera=race.map.height-850;this.draw();}
  }
  start(){if(this.running||this.race.done)return;this.running=true;this.overlay.hidden=true;this.pauseButton.disabled=false;this.stateLabel.textContent='레이스 진행 중';this.last=performance.now();this.frame=requestAnimationFrame(time=>this.tick(time));}
  tick(now){
    if(this.destroyed)return;
    const elapsed=Math.min(.12,Math.max(0,(now-this.last)/1000));this.last=now;
    if(!this.paused&&!document.hidden){this.accumulator+=elapsed*this.speed;while(this.accumulator>=1/120&&!this.race.done){stepRace(this.race);this.accumulator-=1/120;}this.draw();if(this.race.time-this.lastHud>.15){this.updateHud();this.lastHud=this.race.time;}}
    if(this.race.done){this.running=false;this.pauseButton.disabled=true;this.stateLabel.textContent='모두 도착했어요';this.updateHud();this.draw();this.showFinish();this.onFinish(this.race);return;}
    this.frame=requestAnimationFrame(time=>this.tick(time));
  }
  standings(){return[...this.race.finished,...this.race.balls.filter(b=>!b.finished).sort((a,b)=>b.y-a.y)];}
  showFinish(){this.overlay.hidden=false;this.overlay.replaceChildren(make('strong','','FINISH!'),make('span','finish-winners',this.race.finished.slice(0,this.winners).map(b=>b.name).join(', ')),make('span','','당첨을 축하해요!'));}
  updateHud(){
    const time=Math.floor(this.race.time);this.timeLabel.textContent=`${String(Math.floor(time/60)).padStart(2,'0')}:${String(time%60).padStart(2,'0')}`;
    this.rank.replaceChildren();this.standings().forEach((ball,i)=>{const row=make('li',ball.finished&&i<this.winners?'rank-winner':'');const dot=make('span','ball-dot');dot.style.background=COLORS[ball.id%COLORS.length];row.append(make('span','rank-number',String(i+1)),dot,make('span','rank-name',ball.name),make('span','rank-status',ball.finished?(i<this.winners?'★':'도착'):'진행'));this.rank.append(row);});
    this.canvas.setAttribute('aria-label',`핀볼 레이스 ${time}초 경과, ${this.race.finished.length}/${this.race.balls.length}명 도착. 실시간 순위 목록에서 이름을 확인하세요.`);
  }
  draw(){
    if(this.destroyed)return;const HEIGHT=this.race.map.height,rect=this.canvas.parentElement.getBoundingClientRect();if(!rect.width)return;
    const width=rect.width,height=rect.height,dpr=Math.min(devicePixelRatio||1,2),ctx=this.canvas.getContext('2d');
    if(this.canvas.width!==Math.round(width*dpr)||this.canvas.height!==Math.round(height*dpr)){this.canvas.width=Math.round(width*dpr);this.canvas.height=Math.round(height*dpr);}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#060d19';ctx.fillRect(0,0,width,height);
    const scale=width/WIDTH,viewHeight=height/scale;
    const target=this.focus==='leader'?this.standings().find(b=>!b.finished)||this.race.finished[0]:this.race.balls.find(b=>String(b.id)===this.focus);
    const desired=Math.max(0,Math.min(HEIGHT-viewHeight+70,(target?.y||0)-viewHeight*.38));this.camera+=((this.running&&!this.paused? .13:1)*(desired-this.camera));
    ctx.save();ctx.scale(scale,scale);ctx.translate(0,-this.camera);drawMap(ctx,this.race.map,this.race.time);
    this.race.balls.forEach(ball=>{if(ball.finished)return;circle(ctx,ball.x,ball.y,RADIUS,COLORS[ball.id%COLORS.length],'#ffffffaa');ctx.font=`600 ${Math.max(17,12/scale)}px sans-serif`;const label=ball.name.length>9?ball.name.slice(0,8)+'…':ball.name;const tw=ctx.measureText(label).width;const tx=Math.max(28,Math.min(WIDTH-tw-28,ball.x-tw/2));ctx.fillStyle='#071120d9';ctx.fillRect(tx-4,ball.y-44,tw+8,25);ctx.fillStyle='#edf7ff';ctx.fillText(label,tx,ball.y-24);});ctx.restore();
    const mini=this.mini.getContext('2d');mini.clearRect(0,0,140,390);mini.fillStyle='#07101f';mini.fillRect(0,0,140,390);mini.save();mini.scale(140/WIDTH,390/(HEIGHT+80));drawMap(mini,this.race.map,this.race.time);this.race.balls.forEach(ball=>circle(mini,ball.x,ball.y,24,COLORS[ball.id%COLORS.length]));mini.strokeStyle='#ffffffa0';mini.lineWidth=8;mini.strokeRect(16,this.camera,WIDTH-32,Math.min(viewHeight,HEIGHT-this.camera));mini.restore();
  }
  destroy(){this.destroyed=true;cancelAnimationFrame(this.frame);this.resize.disconnect();}
}
