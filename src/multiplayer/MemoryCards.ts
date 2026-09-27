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

let deckPromise: Promise<MemoryDeck> | null = null;
let photoPromise: Promise<void> | null = null;
const decodedPhotos = new Map<string, HTMLImageElement>();

/** Edit only public/assets/memories/manifest.json to replace sample art with personal images. */
async function fetchMemoryDeck(): Promise<MemoryDeck> {
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

export function loadMemoryDeck(): Promise<MemoryDeck> {
  if (!deckPromise) {
    deckPromise = fetchMemoryDeck().catch(error => {
      deckPromise = null;
      throw error;
    });
  }
  return deckPromise;
}

/** Fetch and decode personal photographs during Phase 5, before the Moon Alcove. */
export function preloadMemoryDeck(): Promise<void> {
  if (photoPromise) return photoPromise;
  photoPromise = loadMemoryDeck().then(async deck => {
    await Promise.all(deck.cards.map(async card => {
      const image = new Image();
      image.decoding = 'async';
      image.src = card.imageSrc;
      try {
        await image.decode();
        decodedPhotos.set(card.imageSrc, image);
      } catch (error) {
        console.warn('[Memory Cards] Photo preload skipped:', card.id, error);
      }
    }));
  }).catch(error => {
    photoPromise = null;
    throw error;
  });
  return photoPromise;
}
