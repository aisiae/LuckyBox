import { ready, redis, dayKey, visitor } from '../lib/analytics.mjs';

// The atomic script prevents reload bursts from incrementing the same page repeatedly.
const script = `if redis.call('SET', KEYS[3], '1', 'EX', 3, 'NX') then
redis.call('INCR', KEYS[1]); redis.call('PFADD', KEYS[2], ARGV[1]);
redis.call('EXPIRE', KEYS[1], 7776000); redis.call('EXPIRE', KEYS[2], 7776000);
redis.call('SET', 'lb:first', ARGV[2], 'NX'); return 1; end; return 0`;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.statusCode = 405; res.setHeader('Allow', 'POST'); return res.end(); }
  if (!ready()) { res.statusCode = 503; return res.end(); }
  try {
    const origin = req.headers.origin;
    if (!origin || new URL(origin).host !== req.headers.host || req.headers['sec-fetch-site'] === 'cross-site') { res.statusCode = 403; return res.end(); }
    if (req.headers.dnt === '1' || req.headers['sec-gpc'] === '1') { res.statusCode = 204; return res.end(); }
    const page = req.headers['x-luckybox-page'];
    if (!['home', 'game'].includes(page)) { res.statusCode = 400; return res.end(); }
    const day = dayKey(), id = visitor(req, res);
    await redis([['EVAL', script, 3, `lb:pv:${day}`, `lb:uv:${day}`, `lb:cooldown:${day}:${id}:${page}`, id, day]]);
    res.statusCode = 204; res.end();
  } catch { res.statusCode = 503; res.end(); }
}
