const $ = (selector) => document.querySelector(selector);
const STORAGE_KEY = 'luckybox.participants.v1';
let names = [];
let selected = 'ladder';
let toastTimer;
const svg = (content) => `<svg viewBox="0 0 140 86" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${content}</svg>`;
const games = [
  { id:'ladder', title:'사다리 타기', english:'LADDER', description:'선을 따라 만나는 의외의 결과', detail:'각자의 길 끝에 어떤 결과가 기다릴까요?', color:'#f3efff', icon:'↟', art:svg('<g stroke="#9c87ee" stroke-width="4" stroke-linecap="round"><path d="M35 14v58M70 14v58M105 14v58M35 29h35M70 46h35M35 62h35"/></g><path d="M70 14v15H35v33h35v10" stroke="#6946ec" stroke-width="5" stroke-linejoin="round"/><g fill="#6946ec"><circle cx="70" cy="11" r="5"/><circle cx="70" cy="75" r="5"/></g>') },
  { id:'roulette', title:'룰렛', english:'ROULETTE', description:'빙글빙글, 행운의 한 바퀴', detail:'룰렛이 멈추는 순간, 오늘의 주인공을 만나요.', color:'#fff2e9', icon:'◉', art:svg('<circle cx="70" cy="44" r="33" fill="#ffd5aa"/><path d="M70 44V11a33 33 0 0 1 28.6 49.5Z" fill="#ff9e68"/><path d="m70 44 28.6 16.5a33 33 0 0 1-57.2 0Z" fill="#ffe6bd"/><path d="m70 44-28.6 16.5A33 33 0 0 1 70 11Z" fill="#ffc38f"/><circle cx="70" cy="44" r="9" fill="white"/><path d="m63 5 7 15 7-15" fill="#db7050"/>') },
  { id:'pinball', title:'핀볼', english:'PINBALL', description:'통통 튀는 예측 불가의 행운', detail:'장애물 사이를 통과하는 공의 도착지를 지켜보세요.', color:'#eaf8f5', icon:'⠿', art:svg('<g fill="#9acfc1"><circle cx="45" cy="30" r="4"/><circle cx="70" cy="30" r="4"/><circle cx="95" cy="30" r="4"/><circle cx="33" cy="48" r="4"/><circle cx="58" cy="48" r="4"/><circle cx="83" cy="48" r="4"/><circle cx="108" cy="48" r="4"/><circle cx="45" cy="66" r="4"/><circle cx="70" cy="66" r="4"/><circle cx="95" cy="66" r="4"/></g><path d="m62 8 8 10-13 19 12 12" stroke="#2baf8a" stroke-width="2" stroke-dasharray="3 4"/><circle cx="70" cy="51" r="7" fill="#32b590"/>') },
  { id:'cards', title:'카드 뒤집기', english:'CARDS', description:'두근두근, 한 장에 담긴 반전', detail:'숨겨진 카드 속에서 행운의 결과를 찾아보세요.', color:'#edf4ff', icon:'♧', art:svg('<rect x="29" y="18" width="38" height="55" rx="6" transform="rotate(-14 29 18)" fill="#afcafa"/><rect x="54" y="12" width="38" height="57" rx="6" fill="#74a4ee"/><rect x="78" y="15" width="38" height="57" rx="6" transform="rotate(13 78 15)" fill="#4c84db"/><path d="m92 34 5 11-5 11-5-11Z" fill="#dceaff"/>') },
  { id:'slots', title:'슬롯 머신', english:'SLOTS', description:'이름이 멈추는 순간, 주인공은?', detail:'돌아가는 이름 사이에서 행운의 주인공을 뽑아요.', color:'#fff0f5', icon:'≋', art:svg('<rect x="20" y="20" width="100" height="48" rx="9" fill="#e795b5"/><g fill="#fff8fb"><rect x="27" y="27" width="25" height="34" rx="4"/><rect x="57" y="27" width="25" height="34" rx="4"/><rect x="87" y="27" width="25" height="34" rx="4"/></g><g fill="#d77aa2" font-family="sans-serif" font-size="25" font-weight="bold"><text x="32" y="53">7</text><text x="62" y="53">7</text><text x="92" y="53">7</text></g>') }
];
function notify(message) { $('#toast').textContent=message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3000); }
function save() { try { localStorage.setItem(STORAGE_KEY,JSON.stringify(names)); } catch { $('#save-note').textContent='자동 저장을 사용할 수 없어요. 이 창을 닫으면 명단이 사라집니다.'; } }
function renderNames() {
  $('#count').textContent=names.length; $('#reset').disabled=!names.length;
  const list=$('#name-list'); list.replaceChildren();
  if(!names.length) { list.innerHTML='<div class="empty"><span>＋</span>아직 참가자가 없어요.<br>첫 번째 이름을 추가해보세요.<button id="sample">예시 명단으로 둘러보기</button></div>'; $('#sample').onclick=()=>addNames(['민수','지은','서준','하린','도윤','수빈']); return; }
  names.forEach((name,index)=> { const row=document.createElement('div'); row.className='name-row'; const avatar=document.createElement('span'); avatar.className='avatar'; avatar.textContent=String(index+1).padStart(2,'0'); const label=document.createElement('span'); label.className='name-label'; label.textContent=name; const remove=document.createElement('button'); remove.className='remove'; remove.textContent='×'; remove.setAttribute('aria-label',`${name} 삭제`); remove.onclick=()=>{names.splice(index,1);save();renderNames(); const next=list.querySelectorAll('.remove'); (next[Math.min(index,next.length-1)] || $('#name-input')).focus();}; row.append(avatar,label,remove); list.append(row); });
}
function addNames(values) {
  const incoming=values.map(v=>v.trim()).filter(Boolean);
  if(!incoming.length) { notify('추가할 이름을 입력해주세요.'); return false; }
  if(incoming.some(n=>n.length>20)) {notify('이름은 20자 이내로 입력해주세요.'); return false;}
  const unique=[...new Set(incoming)]; const fresh=unique.filter(n=>!names.includes(n));
  if(names.length+fresh.length>50) {notify('참가자는 최대 50명까지 추가할 수 있어요.');return false;}
  if(!fresh.length) {notify('이미 있는 이름이에요. 구분할 별명을 붙여주세요.');return false;}
  names.push(...fresh); save(); renderNames(); notify(`${fresh.length}명을 추가했어요.${fresh.length<incoming.length?' 중복 이름은 제외했어요.':''}`); return true;
}
function selectGame(id) {const game=games.find(g=>g.id===id);if(!game)throw new Error('알 수 없는 게임입니다.');selected=id;document.querySelectorAll('.game-card').forEach(card=>card.setAttribute('aria-pressed',String(card.dataset.game===id)));$('#selection-title').textContent=game.title;$('#selection-description').textContent=game.detail;$('#selection-icon').textContent=game.icon;}
$('#game-grid').innerHTML=games.map((g,i)=>`<button class="game-card" data-game="${g.id}" aria-pressed="false"><div class="card-top"><span class="game-number">GAME 0${i+1}</span><span class="radio"></span></div><div class="game-art" style="background:${g.color}">${g.art}</div><h3>${g.title}<span class="english">${g.english}</span></h3><p>${g.description}</p></button>`).join('');
document.querySelectorAll('.game-card').forEach(card=>card.onclick=()=>{save();location.href=`game.html?game=${card.dataset.game}`;});
$('#name-form').onsubmit=event=>{event.preventDefault();if(addNames([$('#name-input').value]))$('#name-input').value='';$('#name-input').focus();};
$('#bulk-open').onclick=()=>$('#bulk-dialog').showModal();
$('#bulk-form').onsubmit=event=>{event.preventDefault();if(addNames($('#bulk-input').value.split(/[\n,\r]+/))){$('#bulk-input').value='';$('#bulk-dialog').close();}};
$('#help').onclick=()=>$('#help-dialog').showModal();
$('#reset').onclick=()=>$('#reset-dialog').showModal();
$('#reset-confirm').onclick=()=>{names=[];save();renderNames();$('#reset-dialog').close();$('#name-input').focus();notify('참가자 명단을 지웠어요.');};
document.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>document.getElementById(button.dataset.close).close());
try { const stored=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); if(Array.isArray(stored))names=[...new Set(stored.filter(n=>typeof n==='string'&&n.trim()&&n.trim().length<=20).map(n=>n.trim()))].slice(0,50); }catch{ /* A damaged or unavailable local list starts empty. */ }
renderNames();selectGame(selected);
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'get_luckybox_setup',description:'Read the participant list and available games. All five games are playable on their dedicated pages.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:()=>({participants:[...names],availableGames:['ladder','pinball','roulette','cards','slots']})})).catch(()=>{});}catch{}}
