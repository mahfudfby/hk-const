/**
 * Konfigurasi marketing. Sumber nilai (prioritas):
 *   1) CMS  → Control Panel › Marketing & Tracking  (data.content.marketing, tanpa rebuild)
 *   2) ENV  → VITE_* di .env / Vercel
 */
import { FIREBASE_CONFIG } from "../config/infra.js";

const env = import.meta.env;

export const ENV_MARKETING = {
  /* Default-nya memakai measurementId dari project Firebase (hk-const) — properti GA4 yang sama dengan
     yang dibuat Firebase Console. Dialirkan lewat mesin tracking di bawah (dimuat tertunda + consent mode)
     alih-alih SDK firebase/analytics, supaya tidak menambah ±35 KB ke jalur kritis dan tetap patuh consent. */
  ga4Id:           env.VITE_GA4_ID || FIREBASE_CONFIG.measurementId || "", // G-XXXXXXXXXX
  gtmId:           env.VITE_GTM_ID || "",                 // GTM-XXXXXXX (opsional, menggantikan gtag langsung)
  gadsId:          env.VITE_GADS_ID || "",                // AW-XXXXXXXXXX
  gadsLeadLabel:   env.VITE_GADS_LEAD_LABEL || "",        // label konversi Lead
  gadsWaLabel:     env.VITE_GADS_WA_LABEL || "",          // label konversi klik WhatsApp
  metaPixelId:     env.VITE_META_PIXEL_ID || "",
  tiktokPixelId:   env.VITE_TIKTOK_PIXEL_ID || "",
  clarityId:       env.VITE_CLARITY_ID || "",             // Microsoft Clarity (heatmap, gratis)
  metaDomainVerify:env.VITE_META_DOMAIN_VERIFY || "",
  googleSiteVerify:env.VITE_GOOGLE_SITE_VERIFY || "",
  capiEnabled:     env.VITE_SERVER_EVENTS === "true",     // kirim event server-side lewat /api/track
  consentRequired: env.VITE_CONSENT_REQUIRED !== "false", // false = tanpa banner (pastikan sesuai hukum setempat)
  instagramUser:   env.VITE_IG_USER || "hikimori_const",
  tiktokUser:      env.VITE_TIKTOK_USER || "hikimori_const",
  instagramPosts:  [],
  tiktokPosts:     [],
};

const clean = (v) => (typeof v === "string" ? v.trim() : v);

/** Gabungkan ENV + override CMS (nilai kosong di CMS tidak menimpa ENV) */
export function resolveMarketing(cms = {}) {
  const out = { ...ENV_MARKETING };
  for (const k of Object.keys(cms || {})) {
    const v = clean(cms[k]);
    if (v === "" || v === undefined || v === null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

export const MARKETING_FIELDS = [
  { key: "ga4Id",         label: "Google Analytics 4 — Measurement ID", ph: "G-XXXXXXXXXX", group: "Google" },
  { key: "gtmId",         label: "Google Tag Manager — Container ID (opsional)", ph: "GTM-XXXXXXX", group: "Google" },
  { key: "gadsId",        label: "Google Ads — Conversion ID", ph: "AW-XXXXXXXXXX", group: "Google" },
  { key: "gadsLeadLabel", label: "Google Ads — Label konversi Lead (form)", ph: "AbC-D_efG-h12345", group: "Google" },
  { key: "gadsWaLabel",   label: "Google Ads — Label konversi klik WhatsApp", ph: "AbC-D_efG-h12345", group: "Google" },
  { key: "metaPixelId",   label: "Meta (Facebook & Instagram) Pixel ID", ph: "123456789012345", group: "Meta" },
  { key: "metaDomainVerify", label: "Meta — kode verifikasi domain", ph: "abcdef123456…", group: "Meta" },
  { key: "tiktokPixelId", label: "TikTok Pixel ID", ph: "CXXXXXXXXXXXXXXXXXXX", group: "TikTok" },
  { key: "clarityId",     label: "Microsoft Clarity Project ID (heatmap)", ph: "abcdefghij", group: "Lainnya" },
  { key: "googleSiteVerify", label: "Google Search Console — kode verifikasi", ph: "abc123…", group: "Lainnya" },
  { key: "instagramUser", label: "Username Instagram", ph: "hikimori_const", group: "Sosial" },
  { key: "tiktokUser",    label: "Username TikTok", ph: "hikimori_const", group: "Sosial" },
];
