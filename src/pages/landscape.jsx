/* Chunk halaman "landscape" — dimuat lazy (React.lazy) saat rute ini dibuka.
   Dipisah dari RealEstateWeb.jsx agar pengunjung halaman lain tidak ikut mengunduh kode ini. */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { cld } from "../lib/net.js";
import { onImgError } from "../app/core.jsx";
import { LANDSCAPE_CATEGORIES } from "../data/landscape.js";
/* ── AutoGrowField: pengganti <input type="text"> yang saat di-fokus akan MELEBAR KE BAWAH
   (menampilkan seluruh teks yang diketik, wrap multi-baris) supaya mudah dikoreksi/di-cek ulang,
   lalu OTOMATIS MENGECIL kembali ke tampilan 1 baris saat blur / pindah field. Dipakai di semua
   form Control Panel untuk field teks pendek (judul, item, label, dsb). Field number/select/toggle
   TIDAK memakai ini karena isinya sudah pendek & tidak perlu di-expand. */
/* ── CardImg: gambar dengan skeleton shimmer per-kartu (grid/katalog) —
   tiap instance punya status loading sendiri-sendiri karena dipakai di dalam .map(). ── */
/* ── MagazineBreakSection: selingan konten (fitur/CTA WA/quote) di antara
   baris-baris magazine grid — dipakai di halaman Kost, Cafe, Ruko, Landscape
   supaya alur "1 paket → teks → 3 paket → teks → 2 paket → teks" tidak
   monoton berjejer foto terus-menerus, dan selingannya tetap relevan
   dengan topik halaman & perusahaan (bukan filler generik). ── */
function MagazineBreakSection({ variant, eyebrow, title, text, features, onWaOpen, waText, waVars, palette = {} }) {
  const p = {
    bg: palette.bg || "#FAF7F0",
    dark: palette.dark || "#2E3D3F",
    accent: palette.accent || "#8B6914",
    text: palette.text || "#2E3D3F",
    muted: palette.muted || "#5A6A6C",
  };
  if (variant === "feature") {
    return (
      <div className="mgbreak" style={{ background: p.bg }}>
        {eyebrow && <div className="mgbreak-eyebrow" style={{ color: p.accent }}>{eyebrow}</div>}
        {title && <h3 className="mgbreak-title" style={{ color: p.text }}>{title}</h3>}
        <div className="mgbreak-feature-grid">
          {features.map((f, i) => (
            <div key={i} className="mgbreak-feature-item">
              <div className="mgbreak-feature-num" style={{ color: p.accent }}>{String(i + 1).padStart(2, "0")}</div>
              <div className="mgbreak-feature-title" style={{ color: p.text }}>{f.title}</div>
              <div className="mgbreak-feature-desc" style={{ color: p.muted }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (variant === "cta") {
    return (
      <div className="mgbreak" style={{ background: p.dark }}>
        <div className="mgbreak-cta">
          {eyebrow && <div className="mgbreak-eyebrow" style={{ color: p.accent }}>{eyebrow}</div>}
          <h3 className="mgbreak-title" style={{ color: "#fff" }}>{title}</h3>
          <p className="mgbreak-cta-text" style={{ color: "rgba(255,255,255,.8)" }}>{text}</p>
          <button className="mgbreak-cta-btn" style={{ background: p.accent, color: p.dark }}
            onClick={() => onWaOpen && onWaOpen({ key: "konsultasi", vars: waVars || {} })}>
            {waText || "Hubungi via WhatsApp"}
          </button>
        </div>
      </div>
    );
  }
  if (variant === "quote") {
    return (
      <div className="mgbreak" style={{ background: p.bg }}>
        <div className="mgbreak-quote">
          <div className="mgbreak-quote-mark" style={{ color: p.accent }}>&ldquo;</div>
          <p className="mgbreak-quote-text" style={{ color: p.text }}>{text}</p>
          {title && <div className="mgbreak-quote-attrib" style={{ color: p.muted }}>{title}</div>}
        </div>
      </div>
    );
  }
  if (variant === "info") {
    return (
      <div className="mgbreak" style={{ background: p.bg }}>
        <div className="mgbreak-info">
          {eyebrow && <div className="mgbreak-eyebrow" style={{ color: p.accent }}>{eyebrow}</div>}
          <h3 className="mgbreak-title" style={{ color: p.text, marginBottom: 14 }}>{title}</h3>
          <p className="mgbreak-info-text" style={{ color: p.muted }}>{text}</p>
        </div>
      </div>
    );
  }
  return null;
}

const ELEMEN_PREMIUM = [
  { icon: "", title: "Batu Alam & Kerikil", desc: "Batu andesit, batu candi, kerikil warna — untuk jalur taman, dinding, dan aksen dekoratif.", img: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=400&q=80" },
  { icon: "", title: "Tanaman Pilihan Premium", desc: "Seleksi tanaman sesuai iklim lokal — tahan panas, mudah dirawat, dan bernilai estetis tinggi.", img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80" },
  { icon: "", title: "Pergola & Gazebo", desc: "Struktur atap taman dari kayu ulin atau besi untuk area duduk yang nyaman di luar ruangan.", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80" },
  { icon: "", title: "Tanaman Hias Eksotis", desc: "Koleksi tanaman hias langka dan eksotis — heliconia, bromelia, monstera deliciosa, agave.", img: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&q=80" },
  { icon: "", title: "Deck & Paving Custom", desc: "Decking kayu ulin, composite, atau batu paving motif custom untuk area duduk dan jalur taman.", img: "https://images.unsplash.com/photo-1558905586-b022cc14d2b3?w=400&q=80" },
  { icon: "", title: "Dekorasi & Aksesoris", desc: "Patung taman, pot artisanal, windchime, dan elemen dekorasi outdoor untuk sentuhan personal.", img: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400&q=80" },
];

/* ── Mini Slideshow untuk tiap cell magazine grid ── */
function LsMiniSlide({ slides, height = "100%" }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  const touchRef = useRef({ down: false, startX: 0, moved: false });
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIdx(p => (p + 1) % slides.length), 3800 + Math.random() * 1200);
  }, [slides.length]);
  useEffect(() => { startTimer(); return () => clearInterval(timerRef.current); }, [startTimer]);
  const go = (d) => { setIdx(p => (p + d + slides.length) % slides.length); startTimer(); };
  const sl = slides[idx];
  /* MOBILE: tap gambar = foto berikutnya, geser jari = swipe sesuai arah */
  const onTouchStart = (e) => {
    if (slides.length < 2) return;
    touchRef.current = { down: true, startX: e.touches[0].clientX, moved: false };
  };
  const onTouchMoveH = (e) => {
    if (!touchRef.current.down) return;
    if (Math.abs(e.touches[0].clientX - touchRef.current.startX) > 4) touchRef.current.moved = true;
  };
  const onTouchEndH = (e) => {
    if (!touchRef.current.down || slides.length < 2) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    const wasTap = !touchRef.current.moved;
    touchRef.current.down = false;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    else if (wasTap) go(1);
  };
  return (
    <div style={{ position: "relative", width: "100%", height, overflow: "hidden", touchAction: slides.length > 1 ? "pan-y" : "auto" }}
      onTouchStart={onTouchStart} onTouchMove={onTouchMoveH} onTouchEnd={onTouchEndH}>
      <style>{`@keyframes lmFade{from{opacity:0;transform:scale(1.05)}to{opacity:1;transform:scale(1)}}`}</style>
      <img decoding="async" loading="lazy" key={idx} src={cld(sl.img)} alt={sl.tema}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", animation: "lmFade .55s ease" }}
        onError={onImgError} />
      {/* Gradient overlay */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.78) 0%, rgba(0,0,0,.05) 55%, transparent 100%)", pointerEvents: "none" }} />
      {/* Info bottom */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 14px 14px" }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#C9AA71", marginBottom: 3 }}>{sl.tema}</div>
        <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,.88)", lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{sl.desc}</p>
      </div>
      {/* Counter */}
      <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)", color: "#C9AA71", fontSize: "0.58rem", fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>{idx + 1}/{slides.length}</div>
      {/* Arrows -- disembunyikan di mobile, diganti tap-di-gambar */}
      {slides.length > 1 && [["◀", -1], ["▶", 1]].map(([ch, d], i) => (
        <button key={i} className="slide-arrow-btn" onClick={() => go(d)}
          style={{ position: "absolute", top: "50%", [i === 0 ? "left" : "right"]: 8, transform: "translateY(-50%)", background: "rgba(0,0,0,.35)", backdropFilter: "blur(4px)", border: "none", color: "#fff", fontSize: 12, width: 28, height: 28, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>{ch}</button>
      ))}
      {/* Dots */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 4, paddingBottom: 6 }}>
        {slides.map((_, i) => (
          <div key={i} onClick={() => { setIdx(i); startTimer(); }}
            style={{ width: i === idx ? 14 : 5, height: 5, borderRadius: 3, background: i === idx ? "#C9AA71" : "rgba(255,255,255,.4)", cursor: "pointer", transition: "all .3s" }} />
        ))}
      </div>
    </div>
  );
}

/* ── Magazine Row Patterns ── */
// 6 kategori disusun: baris-1 = 1 cell, baris-2 = 3 cell, baris-3 = 2 cell
const MAG_LAYOUT = [1, 3, 2];

// total = 6, sesuai jumlah LANDSCAPE_CATEGORIES

/* ── Sub-komponen kartu info landscape dengan dropdown includes ── */
function LsInfoCard({ cat, fmt, onWaOpen }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ls-info-card">
      {/* Judul */}
      <h3 className="ls-card-title">{cat.icon} {cat.title.replace("Contoh Desain ", "")}</h3>

      {/* Deskripsi -- selalu tampil */}
      <p className="ls-desc">{cat.desc}</p>

      {/* Harga + CTA row */}
      <div className="ls-cta-row">
        {cat.tampilHarga !== false && (
          <div className="ls-price-badge">
            <span className="lb">Mulai dari</span>
            <span className="vl">{fmt(cat.startFrom)} / {cat.satuan}</span>
          </div>
        )}
        <button className="ls-cta-btn" style={cat.tampilHarga === false ? { flex: "1 1 100%" } : undefined}
          onClick={() => onWaOpen && onWaOpen({ key: "layanan", vars: { judul_layanan: cat.title } })}>
          Konsultasi {cat.tampilHarga === false ? "Sekarang" : "Gratis"}
        </button>
      </div>

      {/* Tombol toggle dropdown includes */}
      <button className="ls-toggle-btn" onClick={() => setOpen(o => !o)}>
        <span>{open ? "▲" : "▼"}</span>
        <span>{open ? "Sembunyikan Detail Paket" : "Lihat Yang Termasuk dalam Paket"}</span>
      </button>

      {/* Dropdown includes -- muncul saat open */}
      {open && (
        <div className="ls-includes-box">
          <div className="ls-includes-title">Yang Termasuk dalam Paket</div>
          <div className="ls-includes-grid">
            {(cat.includes || []).map((inc, idx) => (
              <div key={idx} className="ls-include-item">
                <span className="ic">{inc.icon}</span>
                <span className="tx">{inc.item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LandscapePage({ onWaOpen, categories }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const fmt = (n) => "Rp " + n.toLocaleString("id-ID") + ",-";
  const cats_ = ((categories && categories.length) ? categories : LANDSCAPE_CATEGORIES).filter(c => !c.hidden);

  // Susun kategori ke rows berdasar MAG_LAYOUT (desktop), berulang jika >6 kategori
  const rows = [];
  let pos = 0;
  let layoutI = 0;
  while (pos < cats_.length) {
    const cols = MAG_LAYOUT[layoutI % MAG_LAYOUT.length];
    const slice = cats_.slice(pos, pos + cols);
    if (slice.length > 0) rows.push({ cols: slice.length, cats: slice });
    pos += cols;
    layoutI++;
  }

  // Tinggi slideshow berdasar jumlah kolom di baris tersebut (desktop)
  const heightMap = { 1: 520, 2: 420, 3: 360 };

  /* Selingan konten antar baris kategori — fitur taman & pengenalan tanaman,
     relevan langsung dengan topik halaman Landscape & Taman. */
  const LANDSCAPE_BREAKS = [
    { variant: "feature", eyebrow: "Kenapa Taman Penting", title: "Kenapa Taman Penting untuk Hunian Anda",
      features: [
        { title: "Udara Lebih Sejuk", desc: "Tanaman menyerap panas dan menghasilkan oksigen, membuat suhu di sekitar rumah terasa jauh lebih sejuk sepanjang hari." },
        { title: "Nilai Estetika Naik", desc: "Taman yang tertata rapi jadi elemen pertama yang dilihat tamu — meningkatkan kesan pertama sekaligus nilai jual properti." },
        { title: "Ruang Relaksasi Keluarga", desc: "Halaman hijau memberi ruang bernafas — tempat berkumpul, bermain anak, atau sekadar duduk santai sore hari." },
      ] },
    { variant: "info", eyebrow: "Mengenal Tanaman", title: "Palem Kuning (Dypsis lutescens)",
      text: "Berasal dari Madagaskar, palem kuning populer sebagai pagar hidup dan tanaman peneduh karena tumbuh rimbun secara berumpun, tahan panas, dan minim perawatan — pilihan favorit untuk taman tropis modern." },
    { variant: "info", eyebrow: "Mengenal Tanaman", title: "Monstera Deliciosa",
      text: "Tanaman berdaun besar berlubang khas ini berasal dari hutan tropis Amerika Tengah. Selain jadi elemen dekoratif yang kuat secara visual, Monstera juga tahan di area teduh — cocok untuk taman minimalis maupun sudut rumah yang kurang sinar matahari langsung." },
  ];
  const landscapePalette = { bg: "#FAF7F0", dark: "#0d2b1a", accent: "#40916c", text: "#2E3D3F", muted: "#5A6A6C" };
  const landscapeBreakBoundaries = rows.reduce((acc, r) => { acc.push((acc[acc.length - 1] || 0) + r.cols); return acc; }, []);

  return (
    <div style={{ background: "#0d1f18", minHeight: "100vh" }}>
      <style>{`
        @keyframes lmFade { from { opacity:0; transform:scale(1.05) } to { opacity:1; transform:scale(1) } }
        @keyframes lsDropIn { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }

        /* ── Wrap cell ── */
        .ls-wrap { position:relative; display:flex; flex-direction:column; height:100%; }
        .ls-img-box { position:relative; overflow:hidden; border-radius:14px; margin-bottom:12px; box-shadow:0 6px 16px rgba(20,30,25,.12); transition:box-shadow .35s ease, transform .35s ease; }
        .ls-img-box:hover { box-shadow:0 18px 36px rgba(20,30,25,.24); transform:translateY(-5px); }
        .ls-img-box:hover .ls-mag-overlay-btn { opacity:1 !important; }
        .ls-img-box img { transition:transform .6s ease; }
        .ls-img-box:hover img { transform:scale(1.09); }

        /* ── Overlay badge & pill ── */
        .ls-cat-badge { position:absolute; top:14px; left:14px; z-index:3; }
        .ls-price-pill { position:absolute; top:14px; right:14px; z-index:3; background:rgba(201,170,113,.93); backdrop-filter:blur(6px); color:#1a2a1a; font-size:.62rem; font-weight:900; letter-spacing:.06em; padding:5px 12px; border-radius:20px; white-space:nowrap; }
        .ls-mag-overlay-btn { opacity:1; transition:opacity .3s; position:absolute; bottom:16px; right:14px; z-index:4; }
        /* Sembunyikan-sampai-hover HANYA untuk perangkat yang benar2 punya mouse/hover (desktop). Touch-only (HP & tablet) selalu tampil, karena tidak ada gestur hover di layar sentuh. */
        @media (hover:hover) and (pointer:fine) { .ls-mag-overlay-btn { opacity:0; } }

        /* ── Kartu putih ── */
        .ls-info-card { background:#fff; padding:20px 18px 22px; display:flex; flex-direction:column; flex:1; }
        .ls-card-title { font-family:'Playfair Display',serif; font-size:clamp(.88rem,1.8vw,1.05rem); font-weight:900; color:#1a2a1a; margin:0 0 8px; line-height:1.3; }
        .ls-desc { font-size:.825rem; color:#4a5a4a; line-height:1.7; margin:0 0 14px; white-space:pre-line; }

        /* ── Harga + CTA ── */
        .ls-cta-row { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; margin-bottom:12px; margin-top:auto; padding-top:14px; }
        .ls-price-badge { background:#f0fdf4; border:1.5px solid #86efac; border-radius:8px; padding:6px 14px; flex-shrink:0; }
        .ls-price-badge span.lb { display:block; font-size:.56rem; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:#166534; }
        .ls-price-badge span.vl { display:block; font-size:.8rem; font-weight:900; color:#14532d; white-space:nowrap; }
        .ls-cta-btn { background:#1a472a; color:#fff; border:none; border-radius:8px; padding:9px 16px; font-size:.73rem; font-weight:800; cursor:pointer; white-space:nowrap; transition:background .2s; flex:1; min-width:130px; text-align:center; }
        .ls-cta-btn:hover { background:#2d6a4f; }

        /* ── Toggle button ── */
        .ls-toggle-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:8px; background:#f4faf6; border:1.5px solid #bbf7d0; border-radius:8px; padding:9px 14px; font-size:.75rem; font-weight:800; color:#166534; cursor:pointer; transition:all .2s; }
        .ls-toggle-btn:hover { background:#dcfce7; border-color:#4ade80; }
        .ls-toggle-btn span:first-child { font-size:.65rem; }

        /* ── Dropdown includes ── */
        .ls-includes-box { margin-top:12px; border-top:2px dashed #bbf7d0; padding-top:14px; animation:lsDropIn .22s ease; }
        .ls-includes-title { font-size:.6rem; font-weight:900; letter-spacing:.14em; text-transform:uppercase; color:#2d6a4f; margin:0 0 10px; }
        .ls-includes-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px 12px; }
        .ls-include-item { display:flex; align-items:flex-start; gap:7px; }
        .ls-include-item span.ic { font-size:.82rem; flex-shrink:0; margin-top:1px; }
        .ls-include-item span.tx { font-size:.73rem; color:#2E3D3F; line-height:1.45; }

        /* ── MOBILE: 1 kolom penuh, slideshow height lebih pendek ── */
        @media (max-width: 767px) {
          .ls-desktop-grid { display:none !important; }
          .ls-mobile-list { display:flex !important; flex-direction:column; gap:8px; padding:8px 0 0; }
          .ls-mobile-item { width:100%; }
          .ls-mobile-slide { height:260px !important; }
          .ls-includes-grid { grid-template-columns:1fr; }
          .ls-cta-row { flex-direction:column; align-items:stretch; }
          .ls-cta-btn { text-align:center; }
          .ls-price-pill { font-size:.56rem; padding:4px 9px; }
        }

        /* ── DESKTOP: magazine grid, mobile list tersembunyi ── */
        @media (min-width: 768px) {
          .ls-mobile-list { display:none !important; }
          .ls-desktop-grid { display:flex !important; }
        }
      `}</style>

      {/* -- HERO -- */}
      <div style={{ background: "linear-gradient(135deg,#0d2b1a 0%,#1a472a 60%,#2d6a4f 100%)", padding: "64px 5% 56px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.07, backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "36px 36px", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.1)", borderRadius: 20, padding: "5px 16px", marginBottom: 18 }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "#A8D5B5" }}>HIKIMORI CONST · LANDSCAPE</span>
          </div>
          <div style={{ fontSize: "clamp(2rem,7vw,3.5rem)", marginBottom: 10 }}></div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.75rem,5vw,2.75rem)", fontWeight: 900, color: "#fff", margin: "0 0 14px", lineHeight: 1.2 }}>Landscape & Taman</h1>
          <p style={{ fontSize: "clamp(.875rem,2vw,1rem)", color: "rgba(255,255,255,.75)", lineHeight: 1.8, margin: "0 0 26px" }}>
            Dari taman depan hingga rooftop garden — kami wujudkan setiap sudut hijau impian Anda.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {cats_.map(cat => (
              <span key={cat.id} style={{ background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.85)", fontSize: "0.7rem", fontWeight: 700, padding: "5px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,.15)" }}>
                {cat.icon} {cat.title.replace("Contoh Desain ", "")}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ==================================================
          DESKTOP: Magazine Grid (1 | 3 | 2 kolom)
          Tersembunyi di mobile via CSS
      ================================================== */}
      <div className="ls-desktop-grid" style={{ flexDirection: "column", gap: 0, padding: "8px 0 0" }}>
        {rows.map((row, ri) => {
          const h = heightMap[row.cols] || 360;
          return (
            <React.Fragment key={ri}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${row.cols}, 1fr)`, gap: 8, alignItems: "stretch", marginBottom: 8 }}>
              {row.cats.map((cat) => (
                <div key={cat.id} className="ls-wrap">

                  {/* Foto slideshow */}
                  <div className="ls-img-box" style={{ height: h, position: "relative", overflow: "hidden" }}>
                    <LsMiniSlide slides={cat.slides} height={`${h}px`} />

                    {/* Badge kiri atas */}
                    <div className="ls-cat-badge">
                      <div style={{ background: "rgba(13,31,24,.78)", backdropFilter: "blur(8px)", color: "#C9AA71", fontSize: "0.62rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", padding: "5px 13px", borderRadius: 20, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>{cat.icon}</span>{cat.title.replace("Contoh Desain ", "")}
                      </div>
                    </div>

                    {/* Harga kanan atas */}
                    {cat.tampilHarga !== false && <div className="ls-price-pill">Mulai {fmt(cat.startFrom)} / {cat.satuan}</div>}

                    {/* CTA hover */}
                    <div className="ls-mag-overlay-btn">
                      <button onClick={() => onWaOpen && onWaOpen({ key: "layanan", vars: { judul_layanan: cat.title } })}
                        style={{ background: "#C9AA71", color: "#1a2a1a", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(0,0,0,.3)" }}>
                        Tanya Harga & Detail
                      </button>
                    </div>
                  </div>

                  {/* Kartu putih dengan dropdown includes */}
                  <LsInfoCard cat={cat} fmt={fmt} onWaOpen={onWaOpen} />
                </div>
              ))}
            </div>
            <MagazineBreakSection {...LANDSCAPE_BREAKS[ri % LANDSCAPE_BREAKS.length]} onWaOpen={onWaOpen} palette={landscapePalette} />
            </React.Fragment>
          );
        })}
      </div>

      {/* ==================================================
          MOBILE: 1 Kolom Penuh (semua kategori berurutan)
          Tersembunyi di desktop via CSS
      ================================================== */}
      <div className="ls-mobile-list">
        {cats_.map((cat, pi) => (
          <React.Fragment key={cat.id}>
          <div className="ls-mobile-item ls-wrap">

            {/* Foto slideshow -- tinggi lebih pendek di mobile */}
            <div className="ls-img-box ls-mobile-slide" style={{ position: "relative", overflow: "hidden", height: 260 }}>
              <LsMiniSlide slides={cat.slides} height="260px" />

              {/* Badge kiri atas */}
              <div className="ls-cat-badge">
                <div style={{ background: "rgba(13,31,24,.82)", backdropFilter: "blur(8px)", color: "#C9AA71", fontSize: "0.6rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", padding: "4px 11px", borderRadius: 20, display: "flex", alignItems: "center", gap: 5 }}>
                  <span>{cat.icon}</span>{cat.title.replace("Contoh Desain ", "")}
                </div>
              </div>

              {/* Harga kanan atas */}
              {cat.tampilHarga !== false && <div className="ls-price-pill">Mulai {fmt(cat.startFrom)} / {cat.satuan}</div>}
            </div>

            {/* Kartu putih dengan dropdown includes */}
            <LsInfoCard cat={cat} fmt={fmt} onWaOpen={onWaOpen} />
          </div>
          {landscapeBreakBoundaries.includes(pi + 1) && (
            <MagazineBreakSection {...LANDSCAPE_BREAKS[landscapeBreakBoundaries.indexOf(pi + 1) % LANDSCAPE_BREAKS.length]} onWaOpen={onWaOpen} palette={landscapePalette} />
          )}
          </React.Fragment>
        ))}
      </div>

      {/* -- ELEMEN TAMAN PREMIUM -- */}
      <div style={{ background: "#fff", padding: "64px 5%", borderTop: "3px solid #1a472a" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "#40916c", marginBottom: 8 }}>Material & Elemen</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.5rem,4vw,2.25rem)", fontWeight: 900, color: "#2E3D3F", margin: "0 0 14px" }}>Elemen Taman Premium</h2>
            <p style={{ fontSize: "0.9375rem", color: "#5A6A6C", maxWidth: 520, margin: "0 auto", lineHeight: 1.75 }}>Kami hanya menggunakan material terpilih untuk memastikan taman Anda indah, tahan lama, dan mudah dirawat.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 24 }}>
            {ELEMEN_PREMIUM.map((el, i) => (
              <div key={i} style={{ background: "#FAF7F0", borderRadius: 14, overflow: "hidden", border: "1px solid #E8DCC8", transition: "box-shadow .2s" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,.1)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                <div style={{ height: 160, overflow: "hidden", background: "#E8DCC8" }}>
                  <img decoding="async" src={cld(el.img)} alt={el.title} loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .4s" }}
                    onMouseEnter={e => e.target.style.transform = "scale(1.07)"}
                    onMouseLeave={e => e.target.style.transform = "scale(1)"}
                    onError={e => { e.target.parentElement.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem">${el.icon}</div>`; }} />
                </div>
                <div style={{ padding: "18px 18px 20px" }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>{el.icon}</div>
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, color: "#2E3D3F", margin: "0 0 8px" }}>{el.title}</h3>
                  <p style={{ fontSize: "0.8125rem", color: "#5A6A6C", lineHeight: 1.65, margin: 0, whiteSpace: "pre-line" }}>{el.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* -- CTA BOTTOM -- */}
      <div style={{ padding: "60px 5%", textAlign: "center", background: "#0d1f18" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", background: "linear-gradient(135deg,#1a472a 0%,#2d6a4f 100%)", borderRadius: 20, padding: "48px 32px", color: "#fff" }}>
          <div style={{ fontSize: "0.7rem", letterSpacing: ".14em", textTransform: "uppercase", color: "#A8D5B5", fontWeight: 700, marginBottom: 12 }}>Konsultasi Gratis</div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.25rem,3vw,1.75rem)", fontWeight: 900, margin: "0 0 12px" }}>Wujudkan Taman Impian Anda</h3>
          <p style={{ color: "rgba(255,255,255,.75)", fontSize: "0.9rem", margin: "0 0 28px", lineHeight: 1.7 }}>Tim landscape kami siap membantu dari survei, desain, hingga pemasangan dan perawatan berkala.</p>
          <button onClick={() => onWaOpen && onWaOpen({ key: "konsultasi", vars: {} })}
            style={{ background: "#C9AA71", color: "#2E3D3F", border: "none", borderRadius: 10, padding: "15px 36px", fontSize: "0.95rem", fontWeight: 800, cursor: "pointer", letterSpacing: ".05em" }}>
            Hubungi Tim Landscape Kami
          </button>
        </div>
      </div>
    </div>
  );
}

export { ELEMEN_PREMIUM, LandscapePage, LsInfoCard, LsMiniSlide, MAG_LAYOUT, MagazineBreakSection };
