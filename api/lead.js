/**
 * POST /api/lead — menerima lead dari form (Meta Ads / Google Ads / TikTok / Instagram / organik).
 *  1. Validasi + anti-spam (honeypot, rate-limit per IP, cek origin)
 *  2. Teruskan ke LEAD_WEBHOOK_URL (Google Sheets via Apps Script, Zapier, Make, n8n, CRM, dll.)
 *  3. Notifikasi Telegram (opsional)
 *  4. Kirim event "Lead" ke Meta CAPI / TikTok Events API / GA4 (dedup dengan event browser lewat eventId)
 *
 * ENV opsional: LEAD_WEBHOOK_URL, LEAD_WEBHOOK_SECRET, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID + env CAPI di _lib/capi.js
 */
import { forwardEvent, originAllowed, rateLimited, readJson, clientIp, normPhone } from "./_lib/capi.js";

const clip = (v, n) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, n) : "");

async function postWebhook(lead) {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) return { skipped: true };
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(process.env.LEAD_WEBHOOK_SECRET ? { "X-Webhook-Secret": process.env.LEAD_WEBHOOK_SECRET } : {}) },
    body: JSON.stringify(lead), redirect: "follow", signal: AbortSignal.timeout(6000),
  });
  return { ok: r.ok, status: r.status };
}

async function notifyTelegram(lead) {
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return { skipped: true };
  const esc = (s) => String(s || "-").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
  const a = lead.attribution?.last?.utm_source ? lead.attribution.last : lead.attribution?.first || {};
  const text = [
    "🔔 <b>Lead baru — Hikimori Const</b>",
    `👤 ${esc(lead.name)}`, `📱 ${esc(lead.phone)}`, lead.email ? `✉️ ${esc(lead.email)}` : null,
    `🏗️ ${esc(lead.service)} · 💰 ${esc(lead.budget)}`, lead.location ? `📍 ${esc(lead.location)}` : null,
    lead.message ? `💬 ${esc(lead.message)}` : null,
    `📣 ${esc(a.utm_source || "organik")} / ${esc(a.utm_medium || "-")} / ${esc(a.utm_campaign || "-")}`,
  ].filter(Boolean).join("\n");
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: true }), signal: AbortSignal.timeout(5000),
  });
  return { ok: r.ok, status: r.status };
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Method not allowed" }); }
  if (!originAllowed(req)) return res.status(403).json({ error: "Origin tidak diizinkan" });
  const ip = clientIp(req);
  if (rateLimited("lead:" + ip, 6)) return res.status(429).json({ error: "Terlalu banyak pengiriman. Coba lagi beberapa menit lagi." });

  const b = readJson(req);
  if (!b) return res.status(400).json({ error: "Payload tidak valid" });
  if (b.hp) return res.status(200).json({ ok: true });               // honeypot: pura-pura sukses untuk bot

  const lead = {
    id: clip(b.eventId, 80) || `L${Date.now()}`,
    name: clip(b.name, 80), phone: clip(b.phone, 30), email: clip(b.email, 120),
    service: clip(b.service, 80), budget: clip(b.budget, 60), location: clip(b.location, 120), message: clip(b.message, 1500),
    page: clip(b.pageUrl, 500), consent: !!b.consent, createdAt: new Date().toISOString(), ip,
    attribution: b.attribution && typeof b.attribution === "object" ? JSON.parse(JSON.stringify(b.attribution).slice(0, 3000) || "{}") : {},
  };
  if (lead.name.length < 2) return res.status(400).json({ error: "Nama wajib diisi" });
  if (normPhone(lead.phone).length < 9 && !/.+@.+\..+/.test(lead.email)) return res.status(400).json({ error: "Isi nomor WhatsApp yang valid atau email" });

  const [hook, tg, capi] = await Promise.allSettled([
    postWebhook(lead), notifyTelegram(lead),
    b.consentMarketing
      ? forwardEvent({
          event: "lead", event_id: lead.id, url: lead.page, referrer: clip(b.referrer, 500),
          ids: Object.fromEntries(["fbp", "fbc", "ttp", "ttclid", "gclid", "client_id"].map((k) => [k, clip(b.ids?.[k], 200)])),
          user: { email: lead.email, phone: lead.phone, name: lead.name },
          params: { content_name: lead.service || "Konsultasi", currency: "IDR", value: 1 },
        }, req)
      : Promise.resolve({ skipped: "no-marketing-consent" }),
  ]);
  const val = (r) => (r.status === "fulfilled" ? r.value : { ok: false });
  const delivered = [val(hook), val(tg)].some((x) => x.ok);
  return res.status(200).json({ ok: true, delivered, sinks: { webhook: val(hook), telegram: val(tg) } });
}
