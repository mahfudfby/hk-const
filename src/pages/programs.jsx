/* Chunk halaman "programs" — dimuat lazy (React.lazy) saat rute ini dibuka.
   Dipisah dari RealEstateWeb.jsx agar pengunjung halaman lain tidak ikut mengunduh kode ini. */
import React, { useState, useEffect, useRef, useCallback, useMemo, useImperativeHandle } from "react";
import { cld } from "../lib/net.js";
import { CardImg, onImgError } from "../app/core.jsx";
import { CAFE_PAKET_DATA, KOST_PAKET_DATA, RS_PAKET_DATA, RUKO_PAKET_DATA } from "../data/programs.js";
/* ── shuffleArray: acak urutan array (Fisher–Yates), tanpa mengubah array asli ── */
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── PostingSlideshowBreak: satu baris foto slideshow otomatis (running) + running
   text merah (mirip ticker promo) di bawahnya — menggantikan teks pemisah antar
   baris paket di halaman Pembangunan & Renovasi. Foto diambil acak dari galeri
   semua paket/postingan di halaman terkait; teks ticker berganti-ganti acak
   seputar promosi/konsultasi/layanan Hikimori Const. ── */
function PostingSlideshowBreak({ images, tickerTexts }) {
  if (!images || images.length === 0) return null;
  const rowPhotos = [...images, ...images];
  const texts = (tickerTexts && tickerTexts.length) ? tickerTexts : [];
  const tickerLine = texts.length ? texts.join("   -   ") : "";
  return (
    <div className="pss-wrap">
      <style>{`
        @keyframes pssScrollLeft { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes pssTickerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .pss-wrap { padding: 24px 0 0; overflow: hidden; }
        .pss-row { display: flex; gap: 12px; width: max-content; will-change: transform; animation: pssScrollLeft 38s linear infinite; }
        .pss-item { flex-shrink: 0; width: 220px; height: 150px; border-radius: 12px; overflow: hidden; box-shadow: 0 6px 16px rgba(20,30,25,.12); }
        .pss-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pss-ticker-wrap { margin-top: 18px; overflow: hidden; background: #fff; border-top: 2px solid #DC2626; border-bottom: 2px solid #DC2626; padding: 9px 0; }
        .pss-ticker-track { display: flex; width: max-content; white-space: nowrap; animation: pssTickerScroll 22s linear infinite; }
        .pss-ticker-seg { color: #DC2626; font-weight: 900; font-size: .82rem; letter-spacing: .04em; text-transform: uppercase; padding-right: 40px; }
        @media (max-width: 767px) {
          .pss-item { width: 140px; height: 100px; }
          .pss-row { animation-duration: 26s; }
          .pss-ticker-track { animation-duration: 16s; }
          .pss-ticker-seg { font-size: .72rem; padding-right: 24px; }
        }
      `}</style>
      <div className="pss-row">
        {rowPhotos.map((src, i) => (
          <div className="pss-item" key={"pss-" + i}><img decoding="async" src={cld(src)} alt="" loading="lazy" /></div>
        ))}
      </div>
      {tickerLine && (
        <div className="pss-ticker-wrap">
          <div className="pss-ticker-track">
            <span className="pss-ticker-seg">{tickerLine}</span>
            <span className="pss-ticker-seg">{tickerLine}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Pola baris magazine grid: 1 | 3 | 2 (ulangi jika >6 paket) ── */
const RS_MAG_LAYOUT = [1, 3, 2];

/* Tinggi kotak foto besar (px): desktop per jumlah kolom baris, dan mobile 1 kolom.
   Dipakai bersama oleh halaman Renovasi Rumah Subsidi, Kost, Cafe, dan Ruko. */
const RS_IMG_HEIGHT_MAP = { 1: 620, 2: 520, 3: 440 };

const RS_MOBILE_IMG_H = 340;

/* ── Mini Slideshow dengan animasi arah berbeda per paket ──
   forwardRef supaya komponen luar (dots navigasi di bawah gambar) bisa
   memerintah pindah slide lewat ref.current.goTo(i), dan onIndexChange
   dipakai supaya komponen luar tahu slide mana yang sedang aktif. ── */
const RsMiniSlide = React.forwardRef(function RsMiniSlide({ slides, slideDir = "right", height = "100%", onIndexChange }, ref) {
  const [idx, setIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(null);
  const [animating, setAnimating] = useState(false);
  const clearRef = useRef(null);
  const idxRef = useRef(0);
  const touchRef = useRef({ down: false, startX: 0, moved: false });
  /* Skeleton loading: lacak index foto yang sudah pernah selesai dimuat,
     supaya shimmer cuma tampil sekali per foto (bukan tiap kali slide berulang). */
  const [loadedSet, setLoadedSet] = useState(() => new Set());
  const markLoaded = (i) => setLoadedSet(prev => prev.has(i) ? prev : new Set(prev).add(i));
  const curLoaded = loadedSet.has(idx);

  const advance = useCallback((step = 1) => {
    const current = idxRef.current;
    const next = (current + step + slides.length) % slides.length;
    setPrevIdx(current);
    setIdx(next);
    idxRef.current = next;
    setAnimating(true);
    clearTimeout(clearRef.current);
    clearRef.current = setTimeout(() => { setAnimating(false); setPrevIdx(null); }, 400);
  }, [slides.length]);

  const goTo = useCallback((i) => {
    const current = idxRef.current;
    if (i === current || i < 0 || i >= slides.length) return;
    setPrevIdx(current);
    setIdx(i);
    idxRef.current = i;
    setAnimating(true);
    clearTimeout(clearRef.current);
    clearRef.current = setTimeout(() => { setAnimating(false); setPrevIdx(null); }, 400);
  }, [slides.length]);

  useImperativeHandle(ref, () => ({ goTo }), [goTo]);
  useEffect(() => { onIndexChange && onIndexChange(idx); }, [idx, onIndexChange]);

  /* AUTO-SLIDE DIMATIKAN: foto hanya berganti lewat klik thumbnail, tap, atau swipe. */
  useEffect(() => () => clearTimeout(clearRef.current), []);

  /* MOBILE: tap gambar = foto berikutnya, geser jari = swipe sesuai arah
     (sebelumnya slideshow ini murni otomatis, tidak ada kontrol manual sama sekali) */
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
    if (Math.abs(dx) > 40) advance(dx < 0 ? 1 : -1);
    else if (wasTap) advance(1);
  };

  const dirIn = { right: "rsSlideInRight", up: "rsSlideInUp", left: "rsSlideInLeft", down: "rsSlideInDown" };
  const dirOut = { right: "rsSlideOutRight", up: "rsSlideOutUp", left: "rsSlideOutLeft", down: "rsSlideOutDown" };
  const sl = slides[idx];

  return (
    <div style={{ position: "relative", width: "100%", height, overflow: "hidden", background: "#1a1a1a", touchAction: slides.length > 1 ? "pan-y" : "auto" }}
      onTouchStart={onTouchStart} onTouchMove={onTouchMoveH} onTouchEnd={onTouchEndH}>
      {prevIdx !== null && animating && (
        <img decoding="async" loading="lazy" key={`p${prevIdx}`} src={cld(slides[prevIdx].img)} alt={slides[prevIdx].tema}
          className={dirOut[slideDir]}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          onError={onImgError} />
      )}
      {!curLoaded && <div className="img-skeleton" />}
      <img decoding="async" loading="lazy" key={`c${idx}`} src={cld(sl.img)} alt={sl.tema}
        className={animating ? dirIn[slideDir] : ""}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: curLoaded ? 1 : 0, transition: "opacity .4s ease" }}
        onLoad={() => markLoaded(idx)}
        onError={e => { onImgError(e); markLoaded(idx); }} />
      {/* Gradient overlay + caption */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.75) 0%, rgba(0,0,0,.05) 55%, transparent 100%)", pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 14px 14px", zIndex: 2 }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#C9AA71", marginBottom: 3 }}>{sl.tema}</div>
        <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,.88)", lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{sl.desc}</p>
      </div>
      {/* Counter */}
      <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)", color: "#C9AA71", fontSize: "0.58rem", fontWeight: 800, padding: "2px 8px", borderRadius: 20, zIndex: 3 }}>{idx + 1}/{slides.length}</div>
    </div>
  );
});

/* ── RsSlideThumbs: strip MINI THUMBNAIL seluruh foto slideshow, diletakkan di BAWAH
   kotak gambar (bukan menimpa gambar) — klik thumbnail untuk lompat langsung ke foto
   tersebut di RsMiniSlide. Thumbnail aktif ditandai border emas & otomatis digulir ke
   tengah strip saat foto berganti lewat klik/tap/swipe (tanpa menggeser scroll halaman). ── */
const RS_THUMB_CSS = `
        .rs-thumbs { position:relative; overflow-x:auto; overflow-y:hidden; padding:10px 6px 8px; scrollbar-width:thin; scrollbar-color:#d8cdb8 transparent; -webkit-overflow-scrolling:touch; }
        .rs-thumbs-inner { display:flex; gap:6px; width:max-content; margin:0 auto; }
        .rs-thumb { position:relative; flex:0 0 auto; width:64px; height:46px; padding:0; border:2px solid transparent; border-radius:8px; overflow:hidden; background:#E8DCC8; cursor:pointer; opacity:.6; transition:opacity .2s ease, transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
        .rs-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
        .rs-thumb:hover { opacity:1; transform:translateY(-2px); box-shadow:0 3px 8px rgba(0,0,0,.18); }
        .rs-thumb:active { transform:translateY(0) scale(.96); }
        .rs-thumb:focus-visible { opacity:1; outline:2px solid #2E3D3F; outline-offset:2px; border-radius:8px; }
        .rs-thumb.active { opacity:1; border-color:#8B6914; box-shadow:0 0 0 1px rgba(139,105,20,.35); }
        @media (max-width: 767px) { .rs-thumb { width:60px; height:44px; } }
        @media (prefers-reduced-motion: reduce) { .rs-thumb { transition:none; } .rs-thumb:hover, .rs-thumb:active { transform:none; } }
`;

function RsSlideThumbs({ slides, active, onSelect }) {
  const stripRef = useRef(null);
  const btnRefs = useRef([]);
  const total = slides ? slides.length : 0;

  /* Gulir strip (horizontal saja) supaya thumbnail aktif selalu terlihat di tengah,
     tanpa scrollIntoView agar halaman tidak ikut tergeser vertikal tiap 3 detik. */
  useEffect(() => {
    const strip = stripRef.current;
    const btn = btnRefs.current[active];
    if (!strip || !btn || strip.scrollWidth <= strip.clientWidth) return;
    const reduce = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    strip.scrollTo({ left: btn.offsetLeft - (strip.clientWidth - btn.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
  }, [active, total]);

  if (total < 2) return null;
  return (
    <div className="rs-thumbs" ref={stripRef} role="group" aria-label="Pilih foto galeri paket">
      <div className="rs-thumbs-inner">
        {slides.map((sl, i) => (
          <button key={i} type="button"
            ref={el => { btnRefs.current[i] = el; }}
            className={`rs-thumb${i === active ? " active" : ""}`}
            aria-label={`Lihat foto ${i + 1} dari ${total}${sl.tema ? `: ${sl.tema}` : ""}`}
            aria-current={i === active ? "true" : undefined}
            onClick={() => onSelect(i)}>
            <CardImg src={sl.img} alt={sl.tema || `Foto ${i + 1}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── RsPaketVisual: kotak gambar slideshow + badge kategori + harga (+ tombol WA
   di versi desktop), DIIKUTI strip mini thumbnail yang diletakkan di luar/bawah kotak
   gambar supaya tidak pernah menutupi foto. Dipakai di halaman Renovasi Rumah
   Subsidi, Pembangunan Kost, Cafe, dan Ruko (desktop & mobile). ── */
function RsPaketVisual({ paket, fmt, onWaOpen, height, mobile }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const slideRef = useRef(null);
  return (
    <>
      <div className={mobile ? "ls-img-box ls-mobile-slide" : "ls-img-box"}
        style={mobile ? { position: "relative", overflow: "hidden", height: RS_MOBILE_IMG_H } : { height, position: "relative", overflow: "hidden" }}>
        <RsMiniSlide ref={slideRef} slides={paket.slides} slideDir={paket.slideDir}
          height={mobile ? `${RS_MOBILE_IMG_H}px` : `${height}px`} onIndexChange={setActiveIdx} />

        <div className="ls-cat-badge">
          <div style={{ background: "rgba(13,31,24,.78)", backdropFilter: "blur(8px)", color: "#C9AA71", fontSize: mobile ? "0.6rem" : "0.62rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", padding: mobile ? "4px 11px" : "5px 13px", borderRadius: 20, display: "flex", alignItems: "center", gap: mobile ? 5 : 6 }}>
            {paket.icon && <span>{paket.icon}</span>}<span>{paket.title}</span>
          </div>
        </div>

        <div className="ls-price-pill">Mulai {fmt(paket.startFrom)} / {paket.satuan}</div>

        {!mobile && (
          <div className="ls-mag-overlay-btn">
            <button onClick={() => onWaOpen && onWaOpen({ key: "layanan", vars: { judul_layanan: paket.title } })}
              style={{ background: "#C9AA71", color: "#1a2a1a", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(0,0,0,.3)" }}>
              Tanya Harga & Detail
            </button>
          </div>
        )}
      </div>
      <RsSlideThumbs slides={paket.slides} active={activeIdx} onSelect={(i) => slideRef.current && slideRef.current.goTo(i)} />
    </>
  );
}

/* ── Kartu info putih dengan dropdown "Yang Termasuk" — state independen per paket ── */
function RsInfoCard({ paket, fmt, onWaOpen }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ls-info-card">
      <h3 className="ls-card-title">{paket.icon ? `${paket.icon} ` : ""}{paket.title}</h3>
      <p className="ls-desc">{paket.desc}</p>

      <div className="ls-cta-row">
        <div className="ls-price-badge">
          <span className="lb">Mulai dari</span>
          <span className="vl">{fmt(paket.startFrom)} / {paket.satuan}</span>
        </div>
        <button className="ls-cta-btn"
          onClick={() => onWaOpen && onWaOpen({ key: "layanan", vars: { judul_layanan: paket.title } })}>
          Konsultasi Sekarang
        </button>
      </div>

      <button className="ls-toggle-btn" onClick={() => setOpen(o => !o)}>
        {open ? (
          <><span>▲</span><span>Sembunyikan Detail</span></>
        ) : (
          <><span></span><span>Lihat Yang Termasuk ▼</span></>
        )}
      </button>

      {open && (
        <div className="ls-includes-box">
          <div className="ls-includes-title">Yang Termasuk dalam Paket</div>
          <div className="ls-includes-grid">
            {(paket.includes || []).map((inc, idx) => (
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

/* ── Halaman Program Renovasi Rumah Subsidi (Magazine Mixing Grid) ── */
function RumahSubsidiPage({ onWaOpen, paketData }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const fmt = (n) => "Rp " + n.toLocaleString("id-ID") + ",-";
  const paket_ = ((paketData && paketData.length) ? paketData : RS_PAKET_DATA).filter(p => !p.hidden);

  // Susun paket ke rows sesuai RS_MAG_LAYOUT (1 | 3 | 2), berulang jika >6 paket
  const rows = [];
  let pos = 0;
  let layoutIdx = 0;
  while (pos < paket_.length) {
    const cols = RS_MAG_LAYOUT[layoutIdx % RS_MAG_LAYOUT.length];
    const slice = paket_.slice(pos, pos + cols);
    if (slice.length > 0) rows.push({ cols: slice.length, items: slice });
    pos += cols;
    layoutIdx++;
  }
  const heightMap = RS_IMG_HEIGHT_MAP;

  /* Pool foto untuk selingan slideshow antar baris paket — diacak dari galeri semua paket renovasi rumah subsidi */
  const rsImagePool = useMemo(() => shuffleArray(paket_.flatMap(p => (p.slides || []).map(s => s.img))), [paket_]);
  const rsTickerTexts = useMemo(() => shuffleArray([
    "KONSULTASI GRATIS RENOVASI RUMAH SUBSIDI",
    "HIKIMORI CONST — TIM RENOVASI BERPENGALAMAN",
    "WUJUDKAN RUMAH SUBSIDI IMPIAN BERSAMA HIKIMORI CONST",
    "HUBUNGI KAMI VIA WHATSAPP UNTUK SURVEI GRATIS",
  ]), []);
  const rsBreakBoundaries = rows.reduce((acc, r) => { acc.push((acc[acc.length - 1] || 0) + r.cols); return acc; }, []);

  return (
    <div className="fade-in" style={{ background: "#FAF7F0", minHeight: "100vh" }}>
      <style>{`
        @keyframes rsSlideInRight  { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes rsSlideOutRight { from { transform: translateX(0); } to { transform: translateX(100%); } }
        @keyframes rsSlideInUp     { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes rsSlideOutUp    { from { transform: translateY(0); } to { transform: translateY(-100%); } }
        @keyframes rsSlideInLeft   { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes rsSlideOutLeft  { from { transform: translateX(0); } to { transform: translateX(-100%); } }
        @keyframes rsSlideInDown   { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        @keyframes rsSlideOutDown  { from { transform: translateY(0); } to { transform: translateY(100%); } }
        .rsSlideInRight,.rsSlideOutRight,.rsSlideInUp,.rsSlideOutUp,.rsSlideInLeft,.rsSlideOutLeft,.rsSlideInDown,.rsSlideOutDown {
          animation-duration: .4s; animation-timing-function: ease; animation-fill-mode: forwards; z-index: 1;
        }
        @keyframes lsDropIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }

        .ls-wrap { position:relative; display:flex; flex-direction:column; height:100%; }
        .ls-img-box { position:relative; overflow:hidden; border-radius:14px; margin-bottom:12px; box-shadow:0 6px 16px rgba(20,30,25,.12); transition:box-shadow .35s ease, transform .35s ease; }
        .ls-img-box:hover { box-shadow:0 18px 36px rgba(20,30,25,.24); transform:translateY(-5px); }
        .ls-img-box:hover .ls-mag-overlay-btn { opacity:1 !important; }
        .ls-img-box img { transition:transform .6s ease; }
        .ls-img-box:hover img { transform:scale(1.09); }

        .ls-cat-badge { position:absolute; top:14px; left:14px; right:100px; z-index:4; }
        .ls-cat-badge > div { max-width: 100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ls-price-pill { position:absolute; top:14px; right:14px; z-index:4; background:rgba(201,170,113,.93); backdrop-filter:blur(6px); color:#1a2a1a; font-size:.62rem; font-weight:900; letter-spacing:.06em; padding:5px 12px; border-radius:20px; white-space:nowrap; max-width:120px; overflow:hidden; text-overflow:ellipsis; }
        .ls-mag-overlay-btn { opacity:1; transition:opacity .3s; position:absolute; bottom:16px; right:14px; z-index:4; }
        /* Sembunyikan-sampai-hover HANYA untuk perangkat yang benar2 punya mouse/hover (desktop). Touch-only (HP & tablet) selalu tampil, karena tidak ada gestur hover di layar sentuh. */
        @media (hover:hover) and (pointer:fine) { .ls-mag-overlay-btn { opacity:0; } }

        .ls-info-card { background:#fff; padding:20px 18px 22px; display:flex; flex-direction:column; flex:1; }
        .ls-card-title { font-family:'Playfair Display',serif; font-size:clamp(.88rem,1.8vw,1.05rem); font-weight:900; color:#2E3D3F; margin:0 0 8px; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .ls-desc { font-size:.825rem; color:#5A6A6C; line-height:1.7; margin:0 0 14px; white-space:pre-line; }

        .ls-cta-row { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; margin-bottom:12px; margin-top:auto; padding-top:14px; }
        .ls-price-badge { background:#f0fdf4; border:1.5px solid #86efac; border-radius:8px; padding:6px 14px; flex-shrink:0; }
        .ls-price-badge span.lb { display:block; font-size:.56rem; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:#166534; }
        .ls-price-badge span.vl { display:block; font-size:.8rem; font-weight:900; color:#14532d; white-space:nowrap; }
        .ls-cta-btn { background:#2E3D3F; color:#fff; border:none; border-radius:8px; padding:9px 16px; font-size:.73rem; font-weight:800; cursor:pointer; white-space:nowrap; transition:background .2s; flex:1; min-width:130px; text-align:center; }
        .ls-cta-btn:hover { background:#8B6914; }

        .ls-toggle-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:8px; background:#f4faf6; border:1.5px solid #bbf7d0; border-radius:8px; padding:9px 14px; font-size:.75rem; font-weight:800; color:#166534; cursor:pointer; transition:all .2s; }
        .ls-toggle-btn:hover { background:#dcfce7; border-color:#4ade80; }
        .ls-toggle-btn span:first-child { font-size:.65rem; }

        .ls-includes-box { margin-top:12px; border-top:2px dashed #bbf7d0; padding-top:14px; animation:lsDropIn .22s ease; }
        ${RS_THUMB_CSS}
        .ls-includes-title { font-size:.6rem; font-weight:900; letter-spacing:.14em; text-transform:uppercase; color:#2d6a4f; margin:0 0 10px; }
        .ls-includes-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px 12px; }
        .ls-include-item { display:flex; align-items:flex-start; gap:7px; }
        .ls-include-item span.ic { font-size:.82rem; flex-shrink:0; margin-top:1px; }
        .ls-include-item span.tx { font-size:.73rem; color:#2E3D3F; line-height:1.45; }

        @media (max-width: 767px) {
          .ls-desktop-grid { display:none !important; }
          .ls-mobile-list { display:flex !important; flex-direction:column; gap:8px; padding:8px 0 0; }
          .ls-mobile-item { width:100%; }
          .ls-mobile-slide { height:${RS_MOBILE_IMG_H}px !important; }
          .ls-includes-grid { grid-template-columns:1fr; }
          .ls-cta-row { flex-direction:column; align-items:stretch; }
          .ls-cta-btn { text-align:center; }
          .ls-price-pill { font-size:.56rem; padding:4px 9px; }
        }
        @media (min-width: 768px) {
          .ls-mobile-list { display:none !important; }
          .ls-desktop-grid { display:flex !important; }
        }
      `}</style>

      {/* HERO */}
      <div style={{ background: "linear-gradient(135deg,#2E3D3F 0%,#3D5254 60%,#8B6914 100%)", padding: "64px 5% 56px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.07, backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "36px 36px", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.1)", borderRadius: 20, padding: "5px 16px", marginBottom: 18 }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "#C9AA71" }}>HIKIMORI CONST · PROGRAM RENOVASI</span>
          </div>
          <div style={{ fontSize: "clamp(2rem,7vw,3.5rem)", marginBottom: 10 }}></div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.75rem,5vw,2.75rem)", fontWeight: 900, color: "#fff", margin: "0 0 14px", lineHeight: 1.2 }}>Renovasi Rumah Subsidi</h1>
          <p style={{ fontSize: "clamp(.875rem,2vw,1rem)", color: "rgba(255,255,255,.75)", lineHeight: 1.8, margin: "0 0 26px" }}>
            Tingkatkan kualitas hunian subsidi Anda — dari perbaikan ringan hingga renovasi total, dikerjakan tukang berpengalaman dengan harga terjangkau.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {paket_.map(p => (
              <span key={p.id} style={{ background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.85)", fontSize: "0.7rem", fontWeight: 700, padding: "5px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,.15)" }}>
                {p.icon} {p.title.replace("Renovasi ", "")}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* DESKTOP: Magazine Mixing Grid */}
      <div className="ls-desktop-grid" style={{ flexDirection: "column", gap: 0, padding: "8px 0 0" }}>
        {rows.map((row, ri) => {
          const h = heightMap[row.cols] || 360;
          return (
            <React.Fragment key={ri}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${row.cols}, 1fr)`, gap: 8, alignItems: "stretch", marginBottom: 8 }}>
              {row.items.map((paket) => (
                <div key={paket.id} className="ls-wrap">
                  <RsPaketVisual paket={paket} fmt={fmt} onWaOpen={onWaOpen} height={h} />

                  <RsInfoCard paket={paket} fmt={fmt} onWaOpen={onWaOpen} />
                </div>
              ))}
            </div>
            <PostingSlideshowBreak images={rsImagePool} tickerTexts={rsTickerTexts} />
            </React.Fragment>
          );
        })}
      </div>

      {/* MOBILE: 1 Kolom Penuh */}
      <div className="ls-mobile-list">
        {paket_.map((paket, pi) => (
          <React.Fragment key={paket.id}>
          <div className="ls-mobile-item ls-wrap">
            <RsPaketVisual paket={paket} fmt={fmt} onWaOpen={onWaOpen} mobile />

            <RsInfoCard paket={paket} fmt={fmt} onWaOpen={onWaOpen} />
          </div>
          {rsBreakBoundaries.includes(pi + 1) && (
            <PostingSlideshowBreak images={rsImagePool} tickerTexts={rsTickerTexts} />
          )}
          </React.Fragment>
        ))}
      </div>

      {/* CTA BOTTOM */}
      <div style={{ padding: "60px 5%", textAlign: "center", background: "#FAF7F0" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", background: "linear-gradient(135deg,#2E3D3F 0%,#8B6914 100%)", borderRadius: 20, padding: "48px 32px", color: "#fff" }}>
          <div style={{ fontSize: "0.7rem", letterSpacing: ".14em", textTransform: "uppercase", color: "#C9AA71", fontWeight: 700, marginBottom: 12 }}>Konsultasi Gratis</div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.25rem,3vw,1.75rem)", fontWeight: 900, margin: "0 0 12px" }}>Wujudkan Rumah Subsidi yang Lebih Layak</h3>
          <p style={{ color: "rgba(255,255,255,.75)", fontSize: "0.9rem", margin: "0 0 28px", lineHeight: 1.7 }}>Tim kami siap survei, menghitung RAB, dan mengerjakan renovasi rumah subsidi Anda dari awal hingga selesai.</p>
          <button onClick={() => onWaOpen && onWaOpen({ key: "konsultasi", vars: {} })}
            style={{ background: "#C9AA71", color: "#2E3D3F", border: "none", borderRadius: 10, padding: "15px 36px", fontSize: "0.95rem", fontWeight: 800, cursor: "pointer", letterSpacing: ".05em" }}>
            Hubungi Tim Renovasi Kami
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Halaman Program Pembangunan Kost (Magazine Mixing Grid) ──
   Reuse RsMiniSlide & RsInfoCard dari section Rumah Subsidi di atas —
   struktur & style class (ls-*) sengaja identik supaya konsisten. */
function PembangunanKostPage({ onWaOpen, paketData }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const fmt = (n) => "Rp " + n.toLocaleString("id-ID") + ",-";
  const paket_ = ((paketData && paketData.length) ? paketData : KOST_PAKET_DATA).filter(p => !p.hidden);

  // Susun paket ke rows sesuai RS_MAG_LAYOUT (1 | 3 | 2), berulang jika >6 paket
  const rows = [];
  let pos = 0;
  let layoutIdx = 0;
  while (pos < paket_.length) {
    const cols = RS_MAG_LAYOUT[layoutIdx % RS_MAG_LAYOUT.length];
    const slice = paket_.slice(pos, pos + cols);
    if (slice.length > 0) rows.push({ cols: slice.length, items: slice });
    pos += cols;
    layoutIdx++;
  }
  const heightMap = RS_IMG_HEIGHT_MAP;

  /* Pool foto untuk selingan slideshow antar baris paket — diacak dari galeri semua paket pembangunan kost */
  const kostImagePool = useMemo(() => shuffleArray(paket_.flatMap(p => (p.slides || []).map(s => s.img))), [paket_]);
  const kostTickerTexts = useMemo(() => shuffleArray([
    "KONSULTASI GRATIS PEMBANGUNAN KOST",
    "HIKIMORI CONST — SOLUSI BISNIS KOST MENGUNTUNGKAN",
    "SURVEI LOKASI GRATIS SEBELUM MEMBANGUN",
    "BANGUN KOST ANDA BERSAMA TIM BERPENGALAMAN",
    "HUBUNGI KAMI VIA WHATSAPP SEKARANG",
  ]), []);
  /* Batas indeks kumulatif tiap baris — dipakai versi mobile untuk tahu selingan mana yang jatuh setelah item ke berapa */
  const kostBreakBoundaries = rows.reduce((acc, r) => { acc.push((acc[acc.length - 1] || 0) + r.cols); return acc; }, []);

  return (
    <div className="fade-in" style={{ background: "#FAF7F0", minHeight: "100vh" }}>
      <style>{`
        @keyframes rsSlideInRight  { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes rsSlideOutRight { from { transform: translateX(0); } to { transform: translateX(100%); } }
        @keyframes rsSlideInUp     { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes rsSlideOutUp    { from { transform: translateY(0); } to { transform: translateY(-100%); } }
        @keyframes rsSlideInLeft   { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes rsSlideOutLeft  { from { transform: translateX(0); } to { transform: translateX(-100%); } }
        @keyframes rsSlideInDown   { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        @keyframes rsSlideOutDown  { from { transform: translateY(0); } to { transform: translateY(100%); } }
        .rsSlideInRight,.rsSlideOutRight,.rsSlideInUp,.rsSlideOutUp,.rsSlideInLeft,.rsSlideOutLeft,.rsSlideInDown,.rsSlideOutDown {
          animation-duration: .4s; animation-timing-function: ease; animation-fill-mode: forwards; z-index: 1;
        }
        @keyframes lsDropIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }

        .ls-wrap { position:relative; display:flex; flex-direction:column; height:100%; }
        .ls-img-box { position:relative; overflow:hidden; border-radius:14px; margin-bottom:12px; box-shadow:0 6px 16px rgba(20,30,25,.12); transition:box-shadow .35s ease, transform .35s ease; }
        .ls-img-box:hover { box-shadow:0 18px 36px rgba(20,30,25,.24); transform:translateY(-5px); }
        .ls-img-box:hover .ls-mag-overlay-btn { opacity:1 !important; }
        .ls-img-box img { transition:transform .6s ease; }
        .ls-img-box:hover img { transform:scale(1.09); }

        .ls-cat-badge { position:absolute; top:14px; left:14px; right:100px; z-index:4; }
        .ls-cat-badge > div { max-width: 100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ls-price-pill { position:absolute; top:14px; right:14px; z-index:4; background:rgba(201,170,113,.93); backdrop-filter:blur(6px); color:#1a2a1a; font-size:.62rem; font-weight:900; letter-spacing:.06em; padding:5px 12px; border-radius:20px; white-space:nowrap; max-width:120px; overflow:hidden; text-overflow:ellipsis; }
        .ls-mag-overlay-btn { opacity:1; transition:opacity .3s; position:absolute; bottom:16px; right:14px; z-index:4; }
        /* Sembunyikan-sampai-hover HANYA untuk perangkat yang benar2 punya mouse/hover (desktop). Touch-only (HP & tablet) selalu tampil, karena tidak ada gestur hover di layar sentuh. */
        @media (hover:hover) and (pointer:fine) { .ls-mag-overlay-btn { opacity:0; } }

        .ls-info-card { background:#fff; padding:20px 18px 22px; display:flex; flex-direction:column; flex:1; }
        .ls-card-title { font-family:'Playfair Display',serif; font-size:clamp(.88rem,1.8vw,1.05rem); font-weight:900; color:#2E3D3F; margin:0 0 8px; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .ls-desc { font-size:.825rem; color:#5A6A6C; line-height:1.7; margin:0 0 14px; white-space:pre-line; }

        .ls-cta-row { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; margin-bottom:12px; margin-top:auto; padding-top:14px; }
        .ls-price-badge { background:#f0fdf4; border:1.5px solid #86efac; border-radius:8px; padding:6px 14px; flex-shrink:0; }
        .ls-price-badge span.lb { display:block; font-size:.56rem; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:#166534; }
        .ls-price-badge span.vl { display:block; font-size:.8rem; font-weight:900; color:#14532d; white-space:nowrap; }
        .ls-cta-btn { background:#2E3D3F; color:#fff; border:none; border-radius:8px; padding:9px 16px; font-size:.73rem; font-weight:800; cursor:pointer; white-space:nowrap; transition:background .2s; flex:1; min-width:130px; text-align:center; }
        .ls-cta-btn:hover { background:#8B6914; }

        .ls-toggle-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:8px; background:#f4faf6; border:1.5px solid #bbf7d0; border-radius:8px; padding:9px 14px; font-size:.75rem; font-weight:800; color:#166534; cursor:pointer; transition:all .2s; }
        .ls-toggle-btn:hover { background:#dcfce7; border-color:#4ade80; }
        .ls-toggle-btn span:first-child { font-size:.65rem; }

        .ls-includes-box { margin-top:12px; border-top:2px dashed #bbf7d0; padding-top:14px; animation:lsDropIn .22s ease; }
        ${RS_THUMB_CSS}
        .ls-includes-title { font-size:.6rem; font-weight:900; letter-spacing:.14em; text-transform:uppercase; color:#2d6a4f; margin:0 0 10px; }
        .ls-includes-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px 12px; }
        .ls-include-item { display:flex; align-items:flex-start; gap:7px; }
        .ls-include-item span.ic { font-size:.82rem; flex-shrink:0; margin-top:1px; }
        .ls-include-item span.tx { font-size:.73rem; color:#2E3D3F; line-height:1.45; }

        @media (max-width: 767px) {
          .ls-desktop-grid { display:none !important; }
          .ls-mobile-list { display:flex !important; flex-direction:column; gap:8px; padding:8px 0 0; }
          .ls-mobile-item { width:100%; }
          .ls-mobile-slide { height:${RS_MOBILE_IMG_H}px !important; }
          .ls-includes-grid { grid-template-columns:1fr; }
          .ls-cta-row { flex-direction:column; align-items:stretch; }
          .ls-cta-btn { text-align:center; }
          .ls-price-pill { font-size:.56rem; padding:4px 9px; }
        }
        @media (min-width: 768px) {
          .ls-mobile-list { display:none !important; }
          .ls-desktop-grid { display:flex !important; }
        }
      `}</style>

      {/* HERO */}
      <div style={{ background: "linear-gradient(135deg,#2E3D3F 0%,#3D5254 60%,#8B6914 100%)", padding: "64px 5% 56px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.07, backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "36px 36px", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.1)", borderRadius: 20, padding: "5px 16px", marginBottom: 18 }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "#C9AA71" }}>HIKIMORI CONST · PROGRAM PEMBANGUNAN</span>
          </div>
          <div style={{ fontSize: "clamp(2rem,7vw,3.5rem)", marginBottom: 10 }}></div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.75rem,5vw,2.75rem)", fontWeight: 900, color: "#fff", margin: "0 0 14px", lineHeight: 1.2 }}>Pembangunan Kost</h1>
          <p style={{ fontSize: "clamp(.875rem,2vw,1rem)", color: "rgba(255,255,255,.75)", lineHeight: 1.8, margin: "0 0 26px" }}>
            Wujudkan bisnis kost yang menguntungkan — dari pembangunan baru 1-2 lantai, kamar mandi dalam, hingga full furnished, dikerjakan tim berpengalaman dengan harga bersaing.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {paket_.map(p => (
              <span key={p.id} style={{ background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.85)", fontSize: "0.7rem", fontWeight: 700, padding: "5px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,.15)" }}>
                {p.icon} {p.title.replace("Pembangunan ", "")}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* DESKTOP: Magazine Mixing Grid */}
      <div className="ls-desktop-grid" style={{ flexDirection: "column", gap: 0, padding: "8px 0 0" }}>
        {rows.map((row, ri) => {
          const h = heightMap[row.cols] || 360;
          return (
            <React.Fragment key={ri}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${row.cols}, 1fr)`, gap: 8, alignItems: "stretch", marginBottom: 8 }}>
              {row.items.map((paket) => (
                <div key={paket.id} className="ls-wrap">
                  <RsPaketVisual paket={paket} fmt={fmt} onWaOpen={onWaOpen} height={h} />

                  <RsInfoCard paket={paket} fmt={fmt} onWaOpen={onWaOpen} />
                </div>
              ))}
            </div>
            <PostingSlideshowBreak images={kostImagePool} tickerTexts={kostTickerTexts} />
            </React.Fragment>
          );
        })}
      </div>

      {/* MOBILE: 1 Kolom Penuh */}
      <div className="ls-mobile-list">
        {paket_.map((paket, pi) => (
          <React.Fragment key={paket.id}>
          <div className="ls-mobile-item ls-wrap">
            <RsPaketVisual paket={paket} fmt={fmt} onWaOpen={onWaOpen} mobile />

            <RsInfoCard paket={paket} fmt={fmt} onWaOpen={onWaOpen} />
          </div>
          {kostBreakBoundaries.includes(pi + 1) && (
            <PostingSlideshowBreak images={kostImagePool} tickerTexts={kostTickerTexts} />
          )}
          </React.Fragment>
        ))}
      </div>

      {/* CTA BOTTOM */}
      <div style={{ padding: "60px 5%", textAlign: "center", background: "#FAF7F0" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", background: "linear-gradient(135deg,#2E3D3F 0%,#8B6914 100%)", borderRadius: 20, padding: "48px 32px", color: "#fff" }}>
          <div style={{ fontSize: "0.7rem", letterSpacing: ".14em", textTransform: "uppercase", color: "#C9AA71", fontWeight: 700, marginBottom: 12 }}>Konsultasi Gratis</div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.25rem,3vw,1.75rem)", fontWeight: 900, margin: "0 0 12px" }}>Wujudkan Kost Impian Anda</h3>
          <p style={{ color: "rgba(255,255,255,.75)", fontSize: "0.9rem", margin: "0 0 28px", lineHeight: 1.7 }}>Tim kami siap survei lahan, menghitung RAB, dan membangun kost Anda dari awal hingga siap disewakan.</p>
          <button onClick={() => onWaOpen && onWaOpen({ key: "konsultasi", vars: {} })}
            style={{ background: "#C9AA71", color: "#2E3D3F", border: "none", borderRadius: 10, padding: "15px 36px", fontSize: "0.95rem", fontWeight: 800, cursor: "pointer", letterSpacing: ".05em" }}>
            Hubungi Tim Pembangunan Kami
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Halaman Program Pembangunan Cafe (Magazine Mixing Grid) ──
   Reuse RsMiniSlide & RsInfoCard — struktur & style class (ls-*) identik. */
function PembangunanCafePage({ onWaOpen, paketData }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const fmt = (n) => "Rp " + n.toLocaleString("id-ID") + ",-";
  const paket_ = ((paketData && paketData.length) ? paketData : CAFE_PAKET_DATA).filter(p => !p.hidden);

  const rows = [];
  let pos = 0;
  let layoutIdx = 0;
  while (pos < paket_.length) {
    const cols = RS_MAG_LAYOUT[layoutIdx % RS_MAG_LAYOUT.length];
    const slice = paket_.slice(pos, pos + cols);
    if (slice.length > 0) rows.push({ cols: slice.length, items: slice });
    pos += cols;
    layoutIdx++;
  }
  const heightMap = RS_IMG_HEIGHT_MAP;

  /* Pool foto untuk selingan slideshow antar baris paket — diacak dari galeri semua paket pembangunan cafe */
  const cafeImagePool = useMemo(() => shuffleArray(paket_.flatMap(p => (p.slides || []).map(s => s.img))), [paket_]);
  const cafeTickerTexts = useMemo(() => shuffleArray([
    "KONSULTASI GRATIS PEMBANGUNAN CAFE",
    "HIKIMORI CONST — WUJUDKAN CAFE IMPIAN ANDA",
    "DARI DESAIN HINGGA HARI PEMBUKAAN, KAMI SIAP BANTU",
    "HUBUNGI TIM KAMI VIA WHATSAPP UNTUK SURVEI GRATIS",
  ]), []);
  const cafeBreakBoundaries = rows.reduce((acc, r) => { acc.push((acc[acc.length - 1] || 0) + r.cols); return acc; }, []);

  return (
    <div className="fade-in" style={{ background: "#FAF7F0", minHeight: "100vh" }}>
      <style>{`
        @keyframes rsSlideInRight  { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes rsSlideOutRight { from { transform: translateX(0); } to { transform: translateX(100%); } }
        @keyframes rsSlideInUp     { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes rsSlideOutUp    { from { transform: translateY(0); } to { transform: translateY(-100%); } }
        @keyframes rsSlideInLeft   { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes rsSlideOutLeft  { from { transform: translateX(0); } to { transform: translateX(-100%); } }
        @keyframes rsSlideInDown   { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        @keyframes rsSlideOutDown  { from { transform: translateY(0); } to { transform: translateY(100%); } }
        .rsSlideInRight,.rsSlideOutRight,.rsSlideInUp,.rsSlideOutUp,.rsSlideInLeft,.rsSlideOutLeft,.rsSlideInDown,.rsSlideOutDown {
          animation-duration: .4s; animation-timing-function: ease; animation-fill-mode: forwards; z-index: 1;
        }
        @keyframes lsDropIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }

        .ls-wrap { position:relative; display:flex; flex-direction:column; height:100%; }
        .ls-img-box { position:relative; overflow:hidden; border-radius:14px; margin-bottom:12px; box-shadow:0 6px 16px rgba(20,30,25,.12); transition:box-shadow .35s ease, transform .35s ease; }
        .ls-img-box:hover { box-shadow:0 18px 36px rgba(20,30,25,.24); transform:translateY(-5px); }
        .ls-img-box:hover .ls-mag-overlay-btn { opacity:1 !important; }
        .ls-img-box img { transition:transform .6s ease; }
        .ls-img-box:hover img { transform:scale(1.09); }

        .ls-cat-badge { position:absolute; top:14px; left:14px; right:100px; z-index:4; }
        .ls-cat-badge > div { max-width: 100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ls-price-pill { position:absolute; top:14px; right:14px; z-index:4; background:rgba(201,170,113,.93); backdrop-filter:blur(6px); color:#1a2a1a; font-size:.62rem; font-weight:900; letter-spacing:.06em; padding:5px 12px; border-radius:20px; white-space:nowrap; max-width:120px; overflow:hidden; text-overflow:ellipsis; }
        .ls-mag-overlay-btn { opacity:1; transition:opacity .3s; position:absolute; bottom:16px; right:14px; z-index:4; }
        /* Sembunyikan-sampai-hover HANYA untuk perangkat yang benar2 punya mouse/hover (desktop). Touch-only (HP & tablet) selalu tampil, karena tidak ada gestur hover di layar sentuh. */
        @media (hover:hover) and (pointer:fine) { .ls-mag-overlay-btn { opacity:0; } }

        .ls-info-card { background:#fff; padding:20px 18px 22px; display:flex; flex-direction:column; flex:1; }
        .ls-card-title { font-family:'Playfair Display',serif; font-size:clamp(.88rem,1.8vw,1.05rem); font-weight:900; color:#2E3D3F; margin:0 0 8px; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .ls-desc { font-size:.825rem; color:#5A6A6C; line-height:1.7; margin:0 0 14px; white-space:pre-line; }

        .ls-cta-row { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; margin-bottom:12px; margin-top:auto; padding-top:14px; }
        .ls-price-badge { background:#f0fdf4; border:1.5px solid #86efac; border-radius:8px; padding:6px 14px; flex-shrink:0; }
        .ls-price-badge span.lb { display:block; font-size:.56rem; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:#166534; }
        .ls-price-badge span.vl { display:block; font-size:.8rem; font-weight:900; color:#14532d; white-space:nowrap; }
        .ls-cta-btn { background:#2E3D3F; color:#fff; border:none; border-radius:8px; padding:9px 16px; font-size:.73rem; font-weight:800; cursor:pointer; white-space:nowrap; transition:background .2s; flex:1; min-width:130px; text-align:center; }
        .ls-cta-btn:hover { background:#8B6914; }

        .ls-toggle-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:8px; background:#f4faf6; border:1.5px solid #bbf7d0; border-radius:8px; padding:9px 14px; font-size:.75rem; font-weight:800; color:#166534; cursor:pointer; transition:all .2s; }
        .ls-toggle-btn:hover { background:#dcfce7; border-color:#4ade80; }
        .ls-toggle-btn span:first-child { font-size:.65rem; }

        .ls-includes-box { margin-top:12px; border-top:2px dashed #bbf7d0; padding-top:14px; animation:lsDropIn .22s ease; }
        ${RS_THUMB_CSS}
        .ls-includes-title { font-size:.6rem; font-weight:900; letter-spacing:.14em; text-transform:uppercase; color:#2d6a4f; margin:0 0 10px; }
        .ls-includes-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px 12px; }
        .ls-include-item { display:flex; align-items:flex-start; gap:7px; }
        .ls-include-item span.ic { font-size:.82rem; flex-shrink:0; margin-top:1px; }
        .ls-include-item span.tx { font-size:.73rem; color:#2E3D3F; line-height:1.45; }

        @media (max-width: 767px) {
          .ls-desktop-grid { display:none !important; }
          .ls-mobile-list { display:flex !important; flex-direction:column; gap:8px; padding:8px 0 0; }
          .ls-mobile-item { width:100%; }
          .ls-mobile-slide { height:${RS_MOBILE_IMG_H}px !important; }
          .ls-includes-grid { grid-template-columns:1fr; }
          .ls-cta-row { flex-direction:column; align-items:stretch; }
          .ls-cta-btn { text-align:center; }
          .ls-price-pill { font-size:.56rem; padding:4px 9px; }
        }
        @media (min-width: 768px) {
          .ls-mobile-list { display:none !important; }
          .ls-desktop-grid { display:flex !important; }
        }
      `}</style>

      {/* HERO */}
      <div style={{ background: "linear-gradient(135deg,#2E3D3F 0%,#3D5254 60%,#8B6914 100%)", padding: "64px 5% 56px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.07, backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "36px 36px", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.1)", borderRadius: 20, padding: "5px 16px", marginBottom: 18 }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "#C9AA71" }}>HIKIMORI CONST · PROGRAM PEMBANGUNAN</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.75rem,5vw,2.75rem)", fontWeight: 900, color: "#fff", margin: "0 0 14px", lineHeight: 1.2 }}>Pembangunan Cafe</h1>
          <p style={{ fontSize: "clamp(.875rem,2vw,1rem)", color: "rgba(255,255,255,.75)", lineHeight: 1.8, margin: "0 0 26px" }}>
            Wujudkan bisnis cafe yang menarik pengunjung — dari konsep sederhana, 2 lantai, interior estetik, hingga outdoor seating, dikerjakan tim berpengalaman dengan harga bersaing.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {paket_.map(p => (
              <span key={p.id} style={{ background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.85)", fontSize: "0.7rem", fontWeight: 700, padding: "5px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,.15)" }}>
                {p.icon} {p.title.replace("Pembangunan ", "")}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* DESKTOP: Magazine Mixing Grid */}
      <div className="ls-desktop-grid" style={{ flexDirection: "column", gap: 0, padding: "8px 0 0" }}>
        {rows.map((row, ri) => {
          const h = heightMap[row.cols] || 360;
          return (
            <React.Fragment key={ri}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${row.cols}, 1fr)`, gap: 8, alignItems: "stretch", marginBottom: 8 }}>
              {row.items.map((paket) => (
                <div key={paket.id} className="ls-wrap">
                  <RsPaketVisual paket={paket} fmt={fmt} onWaOpen={onWaOpen} height={h} />

                  <RsInfoCard paket={paket} fmt={fmt} onWaOpen={onWaOpen} />
                </div>
              ))}
            </div>
            <PostingSlideshowBreak images={cafeImagePool} tickerTexts={cafeTickerTexts} />
            </React.Fragment>
          );
        })}
      </div>

      {/* MOBILE: 1 Kolom Penuh */}
      <div className="ls-mobile-list">
        {paket_.map((paket, pi) => (
          <React.Fragment key={paket.id}>
          <div className="ls-mobile-item ls-wrap">
            <RsPaketVisual paket={paket} fmt={fmt} onWaOpen={onWaOpen} mobile />

            <RsInfoCard paket={paket} fmt={fmt} onWaOpen={onWaOpen} />
          </div>
          {cafeBreakBoundaries.includes(pi + 1) && (
            <PostingSlideshowBreak images={cafeImagePool} tickerTexts={cafeTickerTexts} />
          )}
          </React.Fragment>
        ))}
      </div>

      {/* CTA BOTTOM */}
      <div style={{ padding: "60px 5%", textAlign: "center", background: "#FAF7F0" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", background: "linear-gradient(135deg,#2E3D3F 0%,#8B6914 100%)", borderRadius: 20, padding: "48px 32px", color: "#fff" }}>
          <div style={{ fontSize: "0.7rem", letterSpacing: ".14em", textTransform: "uppercase", color: "#C9AA71", fontWeight: 700, marginBottom: 12 }}>Konsultasi Gratis</div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.25rem,3vw,1.75rem)", fontWeight: 900, margin: "0 0 12px" }}>Wujudkan Cafe Impian Anda</h3>
          <p style={{ color: "rgba(255,255,255,.75)", fontSize: "0.9rem", margin: "0 0 28px", lineHeight: 1.7 }}>Tim kami siap survei lahan, menghitung RAB, dan membangun cafe Anda dari awal hingga siap buka.</p>
          <button onClick={() => onWaOpen && onWaOpen({ key: "konsultasi", vars: {} })}
            style={{ background: "#C9AA71", color: "#2E3D3F", border: "none", borderRadius: 10, padding: "15px 36px", fontSize: "0.95rem", fontWeight: 800, cursor: "pointer", letterSpacing: ".05em" }}>
            Hubungi Tim Pembangunan Kami
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Halaman Program Pembangunan Ruko (Magazine Mixing Grid) ──
   Reuse RsMiniSlide & RsInfoCard — struktur & style class (ls-*) identik. */
function PembangunanRukoPage({ onWaOpen, paketData }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const fmt = (n) => "Rp " + n.toLocaleString("id-ID") + ",-";
  const paket_ = ((paketData && paketData.length) ? paketData : RUKO_PAKET_DATA).filter(p => !p.hidden);

  const rows = [];
  let pos = 0;
  let layoutIdx = 0;
  while (pos < paket_.length) {
    const cols = RS_MAG_LAYOUT[layoutIdx % RS_MAG_LAYOUT.length];
    const slice = paket_.slice(pos, pos + cols);
    if (slice.length > 0) rows.push({ cols: slice.length, items: slice });
    pos += cols;
    layoutIdx++;
  }
  const heightMap = RS_IMG_HEIGHT_MAP;

  /* Pool foto untuk selingan slideshow antar baris paket — diacak dari galeri semua paket pembangunan ruko */
  const rukoImagePool = useMemo(() => shuffleArray(paket_.flatMap(p => (p.slides || []).map(s => s.img))), [paket_]);
  const rukoTickerTexts = useMemo(() => shuffleArray([
    "KONSULTASI GRATIS PEMBANGUNAN RUKO",
    "HIKIMORI CONST — INVESTASI PROPERTI KOMERSIAL TERPERCAYA",
    "STRUKTUR KOKOH UNTUK USAHA JANGKA PANJANG",
    "HUBUNGI KAMI VIA WHATSAPP SEKARANG",
  ]), []);
  const rukoBreakBoundaries = rows.reduce((acc, r) => { acc.push((acc[acc.length - 1] || 0) + r.cols); return acc; }, []);

  return (
    <div className="fade-in" style={{ background: "#FAF7F0", minHeight: "100vh" }}>
      <style>{`
        @keyframes rsSlideInRight  { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes rsSlideOutRight { from { transform: translateX(0); } to { transform: translateX(100%); } }
        @keyframes rsSlideInUp     { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes rsSlideOutUp    { from { transform: translateY(0); } to { transform: translateY(-100%); } }
        @keyframes rsSlideInLeft   { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes rsSlideOutLeft  { from { transform: translateX(0); } to { transform: translateX(-100%); } }
        @keyframes rsSlideInDown   { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        @keyframes rsSlideOutDown  { from { transform: translateY(0); } to { transform: translateY(100%); } }
        .rsSlideInRight,.rsSlideOutRight,.rsSlideInUp,.rsSlideOutUp,.rsSlideInLeft,.rsSlideOutLeft,.rsSlideInDown,.rsSlideOutDown {
          animation-duration: .4s; animation-timing-function: ease; animation-fill-mode: forwards; z-index: 1;
        }
        @keyframes lsDropIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }

        .ls-wrap { position:relative; display:flex; flex-direction:column; height:100%; }
        .ls-img-box { position:relative; overflow:hidden; border-radius:14px; margin-bottom:12px; box-shadow:0 6px 16px rgba(20,30,25,.12); transition:box-shadow .35s ease, transform .35s ease; }
        .ls-img-box:hover { box-shadow:0 18px 36px rgba(20,30,25,.24); transform:translateY(-5px); }
        .ls-img-box:hover .ls-mag-overlay-btn { opacity:1 !important; }
        .ls-img-box img { transition:transform .6s ease; }
        .ls-img-box:hover img { transform:scale(1.09); }

        .ls-cat-badge { position:absolute; top:14px; left:14px; right:100px; z-index:4; }
        .ls-cat-badge > div { max-width: 100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ls-price-pill { position:absolute; top:14px; right:14px; z-index:4; background:rgba(201,170,113,.93); backdrop-filter:blur(6px); color:#1a2a1a; font-size:.62rem; font-weight:900; letter-spacing:.06em; padding:5px 12px; border-radius:20px; white-space:nowrap; max-width:120px; overflow:hidden; text-overflow:ellipsis; }
        .ls-mag-overlay-btn { opacity:1; transition:opacity .3s; position:absolute; bottom:16px; right:14px; z-index:4; }
        /* Sembunyikan-sampai-hover HANYA untuk perangkat yang benar2 punya mouse/hover (desktop). Touch-only (HP & tablet) selalu tampil, karena tidak ada gestur hover di layar sentuh. */
        @media (hover:hover) and (pointer:fine) { .ls-mag-overlay-btn { opacity:0; } }

        .ls-info-card { background:#fff; padding:20px 18px 22px; display:flex; flex-direction:column; flex:1; }
        .ls-card-title { font-family:'Playfair Display',serif; font-size:clamp(.88rem,1.8vw,1.05rem); font-weight:900; color:#2E3D3F; margin:0 0 8px; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .ls-desc { font-size:.825rem; color:#5A6A6C; line-height:1.7; margin:0 0 14px; white-space:pre-line; }

        .ls-cta-row { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; margin-bottom:12px; margin-top:auto; padding-top:14px; }
        .ls-price-badge { background:#f0fdf4; border:1.5px solid #86efac; border-radius:8px; padding:6px 14px; flex-shrink:0; }
        .ls-price-badge span.lb { display:block; font-size:.56rem; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:#166534; }
        .ls-price-badge span.vl { display:block; font-size:.8rem; font-weight:900; color:#14532d; white-space:nowrap; }
        .ls-cta-btn { background:#2E3D3F; color:#fff; border:none; border-radius:8px; padding:9px 16px; font-size:.73rem; font-weight:800; cursor:pointer; white-space:nowrap; transition:background .2s; flex:1; min-width:130px; text-align:center; }
        .ls-cta-btn:hover { background:#8B6914; }

        .ls-toggle-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:8px; background:#f4faf6; border:1.5px solid #bbf7d0; border-radius:8px; padding:9px 14px; font-size:.75rem; font-weight:800; color:#166534; cursor:pointer; transition:all .2s; }
        .ls-toggle-btn:hover { background:#dcfce7; border-color:#4ade80; }
        .ls-toggle-btn span:first-child { font-size:.65rem; }

        .ls-includes-box { margin-top:12px; border-top:2px dashed #bbf7d0; padding-top:14px; animation:lsDropIn .22s ease; }
        ${RS_THUMB_CSS}
        .ls-includes-title { font-size:.6rem; font-weight:900; letter-spacing:.14em; text-transform:uppercase; color:#2d6a4f; margin:0 0 10px; }
        .ls-includes-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px 12px; }
        .ls-include-item { display:flex; align-items:flex-start; gap:7px; }
        .ls-include-item span.ic { font-size:.82rem; flex-shrink:0; margin-top:1px; }
        .ls-include-item span.tx { font-size:.73rem; color:#2E3D3F; line-height:1.45; }

        @media (max-width: 767px) {
          .ls-desktop-grid { display:none !important; }
          .ls-mobile-list { display:flex !important; flex-direction:column; gap:8px; padding:8px 0 0; }
          .ls-mobile-item { width:100%; }
          .ls-mobile-slide { height:${RS_MOBILE_IMG_H}px !important; }
          .ls-includes-grid { grid-template-columns:1fr; }
          .ls-cta-row { flex-direction:column; align-items:stretch; }
          .ls-cta-btn { text-align:center; }
          .ls-price-pill { font-size:.56rem; padding:4px 9px; }
        }
        @media (min-width: 768px) {
          .ls-mobile-list { display:none !important; }
          .ls-desktop-grid { display:flex !important; }
        }
      `}</style>

      {/* HERO */}
      <div style={{ background: "linear-gradient(135deg,#2E3D3F 0%,#3D5254 60%,#8B6914 100%)", padding: "64px 5% 56px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.07, backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "36px 36px", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.1)", borderRadius: 20, padding: "5px 16px", marginBottom: 18 }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "#C9AA71" }}>HIKIMORI CONST · PROGRAM PEMBANGUNAN</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.75rem,5vw,2.75rem)", fontWeight: 900, color: "#fff", margin: "0 0 14px", lineHeight: 1.2 }}>Pembangunan Ruko</h1>
          <p style={{ fontSize: "clamp(.875rem,2vw,1rem)", color: "rgba(255,255,255,.75)", lineHeight: 1.8, margin: "0 0 26px" }}>
            Wujudkan ruko yang kokoh dan strategis untuk usaha Anda — dari 2-3 lantai, gudang belakang, fasad & signage, hingga renovasi ruko lama, dikerjakan tim berpengalaman.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {paket_.map(p => (
              <span key={p.id} style={{ background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.85)", fontSize: "0.7rem", fontWeight: 700, padding: "5px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,.15)" }}>
                {p.icon} {p.title.replace("Pembangunan ", "")}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* DESKTOP: Magazine Mixing Grid */}
      <div className="ls-desktop-grid" style={{ flexDirection: "column", gap: 0, padding: "8px 0 0" }}>
        {rows.map((row, ri) => {
          const h = heightMap[row.cols] || 360;
          return (
            <React.Fragment key={ri}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${row.cols}, 1fr)`, gap: 8, alignItems: "stretch", marginBottom: 8 }}>
              {row.items.map((paket) => (
                <div key={paket.id} className="ls-wrap">
                  <RsPaketVisual paket={paket} fmt={fmt} onWaOpen={onWaOpen} height={h} />

                  <RsInfoCard paket={paket} fmt={fmt} onWaOpen={onWaOpen} />
                </div>
              ))}
            </div>
            <PostingSlideshowBreak images={rukoImagePool} tickerTexts={rukoTickerTexts} />
            </React.Fragment>
          );
        })}
      </div>

      {/* MOBILE: 1 Kolom Penuh */}
      <div className="ls-mobile-list">
        {paket_.map((paket, pi) => (
          <React.Fragment key={paket.id}>
          <div className="ls-mobile-item ls-wrap">
            <RsPaketVisual paket={paket} fmt={fmt} onWaOpen={onWaOpen} mobile />

            <RsInfoCard paket={paket} fmt={fmt} onWaOpen={onWaOpen} />
          </div>
          {rukoBreakBoundaries.includes(pi + 1) && (
            <PostingSlideshowBreak images={rukoImagePool} tickerTexts={rukoTickerTexts} />
          )}
          </React.Fragment>
        ))}
      </div>

      {/* CTA BOTTOM */}
      <div style={{ padding: "60px 5%", textAlign: "center", background: "#FAF7F0" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", background: "linear-gradient(135deg,#2E3D3F 0%,#8B6914 100%)", borderRadius: 20, padding: "48px 32px", color: "#fff" }}>
          <div style={{ fontSize: "0.7rem", letterSpacing: ".14em", textTransform: "uppercase", color: "#C9AA71", fontWeight: 700, marginBottom: 12 }}>Konsultasi Gratis</div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.25rem,3vw,1.75rem)", fontWeight: 900, margin: "0 0 12px" }}>Wujudkan Ruko Impian Anda</h3>
          <p style={{ color: "rgba(255,255,255,.75)", fontSize: "0.9rem", margin: "0 0 28px", lineHeight: 1.7 }}>Tim kami siap survei lahan, menghitung RAB, dan membangun ruko Anda dari awal hingga siap dipakai.</p>
          <button onClick={() => onWaOpen && onWaOpen({ key: "konsultasi", vars: {} })}
            style={{ background: "#C9AA71", color: "#2E3D3F", border: "none", borderRadius: 10, padding: "15px 36px", fontSize: "0.95rem", fontWeight: 800, cursor: "pointer", letterSpacing: ".05em" }}>
            Hubungi Tim Pembangunan Kami
          </button>
        </div>
      </div>
    </div>
  );
}

export { PembangunanCafePage, PembangunanKostPage, PembangunanRukoPage, PostingSlideshowBreak, RS_IMG_HEIGHT_MAP, RS_MAG_LAYOUT, RS_MOBILE_IMG_H, RS_THUMB_CSS, RsInfoCard, RsMiniSlide, RsPaketVisual, RsSlideThumbs, RumahSubsidiPage, shuffleArray };
