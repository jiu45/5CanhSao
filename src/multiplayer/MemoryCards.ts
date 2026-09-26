export interface MemoryCard {
  id: string;
  imageSrc: string;
  caption?: string;
  alt?: string;
  displayOrder: number;
}

export interface MemoryRound {
  id: string;
  viewerRole: 'host' | 'guest';
  targetCardId: string;
  choiceCardIds: string[];
}

export interface MemoryDeck {
  cards: MemoryCard[];
  rounds: MemoryRound[];
}

/** Edit only public/assets/memories/manifest.json to replace sample art with personal images. */
export async function loadMemoryDeck(): Promise<MemoryDeck> {
  const response = await fetch('/assets/memories/manifest.json');
  if (!response.ok) throw new Error('Memory manifest unavailable');
  const deck = await response.json() as MemoryDeck;
  if (!Array.isArray(deck.cards) || deck.cards.length < 4 || !Array.isArray(deck.rounds) || deck.rounds.length < 2) {
    throw new Error('Memory manifest needs four cards and two rounds');
  }
  const ids = new Set(deck.cards.map(card => card.id));
  if (ids.size !== deck.cards.length || deck.cards.some(card => !card.id || !card.imageSrc?.startsWith('/assets/memories/'))) {
    throw new Error('Invalid memory card IDs or local paths');
  }
  for (const [index, round] of deck.rounds.slice(0, 2).entries()) {
    if (round.viewerRole !== (index === 0 ? 'host' : 'guest') ||
      !ids.has(round.targetCardId) || round.choiceCardIds.length !== 4 ||
      new Set(round.choiceCardIds).size !== 4 ||
      !round.choiceCardIds.every(id => ids.has(id) && id !== '') ||
      !round.choiceCardIds.includes(round.targetCardId)) {
      throw new Error(`Invalid memory round ${index + 1}`);
    }
  }
  return deck;
}
