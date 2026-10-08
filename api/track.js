/**
 * POST /api/track — meneruskan event konversi dari browser ke Meta Conversions API,
 * TikTok Events API dan GA4 Measurement Protocol (server-side, tahan ad-blocker & iOS).
 * Event browser (Pixel) dan server memakai event_id yang SAMA → platform melakukan deduplikasi.
 */
import { ALLOWED_EVENTS, forwardEvent, originAllowed, rateLimited, readJson, clientIp } from "./_lib/capi.js";

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Method not allowed" }); }
  if (!originAllowed(req)) return res.status(403).json({ error: "Origin tidak diizinkan" });
  if (rateLimited("track:" + clientIp(req), 120, 10 * 60 * 1000)) return res.status(429).json({ error: "Terlalu banyak permintaan" });

  const b = readJson(req);
  if (!b || !ALLOWED_EVENTS.includes(b.event) || !b.event_id) return res.status(400).json({ error: "Payload tidak valid" });

  const clip = (v, n = 200) => (typeof v === "string" ? v.slice(0, n) : "");
  const ev = {
    event: b.event, event_id: clip(b.event_id, 80), event_time: b.event_time,
    url: clip(b.url, 500), referrer: clip(b.referrer, 500),
    ids: Object.fromEntries(["fbp", "fbc", "ttp", "ttclid", "gclid", "client_id"].map((k) => [k, clip(b.ids?.[k], 200)])),
    user: b.user ? { email: clip(b.user.email, 120), phone: clip(b.user.phone, 30), name: clip(b.user.name, 80) } : undefined,
    params: typeof b.params === "object" && b.params ? JSON.parse(JSON.stringify(b.params).slice(0, 2000) || "{}") : {},
  };
  const result = await forwardEvent(ev, req);
  return res.status(200).json({ ok: true, result });
}
