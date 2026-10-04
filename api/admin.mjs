import { authenticated, ready, summary } from '../lib/analytics.mjs';
import { dashboard } from '../lib/dashboard.mjs';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
  if (req.method !== 'GET') { res.statusCode = 405; res.setHeader('Allow', 'GET'); return res.end(); }
  if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 16) {
    res.statusCode = 503; return res.end('Administrator access is not configured.');
  }
  if (!authenticated(req)) {
    res.statusCode = 401; res.setHeader('WWW-Authenticate', 'Basic realm="LuckyBox Admin", charset="UTF-8"');
    return res.end('Authentication required.');
  }
  let data = null, message = '';
  if (!ready()) message = '통계 저장소가 연결되지 않았습니다. 연결 후 방문 집계가 시작됩니다.';
  else try { data = await summary(); } catch { message = '통계를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'; }
  if (new URL(req.url, 'http://localhost').searchParams.has('data')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ data, message }));
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(dashboard({ data, message }));
}
