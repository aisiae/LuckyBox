// Rejection sampling avoids modulo bias for every random choice.
export function randomInt(max) {
  if (!Number.isInteger(max) || max < 1) throw new Error('Invalid random range');
  const limit = Math.floor(4294967296 / max) * max;
  const value = new Uint32Array(1);
  do { crypto.getRandomValues(value); } while (value[0] >= limit);
  return value[0] % max;
}
export function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function splitGroups(names, count, random = false) {
  if (!Number.isInteger(count) || count < 1 || count > Math.floor(names.length / 2)) throw new Error('그룹마다 2명 이상이 필요해요.');
  const groups = Array.from({ length: count }, () => []);
  (random ? shuffle(names) : names).forEach((name, i) => groups[i % count].push(name));
  return groups;
}
function createWithOutputs(names, outputs) {
  const rows = Array.from({ length: 22 }, () => {
    const bridges = [];
    for (let i = 0; i < names.length - 1; i++) {
      if (randomInt(3) !== 0) { bridges.push(i); i++; }
    }
    return bridges;
  });
  const paths = names.map((name, start) => {
    let lane = start;
    const points = [[lane, 0]];
    rows.forEach((bridges, row) => {
      points.push([lane, row + 1]);
      if (bridges.includes(lane)) lane++;
      else if (bridges.includes(lane - 1)) lane--;
      points.push([lane, row + 1]);
    });
    points.push([lane, rows.length + 1]);
    return { name, start, end: lane, result: outputs[lane], winner: outputs[lane] === true || (typeof outputs[lane] === 'string' && outputs[lane] !== '꽝'), points };
  });
  return { names: [...names], rows, outputs, paths };
}
export function createLadder(names, winnerCount) {
  if (names.length < 2 || !Number.isInteger(winnerCount) || winnerCount < 1 || winnerCount >= names.length) throw new Error('당첨 인원은 참가자 수보다 적어야 해요.');
  return createWithOutputs(names, shuffle(names.map((_, i) => i < winnerCount)));
}
export function createResultLadder(names, results) {
  if (names.length < 2 || results.length !== names.length || results.some(result => typeof result !== 'string' || !result.trim() || result.trim().length > 30)) throw new Error('참가자 수만큼 1~30자의 결과를 입력해주세요.');
  return createWithOutputs(names, shuffle(results.map(result => result.trim())));
}
