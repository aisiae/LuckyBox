import { ready, dayKey, visitor } from '../lib/analytics.mjs';
import { database, recordVisit } from '../lib/firebase.mjs';

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
    await recordVisit(database(), day, id, page);
    res.statusCode = 204; res.end();
  } catch { res.statusCode = 503; res.end(); }
}
