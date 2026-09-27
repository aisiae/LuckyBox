import { revealCard } from './card-engine.mjs';

const make = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

export class CardView {
  constructor(root, state, onReveal) {
    this.root = root;
    this.state = state;
    this.onReveal = onReveal;
    this.render();
  }

  render() {
    this.root.replaceChildren();
    const grid = make('div', 'card-grid');
    this.state.cards.forEach(card => {
      const button = make('button', `flip-card${card.revealed ? ' is-revealed' : ''}`);
      button.type = 'button';
      button.disabled = card.revealed;
      button.setAttribute('aria-label', card.revealed ? `${card.name}, ${card.winner ? '당첨' : '꽝'}` : `${card.name} 카드 뒤집기`);
      button.setAttribute('aria-pressed', String(card.revealed));
      const inner = make('span', 'flip-card-inner');
      const back = make('span', 'flip-card-face flip-card-back');
      back.setAttribute('aria-hidden', 'true');
      back.append(make('span', 'card-mark', '✦'), make('strong', '', card.name), make('small', '', 'TAP TO REVEAL'));
      const front = make('span', `flip-card-face flip-card-front ${card.winner ? 'winner' : 'blank'}`);
      front.setAttribute('aria-hidden', 'true');
      front.append(make('span', 'card-result-icon', card.winner ? '★' : '◇'), make('strong', '', card.winner ? '당첨' : '꽝'), make('small', '', card.name));
      inner.append(back, front);button.append(inner);
      button.onclick = () => {
        const revealed = revealCard(this.state, card.id);
        button.classList.add('is-revealed');button.disabled = true;button.setAttribute('aria-pressed', 'true');
        button.setAttribute('aria-label', `${revealed.name}, ${revealed.winner ? '당첨' : '꽝'}`);
        this.onReveal(this.state, revealed);
      };
      grid.append(button);
    });
    this.root.append(grid);
  }

  destroy() { this.root.replaceChildren(); }
}
