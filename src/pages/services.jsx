/* Chunk halaman "services" — dimuat lazy (React.lazy) saat rute ini dibuka.
   Dipisah dari RealEstateWeb.jsx agar pengunjung halaman lain tidak ikut mengunduh kode ini. */
import { useState, useEffect, useRef, useCallback } from "react";
import { cld } from "../lib/net.js";
import { formatRp, onImgError, paketUrl } from "../app/core.jsx";
/* ─────────────── DESTINATIONS SECTION (full-page detail) ─────────────── */
function DestinationsSection({ svc, catInfo, activePt }) {
  const [destIdx, setDestIdx] = useState(0);
  const ac = svc.accent || catInfo?.color || "#e8a020";
  const allDests = svc.destinations || [];
  // Filter berdasarkan destinationChecks tipe paket aktif
  const dChecks = activePt?.destinationChecks || [];
  const dests = dChecks.length > 0 ? allDests.filter((_, i) => dChecks[i] !== false) : allDests;
  const safeIdx = destIdx < dests.length ? destIdx : 0;
  const dest = dests[safeIdx];

  return (
    <div className="mg-fade-3" style={{ marginBottom: 48 }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{ width: 4, height: 30, background: `linear-gradient(to bottom, ${ac}, transparent)`, borderRadius: 2, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: "0.5625rem", letterSpacing: "3px", color: ac, fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Tahapan Proyek</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 800, color: "#2E3D3F", lineHeight: 1.1 }}>Tahapan Pengerjaan yang Tersedia</div>
          <div style={{ fontSize: "0.75rem", color: "#5A6A6C", fontWeight: 400, marginTop: 3 }}>sesuai tipe paket yang dipilih</div>
        </div>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, #E8DCC8, transparent)" }} />
      </div>

      {/* Tab selector */}
      {dests.length > 1 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {dests.map((d, i) => {
            const isActive = i === destIdx;
            return (
              <button key={i} onClick={() => setDestIdx(i)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: `2px solid ${isActive ? ac : ac + "40"}`,
                  background: isActive
                    ? `linear-gradient(130deg, ${ac}, ${ac}cc)`
                    : "#fff",
                  color: isActive ? "#fff" : ac,
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all .2s",
                  fontFamily: "'DM Sans',sans-serif",
                  letterSpacing: ".01em",
                  boxShadow: isActive
                    ? `0 4px 16px ${ac}50`
                    : `0 2px 6px ${ac}18`,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 22, height: 22, borderRadius: 5,
                  background: isActive ? "rgba(255,255,255,.22)" : ac + "18",
                  fontSize: "0.625rem", fontWeight: 900, flexShrink: 0,
                  color: isActive ? "#fff" : ac,
                }}>{d.no}</span>
                <span>{d.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Destination card */}
      {dest ? (
        <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: `1px solid ${ac}22`, boxShadow: `0 4px 20px ${ac}12` }}>
          <div style={{ width: "100%", position: "relative", height: "min(320px, 52vw)", minHeight: 180, overflow: "hidden" }}>
            {dest.img ? (
              <img decoding="async" loading="lazy" src={cld(dest.img)} alt={dest.name}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block", transition: "transform .4s ease" }}
                onMouseEnter={e => e.target.style.transform = "scale(1.05)"}
                onMouseLeave={e => e.target.style.transform = "scale(1)"}
                onError={onImgError} />
            ) : (
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg,${ac}22,#e8f4f8)`, display: "flex", alignItems: "center", justifyContent: "center", color: ac, opacity: .4, fontSize: "3rem" }}></div>
            )}
            <div style={{ position: "absolute", top: 12, left: 12, background: ac, color: "#fff", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6875rem", fontWeight: 800, zIndex: 2, boxShadow: "0 2px 8px rgba(0,0,0,.2)" }}>{dest.no}</div>
          </div>
          <div style={{ padding: "20px 24px 24px" }}>
            <div style={{ fontSize: "0.5625rem", color: ac, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>{dest.tag}</div>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.125rem", fontWeight: 800, color: "#2E3D3F", marginBottom: 6, lineHeight: 1.3 }}>{dest.title}</h3>
            <div style={{ fontSize: "0.75rem", color: "#5A6A6C", marginBottom: 12 }}>{dest.sub} &nbsp;·&nbsp; {dest.duration}</div>
            <p style={{ fontSize: "0.875rem", color: "#3a5266", lineHeight: 1.75, marginBottom: 14 }}>{dest.desc}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px" }}>
              {(dest.points || []).map((pt, pi) => (
                <div key={pi} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: "0.8125rem", color: "#3D5254" }}>
                  <span style={{ color: ac, fontWeight: 700 }}>✓</span> {pt}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "40px 20px", background: "#f8fbfd", borderRadius: 14, border: `2px dashed ${ac}40`, color: "#5A6A6C" }}>
          <div style={{ fontSize: "2rem", marginBottom: 8 }}></div>
          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>Belum ada tahapan ditambahkan</div>
        </div>
      )}
    </div>
  );
}

/* ─────────────── FACILITIES SECTION (read-only) ─────────────── */
function FacilitiesSection({ svc, catInfo, activePt }) {
  const ac = svc.accent || catInfo?.color || "#e8a020";
  const allFacilities = svc.facilities || [];
  // Filter berdasarkan facilityChecks tipe paket aktif
  const fChecks = activePt?.facilityChecks || [];
  const facilities = fChecks.length > 0 ? allFacilities.filter((_, i) => fChecks[i] !== false) : allFacilities;
  return (
    <div className="mg-fade-3" style={{ marginBottom: 48 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{ width: 4, height: 30, background: `linear-gradient(to bottom, ${ac}, transparent)`, borderRadius: 2, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: "0.5625rem", letterSpacing: "3px", color: ac, fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Yang Sudah Termasuk</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 800, color: "#2E3D3F", lineHeight: 1.1 }}>Spesifikasi & Fasilitas</div>
        </div>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, #E8DCC8, transparent)" }} />
      </div>
      {facilities.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))", gap: 10 }}>
          {facilities.map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "#fff", borderRadius: 10, padding: "13px 15px", border: "1px solid #c8eaf2", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: ac, borderRadius: "10px 0 0 10px" }} />
              <span style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#2E3D3F", marginBottom: 2 }}>{f.label}</div>
                {f.detail && <div style={{ fontSize: "0.75rem", color: "#5A6A6C", lineHeight: 1.5 }}>{f.detail}</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "32px 20px", background: "#f8fbfd", borderRadius: 10, border: `2px dashed ${ac}40`, color: "#5A6A6C" }}>
          <div style={{ fontSize: "2rem", marginBottom: 6 }}></div>
          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>Belum ada fasilitas ditambahkan</div>
        </div>
      )}
    </div>
  );
}

/* ─────────────── SERVICE HERO SLIDESHOW (panel kanan di atas) ─────────────── */
function ServiceHeroSlideshow({ slides, catColor }) {
  const [cur, setCur] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const pausedRef = useRef(false);
  pausedRef.current = paused;
  const touchRef = useRef({ down: false, startX: 0, moved: false });

  const next = useCallback(() => setCur(c => (c + 1) % slides.length), [slides.length]);
  const back = useCallback(() => setCur(c => (c - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      if (!pausedRef.current) setCur(c => (c + 1) % slides.length);
    }, 3500);
    return () => clearInterval(timerRef.current);
  }, [slides.length]);

  /* MOBILE: tap di area gambar = lanjut ke slide berikutnya, geser jari = swipe sesuai arah */
  const onTouchStart = (e) => {
    if (slides.length < 2) return;
    const t = e.touches[0];
    touchRef.current = { down: true, startX: t.clientX, moved: false };
  };
  const onTouchMoveH = (e) => {
    if (!touchRef.current.down) return;
    const t = e.touches[0];
    if (Math.abs(t.clientX - touchRef.current.startX) > 4) touchRef.current.moved = true;
  };
  const onTouchEndH = (e) => {
    if (!touchRef.current.down || slides.length < 2) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.startX;
    const wasTap = !touchRef.current.moved;
    touchRef.current.down = false;
    if (Math.abs(dx) > 40) { dx < 0 ? next() : back(); }
    else if (wasTap) { next(); }
  };

  if (!slides.length) return null;
  const slide = slides[cur];

  return (
    <div style={{ position: "relative", overflow: "hidden", display: "flex", alignItems: "stretch", touchAction: slides.length > 1 ? "pan-y" : "auto" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMoveH}
      onTouchEnd={onTouchEndH}>
      <style>{`
        @keyframes heroFadeIn { from { opacity:0; transform:scale(1.04); } to { opacity:1; transform:scale(1); } }
      `}</style>
      {/* Deco corner frames */}
      <div className="mg-deco-shape" style={{ position: "absolute", top: 20, right: 20, width: 70, height: 70, border: `1.5px solid ${catColor}`, borderRadius: 6, zIndex: 3, opacity: .55, pointerEvents: "none" }} />
      <div className="mg-deco-shape" style={{ position: "absolute", top: 30, right: 30, width: 70, height: 70, border: "1.5px solid rgba(255,255,255,.12)", borderRadius: 6, zIndex: 3, pointerEvents: "none" }} />
      <div className="mg-deco-shape" style={{ position: "absolute", bottom: 20, left: -8, width: 50, height: 50, border: "1.5px solid rgba(255,255,255,.15)", borderRadius: 4, zIndex: 3, pointerEvents: "none" }} />

      <div style={{ flex: 1, position: "relative", minHeight: 400 }}>
        {/* Slide image */}
        <img decoding="async" key={cur} loading="lazy" src={cld(slide.img)} alt={slide.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", position: "absolute", inset: 0, animation: "heroFadeIn .6s ease both" }}
          onError={onImgError} />

        {/* Bottom gradient */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 130, background: "linear-gradient(to top, rgba(5,20,45,.85), transparent)", pointerEvents: "none", zIndex: 2 }} />

        {/* Info overlay */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 3, padding: "14px 18px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "0.5rem", color: "rgba(255,255,255,.5)", letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 3 }}>
                {slide.no} / {String(slides.length).padStart(2,"0")}
              </div>
              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,.6)", lineHeight: 1.25 }}>{slide.title || slide.name}</div>
            </div>
            {/* Prev / Next -- disembunyikan di mobile (class slide-arrow-btn), diganti tap-di-gambar */}
            {slides.length > 1 && (
              <div className="slide-arrow-btn" style={{ display: "flex", gap: 6 }}>
                <button onClick={e => { e.stopPropagation(); back(); }}
                  style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,.15)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,.25)", color: "#fff", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
                <button onClick={e => { e.stopPropagation(); next(); }}
                  style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,.15)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,.25)", color: "#fff", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
              </div>
            )}
          </div>
          {/* Dot indicator */}
          {slides.length > 1 && (
            <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
              {slides.map((_, i) => (
                <div key={i} onClick={() => setCur(i)}
                  style={{ height: 3, borderRadius: 2, background: i === cur ? catColor : "rgba(255,255,255,.3)", width: i === cur ? 20 : 6, transition: "all .3s ease", cursor: "pointer" }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────── DESTINATION GALLERY SLIDESHOW ─────────────── */
function DestGallerySlideshow({ slides, catColor, svcTitle }) {
  const [cur, setCur] = useState(0);
  const [prev, setPrev] = useState(null);
  const [dir, setDir] = useState(1); // 1=next, -1=prev
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const pausedRef = useRef(false);
  pausedRef.current = paused;

  const goTo = useCallback((idx, direction) => {
    setPrev(cur);
    setDir(direction);
    setCur(idx);
  }, [cur]);

  const next = useCallback(() => goTo((cur + 1) % slides.length, 1), [cur, slides.length, goTo]);
  const back = useCallback(() => goTo((cur - 1 + slides.length) % slides.length, -1), [cur, slides.length, goTo]);

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      if (!pausedRef.current) setCur(c => {
        const n = (c + 1) % slides.length;
        setPrev(c); setDir(1);
        return n;
      });
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [slides.length]);

  const touchRef = useRef({ down: false, startX: 0, moved: false });
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
    if (Math.abs(dx) > 40) { dx < 0 ? next() : back(); }
    else if (wasTap) { next(); }
  };

  const slide = slides[cur];

  return (
    <div className="mg-fade-2" style={{ marginBottom: 52 }}>
      {/* Heading */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{ width: 4, height: 30, background: `linear-gradient(to bottom, ${catColor}, transparent)`, borderRadius: 2, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: "0.5625rem", letterSpacing: "3px", color: "#7ab5cc", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Dokumentasi</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 800, color: "#2E3D3F", lineHeight: 1.1 }}>Fasilitas &amp; Suasana</div>
        </div>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, #E8DCC8, transparent)" }} />
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {slides.map((_, i) => (
            <div key={i} onClick={() => goTo(i, i > cur ? 1 : -1)}
              style={{ width: i === cur ? 18 : 6, height: 6, borderRadius: 3, background: i === cur ? catColor : "#E8DCC8", cursor: "pointer", transition: "all .35s ease" }} />
          ))}
        </div>
      </div>

      {/* Slideshow frame -- MOBILE: tap gambar = next, geser jari = swipe */}
      <div
        style={{ position: "relative", borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 36px rgba(13,59,102,.16)", height: "min(420px, 56vw)", minHeight: 220, background: "#2E3D3F", cursor: "pointer", touchAction: slides.length > 1 ? "pan-y" : "auto" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMoveH}
        onTouchEnd={onTouchEndH}
      >
        {/* Current slide */}
        <img decoding="async" key={`cur-${cur}`} loading="lazy" src={cld(slide.img)} alt={slide.name}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block",
            animation: `slideIn${dir > 0 ? "R" : "L"} .55s cubic-bezier(.22,1,.36,1) both` }}
          onError={onImgError} />

        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,30,60,.72) 0%, rgba(10,30,60,.15) 55%, transparent 100%)", pointerEvents: "none" }} />

        {/* Bottom info */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "0.5625rem", color: "rgba(255,255,255,.55)", letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 4 }}>
                Destinasi {slide.no} / {String(slides.length).padStart(2,"0")}
              </div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 800, color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,.5)", lineHeight: 1.2 }}>{slide.title || slide.name}</div>
              {slide.name && slide.title && slide.name !== slide.title && (
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,.6)", marginTop: 3 }}>{slide.name}</div>
              )}
            </div>
            {/* Nav buttons -- disembunyikan di mobile, diganti tap-di-gambar */}
            {slides.length > 1 && (
              <div className="slide-arrow-btn" style={{ display: "flex", gap: 8 }}>
                <button onClick={e => { e.stopPropagation(); back(); }}
                  style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,.15)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,.25)", color: "#fff", fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.3)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.15)"}>‹</button>
                <button onClick={e => { e.stopPropagation(); next(); }}
                  style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,.15)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,.25)", color: "#fff", fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.3)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.15)"}>›</button>
              </div>
            )}
          </div>
        </div>

        {/* Pause indicator */}
        {paused && slides.length > 1 && (
          <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,.4)", backdropFilter: "blur(6px)", borderRadius: 20, padding: "3px 10px", fontSize: "0.625rem", color: "rgba(255,255,255,.7)", fontWeight: 600, letterSpacing: ".08em" }}>PAUSE</div>
        )}

        {/* Slide animation keyframes */}
        <style>{`
          @keyframes slideInR { from { opacity:0; transform:translateX(60px); } to { opacity:1; transform:none; } }
          @keyframes slideInL { from { opacity:0; transform:translateX(-60px); } to { opacity:1; transform:none; } }
        `}</style>
      </div>

      {/* Thumbnail strip */}
      {slides.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto", paddingBottom: 2 }}>
          {slides.map((s, i) => (
            <div key={i} onClick={() => goTo(i, i > cur ? 1 : -1)}
              style={{ flexShrink: 0, width: 72, height: 50, borderRadius: 7, overflow: "hidden", cursor: "pointer",
                border: i === cur ? `2.5px solid ${catColor}` : "2.5px solid transparent",
                opacity: i === cur ? 1 : 0.55, transition: "all .25s", boxShadow: i === cur ? `0 0 0 1px ${catColor}55` : "none" }}>
              <img decoding="async" loading="lazy" src={cld(s.img)} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={e => e.target.src = ""} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── PaketBackBar — Back + Salin Link di halaman detail paket ── */
function PaketBackBar({ svc, onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    const url = window.location.origin + paketUrl(svc);
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div style={{ background: "linear-gradient(90deg,#2E3D3F,#8B6914)", padding: "0 5%", position: "sticky", top: 96, zIndex: 90, borderBottom: "1px solid #E8DCC8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <button onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#7ab8d0", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer", padding: "13px 0", letterSpacing: ".04em", textTransform: "uppercase" }}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>←</span> Kembali ke Layanan
      </button>
      <button onClick={copy} style={{ display: "flex", alignItems: "center", gap: 6, background: copied ? "rgba(16,208,224,.25)" : "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.20)", borderRadius: 20, color: copied ? "#E8C96A" : "#b8dde8", fontSize: "0.75rem", fontWeight: 600, padding: "6px 14px", cursor: "pointer", transition: "all .2s", letterSpacing: ".04em" }}>
        {copied ? "Tersalin!" : "Salin Link Paket"}
      </button>
    </div>
  );
}

/* ─────────────── SERVICES PAGE ─────────────── */
const LAYANAN_LIST = [
  { key: "interior", icon: "", label: "Interior", desc: "Desain interior modern, nyaman dan fungsional sesuai kebutuhan Anda.", color: "#8B6914", category: "wedding", img: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80" },
  { key: "eksterior", icon: "", label: "Eksterior", desc: "Desain eksterior menarik, kokoh dan estetis.", color: "#3D5254", category: "traveling", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80" },
  { key: "rab", icon: "", label: "Desain & RAB", desc: "Desain arsitektur lengkap dengan RAB yang akurat.", color: "#8B6914", category: "traveling", img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80" },
  { key: "landscape", icon: "", label: "Landscape", desc: "Taman indah dan asri yang menyatu dengan hunian Anda.", color: "#2E7D32", category: "traveling", img: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80" },
  { key: "aluminium", icon: "", label: "Aluminium", desc: "Kusen, pintu & jendela aluminium berkualitas tinggi.", color: "#3D5254", category: "event", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80" },
  { key: "kanopi", icon: "", label: "Kanopi", desc: "Kanopi kuat, modern dan tahan segala cuaca.", color: "#8B6914", category: "event", img: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80" },
];

/* ── Kategori & Keunggulan (statis — module scope) ── */
const STATIC_CATEGORIES = [
  { key: "traveling", label: "Gedung & Rumah", color: "#8B6914" },
  { key: "event",     label: "Exterior", color: "#3D5254" },
  { key: "wedding",   label: "Interior", color: "#C9AA71" },
];

const KEUNGGULAN = [
  { icon: "", label: "Tim Profesional", desc: "Tenaga ahli berpengalaman di bidangnya" },
  { icon: "", label: "Proses Cepat", desc: "Pengerjaan tepat waktu dan terukur" },
  { icon: "", label: "Budget Transparan", desc: "RAB jelas dan tanpa biaya tersembunyi" },
  { icon: "", label: "Material Berkualitas", desc: "Menggunakan bahan terbaik dan tahan lama" },
  { icon: "", label: "Garansi Pekerjaan", desc: "Garansi hingga 1 tahun setelah proyek selesai" },
  { icon: "", label: "Konsultasi Gratis", desc: "Konsultasi gratis sebelum proyek dimulai" },
];

/* ── Galeri Proyek Data (statis — dipindah ke module scope agar tidak dibuat ulang tiap render) ── */
const GALERI_LIST = [
  { label: "RUMAH MINIMALIS", img: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80" },
  { label: "INTERIOR MODERN", img: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80" },
  { label: "PAGAR LASER CUTTING", img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&q=80" },
  { label: "KANOPI ALDERON", img: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80" },
  { label: "KOLAM & TAMAN", img: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80" },
  { label: "PINTU ALUMINIUM", img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80" },
];

/* ── Testimonial Data (statis) ── */
const TESTIMONI = [
  { text: "Hasil desain sesuai ekspektasi, tim sangat profesional dan komunikatif. Proyek selesai tepat waktu dan rapi.", stars: 5, name: "Budi Santoso", role: "Pemilik Rumah" },
  { text: "Sangat puas dengan hasil interior rumah kami. Desainnya elegan dan fungsional, pengerjaan juga rapi.", stars: 5, name: "Dewi Lestari", role: "Ibu Rumah Tangga" },
  { text: "Pembuatan kanopi dan pagar sangat berkualitas. Harganya juga kompetitif. Recommended!", stars: 5, name: "Andi Setiawan", role: "Wiraswasta" },
];

function ServicesPage({ content, services, navigateTo, activePaket, onOpenPaket, onClosePaket, onWaOpen }) {
  const [selectedService, setSelectedService] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [activeImg, setActiveImg] = useState(0);

  /* ── Static layanan list — defined at module scope as LAYANAN_LIST ── */

  /* ── Old category-based state (kept for detail page backward compat) ── */
  const [activeCategory, setActiveCategory] = useState("traveling");
  const [colLayout, setColLayout] = useState(2); // 1 | 2 | 3
  const [activePaketTypeId, setActivePaketTypeId] = useState(null);

  const CATEGORIES = STATIC_CATEGORIES;

  const openDetail = (svc) => {
    if (onOpenPaket) onOpenPaket(svc);
    setSelectedService(svc); setActiveImg(0); window.scrollTo(0, 0);
    // Set default ke tipe utama
    const utamaId = svc.utamaTipeId || (svc.paketTypes && svc.paketTypes[0]?.id) || null;
    setActivePaketTypeId(utamaId);
    setSelectedPkgId(svc.id);
    setPkgDropOpen(false);
  };
  const closeDetail = () => {
    if (onClosePaket) onClosePaket();   // restore URL di parent
    setSelectedService(null);
  };

  // Restore selectedService dari activePaket prop (saat mount via URL /paket/...)
  useEffect(() => {
    if (activePaket && services.length) {
      const svc = services.find(s => s.id === activePaket.id || String(s.id) === String(activePaket.id));
      if (svc && !selectedService) { setSelectedService(svc); setActiveImg(0); }
    }
    if (!activePaket) { setSelectedService(null); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePaket, services.length]);

  const handleBook = (svc) => {
    if (onWaOpen) onWaOpen({ key: "paket", vars: { judul_paket: `${svc.title} — ${svc.price} ${svc.priceNote}${svc._extraMsg || ""}` } });
  };

  // -- State untuk selector paket di sidebar
  const [selectedPkgId, setSelectedPkgId] = useState(null); // id paket aktif di sidebar
  const [pkgDropOpen, setPkgDropOpen] = useState(false); // dropdown pilih paket di sidebar
  const [testiIdx, setTestiIdx] = useState(0); // testimonial slider -- dideklarasikan di atas (sebelum early return) agar urutan Hooks selalu konsisten

  /* ── Service Detail Page — Magazine Aesthetic ── */
  if (selectedService) {
    const svc = selectedService;
    const imgs = (svc.images?.length ? svc.images : [svc.image]).filter(Boolean);
    const catInfo = CATEGORIES.find(c => c.key === svc.category) || {};
    const relatedSvcs = services.filter(s => s.id !== svc.id && s.category === svc.category);

    // Semua paket dalam kategori yang sama (termasuk paket ini sendiri, exclude custom)
    const allCatPackages = services.filter(s => s.category === svc.category && s.pkgId !== "custom");

    // Paket terpilih di sidebar (default = paket yang sedang dibuka)
    const activeSidebarPkg = allCatPackages.find(s => s.id === selectedPkgId) || svc;

    // Harga aktif: dari tipe paket yang dipilih, fallback ke harga global
    const paketTypes = svc.paketTypes || [];
    const utamaId = svc.utamaTipeId || (paketTypes[0]?.id) || null;
    const resolvedActiveId = activePaketTypeId || utamaId;
    const activePt = paketTypes.find(pt => pt.id === resolvedActiveId) || paketTypes[0] || null;

    // Harga aktif: dari tipe paket yang dipilih, fallback ke harga global (semua kategori)
    // sidebarPrices removed -- prices migrated to paketTypes

    const activePrice = activePt?.price || activeSidebarPkg.price || svc.price;
    const activePriceNote = activePt?.priceNote || activeSidebarPkg.priceNote || svc.priceNote;
    const activeMinPeserta = activePt?.minPeserta || svc.minPeserta;

    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#e8f7fc 0%,#f0fbfd 100%)", fontFamily: "'DM Sans', sans-serif" }}>
        <style>{`
          @keyframes mgFadeUp { from { opacity:0; transform:translateY(28px);} to { opacity:1; transform:none;} }
          .mg-fade { animation: mgFadeUp .55s cubic-bezier(.22,1,.36,1) both; }
          .mg-fade-2 { animation: mgFadeUp .55s .12s cubic-bezier(.22,1,.36,1) both; }
          .mg-fade-3 { animation: mgFadeUp .55s .22s cubic-bezier(.22,1,.36,1) both; }
          .mg-feat-row:hover { background: #d6f1f6 !important; }
          .mg-related { transition: transform .2s, box-shadow .2s; }
          .mg-related:hover { transform: translateX(5px); }
          .mg-cta-wa:hover { background: #ffffff !important; }
          .mg-cta-tel:hover { background: #d6f1f6 !important; }
          .mg-thumb { transition: all .2s; }
          .mg-thumb:hover { opacity: 1 !important; transform: scale(1.06); }
          @media(max-width:768px){
            .mg-hero-grid { grid-template-columns: 1fr !important; min-height: auto !important; }
            .mg-body-grid { grid-template-columns: 1fr !important; }
            .mg-deco-shape { display: none !important; }
            .mg-feat-grid { grid-template-columns: 1fr !important; }
            .mg-pkg-sidebar { position: static !important; top: auto !important; width: 100% !important; box-sizing: border-box !important; overflow: visible !important; }
            .svc-cat-scroll::-webkit-scrollbar { display: none; }
            .mg-hero-right { display: none !important; }
          }
          @media(max-width:480px){
            .mg-hero-grid { min-height: auto !important; }
          }
        `}</style>

        {/* -- Back Bar -- */}
        <PaketBackBar svc={svc} onClose={closeDetail} />

        {/* -- MAGAZINE HERO -- */}
        <div className="mg-fade" style={{ position: "relative", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 50%,#8B6914 100%)", overflow: "hidden" }}>
          {/* Deco grid lines */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,.025) 0, rgba(255,255,255,.025) 1px, transparent 1px, transparent 80px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 32, left: "5%", width: 1, height: "calc(100% - 32px)", background: "rgba(255,255,255,.08)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 32, right: "5%", width: 1, height: "calc(100% - 32px)", background: "rgba(255,255,255,.08)", pointerEvents: "none" }} />

          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 5%" }}>
            <div className="mg-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 460px", gap: 0, minHeight: 480 }}>

              {/* Left: Title & Info */}
              <div style={{ padding: "clamp(32px,5vw,56px) clamp(0px,3vw,40px) clamp(32px,5vw,48px) 0", display: "flex", flexDirection: "column", justifyContent: "center", borderRight: "1px solid rgba(255,255,255,.09)" }}>
                {/* Category tag */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
                  <div style={{ width: 28, height: 2, background: catInfo.color || "#8B6914" }} />
                  <span style={{ fontSize: "0.625rem", letterSpacing: "3px", color: catInfo.color || "#D4AF37", fontWeight: 700, textTransform: "uppercase" }}>
                    {(catInfo.label || svc.category).replace(/[^\w\s]/g, "").trim()}
                  </span>
                </div>
                {/* Badge */}
                {svc.badge && (
                  <div style={{ display: "inline-flex", alignItems: "center", background: svc.badgeColor || "#8B6914", color: "#fff", borderRadius: 4, padding: "4px 14px", fontSize: "0.625rem", fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 18, alignSelf: "flex-start", boxShadow: `0 4px 18px ${svc.badgeColor || "#8B6914"}55` }}>
                    ★ {svc.badge}
                  </div>
                )}
                {/* Title */}
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 22, letterSpacing: "-.01em" }}>{svc.title}</h1>
                {/* Ornamental divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
                  <div style={{ height: 1, width: 40, background: catInfo.color || "#D4AF37", opacity: .8 }} />
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: catInfo.color || "#D4AF37" }} />
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,.3)" }} />
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,.15)" }} />
                  <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,.12)" }} />
                </div>
                {/* Description */}
                <p style={{ fontSize: "1rem", color: "rgba(255,255,255,.68)", lineHeight: 1.85, whiteSpace: "pre-wrap", marginBottom: 36 }}>{svc.description}</p>
                {/* Price inline */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: "0.5625rem", letterSpacing: "2.5px", color: "rgba(255,255,255,.65)", fontWeight: 700, textTransform: "uppercase", marginBottom: 5 }}>Harga Mulai</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.6rem,5vw,2.4rem)", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                        {(() => { const raw = activePrice; const isC = String(raw||"").toLowerCase().includes("hubungi"); return isC ? "Hubungi Kami" : (formatRp(raw)||raw); })()}
                      </span>
                      <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,.68)", fontWeight: 500 }}>{activePriceNote}</span>
                    </div>
                  </div>
                  <div style={{ padding: "6px 14px", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 20, fontSize: "0.75rem", color: "rgba(255,255,255,.72)", fontStyle: "italic", marginBottom: 4 }}>Nego &amp; Konsultasi</div>
                </div>
                {svc.minPeserta && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, padding: "5px 14px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.13)", borderRadius: 20 }}>
                    <span style={{ fontSize: "0.875rem" }}></span>
                    <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,.72)", fontWeight: 600 }}>Min. <strong style={{ color: "#fff" }}>{svc.minPeserta} peserta</strong></span>
                  </div>
                )}
              </div>

              {/* Right: Hero Slideshow dari destinasi */}
              <div className="mg-hero-right">
              {(() => {
                const heroSlides = (svc.destinations || []).filter(d => d.img);
                const fallbackSlides = imgs.filter(Boolean);
                const allSlides = heroSlides.length > 0
                  ? heroSlides
                  : fallbackSlides.map((img, i) => ({ img, name: svc.title, no: String(i+1).padStart(2,"0"), title: svc.title }));
                return <ServiceHeroSlideshow key={svc.id} slides={allSlides} catColor={catInfo.color || "#D4AF37"} />;
              })()}
              </div>
            </div>
          </div>
        </div>

        {/* -- BODY -- */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(28px,5vw,52px) clamp(16px,5%,60px) clamp(48px,6vw,80px)" }}>
          <div className="mg-body-grid" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 48, alignItems: "start" }}>

            {/* -- LEFT COLUMN -- */}
            <div>

              {/* FACILITY GALLERY -- slideshow dari galeri upload paket + destinasi */}
              {(() => {
                // 1. Gambar dari galeri upload Control Panel (svc.images)
                const uploadedSlides = (svc.images || []).filter(Boolean).map((img, i) => ({
                  img,
                  name: `Foto ${i + 1}`,
                  no: String(i + 1).padStart(2, "0"),
                  title: `${svc.title} — Foto ${i + 1}`,
                }));

                // 2. Gambar dari destinations (jika ada, tambahkan setelah galeri upload)
                const destSlides = (svc.destinations || [])
                  .filter(d => d.img)
                  .map(d => ({ img: d.img, name: d.name, no: d.no, title: d.title }));

                // Gabungkan: galeri upload dulu, lalu destinasi -- hapus duplikat URL
                const seenUrls = new Set();
                const slideImgs = [...uploadedSlides, ...destSlides].filter(s => {
                  if (!s.img || seenUrls.has(s.img)) return false;
                  seenUrls.add(s.img);
                  return true;
                });

                // Fallback ke svc.image tunggal jika tidak ada galeri sama sekali
                if (slideImgs.length === 0 && svc.image) {
                  slideImgs.push({ img: svc.image, name: svc.title, no: "01", title: svc.title });
                }

                if (slideImgs.length === 0) return null;
                return (
                  <DestGallerySlideshow
                    key={svc.id}
                    slides={slideImgs}
                    catColor={catInfo.color || "#8B6914"}
                    svcTitle={svc.title}
                  />
                );
              })()}

              {/* FACILITIES -- semua kategori, difilter oleh activePt.facilityChecks */}
              {(svc.facilities || []).length > 0 && (
                <FacilitiesSection svc={svc} catInfo={catInfo} activePt={activePt} />
              )}

              {/* DESTINATIONS -- semua kategori, difilter oleh activePt.destinationChecks */}
              {(svc.destinations || []).length > 0 && (
                <DestinationsSection svc={svc} catInfo={catInfo} activePt={activePt} />
              )}

              {/* FEATURES -- 2-col magazine checklist, difilter oleh activePt.featureChecks */}
              {(() => {
                const allFeats = svc.features || [];
                const fChecks = activePt?.featureChecks || [];
                const filteredFeats = fChecks.length > 0
                  ? allFeats.filter((_, i) => fChecks[i] !== false)
                  : allFeats;
                if (!filteredFeats.length) return null;
                return (
                  <div className="mg-fade-3" style={{ marginBottom: 48 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 26 }}>
                      <div style={{ width: 4, height: 30, background: `linear-gradient(to bottom, ${catInfo.color || "#8B6914"}, transparent)`, borderRadius: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: "0.5625rem", letterSpacing: "3px", color: "#7ab5cc", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Sudah Termasuk</div>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 800, color: "#2E3D3F", lineHeight: 1.1 }}>Yang Anda Dapatkan</div>
                      </div>
                      <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, #E8DCC8, transparent)" }} />
                    </div>
                    <div className="mg-feat-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {filteredFeats.map((feat, i) => (
                        <div key={i} className="mg-feat-row" style={{ display: "flex", gap: 11, alignItems: "flex-start", background: "#fff", borderRadius: 10, padding: "13px 15px 13px 18px", border: "1px solid #c8eaf2", transition: "background .18s", position: "relative", overflow: "hidden" }}>
                          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: catInfo.color || "#8B6914", borderRadius: "10px 0 0 10px" }} />
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: catInfo.color ? `${catInfo.color}15` : "#e4f2f8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                            <span style={{ color: catInfo.color || "#8B6914", fontSize: "0.6875rem", fontWeight: 900 }}>✓</span>
                          </div>
                          <span style={{ fontSize: "0.85rem", color: "#C9AA71", lineHeight: 1.5, fontWeight: 500, whiteSpace: "pre-wrap" }}>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* -- RIGHT SIDEBAR -- */}
            <div className="mg-pkg-sidebar" style={{ position: "sticky", top: 128 }}>

              {/* Price Card */}
              <div className="mg-fade-2" style={{ background: "linear-gradient(145deg,#0d1f35 0%,#2E3D3F 55%,#3D5254 100%)", borderRadius: 16, overflow: "visible", boxShadow: "0 24px 64px rgba(12,26,40,.5)", marginBottom: 18 }}>
                {/* Top gradient bar */}
                <div style={{ height: 4, background: `linear-gradient(to right, ${catInfo.color || "#8B6914"}, ${svc.badgeColor || catInfo.color || "#E8C96A"})`, borderRadius: "16px 16px 0 0" }} />

                <div style={{ padding: "20px 18px 0" }}>
                  {/* Header label */}
                  <div style={{ fontSize: "0.5625rem", letterSpacing: "3px", color: "rgba(255,255,255,.35)", textTransform: "uppercase", fontWeight: 700, textAlign: "center", marginBottom: 14 }}>— Penawaran Spesial —</div>

                  {/* -- SELECTOR PAKET (paketTypes A/B/C/D) -- */}
                  {paketTypes.length > 0 && (() => {
                    const activePt2 = paketTypes.find(pt => pt.id === resolvedActiveId) || paketTypes[0];
                    const isUtamaActive = activePt2?.id === (svc.utamaTipeId || paketTypes[0]?.id);
                    return (
                      <div style={{ marginBottom: 16, position: "relative" }}>
                        <div style={{ fontSize: "0.5625rem", letterSpacing: "2px", color: "rgba(255,255,255,.45)", textTransform: "uppercase", fontWeight: 700, marginBottom: 8, textAlign: "center" }}>Pilih Paket</div>

                        {/* Trigger Button */}
                        <button
                          onClick={() => setPkgDropOpen(o => !o)}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "9px 13px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,.18)",
                            background: "rgba(255,255,255,.08)", cursor: "pointer", transition: "all .18s",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.14)"}
                          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.08)"}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                            {isUtamaActive && (
                              <span style={{ fontSize: "0.4375rem", fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 20, background: "#E8C96A", color: "#2E3D3F", flexShrink: 0 }}>UTAMA</span>
                            )}
                            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activePt2?.name}</span>
                            </div>
                            {activePt2?.price && (
                              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,.75)", fontFamily: "'Playfair Display',serif", flexShrink: 0 }}>{formatRp(activePt2.price) || activePt2.price}</span>
                            )}
                          </div>
                          <span style={{ color: "rgba(255,255,255,.55)", fontSize: "0.75rem", flexShrink: 0, marginLeft: 6, display: "inline-block", transform: pkgDropOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>▾</span>
                        </button>

                        {/* Dropdown List */}
                        {pkgDropOpen && (
                          <div style={{
                            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 99,
                            background: "linear-gradient(145deg,#0d1f35,#2E3D3F)",
                            borderRadius: 12, overflow: "hidden",
                            boxShadow: "0 12px 40px rgba(0,0,0,.55)",
                            border: "1px solid rgba(255,255,255,.1)",
                            animation: "mgFadeUp .18s cubic-bezier(.22,1,.36,1) both",
                          }}>
                            {paketTypes.map((pt, idx) => {
                              const isActive = pt.id === resolvedActiveId;
                              const isUtama = pt.id === (svc.utamaTipeId || paketTypes[0]?.id);
                              const ptRawPrice = pt.price;
                              const isContact = String(ptRawPrice || "").toLowerCase().includes("hubungi");
                              return (
                                <button key={pt.id}
                                  onClick={() => { setActivePaketTypeId(pt.id); setPkgDropOpen(false); }}
                                  style={{
                                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                                    padding: "10px 14px", border: "none", cursor: "pointer",
                                    borderBottom: idx < paketTypes.length - 1 ? "1px solid rgba(255,255,255,.06)" : "none",
                                    background: isActive
                                      ? `linear-gradient(135deg,${catInfo.color || "#8B6914"}cc,${catInfo.color || "#8B6914"}66)`
                                      : "transparent",
                                    transition: "background .15s",
                                  }}
                                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,.08)"; }}
                                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                                    {isUtama && (
                                      <span style={{ fontSize: "0.4375rem", fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 20, background: isActive ? "rgba(255,255,255,.25)" : "#E8C96A", color: isActive ? "#fff" : "#2E3D3F", flexShrink: 0 }}>UTAMA</span>
                                    )}
                                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                                      <span style={{ fontSize: "0.8rem", fontWeight: isActive ? 700 : 500, color: isActive ? "#fff" : "rgba(255,255,255,.75)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>{pt.name}</span>
                                    </div>
                                  </div>
                                  <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.875rem", fontWeight: 800, color: isActive ? "#fff" : "rgba(255,255,255,.55)", flexShrink: 0, marginLeft: 8 }}>
                                    {isContact ? "Konsultasi" : (formatRp(ptRawPrice) || ptRawPrice || "")}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div style={{ height: 1, background: "rgba(255,255,255,.08)", margin: "6px 0 16px" }} />

                  {/* Harga aktif -- besar di tengah */}
                  <div style={{ textAlign: "center", marginBottom: 14 }}>
                    <div style={{ fontSize: "0.5625rem", letterSpacing: "2.5px", color: "rgba(255,255,255,.38)", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Harga Mulai</div>
                    <div key={resolvedActiveId} style={{
                      fontFamily: "'Playfair Display',serif",
                      fontSize: "clamp(1.8rem,5vw,2.6rem)", fontWeight: 900, color: "#fff",
                      lineHeight: 1, marginBottom: 4,
                      animation: "mgFadeUp .3s cubic-bezier(.22,1,.36,1) both",
                    }}>
                      {(() => {
                        const raw = activePrice;
                        const isContact = String(raw || "").toLowerCase().includes("hubungi");
                        return isContact ? "Hubungi Kami" : (formatRp(raw) || raw || "—");
                      })()}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "rgba(255,255,255,.45)", fontWeight: 500 }}>{activePriceNote}</div>
                    {activeMinPeserta && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, padding: "4px 12px", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 20 }}>
                        <span style={{ fontSize: "0.8rem" }}></span>
                        <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,.65)", fontWeight: 600 }}>Min. <strong style={{ color: "#fff" }}>{activeMinPeserta} peserta</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Nego info */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "rgba(255,255,255,.06)", borderRadius: 8, padding: "10px 12px", marginBottom: 4, border: "1px solid rgba(255,255,255,.07)" }}>
                    <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: 1 }}></span>
                    <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,.55)", fontStyle: "italic", lineHeight: 1.45 }}>Harga dapat disesuaikan dengan kebutuhan dan budget Anda</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div style={{ padding: "16px", borderRadius: "0 0 16px 16px", overflow: "hidden" }}>
                  <button className="mg-cta-wa" onClick={() => {
                    const pkgTitle = activeSidebarPkg.title;
                    const priceStr = (() => { const raw = activePrice; const isC = String(raw||"").toLowerCase().includes("hubungi"); return isC ? "Hubungi Kami" : (formatRp(raw)||raw); })();
                    handleBook({ ...activeSidebarPkg, price: priceStr });
                  }}
                    style={{ width: "100%", padding: "15px 20px", background: "linear-gradient(135deg,#8B6914,#C9AA71)", color: "#fff", border: "none", borderRadius: 10, fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10, transition: "all .2s", letterSpacing: ".01em" }}>
                    <span style={{ fontSize: "1.1rem" }}></span> Pesan via WhatsApp
                  </button>
                  <button onClick={() => onWaOpen && onWaOpen()} className="mg-cta-tel"
                    style={{ width: "100%", padding: "13px 20px", background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.9)", border: "1.5px solid rgba(255,255,255,.15)", borderRadius: 10, fontSize: "0.875rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .2s", cursor: "pointer" }}>
                    <span style={{ fontSize: "1rem" }}></span> Hubungi Langsung
                  </button>
                </div>
              </div>

              {/* Why Us -- dark card with deco border */}
              <div className="mg-fade-3" style={{ background: "linear-gradient(135deg,#2E3D3F,#3D5254)", borderRadius: 14, padding: "2px", overflow: "hidden", position: "relative" }}>
                {/* Gradient border effect */}
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(145deg, ${catInfo.color || "#8B6914"}44, transparent, rgba(255,255,255,.06))`, borderRadius: 14, pointerEvents: "none" }} />
                <div style={{ background: "linear-gradient(135deg,#2E3D3F,#3D5254)", borderRadius: 12, padding: "22px 20px", position: "relative" }}>
                  {/* Inner deco frame */}
                  <div style={{ position: "absolute", top: 10, left: 10, right: 10, bottom: 10, border: "1px solid rgba(255,255,255,.05)", borderRadius: 8, pointerEvents: "none" }} />
                  {/* BG shapes */}
                  <div style={{ position: "absolute", bottom: -25, right: -25, width: 90, height: 90, borderRadius: "50%", background: `${catInfo.color || "#8B6914"}18`, pointerEvents: "none" }} />
                  <div style={{ position: "relative" }}>
                    <div style={{ fontSize: "0.5625rem", letterSpacing: "3px", color: catInfo.color || "#D4AF37", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Keunggulan Kami</div>
                    <div style={{ width: 28, height: 2, background: catInfo.color || "#D4AF37", borderRadius: 1, marginBottom: 18 }} />
                    {[
                      { icon: "", label: "Tim Profesional", desc: "Berpengalaman di bidangnya" },
                      { icon: "", label: "Konsultasi Gratis", desc: "Diskusi tanpa biaya apapun" },
                      { icon: "", label: "Kepuasan Terjamin", desc: "Rating tinggi dari klien kami" },
                      { icon: "", label: "Paket Fleksibel", desc: "Disesuaikan kebutuhan Anda" },
                    ].map((item, i, arr) => (
                      <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: i < arr.length - 1 ? 14 : 0, paddingBottom: i < arr.length - 1 ? 14 : 0, borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,.06)" : "none" }}>
                        <span style={{ fontSize: "1.1rem", flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                        <div>
                          <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "rgba(255,255,255,.85)", marginBottom: 1 }}>{item.label}</div>
                          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,.45)", lineHeight: 1.4 }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* RELATED PACKAGES -- selalu di bawah, mobile friendly */}
          {relatedSvcs.length > 0 && (
            <div className="mg-fade-3" style={{ marginTop: 48 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                <div style={{ width: 4, height: 30, background: "linear-gradient(to bottom, #7ab5cc, transparent)", borderRadius: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: "0.5625rem", letterSpacing: "3px", color: "#7ab5cc", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Lihat Juga</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 800, color: "#2E3D3F", lineHeight: 1.1 }}>Paket Serupa</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                {relatedSvcs.map(s => (
                  <div key={s.id} className="mg-related" onClick={() => openDetail(s)}
                    style={{ display: "flex", gap: 0, alignItems: "stretch", background: "#fff", borderRadius: 12, overflow: "hidden", cursor: "pointer", boxShadow: "0 2px 10px rgba(13,59,102,.07)", border: "1px solid #c8eaf2" }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 28px rgba(46,61,63,.14)"}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 10px rgba(13,59,102,.07)"}>
                    <div style={{ width: 90, flexShrink: 0, overflow: "hidden" }}>
                      <img decoding="async" loading="lazy" src={cld(s.images?.[0] || s.image)} alt={s.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .3s" }}
                        onError={e => e.target.src = ""} />
                    </div>
                    <div style={{ width: 3, flexShrink: 0, background: `linear-gradient(to bottom, ${s.badgeColor || "#8B6914"}, transparent)` }} />
                    <div style={{ padding: "12px 14px", flex: 1, minWidth: 0 }}>
                      {s.badge && <div style={{ fontSize: "0.5625rem", color: s.badgeColor || "#8B6914", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 3 }}>{s.badge}</div>}
                      <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#2E3D3F", marginBottom: 4, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</div>
                      <div style={{ fontSize: "0.8125rem", color: s.badgeColor || "#8B6914", fontWeight: 800 }}>{s.price} <span style={{ color: "#7ab5cc", fontWeight: 400, fontSize: "0.75rem" }}>{s.priceNote}</span></div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", paddingRight: 14, color: "#C9AA71", fontSize: "1.125rem", flexShrink: 0 }}>›</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Services List — Layanan Full Page (pixel-perfect dari desain) ── */
  const filteredServices = activeCategory ? services.filter(s => s.category === activeCategory) : [];

  return (
    <div className="fade-in" style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Sora', 'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes svFadeUp { from { opacity:0; transform:translateY(24px);} to { opacity:1; transform:none;} }
        .sv-card { transition: transform .25s ease, box-shadow .25s ease; cursor: pointer; }
        .sv-card:hover { transform: translateY(-6px); box-shadow: 0 20px 50px rgba(0,0,0,.16) !important; }
        .sv-card:hover .sv-card-img { transform: scale(1.07); }
        .sv-card-img { transition: transform .4s ease; }
        .sv-card-link { transition: color .2s; }
        .sv-card-link:hover { color: #C9AA71 !important; }
        .sv-keung-item { transition: background .2s; }
        .sv-keung-item:hover { background: #FAF7F0 !important; }
        .sv-galeri-item { position: relative; overflow: hidden; cursor: pointer; }
        .sv-galeri-item img { transition: transform .4s ease; display:block; width:100%; height:100%; object-fit:cover; }
        .sv-galeri-item:hover img { transform: scale(1.07); }
        .sv-galeri-overlay { position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,.72) 0%, transparent 55%); display:flex; align-items:flex-end; padding:14px 16px; }
        .sv-testi-btn { transition: background .2s, border-color .2s; }
        .sv-testi-btn:hover { background: #C9AA71 !important; border-color: #C9AA71 !important; }
        .sv-wa-btn { transition: background .2s; }
        .sv-wa-btn:hover { background: #1da851 !important; }
        .sv-lihat-btn { transition: background .2s, color .2s; }
        .sv-lihat-btn:hover { background: #2E3D3F !important; color: #fff !important; }
        @media(max-width:900px){ .sv-layanan-grid { grid-template-columns: repeat(3,1fr) !important; } .sv-galeri-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media(max-width:640px){ .sv-layanan-grid { grid-template-columns: repeat(2,1fr) !important; } .sv-galeri-grid { grid-template-columns: repeat(2,1fr) !important; } .sv-keung-grid { grid-template-columns: repeat(2,1fr) !important; } .sv-testi-grid { grid-template-columns: 1fr !important; } }
        @media(max-width:400px){ .sv-layanan-grid { grid-template-columns: 1fr !important; } .sv-galeri-grid { grid-template-columns: 1fr !important; } }
        @media(max-width:700px){ .sv-keung-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media(max-width:400px){ .sv-keung-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* ======================================
          HERO SECTION -- dengan background foto rumah
      ====================================== */}
      <div style={{ position:"relative", height:"clamp(420px,65vw,640px)", overflow:"hidden", background:"#1a2526" }}>
        {/* Hero BG image */}
        <img decoding="async" loading="lazy"
          src={cld(content?.servicesHeroImage || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&q=85")}
          alt="Hikimori Const Hero"
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center", opacity:.72 }}
        />
        {/* dark overlay gradient */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right, rgba(0,0,0,.78) 35%, rgba(0,0,0,.28) 100%)" }} />

        {/* Content */}
        <div style={{ position:"relative", zIndex:2, height:"100%", display:"flex", alignItems:"center", padding:"0 clamp(24px,6%,120px)" }}>
          <div style={{ maxWidth:560, animation:"svFadeUp .6s ease both" }}>
            <h1 style={{ fontSize:"clamp(2rem,5.5vw,3.4rem)", fontWeight:900, color:"#fff", lineHeight:1.08, marginBottom:14, letterSpacing:"-0.01em" }}>
              {content?.servicesPageTitle || "SOLUSI LENGKAP DESAIN & KONSTRUKSI"}
            </h1>
            <p style={{ fontSize:"clamp(0.9rem,2vw,1.0625rem)", color:"rgba(255,255,255,.82)", lineHeight:1.75, marginBottom:28, maxWidth:420 }}>
              {content?.servicesPageSub || "Melayani desain, renovasi, interior, eksterior hingga penataan taman dengan standar profesional."}
            </p>
            <div style={{ display:"flex", gap:14, flexWrap:"wrap", alignItems:"center" }}>
              <button className="sv-wa-btn" onClick={() => onWaOpen && onWaOpen()}
                style={{ padding:"13px 26px", background:"#25D366", color:"#fff", border:"none", borderRadius:8, fontSize:"0.9375rem", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:"1.1rem" }}></span> KONSULTASI GRATIS
              </button>
              <button style={{ padding:"13px 22px", background:"transparent", color:"#fff", border:"none", borderRadius:8, fontSize:"0.9rem", fontWeight:500, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ width:34, height:34, borderRadius:"50%", border:"2px solid rgba(255,255,255,.7)", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:"0.75rem" }}>▶</span>
                LIHAT VIDEO PROFIL PERUSAHAAN
              </button>
            </div>
          </div>
        </div>

        {/* Slide dots */}
        <div style={{ position:"absolute", bottom:20, left:"50%", transform:"translateX(-50%)", display:"flex", gap:8, zIndex:3 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: i===0 ? 24 : 8, height:8, borderRadius:4, background: i===0 ? "#C9AA71" : "rgba(255,255,255,.45)", transition:"all .3s" }} />
          ))}
        </div>

        {/* Arrow prev */}
        <button style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:38, height:38, borderRadius:"50%", background:"rgba(255,255,255,.18)", border:"none", color:"#fff", fontSize:"1.1rem", cursor:"pointer", zIndex:3, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
        {/* Arrow next */}
        <button style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", width:38, height:38, borderRadius:"50%", background:"rgba(255,255,255,.18)", border:"none", color:"#fff", fontSize:"1.1rem", cursor:"pointer", zIndex:3, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
      </div>

      {/* ======================================
          KEUNGGULAN STRIP (6 kolom ikon)
      ====================================== */}
      <div style={{ background:"#fff", borderBottom:"1px solid #F0EAE0", padding:"clamp(24px,3.5vw,40px) 5%" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div className="sv-keung-grid" style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8 }}>
            {KEUNGGULAN.map((k,i) => (
              <div key={i} className="sv-keung-item" style={{ textAlign:"center", padding:"22px 10px", borderRadius:10 }}>
                <div style={{ fontSize:"2rem", marginBottom:10, lineHeight:1 }}>{k.icon}</div>
                <div style={{ fontSize:"0.8125rem", fontWeight:700, color:"#1a2526", marginBottom:5 }}>{k.label}</div>
                <div style={{ fontSize:"0.73rem", color:"#5A6A6C", lineHeight:1.5 }}>{k.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================
          LAYANAN SECTION (6 cards)
      ====================================== */}
      <section style={{ background:"#fff", padding:"clamp(44px,6vw,80px) 5%" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          {/* Section header */}
          <div style={{ textAlign:"center", marginBottom:"clamp(28px,4.5vw,52px)" }}>
            <div style={{ fontSize:"0.6875rem", letterSpacing:"4px", color:"#C9AA71", textTransform:"uppercase", fontWeight:700, marginBottom:12 }}>LAYANAN KAMI</div>
            <h2 style={{ fontSize:"clamp(1.6rem,3.8vw,2.5rem)", fontWeight:800, color:"#1a2526", lineHeight:1.12, letterSpacing:"-0.01em", margin:0 }}>
              Layanan Terbaik Untuk Anda
            </h2>
          </div>

          {/* 6-col card grid */}
          <div className="sv-layanan-grid" style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:18 }}>
            {LAYANAN_LIST.map((lay) => {
              const matchedSvc = services.find(s => s.category === lay.category) || null;
              return (
                <div key={lay.key} className="sv-card"
                  onClick={() => {
                    if (matchedSvc) { openDetail(matchedSvc); }
                    else { onWaOpen && onWaOpen({ key: "layanan", vars: { judul_layanan: lay.label } }); }
                  }}
                  style={{ borderRadius:14, overflow:"hidden", background:"#fff", boxShadow:"0 4px 18px rgba(0,0,0,.07)", border:"1px solid #F0EAE0" }}>
                  {/* Image */}
                  <div style={{ position:"relative", height:150, overflow:"hidden", background:"#e8e0d0" }}>
                    <img decoding="async" loading="lazy"
                      src={cld(lay.img)}
                      alt={lay.label}
                      className="sv-card-img"
                      style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                      onError={onImgError}
                    />
                    {/* icon badge */}
                    <div style={{ position:"absolute", bottom:10, left:10, width:36, height:36, borderRadius:"50%", background:lay.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.05rem", boxShadow:"0 4px 12px rgba(0,0,0,.22)" }}>
                      {lay.icon}
                    </div>
                  </div>
                  {/* Body */}
                  <div style={{ padding:"14px 14px 18px" }}>
                    <h3 style={{ fontSize:"0.9375rem", fontWeight:800, color:"#1a2526", marginBottom:7, lineHeight:1.3 }}>{lay.label}</h3>
                    <p style={{ fontSize:"0.78rem", color:"#5A6A6C", lineHeight:1.6, marginBottom:12 }}>{lay.desc}</p>
                    <span className="sv-card-link" style={{ fontSize:"0.78rem", fontWeight:700, color:lay.color, display:"flex", alignItems:"center", gap:3 }}>
                      Selengkapnya <span style={{ fontSize:"0.9rem" }}>→</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================
          GALERI PROYEK
      ====================================== */}
      <section style={{ background:"#fff", padding:"0 0 clamp(52px,7vw,88px)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 5% 20px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
            <div>
              <div style={{ width:44, height:3, background:"#C9AA71", borderRadius:2, marginBottom:10 }} />
              <h2 style={{ fontSize:"clamp(1.4rem,3vw,2rem)", fontWeight:800, color:"#1a2526", margin:0, lineHeight:1.15 }}>Galeri Proyek</h2>
            </div>
            <button className="sv-lihat-btn"
              style={{ padding:"10px 22px", background:"#fff", color:"#1a2526", border:"1.5px solid #1a2526", borderRadius:8, fontSize:"0.85rem", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8, whiteSpace:"nowrap" }}>
              LIHAT SEMUA PROYEK →
            </button>
          </div>
        </div>

        {/* -- MARQUEE RUNNER -- */}
        <style>{`
          @keyframes svMarquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
          .sv-marquee-track { display:flex; width:max-content; animation:svMarquee 24s linear infinite; }
          .sv-marquee-track:hover { animation-play-state:paused; }
          .sv-marquee-wrap { overflow:hidden; width:100%; position:relative; }
          .sv-marquee-wrap::before,.sv-marquee-wrap::after {
            content:""; position:absolute; top:0; bottom:0; width:80px; z-index:2; pointer-events:none;
          }
          .sv-marquee-wrap::before { left:0; background:linear-gradient(to right,#fff,transparent); }
          .sv-marquee-wrap::after  { right:0; background:linear-gradient(to left,#fff,transparent); }
          .sv-mgcard { flex:0 0 auto; width:320px; height:210px; margin-right:6px; position:relative; overflow:hidden; cursor:pointer; }
          .sv-mgcard img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .45s; }
          .sv-mgcard:hover img { transform:scale(1.08); }
          .sv-mgcard-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,.72) 0%,transparent 55%); display:flex; align-items:flex-end; padding:14px 16px; opacity:0; transition:opacity .3s; }
          .sv-mgcard:hover .sv-mgcard-overlay { opacity:1; }
        `}</style>

        <div className="sv-marquee-wrap">
          <div className="sv-marquee-track">
            {[...GALERI_LIST, ...GALERI_LIST, ...GALERI_LIST, ...GALERI_LIST].map((g, i) => (
              <div key={i} className="sv-mgcard">
                <img decoding="async" loading="lazy" src={cld(g.img)} alt={g.label} onError={onImgError} />
                <div className="sv-mgcard-overlay">
                  <span style={{ fontSize:"0.65rem", fontWeight:800, letterSpacing:"1.5px", color:"#fff", textTransform:"uppercase", textShadow:"0 1px 4px rgba(0,0,0,.6)", lineHeight:1.3 }}>{g.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================
          TESTIMONIAL
      ====================================== */}
      <section style={{ background:"#1a2526", padding:"clamp(52px,7vw,88px) 5%", position:"relative", overflow:"hidden" }}>
        {/* deco dots */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle, rgba(255,255,255,.04) 1px, transparent 1px)", backgroundSize:"28px 28px", pointerEvents:"none" }} />
        <div style={{ position:"relative", zIndex:1, maxWidth:1200, margin:"0 auto" }}>
          {/* heading */}
          <div style={{ textAlign:"center", marginBottom:40 }}>
            <h2 style={{ fontSize:"clamp(1.5rem,3.5vw,2.2rem)", fontWeight:800, color:"#fff", margin:"0 0 10px", lineHeight:1.15 }}>Apa Kata Klien Kami</h2>
            <div style={{ width:48, height:3, background:"#C9AA71", borderRadius:2, margin:"0 auto" }} />
          </div>

          {/* 3 cards */}
          <div style={{ position:"relative" }}>
            <div className="sv-testi-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
              {TESTIMONI.map((t,i) => (
                <div key={i} style={{ background:"rgba(255,255,255,.06)", borderRadius:14, padding:"26px 24px", border:"1px solid rgba(255,255,255,.1)" }}>
                  <div style={{ fontSize:"2.2rem", color:"#C9AA71", lineHeight:1, marginBottom:14, fontFamily:"Georgia,serif" }}>"</div>
                  <p style={{ fontSize:"0.875rem", color:"rgba(255,255,255,.82)", lineHeight:1.75, marginBottom:20 }}>{t.text}</p>
                  {/* Stars */}
                  <div style={{ display:"flex", gap:3, marginBottom:16 }}>
                    {Array.from({length:t.stars}).map((_,si) => (
                      <span key={si} style={{ color:"#C9AA71", fontSize:"0.95rem" }}>★</span>
                    ))}
                  </div>
                  {/* Author */}
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:42, height:42, borderRadius:"50%", background:"linear-gradient(135deg,#C9AA71,#8B6914)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:"1rem", flexShrink:0 }}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, color:"#fff", fontSize:"0.9rem" }}>{t.name}</div>
                      <div style={{ fontSize:"0.75rem", color:"rgba(255,255,255,.55)" }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Arrow nav */}
            <button className="sv-testi-btn" onClick={() => setTestiIdx(p => Math.max(0,p-1))}
              style={{ position:"absolute", top:"50%", left:-20, transform:"translateY(-50%)", width:38, height:38, borderRadius:"50%", background:"rgba(255,255,255,.1)", border:"1.5px solid rgba(255,255,255,.25)", color:"#fff", fontSize:"1.1rem", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
            <button className="sv-testi-btn" onClick={() => setTestiIdx(p => Math.min(TESTIMONI.length-1,p+1))}
              style={{ position:"absolute", top:"50%", right:-20, transform:"translateY(-50%)", width:38, height:38, borderRadius:"50%", background:"rgba(255,255,255,.1)", border:"1.5px solid rgba(255,255,255,.25)", color:"#fff", fontSize:"1.1rem", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
          </div>
        </div>
      </section>

      {/* ======================================
          CTA BANNER -- Hunian Impian
      ====================================== */}
      <section style={{ position:"relative", overflow:"hidden" }}>
        {/* BG foto */}
        <img decoding="async" loading="lazy"
          src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1400&q=80"
          alt="CTA BG"
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}
        />
        <div style={{ position:"absolute", inset:0, background:"rgba(26,37,38,.82)" }} />
        <div style={{ position:"relative", zIndex:1, padding:"clamp(52px,7vw,88px) 5%", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:24, maxWidth:1200, margin:"0 auto" }}>
          <div>
            <h2 style={{ fontSize:"clamp(1.5rem,3.5vw,2.2rem)", fontWeight:800, color:"#fff", margin:"0 0 8px", lineHeight:1.2 }}>
              Siap Mewujudkan Hunian Impian Anda?
            </h2>
            <p style={{ fontSize:"1rem", color:"rgba(255,255,255,.75)", margin:0 }}>
              Konsultasikan kebutuhan Anda sekarang juga secara gratis!
            </p>
          </div>
          <button className="sv-wa-btn" onClick={() => onWaOpen && onWaOpen()}
            style={{ padding:"15px 32px", background:"#25D366", color:"#fff", border:"none", borderRadius:8, fontSize:"1rem", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:10, whiteSpace:"nowrap", flexShrink:0, boxShadow:"0 4px 20px rgba(37,211,102,.4)" }}>
            <span style={{ fontSize:"1.2rem" }}></span> KONSULTASI SEKARANG
          </button>
        </div>
      </section>

    </div>
  );
}

export { DestGallerySlideshow, DestinationsSection, FacilitiesSection, GALERI_LIST, KEUNGGULAN, LAYANAN_LIST, PaketBackBar, STATIC_CATEGORIES, ServiceHeroSlideshow, ServicesPage, TESTIMONI };
