import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { firebaseReady, database, readSummary } from './firebase.mjs';

export const dayKey = (time = Date.now()) => new Date(time + 9 * 3600000).toISOString().slice(0, 10);
export const ready = () => Boolean(firebaseReady() && process.env.ADMIN_PASSWORD?.length >= 16);
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
  return readSummary(database(), days, today);
}
