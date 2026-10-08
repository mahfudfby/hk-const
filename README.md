# Hikimori Const — Website Company Profile

Website company profile **Hikimori Const** (desain, bangun & renovasi rumah) — React 18 + Vite 5 + Firebase, deploy di Vercel.

```bash
npm install
cp .env.example .env     # isi seperlunya (semua opsional — ada nilai bawaan)
npm run dev              # http://localhost:5173
npm run build && npm run preview
```

## Layanan yang dipakai

| Layanan | Nilai | Catatan |
|---|---|---|
| Firebase | project `hk-const` | Firestore collection `hikimoriconst`, GA4 `G-22NHPZY4R7` |
| Cloudinary | cloud `dl4pyan8v` | upload preset *unsigned* `hikimori_const` (sudah dibuat) |
| EmailJS | — | sengaja dikosongkan; fitur OTP lupa-password nonaktif sampai diisi |

Semua identifier ada di satu tempat: **`src/config/infra.js`**, dan bisa ditimpa lewat `VITE_*` tanpa mengubah kode.

## Struktur

```
api/                      Serverless (Vercel)
  lead.js                 POST /api/lead   → validasi, webhook/Sheets, Telegram, Conversions API
  track.js                POST /api/track  → Meta CAPI, TikTok Events API, GA4 Measurement Protocol
  delete-cloudinary.js    hapus aset Cloudinary (butuh API secret server-side)
  _lib/capi.js            helper bersama (hash PII, rate-limit, cek origin)
public/
  images/                 logo Hikimori Const (SVG, versi gelap & terang)
  marketing/              OG image, ikon PWA, template iklan & konten (IG/TikTok/Meta/Google)
  sw.js                   service worker (cache aset & gambar)
src/
  config/infra.js         SATU-SATUNYA tempat identifier Firebase/Cloudinary/EmailJS
  lib/firebase.js         akses Firestore: REST dulu (0 KB pustaka), SDK hanya sebagai cadangan
  lib/net.js              deteksi koneksi lambat / mode lite, optimasi URL gambar Cloudinary
  app/core.jsx            komponen, util & konstanta yang dipakai bersama
  app/lazy.jsx            withLazy (React.lazy + Suspense per komponen) & prefetch saat idle
  data/                   data statis besar (katalog, paket program, landscape) — chunk terpisah
  pages/                  tiap halaman berat = satu chunk yang dimuat saat dibuka
  pages/admin-panel.jsx   seluruh Control Panel (chunk tersendiri, hanya untuk admin)
  marketing/              tracking, LeadForm, PromoPage (/promo), SocialFeed, ConsentBanner, panel admin
  styles/                 fonts (self-hosted), tema global, penyempurnaan + mode lite
  RealEstateWeb.jsx       kerangka aplikasi (nav, beranda, modal, routing)
```

## Performa

Diukur di Chromium, emulasi ponsel, jaringan ~1,2 Mbps / latensi 300 ms, CPU 4× lebih lambat
(beranda, kunjungan pertama, cache kosong):

| | Sebelum | Sesudah |
|---|---|---|
| First Contentful Paint | 3.608 ms | **1.740 ms** |
| Largest Contentful Paint | 3.684 ms | **1.740 ms** |
| Cumulative Layout Shift | 1,17 | **0** |
| JS sebelum render pertama | 350 KB | **0 KB** |
| Request sebelum render pertama | 23 | **3** |
| Bundle JS awal (gzip) | 362 KB | **135 KB** |

Yang membuatnya begitu:

- **Bundle dipecah per halaman.** Chunk utama 868 KB → 249 KB. Tiap halaman berat dan seluruh
  Control Panel (220 KB) jadi chunk sendiri; `withLazy` memberi tiap komponen batas `<Suspense>`
  sendiri sehingga navbar/footer tidak ikut hilang saat chunk dimuat.
- **Firestore lewat REST.** Membaca satu dokumen tidak lagi memerlukan SDK Firebase (±148 KB gzip).
  Kalau REST gagal, SDK otomatis dipakai sebagai cadangan.
- **CSS keluar dari JS.** ±66 KB tema yang dulu berupa string di dalam JS kini file CSS tersendiri.
- **Font self-hosted.** Tidak ada lagi dua koneksi ke Google Fonts; dua font inti di-preload, font
  dekoratif (±94 KB) hanya diunduh pada koneksi yang memadai.
- **Mode lite otomatis** pada koneksi lambat / Data Saver / perangkat lemah / `prefers-reduced-motion`:
  efek kanvas, blur, dan video hero dimatikan — animasi masuk tetap ada.
- **CLS nol.** Gambar yang gagal dimuat tidak lagi dihapus dari alur layout (dulu `display:none`),
  kotaknya dipertahankan sehingga halaman tidak melompat.
- Gambar Cloudinary otomatis `f_auto,q_auto,w_…`, `loading=lazy`, `decoding=async`; script tracking
  dimuat tertunda; service worker meng-cache aset; `sitemap.xml` & `robots.txt` dibuat saat build.

## Catatan keamanan (WAJIB dibaca)

1. **Login Control Panel masih dicek di sisi browser** (`HARDCODED_USERS` di `src/app/core.jsx`,
   kata sandi bawaan seperti `Admin123`). Siapa pun yang membuka DevTools bisa membacanya, dan OTP
   lupa-password dibuat di klien. Ganti kata sandi bawaan sekarang, lalu rencanakan migrasi ke
   Firebase Authentication + Firestore Rules. Sampai itu dilakukan, anggap Control Panel tidak aman
   dari penyerang yang gigih.
2. **Firestore Rules** harus mengizinkan pengunjung hanya menambah pesan/lead, bukan menimpa konfigurasi.
   Project `hk-const` masih baru — pastikan Rules-nya tidak dibiarkan terbuka penuh.
3. Seluruh website tersimpan dalam **satu dokumen Firestore (batas 1 MiB)**. Jangan simpan gambar
   base64; gunakan upload Cloudinary. Aplikasi memperingatkan saat ukuran mendekati batas.
4. **API Secret Cloudinary** dan token CAPI/Telegram/webhook hanya di environment **server** Vercel
   (tanpa prefix `VITE_`). Jangan pernah dimasukkan ke dalam kode.

## Yang masih perlu Anda lakukan

- [x] Upload preset **unsigned** `hikimori_const` di Cloudinary `dl4pyan8v` (sudah dibuat)
- [ ] Isi `CLOUDINARY_API_SECRET` di Vercel (API Key `457647378576613` sudah dicatat di `.env.example`)
- [ ] Atur Firestore Rules untuk project `hk-const`
- [ ] Ganti kata sandi Control Panel bawaan
- [ ] Ganti kontak lama (telepon, email, alamat, WA admin) lewat Control Panel → Konten & Nav
- [ ] Unggah ulang video hero ke Cloudinary baru (bawaannya masih di akun lama)
- [ ] Isi kredensial EmailJS bila fitur lupa-password lewat email ingin diaktifkan
- [ ] Isi `VITE_SITE_URL` dengan domain final

Dikembangkan oleh [Mahfud Febry Styanto](https://wa.me/6282234651413) · mahfudfebrys@gmail.com
