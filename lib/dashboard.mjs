export function dashboard(payload) {
  const encoded = JSON.stringify(payload).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>LuckyBox 관리자</title>
<style>
:root{color-scheme:dark;font-family:system-ui,sans-serif;background:#090f1c;color:#edf4ff}*{box-sizing:border-box}body{margin:0}main{max-width:1100px;margin:auto;padding:36px 22px}header{display:flex;align-items:center;justify-content:space-between;gap:16px}h1{font-size:28px;margin:8px 0}h2{font-size:20px}p{color:#aac0d9;line-height:1.7}.eyebrow{color:#27d4ec;font-size:12px;letter-spacing:2px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:26px 0}.card,section{border:1px solid #27354d;background:#111c2f;border-radius:18px;padding:22px}.card span{display:block;color:#aac0d9;font-size:13px}.card strong{display:block;margin-top:12px;font-size:28px}.split{display:grid;grid-template-columns:1fr 1fr;gap:18px}label{display:block;color:#bbcee6;margin-bottom:16px;font-size:14px}input,select{display:block;width:100%;margin-top:8px;padding:11px;background:#090f1c;border:1px solid #3b4d69;border-radius:9px;color:#fff;font:inherit}button{padding:10px 16px;border:0;border-radius:9px;background:#20c7e6;color:#071222;font-weight:700;cursor:pointer}button:disabled{opacity:.5}.result{font-size:34px;color:#2cd6e9;margin:10px 0}.note{font-size:13px}.warning{padding:14px;border-radius:12px;background:#342715;color:#ffdc95}.table{overflow:auto}table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:right;padding:12px;border-bottom:1px solid #27354d}th:first-child,td:first-child{text-align:left}#bars{display:flex;gap:5px;height:120px;align-items:end;margin:18px 0}.bar{flex:1;background:#25bddc;border-radius:4px 4px 0 0;min-height:2px}.wide{margin-top:20px}@media(max-width:700px){.cards{grid-template-columns:repeat(2,1fr)}.split{grid-template-columns:1fr}main{padding:24px 14px}.card{padding:16px}.card strong{font-size:24px}}
</style></head><body><main><header><div><div class="eyebrow">LUCKYBOX · PRIVATE</div><h1>방문 통계와 수익 예상</h1></div><button id="refresh">통계 새로고침</button></header>
<p>한국 시간 기준 · 방문자는 당일 브라우저 중복을 제외한 추정치입니다.</p><div id="notice" hidden class="warning" role="status"></div>
<div class="cards"><div class="card"><span>오늘 방문자</span><strong id="today">—</strong></div><div class="card"><span>오늘 페이지 조회</span><strong id="views">—</strong></div><div class="card"><span>최근 7일 하루 평균</span><strong id="week">—</strong></div><div class="card"><span>최근 30일 하루 평균</span><strong id="month">—</strong></div></div>
<div class="split"><section><h2>광고 수익 계산</h2><p class="note">아직 광고를 게재하지 않아도 규모별 예상치를 비교할 수 있어요.</p><button id="use">실제 평균으로 계산</button>
<label>하루 평균 방문자<input id="daily" type="number" min="0" max="1000000000" step="1" value="100"></label><label>방문자 1명당 하루 페이지 조회<input id="pages" type="number" min="0.1" max="100" step="0.1" value="2"></label><label>페이지 RPM (조회 1,000회당 수익 · 달러)<input id="rpm" type="number" min="0" max="1000" step="0.1" value="1"></label><label>환율 (1달러당 원 · 직접 입력)<input id="fx" type="number" min="1" max="10000" step="1" value="1400"></label><label>월 운영비 (달러)<input id="cost" type="number" min="0" max="1000000" step="0.1" value="20"></label><p class="note">초기값은 계산용 가정입니다. 실제 광고 단가·환율·최종 청구액을 의미하지 않습니다.</p></section>
<section aria-live="polite"><h2>30일 기준 예상</h2><span>월 광고 수익</span><div id="revenue" class="result"></div><p id="won"></p><p id="pv"></p><h2>운영비를 뺀 예상 손익</h2><div id="profit" class="result"></div><p id="break"></p><h2>단가별 비교</h2><div class="table"><table><thead><tr><th>RPM 가정</th><th>월 수익</th><th>예상 손익</th></tr></thead><tbody id="scenarios"></tbody></table></div><p class="note">수익 = 방문자 × 1인당 조회 × 30일 ÷ 1,000 × 페이지 RPM. 광고 개수를 별도로 곱하지 않습니다. 세금 등은 운영비에 직접 포함해주세요. 실제 수익은 국가·광고 노출률·트래픽 품질에 따라 달라집니다.</p></section></div>
<section class="wide"><h2>일별 방문 기록</h2><p id="period" class="note"></p><div id="bars" aria-label="최근 일별 방문자 막대 그래프"></div><div class="table"><table><thead><tr><th>날짜 (한국 시간)</th><th>방문자</th><th>페이지 조회</th></tr></thead><tbody id="history"></tbody></table></div><p class="note">평균은 집계 시작 다음 날부터 어제까지의 완료된 날짜로 계산합니다. 방문이 없는 날도 포함하고, 오늘과 집계 이전 날짜는 제외합니다. 동일인이 다른 기기·브라우저를 사용하면 별도 방문자로 집계됩니다. 추적 차단·쿠키 차단·자동 방문 때문에 실제 사람 수와 차이가 날 수 있습니다. 원본 IP·참가자 이름을 저장하지 않으며, 집계 데이터는 90일 후 만료됩니다.</p></section>
</main><script>
let state=${encoded};
const $=id=>document.getElementById(id), num=v=>Number(v).toLocaleString('ko-KR',{maximumFractionDigits:1}), money=v=>'$'+Number(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
function completed(n){return state.data?.days.filter(d=>d.date<state.data.today&&d.date>state.data.first).slice(-n)||[]}
function average(n){const days=completed(n);return days.length?days.reduce((s,d)=>s+d.visitors,0)/days.length:null}
function render(){
 $('notice').hidden=!state.message;$('notice').textContent=state.message;
 const latest=state.data?.days.at(-1);$('today').textContent=latest?num(latest.visitors):'—';$('views').textContent=latest?num(latest.views):'—';
 for(const [id,n]of [['week',7],['month',30]]){$(id).textContent=average(n)===null?'—':num(average(n))+'명'}
 $('use').disabled=average(30)===null;
 $('period').textContent=state.data?.first?'집계 시작: '+state.data.first+' · 평균 대상 '+completed(30).length+'일':'저장소 연결 후 실제 데이터가 표시됩니다.';
 $('history').replaceChildren();$('bars').replaceChildren();
 const days=state.data?.days.filter(d=>d.date>=state.data.first)||[];const peak=Math.max(1,...days.map(d=>d.visitors));
 for(const day of [...days].reverse()){const row=document.createElement('tr');for(const value of [day.date+(day.date===state.data.today?' (집계 중)':''),num(day.visitors),num(day.views)]){const td=document.createElement('td');td.textContent=value;row.append(td)}$('history').append(row)}
 for(const day of days){const bar=document.createElement('div');bar.className='bar';bar.style.height=Math.max(2,day.visitors/peak*100)+'%';bar.title=day.date+': '+num(day.visitors)+'명';$('bars').append(bar)}
}
function calculate(){
 const ids=['daily','pages','rpm','fx','cost'];if(ids.some(id=>!$(id).checkValidity()||$(id).value===''))return;
 const [daily,pages,rpm,fx,cost]=ids.map(id=>Number($(id).value));const pv=daily*pages*30,revenue=pv/1000*rpm;
 $('revenue').textContent=money(revenue);$('won').textContent='약 '+num(revenue*fx)+'원';$('pv').textContent='월 예상 페이지 조회: '+num(pv)+'회';$('profit').textContent=money(revenue-cost)+' / 약 '+num((revenue-cost)*fx)+'원';
 $('break').textContent=cost===0?'월 운영비가 0달러입니다.':rpm>0?'손익분기 하루 방문자: 약 '+num(Math.ceil(cost*1000/(rpm*pages*30)))+'명':'RPM이 0이면 광고 수익으로 운영비를 충당할 수 없습니다.';
 $('scenarios').replaceChildren();for(const r of [.5,1,2]){const row=document.createElement('tr');for(const value of [money(r),money(pv/1000*r),money(pv/1000*r-cost)]){const td=document.createElement('td');td.textContent=value;row.append(td)}$('scenarios').append(row)}
}
$('use').onclick=()=>{const avg=average(30);if(avg===null)return;$('daily').value=Math.round(avg);const days=completed(30),uv=days.reduce((s,d)=>s+d.visitors,0),pv=days.reduce((s,d)=>s+d.views,0);$('pages').value=uv?Math.min(100,Math.max(.1,pv/uv)).toFixed(1):'1';calculate()};
for(const id of ['daily','pages','rpm','fx','cost'])$(id).addEventListener('input',calculate);
$('refresh').onclick=async()=>{$('refresh').disabled=true;try{const response=await fetch('/api/admin?data=1',{cache:'no-store'});if(!response.ok)throw Error();state=await response.json();render()}catch{$('notice').hidden=false;$('notice').textContent='새로고침에 실패했습니다. 로그인 또는 연결 상태를 확인해주세요.'}finally{$('refresh').disabled=false}};
render();calculate();
</script></body></html>`;
}
