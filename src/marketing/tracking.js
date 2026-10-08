/**
 * Mesin tracking terpadu: Google Analytics 4 / GTM, Google Ads, Meta Pixel (+ Conversions API),
 * TikTok Pixel (+ Events API), Microsoft Clarity.
 *
 * Prinsip performa:
 *  • Semua script pihak ketiga dimuat TERTUNDA (setelah idle / interaksi pertama / maks 4 dtk) → tidak
 *    memperlambat tampilan pertama, termasuk di koneksi lambat.
 *  • Event yang terjadi sebelum script siap ditampung di antrean resmi tiap platform (stub), tidak hilang.
 * Prinsip privasi:
 *  • Google Consent Mode v2 + consent API Meta/TikTok. Default DITOLAK sampai pengunjung menyetujui
 *    (kecuali VITE_CONSENT_REQUIRED=false).
 */
import { resolveMarketing } from "./config.js";

const W = typeof window !== "undefined" ? window : {};
const CONSENT_KEY = "hc_consent_v1";
const ATTR_FIRST = "hc_attr_first";
const ATTR_LAST = "hc_attr_last";
const CLICK_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "gbraid", "wbraid", "fbclid", "ttclid", "msclkid"];

let cfg = resolveMarketing({});
const booted = {};            // { ga, gtm, gads, fb, tt, clarity }
let scheduled = false;
let currentPage = null;       // { path, title }

const safe = (fn) => { try { return fn(); } catch { return undefined; } };
export const uuid = () =>
  (W.crypto && W.crypto.randomUUID ? W.crypto.randomUUID() : "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));

/* ───────────────────────── Consent ───────────────────────── */
export function getConsent() {
  if (!cfg.consentRequired) return { analytics: true, marketing: true, decided: true };
  const raw = safe(() => JSON.parse(localStorage.getItem(CONSENT_KEY)));
  if (!raw) return { analytics: false, marketing: false, decided: false };
  return { analytics: !!raw.a, marketing: !!raw.m, decided: true };
}

export function setConsent({ analytics, marketing }) {
  safe(() => localStorage.setItem(CONSENT_KEY, JSON.stringify({ a: !!analytics, m: !!marketing, t: Date.now() })));
  applyConsent();
  if (marketing) setFbcCookie();
  W.dispatchEvent?.(new CustomEvent("hc:consent"));
}

function applyConsent() {
  const c = getConsent();
  if (W.gtag) {
    W.gtag("consent", "update", {
      analytics_storage: c.analytics ? "granted" : "denied",
      ad_storage: c.marketing ? "granted" : "denied",
      ad_user_data: c.marketing ? "granted" : "denied",
      ad_personalization: c.marketing ? "granted" : "denied",
    });
  }
  safe(() => W.fbq && W.fbq("consent", c.marketing ? "grant" : "revoke"));
  safe(() => W.ttq && (c.marketing ? W.ttq.grantConsent() : W.ttq.revokeConsent()));
  if (c.analytics || c.marketing) loadClarity();
  safe(() => W.clarity && W.clarity("consent", c.analytics || c.marketing));
}

/* ───────────────────────── Atribusi (UTM & click-id) ───────────────────────── */
export function captureAttribution() {
  const q = new URLSearchParams(W.location?.search || "");
  const found = {};
  CLICK_KEYS.forEach((k) => { if (q.get(k)) found[k] = q.get(k).slice(0, 200); });
  const base = { landing: (W.location?.pathname || "/") + (W.location?.search ? "?" + (W.location.search.slice(1, 200)) : ""), referrer: safe(() => document.referrer) || "", ts: Date.now() };
  if (Object.keys(found).length) {
    const entry = { ...base, ...found };
    safe(() => sessionStorage.setItem(ATTR_LAST, JSON.stringify(entry)));
    if (!safe(() => localStorage.getItem(ATTR_FIRST))) safe(() => localStorage.setItem(ATTR_FIRST, JSON.stringify(entry)));
  } else if (!safe(() => localStorage.getItem(ATTR_FIRST))) {
    safe(() => localStorage.setItem(ATTR_FIRST, JSON.stringify({ ...base, utm_source: base.referrer ? "referral" : "direct" })));
  }
}

export function getAttribution() {
  const first = safe(() => JSON.parse(localStorage.getItem(ATTR_FIRST))) || {};
  const last = safe(() => JSON.parse(sessionStorage.getItem(ATTR_LAST))) || {};
  return { first, last };
}

function cookie(name) {
  const m = safe(() => document.cookie.match(new RegExp("(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)")));
  return m ? decodeURIComponent(m[1]) : "";
}
function setFbcCookie() {
  const { last, first } = getAttribution();
  const fbclid = last.fbclid || first.fbclid;
  if (fbclid && !cookie("_fbc")) {
    const ts = (last.fbclid ? last.ts : first.ts) || Date.now();
    safe(() => { document.cookie = `_fbc=fb.1.${ts}.${fbclid}; max-age=7776000; path=/; SameSite=Lax`; });
  }
}
export function getIdentifiers() {
  const { first, last } = getAttribution();
  const ga = cookie("_ga");
  return {
    fbp: cookie("_fbp"),
    fbc: cookie("_fbc"),
    ttp: cookie("_ttp"),
    ttclid: last.ttclid || first.ttclid || "",
    gclid: last.gclid || first.gclid || "",
    client_id: ga ? ga.split(".").slice(-2).join(".") : "",
  };
}

/* ───────────────────────── Loader tertunda ───────────────────────── */
function loadScript(src, attrs = {}) {
  if (!src || document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement("script");
  s.async = true; s.src = src;
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  document.head.appendChild(s);
}

function bootGoogle() {
  const ids = [cfg.ga4Id, cfg.gadsId].filter(Boolean);
  if (!cfg.gtmId && !ids.length) return;
  W.dataLayer = W.dataLayer || [];
  if (!W.gtag) { W.gtag = function () { W.dataLayer.push(arguments); }; }
  if (!booted.consentDefault) {
    booted.consentDefault = true;
    W.gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied", wait_for_update: 500 });
    W.gtag("set", "url_passthrough", true);
    W.gtag("set", "ads_data_redaction", true);
    W.gtag("js", new Date());
  }
  if (cfg.gtmId && !booted.gtm) {
    booted.gtm = true;
    W.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    loadScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(cfg.gtmId)}`);
  }
  if (!cfg.gtmId) {
    if (cfg.ga4Id && !booted.ga) {
      booted.ga = true;
      W.gtag("config", cfg.ga4Id, { send_page_view: false, transport_type: "beacon" });
      loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cfg.ga4Id)}`);
      sendPageView("ga");
    }
    if (cfg.gadsId && !booted.gads) {
      booted.gads = true;
      W.gtag("config", cfg.gadsId, { allow_enhanced_conversions: true });
      if (!cfg.ga4Id) loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cfg.gadsId)}`);
    }
  } else if (!booted.gtmPV) {
    booted.gtmPV = true;
    sendPageView("gtm");
  }
}

function bootMeta() {
  if (!cfg.metaPixelId || booted.fb) return;
  booted.fb = true;
  /* eslint-disable */
  !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(W, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */
  W.fbq("consent", getConsent().marketing ? "grant" : "revoke");
  W.fbq("init", cfg.metaPixelId);
  sendPageView("fb");
}

function bootTikTok() {
  if (!cfg.tiktokPixelId || booted.tt) return;
  booted.tt = true;
  /* eslint-disable */
  (function (w, d, t) { w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || []; ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"], ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; }; for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]); ttq.instance = function (t) { for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e; }, ttq.load = function (e, n) { var r = "https://analytics.tiktok.com/i18n/pixel/events.js"; ttq._i = ttq._i || {}, ttq._i[e] = [], ttq._i[e]._u = r, ttq._t = ttq._t || {}, ttq._t[e] = +new Date, ttq._o = ttq._o || {}, ttq._o[e] = n || {}; var o = document.createElement("script"); o.type = "text/javascript", o.async = !0, o.src = r + "?sdkid=" + e + "&lib=" + t; var a = document.getElementsByTagName("script")[0]; a.parentNode.insertBefore(o, a); }; if (!ttq._loadedByApp) { ttq._loadedByApp = true; ttq.holdConsent(); ttq.load(cfg.tiktokPixelId); } })(W, document, "ttq");
  /* eslint-enable */
  if (getConsent().marketing) W.ttq.grantConsent();
  sendPageView("tt");
}

function loadClarity() {
  if (!cfg.clarityId || booted.clarity) return;
  booted.clarity = true;
  /* eslint-disable */
  (function (c, l, a, r, i, t, y) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); }; t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i; y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(W, document, "clarity", "script", cfg.clarityId);
  /* eslint-enable */
}

function bootAll() {
  bootGoogle(); bootMeta(); bootTikTok();
  applyConsent();
}

/** Panggil saat config berubah (env di awal, lalu override CMS setelah data termuat). Idempotent. */
export function initTracking(cmsMarketing) {
  cfg = resolveMarketing(cmsMarketing);
  captureAttribution();
  if (getConsent().marketing) setFbcCookie();
  if (booted.ready) { bootAll(); return; }   // sudah melewati penundaan → langsung muat provider baru
  if (scheduled) return;
  scheduled = true;
  const go = () => { if (booted.ready) return; booted.ready = true; bootAll(); cleanup(); };
  const evs = ["pointerdown", "keydown", "scroll", "touchstart"];
  const cleanup = () => { evs.forEach((e) => W.removeEventListener(e, go)); clearTimeout(timer); };
  evs.forEach((e) => W.addEventListener(e, go, { once: true, passive: true }));
  const timer = setTimeout(() => ("requestIdleCallback" in W ? W.requestIdleCallback(go, { timeout: 1500 }) : go()), 3500);
}

export function integrationStatus() {
  return {
    ga4: !!cfg.ga4Id, gtm: !!cfg.gtmId, gads: !!cfg.gadsId, meta: !!cfg.metaPixelId,
    tiktok: !!cfg.tiktokPixelId, clarity: !!cfg.clarityId, serverEvents: !!cfg.capiEnabled,
    consentRequired: !!cfg.consentRequired,
  };
}

/* ───────────────────────── Kirim event ───────────────────────── */
function sendPageView(only) {
  if (!currentPage) return;
  const { path, title } = currentPage;
  const loc = W.location?.origin + path;
  const go = (p) => !only || only === p;
  if (go("ga") && !cfg.gtmId && W.gtag && cfg.ga4Id) W.gtag("event", "page_view", { page_path: path, page_location: loc, page_title: title });
  if (go("gtm") && cfg.gtmId && W.dataLayer) W.dataLayer.push({ event: "page_view", page_path: path, page_location: loc, page_title: title });
  if (go("fb") && W.fbq && cfg.metaPixelId) W.fbq("track", "PageView");
  if (go("tt") && W.ttq && cfg.tiktokPixelId) W.ttq.page();
  if (go("clarity") && W.clarity) W.clarity("set", "page", path);
}

let lastPV = "";
export function trackPageView(path, title) {
  if (path === lastPV) return;
  lastPV = path;
  currentPage = { path, title: title || safe(() => document.title) || "" };
  if (booted.ready) sendPageView();
  // sebelum booted.ready: provider akan mengirim PV saat boot (sendPageView(only))
}

const EVENTS = {
  lead:           { ga: "generate_lead", fb: "Lead",         tt: "SubmitForm",  ads: "lead" },
  whatsapp_click: { ga: "whatsapp_click", fb: "Contact",     tt: "Contact",     ads: "wa" },
  contact:        { ga: "contact",        fb: "Contact",     tt: "Contact" },
  view_content:   { ga: "view_item",      fb: "ViewContent", tt: "ViewContent" },
  social_click:   { ga: "social_click",   fb: "SocialClick", tt: "ClickButton", custom: true },
  cta_click:      { ga: "cta_click",      fb: "CtaClick",    tt: "ClickButton", custom: true },
  scroll_depth:   { ga: "scroll_depth",   fb: null,          tt: null },
  phone_click:    { ga: "phone_click",    fb: "Contact",     tt: "Contact" },
  email_click:    { ga: "email_click",    fb: "Contact",     tt: "Contact" },
  calculator_use: { ga: "calculator_use", fb: "CalculatorUse", tt: "ClickButton", custom: true },
  test_event:     { ga: "test_event",     fb: "TestEvent",   tt: "ClickButton", custom: true },
};
const SERVER_EVENTS = new Set(["lead", "whatsapp_click", "contact", "view_content", "phone_click"]);

/**
 * trackEvent("lead", { value, content_name, ... }, { eventId, user: { email, phone, name } })
 * Mengembalikan eventId (dipakai untuk dedup browser ↔ server).
 */
export function trackEvent(name, params = {}, opts = {}) {
  const def = EVENTS[name] || { ga: name, fb: name, tt: "ClickButton", custom: true };
  const eventId = opts.eventId || uuid();
  const p = { currency: "IDR", ...params };
  const consent = getConsent();

  // Google
  if (cfg.gtmId && W.dataLayer) {
    W.dataLayer.push({ event: def.ga, event_id: eventId, ...p });
  } else if (W.gtag && (cfg.ga4Id || cfg.gadsId)) {
    if (opts.user && consent.marketing) {
      W.gtag("set", "user_data", { email: opts.user.email || undefined, phone_number: opts.user.phone ? toE164(opts.user.phone) : undefined });
    }
    if (cfg.ga4Id) W.gtag("event", def.ga, { ...p, event_id: eventId });
    const label = def.ads === "lead" ? cfg.gadsLeadLabel : def.ads === "wa" ? cfg.gadsWaLabel : "";
    if (cfg.gadsId && label) W.gtag("event", "conversion", { send_to: `${cfg.gadsId}/${label}`, value: p.value || 1, currency: "IDR", transaction_id: eventId });
  }
  // Meta
  if (W.fbq && cfg.metaPixelId && def.fb) {
    const { currency, ...rest } = p;
    W.fbq(def.custom ? "trackCustom" : "track", def.fb, { ...rest, currency }, { eventID: eventId });
  }
  // TikTok
  if (W.ttq && cfg.tiktokPixelId && def.tt) {
    if (opts.user && consent.marketing) safe(() => W.ttq.identify({ email: opts.user.email || undefined, phone_number: opts.user.phone ? toE164(opts.user.phone) : undefined }));
    W.ttq.track(def.tt, { ...p, content_type: "product" }, { event_id: eventId });
  }
  // Clarity
  safe(() => W.clarity && W.clarity("event", name));
  // Server-side
  if (cfg.capiEnabled && consent.marketing && (opts.server ?? SERVER_EVENTS.has(name))) sendServerEvent(name, eventId, p, opts.user);
  return eventId;
}

export function toE164(phone) {
  let d = String(phone || "").replace(/\D+/g, "");
  if (!d) return "";
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("8")) d = "62" + d;
  return "+" + d;
}

function sendServerEvent(name, eventId, params, user) {
  const { first, last } = getAttribution();
  const body = JSON.stringify({
    event: name, event_id: eventId, event_time: Math.floor(Date.now() / 1000),
    url: W.location?.href, referrer: safe(() => document.referrer) || "",
    ids: getIdentifiers(), params, user: user || undefined, attribution: { first, last },
  });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }))) return;
  } catch { /* fallback */ }
  safe(() => fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }));
}

/** Lead dari form: kirim ke /api/lead (notifikasi + CAPI), sekaligus event browser ber-ID sama. */
export function trackLead(lead = {}, params = {}) {
  const eventId = uuid();
  trackEvent("lead", { content_name: lead.service || "Konsultasi", value: params.value || 1, ...params },
    { eventId, user: { email: lead.email, phone: lead.phone, name: lead.name }, server: false });
  return eventId;
}

/* ───────────────────────── Auto-tracking (klik & scroll) ───────────────────────── */
const SOCIAL_RE = /(instagram\.com|tiktok\.com|facebook\.com|fb\.com|youtube\.com|youtu\.be|linkedin\.com|x\.com|twitter\.com)/i;

export function initAutoTracking() {
  const onClick = (e) => {
    const el = e.target?.closest?.("a[href],[data-track]");
    if (!el) return;
    const tag = el.getAttribute("data-track");
    if (tag) { trackEvent("cta_click", { content_name: tag, link_text: (el.textContent || "").trim().slice(0, 60) }); }
    const href = el.getAttribute("href") || "";
    if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)/i.test(href)) trackEvent("whatsapp_click", { content_name: tag || "whatsapp", link_url: href.slice(0, 120) });
    else if (/^tel:/i.test(href)) trackEvent("phone_click", { content_name: "tel" });
    else if (/^mailto:/i.test(href)) trackEvent("email_click", { content_name: "mailto" });
    else if (SOCIAL_RE.test(href)) trackEvent("social_click", { content_name: (href.match(SOCIAL_RE) || [])[1], link_url: href.slice(0, 120) });
  };
  document.addEventListener("click", onClick, { capture: true, passive: true });

  let marks = new Set(), ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      if (max < 400) return;
      const pct = (h.scrollTop / max) * 100;
      [25, 50, 75, 90].forEach((m) => { if (pct >= m && !marks.has(m)) { marks.add(m); trackEvent("scroll_depth", { percent: m, page_path: W.location.pathname }, { server: false }); } });
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  const onRoute = () => { marks = new Set(); };
  window.addEventListener("hc:route", onRoute);
  return () => { document.removeEventListener("click", onClick, true); window.removeEventListener("scroll", onScroll); window.removeEventListener("hc:route", onRoute); };
}

export function notifyRouteChange() { W.dispatchEvent?.(new CustomEvent("hc:route")); }
