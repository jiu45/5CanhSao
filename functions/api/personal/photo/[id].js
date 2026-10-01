import { PERSONAL_CARD_IDS, privateHeaders, requireSession, json } from '../../../../server/personalAuth.js';

export async function onRequestGet({ request, env, params }) {
  const denied = await requireSession(request, env);
  if (denied) return denied;
  const id = String(params.id ?? '');
  if (!PERSONAL_CARD_IDS.includes(id)) return json({ error: 'photo_not_found' }, 404);
  const filenames = { moon_bamboo: 'moon_bamboo.jpg', star_lantern: 'star_lantern.jpg',
    lion_dance: 'lion_dance.png', family_tray: 'family_tray.jpg' };
  const object = await env.PERSONAL_CONTENT.get(`photos/${filenames[id]}`);
  if (!object) return json({ error: 'photo_not_found' }, 404);
  const defaultTypes = { moon_bamboo: 'image/jpeg', star_lantern: 'image/jpeg',
    lion_dance: 'image/png', family_tray: 'image/jpeg' };
  const contentType = object.httpMetadata?.contentType ?? defaultTypes[id];
  if (!/^image\/(jpeg|png|webp|avif)$/.test(contentType)) {
    return json({ error: 'invalid_photo_type' }, 503);
  }
  return new Response(object.body, { headers: privateHeaders(contentType) });
}
