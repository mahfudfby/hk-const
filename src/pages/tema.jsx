/* Chunk halaman "tema" — dimuat lazy (React.lazy) saat rute ini dibuka.
   Dipisah dari RealEstateWeb.jsx agar pengunjung halaman lain tidak ikut mengunduh kode ini. */
import { useState, useEffect } from "react";
import { cld } from "../lib/net.js";
import { SocialProofCTA, TEMA_DATA, TemaPhotoSlideshow, VideoEmbed, detectVideoEmbed, onImgError, publicCaption, temaDetailUrl } from "../app/core.jsx";
/* ── Kalkulator Luas Lahan ── */
function KalkulatorLuas({ tema }) {
  const [paketIdx, setPaketIdx] = useState(1);

  /* ── Input mode: "dimensi" = P×L, "luas" = langsung luas ── */
  const [panjang, setPanjang] = useState("");
  const [lebar, setLebar]   = useState("");
  const [luasManual, setLuasManual] = useState("");

  /* Hitung luas efektif:
     - Jika P & L terisi → luas = P × L (dimensi mode)
     - Jika tidak, pakai luasManual
     - Fallback ke 0 agar tombol konsultasi tetap bisa muncul */
  const pNum = parseFloat(panjang) || 0;
  const lNum = parseFloat(lebar)   || 0;
  const fromDimensi = pNum > 0 && lNum > 0;
  const luasDariDimensi = fromDimensi ? pNum * lNum : 0;
  const luasEfektif = fromDimensi
    ? luasDariDimensi
    : (parseFloat(luasManual) || 0);

  /* Validasi: wajib salah satu */
  const adaDimensi   = pNum > 0 && lNum > 0;
  const adaLuasLangsung = (parseFloat(luasManual) || 0) > 0;
  const valid = adaDimensi || adaLuasLangsung;

  /* Jika dimensi diisi → auto-isi luasManual (read-only display) */
  const luasDisplay = fromDimensi ? luasDariDimensi.toFixed(2).replace(/\.00$/, "") : luasManual;

  const paket = tema.detail.harga.paket[paketIdx];
  const isCustom = paket.harga === 0;
  const totalHarga = (valid && !isCustom) ? luasEfektif * paket.harga : null;
  const fmtRp = (n) => "Rp " + Math.round(n).toLocaleString("id-ID");

  /* Warna input border berdasarkan state */
  const borderDimensi = adaDimensi ? `1.5px solid ${tema.warna}` : "1.5px solid rgba(255,255,255,.22)";
  const borderLuas    = (!adaDimensi && adaLuasLangsung) ? `1.5px solid ${tema.warna}` : "1.5px solid rgba(255,255,255,.22)";

  const inputStyle = (active) => ({
    flex: 1, padding: "9px 12px", borderRadius: 8,
    border: active ? `1.5px solid ${tema.warna}` : "1.5px solid rgba(255,255,255,.22)",
    background: active ? tema.warna + "22" : "rgba(255,255,255,.08)",
    color: "#fff", fontSize: "0.9rem", outline: "none", width: "100%", boxSizing: "border-box",
    transition: "border .2s, background .2s",
  });

  return (
    <div style={{ background: "linear-gradient(135deg,#1a2a2a 0%,#2E3D3F 60%,#3D5254 100%)", borderRadius: 16, padding: "32px", color: "#fff" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <span style={{ fontSize: 24 }}></span>
        <div>
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: tema.warna, fontWeight: 800 }}>ESTIMASI BIAYA</div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#fff" }}>Kalkulator Luas Lahan</h3>
        </div>
      </div>

      {/* Pilih Paket */}
      <div style={{ marginBottom: 22 }}>
        <label style={{ display: "block", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,.5)", marginBottom: 8, fontWeight: 700 }}>Pilih Paket</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tema.detail.harga.paket.map((p, i) => (
            <button key={i} onClick={() => setPaketIdx(i)} style={{
              padding: "10px 14px", borderRadius: 8, cursor: "pointer", textAlign: "left", transition: "all .2s",
              background: paketIdx === i ? tema.warna + "44" : "rgba(255,255,255,.07)",
              border: paketIdx === i ? `1.5px solid ${tema.warna}` : "1.5px solid rgba(255,255,255,.15)",
              color: paketIdx === i ? "#fff" : "rgba(255,255,255,.7)",
            }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>{p.nama}</div>
              <div style={{ fontSize: "0.7rem", marginTop: 2, opacity: 0.8 }}>{p.harga === 0 ? "Harga sesuai kebutuhan" : `${fmtRp(p.harga)} / m²`} · {p.luas}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── INPUT PANJANG × LEBAR ── */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <label style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,.5)", fontWeight: 700 }}>
            Panjang × Lebar
          </label>
          <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,.35)", fontStyle: "italic" }}>Opsional jika isi Luas</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <input
              type="number" min={1} placeholder="Panjang"
              value={panjang}
              onChange={e => {
                setPanjang(e.target.value);
                // Jika dimensi diisi, kosongkan luasManual supaya tidak bentrok
                if (e.target.value) setLuasManual("");
              }}
              style={inputStyle(adaDimensi)}
            />
          </div>
          <span style={{ color: "rgba(255,255,255,.55)", fontWeight: 800, fontSize: "1rem", flexShrink: 0 }}>×</span>
          <div style={{ flex: 1 }}>
            <input
              type="number" min={1} placeholder="Lebar"
              value={lebar}
              onChange={e => {
                setLebar(e.target.value);
                if (e.target.value) setLuasManual("");
              }}
              style={inputStyle(adaDimensi)}
            />
          </div>
          <span style={{ color: "rgba(255,255,255,.5)", fontSize: "0.82rem", fontWeight: 600, flexShrink: 0 }}>m</span>
        </div>
        {adaDimensi && (
          <div style={{ marginTop: 6, fontSize: "0.72rem", color: tema.warna, fontWeight: 700 }}>
            ✓ {panjang} m × {lebar} m = <strong>{luasDariDimensi.toFixed(2).replace(/\.00$/, "")} m²</strong>
          </div>
        )}
      </div>

      {/* Divider "ATAU" */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0" }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.12)" }} />
        <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: ".1em", color: "rgba(255,255,255,.35)", textTransform: "uppercase" }}>atau</span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.12)" }} />
      </div>

      {/* ── INPUT LUAS LANGSUNG ── */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <label style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,.5)", fontWeight: 700 }}>
            Luas Bangunan
          </label>
          {fromDimensi
            ? <span style={{ fontSize: "0.62rem", color: tema.warna, fontWeight: 700 }}>Otomatis dari P × L</span>
            : <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,.35)", fontStyle: "italic" }}>Opsional jika isi P × L</span>
          }
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="number" min={1} placeholder="Contoh: 100"
            value={fromDimensi ? luasDisplay : luasManual}
            readOnly={fromDimensi}
            onChange={e => {
              if (fromDimensi) return;
              setLuasManual(e.target.value);
            }}
            style={{
              ...inputStyle(!fromDimensi && adaLuasLangsung),
              flex: 1,
              opacity: fromDimensi ? 0.6 : 1,
              cursor: fromDimensi ? "not-allowed" : "text",
              color: fromDimensi ? tema.warna : "#fff",
              fontWeight: fromDimensi ? 800 : 400,
            }}
          />
          <span style={{ color: "rgba(255,255,255,.6)", fontSize: "0.85rem", fontWeight: 600 }}>m²</span>
        </div>
        {!fromDimensi && !adaLuasLangsung && !adaDimensi && (
          <div style={{ marginTop: 5, fontSize: "0.68rem", color: "#f87171" }}>
            Isi Panjang × Lebar atau Luas untuk melihat estimasi
          </div>
        )}
      </div>

      {/* Slider (muncul hanya jika ada nilai luas) */}
      {valid && luasEfektif > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <label style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,.5)", fontWeight: 700 }}>Geser untuk adjust</label>
            <span style={{ fontSize: "0.95rem", fontWeight: 800, color: tema.warna }}>{Math.round(luasEfektif)} m²</span>
          </div>
          <input type="range" min={10} max={1000} step={5}
            value={Math.min(1000, Math.round(luasEfektif))}
            onChange={e => {
              const v = +e.target.value;
              setPanjang(""); setLebar("");
              setLuasManual(String(v));
            }}
            style={{ width: "100%", accentColor: tema.warna, cursor: "pointer" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: "0.62rem", color: "rgba(255,255,255,.38)" }}>
            <span>10 m²</span><span>1000 m²</span>
          </div>
        </div>
      )}

      {/* Hasil Estimasi */}
      <div style={{ background: isCustom ? "rgba(255,255,255,.08)" : `rgba(${parseInt(tema.warna.slice(1,3),16)},${parseInt(tema.warna.slice(3,5),16)},${parseInt(tema.warna.slice(5,7),16)},.15)`, border: `1.5px solid ${valid ? tema.warna + "88" : "rgba(255,255,255,.15)"}`, borderRadius: 12, padding: "20px 22px" }}>
        {!valid ? (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontSize: "1.6rem", marginBottom: 6 }}></div>
            <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,.45)" }}>Isi dimensi atau luas untuk melihat estimasi harga</div>
          </div>
        ) : isCustom ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: 8 }}></div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff" }}>Harga Konsultasi Eksklusif</div>
            <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,.6)", marginTop: 4 }}>Hubungi tim kami untuk penawaran ultra-luxury</div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,.5)", fontWeight: 700, marginBottom: 4 }}>Estimasi Total</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", fontWeight: 900, color: tema.warna, lineHeight: 1 }}>{fmtRp(totalHarga)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,.5)", fontWeight: 700, marginBottom: 4 }}>Rincian</div>
                <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,.68)" }}>
                  {fromDimensi
                    ? <>{panjang}m × {lebar}m = {luasDariDimensi.toFixed(2).replace(/\.00$/,"")} m²</>
                    : <>{luasEfektif} m²</>
                  } × {fmtRp(paket.harga)}
                </div>
              </div>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 12 }}>
              <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,.5)", fontWeight: 700, marginBottom: 6 }}>Sudah Termasuk</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {paket.termasuk.map((item, i) => (
                  <span key={i} style={{ fontSize: "0.7rem", background: "rgba(255,255,255,.1)", borderRadius: 20, padding: "3px 10px", color: "rgba(255,255,255,.8)" }}>✓ {item}</span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <p style={{ fontSize: "0.62rem", color: "rgba(255,255,255,.32)", marginTop: 12, lineHeight: 1.5, textAlign: "center" }}>
        * Estimasi kasar. Harga final sesuai survei lapangan, spesifikasi material, dan kondisi lahan.
      </p>
    </div>
  );
}

function TemaCardContent({ tema, setTemaSlug }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
        <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "2.4rem", fontWeight: 900, color: "#E8DCC8", lineHeight: 1 }}>{tema.no}</span>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.4rem", fontWeight: 900, color: "#2E3D3F", margin: 0, lineHeight: 1 }}>{tema.nama.toUpperCase()}</h2>
      </div>
      <div style={{ width: 38, height: 3, background: tema.warna, borderRadius: 2, marginBottom: 14 }} />
      <p style={{ fontSize: "0.86rem", color: "#5A6A6C", lineHeight: 1.72, marginBottom: 20 }}>{tema.tagline}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 22 }}>
        {tema.fitur.map((f, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#F5EDD8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", margin: "0 auto 6px" }}>{f.icon}</div>
            <div style={{ fontSize: "0.62rem", color: "#5A6A6C", fontWeight: 600, lineHeight: 1.3 }}>{f.label}</div>
          </div>
        ))}
      </div>
      <button onClick={() => setTemaSlug(tema.slug)} style={{
        display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px",
        border: "1.5px solid #2E3D3F", borderRadius: 3, background: "transparent", color: "#2E3D3F",
        fontWeight: 700, fontSize: "0.76rem", cursor: "pointer", letterSpacing: ".08em", textTransform: "uppercase",
        transition: "all .2s",
      }}
        onMouseEnter={e => { e.currentTarget.style.background = "#2E3D3F"; e.currentTarget.style.color = "#fff"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#2E3D3F"; }}
      >LIHAT DETAIL <span>→</span></button>
    </>
  );
}

/* ── Detail Page per tema ── */
function TemaDetailPage({ slug, onWaOpen, onBack, temaList }) {
  const resolvedList = (temaList && temaList.length > 0) ? temaList : TEMA_DATA;
  const tema = resolvedList.find(t => t.slug === slug);
  const [linkCopied, setLinkCopied] = useState(false);
  /* Foto pertama tema — dipakai sebagai background section tengah (opacity 40%) */
  const firstPhotoUrl = tema ? ((tema.imgs && tema.imgs.length > 0 ? tema.imgs[0].img : "") || tema.img || "") : "";

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  /* Tema tidak ditemukan (link salah, typo, atau tema sudah dihapus admin) → tampilkan fallback, bukan crash */
  if (!tema) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 5%", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: 16 }}></div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.4rem", fontWeight: 800, color: "#2E3D3F", margin: "0 0 10px" }}>Tema Rumah Tidak Ditemukan</h2>
        <p style={{ color: "#5A6A6C", fontSize: "0.9rem", maxWidth: 420, marginBottom: 24 }}>Link yang Anda buka mungkin salah, atau tema ini sudah tidak tersedia.</p>
        <button onClick={onBack} style={{ padding: "12px 28px", background: "#2E3D3F", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
          ← Lihat Semua Tema Rumah
        </button>
      </div>
    );
  }

  const copyTemaLink = () => {
    const url = window.location.origin + temaDetailUrl(slug);
    const shareData = { title: `Tema ${tema.nama} — HIKIMORI CONST`, text: `Lihat Tema ${tema.nama} dari HIKIMORI CONST:`, url };

    /* Prioritaskan native share sheet (WhatsApp/Instagram/dll langsung muncul di device),
       fallback ke copy clipboard biasa kalau browser tidak mendukung Web Share API
       (misalnya di desktop Chrome/Firefox). */
    if (navigator.share) {
      navigator.share(shareData).catch(() => {}); // diamkan kalau user membatalkan share sheet
      return;
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 1800);
      });
    }
  };

  if (!tema) return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{ fontSize: "3rem", marginBottom: 16 }}></div>
      <h2 style={{ fontFamily: "'Playfair Display',serif", color: "#2E3D3F" }}>Tema tidak ditemukan</h2>
      <button onClick={onBack} style={{ marginTop: 16, padding: "10px 24px", background: "#2E3D3F", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>← Kembali</button>
    </div>
  );

  const PoinItem = ({ text }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 14px", background: "#FDFAF4", borderRadius: 9, border: "1px solid #F5EDD8" }}>
      <span style={{ width: 22, height: 22, borderRadius: "50%", background: tema.warna + "22", color: tema.warna, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 900, flexShrink: 0 }}>✓</span>
      <span style={{ fontSize: "0.83rem", color: "#2E3D3F", fontWeight: 500 }}>{text}</span>
    </div>
  );

  const SectionLabel = ({ icon, text, color }) => (
    <div style={{ fontSize: "0.65rem", letterSpacing: ".12em", textTransform: "uppercase", color: color || tema.warna, fontWeight: 800, marginBottom: 7, textShadow: "0 1px 6px rgba(0,0,0,.4)" }}>{icon} {text}</div>
  );

  return (
    <div style={{ fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      {/* Back Bar */}
      <div className="tema-backbar" style={{ background: "linear-gradient(90deg,#1a2a2a,#2E3D3F)", padding: "0 5%", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 90, borderBottom: `3px solid ${tema.warna}`, gap: 10 }}>
        <button onClick={onBack} className="tema-back-btn" style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#C9AA71", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", padding: "13px 0", letterSpacing: ".06em", textTransform: "uppercase", flexShrink: 0 }}>
          <span style={{ fontSize: 18 }}>←</span> <span className="tema-back-label">Kembali ke Tema Rumah</span>
        </button>
        <span className="tema-name-badge" style={{ fontSize: "0.74rem", color: "rgba(255,255,255,.45)", letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tema.no} · {tema.nama}</span>
        <button onClick={copyTemaLink} className="tema-share-btn" style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.2)", color: linkCopied ? "#8BD9A0" : "#fff", fontWeight: 700, fontSize: "0.72rem", cursor: "pointer", padding: "6px 12px", borderRadius: 20, letterSpacing: ".04em", whiteSpace: "nowrap", flexShrink: 0 }}>
          <span></span> <span className="tema-share-label">{linkCopied ? "Link disalin!" : "Bagikan"}</span>
        </button>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .tema-backbar { padding: 8px 4% !important; gap: 8px !important; }
          .tema-back-btn { order: 1; padding: 8px !important; }
          .tema-back-label { display: none !important; }
          .tema-name-badge { order: 2; flex: 1 1 auto; text-align: center; font-size: 0.66rem !important; }
          .tema-share-btn { order: 3; padding: 8px !important; border-radius: 50% !important; width: 34px; height: 34px; justify-content: center; }
          .tema-share-label { display: none !important; }
        }
      `}</style>

      {/* Hero */}
      <div style={{ position: "relative", height: 400, overflow: "hidden" }}>
        <img decoding="async" loading="lazy" src={cld(tema.img)} alt={tema.nama} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={onImgError} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right,rgba(10,20,20,.88) 38%,rgba(10,20,20,.25) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "36px 5%" }}>
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: tema.warna, fontWeight: 800, marginBottom: 7 }}>TEMA RUMAH · {tema.no}</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.8rem,4.5vw,3rem)", fontWeight: 900, color: "#fff", margin: "0 0 11px", lineHeight: 1.1, textShadow: "0 2px 18px rgba(0,0,0,.5)" }}>{tema.nama}</h1>
          <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,.78)", maxWidth: 520, lineHeight: 1.65, margin: "0 0 20px" }}>{tema.deskripsi}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {tema.fitur.map((f, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 13px", background: "rgba(255,255,255,.12)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 20, color: "#fff", fontSize: "0.76rem", fontWeight: 600 }}>{f.icon} {f.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ════════ WRAPPER: BACKGROUND FOTO TEMA (opacity 40%) UNTUK SELURUH BAGIAN TENGAH ════════ */}
      <div style={{ position: "relative" }}>
        {/* Base color di bawah foto — jaga-jaga kalau foto gagal load / masih loading */}
        <div style={{ position: "absolute", inset: 0, background: "#1a2a2a" }} />
        {/* Foto pertama tema, opacity 40% */}
        {firstPhotoUrl && (
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${firstPhotoUrl})`,
            backgroundSize: "cover", backgroundPosition: "center",
            opacity: 0.4,
          }} />
        )}
        {/* Konten section — di atas layer background */}
        <div style={{ position: "relative" }}>

      {/* ════════ SECTION: EKSTERIOR ════════ */}
      <div style={{ padding: "48px 5% 56px", maxWidth: 1060, margin: "0 auto" }}>
        <div style={{ background: "rgba(255,255,255,.16)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderRadius: 16, padding: "22px 26px", marginBottom: 28, display: "inline-block", maxWidth: "100%", boxSizing: "border-box" }}>
          <SectionLabel icon="" text="EKSTERIOR" color="#fff" />
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.7rem", fontWeight: 800, color: "#fff", margin: "0 0 14px", textShadow: "0 2px 10px rgba(0,0,0,.55)" }}>Tampak Luar {tema.nama}</h2>
          <p style={{ color: "#fff", lineHeight: 1.75, margin: 0, fontSize: "0.88rem", maxWidth: 720, textShadow: "0 1px 6px rgba(0,0,0,.55)", whiteSpace: "pre-line" }}>{tema.detail.exterior.desc}</p>
        </div>

        {(() => {
          const photos = (tema.imgs && tema.imgs.length > 0) ? tema.imgs : (tema.img ? [{ img: tema.img, label: tema.nama }] : []);
          if (photos.length === 0) {
            return (
              <div style={{ textAlign: "center", padding: "50px 20px", background: "#FDFAF4", borderRadius: 14, border: "1px solid #F5EDD8", color: "#A89070", fontSize: "0.85rem" }}>
                Foto eksterior belum tersedia untuk tema ini.
              </div>
            );
          }
          return (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gridAutoFlow: "dense", gap: 18 }}>
              {photos.map((p, i) => (
                <div key={i} style={{
                  position: "relative", borderRadius: 16, overflow: "hidden", cursor: "pointer",
                  boxShadow: "0 8px 28px rgba(0,0,0,.14)",
                  gridColumn: i % 5 === 0 ? "span 2" : "span 1",
                  gridRow: i % 5 === 0 ? "span 2" : "span 1",
                  aspectRatio: i % 5 === 0 ? "16/13" : "4/3",
                }}>
                  <img decoding="async" loading="lazy" src={cld(p.img)} alt={publicCaption(p.label) || tema.nama}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform .45s ease" }}
                    onError={e => e.target.parentElement.style.display = "none"}
                    onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.12)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                  />
                  {publicCaption(p.label) && (
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 14px 10px", background: "linear-gradient(to top, rgba(0,0,0,.65), transparent)", color: "#fff", fontSize: "0.78rem", fontWeight: 700, pointerEvents: "none" }}>
                      {publicCaption(p.label)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}

        <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 9, maxWidth: 560 }}>
          {tema.detail.exterior.poin.map((p, i) => <PoinItem key={i} text={p} />)}
        </div>
      </div>

      {/* ════════ SECTION: VIDEO TUR RUMAH (YouTube / TikTok / Instagram Reels) ════════ */}
      {(tema.videos && tema.videos.length > 0) && (
        <div style={{ padding: "0 5% 56px", maxWidth: 1060, margin: "0 auto" }}>
          <div style={{ background: "rgba(255,255,255,.16)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderRadius: 16, padding: "22px 26px", marginBottom: 28, display: "inline-block", maxWidth: "100%", boxSizing: "border-box" }}>
            <SectionLabel icon="" text="VIDEO TUR RUMAH" color="#fff" />
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.7rem", fontWeight: 800, color: "#fff", margin: 0, textShadow: "0 2px 10px rgba(0,0,0,.55)" }}>Lihat Langsung {tema.nama}</h2>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 22 }}>
            {tema.videos.map((v, i) => {
              const url = typeof v === "string" ? v : v.url;
              const info = detectVideoEmbed(url);
              const basis = info?.vertical ? "300px" : "560px";
              return (
                <div key={i} style={{ flex: `0 1 ${basis}` }}>
                  <VideoEmbed url={url} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════ SECTION: DENAH RUANG ════════ */}
      <div style={{ background: "rgba(253,250,244,.94)", padding: "48px 5% 56px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <SectionLabel icon="" text="DENAH RUANG" />
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.7rem", fontWeight: 800, color: "#2E3D3F", margin: "0 0 12px" }}>Tata Ruang {tema.nama}</h2>
          <p style={{ color: "#5A6A6C", lineHeight: 1.7, maxWidth: 660, marginBottom: 28, fontSize: "0.88rem", whiteSpace: "pre-line" }}>{tema.detail.denah.desc}</p>

          {(tema.detail.denah.lantai || []).filter(l => l.imgs && l.imgs.length > 0).length > 0 ? (
            (tema.detail.denah.lantai || []).map((lantai, li) => (
              lantai.imgs && lantai.imgs.length > 0 && (
                <div key={li} style={{ marginBottom: 32 }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#2E3D3F", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 26, height: 26, borderRadius: "50%", background: tema.warna + "22", color: tema.warna, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }}></span>
                    {lantai.label}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: lantai.imgs.length === 1 ? "1fr" : "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
                    {lantai.imgs.map((img, ii) => (
                      <div key={ii} style={{ borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 28px rgba(0,0,0,.12)", border: "1px solid #F5EDD8" }}>
                        <img decoding="async" loading="lazy" src={cld(img)} alt={`${lantai.label} - foto ${ii + 1}`} style={{ width: "100%", height: "auto", display: "block", objectFit: "contain", background: "#fff" }} onError={onImgError} />
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))
          ) : (
            <div style={{ textAlign: "center", padding: "50px 20px", background: "#fff", borderRadius: 14, border: "1px solid #F5EDD8", color: "#A89070", fontSize: "0.85rem" }}>
              Foto denah belum tersedia untuk tema ini.
            </div>
          )}

          {/* Disclaimer */}
          <div style={{ marginTop: 24, display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 18px", background: "#fff", borderRadius: 10, border: "1px solid #E8DCC8" }}>
            <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: 1 }}></span>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "#7A8A8C", lineHeight: 1.65 }}>
              <strong style={{ color: "#5A6A6C", fontWeight: 700 }}>Disclaimer: </strong>
              Denah hanya ilustrasi dan bisa berubah sesuai permintaan customer.
            </p>
          </div>
        </div>
      </div>

      {/* ════════ SECTION: HARGA & RAB ════════ */}
      <div style={{ padding: "48px 5% 56px", maxWidth: 1060, margin: "0 auto" }}>
        <div style={{ background: "rgba(255,255,255,.16)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderRadius: 16, padding: "22px 26px", marginBottom: 28, display: "inline-block", maxWidth: "100%", boxSizing: "border-box" }}>
          <SectionLabel icon="" text="PAKET HARGA" color="#fff" />
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.7rem", fontWeight: 800, color: "#fff", margin: "0 0 12px", textShadow: "0 2px 10px rgba(0,0,0,.55)" }}>Harga & RAB {tema.nama}</h2>
          <p style={{ color: "#fff", lineHeight: 1.7, maxWidth: 580, margin: 0, fontSize: "0.88rem", textShadow: "0 1px 6px rgba(0,0,0,.55)" }}>Pilih paket yang sesuai kebutuhan dan budget Anda.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 18, marginBottom: 36 }}>
          {tema.detail.harga.paket.map((p, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 14, border: `2px solid ${i === 1 ? tema.warna : "#F5EDD8"}`, overflow: "hidden", boxShadow: i === 1 ? `0 8px 28px ${tema.warna}20` : "0 2px 10px rgba(0,0,0,.06)", transition: "all .25s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,.1)`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = i === 1 ? `0 8px 28px ${tema.warna}20` : "0 2px 10px rgba(0,0,0,.06)"; }}>
              {i === 1 && <div style={{ background: tema.warna, color: "#fff", fontSize: "0.62rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", textAlign: "center", padding: "5px" }}>PALING POPULER</div>}
              <div style={{ padding: "22px" }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: tema.warna, marginBottom: 7 }}>PAKET {i === 0 ? "STANDAR" : i === 1 ? "PREMIUM" : "LUXURY"}</div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.05rem", fontWeight: 800, color: "#2E3D3F", margin: "0 0 5px" }}>{p.nama}</h3>
                <div style={{ fontSize: "0.78rem", color: "#5A6A6C", marginBottom: 18 }}>Luas bangunan: {p.luas}</div>
                {p.harga === 0
                  ? <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.35rem", fontWeight: 900, color: "#2E3D3F", marginBottom: 14 }}>Hubungi Kami</div>
                  : <><div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.45rem", fontWeight: 900, color: tema.warna, lineHeight: 1 }}>Rp {p.harga.toLocaleString("id-ID")}</div>
                    <div style={{ fontSize: "0.72rem", color: "#5A6A6C", marginTop: 2, marginBottom: 14 }}>per meter persegi</div></>
                }
                <div style={{ borderTop: "1px solid #F5EDD8", paddingTop: 14, display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
                  {p.termasuk.map((item, j) => (
                    <div key={j} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                      <span style={{ color: tema.warna, fontWeight: 700, fontSize: "0.8rem", flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: "0.78rem", color: "#3D5254", lineHeight: 1.4 }}>{item}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => onWaOpen && onWaOpen()} style={{ width: "100%", padding: "10px", borderRadius: 7, border: "none", background: i === 1 ? tema.warna : "linear-gradient(90deg,#2E3D3F,#3D5254)", color: "#fff", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>
                  Konsultasi Paket Ini
                </button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: "#FDFAF4", borderRadius: 12, padding: "22px 26px", border: "1px solid #F5EDD8" }}>
          <div style={{ fontWeight: 800, color: "#2E3D3F", marginBottom: 12, fontSize: "0.9rem" }}>Catatan RAB & Harga</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {["Harga belum termasuk biaya IMB/PBG", "Harga belum termasuk biaya utilitas (air, listrik)", "Bahan material dapat diganti sesuai budget", "Harga valid per tahun berjalan, hubungi untuk update", "Pembayaran bertahap sesuai progress pekerjaan", "Garansi pekerjaan 6–12 bulan sesuai kontrak"].map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                <span style={{ color: "#C9AA71", fontWeight: 700 }}>·</span>
                <span style={{ fontSize: "0.78rem", color: "#5A6A6C", lineHeight: 1.5 }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════ SECTION: KALKULATOR (paling bawah, sebelum footer) ════════ */}
      <div style={{ background: "rgba(253,250,244,.94)", padding: "48px 5% 56px" }}>
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <div style={{ marginBottom: 28, textAlign: "center" }}>
            <SectionLabel icon="" text="ESTIMASI BIAYA" />
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.7rem", fontWeight: 800, color: "#2E3D3F", margin: "0 0 12px" }}>Kalkulator Lahan</h2>
            <p style={{ color: "#5A6A6C", lineHeight: 1.7, fontSize: "0.88rem" }}>Masukkan luas bangunan Anda untuk estimasi biaya paket {tema.nama}.</p>
          </div>
          <KalkulatorLuas tema={tema} />
          <div style={{ marginTop: 22, textAlign: "center" }}>
            <button onClick={() => onWaOpen && onWaOpen()} style={{ padding: "14px 32px", background: `linear-gradient(135deg,${tema.warna},#C9AA71)`, color: "#fff", border: "none", borderRadius: 8, fontWeight: 800, fontSize: "0.88rem", cursor: "pointer", letterSpacing: ".06em" }}>
              KONSULTASI GRATIS →
            </button>
            <p style={{ fontSize: "0.72rem", color: "#5A6A6C", marginTop: 10 }}>Gratis konsultasi · Respon cepat · Solusi tepat</p>
          </div>
        </div>
      </div>

        </div>
      </div>
      {/* ════════ /WRAPPER: BACKGROUND FOTO TEMA ════════ */}

      {/* Contoh postingan lebih lanjut — Instagram & YouTube */}
      <SocialProofCTA />

      {/* CTA Footer */}
      <div style={{ background: "linear-gradient(135deg,#1a2a2a 0%,#2E3D3F 60%)", padding: "46px 5%", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{ fontSize: "0.65rem", letterSpacing: ".15em", textTransform: "uppercase", color: tema.warna, fontWeight: 800, marginBottom: 8 }}>SIAP MEMULAI?</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.35rem,4vw,2.1rem)", fontWeight: 800, color: "#fff", margin: "0 0 14px", lineHeight: 1.25 }}>
          Wujudkan Rumah {tema.nama} Impian Anda
        </h2>
        <p style={{ color: "rgba(255,255,255,.6)", maxWidth: 480, lineHeight: 1.7, marginBottom: 26, fontSize: "0.88rem" }}>
          Konsultasikan kebutuhan desain rumah Anda dengan tim profesional kami. Gratis, cepat, dan tepat sasaran.
        </p>
        <button onClick={() => onWaOpen && onWaOpen()} style={{ padding: "15px 34px", background: tema.warna, color: "#fff", border: "none", borderRadius: 7, fontWeight: 800, fontSize: "0.9rem", cursor: "pointer", letterSpacing: ".08em", textTransform: "uppercase", boxShadow: `0 8px 22px ${tema.warna}44` }}>
          KONSULTASI GRATIS
        </button>
      </div>
    </div>
  );
}

/* ── Page: Tema Rumah (Landing + Sub-page router) ── */
function TemaRumahPage({ onWaOpen, temaSlug, openTemaDetail, closeTemaDetail, cmsData }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const cms = cmsData || {};

  /* Gunakan temaData dari CMS jika sudah di-load, fallback ke hardcoded.
     Tema yang di-set "Hide" disembunyikan dari halaman publik (data tetap tersimpan di CMS). */
  const activeTemaData = ((cms.temaData && cms.temaData.length > 0) ? cms.temaData : TEMA_DATA).filter(t => !t.hidden);

  /* Jika ada slug → tampilkan detail page (URL: /tema-rumah/{slug} — bisa di-share) */
  if (temaSlug) {
    return <TemaDetailPage slug={temaSlug} onWaOpen={onWaOpen} onBack={closeTemaDetail} temaList={activeTemaData} />;
  }

  /* Teks hero — CMS override atau fallback hardcoded */
  const heroLabel  = cms.temaHeroLabel     || "TEMA RUMAH";
  const heroTitle1 = cms.temaHeroTitle1    || "PILIH TEMA RUMAH";
  const heroTitle2 = cms.temaHeroTitle2    || "SESUAI KARAKTER ANDA";
  const heroDesc   = cms.temaHeroDesc      || "Berbagai pilihan tema rumah yang dirancang untuk mewujudkan hunian impian yang estetis, nyaman, dan fungsional.";
  const heroBtn    = cms.temaBtnKonsultasi || "KONSULTASI GRATIS";
  const heroImg    = cms.temaHeroImg       || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=85";
  const ctaTitle   = cms.temaCtaTitle      || "Wujudkan Rumah Impian Anda Bersama HIKIMORI CONST";
  const ctaDesc    = cms.temaCtaDesc       || "Konsultasikan kebutuhan desain rumah Anda dengan tim profesional kami.";

  /* Landing /tema-rumah */
  return (
    <div style={{ fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      <style>{`
        .tema-card-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid #F5EDD8;
          transition: box-shadow .25s;
        }
        .tema-card-grid:hover { box-shadow: 0 8px 28px rgba(0,0,0,.08); }
        .tema-card-img { overflow: hidden; min-height: 340px; position: relative; }
        .tema-card-img > div { width: 100%; height: 100%; min-height: 340px; }
        .tema-card-content { padding: 44px 46px; display: flex; flex-direction: column; justify-content: center; }
        .tema-cta-grid {
          background: linear-gradient(135deg,#1a2a2a 0%,#2E3D3F 52%,#3D5254 100%);
          padding: 54px 6%; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center;
        }
        .tema-cta-right { display: flex; flex-direction: column; align-items: flex-end; gap: 14px; }

        @media (max-width: 768px) {
          .tema-card-grid { grid-template-columns: 1fr !important; }
          .tema-card-img { min-height: 220px; order: -1 !important; }
          .tema-card-content { padding: 26px 20px; order: 1 !important; }
          .tema-cta-grid { grid-template-columns: 1fr !important; gap: 20px !important; padding: 36px 5% !important; }
          .tema-cta-right { align-items: stretch !important; }
          .tema-cta-right button { width: 100% !important; }
        }
      `}</style>
      {/* Hero */}
      <div style={{ position: "relative", minHeight: 460, overflow: "hidden", background: "#0f1f1f" }}>
        <img decoding="async" loading="lazy" src={cld(heroImg)} alt="Tema Rumah Hero"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.42 }}
          onError={onImgError} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(10,25,20,.93) 44%,rgba(10,25,20,.18) 100%)" }} />
        <div style={{ position: "relative", zIndex: 2, padding: "58px 6% 50px", maxWidth: 620 }}>
          <div style={{ fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#C9AA71", fontWeight: 800, marginBottom: 14 }}>{heroLabel}</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.9rem,5vw,3.2rem)", fontWeight: 900, color: "#fff", lineHeight: 1.1, margin: "0 0 6px" }}>{heroTitle1}</h1>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.9rem,5vw,3.2rem)", fontWeight: 900, color: "#C9AA71", lineHeight: 1.1, margin: "0 0 20px" }}>{heroTitle2}</h1>
          <p style={{ fontSize: "0.92rem", color: "rgba(255,255,255,.73)", lineHeight: 1.72, marginBottom: 30, maxWidth: 460 }}>
            {heroDesc}
          </p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={() => onWaOpen && onWaOpen()} style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 26px", background: "#C9AA71", color: "#fff", border: "none", borderRadius: 4, fontWeight: 800, fontSize: "0.78rem", cursor: "pointer", letterSpacing: ".1em", textTransform: "uppercase", boxShadow: "0 4px 18px rgba(201,170,113,.4)" }}>
              {heroBtn}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 40, height: 40, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,.45)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", color: "#fff" }}>▶</span>
              <div>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#fff", letterSpacing: ".06em" }}>LIHAT VIDEO</div>
                <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,.58)", letterSpacing: ".04em" }}>INSPIRASI TEMA RUMAH</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tema Cards -- alternating layout */}
      <div style={{ background: "#fff" }}>
        {activeTemaData.map((tema, idx) => {
          const isEven = idx % 2 === 0;
          const imgEl = (
            <div className="tema-card-img">
              <TemaPhotoSlideshow slug={tema.slug} nama={tema.nama} cmsData={cms} />
            </div>
          );
          const contentEl = (
            <div className="tema-card-content">
              <TemaCardContent tema={tema} setTemaSlug={openTemaDetail} />
            </div>
          );
          return (
            <div key={tema.id} className="tema-card-grid" style={{ background: idx % 2 === 1 ? "#FDFAF4" : "#fff" }}>
              {isEven ? <>{imgEl}{contentEl}</> : <>{contentEl}{imgEl}</>}
            </div>
          );
        })}
      </div>

      {/* CTA Section */}
      <div className="tema-cta-grid">
        <div>
          <div style={{ fontSize: "0.65rem", letterSpacing: ".18em", textTransform: "uppercase", color: "#C9AA71", fontWeight: 800, marginBottom: 12 }}>SIAP MEMULAI?</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.35rem,3.5vw,2rem)", fontWeight: 800, color: "#fff", margin: "0 0 14px", lineHeight: 1.25 }}>
            {ctaTitle.includes("\n") ? ctaTitle.split("\n").map((line, i, arr) => <span key={i}>{line}{i < arr.length-1 && <br />}</span>) : ctaTitle}
          </h2>
          <p style={{ fontSize: "0.84rem", color: "rgba(255,255,255,.6)", lineHeight: 1.7 }}>{ctaDesc}</p>
        </div>
        <div className="tema-cta-right">
          <button onClick={() => onWaOpen && onWaOpen()} style={{ padding: "15px 34px", background: "#C9AA71", color: "#fff", border: "none", borderRadius: 4, fontWeight: 800, fontSize: "0.84rem", cursor: "pointer", letterSpacing: ".1em", textTransform: "uppercase", boxShadow: "0 8px 22px rgba(201,170,113,.32)" }}>
            {heroBtn}
          </button>
          <div style={{ display: "flex", gap: 20 }}>
            {["Gratis Konsultasi", "Respon Cepat", "Solusi Tepat"].map((t, i) => (
              <span key={i} style={{ fontSize: "0.74rem", color: "rgba(255,255,255,.62)", fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { KalkulatorLuas, TemaCardContent, TemaDetailPage, TemaRumahPage };
