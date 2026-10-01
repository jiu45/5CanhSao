const COOKIE_NAME = 'moon_personal';
const SESSION_SECONDS = 24 * 60 * 60;
const enc = new TextEncoder();

export const PERSONAL_CARD_IDS = ['moon_bamboo', 'star_lantern', 'lion_dance', 'family_tray'];

export function privateHeaders(contentType) {
  return {
    'Content-Type': contentType,
    'Cache-Control': 'private, no-store, max-age=0',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
  };
}

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...privateHeaders('application/json; charset=utf-8'), ...extraHeaders }
  });
}

export function isConfigured(env) {
  return /^\d{4}$/.test(env?.PERSONAL_PIN ?? '') &&
    typeof env?.PERSONAL_SESSION_SECRET === 'string' &&
    env.PERSONAL_SESSION_SECRET.length >= 32 && !!env?.PERSONAL_CONTENT;
}

function base64url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid token');
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

async function signingKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function issueSession(env) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const nonce = base64url(crypto.getRandomValues(new Uint8Array(16)));
  const payload = base64url(enc.encode(`${expiresAt}.${nonce}`));
  const signature = base64url(new Uint8Array(await crypto.subtle.sign('HMAC',
    await signingKey(env.PERSONAL_SESSION_SECRET), enc.encode(payload))));
  return `${COOKIE_NAME}=${payload}.${signature}; Path=/api/personal; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
}

export async function hasPersonalSession(request, env) {
  if (!isConfigured(env)) return false;
  const cookie = request.headers.get('Cookie')?.split(';')
    .map(part => part.trim()).find(part => part.startsWith(`${COOKIE_NAME}=`));
  const token = cookie?.slice(COOKIE_NAME.length + 1);
  if (!token) return false;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return false;
  try {
    const [expiry] = new TextDecoder().decode(fromBase64url(payload)).split('.');
    if (!/^\d+$/.test(expiry) || Number(expiry) < Date.now() / 1000) return false;
    return await crypto.subtle.verify('HMAC', await signingKey(env.PERSONAL_SESSION_SECRET),
      fromBase64url(signature), enc.encode(payload));
  } catch {
    return false;
  }
}

export function requireSession(request, env) {
  return hasPersonalSession(request, env).then(valid =>
    valid ? null : json({ error: 'private_content_locked' }, 401));
}

/** Five failed attempts per network address in fifteen minutes. R2 remains private. */
export async function pinAttemptGuard(request, env, failed) {
  const address = request.headers.get('CF-Connecting-IP') ?? 'local';
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(address));
  const key = `_pin_attempts/${base64url(new Uint8Array(digest))}`;
  const now = Date.now();
  const record = await env.PERSONAL_CONTENT.get(key);
  let attempts = 0;
  let resetAt = now + 15 * 60 * 1000;
  if (record) {
    try {
      const previous = JSON.parse(await record.text());
      if (Number(previous.resetAt) > now) {
        attempts = Number(previous.attempts) || 0;
        resetAt = Number(previous.resetAt);
      }
    } catch { /* A malformed record is replaced below. */ }
  }
  if (attempts >= 5) return false;
  if (failed) {
    await env.PERSONAL_CONTENT.put(key, JSON.stringify({ attempts: attempts + 1, resetAt }));
  } else if (record) {
    await env.PERSONAL_CONTENT.delete(key);
  }
  return true;
}
