import { shuffle } from './ladder-engine.mjs';

export function createCardRound(names, winnerCount) {
  if (names.length < 2 || names.length > 50 || new Set(names).size !== names.length || !Number.isInteger(winnerCount) || winnerCount < 1 || winnerCount >= names.length) {
    throw new Error('잘못된 카드 게임 설정');
  }
  const outcomes = shuffle(names.map((_, index) => index < winnerCount));
  return {
    cards: names.map((name, index) => ({ id: index, name, winner: outcomes[index], revealed: false })),
    winnerCount,
    revealedCount: 0,
    done: false
  };
}

export function revealCard(round, id) {
  const card = round.cards.find(item => item.id === id);
  if (!card || card.revealed || round.done) throw new Error('지금은 이 카드를 뒤집을 수 없어요.');
  card.revealed = true;
  round.revealedCount += 1;
  round.done = round.revealedCount === round.cards.length;
  return card;
}
