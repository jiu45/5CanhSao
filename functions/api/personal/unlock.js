import { isConfigured, issueSession, json, pinAttemptGuard } from '../../../server/personalAuth.js';

export async function onRequestPost({ request, env }) {
  if (!isConfigured(env)) return json({ error: 'private_content_unavailable' }, 503);
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return json({ error: 'invalid_origin' }, 403);
  if (!request.headers.get('Content-Type')?.startsWith('application/json') ||
      Number(request.headers.get('Content-Length') ?? 0) > 256) {
    return json({ error: 'invalid_request' }, 400);
  }
  let pin;
  try { pin = (await request.json()).pin; } catch { return json({ error: 'invalid_request' }, 400); }
  if (typeof pin !== 'string' || !/^\d{4}$/.test(pin)) return json({ error: 'invalid_request' }, 400);
  const correct = pin === env.PERSONAL_PIN;
  if (!(await pinAttemptGuard(request, env, !correct))) {
    return json({ error: 'too_many_attempts' }, 429, { 'Retry-After': '900' });
  }
  if (!correct) return json({ error: 'wrong_pin' }, 401);
  const required = ['deck.json', 'letter.txt', 'photos/moon_bamboo.jpg',
    'photos/star_lantern.jpg', 'photos/lion_dance.png', 'photos/family_tray.jpg'];
  const available = await Promise.all(required.map(key => env.PERSONAL_CONTENT.head(key)));
  if (available.some(item => !item)) return json({ error: 'private_content_incomplete' }, 503);
  return json({ ok: true }, 200, { 'Set-Cookie': await issueSession(env) });
}
