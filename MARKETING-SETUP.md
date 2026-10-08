# Panduan Marketing & Tracking — Hikimori Const

Semua ID bisa diisi di **Control Panel → Marketing & Tracking** (tanpa build ulang) atau lewat `.env` / Vercel.
Script pihak ketiga dimuat tertunda dan **default-nya ditolak sampai pengunjung menyetujui** banner cookie (Google Consent Mode v2).

## 1. Google Analytics 4
Properti GA4 dari project Firebase `hk-const` (**G-22NHPZY4R7**) sudah dipakai sebagai bawaan —
dialirkan lewat mesin tracking di website ini (dimuat tertunda + patuh consent), bukan lewat SDK
`firebase/analytics`, supaya tidak menambah ±35 KB ke jalur kritis. Ganti hanya bila ingin properti lain.

1. analytics.google.com → Admin → Data streams → Web → salin **Measurement ID** (`G-…`).
2. Isi *Google Analytics 4* di panel. Event otomatis: `page_view` (tiap perpindahan halaman SPA), `view_item`, `generate_lead`,
   `whatsapp_click`, `phone_click`, `email_click`, `social_click`, `cta_click`, `scroll_depth` (25/50/75/90%).
3. Admin → Events → tandai `generate_lead` dan `whatsapp_click` sebagai **Key event**.
4. Pakai GTM? Isi *Container ID* — event dikirim ke `dataLayer` dengan nama yang sama.

## 2. Google Ads
1. Ads → Tools → Conversions → New → Website → buat konversi **Lead** dan **Klik WhatsApp** → salin *Conversion ID* (`AW-…`) dan masing-masing *label*.
2. Isi di panel. Enhanced conversions aktif otomatis (email/telepon di-hash oleh Google, hanya bila pengunjung menyetujui).
3. Link dengan auto-tagging (`gclid`) dibaca dan disimpan bersama lead.

## 3. Meta (Facebook & Instagram)
1. Events Manager → Connect data sources → Web → salin **Pixel ID**.
2. Event: `PageView`, `ViewContent`, `Lead`, `Contact`, + custom `SocialClick`, `CtaClick`.
3. **Conversions API (disarankan, tahan ad-blocker/iOS):** Events Manager → Settings → Conversions API → *Generate access token*.
   Di Vercel isi `META_PIXEL_ID`, `META_CAPI_TOKEN`, lalu set `VITE_SERVER_EVENTS=true`. Uji via *Test Events* dengan `META_TEST_EVENT_CODE`.
   Event browser & server memakai `event_id` sama → otomatis dedup.
4. Verifikasi domain: isi kode ke `VITE_META_DOMAIN_VERIFY` (tag meta masuk ke `index.html` saat build).

## 4. TikTok
1. Ads Manager → Assets → Events → Web Events → salin **Pixel ID** (`C…`).
2. Event: `Pageview`, `ViewContent`, `SubmitForm` (lead), `Contact`, `ClickButton`.
3. Events API: buat *Access Token* → Vercel `TIKTOK_PIXEL_ID`, `TIKTOK_ACCESS_TOKEN`.

## 5. Instagram & TikTok feed
Panel → *Konten Instagram & TikTok*: tempel link post/reel/video, satu per baris. Embed baru dimuat saat pengunjung mengetuk
(nol script pihak ketiga di load awal). Tanpa link, tampil placeholder + tombol follow ke akun.

## 6. Lead
- Form ada di beranda dan di **`/promo`** (landing page khusus iklan — arahkan semua iklan ke sini).
- Lead masuk ke: inbox Control Panel (Pesan Masuk), WhatsApp (pilihan admin), dan — bila diisi — `LEAD_WEBHOOK_URL`
  (kode Google Apps Script siap salin ada di panel) + Telegram (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`).
- Anti-spam: honeypot, jeda minimum, rate-limit per IP, cek origin.

## 7. Link UTM
Panel → *Pembuat link UTM*: preset Meta Ads, Google Ads, TikTok Ads, Instagram Bio, TikTok Bio, WhatsApp Broadcast
(placeholder dinamis tiap platform sudah benar). UTM/click-id pertama & terakhir disimpan dan ikut ke lead.

## 8. Aset media (`public/marketing/`)
| File | Ukuran | Untuk |
|---|---|---|
| og-image.png | 1200×630 | pratinjau link WhatsApp/FB/IG/LinkedIn |
| ig-post-1080x1080.png | 1080×1080 | feed Instagram / Meta Ads square |
| ig-story-1080x1920.png | 1080×1920 | Story / Reels |
| tiktok-cover-1080x1920.png | 1080×1920 | cover & iklan TikTok vertikal |
| meta-ads-1200x628.png | 1200×628 | Meta feed link ad |
| google-display-1200x628.png / -square-1200x1200.png | | Google Display / Performance Max |
| profile-640.png, icon-192/512.png, apple-touch-icon.png | | foto profil IG/TikTok/WA, PWA |

Template memiliki area bergaris putus-putus "FOTO" — buka di Canva/Figma, tempel foto proyek asli, ekspor ulang.

## 9. Checklist go-live
- [ ] Isi `VITE_SITE_URL` dengan domain final
- [ ] Ganti kata sandi Control Panel bawaan
- [ ] Ganti kontak lama (telepon, email, alamat, WA admin) di Control Panel → Konten & Nav
- [ ] Isi ID tracking, uji dengan *Meta Test Events*, *GA4 DebugView*, *TikTok Test Events*
- [ ] Kirim `sitemap.xml` ke Google Search Console
