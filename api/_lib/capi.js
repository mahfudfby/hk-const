/**
 * Helper server-side: Meta Conversions API, TikTok Events API, GA4 Measurement Protocol.
 * Dipakai oleh /api/track dan /api/lead. File berawalan "_" tidak diekspos sebagai endpoint oleh Vercel.
 *
 * ENV (set di Vercel → Settings → Environment Variables, JANGAN pakai prefix VITE_ untuk token):
 *   META_PIXEL_ID, META_CAPI_TOKEN, META_TEST_EVENT_CODE (opsional, untuk tab "Test Events")
 *   TIKTOK_PIXEL_ID, TIKTOK_ACCESS_TOKEN, TIKTOK_TEST_EVENT_CODE (opsional)
 *   GA4_MEASUREMENT_ID, GA4_API_SECRET
 */
import crypto from "node:crypto";

const sha256 = (v) => crypto.createHash("sha256").update(String(v)).digest("hex");
const norm = (v) => String(v || "").trim().toLowerCase();

export function normPhone(phone) {
  let d = String(phone || "").replace(/\D+/g, "");
  if (!d) return "";
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("8")) d = "62" + d;
  return d;
}

const hashEmail = (e) => (e && /.+@.+\..+/.test(e) ? sha256(norm(e)) : undefined);
const hashPhone = (p) => { const n = normPhone(p); return n.length >= 9 ? sha256(n) : undefined; };
const hashName = (n) => (n ? sha256(norm(n).split(/\s+/)[0]) : undefined);

export function clientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  return (Array.isArray(xf) ? xf[0] : (xf || "")).split(",")[0].trim() || req.socket?.remoteAddress || "";
}

const withTimeout = (ms = 4000) => ({ signal: AbortSignal.timeout(ms) });

async function sendMeta(ev, ctx) {
  const pixel = process.env.META_PIXEL_ID || process.env.VITE_META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixel || !token) return { skipped: true };
  const u = ev.user || {};
  const body = {
    data: [{
      event_name: ev.metaName, event_time: ev.event_time, event_id: ev.event_id, action_source: "website",
      event_source_url: ev.url,
      user_data: {
        em: hashEmail(u.email) && [hashEmail(u.email)],
        ph: hashPhone(u.phone) && [hashPhone(u.phone)],
        fn: hashName(u.name) && [hashName(u.name)],
        country: [sha256("id")],
        client_ip_address: ctx.ip, client_user_agent: ctx.ua,
        fbp: ev.ids?.fbp || undefined, fbc: ev.ids?.fbc || undefined,
        external_id: u.phone || u.email ? [sha256(normPhone(u.phone) || norm(u.email))] : undefined,
      },
      custom_data: ev.params,
    }],
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
  };
  const r = await fetch(`https://graph.facebook.com/v21.0/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), ...withTimeout(),
  });
  return { ok: r.ok, status: r.status };
}

async function sendTikTok(ev, ctx) {
  const pixel = process.env.TIKTOK_PIXEL_ID || process.env.VITE_TIKTOK_PIXEL_ID;
  const token = process.env.TIKTOK_ACCESS_TOKEN;
  if (!pixel || !token) return { skipped: true };
  const u = ev.user || {};
  const body = {
    event_source: "web", event_source_id: pixel,
    ...(process.env.TIKTOK_TEST_EVENT_CODE ? { test_event_code: process.env.TIKTOK_TEST_EVENT_CODE } : {}),
    data: [{
      event: ev.tiktokName, event_time: ev.event_time, event_id: ev.event_id,
      user: {
        email: hashEmail(u.email), phone_number: hashPhone(u.phone) && sha256("+" + normPhone(u.phone)),
        ttclid: ev.ids?.ttclid || undefined, ttp: ev.ids?.ttp || undefined, ip: ctx.ip, user_agent: ctx.ua,
      },
      page: { url: ev.url, referrer: ev.referrer },
      properties: { ...ev.params, content_type: "product" },
    }],
  };
  const r = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
    method: "POST", headers: { "Content-Type": "application/json", "Access-Token": token }, body: JSON.stringify(body), ...withTimeout(),
  });
  return { ok: r.ok, status: r.status };
}

async function sendGA4(ev) {
  const id = process.env.GA4_MEASUREMENT_ID || process.env.VITE_GA4_ID;
  const secret = process.env.GA4_API_SECRET;
  if (!id || !secret || !ev.ids?.client_id) return { skipped: true };
  const r = await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(id)}&api_secret=${encodeURIComponent(secret)}`, {
    method: "POST", body: JSON.stringify({ client_id: ev.ids.client_id, events: [{ name: ev.gaName, params: { ...ev.params, event_id: ev.event_id, engagement_time_msec: 100 } }] }), ...withTimeout(),
  });
  return { ok: r.ok, status: r.status };
}

const MAP = {
  lead:           { meta: "Lead",        tiktok: "SubmitForm",  ga: "generate_lead" },
  whatsapp_click: { meta: "Contact",     tiktok: "Contact",     ga: "whatsapp_click" },
  contact:        { meta: "Contact",     tiktok: "Contact",     ga: "contact" },
  phone_click:    { meta: "Contact",     tiktok: "Contact",     ga: "phone_click" },
  view_content:   { meta: "ViewContent", tiktok: "ViewContent", ga: "view_item" },
};
export const ALLOWED_EVENTS = Object.keys(MAP);

/** Kirim satu event ke semua platform yang token-nya tersedia. Tidak pernah melempar error. */
export async function forwardEvent(raw, req) {
  const m = MAP[raw.event];
  if (!m) return { error: "event tidak dikenal" };
  const ev = {
    ...raw, metaName: m.meta, tiktokName: m.tiktok, gaName: m.ga,
    event_time: Number(raw.event_time) || Math.floor(Date.now() / 1000),
  };
  const ctx = { ip: clientIp(req), ua: String(req.headers["user-agent"] || "") };
  const [meta, tiktok, ga4] = await Promise.allSettled([sendMeta(ev, ctx), sendTikTok(ev, ctx), sendGA4(ev)]);
  const pick = (r) => (r.status === "fulfilled" ? r.value : { ok: false, error: String(r.reason?.message || r.reason).slice(0, 120) });
  return { meta: pick(meta), tiktok: pick(tiktok), ga4: pick(ga4) };
}

/* ── Utilitas umum endpoint ── */
const hits = new Map();
export function rateLimited(key, max = 8, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now); hits.set(key, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > windowMs) hits.delete(k);
  return arr.length > max;
}

export function originAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return true;                         // sendBeacon/same-origin tanpa header
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const extra = (process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  try { return new URL(origin).host === host || extra.includes(origin) || /^https?:\/\/localhost(:\d+)?$/.test(origin); } catch { return false; }
}

export function readJson(req) {
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = null; } }
  if (Buffer.isBuffer(b)) { try { b = JSON.parse(b.toString("utf8")); } catch { b = null; } }
  return b && typeof b === "object" ? b : null;
}
