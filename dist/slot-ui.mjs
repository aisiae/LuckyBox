import { planSlotSpin, finishSlotSpin } from './slot-engine.mjs';
const make=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};

export class SlotView {
  constructor(root,state,onFinish){
    this.state=state;this.onFinish=onFinish;this.running=false;this.destroyed=false;this.timers=[];
    root.replaceChildren();const machine=make('div','slot-machine');
    const marquee=make('div','slot-marquee');marquee.append(make('span','','★'),make('strong','','LUCKY SLOTS'),make('span','','★'));machine.append(marquee);
    const reels=make('div','slot-reels');this.reels=Array.from({length:3},(_,index)=>{const reel=make('div','slot-reel');reel.setAttribute('aria-hidden','true');const text=make('span','',state.names[index%state.names.length]);reel.append(text);reels.append(reel);return text;});machine.append(reels);
    this.status=make('p','slot-status','레버를 당겨 행운의 이름을 맞춰보세요.');this.status.setAttribute('role','status');machine.append(this.status);
    this.skip=make('button','secondary-button','연출 건너뛰기');this.skip.hidden=true;this.skip.onclick=()=>this.complete();machine.append(this.skip);
    const history=make('div','slot-history');history.append(make('p','eyebrow','WINNER BOARD'));this.list=make('ol','slot-winners');history.append(this.list);
    const layout=make('div','slot-layout');layout.append(machine,history);root.append(layout);this.update();
  }
  update(){
    this.list.replaceChildren();this.state.winners.forEach((name,index)=>{const item=make('li');item.append(make('span','',String(index+1).padStart(2,'0')),make('strong','',name),make('b','','WIN'));this.list.append(item);});
  }
  spin(){
    if(this.running||this.state.done)return;this.plan=planSlotSpin(this.state);this.running=true;this.skip.hidden=false;this.status.textContent='이름이 빠르게 돌아가고 있어요…';
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){this.complete();return;}
    const start=performance.now(),duration=4200,tick=()=>{if(this.destroyed||!this.running)return;const elapsed=performance.now()-start;this.reels.forEach((reel,index)=>{const speed=Math.max(75,190-elapsed/30+index*16);if(!reel.dataset.next||elapsed>Number(reel.dataset.next)){reel.textContent=this.state.remaining[(Math.floor(elapsed/speed)+index*3+this.plan.seed)%this.state.remaining.length];reel.dataset.next=String(elapsed+speed);}});if(elapsed>=duration)this.complete();else this.frame=requestAnimationFrame(tick);};this.frame=requestAnimationFrame(tick);
  }
  complete(){
    if(!this.running)return;cancelAnimationFrame(this.frame);this.reels.forEach(reel=>{reel.textContent=this.plan.winner;delete reel.dataset.next;});finishSlotSpin(this.state,this.plan);this.running=false;this.skip.hidden=true;this.status.textContent=`★ ${this.plan.winner} 당첨!`;this.update();this.onFinish(this.state);
  }
  destroy(){this.destroyed=true;cancelAnimationFrame(this.frame);}
}
