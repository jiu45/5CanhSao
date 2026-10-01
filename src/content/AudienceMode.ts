import type { MemoryDeck } from '../multiplayer/MemoryCards';
import { defaultWish } from './default-wish';

export type AudienceMode = 'guest' | 'personal';
export class AudienceAccessError extends Error {}

let mode: AudienceMode = 'guest';
let personalDeck: MemoryDeck | null = null;
let personalWish: string | null = null;

export function getAudienceMode(): AudienceMode { return mode; }
export function getFinalWishText(): string {
  return mode === 'personal' && personalWish ? personalWish : defaultWish;
}
export function getPersonalDeck(): MemoryDeck | null {
  return mode === 'personal' ? personalDeck : null;
}

export function chooseGuest(): void {
  mode = 'guest';
  personalDeck = null;
  personalWish = null;
}

export async function unlockPersonal(pin: string): Promise<void> {
  if (!/^\d{4}$/.test(pin)) throw new AudienceAccessError('Hãy nhập đủ bốn chữ số.');
  const response = await fetch('/api/personal/unlock', {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }), signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) {
    if (response.status === 401) throw new AudienceAccessError('Mã chưa đúng. Thử lại nhé.');
    if (response.status === 429) throw new AudienceAccessError('Đã thử nhiều lần. Hãy đợi một lát rồi thử lại.');
    throw new AudienceAccessError('Chưa thể mở phần dành riêng lúc này. Bạn vẫn có thể vào chơi thử.');
  }
  const [deckResponse, wishResponse] = await Promise.all([
    fetch('/api/personal/deck', { credentials: 'same-origin', signal: AbortSignal.timeout(12000) }),
    fetch('/api/personal/letter', { credentials: 'same-origin', signal: AbortSignal.timeout(12000) })
  ]);
  if (!deckResponse.ok || !wishResponse.ok) {
    throw new AudienceAccessError('Ký ức riêng chưa sẵn sàng. Bạn hãy thử lại sau.');
  }
  const deck = await deckResponse.json() as MemoryDeck;
  const wish = (await wishResponse.text()).trim();
  if (!Array.isArray(deck.cards) || deck.cards.length !== 4 || !wish) {
    throw new AudienceAccessError('Ký ức riêng chưa đầy đủ. Bạn hãy thử lại sau.');
  }
  personalDeck = deck;
  personalWish = wish;
  mode = 'personal';
}
