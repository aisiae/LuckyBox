import { splitGroups, createLadder, createResultLadder } from './ladder-engine.mjs';
import { createRace, MAPS, LENGTHS } from './pinball-engine.mjs';
import { PinballView, mapPicker } from './pinball-ui.mjs';
import { createRoulette } from './roulette-engine.mjs';
import { RouletteView } from './roulette-ui.mjs';
import { createCardRound } from './card-engine.mjs';
import { CardView } from './card-ui.mjs';
import { createSlots } from './slot-engine.mjs';
import { SlotView } from './slot-ui.mjs';
const $ = selector => document.querySelector(selector);
const titles = {ladder:'사다리 타기',roulette:'룰렛',pinball:'핀볼',cards:'카드 뒤집기',slots:'슬롯 머신'};
const kind = new URLSearchParams(location.search).get('game') || 'ladder';
const isPinball = kind === 'pinball';
const isRoulette = kind === 'roulette';
const isCards = kind === 'cards';
const isSlots = kind === 'slots';
let pinballView, rouletteView, cardView, slotView, selectedMap;
const palette = ['#33d5ef','#b499ff','#f78abd','#57e4b5','#ffcd73','#7eafff'];
let names = [], groups = [], groupResults = [], rounds = [], active = 0, busy = false, toastTimer;
try { const value=JSON.parse(localStorage.getItem('luckybox.participants.v1')||'[]'); if(Array.isArray(value)) names=[...new Set(value.filter(n=>typeof n==='string'&&n.trim()&&n.trim().length<=20).map(n=>n.trim()))].slice(0,50); } catch {}
function element(tag,className,text) {const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
function notify(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3000);}
function options(select, count, suffix, value=1) {select.replaceChildren();for(let i=1;i<=count;i++){const option=element('option','',`${i}${suffix}`);option.value=i;select.append(option);} select.value=String(Math.min(Math.max(1,value),count));}
function syncGroupResults(reset=false){
  groupResults=groups.map((members,index)=>{
    const previous=reset?[]:(groupResults[index]||[]),next=previous.slice(0,members.length);
    while(next.length<members.length)next.push(next.length===0?'당첨':'꽝');
    return next;
  });
}
function renderAssignments(){
  if(kind==='ladder')syncGroupResults();
  const root=$('#assignments');root.replaceChildren();
  groups.forEach((members,index)=>{
    const card=element('section','assignment-group');card.append(element('h3','',`${index+1}조 · ${members.length}명`));
    if(!members.length)card.append(element('p','muted','아래 다른 조에서 참가자를 옮겨주세요.'));
    members.forEach(name=>{const row=element('div','assignment-person');const select=element('select');options(select,groups.length,'조',index+1);select.setAttribute('aria-label',`${name} 그룹`);select.onchange=()=>{const target=Number(select.value)-1;groups[index]=groups[index].filter(n=>n!==name);groups[target].push(name);syncGroupResults();renderAssignments();};row.append(element('span','',name),select);card.append(row);});
    if(kind==='ladder'&&members.length){const editor=element('div','outcome-editor');editor.append(element('h4','',`결과 설정 · ${members.length}개`));groupResults[index].forEach((result,resultIndex)=>{const row=element('div','outcome-row'),label=element('label','',`결과 ${resultIndex+1}`),input=element('input');input.value=result;input.maxLength=30;input.placeholder='예: 10,000원, 꽝, 커피';input.setAttribute('aria-label',`${index+1}조 결과 ${resultIndex+1}`);input.oninput=()=>groupResults[index][resultIndex]=input.value;row.append(label,input);editor.append(row);});card.append(editor);}
    root.append(card);
  });
  const min=Math.min(...groups.map(g=>g.length));
  options($('#winner-count'),Math.max(1,min-1),'명',Number($('#winner-count').value)||1);
  $('#prepare').disabled=min<2;$('#setup-error').textContent=min<2?'모든 그룹에 참가자를 2명 이상 배정해주세요.':'';
}
function buildGroups(random=false){groups=splitGroups(names,Number($('#group-count').value),random);syncGroupResults(true);renderAssignments();}
function renderTabs(){const root=$('#group-tabs');root.replaceChildren();rounds.forEach((round,i)=>{const button=element('button','group-tab',`${i+1}조 · ${round.ladder.names.length}명${round.done?' ✓':''}`);button.setAttribute('aria-pressed',String(active===i));button.disabled=busy;button.onclick=()=>{active=i;renderPlay();};root.append(button);});$('#progress-label').textContent=`${rounds.filter(r=>r.done).length} / ${rounds.length}개 그룹 완료`;}
function svgElement(tag,attrs){const el=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,String(value)));return el;}
function drawBoard(round,animateStart=null){
  const {ladder}=round;const board=$('#ladder-board');board.replaceChildren();board.style.minWidth=`${Math.max(320,ladder.names.length*100)}px`;board.style.setProperty('--lanes',ladder.names.length);
  const top=element('div','ladder-labels');ladder.paths.forEach(path=>{const revealed=round.revealed.has(path.start),button=element('button',`ladder-name${revealed?' revealed':''}${animateStart===path.start?' tracing':''}`,revealed?`${path.name} · 확인 완료`:path.name);button.disabled=busy||revealed;button.setAttribute('aria-label',revealed?`${path.name} 결과 확인 완료`:`${path.name} 결과 확인`);button.onclick=()=>revealLadderPerson(path.start);top.append(button);});board.append(top);
  const width=ladder.names.length*100, height=460, x=lane=>lane*100+50, y=row=>12+row*436/(ladder.rows.length+1);
  const svg=svgElement('svg',{viewBox:`0 0 ${width} ${height}`,preserveAspectRatio:'none',class:'ladder-svg','aria-hidden':'true'});
  ladder.names.forEach((_,lane)=>svg.append(svgElement('line',{x1:x(lane),x2:x(lane),y1:y(0),y2:y(23),class:'ladder-rail'})));
  ladder.rows.forEach((bridges,row)=>bridges.forEach(lane=>svg.append(svgElement('line',{x1:x(lane),x2:x(lane+1),y1:y(row+1),y2:y(row+1),class:'ladder-bridge'}))));
  ladder.paths.filter(path=>round.revealed.has(path.start)||animateStart===path.start).forEach(path=>{const d=path.points.map(([lane,row],j)=>`${j?'L':'M'}${x(lane)},${y(row)}`).join(' ');svg.append(svgElement('path',{d,class:`ladder-path${animateStart===path.start?' animating':''}`,stroke:palette[path.start%palette.length],pathLength:1}));});
  board.append(svg);const bottom=element('div','ladder-labels');ladder.outputs.forEach((result,lane)=>{const revealed=ladder.paths.some(path=>path.end===lane&&round.revealed.has(path.start));bottom.append(element('div',`ladder-output${revealed?' revealed':''}`,revealed?result:'?'));});board.append(bottom);
  board.append(element('p','ladder-progress',`${round.revealed.size} / ${ladder.names.length}명 결과 확인`));
}
function revealLadderPerson(start){
  const round=rounds[active];if(busy||round.revealed.has(start))return;busy=true;round.lastRevealed=null;renderTabs();drawBoard(round,start);$('#reveal-bar').textContent='선택한 길을 따라가는 중…';
  setTimeout(()=>{round.revealed.add(start);round.lastRevealed=start;round.done=round.revealed.size===round.ladder.names.length;busy=false;renderPlay();renderResults();},matchMedia('(prefers-reduced-motion: reduce)').matches?0:2050);
}
function renderPlay(){
  if(isPinball){renderPinball();return;}
  if(isRoulette){renderRoulette();return;}
  if(isCards){renderCards();return;}
  if(isSlots){renderSlots();return;}
  renderTabs();const round=rounds[active];$('#group-kicker').textContent=`GROUP ${String(active+1).padStart(2,'0')}`;$('#active-group-title').textContent=`${active+1}조 · 이름을 눌러 결과 확인`;
  $('#run-group').hidden=true;
  $('#play-hint').textContent=round.done?'모든 참가자의 결과를 확인했어요. 아래 결과판에서 한눈에 볼 수 있어요.':'확인할 사람의 이름을 누르면 그 사람의 길만 따라가고 결과를 보여줘요.';
  const last=round.lastRevealed===null?null:round.ladder.paths.find(path=>path.start===round.lastRevealed);$('#reveal-bar').textContent=last?`${last.name} → ${last.result}`:'';
  $('#next-group').hidden=!round.done||rounds.every(r=>r.done);drawBoard(round);
}
function slotControls(round){
  $('#run-group').hidden=false;$('#run-group').disabled=busy||round.done;$('#run-group').textContent=round.done?'추첨 완료':busy?'슬롯 회전 중…':round.slots.winners.length?'다음 당첨자 뽑기':'레버 당기기';
  $('#reveal-bar').textContent=round.slots.winners.length?`★ ${round.slots.winners.join(', ')} 당첨!`:'';$('#next-group').hidden=!round.done||rounds.every(r=>r.done);
}
function renderSlots(){
  renderTabs();const round=rounds[active];$('#group-kicker').textContent=`GROUP ${String(active+1).padStart(2,'0')} · LUCKY SLOTS`;
  $('#active-group-title').textContent=`${active+1}조 · ${round.slots.names.length}명 중 ${round.slots.winnerCount}명 추첨`;
  $('#play-hint').textContent='세 개의 릴이 같은 이름에 멈추면 당첨이에요. 여러 명을 뽑을 때는 한 번씩 레버를 당겨주세요.';slotControls(round);
  slotView?.destroy();slotView=new SlotView($('#slot-stage'),round.slots,slots=>{busy=false;round.done=slots.done;round.ladder.paths=slots.names.map(name=>({name,winner:slots.winners.includes(name)}));$('#edit-setup').disabled=false;slotControls(round);renderTabs();renderResults();});
}
function renderCards(){
  renderTabs();const round=rounds[active];$('#group-kicker').textContent=`GROUP ${String(active+1).padStart(2,'0')} · PICK A CARD`;
  $('#active-group-title').textContent=`${active+1}조 · 이름 카드를 직접 뒤집어보세요`;
  $('#run-group').hidden=true;$('#play-hint').textContent=round.done?'모든 카드가 공개됐어요. 아래에서 그룹별 결과를 확인할 수 있어요.':'참가자 이름이 적힌 카드를 누르면 그 사람의 결과만 공개돼요.';
  $('#reveal-bar').textContent=round.lastCard?`${round.lastCard.name} → ${round.lastCard.winner?'★ 당첨':'꽝'}`:'';
  $('#next-group').hidden=!round.done||rounds.every(r=>r.done);
  cardView?.destroy();cardView=new CardView($('#card-stage'),round.cards,(state,card)=>{
    round.lastCard=card;round.done=state.done;round.ladder.paths=state.cards.map(item=>({name:item.name,winner:item.winner,revealed:item.revealed}));
    $('#reveal-bar').textContent=`${card.name} → ${card.winner?'★ 당첨':'꽝'}`;$('#next-group').hidden=!round.done||rounds.every(r=>r.done);
    renderTabs();renderResults();$('#card-stage .cards-progress').textContent=`${state.revealedCount} / ${state.cards.length}장 공개`;
  });
  $('#card-stage').append(element('p','cards-progress',`${round.cards.revealedCount} / ${round.cards.cards.length}장 공개`));
}
function renderPinball(){
  renderTabs();const round=rounds[active],map=MAPS.find(m=>m.id===round.race.map.id);
  $('#group-kicker').textContent=`GROUP ${String(active+1).padStart(2,'0')} · ${map.name}`;
  $('#active-group-title').textContent=`${active+1}조 · 먼저 도착한 ${round.winners}명 당첨`;
  $('#run-group').disabled=busy||round.done;$('#run-group').textContent=round.done?'레이스 완료':busy?'레이스 진행 중…':'이 그룹 출발!';
  $('#play-hint').textContent=`${map.name} · ${LENGTHS[round.race.map.length].label} · ${round.race.balls.length}명 참가. 모든 장애물이 이어지는 코스이며, 도착 시간은 경로에 따라 달라요.`;
  $('#reveal-bar').textContent=round.done?`★ ${round.ladder.paths.filter(p=>p.winner).map(p=>p.name).join(', ')} 당첨!`:'';
  $('#next-group').hidden=!round.done||rounds.every(r=>r.done);
  pinballView?.destroy();pinballView=new PinballView($('#pinball-stage'),round.race,round.winners,race=>{
    round.done=true;busy=false;round.ladder.paths=race.finished.map((ball,index)=>({name:ball.name,winner:index<round.winners,rank:index+1}));$('#edit-setup').disabled=false;
    $('#run-group').textContent='레이스 완료';$('#run-group').disabled=true;
    $('#reveal-bar').textContent=`★ ${round.ladder.paths.filter(p=>p.winner).map(p=>p.name).join(', ')} 당첨!`;
    $('#next-group').hidden=rounds.every(r=>r.done);renderTabs();renderResults();
  });
}
function rouletteControls(round){
  $('#run-group').disabled=busy||round.done;$('#run-group').textContent=round.done?'추첨 완료':busy?'룰렛이 돌아가는 중…':round.wheel.winners.length?'다음 당첨자 뽑기':'룰렛 돌리기';
  $('#reveal-bar').textContent=round.wheel.winners.length?`★ ${round.wheel.winners.join(', ')} 당첨!`:'';
  $('#next-group').hidden=!round.done||rounds.every(r=>r.done);
}
function renderRoulette(){
  renderTabs();const round=rounds[active];$('#group-kicker').textContent=`GROUP ${String(active+1).padStart(2,'0')} · ROULETTE`;
  $('#active-group-title').textContent=`${active+1}조 · ${round.wheel.names.length}명 중 ${round.wheel.winnerCount}명 추첨`;
  $('#play-hint').textContent='위쪽 화살표가 가리키는 사람이 당첨돼요. 여러 명을 뽑을 때는 한 번씩 돌려주세요.';rouletteControls(round);
  rouletteView?.destroy();rouletteView=new RouletteView($('#roulette-stage'),round.wheel,wheel=>{
    busy=false;round.done=wheel.done;round.ladder.paths=wheel.names.map(name=>({name,winner:wheel.winners.includes(name)}));
    $('#edit-setup').disabled=false;rouletteControls(round);renderTabs();renderResults();
  });
}
function renderResults(){
  const root=$('#result-grid');root.replaceChildren();const completed=rounds.filter(r=>r.done),revealedCount=kind==='ladder'?rounds.reduce((sum,r)=>sum+r.revealed.size,0):isCards?rounds.reduce((sum,r)=>sum+r.cards.revealedCount,0):0;$('#copy-results').disabled=(kind==='ladder'||isCards)?!revealedCount:!rounds.some(r=>r.done||r.wheel?.winners.length||r.slots?.winners.length);
  $('#result-summary').textContent=(kind==='ladder'||isCards)?(rounds.length?`${names.length}명 중 ${revealedCount}명의 결과를 확인했어요.`:`${kind==='ladder'?'사다리를 만들면':'카드를 준비하면'} 확인한 결과가 여기에 모여요.`):rounds.length?completed.length===rounds.length?`모든 그룹이 완료됐어요. 총 ${names.length}명 중 ${completed.reduce((sum,r)=>sum+r.ladder.paths.filter(p=>p.winner).length,0)}명이 당첨됐어요.`:`${rounds.length}개 그룹 중 ${completed.length}개 완료 · 미진행 그룹의 결과는 아직 공개되지 않았어요.`:'게임을 준비하면 각 그룹의 결과가 여기에 모여요.';
  rounds.forEach((round,i)=>{const card=element('article','result-card');const title=element('h3','',`${i+1}조`);title.append(element('span','small-label',`${round.ladder.names.length}명`));card.append(title);
    if(kind==='ladder'){const list=element('div','custom-result-list');round.ladder.paths.forEach(path=>{const revealed=round.revealed.has(path.start),row=element('div','custom-result-row');row.append(element('span','',path.name),element('span',revealed?'':'hidden-result',revealed?path.result:'미확인'));list.append(row);});card.append(list);}else if(isCards){const list=element('div','custom-result-list');round.ladder.paths.forEach(path=>{const row=element('div','custom-result-row');row.append(element('span','',path.name),element('span',path.revealed?(path.winner?'winner-card-result':''):'hidden-result',path.revealed?(path.winner?'★ 당첨':'꽝'):'미확인'));list.append(row);});card.append(list);}else if(round.done){card.append(element('div','winner-names',round.ladder.paths.filter(p=>p.winner).map(p=>p.name).join(', ')));const details=element('details');details.append(element('summary','','전체 참가자 결과'));round.ladder.paths.forEach(path=>{const row=element('div','result-row');row.append(element('span','',`${path.rank?path.rank+'위 · ':''}${path.name}`),element('span','',path.winner?'★ 당첨':'통과'));details.append(row);});card.append(details);}else if(round.wheel?.winners.length||round.slots?.winners.length){const draw=round.wheel||round.slots;card.append(element('div','winner-names',draw.winners.join(', ')),element('p','pending',`${draw.winnerCount-draw.winners.length}명 추가 추첨 대기`));}else card.append(element('p','pending','결과 대기 중'));root.append(card);
  });
}
$('#group-count').onchange=()=>buildGroups();$('#shuffle-groups').onclick=()=>{buildGroups(true);notify('참가자를 무작위로 나눴어요.');};
$('#prepare').onclick=()=>{
  const winners=Number($('#winner-count').value);if(kind==='ladder'&&groupResults.some((results,index)=>results.length!==groups[index].length||results.some(result=>!result.trim()))){notify('모든 결과 칸을 입력해주세요.');return;}if(kind!=='ladder'&&groups.some(g=>g.length<2||winners>=g.length)){notify('그룹 인원과 당첨 인원을 확인해주세요.');return;}
  rounds=groups.map((group,index)=>isPinball?{race:createRace(group,selectedMap(),$('#race-duration').value),winners,ladder:{names:[...group],paths:[]},done:false}:isRoulette?{wheel:createRoulette(group,winners),ladder:{names:[...group],paths:[]},done:false}:isCards?(()=>{const cards=createCardRound(group,winners);return{cards,ladder:{names:[...group],paths:cards.cards.map(card=>({name:card.name,winner:card.winner,revealed:false}))},lastCard:null,done:false};})():isSlots?{slots:createSlots(group,winners),ladder:{names:[...group],paths:[]},done:false}:{ladder:createResultLadder(group,groupResults[index]),revealed:new Set(),lastRevealed:null,done:false});active=0;$('#setup-controls').hidden=true;$('#locked-description').hidden=false;$('#locked-description').textContent=kind==='ladder'?`총 ${names.length}명 · ${groups.length}개 그룹 · 결과 직접 확인`:`총 ${names.length}명 · ${groups.length}개 그룹 · 그룹당 ${winners}명 당첨`;
  $('#edit-setup').hidden=false;$('#play-section').hidden=false;renderPlay();renderResults();$('#play-section').scrollIntoView({behavior:'smooth',block:'start'});
};
$('#run-group').onclick=()=>{
  if(busy||!rounds.length||rounds[active].done)return;
  if(kind==='ladder'||isCards)return;
  if(isPinball){busy=true;$('#edit-setup').disabled=true;$('#run-group').disabled=true;$('#run-group').textContent='레이스 진행 중…';renderTabs();pinballView.start();return;}
  if(isRoulette){busy=true;$('#edit-setup').disabled=true;rouletteControls(rounds[active]);renderTabs();rouletteView.spin();return;}
  if(isSlots){busy=true;$('#edit-setup').disabled=true;slotControls(rounds[active]);renderTabs();slotView.spin();return;}
  busy=true;const index=active;renderPlay();drawBoard(rounds[index],true);$('#edit-setup').disabled=true;
  setTimeout(()=>{rounds[index].done=true;busy=false;$('#edit-setup').disabled=false;renderPlay();renderResults();},matchMedia('(prefers-reduced-motion: reduce)').matches?0:2050);
};
$('#next-group').onclick=()=>{const next=rounds.findIndex((r,i)=>i>active&&!r.done);active=next>=0?next:rounds.findIndex(r=>!r.done);renderPlay();$('#play-section').scrollIntoView({behavior:'smooth'});};
$('#edit-setup').onclick=()=>$('#new-round-dialog').showModal();$('#cancel-new').onclick=()=>$('#new-round-dialog').close();
$('#confirm-new').onclick=()=>{pinballView?.destroy();rouletteView?.destroy();cardView?.destroy();slotView?.destroy();rounds=[];active=0;$('#new-round-dialog').close();$('#setup-controls').hidden=false;$('#locked-description').hidden=true;$('#edit-setup').hidden=true;$('#play-section').hidden=true;renderResults();$('#setup-title').scrollIntoView({behavior:'smooth'});};
$('#copy-results').onclick=async()=>{const text=kind==='ladder'?[`LuckyBox · ${titles[kind]}`,...rounds.flatMap((r,i)=>[`${i+1}조`,...r.ladder.paths.map(path=>`- ${path.name}: ${r.revealed.has(path.start)?path.result:'미확인'}`)])]:isCards?[`LuckyBox · ${titles[kind]}`,...rounds.flatMap((r,i)=>[`${i+1}조`,...r.ladder.paths.map(path=>`- ${path.name}: ${path.revealed?(path.winner?'당첨':'꽝'):'미확인'}`)])]:[`LuckyBox · ${titles[kind]}`,...rounds.map((r,i)=>{const draw=r.wheel||r.slots;return `${i+1}조: ${r.done?r.ladder.paths.filter(p=>p.winner).map(p=>p.name).join(', ')+' 당첨':draw?.winners.length?draw.winners.join(', ')+` 당첨 (${draw.winnerCount-draw.winners.length}명 추가 추첨 대기)`:'미진행'}`;})];try{await navigator.clipboard.writeText(text.join('\n'));notify('그룹별 결과를 복사했어요.');}catch{notify('복사 권한이 없어요. 결과의 텍스트를 직접 선택해 복사해주세요.');}};
document.title=`${titles[kind]||'게임'} · LuckyBox`;$('#game-title').textContent=titles[kind]||'게임';
if(kind==='ladder'){$('#winner-count-label').hidden=true;$('#game-subtitle').textContent='이름을 누르고, 그 사람의 길 끝에서 결과를 확인하세요.';$('#result-summary').textContent='사다리를 만들면 확인한 결과가 여기에 모여요.';}
if(isPinball){document.body.classList.add('pinball-mode');$('#game-subtitle').textContent='통통 튀고, 뒤집히고. 끝까지 눈을 뗄 수 없는 레이스.';$('#pinball-maps').hidden=false;$('#duration-label').hidden=false;selectedMap=mapPicker($('#pinball-maps'));$('.ladder-scroll').hidden=true;$('#pinball-stage').hidden=false;$('#prepare').textContent='이 구성으로 레이스 준비 →';$('#result-summary').textContent='레이스를 준비하면 각 그룹의 결과가 여기에 모여요.';}
if(isRoulette){document.body.classList.add('roulette-mode');$('#game-subtitle').textContent='빙글빙글, 한 바퀴의 설렘. 오늘의 행운을 돌려보세요.';$('.ladder-scroll').hidden=true;$('#roulette-stage').hidden=false;$('#prepare').textContent='이 구성으로 룰렛 준비 →';$('#result-summary').textContent='그룹별 당첨자가 여기에 모여요.';}
if(isCards){document.body.classList.add('cards-mode');$('#game-subtitle').textContent='한 장씩 직접 뒤집으며, 숨겨진 행운을 확인하세요.';$('.ladder-scroll').hidden=true;$('#card-stage').hidden=false;$('#prepare').textContent='이 구성으로 카드 섞기 →';$('#result-summary').textContent='카드를 준비하면 확인한 결과가 여기에 모여요.';}
if(isSlots){document.body.classList.add('slots-mode');$('#game-subtitle').textContent='세 개의 이름이 맞춰지는 순간, 행운의 주인공이 탄생합니다.';$('.ladder-scroll').hidden=true;$('#slot-stage').hidden=false;$('#prepare').textContent='이 구성으로 슬롯 준비 →';$('#result-summary').textContent='그룹별 당첨자가 여기에 모여요.';}
if(!['ladder','pinball','roulette','cards','slots'].includes(kind)){$('#unavailable').hidden=false;$('#results-link').hidden=true;$('#game-subtitle').textContent='새로운 랜덤 게임을 준비하고 있어요.';}
else if(names.length<2){$('#no-names').hidden=false;$('#results-link').hidden=true;}
else{$('#ladder-app').hidden=false;$('#total-count').textContent=`총 ${names.length}명`;options($('#group-count'),Math.min(10,Math.floor(names.length/2)),'개');buildGroups();}
window.addEventListener('beforeunload',event=>{if(rounds.length){event.preventDefault();event.returnValue='';}});
