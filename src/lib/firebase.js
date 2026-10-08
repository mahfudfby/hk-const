/**
 * AKSES DATA FIRESTORE — ringan lebih dulu, SDK hanya bila perlu.
 *
 * Latar belakang: seluruh isi website disimpan dalam SATU dokumen Firestore. Untuk membaca satu
 * dokumen, SDK Firebase harus diunduh dan di-parse lebih dulu — sekitar 470 KB (±148 KB gzip).
 * Itu beban besar untuk setiap pengunjung, terutama di koneksi lambat.
 *
 * Maka urutannya:
 *   1. REST API Firestore lewat `fetch` biasa — nol kilobyte pustaka tambahan.
 *   2. Kalau REST gagal karena alasan apa pun (CORS, aturan keamanan, format tak terduga),
 *      SDK resmi diunduh sebagai cadangan dan dipakai persis seperti sebelumnya.
 * Jadi jalur cepat tidak mengorbankan keandalan: bila jalur ringan bermasalah, aplikasi tetap jalan.
 *
 * Aturan keamanan (Firestore Rules) berlaku sama untuk REST maupun SDK — API key bukan rahasia,
 * ia hanya menandai project; yang menentukan boleh/tidaknya baca-tulis tetap Rules di server.
 *
 * Firebase Auth (login Google admin) selalu lewat SDK, dimuat hanya saat tombolnya ditekan.
 */
import { FIREBASE_CONFIG, FS_COLLECTION } from "../config/infra.js";

export { FS_COLLECTION };

const REST_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;
const REST_KEY = FIREBASE_CONFIG.apiKey;

/** Disetel true begitu REST terbukti tidak bisa dipakai di sesi ini → langsung pakai SDK. */
let restUnavailable = false;

/* ───────────────────────── Jalur ringan: REST ───────────────────────── */

function decodeValue(v) {
  if (!v || typeof v !== "object") return undefined;
  if ("stringValue" in v) return v.stringValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("mapValue" in v) return decodeFields(v.mapValue?.fields || {});
  if ("arrayValue" in v) return (v.arrayValue?.values || []).map(decodeValue);
  return undefined;
}
function decodeFields(fields) {
  const out = {};
  for (const k of Object.keys(fields || {})) out[k] = decodeValue(fields[k]);
  return out;
}
function encodeValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encodeValue) } };
  if (typeof v === "object") return { mapValue: { fields: encodeFields(v) } };
  return { nullValue: null };
}
function encodeFields(obj) {
  const out = {};
  for (const k of Object.keys(obj || {})) out[k] = encodeValue(obj[k]);
  return out;
}

const docUrl = (docId) =>
  `${REST_BASE}/${encodeURIComponent(FS_COLLECTION)}/${encodeURIComponent(docId)}?key=${encodeURIComponent(REST_KEY)}`;

async function withTimeout(run, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await run(ctrl.signal);
  } finally {
    clearTimeout(t);
  }
}

async function restGet(docId) {
  const res = await withTimeout((signal) => fetch(docUrl(docId), { signal }), 20000);
  if (res.status === 404) return null;                    // dokumen memang belum ada — bukan error
  if (res.status === 403 || res.status === 401) {
    const e = new Error("Akses Firestore ditolak (cek Firestore Rules).");
    e.permanent = true;                                    // percuma di-retry
    throw e;
  }
  if (!res.ok) throw new Error(`Firestore REST ${res.status}`);
  const json = await res.json();
  return json?.fields ? decodeFields(json.fields) : null;
}

async function restSet(docId, payload) {
  const res = await withTimeout(
    (signal) =>
      fetch(docUrl(docId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: encodeFields(payload) }),
        signal,
      }),
    30000
  );
  if (!res.ok) {
    const e = new Error(`Firestore REST ${res.status}`);
    if (res.status === 403 || res.status === 401) e.permanent = true;
    throw e;
  }
}

/* ───────────────────────── Cadangan: SDK resmi ───────────────────────── */

let appPromise = null;
let firestorePromise = null;
let authPromise = null;

function getApp() {
  if (!appPromise) appPromise = import("firebase/app").then((m) => m.initializeApp(FIREBASE_CONFIG));
  return appPromise;
}

function getFirestoreBits() {
  if (!firestorePromise) {
    firestorePromise = Promise.all([getApp(), import("firebase/firestore")]).then(([app, fs]) => ({
      fs,
      db: fs.getFirestore(app),
    }));
  }
  return firestorePromise;
}

/** Modul Auth + instance auth. Hanya termuat kalau login Google benar-benar dipakai. */
export function getAuthBits() {
  if (!authPromise) {
    authPromise = Promise.all([getApp(), import("firebase/auth")]).then(([app, a]) => ({
      ...a,
      auth: a.getAuth(app),
    }));
  }
  return authPromise;
}

async function sdkGet(docId) {
  const { fs, db } = await getFirestoreBits();
  const snap = await fs.getDoc(fs.doc(db, FS_COLLECTION, docId));
  return snap.exists() ? snap.data() : null;
}

async function sdkSet(docId, payload) {
  const { fs, db } = await getFirestoreBits();
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Firestore timeout – koneksi lambat atau offline")), 30000)
  );
  await Promise.race([fs.setDoc(fs.doc(db, FS_COLLECTION, docId), payload), timeout]);
}

/* ───────────────────────── API yang dipakai aplikasi ───────────────────────── */

/**
 * Baca satu dokumen. TIDAK menelan error diam-diam: kalau gagal (bukan sekadar dokumen belum ada),
 * error dilempar ke pemanggil supaya bisa ditampilkan ke user, bukan diam-diam jatuh ke default.
 */
export async function fsGet(docId) {
  if (!restUnavailable) {
    try {
      return await restGet(docId);
    } catch (err) {
      if (err?.permanent) throw err;          // ditolak Rules → SDK pun akan ditolak
      restUnavailable = true;                 // kemungkinan CORS/jaringan → pakai SDK mulai sekarang
      console.warn("[Firestore] Jalur REST gagal, beralih ke SDK:", err?.message || err);
    }
  }
  return sdkGet(docId);
}

export async function fsSet(docId, payload) {
  if (!restUnavailable) {
    try {
      return await restSet(docId, payload);
    } catch (err) {
      if (err?.permanent) throw err;
      restUnavailable = true;
      console.warn("[Firestore] Simpan via REST gagal, beralih ke SDK:", err?.message || err);
    }
  }
  return sdkSet(docId, payload);
}

/**
 * fsGetWithRetry: dipakai KHUSUS untuk load data utama saat halaman pertama kali dibuka.
 * Firestore strongly-consistent (kalau berhasil dibaca, hasilnya pasti lengkap) — jadi retry ini bukan
 * untuk menunggu data "muncul pelan-pelan", melainkan untuk mentoleransi PERMINTAANNYA yang gagal atau
 * timeout duluan (realistis di tier gratis saat koneksi lambat atau server cold-start).
 */
export async function fsGetWithRetry(docId, { retries = 4, baseDelayMs = 1500 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fsGet(docId);
    } catch (err) {
      lastErr = err;
      if (err?.permanent) break;              // ditolak permanen → tidak ada gunanya mengulang
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, Math.round(baseDelayMs * Math.pow(1.6, attempt))));
      }
    }
  }
  throw lastErr;
}

/** Keluar dari sesi Google (kalau ada). Aman dipanggil walau Auth belum pernah dimuat. */
export function fbSignOutSafe() {
  if (!authPromise) return Promise.resolve(); // Auth belum pernah dipakai → tidak ada sesi, jangan muat SDK
  return authPromise.then(({ auth, signOut }) => signOut(auth)).catch(() => {});
}
