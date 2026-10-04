import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

export function firebaseReady() {
  return Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
}
export function database() {
  if (!firebaseReady()) throw new Error('Firebase is not configured');
  const app = getApps().find(app => app.name === 'luckybox-analytics') || initializeApp({
    credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') })
  }, 'luckybox-analytics');
  return getFirestore(app);
}

// Transaction retries keep daily unique counts and cumulative totals consistent.
export async function recordVisit(db, day, id, page, now = Date.now()) {
  const daily = db.doc(`luckyboxDaily/${day}`), member = db.doc(`luckyboxDaily/${day}/visitors/${id}`);
  const totals = db.doc('luckyboxStats/totals');
  return db.runTransaction(async tx => {
    const [memberSnap, totalSnap] = await Promise.all([tx.get(member), tx.get(totals)]);
    const previous = memberSnap.exists ? memberSnap.data() : {};
    if (previous[page] !== undefined && now - previous[page] < 3000) return false;
    const unique = !memberSnap.exists;
    tx.set(member, { [page]: now, expiresAt: Timestamp.fromMillis(Date.parse(`${day}T00:00:00+09:00`) + 2 * 86400000) }, { merge: true });
    tx.set(daily, { date: day, views: FieldValue.increment(1), visitors: FieldValue.increment(unique ? 1 : 0) }, { merge: true });
    const first = totalSnap.data()?.first;
    tx.set(totals, { views: FieldValue.increment(1), visitorDays: FieldValue.increment(unique ? 1 : 0), first: first && first < day ? first : day }, { merge: true });
    return true;
  });
}
export async function readSummary(db, days, today) {
  const snapshots = await db.getAll(db.doc('luckyboxStats/totals'), ...days.map(day => db.doc(`luckyboxDaily/${day}`)));
  const totals = snapshots[0].data() || {};
  return { today, first: totals.first || null, totals: { views: Number(totals.views || 0), visitorDays: Number(totals.visitorDays || 0) },
    days: days.map((date, i) => ({ date, views: Number(snapshots[i + 1].data()?.views || 0), visitors: Number(snapshots[i + 1].data()?.visitors || 0) })) };
}
