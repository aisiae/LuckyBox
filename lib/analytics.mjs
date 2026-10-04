import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export const dayKey = (time = Date.now()) => new Date(time + 9 * 3600000).toISOString().slice(0, 10);
export const ready = () => Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN && process.env.ADMIN_PASSWORD?.length >= 16);
export async function redis(commands) {
  const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL.replace(/\/$/, '')}/pipeline`, {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands), signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) throw new Error('Storage unavailable');
  const results = await response.json();
  if (results.some(item => item.error)) throw new Error('Storage command failed');
  return results.map(item => item.result);
}
export function authenticated(req) {
  if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 16) return false;
  const header = req.headers.authorization || '';
  if (!header.startsWith('Basic ')) return false;
  const supplied = Buffer.from(header.slice(6), 'base64');
  const expected = Buffer.from(`${process.env.ADMIN_USERNAME || 'admin'}:${process.env.ADMIN_PASSWORD}`);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
const sign = value => createHmac('sha256', process.env.ADMIN_PASSWORD).update(value).digest('hex');
export function visitor(req, res) {
  const today = dayKey();
  const raw = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith('lb_visit='))?.slice(9);
  const [date, id, signature] = (raw || '').split('.');
  if (date === today && /^[a-f0-9-]{36}$/.test(id || '') && signature === sign(`${date}.${id}`)) return id;
  const next = randomUUID();
  const ttl = Math.max(1, Math.floor((Date.parse(`${today}T00:00:00+09:00`) + 86400000 - Date.now()) / 1000));
  const secure = process.env.VERCEL || req.headers['x-forwarded-proto'] === 'https';
  res.setHeader('Set-Cookie', `lb_visit=${today}.${next}.${sign(`${today}.${next}`)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ttl}${secure ? '; Secure' : ''}`);
  return next;
}
export async function summary() {
  const today = dayKey();
  const days = Array.from({ length: 31 }, (_, i) => dayKey(Date.now() - (30 - i) * 86400000));
  const results = await redis([['GET', 'lb:first'], ...days.flatMap(day => [['GET', `lb:pv:${day}`], ['PFCOUNT', `lb:uv:${day}`]])]);
  return { today, first: results[0], days: days.map((date, i) => ({ date, views: Number(results[i * 2 + 1] || 0), visitors: Number(results[i * 2 + 2] || 0) })) };
}
