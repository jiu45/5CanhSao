import { privateHeaders, requireSession, json } from '../../../server/personalAuth.js';

export async function onRequestGet({ request, env }) {
  const denied = await requireSession(request, env);
  if (denied) return denied;
  const object = await env.PERSONAL_CONTENT.get('letter.txt');
  if (!object) return json({ error: 'private_content_unavailable' }, 503);
  return new Response(object.body, {
    headers: privateHeaders('text/plain; charset=utf-8')
  });
}
