import { PERSONAL_CARD_IDS, json, requireSession } from '../../../server/personalAuth.js';

export async function onRequestGet({ request, env }) {
  const denied = await requireSession(request, env);
  if (denied) return denied;
  const object = await env.PERSONAL_CONTENT.get('deck.json');
  if (!object) return json({ error: 'private_content_unavailable' }, 503);
  try {
    const source = JSON.parse(await object.text());
    if (!Array.isArray(source.cards) || source.cards.length !== 4 ||
        !Array.isArray(source.rounds) || source.rounds.length !== 2 ||
        source.cards.some(card => !PERSONAL_CARD_IDS.includes(card.id)) ||
        new Set(source.cards.map(card => card.id)).size !== 4) {
      return json({ error: 'invalid_private_deck' }, 503);
    }
    const cards = source.cards.map(card => ({
      id: card.id, imageSrc: `/api/personal/photo/${card.id}`,
      caption: String(card.caption ?? '').slice(0, 100),
      alt: String(card.alt ?? '').slice(0, 200),
      displayOrder: Number(card.displayOrder) || 1
    }));
    return json({ cards, rounds: source.rounds });
  } catch {
    return json({ error: 'invalid_private_deck' }, 503);
  }
}
