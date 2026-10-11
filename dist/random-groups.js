(() => {
'use strict';
const form = document.getElementById('team-form');
const input = document.getElementById('team-names');
const countInput = document.getElementById('team-count');
const output = document.getElementById('team-results');
const status = document.getElementById('team-status');
const copy = document.getElementById('team-copy');
let resultText = '';
function clearResult() { resultText = ''; output.replaceChildren(); copy.disabled = true; status.textContent = ''; }
input.addEventListener('input', clearResult);
countInput.addEventListener('input', clearResult);
function randomInt(max) {
const limit = Math.floor(4294967296 / max) * max;
const value = new Uint32Array(1);
do { crypto.getRandomValues(value); } while (value[0] >= limit);
return value[0] % max;
}
form.addEventListener('submit', (event) => {
event.preventDefault();
clearResult();
const names = input.value.split(/[\n\r,]+/).map(name => name.trim()).filter(Boolean);
const count = Number(countInput.value);
if (names.length < 2 || names.length > 50) { status.textContent = '참가자를 2~50명 입력해주세요.'; return; }
if (names.some(name => name.length > 20)) { status.textContent = '이름은 20자 이하로 입력해주세요.'; return; }
if (new Set(names).size !== names.length) { status.textContent = '같은 이름은 별명을 붙여 구분해주세요.'; return; }
if (!Number.isInteger(count) || count < 1 || count > 10 || count > names.length) { status.textContent = '조 개수는 참가자 수 이하로, 1~10개 중 입력해주세요.'; return; }
try {
for (let i = names.length - 1; i > 0; i--) { const j = randomInt(i + 1); [names[i], names[j]] = [names[j], names[i]]; }
const teams = Array.from({length: count}, () => []);
names.forEach((name, index) => teams[index % count].push(name));
teams.forEach((team, index) => {
const card = document.createElement('section'); card.className = 'team-result';
const title = document.createElement('h3'); title.textContent = (index + 1) + '조 · ' + team.length + '명';
const list = document.createElement('ul');
team.forEach(name => { const item = document.createElement('li'); item.textContent = name; list.append(item); });
card.append(title, list); output.append(card);
});
resultText = teams.map((team, index) => (index + 1) + '조: ' + team.join(', ')).join('\n');
copy.disabled = false;
status.textContent = names.length + '명을 ' + count + '개 조로 배정했어요.';
} catch { status.textContent = '조 편성을 완료하지 못했어요. 브라우저를 확인하고 다시 시도해주세요.'; }
});
copy.addEventListener('click', async () => {
if (!resultText) return;
try { await navigator.clipboard.writeText(resultText); status.textContent = '결과를 복사했어요.'; }
catch { status.textContent = '자동 복사를 사용할 수 없어요. 화면의 결과를 직접 선택해 복사해주세요.'; }
});
})();
