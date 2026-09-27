import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCardRound, revealCard } from './dist/card-engine.mjs';

test('cards contain the requested number of winners and reveal once', () => {
  const round = createCardRound(['민수', '지은', '서준', '하린'], 2);
  assert.equal(round.cards.filter(card => card.winner).length, 2);
  assert.deepEqual(round.cards.map(card => card.name), ['민수', '지은', '서준', '하린']);
  const card = revealCard(round, 0);
  assert.equal(card.revealed, true);
  assert.equal(round.revealedCount, 1);
  assert.throws(() => revealCard(round, 0));
  round.cards.slice(1).forEach(item => revealCard(round, item.id));
  assert.equal(round.done, true);
});

test('cards reject invalid configurations', () => {
  assert.throws(() => createCardRound(['한명'], 1));
  assert.throws(() => createCardRound(['a', 'a'], 1));
  assert.throws(() => createCardRound(['a', 'b'], 2));
});
