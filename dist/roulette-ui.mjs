import {planSpin,finishSpin} from './roulette-engine.mjs';
const COLORS=['#137d98','#4d54bd','#aa4581','#27866e','#a86a2f','#3866a6','#8651b5','#ab4f4f'];
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
export class RouletteView {
  constructor(root,state,onFinish){
    this.state=state;this.onFinish=onFinish;this.rotation=state.rotation;this.segments=state.lastSegments;this.running=false;this.destroyed=false;this.frame=0;
    root.replaceChildren();const layout=make('div','roulette-layout'),wheel=make('div','roulette-wheel-wrap');
    this.canvas=make('canvas','roulette-canvas');this.canvas.setAttribute('role','img');this.canvas.setAttribute('aria-label','이름별 동일한 크기의 칸으로 나뉜 룰렛. 위쪽 화살표가 가리키는 사람이 당첨됩니다.');wheel.append(this.canvas);
    const pointer=make('span','roulette-pointer');pointer.setAttribute('aria-hidden','true');wheel.append(pointer);
    const hub=make('div','roulette-hub');hub.append(make('span','','LUCKY'),make('strong','','BOX'));wheel.append(hub);
    const side=make('div','roulette-info');side.append(make('p','eyebrow','SPIN YOUR LUCK'));this.progress=make('h3');side.append(this.progress);
    this.status=make('p','roulette-status');this.status.setAttribute('role','status');side.append(this.status);
    this.picks=make('ol','roulette-picks');side.append(this.picks);
    this.skip=make('button','secondary-button','연출 건너뛰기');this.skip.hidden=true;this.skip.onclick=()=>this.complete();side.append(this.skip);
    side.append(make('p','muted','한 명씩 뽑고, 당첨된 사람은 다음 회전에서 제외해요. 각 칸의 당첨 확률은 같아요.'));
    layout.append(wheel,side);root.append(layout);this.update();this.resize=new ResizeObserver(()=>this.draw());this.resize.observe(wheel);this.draw();
  }
  update(){this.progress.textContent=`${this.state.winners.length} / ${this.state.winnerCount}명 추첨 완료`;this.status.textContent=this.state.winners.length?`${this.state.winners.at(-1)} 당첨!`:'룰렛을 돌려 행운의 주인공을 만나보세요.';this.picks.replaceChildren();this.state.winners.forEach((name,i)=>{const row=make('li');row.append(make('span','pick-order',`${i+1}`),make('strong','',name),make('span','','★'));this.picks.append(row);});}
  spin(){
    if(this.running||this.state.done)return;
    this.plan=planSpin(this.state);this.segments=this.plan.segments;this.running=true;this.elapsed=0;this.last=performance.now();this.duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:5200;
    this.skip.hidden=false;this.status.textContent='두근두근, 누구에게 멈출까요?';this.canvas.setAttribute('aria-label','룰렛이 회전 중입니다.');
    if(!this.duration){this.complete();return;}
    this.frame=requestAnimationFrame(t=>this.tick(t));
  }
  tick(now){
    if(this.destroyed||!this.running)return;
    if(!document.hidden)this.elapsed+=Math.min(100,now-this.last);this.last=now;
    const progress=Math.min(1,this.elapsed/this.duration),eased=1-Math.pow(1-progress,4);
    this.rotation=this.plan.from+(this.plan.target-this.plan.from)*eased;this.draw();
    if(progress===1)this.complete();else this.frame=requestAnimationFrame(t=>this.tick(t));
  }
  complete(){
    if(!this.running)return;cancelAnimationFrame(this.frame);finishSpin(this.state,this.plan);this.running=false;this.rotation=this.state.rotation;this.skip.hidden=true;this.update();this.draw();this.canvas.setAttribute('aria-label',`룰렛이 ${this.plan.name} 칸에 멈췄습니다. ${this.plan.name} 당첨.`);this.onFinish(this.state);
  }
  draw(){
    if(this.destroyed)return;const width=this.canvas.parentElement.getBoundingClientRect().width;if(!width)return;
    const dpr=Math.min(devicePixelRatio||1,2),size=Math.round(width*dpr);if(this.canvas.width!==size){this.canvas.width=size;this.canvas.height=size;}
    const ctx=this.canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,width);ctx.save();ctx.translate(width/2,width/2);const radius=width*.46,slice=Math.PI*2/this.segments.length;
    this.segments.forEach((name,i)=>{
      const start=this.rotation-Math.PI/2+i*slice;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,radius,start,start+slice);ctx.closePath();ctx.fillStyle=COLORS[i%COLORS.length];ctx.fill();ctx.strokeStyle='#ddeeff40';ctx.lineWidth=1;ctx.stroke();
      ctx.save();ctx.rotate(start+slice/2);const tiny=this.segments.length>25;ctx.font=`700 ${Math.max(8,Math.min(17,width*(tiny?.022:.032)))}px sans-serif`;ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillStyle='#fff';const maxWidth=radius*.61;let label=name;while(ctx.measureText(label).width>maxWidth&&label.length>1)label=label.slice(0,-1);if(label!==name)label=label.slice(0,-1)+'…';ctx.fillText(label,radius-13,0);ctx.restore();
    });
    ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.strokeStyle='#60d8ec';ctx.lineWidth=4;ctx.stroke();
    for(let i=0;i<36;i++){const angle=i*Math.PI/18;ctx.beginPath();ctx.arc(Math.cos(angle)*(radius+8),Math.sin(angle)*(radius+8),2,0,Math.PI*2);ctx.fillStyle=i%2?'#518397':'#b9f3fa';ctx.fill();}
    ctx.restore();
  }
  destroy(){this.destroyed=true;cancelAnimationFrame(this.frame);this.resize.disconnect();}
}
