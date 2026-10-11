/* ══════════════════════════════════════════════════════════════════════════
   CORE — komponen, util, konstanta & data yang dipakai bersama oleh halaman.
   Dipisah dari RealEstateWeb.jsx saat bundle dipecah per halaman; isinya tidak diubah,
   hanya dipindahkan. Halaman di src/pages/* dan aplikasi utama mengimpor dari sini.
   ══════════════════════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import DOMPurify from "dompurify";
import { shouldUseLiteMode, isFinePointer, cld } from "../lib/net.js";
import { CLOUDINARY_CONFIG, EMAILJS_CONFIG, isEmailJsReady } from "../config/infra.js";

/* ── Auto-grow helper: textarea otomatis memanjang sesuai isi teks, tanpa terpotong/scroll ── */
function autoGrowTextarea(el) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

function CardImg({ src, alt, style, onError, className }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setLoaded(false); }, [src]);
  const mergedTransition = style?.transition ? `${style.transition}, opacity .4s ease` : "opacity .4s ease";
  return (
    <>
      {!loaded && <div className="img-skeleton" />}
      <img decoding="async" src={cld(src)} alt={alt} loading="lazy" className={className}
        style={{ ...style, opacity: loaded ? 1 : 0, transition: mergedTransition }}
        onLoad={() => setLoaded(true)}
        onError={e => { setLoaded(true); onError && onError(e); }} />
    </>
  );
}

function AutoGrowField({ style, className = "", multiline = false, onFocus, onBlur, onKeyDown, ...rest }) {
  const handleFocus = (e) => { autoGrowTextarea(e.target); onFocus && onFocus(e); };
  const handleBlur = (e) => { e.target.style.height = ""; onBlur && onBlur(e); };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !multiline) { e.preventDefault(); e.target.blur(); }
    onKeyDown && onKeyDown(e);
  };
  return (
    <textarea
      rows={1}
      className={`agf-field ${className}`}
      style={style}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onInput={e => autoGrowTextarea(e.target)}
      onKeyDown={handleKeyDown}
      {...rest}
    />
  );
}

/* ─────────────── CONSTANTS ─────────────── */
const ROLES = {
  admin: { label: "Administrator", color: "#e74c3c" },
  content_writer: { label: "Content Writer", color: "#3498db" },
  customer_services: { label: "Customer Services", color: "#27ae60" },
};

const HARDCODED_USERS = [
  { username: "Administrator", password: "Admin123",  role: "admin",             name: "Administrator", phone: "", email: "mahfudfebrys@gmail.com", desc: "", photo: "" },
  { username: "writer1",       password: "writer123", role: "content_writer",    name: "Writer 1",      phone: "", email: "", desc: "", photo: "" },
  { username: "cs1",           password: "cs123",     role: "customer_services", name: "CS 1",          phone: "", email: "", desc: "", photo: "" },
];

/* ─── Firebase ───
   Konfigurasi, inisialisasi, dan helper Firestore (fsGet / fsGetWithRetry / fsSet) kini ada di
   src/lib/firebase.js dan dimuat TERTUNDA lewat dynamic import, supaya SDK Firebase (±96 KB gzip)
   tidak lagi menghalangi render pertama. Identifier project ada di src/config/infra.js. */

/* ─── Cloudinary Config ─── */
const CLOUDINARY = CLOUDINARY_CONFIG;

async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY.uploadPreset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`, {
    method: "POST", body: fd,
  });
  if (!res.ok) {
    /* Penyebab paling sering: upload preset unsigned belum dibuat di akun Cloudinary. */
    let detail = "";
    try { detail = (await res.json())?.error?.message || ""; } catch { /* abaikan */ }
    throw new Error(
      `Upload gagal${detail ? ` (${detail})` : ""}. Pastikan upload preset "${CLOUDINARY.uploadPreset}" ` +
      `sudah dibuat sebagai Unsigned di akun Cloudinary "${CLOUDINARY.cloudName}".`
    );
  }
  const data = await res.json();
  return data.secure_url;
}

/* ─────────────── CAPTION/LABEL FOTO PUBLIK — DINONAKTIFKAN PERMANEN ───────────────
   Sesuai permintaan: TIDAK ADA caption/label/nama file apa pun yang boleh
   tampil di atas gambar publik (slideshow, galeri, dsb) — hanya gambar saja.
   Fungsi ini sengaja selalu mengembalikan string kosong apa pun inputnya,
   supaya seluruh pemanggil publicCaption() di kode (yang jumlahnya banyak)
   tidak perlu diubah satu-satu, tapi outputnya tetap tidak pernah tampil. */
function publicCaption(_label) {
  return "";
}

/* ─────────────── VIDEO EMBED UNIVERSAL (YouTube / TikTok / Instagram Reels) ───────────────
   Deteksi otomatis platform + orientasi dari sebuah link video, lalu kembalikan info
   embed-nya. Dipakai di halaman Detail Tema Rumah & panel admin (form edit tema),
   supaya video bisa diputar LANGSUNG di web tanpa pindah tab.
   - YouTube biasa (watch?v=... / youtu.be/...)  → embed landscape 16:9
   - YouTube Shorts (youtube.com/shorts/...)     → embed vertical 9:16
   - TikTok (tiktok.com/@user/video/ID)          → embed vertical 9:16
   - Instagram Reels/Post (instagram.com/reel/..)→ embed vertical (butuh sedikit lebih tinggi
                                                     karena ada header/caption bawaan Instagram)
*/
function detectVideoEmbed(url) {
  if (!url || typeof url !== "string") return null;
  const u = url.trim();

  // YouTube Shorts
  let m = u.match(/youtube\.com\/shorts\/([\w-]{6,})/i);
  if (m) return { platform: "youtube", id: m[1], embedUrl: `https://www.youtube.com/embed/${m[1]}?autoplay=1`, vertical: true };

  // YouTube biasa (watch?v=, youtu.be/, embed/)
  m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/i);
  if (m) return { platform: "youtube", id: m[1], embedUrl: `https://www.youtube.com/embed/${m[1]}?autoplay=1`, vertical: false };

  // TikTok
  m = u.match(/tiktok\.com\/[^/]+\/video\/(\d+)/i);
  if (m) return { platform: "tiktok", id: m[1], embedUrl: `https://www.tiktok.com/embed/v2/${m[1]}?autoplay=1`, vertical: true };

  // Instagram Reels / Post
  m = u.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/i);
  if (m) return { platform: "instagram", id: m[1], embedUrl: `https://www.instagram.com/reel/${m[1]}/embed`, vertical: true, extraTall: true };

  return null;
}

/** Ikon & warna brand per platform — dipakai di facade sebelum video diputar */
const VIDEO_PLATFORM_META = {
  youtube:   { icon: "▶", label: "YouTube",   color: "#FF0000" },
  tiktok:    { icon: "", label: "TikTok",    color: "#000000" },
  instagram: { icon: "", label: "Instagram", color: "#C13584" },
};

/** Komponen player video universal dengan FACADE — tinggal kasih link mentahnya.
    Video TIDAK langsung dimuat (iframe berat, apalagi kalau ada beberapa sekaligus
    di 1 halaman). Yang tampil awal cuma thumbnail/preview + tombol play; iframe
    asli baru dibuat begitu pengunjung klik, jadi halaman tetap ringan & cepat. */
function VideoEmbed({ url, style }) {
  const info = detectVideoEmbed(url);
  const [playing, setPlaying] = useState(false);

  if (!info) {
    return (
      <div style={{ padding: "28px 16px", textAlign: "center", background: "#FDFAF4", borderRadius: 14, border: "1px solid #F5EDD8", color: "#A89070", fontSize: "0.8rem", ...style }}>
        Link video tidak dikenali. Gunakan link YouTube, TikTok, atau Instagram Reels yang valid.
      </div>
    );
  }

  const aspect = info.vertical ? (info.extraTall ? "9 / 18" : "9 / 16") : "16 / 9";
  const maxWidth = info.vertical ? 340 : "100%";
  const meta = VIDEO_PLATFORM_META[info.platform];

  if (playing) {
    return (
      <div style={{ width: "100%", maxWidth, margin: "0 auto", aspectRatio: aspect, borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 28px rgba(0,0,0,.2)", background: "#000", ...style }}>
        <iframe
          src={info.embedUrl}
          title={`video-${info.platform}`}
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  /* ── FACADE: belum diputar → tampilkan thumbnail (YouTube) atau placeholder brand (TikTok/IG) + tombol play ── */
  return (
    <div onClick={() => setPlaying(true)} role="button" aria-label={`Putar video ${meta.label}`}
      style={{ width: "100%", maxWidth, margin: "0 auto", aspectRatio: aspect, borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 28px rgba(0,0,0,.2)", background: "#111", position: "relative", cursor: "pointer", ...style }}>
      {info.platform === "youtube" ? (
        <img decoding="async" src={`https://img.youtube.com/vi/${info.id}/hqdefault.jpg`} alt={`Thumbnail ${meta.label}`} loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={onImgError} />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg,${meta.color},#2a2a2a)`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: "2.2rem" }}>{meta.icon}</span>
          <span style={{ color: "#fff", fontSize: "0.75rem", fontWeight: 700, letterSpacing: ".04em" }}>Tonton di {meta.label}</span>
        </div>
      )}
      {/* Overlay gelap tipis supaya tombol play kontras di atas thumbnail apa pun */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.18)" }} />
      {/* Tombol play */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 62, height: 62, borderRadius: "50%", background: "rgba(255,255,255,.94)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0,0,0,.4)", transition: "transform .18s" }}
        onMouseEnter={e => e.currentTarget.style.transform = "translate(-50%,-50%) scale(1.08)"}
        onMouseLeave={e => e.currentTarget.style.transform = "translate(-50%,-50%) scale(1)"}>
        <span style={{ fontSize: "1.4rem", color: "#1a1a1a", marginLeft: 4 }}>▶</span>
      </div>
    </div>
  );
}

/* ─────────────── "CONTOH POSTINGAN LEBIH LANJUT" — tombol IG & YouTube ───────────────
   Dipasang tepat sebelum CTA/footer di halaman Tema Rumah, Interior, dan Eksterior.
   Cuma 1 komponen ini yang perlu di-update kalau nanti link sosmed berubah. */
function SocialProofCTA() {
  return (
    <div style={{ textAlign: "center", padding: "8px 16px 36px" }}>
      <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "#8B9A9C", marginBottom: 16 }}>
        Contoh Postingan Lebih Lanjut
      </div>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
        <a href="https://www.instagram.com/hikimori_const" target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "13px 30px", borderRadius: 8, background: "linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)", color: "#fff", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none", minWidth: 160, boxShadow: "0 4px 16px rgba(238,42,123,.32)", transition: "transform .18s" }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" rx="6" stroke="#fff" strokeWidth="2"/>
            <circle cx="12" cy="12" r="4.2" stroke="#fff" strokeWidth="2"/>
            <circle cx="17.4" cy="6.6" r="1.3" fill="#fff"/>
          </svg>
          Instagram
        </a>
        <a href="https://youtube.com/@hikimoriconst" target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "13px 30px", borderRadius: 8, background: "#FF0000", color: "#fff", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none", minWidth: 160, boxShadow: "0 4px 16px rgba(255,0,0,.32)", transition: "transform .18s" }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8z" fill="#fff"/>
            <path d="M9.6 15.6 15.8 12 9.6 8.4v7.2z" fill="#FF0000"/>
          </svg>
          YouTube
        </a>
      </div>
    </div>
  );
}

/* ─────────────── FORMAT RUPIAH GLOBAL ─────────────── */
/**
 * Format angka menjadi string Rupiah: 500000 → "Rp 500.000"
 * Jika sudah mengandung "Rp" atau "Hubungi", kembalikan apa adanya.
 */
function formatRp(val) {
  if (!val && val !== 0) return "";
  const str = String(val);
  if (str.toLowerCase().includes("hubungi") || str.toLowerCase().includes("nego")) return str;
  if (str.startsWith("Rp") || str.startsWith("rp")) return str; // sudah diformat
  const num = Number(str.replace(/[^0-9]/g, ""));
  if (isNaN(num) || num === 0) return str;
  return "Rp " + num.toLocaleString("id-ID");
}

/* ─────────────── SHARED UPLOAD HELPERS ─────────────── */
/**
 * Upload satu file ke Cloudinary dengan progress nyata via XHR.
 * @param {File} file
 * @param {(pct: number) => void} onProgress  — dipanggil 0–100
 * @returns {Promise<string>} secure_url
 */
function uploadWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", CLOUDINARY.uploadPreset);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`);
    xhr.upload.addEventListener("progress", e => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText).secure_url); }
        catch { reject(new Error("Parse error")); }
      } else { reject(new Error("Upload gagal")); }
    });
    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.send(fd);
  });
}

/**
 * GalleryImageTile — thumbnail gambar galeri dengan tombol URL & Upload + progress bar inline.
 */
function GalleryImageTile({ src, onUrlEdit, onUploaded, onError }) {
  const [item, setItem] = useState(null); // {name, pct, done, error} | null
  const inputRef = useRef();

  const handleChange = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setItem({ name: file.name, pct: 0, done: false, error: false });
    try {
      const url = await uploadWithProgress(file, pct => setItem(p => ({ ...p, pct })));
      setItem({ name: file.name, pct: 100, done: true, error: false });
      if (onUploaded) onUploaded(url);
      setTimeout(() => { setItem(null); if (inputRef.current) inputRef.current.value = ""; }, 2200);
    } catch {
      setItem(p => ({ ...p, error: true }));
      if (onError) onError();
      setTimeout(() => { setItem(null); if (inputRef.current) inputRef.current.value = ""; }, 2200);
    }
  };

  const isUploading = item && !item.done && !item.error;

  return (
    <div style={{ width: 140 }}>
      <div style={{ position: "relative" }}>
        <img decoding="async" loading="lazy" src={cld(src)} alt="" style={{ width: 140, height: 95, objectFit: "cover", borderRadius: 6, display: "block",
          opacity: isUploading ? 0.5 : 1, transition: "opacity .2s" }} />
        {isUploading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(139,105,20,.12)", borderRadius: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#8B6914" }}>{item.pct}%</span>
          </div>
        )}
      </div>
      {/* Progress bar -- muncul saat upload */}
      {item && (
        <div style={{ marginTop: 4 }}>
          <div style={{ height: 5, background: "#E8DCC8", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 3, transition: "width .2s ease",
              width: `${item.pct}%`,
              background: item.error ? "#e74c3c" : item.done ? "#27ae60" : "linear-gradient(90deg,#8B6914,#E8C96A)"
            }} />
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: item.error ? "#e74c3c" : item.done ? "#27ae60" : "#8B6914",
            textAlign: "right", marginTop: 2 }}>
            {item.error ? "Gagal" : item.done ? "Selesai" : `${item.pct}%`}
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 3, marginTop: 5 }}>
        <button onClick={onUrlEdit} style={{
          flex: 1, background: "#FAF7F0", color: "#C9AA71",
          border: "1px solid #D4C4A0", borderRadius: 4, padding: "4px 0", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>URL</button>
        <label style={{
          flex: 1, background: isUploading ? "#e0f7ff" : "#eeffee",
          color: isUploading ? "#5A6A6C" : "#27ae60",
          border: "1px solid #D4C4A0", borderRadius: 4, padding: "4px 0", fontSize: 10, fontWeight: 600,
          cursor: isUploading ? "not-allowed" : "pointer", textAlign: "center", display: "block",
          pointerEvents: isUploading ? "none" : "auto" }}>
          {isUploading ? "..." : "⬆ Upload"}
          <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleChange} disabled={isUploading} />
        </label>
      </div>
    </div>
  );
}

function UploadButton({ accept = "image/*", multiple = false, label = "Upload Gambar", onDone, onError, style: styleProp = {}, dropZone = false }) {
  const [items, setItems] = useState([]); // [{name, pct, done, error}]
  const inputRef = useRef();
  const isUploading = items.some(it => !it.done && !it.error);

  const handleFiles = async (files) => {
    if (!files.length) return;
    const init = files.map(f => ({ name: f.name, pct: 0, done: false, error: false }));
    setItems(init);
    const results = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadWithProgress(files[i], pct => {
          setItems(prev => prev.map((it, idx) => idx === i ? { ...it, pct } : it));
        });
        setItems(prev => prev.map((it, idx) => idx === i ? { ...it, pct: 100, done: true } : it));
        results.push({ url, error: false });
      } catch {
        setItems(prev => prev.map((it, idx) => idx === i ? { ...it, error: true } : it));
        results.push({ url: null, error: true });
      }
    }
    const urls = results.filter(r => r.url).map(r => r.url);
    const errCount = results.filter(r => r.error).length;
    if (urls.length && onDone) onDone(urls);
    if (errCount && onError) onError(`${errCount} file gagal diupload.`);
    setTimeout(() => { setItems([]); if (inputRef.current) inputRef.current.value = ""; }, 2500);
  };

  const onChange = (e) => handleFiles(Array.from(e.target.files || []));

  const progressArea = items.length > 0 && (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((it, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: it.error ? "#e74c3c" : "#2E3D3F", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {it.error ? "" : it.done ? "" : ""}{it.name}
            </span>
            <span style={{ fontSize: 11, fontWeight: 800, color: it.error ? "#e74c3c" : it.done ? "#27ae60" : "#8B6914" }}>
              {it.error ? "Gagal" : it.done ? "Selesai" : `${it.pct}%`}
            </span>
          </div>
          <div style={{ height: 6, background: "#E8DCC8", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 3,
              width: `${it.pct}%`,
              background: it.error ? "#e74c3c" : it.done ? "#27ae60" : "linear-gradient(90deg,#8B6914,#E8C96A)",
              transition: "width .2s ease"
            }} />
          </div>
        </div>
      ))}
    </div>
  );

  if (dropZone) return (
    <div>
      <label style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 8, padding: "22px 16px", border: "2px dashed #C9AA71", borderRadius: 10,
        background: isUploading ? "#e0f7ff" : "#f0fafe", cursor: isUploading ? "not-allowed" : "pointer",
        transition: "background .15s", pointerEvents: isUploading ? "none" : "auto",
        ...styleProp
      }}
        onMouseEnter={e => { if (!isUploading) e.currentTarget.style.background = "#daf4fb"; }}
        onMouseLeave={e => { if (!isUploading) e.currentTarget.style.background = "#f0fafe"; }}>
        <span style={{ fontSize: 28 }}>{isUploading ? "" : ""}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#8B6914" }}>{isUploading ? "Sedang mengupload..." : label}</span>
        <span style={{ fontSize: 11, color: "#5A6A6C" }}>JPG, PNG, WEBP</span>
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} onChange={onChange} style={{ display: "none" }} disabled={isUploading} />
      </label>
      {progressArea}
    </div>
  );

  return (
    <div>
      <label style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: "9px 14px", border: "1.5px dashed #C9AA71", borderRadius: 8,
        background: isUploading ? "#e0f7ff" : "#FAF7F0", cursor: isUploading ? "not-allowed" : "pointer",
        fontSize: 12, fontWeight: 600, color: isUploading ? "#5A6A6C" : "#C9AA71",
        pointerEvents: isUploading ? "none" : "auto",
        ...styleProp
      }}>
        {isUploading ? "Mengupload..." : label}
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} onChange={onChange} style={{ display: "none" }} disabled={isUploading} />
      </label>
      {progressArea}
    </div>
  );
}

/* ─── EmailJS Config ─── */
const EJS = EMAILJS_CONFIG;

/* Generate 6-digit OTP */
const genOTP = () => String(Math.floor(100000 + Math.random() * 900000));

/* Send OTP via EmailJS REST (no SDK needed) */
async function sendOTPEmail(toEmail, passcode) {
  /* Kredensial EmailJS sengaja dikosongkan (lihat src/config/infra.js). Beri pesan yang jelas
     daripada melempar error mentah dari server EmailJS yang membingungkan admin. */
  if (!isEmailJsReady()) {
    throw new Error(
      "Pengiriman OTP lewat email belum aktif — kredensial EmailJS belum diisi. " +
      "Isi VITE_EMAILJS_PUBLIC_KEY, VITE_EMAILJS_SERVICE_ID, dan VITE_EMAILJS_TEMPLATE_ID di Vercel, " +
      "lalu deploy ulang. Sementara itu gunakan login username + password."
    );
  }
  const expireTime = new Date(Date.now() + 15 * 60 * 1000)
    .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id:  EJS.serviceId,
      template_id: EJS.templateId,
      user_id:     EJS.publicKey,
      template_params: {
        email:    toEmail,
        passcode,
        time:     expireTime,
      },
    }),
  });
  if (!res.ok) throw new Error(await res.text());
}

const SECTIONS = ["news", "shop", "destinations"];

const SECTION_LABELS = {
  news: "Program Affiliate",
  shop: "Gedung & Rumah",
  destinations: "Interior",
};

const DEFAULT_POSTS = {
  news: [
    {
      id: 1, section: "news", status: "published",
      title: "Spa & Wellness di Ubud: Surga Tersembunyi Bali",
      date: "2026-04-03", author: "writer1", category: "Lifestyle",
      coverImage: "",
      excerpt: "Rasakan ketenangan sejati di resort spa premium Ubud yang menyatu dengan alam Bali.",
      content: [
        { type: "paragraph", value: "Ubud, jantung seni dan budaya Bali, telah lama menjadi surga bagi mereka yang mencari kedamaian jiwa dan raga. Dikelilingi hamparan sawah terasering hijau dan hutan tropis yang rindang, Ubud menawarkan pengalaman spa yang benar-benar menyatu dengan alam." },
        { type: "paragraph", value: "Dari pijat batu vulkanik khas Bali hingga ritual penyembuhan tradisional Melukat, setiap treatment dirancang untuk memulihkan tubuh dan menenangkan pikiran setelah perjalanan panjang." },
        { type: "image", value: "", caption: "Ritual penyembuhan tradisional Bali di Ubud" },
        { type: "paragraph", value: "Nikmati sesi yoga di tepi sawah saat fajar, atau manjakan diri dengan lulur beras Bali yang legendaris. Ubud adalah pengalaman yang tidak akan terlupakan." },
      ],
      tags: ["spa", "bali", "wellness", "ubud"],
    },
    {
      id: 2, section: "news", status: "published",
      title: "Pantai Tersembunyi di Raja Ampat yang Memukau",
      date: "2026-04-10", author: "writer1", category: "Beach",
      coverImage: "",
      excerpt: "Jelajahi pantai-pantai tersembunyi Raja Ampat dengan air sejernih kristal dan terumbu karang yang menakjubkan.",
      content: [
        { type: "paragraph", value: "Raja Ampat, permata tersembunyi di ujung timur Indonesia, menyimpan ribuan pulau kecil dengan pantai berpasir putih yang belum banyak terjamah. Perjalanan menuju pantai-pantai ini memang membutuhkan usaha ekstra, namun hasilnya sebanding dengan setiap tetes keringat." },
        { type: "paragraph", value: "Di bawah permukaan laut Raja Ampat, dunia yang sama mengagumkannya menanti. Keanekaragaman hayati laut di sini adalah yang tertinggi di dunia — ribuan spesies ikan, pari manta, dan terumbu karang warna-warni." },
        { type: "image", value: "", caption: "Gugusan pulau Raja Ampat dari ketinggian" },
      ],
      tags: ["raja ampat", "pantai", "diving", "papua"],
    },
    {
      id: 3, section: "news", status: "published",
      title: "Kenangan Tak Terlupakan Bersama HIKIMORI CONST",
      date: "2026-04-15", author: "writer1", category: "Experience",
      coverImage: "",
      excerpt: "Setiap perjalanan bersama Hikimori Const adalah cerita yang akan selalu dikenang.",
      content: [
        { type: "paragraph", value: "Perjalanan bukan sekadar soal destinasi — melainkan tentang momen yang membuat hati terasa penuh. Saat matahari terbenam di Pura Tanah Lot, saat pertama kali menginjakkan kaki di hamparan sawah Tegalalang, atau saat tawa riang di tengah petualangan bersama orang-orang tersayang." },
        { type: "paragraph", value: "Bersama HIKIMORI CONST, setiap detail perjalanan Anda direncanakan dengan penuh perhatian. Kami percaya bahwa kenangan terbaik lahir dari pengalaman yang dirancang dengan hati." },
      ],
      tags: ["kenangan", "hikimori-const", "wisata", "bali"],
    },
  ],
  shop: [
    {
      id: 10, section: "shop", status: "published",
      title: "Paket Perlengkapan Wisata Nusantara — Seri Explorer",
      date: "2026-03-20", author: "writer1", category: "Perlengkapan",
      coverImage: "",
      excerpt: "Perlengkapan wisata terbaik untuk menjelajahi keindahan nusantara dari Bromo hingga Raja Ampat.",
      badge: "Terlaris",
      content: [
        { type: "paragraph", value: "Dirancang khusus untuk petualang nusantara, paket perlengkapan Seri Explorer menghadirkan kenyamanan dan ketahanan dalam satu bundel praktis. Cocok untuk perjalanan ke pegunungan Bromo, pantai Raja Ampat, maupun hutan Kalimantan." },
        { type: "paragraph", value: "Isi paket: tas ransel 40L waterproof, poncho hujan, sandal gunung, serta peta destinasi unggulan Indonesia. Semua dikemas dalam satu tas yang ringkas dan stylish." },
      ],
      tags: ["perlengkapan", "wisata", "nusantara", "hiking"],
    },
    {
      id: 11, section: "shop", status: "published",
      title: "Kamera Dokumentasi Perjalanan — Edisi Nusantara",
      date: "2026-03-25", author: "writer1", category: "Fotografi",
      coverImage: "",
      excerpt: "Abadikan setiap momen perjalanan Anda dengan sempurna, dari puncak Rinjani hingga kedalaman laut Bunaken.",
      content: [
        { type: "paragraph", value: "Setiap sudut Indonesia layak diabadikan — dari kemegahan Candi Borobudur yang misterius hingga kecantikan bawah laut Bunaken yang tiada duanya. Dengan kamera yang tepat, setiap momen menjadi karya yang bisa dinikmati selamanya." },
      ],
      tags: ["fotografi", "kamera", "wisata", "nusantara"],
    },
  ],
  destinations: [
    {
      id: 20, section: "destinations", status: "published",
      title: "Taman Nasional Komodo — Warisan Dunia Indonesia",
      date: "2026-02-10", author: "writer1", category: "Alam",
      coverImage: "",
      excerpt: "Rumah bagi komodo legendaris dan surga diving kelas dunia di jantung Nusa Tenggara Timur.",
      content: [
        { type: "paragraph", value: "Taman Nasional Komodo adalah salah satu destinasi paling dramatis di Indonesia. Lanskap vulkanik yang kasar menjadi rumah bagi kadal terbesar di dunia — Komodo (Varanus komodoensis) — yang hanya bisa ditemukan di sini." },
        { type: "paragraph", value: "Di bawah permukaannya, perairan Komodo tak kalah spektakuler. Para penyelam akan bertemu manta raya raksasa, hiu, dan taman karang warna-warni yang menjadi salah satu terbaik di dunia." },
        { type: "image", value: "", caption: "Pink Beach Komodo yang ikonik" },
        { type: "paragraph", value: "Waktu terbaik berkunjung: April–Desember saat laut tenang. Paket liveaboard diving sangat direkomendasikan untuk pengalaman penuh." },
      ],
      tags: ["komodo", "ntt", "diving", "alam"],
    },
    {
      id: 21, section: "destinations", status: "published",
      title: "Gunung Bromo — Negeri di Atas Awan Jawa Timur",
      date: "2026-02-20", author: "writer1", category: "Alam",
      coverImage: "",
      excerpt: "Saksikan keajaiban matahari terbit di Gunung Bromo — pengalaman paling ikonik di Jawa Timur.",
      content: [
        { type: "paragraph", value: "Tidak ada banyak pemandangan yang bisa menandingi keindahan matahari terbit di Gunung Bromo. Lautan pasir seluas 5.250 hektare, kepulan asap kawah, dan siluet Semeru di kejauhan menciptakan panorama yang terasa seperti dari planet lain." },
        { type: "paragraph", value: "Taman Nasional Bromo Tengger Semeru menawarkan berbagai aktivitas: jeep tour melintasi lautan pasir, trekking ke bibir kawah, hingga menyaksikan upacara Yadnya Kasada yang sakral dari suku Tengger." },
      ],
      tags: ["bromo", "jawa timur", "gunung", "alam"],
    },
  ],
};

/* Rebrand data tersimpan: Firestore/localStorage lama masih berisi nama perusahaan sebelumnya.
   Semua string TEKS ditulis ulang saat dimuat; URL aset tidak disentuh, kecuali logo lama
   (dikosongkan agar logo Hikimori Const bawaan dipakai) dan handle sosial media lama. */
const LEGACY_BRAND_RE = /vastura(?:\s+|_)?(?:group|grup)?/gi;

function rebrandString(str) {
  if (typeof str !== "string" || !/vastura/i.test(str)) return str;
  if (/^(https?:|data:|blob:|\/)/i.test(str)) {
    if (/Vastura_Origin/i.test(str)) return "";
    return str
      .replace(/instagram\.com\/vastura_group/gi, "instagram.com/hikimori_const")
      .replace(/facebook\.com\/vastura_group/gi, "facebook.com/hikimori.const")
      .replace(/youtube\.com\/@vasturagroup[^\s"']*/gi, "youtube.com/@hikimoriconst");
  }
  return str
    .replace(/[a-z0-9._-]+@vastura[a-z.]*/gi, (m) => m.replace(/@.*/, "@hikimoriconst.com"))
    .replace(/vastura\.(com|co\.id)/gi, "hikimoriconst.com")
    .replace(LEGACY_BRAND_RE, (m) => {
      const lines = /\n/.test(m);
      const upper = m === m.toUpperCase();
      const out = lines ? "HIKIMORI\nCONST" : "HIKIMORI CONST";
      return upper ? out : out.split(/(\s)/).map(w => w.charAt(0) + w.slice(1).toLowerCase()).join("");
    });
}

function rebrandDeep(v) {
  if (typeof v === "string") return rebrandString(v);
  if (Array.isArray(v)) return v.map(rebrandDeep);
  if (v && typeof v === "object") {
    const o = {};
    for (const k of Object.keys(v)) o[k] = rebrandDeep(v[k]);
    return o;
  }
  return v;
}

/* Migrasi teks lama -> teks baru untuk data yang SUDAH tersimpan di Firestore/localStorage.
   Nilai tersimpan selalu menang atas DEFAULT_DATA, jadi tanpa ini teks lama tetap tampil di
   web live. Hanya diganti bila nilainya PERSIS sama dengan teks lama — kalau admin sudah
   mengubahnya sendiri lewat Control Panel, nilainya tidak disentuh. */
const LEGACY_TEXT_MIGRATIONS = {
  aboutTeamLabel: { from: "Orang-Orang di Balik Layanan", to: "" },
  aboutTeamTitle: { from: "Susunan Tim Kami", to: "Hikimori Const INDONESIA" },
};

const DEFAULT_DATA = {
  images: {
    hero: [
      "",
      "",
      "",
      "",
    ],
    adv: [
      "",
      "",
    ],
    gal: [
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    running: [],
  },
  content: {
    heroTitle: "Developer Perumahan & Jasa Desain",
    heroSub: "Kami hadir sebagai mitra terpercaya untuk mewujudkan hunian impian Anda — desain, RAB, interior, hingga landscape. Profesional, berkualitas, dan tepat waktu.",
    advTitle: "Wujudkan Hunian Impian Anda",
    advSub: "DEVELOPER & JASA PERUMAHAN",
    advQuote: '"We shape our buildings; thereafter they shape us." — Winston Churchill',
    newAdvTitle: "Proyek Terbaru Kami",
    newAdvSub: "Temukan portofolio terkini — hunian berkualitas yang telah kami bangun dan rancang bersama klien.",
    bookTitle: "Konsultasikan Proyek Anda",
    bookSub: "Tim ahli kami siap membantu dari perencanaan hingga serah terima kunci — gratis konsultasi pertama.",
    newsletterTitle: "Dapatkan Update Proyek & Promo Terbaru",
    foundingYear: "2026",
    aboutText: "HIKIMORI CONST adalah developer perumahan dan penyedia jasa desain terpercaya sejak 2026. Kami membangun hunian impian dengan standar kualitas tinggi dan harga transparan.",
    contactText: "Hubungi kami untuk konsultasi gratis. Tim HIKIMORI CONST siap membantu mewujudkan hunian impian Anda — dari desain, RAB, interior, pagar, kanopi, hingga landscape.",
    aboutHeroLabel: "About Us",
    aboutHeroTitle: "Membangun Hunian, Mewujudkan Impian",
    aboutHeroSub: "HIKIMORI CONST adalah developer perumahan dan jasa desain terpercaya. Kami berkomitmen menghadirkan hunian berkualitas dengan layanan lengkap dari desain hingga finishing.",
    aboutWhyTitle: "Why Choose Us",
    aboutWhyLabel: "Keunggulan Kami",
    aboutVisiText: "Menjadi perusahaan developer perumahan dan jasa desain terkemuka di Indonesia yang dikenal atas pelayanan profesional, kualitas konstruksi, dan kemampuan mewujudkan hunian impian bagi setiap klien.",
    aboutTeamLabel: "",
    aboutTeamTitle: "Hikimori Const INDONESIA",
    aboutLayananLabel: "LAYANAN KAMI",
    aboutLayananTitle: "Layanan Terbaik Untuk Anda",
    aboutV1Icon: "", aboutV1Title: "Desain Profesional", aboutV1Desc: "Tim arsitek & desainer interior berpengalaman untuk setiap proyek.",
    aboutV2Icon: "",  aboutV2Title: "Terpercaya & Legal", aboutV2Desc: "Semua proyek dilaksanakan sesuai perizinan dan standar konstruksi yang berlaku.",
    aboutV3Icon: "", aboutV3Title: "Tepat Waktu",        aboutV3Desc: "Komitmen penyelesaian proyek sesuai timeline yang disepakati.",
    aboutV4Icon: "", aboutV4Title: "Harga Transparan",   aboutV4Desc: "RAB detail dan transparan — tidak ada biaya tersembunyi dalam setiap proyek.",
    aboutContactTitle: "Get in Touch",
    aboutContactSub: "We'd love to help plan your next event.",
    email:   "mahfudfebrys@gmail.com",
    phone:   "+62 822-3465-1413",
    address: "Perumahan Puri Mangundikaran, Blok B5 No.21, Kel. Mangundikaran, Kec. Nganjuk, Kab. Nganjuk",
    hours: "Senin – Sabtu: 08.00 – 20.00 WIB",
    waAdmins: [
      { id: 1, name: "Mahfudfebry", jabatan: "Chief Executive Officer", wa: "https://wa.me/6282234651413", primary: true },
      { id: 2, name: "Fredy", jabatan: "Admin", wa: "https://wa.me/6281233275485", primary: false },
    ],
    waLink: "https://wa.me/6282234651413",
    igLink: "https://instagram.com/hikimori_const",
    fbLink: "https://facebook.com/hikimori.const",
    logoText: "HIKIMORI\nCONST",
    logoImage: "",
    footerLogoImage: "",
    logoSingleLine: false,
    logoFont: "Playfair Display",
    logoColor: "#111111",
    logoShadow: "0 1px 6px rgba(0,0,0,.35), 0 2px 14px rgba(0,0,0,.18)",
    marketing: {},
    loginBtnText: "LOGIN",
    nav1: "Home", nav2: "About", nav3: "Program Affiliate", nav4: "Paket Rumah Subsidi", nav5: "Interior", nav6: "Layanan Kami",
    nav7: "Jasa Desain & RAB", nav8: "Tema Rumah",
    nav9: "Interior", nav10: "Pagar Rumah", nav11: "Kanopi", nav12: "Aluminium", nav13: "Landscape & Taman",
    servicesPageTitle: "SOLUSI LENGKAP DESAIN & KONSTRUKSI",
    servicesPageSub: "Melayani desain, renovasi, interior, eksterior hingga penataan taman dengan standar profesional.",
    servicesHeroImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&q=85",
    waTemplates: {
      umum: "Halo HIKIMORI CONST!\n\nSaya ingin mengetahui lebih lanjut tentang layanan Anda.\n\nTerima kasih!",
    },
  },
  posts: DEFAULT_POSTS,
  cats: ["Experience Thailand", "Best Adventures", "Sea & Beach", "Hiking Tours", "Kayaking Tours", "Winter Destinations"],
  messages: [],
  reviews: [],
  reviewTokens: [],
  landscapeCategories: [],
  rumahSubsidiPaket: [],
  pembangunanKostPaket: [],
  pembangunanCafePaket: [],
  pembangunanRukoPaket: [],
  temaData: [],
  homeServices: [],
  aboutStats: [],
  aboutMisiList: [],
  aboutWhyList: [],
  aboutLayananList: [],
  services: [
    /* ── EKSTERIOR (3 paket) ── */
    {
      id: 1,
      category: "event",
      title: "Paket Eksterior Starter",
      badge: "Terjangkau",
      badgeColor: "#27ae60",
      price: "Rp 3.500.000",
      priceNote: "/ paket",
      images: [],
      image: "",
      description: "Paket eksterior entry-level untuk mempercantik tampilan depan rumah — cocok untuk pagar minimalis, carport sederhana, atau kanopi kecil dengan hasil rapi dan tahan lama.",
      features: [
        "Konsultasi & survei lokasi",
        "Desain 2D tampilan depan",
        "Material standar berkualitas",
        "Pemasangan oleh tukang berpengalaman",
        "Estimasi pengerjaan 3–5 hari",
        "Garansi pemasangan 3 bulan",
        "Cocok untuk rumah tipe 36–45",
      ],
      highlight: false,
    },
    {
      id: 2,
      category: "event",
      title: "Paket Eksterior Profesional",
      badge: "Populer",
      badgeColor: "#8B6914",
      price: "Rp 12.500.000",
      priceNote: "/ paket",
      images: [],
      image: "",
      description: "Paket lengkap penataan eksterior rumah — pagar, kanopi, dan taman kecil dalam satu paket terintegrasi. Cocok untuk renovasi tampilan depan rumah tipe menengah.",
      features: [
        "Konsultasi & desain 3D tampilan depan",
        "Pagar besi/aluminium custom",
        "Kanopi carport baja ringan",
        "Penataan taman kecil & paving",
        "Material pilihan tahan cuaca",
        "Pengawasan tim lapangan",
        "Estimasi pengerjaan 2–3 minggu",
        "Garansi pekerjaan 6 bulan",
      ],
      highlight: true,
    },
    {
      id: 3,
      category: "event",
      title: "Paket Fasad Premium & Landscape",
      badge: "Premium",
      badgeColor: "#c0392b",
      price: "Rp 35.000.000",
      priceNote: "/ paket",
      images: [],
      image: "",
      description: "Renovasi total tampilan luar rumah — fasad modern, landscape taman, dan pencahayaan eksterior untuk hunian yang tampil beda dan bernilai lebih tinggi.",
      features: [
        "Desain arsitektur fasad 3D premium",
        "Material batu alam & cladding pilihan",
        "Landscape taman & kolam mini (opsional)",
        "Lighting eksterior dekoratif",
        "Pagar & gerbang custom",
        "Project manager penuh waktu",
        "Estimasi pengerjaan 4–6 minggu",
        "Garansi pekerjaan 1 tahun",
      ],
      highlight: false,
    },

    /* ── GEDUNG & RUMAH (6 paket — Tipe Rumah, Renovasi, Ruko/Kost, Custom) ── */
    {
      id: 4,
      category: "traveling",
      pkgId: "tipe36",
      title: "Paket Rumah Tipe 36",
      tagline: "Hunian Nyaman untuk Keluarga Muda",
      badge: "PALING POPULER",
      badgeColor: "#e8a020",
      accent: "#e8a020",
      accentLight: "#fff8e6",
      price: "185000000",
      priceNote: "/ unit (mulai)",
      images: [],
      image: "",
      description: "Pembangunan rumah tipe 36 dari nol — desain fungsional, struktur kokoh, dan material berkualitas. Cocok untuk keluarga muda yang menginginkan hunian pertama yang efisien dan nyaman.",
      features: ["2 Kamar Tidur", "1 Kamar Mandi", "Ruang Tamu & Keluarga", "Dapur Bersih", "Carport 1 Mobil", "Struktur Beton Bertulang", "Atap Baja Ringan", "Garansi Struktur 1 Tahun"],
      highlight: true,
      facilities: [
        { icon: "", label: "Pondasi Batu Kali", detail: "Kedalaman sesuai kondisi tanah" },
        { icon: "", label: "Dinding Bata Merah", detail: "Plester & aci halus" },
        { icon: "", label: "Atap Baja Ringan", detail: "Genteng metal / beton" },
        { icon: "", label: "Lantai Keramik 40x40", detail: "Seluruh ruangan" },
        { icon: "", label: "Instalasi Listrik", detail: "1300 VA, titik lampu standar" },
        { icon: "", label: "Instalasi Air", detail: "PDAM / sumur bor + toren" },
        { icon: "", label: "Kusen Aluminium", detail: "Pintu & jendela" },
        { icon: "", label: "Pengecatan", detail: "Interior & eksterior" },
      ],
      destinations: [
        { no: "01", name: "Persiapan Lahan", sub: "Lokasi Proyek", tag: "Tahap 1 · Persiapan", title: "Survei & Persiapan Lahan", desc: "Survei kondisi tanah, pengukuran, dan pembersihan lahan sebelum konstruksi dimulai — memastikan fondasi dibangun di atas kondisi tanah yang tepat.", points: ["Survei & pengukuran lahan", "Pembersihan & perataan tanah", "Pemasangan bouwplank", "Perizinan (IMB/PBG) dibantu"], duration: "1–2 minggu", img: "" },
        { no: "02", name: "Struktur & Dinding", sub: "Area Konstruksi", tag: "Tahap 2 · Struktur", title: "Pekerjaan Pondasi, Struktur & Dinding", desc: "Pengerjaan pondasi, kolom, balok, dan pasangan dinding bata sesuai gambar kerja yang telah disepakati bersama klien.", points: ["Pondasi & sloof beton", "Kolom & balok struktur", "Pasangan dinding bata merah", "Plester & acian dinding"], duration: "4–6 minggu", img: "" },
        { no: "03", name: "Atap & MEP", sub: "Area Konstruksi", tag: "Tahap 3 · Finishing Awal", title: "Pemasangan Atap, Listrik & Plumbing", desc: "Instalasi rangka atap, penutup atap, jaringan listrik, dan sistem perpipaan air bersih maupun kotor.", points: ["Rangka & penutup atap", "Instalasi listrik & titik lampu", "Instalasi pipa air bersih/kotor", "Pemasangan plafon"], duration: "3–4 minggu", img: "" },
        { no: "04", name: "Finishing & Serah Terima", sub: "Seluruh Area", tag: "Tahap 4 · Penyelesaian", title: "Finishing, Pengecatan & Serah Terima", desc: "Tahap akhir meliputi pemasangan keramik, kusen, pengecatan, pembersihan lokasi, dan serah terima kunci kepada klien.", points: ["Pemasangan lantai & keramik", "Kusen, pintu & jendela", "Pengecatan interior & eksterior", "Pembersihan & serah terima"], duration: "3–4 minggu", img: "" },
      ],
    },
    {
      id: 5,
      category: "traveling",
      pkgId: "tipe45",
      title: "Paket Rumah Tipe 45",
      tagline: "Lebih Luas, Lebih Leluasa",
      badge: "Populer",
      badgeColor: "#3D5254",
      accent: "#3D5254",
      accentLight: "#eef4f4",
      price: "285000000",
      priceNote: "/ unit (mulai)",
      images: [],
      image: "",
      description: "Rumah tipe 45 dengan tata ruang lebih lega — ideal untuk keluarga dengan anak. Desain modern minimalis dengan sirkulasi udara dan cahaya alami yang optimal.",
      features: ["3 Kamar Tidur", "2 Kamar Mandi", "Ruang Keluarga Terpisah", "Dapur & Ruang Makan", "Carport 1–2 Mobil", "Taman Kecil Depan/Belakang", "Struktur Beton Bertulang", "Garansi Struktur 1 Tahun"],
      highlight: false,
      facilities: [
        { icon: "", label: "Pondasi Beton", detail: "Sesuai perhitungan struktur" },
        { icon: "", label: "Dinding Bata Ringan/Merah", detail: "Plester & aci halus" },
        { icon: "", label: "Atap Baja Ringan", detail: "Genteng metal / beton pilihan" },
        { icon: "", label: "Lantai Keramik 60x60", detail: "Ruang utama, 40x40 kamar mandi" },
        { icon: "", label: "Instalasi Listrik", detail: "2200 VA, titik lampu lengkap" },
        { icon: "", label: "Instalasi Air", detail: "PDAM / sumur bor + toren + pompa" },
        { icon: "", label: "Kusen Aluminium/UPVC", detail: "Pintu & jendela" },
        { icon: "", label: "Plafon Gypsum", detail: "Seluruh ruangan" },
      ],
      destinations: [
        { no: "01", name: "Persiapan Lahan", sub: "Lokasi Proyek", tag: "Tahap 1 · Persiapan", title: "Survei & Persiapan Lahan", desc: "Survei kondisi tanah, pengukuran, dan pembersihan lahan sebelum konstruksi dimulai.", points: ["Survei & pengukuran lahan", "Pembersihan & perataan tanah", "Pemasangan bouwplank", "Perizinan (IMB/PBG) dibantu"], duration: "1–2 minggu", img: "" },
        { no: "02", name: "Struktur & Dinding", sub: "Area Konstruksi", tag: "Tahap 2 · Struktur", title: "Pekerjaan Pondasi, Struktur & Dinding", desc: "Pengerjaan pondasi, kolom, balok, dan pasangan dinding sesuai gambar kerja.", points: ["Pondasi & sloof beton", "Kolom & balok struktur", "Pasangan dinding", "Plester & acian dinding"], duration: "5–7 minggu", img: "" },
        { no: "03", name: "Atap & MEP", sub: "Area Konstruksi", tag: "Tahap 3 · Finishing Awal", title: "Pemasangan Atap, Listrik & Plumbing", desc: "Instalasi rangka atap, jaringan listrik, dan sistem perpipaan.", points: ["Rangka & penutup atap", "Instalasi listrik & titik lampu", "Instalasi pipa air bersih/kotor", "Pemasangan plafon gypsum"], duration: "4–5 minggu", img: "" },
        { no: "04", name: "Finishing & Serah Terima", sub: "Seluruh Area", tag: "Tahap 4 · Penyelesaian", title: "Finishing, Pengecatan & Serah Terima", desc: "Tahap akhir pemasangan lantai, kusen, pengecatan, dan serah terima kunci.", points: ["Pemasangan lantai & keramik", "Kusen, pintu & jendela", "Pengecatan interior & eksterior", "Pembersihan & serah terima"], duration: "4–5 minggu", img: "" },
      ],
    },
    {
      id: 6,
      category: "traveling",
      pkgId: "tipe70",
      title: "Paket Rumah Tipe 70",
      tagline: "Hunian Lega untuk Keluarga Besar",
      badge: "Premium",
      badgeColor: "#c0392b",
      accent: "#c0392b",
      accentLight: "#fdeeec",
      price: "485000000",
      priceNote: "/ unit (mulai)",
      images: [],
      image: "",
      description: "Rumah tipe 70 dengan desain 2 lantai — ruang lebih banyak untuk keluarga besar, lengkap dengan ruang kerja/keluarga tambahan dan material finishing kelas atas.",
      features: ["4 Kamar Tidur", "3 Kamar Mandi", "Ruang Kerja / Keluarga Lt. 2", "Dapur Basah & Kering", "Carport 2 Mobil", "Balkon & Void", "Material Finishing Premium", "Garansi Struktur 1 Tahun"],
      highlight: false,
      facilities: [
        { icon: "", label: "Pondasi Beton Bertulang", detail: "Untuk struktur 2 lantai" },
        { icon: "", label: "Struktur Kolom Praktis", detail: "Sesuai perhitungan insinyur" },
        { icon: "", label: "Atap Baja Ringan/Konvensional", detail: "Genteng beton/keramik premium" },
        { icon: "", label: "Lantai Granit 60x60", detail: "Ruang utama & kamar" },
        { icon: "", label: "Instalasi Listrik", detail: "3500–4400 VA, titik lengkap" },
        { icon: "", label: "Water Heater", detail: "Kamar mandi utama" },
        { icon: "", label: "Kusen Aluminium Premium", detail: "Kaca tempered" },
        { icon: "", label: "Plafon Gypsum + Lis Profil", detail: "Seluruh ruangan" },
      ],
      destinations: [
        { no: "01", name: "Persiapan Lahan", sub: "Lokasi Proyek", tag: "Tahap 1 · Persiapan", title: "Survei & Persiapan Lahan", desc: "Survei kondisi tanah, perhitungan struktur 2 lantai, dan persiapan lahan.", points: ["Survei tanah & uji beban", "Pembersihan & perataan lahan", "Pemasangan bouwplank", "Perizinan (IMB/PBG) dibantu"], duration: "2–3 minggu", img: "" },
        { no: "02", name: "Struktur 2 Lantai", sub: "Area Konstruksi", tag: "Tahap 2 · Struktur", title: "Pekerjaan Struktur Lantai 1 & 2", desc: "Pengerjaan pondasi, kolom, balok, plat lantai, dan dinding untuk 2 lantai.", points: ["Pondasi & sloof beton", "Kolom, balok & plat lantai 2", "Pasangan dinding 2 lantai", "Tangga beton"], duration: "8–10 minggu", img: "" },
        { no: "03", name: "Atap & MEP", sub: "Area Konstruksi", tag: "Tahap 3 · Finishing Awal", title: "Atap, Listrik, Plumbing & Plafon", desc: "Instalasi rangka atap, jaringan listrik 2 lantai, perpipaan, dan plafon.", points: ["Rangka & penutup atap", "Instalasi listrik 2 lantai", "Instalasi pipa air & water heater", "Pemasangan plafon gypsum"], duration: "6–8 minggu", img: "" },
        { no: "04", name: "Finishing & Serah Terima", sub: "Seluruh Area", tag: "Tahap 4 · Penyelesaian", title: "Finishing Premium & Serah Terima", desc: "Pemasangan lantai granit, kusen kaca tempered, pengecatan, dan serah terima kunci.", points: ["Lantai granit & keramik premium", "Kusen aluminium & kaca tempered", "Pengecatan interior & eksterior", "Pembersihan & serah terima"], duration: "5–6 minggu", img: "" },
      ],
    },
    {
      id: 7,
      category: "traveling",
      pkgId: "custom-rumah",
      title: "Paket Rumah Custom Desain",
      tagline: "Wujudkan Rumah Impian Sesuai Selera Anda",
      badge: "BISA CUSTOM",
      badgeColor: "#7c3aed",
      accent: "#7c3aed",
      accentLight: "#f3eefe",
      price: "Hubungi Kami",
      priceNote: "harga transparan sesuai desain & luas",
      images: [],
      image: "",
      description: "Tidak menemukan tipe yang cocok? Kami merancang dan membangun rumah 100% sesuai kebutuhan dan gaya hidup Anda — dari luas tanah, jumlah lantai, hingga gaya arsitektur.",
      features: [
        "Konsultasi & desain arsitektur gratis",
        "Luas bangunan & jumlah lantai bebas",
        "Gaya bebas: minimalis, modern, tropis, klasik, dll.",
        "RAB transparan tanpa biaya tersembunyi",
        "Timeline pengerjaan custom",
        "Project manager penuh waktu",
        "Dokumentasi progres berkala",
        "Garansi struktur 1 tahun",
      ],
      highlight: false,
    },
    {
      id: 11,
      category: "traveling",
      title: "Paket Renovasi Rumah",
      badge: "Ekonomis",
      badgeColor: "#27ae60",
      price: "Rp 25.000.000",
      priceNote: "/ paket (mulai)",
      images: [],
      image: "",
      description: "Renovasi rumah lama menjadi lebih fungsional dan modern — mulai dari penambahan ruangan, perbaikan struktur, hingga perombakan total sesuai kebutuhan dan anggaran Anda.",
      features: [
        "Survei & konsultasi kondisi rumah",
        "Desain renovasi 2D/3D",
        "Perbaikan/penambahan struktur",
        "Perombakan tata ruang",
        "Material sesuai budget",
        "Pengawasan tim lapangan",
        "Estimasi sesuai skala pekerjaan",
        "Garansi pekerjaan 6 bulan",
      ],
      highlight: false,
    },
    {
      id: 12,
      category: "traveling",
      title: "Paket Bangun Ruko & Kost-kostan",
      badge: "Investasi",
      badgeColor: "#1d4ed8",
      price: "Rp 350.000.000",
      priceNote: "/ unit (mulai)",
      images: [],
      image: "",
      description: "Pembangunan ruko atau rumah kost untuk kebutuhan investasi/usaha — desain efisien, struktur kuat, dan tata ruang yang memaksimalkan nilai sewa maupun jual.",
      features: [
        "Konsultasi konsep bisnis & tata ruang",
        "Desain arsitektur 2–3 lantai",
        "Struktur beton bertulang tahan lama",
        "Instalasi listrik & air per unit (kost)",
        "Material tahan lama & mudah perawatan",
        "RAB & timeline detail",
        "Pengawasan proyek oleh tim berpengalaman",
        "Garansi struktur 1 tahun",
      ],
      highlight: false,
    },
    /* ── EKSTERIOR TAMBAHAN: FASAD, TAMAN, CARPORT, PAGAR, HALAMAN ── */
    {
      id: 13,
      category: "event",
      title: "Paket Renovasi Fasad Rumah",
      badge: "Ekonomis",
      badgeColor: "#b45309",
      price: "Rp 4.500.000",
      priceNote: "/ paket",
      images: [],
      image: "",
      description: "Segarkan tampilan depan rumah tanpa membangun ulang — pengecatan ulang, aksen material baru, dan perbaikan minor fasad agar rumah terlihat lebih modern dan terawat.",
      features: [
        "Survei & konsultasi kondisi fasad",
        "Pengecatan ulang dinding depan",
        "Perbaikan retak & permukaan tidak rata",
        "Aksen material (batu alam / kayu / cladding)",
        "Estimasi pengerjaan 3–5 hari",
        "Material cat & aksen kualitas standar",
        "Dokumentasi sebelum & sesudah",
        "Garansi pekerjaan 3 bulan",
      ],
      highlight: false,
    },
    {
      id: 14,
      category: "event",
      title: "Paket Taman & Landscape",
      badge: "Populer",
      badgeColor: "#db2777",
      price: "Rp 6.500.000",
      priceNote: "/ paket",
      images: [],
      image: "",
      description: "Ubah halaman kosong menjadi taman asri yang nyaman dipandang. Cocok untuk halaman depan, samping, atau belakang rumah dengan luasan menengah.",
      features: [
        "Konsultasi konsep taman & tata letak",
        "Penataan tanaman & rumput sintetis/asli",
        "Paving block / stepping stone",
        "Sistem penyiraman sederhana",
        "Lighting taman dekoratif",
        "Estimasi pengerjaan 1–2 minggu",
        "Perawatan awal 1 bulan",
        "Cocok untuk luas 20–80 m²",
      ],
      highlight: true,
    },
    {
      id: 15,
      category: "event",
      title: "Paket Carport & Kanopi Instansi",
      badge: "Instansi & Komersial",
      badgeColor: "#1d4ed8",
      price: "Rp 15.000.000",
      priceNote: "/ paket",
      images: [],
      image: "",
      description: "Paket pembangunan carport dan kanopi skala besar untuk kantor, sekolah, atau fasilitas umum. Konstruksi baja kuat dengan desain rapi dan tahan lama.",
      features: [
        "Konsultasi & perencanaan struktur",
        "Rangka baja ringan / konvensional",
        "Atap spandek / polycarbonate / alderon",
        "Kapasitas menaungi 5–20 kendaraan",
        "Perhitungan struktur & RAB detail",
        "Pengawasan tim lapangan berpengalaman",
        "Dokumentasi progres pengerjaan",
        "Garansi struktur 1 tahun",
      ],
      highlight: false,
    },
    {
      id: 16,
      category: "event",
      title: "Paket Pagar Klasik & Modern",
      badge: "Custom Desain",
      badgeColor: "#92400e",
      price: "Rp 8.000.000",
      priceNote: "/ paket",
      images: [],
      image: "",
      description: "Pagar dan gerbang custom dengan berbagai pilihan gaya — klasik, minimalis modern, hingga industrial. Material besi, aluminium, atau kombinasi sesuai kebutuhan.",
      features: [
        "Konsultasi gaya & desain pagar",
        "Material besi / aluminium / kombinasi kayu",
        "Finishing cat duco / powder coating",
        "Pemasangan gerbang manual / otomatis (opsional)",
        "Ukuran & desain custom",
        "Estimasi pengerjaan 1–2 minggu",
        "Garansi pekerjaan 6 bulan",
        "Pengiriman & pemasangan termasuk",
      ],
      highlight: false,
    },
    {
      id: 17,
      category: "event",
      title: "Paket Halaman & Carport Keluarga",
      badge: "Hangat & Fungsional",
      badgeColor: "#8B6914",
      price: "Rp 5.500.000",
      priceNote: "/ paket",
      images: [],
      image: "",
      description: "Tata ulang halaman rumah agar lebih fungsional untuk keluarga — carport rapi, area duduk santai, dan sentuhan hijau yang membuat rumah terasa lebih nyaman.",
      features: [
        "Konsultasi tata letak halaman",
        "Perkerasan carport (paving/beton)",
        "Area duduk & gazebo mini (opsional)",
        "Penataan tanaman & pot hias",
        "Estimasi pengerjaan 1 minggu",
        "Material standar tahan cuaca",
        "Dokumentasi hasil akhir",
        "Cocok untuk luas 15–50 m²",
      ],
      highlight: false,
    },

    /* ── INTERIOR (3 paket) ── */
    {
      id: 8,
      category: "wedding",
      title: "Paket Interior Starter",
      badge: "Terlaris",
      badgeColor: "#e67e22",
      price: "Rp 18.000.000",
      priceNote: "/ ruangan",
      images: [],
      image: "",
      description: "Penataan interior 1–2 ruangan (ruang tamu, kamar tidur, atau ruang keluarga) dengan konsep minimalis modern. Ideal untuk rumah tipe 36–60 yang ingin tampil lebih rapi dan fungsional.",
      features: [
        "Konsultasi & desain 2D/3D",
        "Interior designer dedicated",
        "Furniture custom sesuai budget",
        "Pemilihan material & warna cat",
        "Pengawasan pemasangan",
        "Estimasi pengerjaan 2–3 minggu",
        "Dokumentasi sebelum & sesudah",
        "Garansi pekerjaan 6 bulan",
      ],
      highlight: false,
    },
    {
      id: 9,
      category: "wedding",
      title: "Paket Interior Premium Rumah Tinggal",
      badge: "Best Seller",
      badgeColor: "#1abc9c",
      price: "Rp 25.000.000",
      priceNote: "/ paket",
      images: [],
      image: "",
      description: "Penataan interior menyeluruh untuk rumah tinggal — ruang tamu, ruang keluarga, dapur, dan kamar utama dalam satu konsep desain yang konsisten dan elegan.",
      features: [
        "Desain interior 3D seluruh area",
        "Furniture & built-in cabinet custom",
        "Pemilihan material premium",
        "Konsultasi tata cahaya & tata udara",
        "Koordinasi tukang & vendor material",
        "Interior designer dedicated",
        "Estimasi pengerjaan 4–6 minggu",
        "Garansi pekerjaan 1 tahun",
      ],
      highlight: true,
    },
    {
      id: 10,
      category: "wedding",
      title: "Paket Interior Mewah Rumah Besar",
      badge: "Mewah",
      badgeColor: "#8e44ad",
      price: "Rp 55.000.000",
      priceNote: "/ paket",
      images: [],
      image: "",
      description: "Desain dan pembangunan interior kelas atas untuk rumah besar atau mewah — material premium, furniture custom, dan sentuhan akhir detail untuk hasil setara hotel bintang 5.",
      features: [
        "Desain interior 3D detail seluruh lantai",
        "Furniture & built-in full custom",
        "Material premium (marmer, kayu solid, dll.)",
        "Lighting design & smart home (opsional)",
        "Project manager & tim senior",
        "Pengawasan kualitas berkala",
        "Dokumentasi progres & hasil akhir",
        "Garansi pekerjaan 1 tahun penuh",
      ],
      highlight: false,
    },

    /* ── EKSTERIOR TAMBAHAN: FASAD KOMERSIAL & INSTANSI ── */
    {
      id: 20,
      category: "event",
      title: "Paket Fasad Ruko & Komersial",
      badge: "Skala Besar",
      badgeColor: "#dc2626",
      price: "Rp 25.000.000",
      priceNote: "/ paket (mulai)",
      images: [],
      image: "",
      description: "Renovasi fasad ruko, kantor, atau bangunan komersial skala besar. Kami menangani seluruh proses — desain, material, struktur, hingga finishing — agar bangunan tampil profesional dan menarik pelanggan.",
      features: [
        "Konsultasi konsep & survei bangunan",
        "Desain fasad 3D komersial",
        "Material ACP, kaca, & cladding modern",
        "Perhitungan struktur & RAB detail",
        "Signage & branding area (opsional)",
        "Tim struktur & finishing berpengalaman",
        "Dokumentasi progres pengerjaan",
        "Estimasi pengerjaan 4–8 minggu",
        "Kapasitas bangunan 1–3 lantai",
      ],
      highlight: true,
    },
    {
      id: 21,
      category: "event",
      title: "Paket Eksterior Instansi Pemerintah",
      badge: "Resmi & Protokol",
      badgeColor: "#1d4ed8",
      price: "Rp 20.000.000",
      priceNote: "/ paket (mulai)",
      images: [],
      image: "",
      description: "Pembangunan dan renovasi eksterior fasilitas instansi pemerintah — kantor dinas, balai desa, hingga fasilitas publik — sesuai standar dan protokol pengadaan yang berlaku.",
      features: [
        "Konsultasi & perencanaan sesuai spesifikasi instansi",
        "Desain fasad & gerbang resmi bernuansa institusional",
        "Material tahan lama & sesuai standar bangunan negara",
        "Perhitungan struktur & RAB lengkap",
        "Koordinasi dengan pihak terkait & pengawas proyek",
        "Dokumentasi progres & laporan berkala",
        "Legalitas & administrasi proyek tertata",
        "Estimasi pengerjaan sesuai skala proyek",
      ],
      highlight: false,
    },

    /* ── EKSTERIOR CUSTOM ── */
    {
      id: 18,
      category: "event",
      pkgId: "custom",
      title: "Paket Eksterior Custom",
      tagline: "Rancang Eksterior Sesuai Visi & Kebutuhan Anda",
      badge: "BISA CUSTOM",
      badgeColor: "#7c3aed",
      price: "Hubungi Kami",
      priceNote: "harga transparan & negosiasi",
      images: [],
      image: "",
      description: "Tidak menemukan paket yang cocok? Kami merancang eksterior 100% sesuai kebutuhan Anda — pagar, kanopi, taman, fasad, hingga carport. Dari rumah tinggal, ruko, hingga fasilitas komersial, kami wujudkan.",
      features: [
        "Konsultasi konsep & desain gratis",
        "Skala proyek bebas: rumah, ruko, hingga komersial",
        "Pilihan material sesuai budget",
        "RAB transparan tanpa biaya tersembunyi",
        "Timeline pengerjaan custom",
        "Pengawasan proyek penuh oleh tim kami",
        "Dokumentasi progres & hasil akhir",
        "Garansi pekerjaan sesuai lingkup proyek",
      ],
      highlight: false,
    },

    /* ── INTERIOR CUSTOM ── */
    {
      id: 19,
      category: "wedding",
      pkgId: "custom",
      title: "Paket Interior Custom",
      tagline: "Wujudkan Hunian Impian Tanpa Batas",
      badge: "BISA CUSTOM",
      badgeColor: "#7c3aed",
      price: "Hubungi Kami",
      priceNote: "konsultasi gratis, harga transparan",
      images: [],
      image: "",
      description: "Setiap rumah punya karakter yang berbeda. Kami merancang interior sesuai kebutuhan dan gaya hidup Anda — dari konsep, pemilihan material, furniture, hingga finishing akhir, tanpa ada proyek yang terlalu besar atau terlalu kecil.",
      features: [
        "Konsultasi desain interior gratis & tanpa batas",
        "Pilihan gaya bebas: modern, minimalis, klasik, industrial, dll.",
        "Interior designer dedicated full-time",
        "Koordinasi semua vendor (furniture, material, tukang, dll.)",
        "Desain & pengerjaan 100% custom",
        "Pengawasan kualitas & pendampingan penuh",
        "Skala proyek fleksibel: 1 ruangan hingga rumah penuh",
        "Harga transparan, cicilan tersedia",
      ],
      highlight: false,
    },
  ],
  teamMembers: [
    { id: 1, name: "Budi Santoso", role: "CEO & Founder", quotes: "Setiap hunian layak dibangun dengan kualitas dan kepercayaan penuh.", photo: "https://ui-avatars.com/api/?name=Budi+Santoso&size=300&background=2d2d2d&color=fff&bold=true" },
    { id: 2, name: "Sari Dewi", role: "Interior Designer", quotes: "Kami hadir untuk mewujudkan interior impian setiap klien.", photo: "https://ui-avatars.com/api/?name=Sari+Dewi&size=300&background=2b7a9a&color=fff&bold=true" },
    { id: 3, name: "Raka Pratama", role: "Site Supervisor", quotes: "Konstruksi terbaik dimulai dari perencanaan yang matang.", photo: "https://ui-avatars.com/api/?name=Raka+Pratama&size=300&background=c9aa71&color=fff&bold=true" },
    { id: 4, name: "Dini Rahayu", role: "Arsitek", quotes: "Desain yang baik adalah kunci hunian yang tak terlupakan.", photo: "https://ui-avatars.com/api/?name=Dini+Rahayu&size=300&background=27ae60&color=fff&bold=true" },
  ],
  users: HARDCODED_USERS.map((u, i) => ({ id: i + 1, ...u, email: `${u.username}@hikimoriconst.com`, active: true })),
};

/* ─────────────── GLOBAL STYLES ─────────────── */

/* ═══════════════════════════════════════════════════════════════════════════
   PERFORMANCE UTILITIES (dari refactor)
   ═══════════════════════════════════════════════════════════════════════════ */

/** withMemo: HOC untuk membungkus komponen dengan React.memo + custom comparator */
function withMemo(Component, propsAreEqual) {
  return React.memo(Component, propsAreEqual);
}

/** useStableCallback: useCallback tanpa dependencies — aman untuk event handler */
function useStableCallback(fn) {
  const fnRef = useRef(fn);
  useEffect(() => { fnRef.current = fn; });
  return useCallback((...args) => fnRef.current(...args), []);
}

/** useDebounce: Debounce nilai untuk menghindari frequent re-renders */
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

/** useIntersection: Deteksi elemen masuk viewport — fire sekali */
function useIntersection(ref, options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, ...options }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]); // eslint-disable-line react-hooks/exhaustive-deps
  return isIntersecting;
}

/** LazySection: Render children hanya saat terlihat di viewport */
const LazySection = React.memo(function LazySection({ children, fallback = null, style = {} }) {
  const ref = useRef(null);
  const isVisible = useIntersection(ref);
  return (
    <div ref={ref} style={style}>
      {isVisible ? children : fallback}
    </div>
  );
});

/** VirtualList: Render hanya item yang terlihat — untuk daftar panjang */
const VirtualList = React.memo(function VirtualList({
  items, itemHeight, renderItem, containerHeight = 600, overscan = 3,
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIdx = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIdx   = Math.min(items.length - 1, startIdx + visibleCount + overscan * 2);
  const visibleItems = items.slice(startIdx, endIdx + 1);
  const totalHeight  = items.length * itemHeight;
  const offsetY      = startIdx * itemHeight;
  return (
    <div ref={containerRef}
      style={{ height: containerHeight, overflow: "auto", position: "relative" }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}>
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ position: "absolute", top: offsetY, width: "100%" }}>
          {visibleItems.map((item, i) => renderItem(item, startIdx + i))}
        </div>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
   LAZY IMAGE — Native lazy loading + skeleton placeholder (dari refactor)
   ═══════════════════════════════════════════════════════════════════════════ */
const LazyImage = React.memo(function LazyImage({
  src, alt = "", style = {}, className = "",
  placeholderColor = "#FAF7F0", onError,
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(false);
  const handleError = useCallback((e) => {
    setError(true);
    if (onError) onError(e);
  }, [onError]);
  if (!src || error) {
    return (
      <div style={{
        background: placeholderColor,
        display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 28,
        ...style,
      }} className={className}></div>
    );
  }
  return (
    <div style={{ position: "relative", ...style }} className={className}>
      {!loaded && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg,#F5EDD8 25%,#FAF7F0 50%,#F5EDD8 75%)",
          backgroundSize: "800px 100%",
          animation: "shimmer 1.5s infinite",
        }} />
      )}
      <img
        loading="lazy"
        decoding="async"
        src={cld(src)}
        alt={alt}
        style={{
          width: "100%", height: "100%",
          objectFit: "cover", display: "block",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.3s ease",
          ...style,
        }}
        onLoad={() => setLoaded(true)}
        onError={handleError}
      />
    </div>
  );
});

/* ─────────────── CEF: Content Edit Field (outside main to prevent remount) ─────────────── */
function CEF({ val, multiline, onChange, onSave }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", width: "100%" }}>
      {multiline
        ? <textarea value={val} onChange={onChange} ref={autoGrowTextarea}
            onInput={e => autoGrowTextarea(e.target)}
            style={{ flex: 1, padding: "8px 10px", border: "1px solid #A89070", borderRadius: 6, fontSize: 14, resize: "none", overflow: "hidden", minHeight: 80 }} />
        : <input value={val} onChange={onChange}
            style={{ flex: 1, padding: "8px 10px", border: "1px solid #A89070", borderRadius: 6, fontSize: 14 }} />
      }
      <button onClick={onSave}
        style={{ padding: "8px 14px", background: "#C9AA71", color: "#fff", borderRadius: 6, fontSize: 12, border: "none" }}>Save</button>
    </div>
  );
}


/* ─────────────── Penanganan gambar gagal dimuat ───────────────
   Sebelumnya gambar yang gagal di-set display:none. Akibatnya elemen itu HILANG dari alur layout dan
   seluruh konten di bawahnya melompat — penyebab utama Cumulative Layout Shift (CLS) di halaman yang
   banyak gambarnya, terutama saat koneksi buruk atau ada URL CMS yang mati. Di sini kotaknya
   dipertahankan (ukuran tetap) dan hanya diisi latar netral, jadi tata letak tidak bergeser. */
function onImgError(e) {
  const el = e?.currentTarget || e?.target;
  if (!el || el.dataset.imgFailed) return;
  el.dataset.imgFailed = "1";
  el.removeAttribute("src");
  el.removeAttribute("srcset");
  el.alt = "";
  el.style.background = "linear-gradient(135deg,#EFE7D7,#FAF7F0)";
}

/* ─────────────── LOGO DISPLAY ─────────────── */
const HIKIMORI_LOGO_URL = "/images/hikimori-const-logo.svg";

function LogoDisplay({ content, size = "nav" }) {
  const isMobileNav = size === "mobile-nav";
  const isFooter    = size === "footer";
  const isAdmin     = size === "admin";
  const h    = isMobileNav ? 52 : isAdmin ? 32 : isFooter ? 56 : 62;
  const maxW = isMobileNav ? 160 : isAdmin ? 90 : isFooter ? 160 : 190;
  return (
    <img loading={isFooter ? "lazy" : "eager"} decoding="async"
      src={cld((isFooter && content?.footerLogoImage) || content?.logoImage || HIKIMORI_LOGO_URL, 400)}
      alt="Hikimori Const"
      style={{ height: h, maxWidth: maxW, width: "auto", objectFit: "contain", display: "block" }}
    />
  );
}

const formatDate = (d) => {
  try { return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return d; }
};

/* ─────────────── Sanitizer sederhana untuk konten rich-text (paragraph blocks) ───────────────
   Konten ini ditulis lewat CMS oleh akun admin/content_writer, jadi risikonya lebih ke
   "akun staf disalahgunakan / kredensial bocor" ketimbang input publik langsung — tapi karena
   di-render lewat dangerouslySetInnerHTML, tetap perlu dibersihkan dari <script>, event handler
   (onclick, onerror, dst), dan skema javascript: supaya tidak jadi celah XSS tersimpan yang bisa
   kena ke SEMUA pengunjung situs. Ini sanitizer ringan berbasis denylist (tanpa dependency baru) —
   kalau proyek ini nanti nambah npm package, disarankan ganti ke DOMPurify untuk proteksi lebih kuat. */
function sanitizeRichHtml(html) {
  if (!html || typeof html !== "string") return "";
  /* DOMPurify (allowlist) menggantikan denylist regex lama yang bisa dibypass (mis. <svg/onload=…>). */
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "iframe", "object", "embed", "form", "link", "meta"],
    FORBID_ATTR: ["style"],
    ADD_ATTR: ["target"],
  });
}

/* ─────────────── TRAVEL PACKAGE CARD (accordion price) ─────────────── */

/* Shared hook: returns true when viewport width ≤ 640px */
function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return mobile;
}

/* ── WIDE CARD for Custom Event / Wedding Package — full width horizontal layout ── */
function EventWeddingCustomCardWide({ svc, onDetail, onWaOpen }) {
  const [hovered, setHovered] = useState(false);
  const isMobile = useIsMobile();
  const ac = svc.badgeColor || "#7c3aed";
  const isWedding = svc.category === "wedding";
  const gradientBg = isWedding
    ? `linear-gradient(135deg, #2d1b4e 0%, #5b2d8e 50%, ${ac} 100%)`
    : `linear-gradient(135deg, #0a2e52 0%, #3D5254 50%, ${ac} 100%)`;
  const icon = isWedding ? "" : "";
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 18,
        boxShadow: hovered ? "0 24px 64px rgba(13,59,102,.22)" : "0 6px 28px rgba(13,59,102,.13)",
        border: `2px solid ${hovered ? ac : ac + "60"}`,
        transition: "all .3s cubic-bezier(.22,1,.36,1)",
        transform: hovered ? "translateY(-4px)" : "none",
        background: gradientBg,
        display: "flex", flexDirection: isMobile ? "column" : "row",
        minHeight: isMobile ? "auto" : 280,
        fontFamily: "'DM Sans',sans-serif", position: "relative", overflow: "visible",
      }}>
      <div style={{ position: "absolute", right: -60, top: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,.06)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", right: 100, bottom: -80, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,.04)", pointerEvents: "none" }} />
      {/* Image */}
      <div style={{ position: "relative", width: isMobile ? "100%" : 320, height: isMobile ? 200 : "auto", flexShrink: 0, overflow: "hidden", borderRadius: isMobile ? "16px 16px 0 0" : "16px 0 0 16px" }}>
        <img decoding="async" loading="lazy" src={cld(svc.images?.[0] || svc.image)} alt={svc.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s", transform: hovered ? "scale(1.07)" : "scale(1)", opacity: 0.75 }}
          onError={onImgError} />
        <div style={{ position: "absolute", inset: 0, background: isMobile ? "linear-gradient(180deg,transparent 40%,rgba(0,0,0,.5) 100%)" : "linear-gradient(90deg,transparent 50%, rgba(0,0,0,.4) 100%)" }} />
        <div style={{ position: "absolute", top: 16, left: 16, background: ac, color: "#fff", borderRadius: 20, padding: "4px 14px", fontSize: "0.625rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" }}>{svc.badge}</div>
      </div>
      {/* Content */}
      <div style={{ flex: 1, padding: isMobile ? "22px 20px 24px" : "32px 40px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: "2rem", marginBottom: 8 }}>{icon}</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? "1.4rem" : "clamp(1.4rem,2.5vw,2rem)", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 6 }}>{svc.title}</h2>
        {svc.tagline && <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,.65)", fontWeight: 600, letterSpacing: ".04em", marginBottom: 14, fontStyle: "italic" }}>{svc.tagline}</div>}
        <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,.80)", lineHeight: 1.75, marginBottom: 20 }}>{svc.description}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {(svc.features || []).map((feat, i) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "5px 12px", backdropFilter: "blur(4px)" }}>
              <span style={{ color: "#4ade80", fontWeight: 700, fontSize: "0.875rem" }}>&#10003;</span>
              <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,.9)", fontWeight: 500, whiteSpace: "pre-wrap" }}>{feat}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: isMobile ? "stretch" : "center", gap: 12, flexDirection: isMobile ? "column" : "row", flexWrap: "wrap" }}>
          <div style={{ marginBottom: isMobile ? 4 : 0 }}>
            <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,.55)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 2 }}>Harga</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.5rem", fontWeight: 900, color: "#fff" }}>{(()=>{ const uPt=(svc.paketTypes||[]).find(pt=>pt.id===(svc.utamaTipeId||svc.paketTypes?.[0]?.id)); const rp=uPt?.price||svc.price; return formatRp(rp)||rp; })()}</div>
            <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,.6)", fontStyle: "italic" }}>{svc.priceNote}</div>
          </div>
          <button onClick={onDetail}
            style={{ padding: "12px 28px", background: "#fff", color: ac, border: "none", borderRadius: 10, fontSize: "0.9375rem", fontWeight: 800, cursor: "pointer", letterSpacing: ".02em", transition: "all .2s", boxShadow: "0 4px 16px rgba(0,0,0,.25)", width: isMobile ? "100%" : "auto" }}
            onMouseEnter={e => { e.currentTarget.style.opacity = ".9"; e.currentTarget.style.transform = "scale(1.04)"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}>
            Lihat Detail &amp; Konsultasi
          </button>
          <button onClick={() => onWaOpen && onWaOpen({ key: "paket", vars: { judul_paket: svc.title } })}
            style={{ padding: "12px 24px", background: "#25d366", color: "#fff", borderRadius: 10, fontSize: "0.9375rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "none", transition: "opacity .2s", width: isMobile ? "100%" : "auto" }}
            onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            &#128172; WhatsApp Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── WIDE CARD for Custom Package — full width horizontal layout ── */
/* ─────────────── EVENT / WEDDING PACKAGE CARD (Traveling-style) ─────────────── */
function EventWeddingPackageCard({ svc, onDetail, onWaOpen, isWide, categoryPackages = [] }) {
  const [hovered, setHovered] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [openPkgIdx, setOpenPkgIdx] = useState(null);
  const isMobile = useIsMobile();
  const ac = svc.accent || (svc.category === "wedding" ? "#db2777" : "#8B6914");
  const al = svc.accentLight || (svc.category === "wedding" ? "#fff0f7" : "#FAF7F0");
  const fmt = n => {
    if (!n) return n;
    const str = String(n);
    if (str.toLowerCase().includes("hubungi")) return str;
    const num = Number(str.replace(/[^0-9]/g, ""));
    return isNaN(num) || num === 0 ? str : num.toLocaleString("id-ID");
  };
  // Semua paket dalam kategori untuk dropdown (exclude custom, termasuk diri sendiri)
  const allCatPkgs = categoryPackages.filter(s => s.pkgId !== "custom");

  /* image gallery — pakai images[] jika ada, fallback image */
  const imgs = (svc.images && svc.images.length > 0) ? svc.images : [svc.image].filter(Boolean);
  const [imgIdx, setImgIdx] = useState(0);

  if (isWide) {
    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: "#fff", borderRadius: 16, overflow: "visible",
          boxShadow: hovered ? "0 20px 56px rgba(13,59,102,.2)" : "0 4px 24px rgba(13,59,102,.1)",
          border: `2px solid ${hovered ? ac : svc.highlight ? ac + "80" : "#e8f4f8"}`,
          fontFamily: "'DM Sans',sans-serif", transition: "all .3s cubic-bezier(.22,1,.36,1)",
          transform: hovered ? "translateY(-4px)" : "none",
          display: "flex", flexDirection: isMobile ? "column" : "row",
          minHeight: isMobile ? "auto" : 260,
        }}>
        {/* Gambar kiri full height */}
        <div onClick={onDetail} style={{ position: "relative", width: isMobile ? "100%" : "40%", height: isMobile ? 210 : "auto", flexShrink: 0, overflow: "hidden", cursor: "pointer", borderRadius: isMobile ? "14px 14px 0 0" : "0" }}>
          <img decoding="async" loading="lazy" src={cld(imgs[imgIdx] || imgs[0])} alt={svc.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
              transition: "transform .5s", transform: hovered ? "scale(1.06)" : "scale(1)" }}
            onError={onImgError} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 60%, rgba(255,255,255,.1) 100%)" }} />
          {svc.badge && (
            <div style={{ position: "absolute", top: 14, left: 14, background: svc.badgeColor || ac, color: "#fff", borderRadius: 20, padding: "4px 14px", fontSize: "0.625rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>{svc.badge}</div>
          )}
          {svc.highlight && (
            <div style={{ position: "absolute", top: 14, right: 0, background: "linear-gradient(130deg,#2E3D3F,#8B6914)", color: "#fff", borderRadius: "20px 0 0 20px", padding: "4px 12px 4px 14px", fontSize: "0.625rem", fontWeight: 700 }}>Pilihan Utama</div>
          )}
          {/* Dots navigasi gambar */}
          {imgs.length > 1 && (
            <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
              {imgs.map((_, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); setImgIdx(i); }}
                  style={{ width: i === imgIdx ? 18 : 6, height: 6, borderRadius: 3, border: "none", background: i === imgIdx ? "#fff" : "rgba(255,255,255,.5)", cursor: "pointer", padding: 0, transition: "all .2s" }} />
              ))}
            </div>
          )}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "28px 16px 14px", background: "linear-gradient(to top, rgba(0,0,0,.7) 0%, transparent 100%)" }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 700, color: "#fff", lineHeight: 1.2, textShadow: "0 2px 12px rgba(0,0,0,.8)" }}>{svc.title}</h3>
          </div>
        </div>
        {/* Konten kanan */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ padding: "16px 20px 8px", display: "flex", gap: 14, flexWrap: "wrap" }}>
            {imgs.length > 1 && <span style={{ fontSize: "0.8125rem", color: "#5A6A6C" }}>{imgs.length} Foto Kegiatan</span>}
            <span style={{ fontSize: "0.8125rem", color: "#5A6A6C" }}>{svc.category === "wedding" ? "Interior" : "Exterior"}</span>
          </div>
          <p style={{ fontSize: "0.875rem", color: "#5A6A6C", lineHeight: 1.65, padding: "0 20px 12px" }}>{svc.description}</p>
          {(svc.features || []).length > 0 && (
            <div style={{ padding: "0 20px 14px", display: "flex", flexWrap: "wrap", gap: "5px 18px" }}>
              {(svc.features || []).slice(0, 4).map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  <span style={{ color: "#27ae60", fontWeight: 700, fontSize: "0.875rem" }}>✓</span>
                  <span style={{ fontSize: "0.8125rem", color: "#3D5254", fontWeight: 500, whiteSpace: "pre-wrap" }}>{f}</span>
                </div>
              ))}
              {(svc.features || []).length > 4 && <span style={{ fontSize: "0.75rem", color: "#8B6914", fontWeight: 600 }}>+{svc.features.length - 4} lainnya</span>}
            </div>
          )}
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "stretch", borderTop: "1px solid #edf5f8", flexDirection: "column" }}>
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px", background: `linear-gradient(135deg,#2E3D3F 0%,#3D5254 55%,${ac} 100%)`,
                position: "relative",
              }}>
              <div style={{ position: "absolute", right: -12, top: -12, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
              <div>
                <p style={{ color: "rgba(255,255,255,.65)", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 3 }}>Harga Mulai Dari</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.75rem", fontWeight: 900, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,.3)" }}>{(()=>{ const uPt=(svc.paketTypes||[]).find(pt=>pt.id===(svc.utamaTipeId||svc.paketTypes?.[0]?.id)); const rp=uPt?.price||svc.price; return formatRp(rp)||rp; })()}</span>
                  <span style={{ color: "rgba(255,255,255,.65)", fontSize: "0.75rem" }}>{svc.priceNote}</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", flexShrink: 0, gap: 0 }}>
                <button onClick={e => { e.stopPropagation(); onWaOpen && onWaOpen({ key: "paket", vars: { judul_paket: svc.title } }); }}
                  style={{ padding: "8px 20px", background: "#25D366", color: "#fff", border: "none", fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, borderBottom: "1px solid rgba(255,255,255,.2)" }}>
                  WA
                </button>
                <button onClick={e => { e.stopPropagation(); onDetail(); }}
                  style={{ padding: "8px 20px", background: `linear-gradient(135deg,#2E3D3F,${ac})`, color: "#fff", border: "none", fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer", transition: "opacity .2s" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                  Lihat Detail →
                </button>
              </div>
            </div>
            {/* Paket Pills -- selalu tampil */}
            {(svc.paketTypes||[]).length > 0 && (
              <div style={{ background: al, padding: "10px 20px 12px", borderTop: `1px solid ${ac}25` }}>
                <p style={{ fontSize: "0.5625rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: ac, marginBottom: 6 }}>Pilihan Paket</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {(svc.paketTypes||[]).map((pt) => {
                    const isUtama = pt.id === (svc.utamaTipeId || svc.paketTypes?.[0]?.id);
                    const isContact = String(pt.price || "").toLowerCase().includes("hubungi");
                    return (
                      <span key={pt.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 9px", borderRadius: 20, boxSizing: "border-box", border: `1.5px solid ${isUtama ? ac : ac + "40"}`, background: isUtama ? `${ac}12` : "#fff", fontSize: "0.6875rem", fontWeight: 600, color: "#2E3D3F", minWidth: 0, maxWidth: "100%", flexShrink: 1 }}>
                        {isUtama && <span style={{ fontSize: "0.4rem", fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", padding: "1px 5px", borderRadius: 8, background: "#E8C96A", color: "#2E3D3F", flexShrink: 0 }}>UTAMA</span>}
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pt.name}</span>
                        {pt.price && <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.625rem", fontWeight: 700, color: ac, flexShrink: 0 }}>{isContact ? "Konsultasi" : formatRp(pt.price) || pt.price}</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: "#fff", borderRadius: 16, overflow: "visible",
        boxShadow: hovered ? "0 16px 48px rgba(46,61,63,.18)" : "0 4px 20px rgba(13,59,102,.09)",
        border: `2px solid ${hovered ? ac : svc.highlight ? ac + "80" : "transparent"}`,
        fontFamily: "'DM Sans',sans-serif", transition: "all .3s cubic-bezier(.22,1,.36,1)",
        transform: hovered ? "translateY(-5px)" : "none", position: "relative" }}>

      {/* Hero image with overlay title */}
      <div onClick={onDetail} style={{ position: "relative", height: 190, overflow: "hidden", borderRadius: "14px 14px 0 0", cursor: "pointer" }}>
        <img decoding="async" loading="lazy" src={cld(imgs[imgIdx] || imgs[0])} alt={svc.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s", transform: hovered ? "scale(1.06)" : "scale(1)" }}
          onError={onImgError} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 35%,rgba(0,0,0,.65) 100%)" }} />
        {svc.badge && (
          <div style={{ position: "absolute", top: 12, left: 12, background: svc.badgeColor || ac, color: "#fff", borderRadius: 20, padding: "3px 12px", fontSize: "0.625rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>
            {svc.badge}
          </div>
        )}
        {svc.highlight && (
          <div style={{ position: "absolute", top: 12, right: 12, background: "linear-gradient(130deg,#2E3D3F,#8B6914)", color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: "0.625rem", fontWeight: 700 }}>Pilihan Utama</div>
        )}
        {/* Image thumbnails nav (if multiple) */}
        {imgs.length > 1 && (
          <div style={{ position: "absolute", bottom: 42, right: 10, display: "flex", gap: 4 }}>
            {imgs.map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setImgIdx(i); }}
                style={{ width: i === imgIdx ? 18 : 6, height: 6, borderRadius: 3, border: "none", background: i === imgIdx ? "#fff" : "rgba(255,255,255,.5)", cursor: "pointer", padding: 0, transition: "all .2s" }} />
            ))}
          </div>
        )}
        <div style={{ position: "absolute", bottom: 12, left: 14, right: 14 }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.0625rem", fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: 2, textShadow: "0 2px 12px rgba(0,0,0,.8), 0 1px 4px rgba(0,0,0,.6)" }}>{svc.title}</h3>
        </div>
      </div>

      {/* Info row: foto kegiatan count + category label */}
      <div style={{ padding: "10px 14px 0", display: "flex", gap: 14, flexWrap: "wrap" }}>
        {imgs.length > 1 && <span style={{ fontSize: "0.75rem", color: "#5A6A6C" }}>{imgs.length} Foto Kegiatan</span>}
        <span style={{ fontSize: "0.75rem", color: "#5A6A6C", textTransform: "capitalize" }}>
          {svc.category === "wedding" ? "Interior" : "Exterior"}
        </span>
      </div>

      {/* Description */}
      <p style={{ fontSize: "0.8125rem", color: "#5A6A6C", lineHeight: 1.6, padding: "8px 14px 10px" }}>{svc.description}</p>

      {/* Top features */}
      {(svc.features || []).length > 0 && (
        <div style={{ padding: "0 14px 12px" }}>
          {(svc.features || []).slice(0, 3).map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start", marginBottom: 5 }}>
              <span style={{ color: "#27ae60", fontWeight: 700, fontSize: "0.875rem", flexShrink: 0, marginTop: 1 }}>✓</span>
              <span style={{ fontSize: "0.75rem", color: "#3D5254", fontWeight: 500, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>{f}</span>
            </div>
          ))}
          {(svc.features || []).length > 3 && (
            <div style={{ fontSize: "0.6875rem", color: "#8B6914", fontWeight: 600, marginTop: 2 }}>+{svc.features.length - 3} fitur lainnya</div>
          )}
        </div>
      )}

      {/* Price block */}
      <div style={{
          background: `linear-gradient(135deg,#2E3D3F 0%,#3D5254 55%,${ac} 100%)`,
          padding: "14px 14px 16px", position: "relative",
          borderTop: "3px solid rgba(255,255,255,.15)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.18)",
          userSelect: "none",
        }}>
        <div style={{ position: "absolute", right: -16, top: -16, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
        <div>
          <p style={{ color: "rgba(255,255,255,.65)", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 3 }}>Harga Mulai Dari</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            {(() => {
              const utamaPt = (svc.paketTypes||[]).find(pt => pt.id === (svc.utamaTipeId || svc.paketTypes?.[0]?.id)); const rawPrice = utamaPt?.price || svc.price;
              const isContact = String(rawPrice || "").toLowerCase().includes("hubungi");
              return isContact ? (
                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>Hubungi Kami</span>
              ) : (
                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.1rem,4vw,1.5rem)", fontWeight: 900, color: "#fff", lineHeight: 1, textShadow: "0 2px 8px rgba(0,0,0,.3)" }}>{formatRp(rawPrice) || rawPrice}</span>
              );
            })()}
            <span style={{ color: "rgba(255,255,255,.65)", fontSize: "0.75rem" }}>{svc.priceNote}</span>
          </div>
        </div>
        <p style={{ color: "rgba(255,255,255,.45)", fontSize: "0.6rem", marginTop: 4, letterSpacing: ".04em" }}>Nego / Konsultasi dulu</p>
      </div>

      {/* Paket Pills -- tampil jika ada paketTypes */}
      {(svc.paketTypes||[]).length > 0 && (
        <div style={{ background: al, padding: "10px 14px 12px", borderLeft: `1px solid ${ac}25`, borderRight: `1px solid ${ac}25`, borderTop: `1px solid ${ac}20` }}>
          <p style={{ fontSize: "0.5625rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: ac, marginBottom: 6 }}>Pilihan Paket</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {(svc.paketTypes||[]).map((pt) => {
              const isUtama = pt.id === (svc.utamaTipeId || svc.paketTypes?.[0]?.id);
              const isContact = String(pt.price || "").toLowerCase().includes("hubungi");
              return (
                <span key={pt.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 9px", borderRadius: 20, boxSizing: "border-box", border: `1.5px solid ${isUtama ? ac : ac + "40"}`, background: isUtama ? `${ac}12` : "#fff", fontSize: "0.6875rem", fontWeight: 600, color: "#2E3D3F", minWidth: 0, maxWidth: "100%", flexShrink: 1 }}>
                  {isUtama && <span style={{ fontSize: "0.4rem", fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", padding: "1px 5px", borderRadius: 8, background: "#E8C96A", color: "#2E3D3F", flexShrink: 0 }}>UTAMA</span>}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pt.name}</span>
                  {pt.price && <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.625rem", fontWeight: 700, color: ac, flexShrink: 0 }}>{isContact ? "Konsultasi" : formatRp(pt.price) || pt.price}</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <div style={{ padding: "10px 12px 12px", background: al, borderLeft: `1px solid ${ac}25`, borderRight: `1px solid ${ac}25`, borderBottom: `1px solid ${ac}25`, borderRadius: "0 0 14px 14px", display: "flex", gap: 8 }}>
        <button
          onClick={() => onWaOpen && onWaOpen({ key: "paket", vars: { judul_paket: svc.title } })}
          style={{ flex: 1, padding: "10px 0", background: "#25D366", color: "#fff", border: "none", borderRadius: 8, fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          WA
        </button>
        <button onClick={onDetail}
          style={{ flex: 3, padding: "10px 0", background: `linear-gradient(135deg,#2E3D3F,${ac})`, color: "#fff", border: "none", borderRadius: 8, fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer", transition: "opacity .2s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
          Lihat Detail →
        </button>
      </div>
    </div>
  );
}

function TravelPackageCardWide({ svc, onDetail, onWaOpen }) {
  const [hovered, setHovered] = useState(false);
  const isMobile = useIsMobile();
  const ac = svc.accent || "#7c3aed";
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff", borderRadius: 18,
        overflow: "visible",
        boxShadow: hovered ? "0 20px 60px rgba(46,61,63,.18)" : "0 4px 24px rgba(46,61,63,.10)",
        border: `2px solid ${hovered ? ac : ac + "50"}`,
        transition: "all .3s cubic-bezier(.22,1,.36,1)",
        transform: hovered ? "translateY(-4px)" : "none",
        display: "flex", flexDirection: isMobile ? "column" : "row",
        minHeight: isMobile ? "auto" : 260,
        fontFamily: "'DM Sans',sans-serif",
      }}>
      {/* Image */}
      <div onClick={onDetail} style={{ position: "relative", width: isMobile ? "100%" : 340, height: isMobile ? 210 : "auto", flexShrink: 0, overflow: "hidden", cursor: "pointer" }}>
        <img decoding="async" loading="lazy" src={cld(svc.images?.[0] || svc.image)} alt={svc.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s", transform: hovered ? "scale(1.07)" : "scale(1)" }}
          onError={onImgError} />
        <div style={{ position: "absolute", inset: 0, background: isMobile ? "linear-gradient(180deg,transparent 40%,rgba(0,0,0,.4) 100%)" : "linear-gradient(90deg,transparent 60%,rgba(0,0,0,.35) 100%)" }} />
        {svc.badge && (
          <div style={{ position: "absolute", top: 14, left: 14, background: svc.badgeColor || ac, color: "#fff", borderRadius: 20, padding: "4px 14px", fontSize: "0.625rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>
            {svc.badge}
          </div>
        )}
      </div>
      {/* Content */}
      <div style={{ flex: 1, padding: isMobile ? "20px 18px 24px" : "28px 36px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 0 }}>
        <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 6 : 14, marginBottom: 10 }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? "1.4rem" : "1.75rem", fontWeight: 900, color: "#2E3D3F", lineHeight: 1.1, margin: 0 }}>{svc.title}</h2>
          <span style={{ fontSize: "0.75rem", background: ac + "18", color: ac, borderRadius: 20, padding: "4px 14px", fontWeight: 700, letterSpacing: ".05em" }}>{svc.tagline}</span>
        </div>
        <p style={{ fontSize: "0.9375rem", color: "#5A6A6C", lineHeight: 1.75, marginBottom: 18 }}>{svc.description}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
          {(svc.features || []).map((feat, i) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", background: "#f0f7fb", borderRadius: 8, padding: "5px 12px" }}>
              <span style={{ color: "#27ae60", fontWeight: 700, fontSize: "0.875rem" }}>✓</span>
              <span style={{ fontSize: "0.8125rem", color: "#3D5254", fontWeight: 500, whiteSpace: "pre-wrap" }}>{feat}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: isMobile ? "stretch" : "center", flexDirection: isMobile ? "column" : "row", gap: 12, flexWrap: "wrap" }}>
          <div style={{ marginBottom: isMobile ? 4 : 0 }}>
            <div style={{ fontSize: "0.625rem", color: "#5A6A6C", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 2 }}>Harga</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.5rem", fontWeight: 900, color: "#2E3D3F" }}>{(()=>{ const uPt=(svc.paketTypes||[]).find(pt=>pt.id===(svc.utamaTipeId||svc.paketTypes?.[0]?.id)); const rp=uPt?.price||svc.price; return formatRp(rp)||rp; })()}</div>
            <div style={{ fontSize: "0.6875rem", color: "#5A6A6C", fontStyle: "italic" }}>{svc.priceNote}</div>
          </div>
          <button onClick={onDetail}
            style={{ padding: "12px 28px", background: `linear-gradient(135deg,${ac},#8B6914)`, color: "#fff", border: "none", borderRadius: 10, fontSize: "0.9375rem", fontWeight: 700, cursor: "pointer", letterSpacing: ".03em", transition: "opacity .2s", width: isMobile ? "100%" : "auto" }}
            onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            Lihat Detail &amp; Konsultasi
          </button>
          <button onClick={() => onWaOpen && onWaOpen({ key: "paket", vars: { judul_paket: svc.title } })}
            style={{ padding: "12px 24px", background: "#25d366", color: "#fff", borderRadius: 10, fontSize: "0.9375rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "none", transition: "opacity .2s", width: isMobile ? "100%" : "auto" }}
            onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            WhatsApp Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}

function TravelPackageCard({ svc, onDetail, onWaOpen, isWide }) {
  const [openIdx, setOpenIdx] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const isMobile = useIsMobile();
  const ac = svc.accent || "#e8a020";
  const al = svc.accentLight || "#fff8e6";
  const fmt = n => {
    if (!n || isNaN(String(n).replace(/\./g, ""))) return n;
    return Number(String(n).replace(/\./g, "")).toLocaleString("id-ID");
  };

  // -- MODE WIDE (1 kolom): layout landscape -- gambar kiri full, konten kanan --
  if (isWide) {
    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: "#fff", borderRadius: 16, overflow: "visible",
          boxShadow: hovered ? "0 20px 56px rgba(13,59,102,.2)" : "0 4px 24px rgba(13,59,102,.1)",
          border: `2px solid ${hovered ? ac : svc.highlight ? ac + "80" : "#e8f4f8"}`,
          fontFamily: "'DM Sans',sans-serif", transition: "all .3s cubic-bezier(.22,1,.36,1)",
          transform: hovered ? "translateY(-4px)" : "none",
          display: "flex", flexDirection: isMobile ? "column" : "row",
          minHeight: isMobile ? "auto" : 280,
        }}>

        {/* Gambar kiri -- full height */}
        <div onClick={onDetail} style={{ position: "relative", width: isMobile ? "100%" : "42%", height: isMobile ? 210 : "auto", flexShrink: 0, overflow: "hidden", cursor: "pointer", borderRadius: isMobile ? "14px 14px 0 0" : "0" }}>
          <img decoding="async" loading="lazy" src={cld(svc.images?.[0] || svc.image)} alt={svc.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
              transition: "transform .5s", transform: hovered ? "scale(1.06)" : "scale(1)" }}
            onError={onImgError} />
          {/* Gradient overlay kanan */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 60%, rgba(255,255,255,.12) 100%)" }} />
          {/* Badge kiri atas */}
          {svc.badge && (
            <div style={{ position: "absolute", top: 14, left: 14, background: svc.badgeColor || ac, color: "#fff", borderRadius: 20, padding: "4px 14px", fontSize: "0.625rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>
              {svc.badge}
            </div>
          )}
          {svc.highlight && (
            <div style={{ position: "absolute", top: 14, right: 0, background: "linear-gradient(130deg,#2E3D3F,#8B6914)", color: "#fff", borderRadius: "20px 0 0 20px", padding: "4px 12px 4px 14px", fontSize: "0.625rem", fontWeight: 700 }}>Pilihan Utama</div>
          )}
          {/* Judul di atas gambar bawah kiri */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "32px 16px 16px", background: "linear-gradient(to top, rgba(0,0,0,.72) 0%, transparent 100%)" }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.25rem", fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: 3, textShadow: "0 2px 12px rgba(0,0,0,.8)" }}>{svc.title}</h3>
            {svc.tagline && <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,.85)", lineHeight: 1.4, textShadow: "0 1px 8px rgba(0,0,0,.7)" }}>{svc.tagline}</p>}
          </div>
        </div>

        {/* Konten kanan */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Info row */}
          <div style={{ padding: "18px 20px 8px", display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[`${svc.duration}`, `Min. ${svc.minPeserta} peserta`, ...(svc.destinations?.length ? [`${svc.destinations.length} Destinasi`] : [])].map(m => (
              <span key={m} style={{ fontSize: "0.8125rem", color: "#5A6A6C" }}>{m}</span>
            ))}
          </div>
          {/* Description */}
          <p style={{ fontSize: "0.875rem", color: "#5A6A6C", lineHeight: 1.65, padding: "0 20px 12px" }}>{svc.description}</p>
          {/* Facilities */}
          {(svc.facilities || []).length > 0 && (
            <div style={{ padding: "0 20px 14px", display: "flex", flexWrap: "wrap", gap: "6px 20px" }}>
              {(svc.facilities || []).slice(0, 4).map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 14 }}>{f.icon}</span>
                  <span style={{ fontSize: "0.8125rem", color: "#3D5254", fontWeight: 500 }}>{f.label}</span>
                </div>
              ))}
              {(svc.facilities || []).length > 4 && (
                <span style={{ fontSize: "0.75rem", color: "#8B6914", fontWeight: 600 }}>+{svc.facilities.length - 4} lainnya</span>
              )}
            </div>
          )}
          {/* Spacer */}
          <div style={{ flex: 1 }} />
          {/* Price + CTA bar di bawah */}
          <div style={{ display: "flex", alignItems: "stretch", borderTop: "1px solid #edf5f8" }}>
            {/* Price block */}
            <div style={{
                flex: 1, padding: "14px 20px",
                background: `linear-gradient(135deg,#2E3D3F 0%,#3D5254 55%,${ac} 100%)`,
                position: "relative",
              }}>
              <div style={{ position: "absolute", right: -12, top: -12, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
              <p style={{ color: "rgba(255,255,255,.65)", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 3 }}>Harga Mulai Dari</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexWrap: "wrap" }}>
                {(() => {
                  const utamaPt = (svc.paketTypes||[]).find(pt => pt.id === (svc.utamaTipeId || svc.paketTypes?.[0]?.id)); const rawPrice = utamaPt?.price || svc.price;
                  const isContact = String(rawPrice || "").toLowerCase().includes("hubungi");
                  const numericPrice = !isContact && rawPrice ? Number(String(rawPrice).replace(/[^0-9]/g, "")) : 0;
                  return isContact ? (
                    <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>Hubungi Kami</span>
                  ) : numericPrice > 0 ? (
                    <>
                      <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.8125rem", color: "rgba(255,255,255,.7)" }}>Rp</span>
                      <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.75rem", fontWeight: 700, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,.3)" }}>{fmt(rawPrice)}</span>
                      <span style={{ color: "rgba(255,255,255,.65)", fontSize: "0.75rem" }}>{svc.priceNote}</span>
                    </>
                  ) : (
                    <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 700, color: "rgba(255,255,255,.6)" }}>Hubungi Kami</span>
                  );
                })()}
              </div>
            </div>
            {/* CTA buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0, flexShrink: 0 }}>
              <button onClick={() => onWaOpen && onWaOpen({ key: "paket", vars: { judul_paket: svc.title } })}
                style={{ flex: 1, padding: "0 24px", background: "#25D366", color: "#fff", border: "none", fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, borderBottom: "1px solid rgba(255,255,255,.2)" }}>
                WA
              </button>
              <button onClick={onDetail}
                style={{ flex: 1, padding: "0 24px", background: `linear-gradient(135deg,#2E3D3F,${ac})`, color: "#fff", border: "none", fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer", transition: "opacity .2s" }}
                onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                Lihat Detail →
              </button>
            </div>
          </div>
          {/* Paket pills -- tampil jika ada paketTypes */}
          {(svc.paketTypes || []).length > 0 && (
            <div style={{ background: al, padding: "10px 20px 12px", borderTop: `1px solid ${ac}25` }}>
              <p style={{ fontSize: "0.5625rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: ac, marginBottom: 6 }}>Pilihan Paket</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {(svc.paketTypes || []).map((pt, i) => {
                  const isUtama = pt.id === (svc.utamaTipeId || svc.paketTypes?.[0]?.id);
                  const isContact = String(pt.price || "").toLowerCase().includes("hubungi");
                  return (
                    <span key={pt.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 9px", borderRadius: 20, boxSizing: "border-box", border: `1.5px solid ${isUtama ? ac : ac + "40"}`, background: isUtama ? `${ac}12` : "#fff", fontSize: "0.6875rem", fontWeight: 600, color: "#2E3D3F", minWidth: 0, maxWidth: "100%", flexShrink: 1 }}>
                      {isUtama && <span style={{ fontSize: "0.4rem", fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", padding: "1px 5px", borderRadius: 8, background: "#E8C96A", color: "#2E3D3F", flexShrink: 0 }}>UTAMA</span>}
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pt.name}</span>
                      {pt.price && <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.625rem", fontWeight: 700, color: ac, flexShrink: 0 }}>{isContact ? "Konsultasi" : formatRp(pt.price) || pt.price}</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -- MODE NORMAL (2 / 3 kolom): layout vertikal default --
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: "#fff", borderRadius: 16, overflow: "visible", boxShadow: hovered ? "0 16px 48px rgba(46,61,63,.18)" : "0 4px 20px rgba(13,59,102,.09)", border: `2px solid ${hovered ? ac : svc.highlight ? ac + "80" : "transparent"}`, fontFamily: "'DM Sans',sans-serif", transition: "all .3s cubic-bezier(.22,1,.36,1)", transform: hovered ? "translateY(-5px)" : "none", position: "relative" }}>

      {/* Hero image */}
      <div onClick={onDetail} style={{ position: "relative", height: 180, overflow: "hidden", borderRadius: "14px 14px 0 0", cursor: "pointer" }}>
        <img decoding="async" loading="lazy" src={cld(svc.images?.[0] || svc.image)} alt={svc.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s", transform: hovered ? "scale(1.06)" : "scale(1)" }}
          onError={onImgError} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 40%,rgba(0,0,0,.55) 100%)" }} />
        {svc.badge && (
          <div style={{ position: "absolute", top: 12, left: 12, background: svc.badgeColor || ac, color: "#fff", borderRadius: 20, padding: "3px 12px", fontSize: "0.625rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>
            {svc.badge}
          </div>
        )}
        {svc.highlight && (
          <div style={{ position: "absolute", top: 12, right: 12, background: "linear-gradient(130deg,#2E3D3F,#8B6914)", color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: "0.625rem", fontWeight: 700 }}>Pilihan Utama</div>
        )}
        <div style={{ position: "absolute", bottom: 12, left: 14, right: 14 }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.125rem", fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: 2, textShadow: "0 2px 12px rgba(0,0,0,.8), 0 1px 4px rgba(0,0,0,.6)" }}>{svc.title}</h3>
          {svc.tagline && <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,.9)", lineHeight: 1.4, textShadow: "0 1px 8px rgba(0,0,0,.75)" }}>{svc.tagline}</p>}
        </div>
      </div>

      {/* Info row */}
      <div style={{ padding: "12px 16px 0", display: "flex", gap: 14, flexWrap: "wrap" }}>
        {[`${svc.duration}`, `Min. ${svc.minPeserta} peserta`, ...(svc.destinations?.length ? [`${svc.destinations.length} Destinasi`] : [])].map(m => (
          <span key={m} style={{ fontSize: "0.75rem", color: "#5A6A6C" }}>{m}</span>
        ))}
      </div>

      {/* Description */}
      <p style={{ fontSize: "0.8125rem", color: "#5A6A6C", lineHeight: 1.6, padding: "8px 16px 10px" }}>{svc.description}</p>

      {/* Top facilities with icons */}
      {(svc.facilities || []).length > 0 && (
        <div style={{ padding: "0 16px 12px" }}>
          {(svc.facilities || []).slice(0, 3).map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 5 }}>
              <span style={{ fontSize: 13 }}>{f.icon}</span>
              <span style={{ fontSize: "0.75rem", color: "#3D5254", fontWeight: 500 }}>{f.label}</span>
            </div>
          ))}
          {(svc.facilities || []).length > 3 && (
            <div style={{ fontSize: "0.6875rem", color: "#8B6914", fontWeight: 600, marginTop: 2 }}>+{svc.facilities.length - 3} fasilitas lainnya</div>
          )}
        </div>
      )}

      {/* Price block */}
      <div style={{
          position: "relative",
          background: `linear-gradient(135deg,#2E3D3F 0%,#3D5254 50%,${ac} 100%)`,
          padding: "16px 16px 18px",
          borderTop: "3px solid rgba(255,255,255,.18)",
        }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent)" }} />
        <p style={{ color: "rgba(255,255,255,.65)", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 3 }}>Harga Mulai Dari</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          {(() => {
            const utamaPt = (svc.paketTypes||[]).find(pt => pt.id === (svc.utamaTipeId || svc.paketTypes?.[0]?.id)); const rawPrice = utamaPt?.price || svc.price;
            const isContact = String(rawPrice || "").toLowerCase().includes("hubungi");
            const numericPrice = !isContact && rawPrice ? Number(String(rawPrice).replace(/[^0-9]/g, "")) : 0;
            return isContact ? (
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.35rem", fontWeight: 700, color: "#fff", lineHeight: 1 }}>Hubungi Kami</span>
            ) : numericPrice > 0 ? (
              <>
                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.8125rem", color: "rgba(255,255,255,.7)" }}>Rp</span>
                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.75rem", fontWeight: 700, color: "#fff", lineHeight: 1, textShadow: "0 2px 8px rgba(0,0,0,.3)" }}>{fmt(rawPrice)}</span>
                <span style={{ color: "rgba(255,255,255,.65)", fontSize: "0.75rem" }}>{svc.priceNote}</span>
              </>
            ) : (
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.35rem", fontWeight: 700, color: "rgba(255,255,255,.6)", lineHeight: 1 }}>Hubungi Kami</span>
            );
          })()}
        </div>
        <p style={{ color: "rgba(255,255,255,.45)", fontSize: "0.6rem", marginTop: 4, letterSpacing: ".04em" }}>Nego / Konsultasi dulu</p>
      </div>

      {/* Paket Pills -- tampil jika ada paketTypes */}
      {(svc.paketTypes || []).length > 0 && (
        <div style={{ background: al, padding: "10px 14px 12px", borderLeft: `1px solid ${ac}25`, borderRight: `1px solid ${ac}25` }}>
          <p style={{ fontSize: "0.5625rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: ac, marginBottom: 6 }}>Pilihan Paket</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {(svc.paketTypes || []).map((pt) => {
              const isUtama = pt.id === (svc.utamaTipeId || svc.paketTypes?.[0]?.id);
              const isContact = String(pt.price || "").toLowerCase().includes("hubungi");
              return (
                <span key={pt.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 9px", borderRadius: 20, boxSizing: "border-box", border: `1.5px solid ${isUtama ? ac : ac + "40"}`, background: isUtama ? `${ac}12` : "#fff", fontSize: "0.6875rem", fontWeight: 600, color: "#2E3D3F", minWidth: 0, maxWidth: "100%", flexShrink: 1 }}>
                  {isUtama && <span style={{ fontSize: "0.4rem", fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", padding: "1px 5px", borderRadius: 8, background: "#E8C96A", color: "#2E3D3F", flexShrink: 0 }}>UTAMA</span>}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pt.name}</span>
                  {pt.price && <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.625rem", fontWeight: 700, color: ac, flexShrink: 0 }}>{isContact ? "Konsultasi" : formatRp(pt.price) || pt.price}</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <div style={{ padding: "12px 14px 14px", background: al, borderLeft: `1px solid ${ac}25`, borderRight: `1px solid ${ac}25`, borderBottom: `1px solid ${ac}25`, borderRadius: "0 0 14px 14px", display: "flex", gap: 8 }}>
        <button
          onClick={() => onWaOpen && onWaOpen({ key: "paket", vars: { judul_paket: svc.title } })}
          style={{ flex: 1, padding: "9px 0", background: "#25D366", color: "#fff", border: "none", borderRadius: 8, fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          WA
        </button>
        <button onClick={onDetail}
          style={{ flex: 3, padding: "9px 0", background: `linear-gradient(135deg,#2E3D3F,${ac})`, color: "#fff", border: "none", borderRadius: 8, fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer", transition: "opacity .2s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
          Lihat Detail →
        </button>
      </div>
    </div>
  );
}

/* ─────────────── TRAVEL DETAIL PRICE BLOCK (for service detail page) ─────────────── */
/* ─────────────── TRAVEL PACKAGE DETAIL MODAL ─────────────── */
function TravelPackageDetailModal({ svc, onClose, onWaOpen }) {
  const [destIdx, setDestIdx] = useState(0);
  const ac = svc.accent || "#e8a020";
  const al = svc.accentLight || "#fff8e6";
  const dest = (svc.destinations || [])[destIdx];

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", handleKey); };
  }, [onClose]);

  const SectionHead = ({ label, title }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <div style={{ width: 4, height: 26, background: `linear-gradient(to bottom,${ac},transparent)`, borderRadius: 2, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: "0.5625rem", letterSpacing: "3px", color: ac, fontWeight: 700, textTransform: "uppercase", marginBottom: 1 }}>{label}</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.0625rem", fontWeight: 800, color: "#2E3D3F" }}>{title}</div>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9500, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      {/* Backdrop */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(6,20,40,.72)", backdropFilter: "blur(5px)", animation: "tdFadeIn .2s ease" }} onClick={onClose} />

      {/* Modal Sheet */}
      <div style={{
        position: "relative", width: "100%", maxWidth: 900, maxHeight: "93vh",
        background: "#f4fbfd", borderRadius: "20px 20px 0 0",
        boxShadow: "0 -16px 80px rgba(6,20,40,.35)",
        display: "flex", flexDirection: "column",
        animation: "tdSlideUp .35s cubic-bezier(.22,1,.36,1)",
        overflow: "hidden",
      }}>

        {/* -- Header with hero image -- */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{ height: 200, position: "relative", overflow: "hidden" }}>
            <img decoding="async" loading="lazy" src={cld(svc.images?.[0] || svc.image)} alt={svc.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: .5 }}
              onError={e => { e.target.style.opacity = 0; }} />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg,#2E3D3Fee,${ac}bb)` }} />

            {/* Close */}
            <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.3)", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", zIndex: 2 }}>✕</button>

            {svc.badge && <div style={{ position: "absolute", top: 14, left: 14, background: svc.badgeColor || ac, color: "#fff", borderRadius: 20, padding: "4px 14px", fontSize: "0.5625rem", fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase" }}>★ {svc.badge}</div>}

            {/* Thumb strip */}
            {(svc.images?.length > 1) && (
              <div style={{ position: "absolute", bottom: 12, left: 20, display: "flex", gap: 6 }}>
                {svc.images.slice(0, 4).map((img, i) => (
                  <div key={i} style={{ width: 44, height: 32, borderRadius: 5, overflow: "hidden", border: `2px solid rgba(255,255,255,.4)`, flexShrink: 0, opacity: .85 }}>
                    <img decoding="async" loading="lazy" src={cld(img)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={onImgError} />
                  </div>
                ))}
              </div>
            )}

            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 24px 18px" }}>
              {svc.tagline && <div style={{ fontSize: "0.5625rem", color: "rgba(255,255,255,.72)", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 4 }}>{svc.tagline}</div>}
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.3rem,3vw,1.875rem)", fontWeight: 900, color: "#fff", marginBottom: 8, lineHeight: 1.1 }}>{svc.title}</h2>
              <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                {[`${svc.duration}`, `Min. ${svc.minPeserta} peserta`, svc.destinations?.length && `${svc.destinations.length} Destinasi`, `Mulai ${svc.price}`].filter(Boolean).map(m => (
                  <span key={m} style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,.85)", fontWeight: 500 }}>{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* -- Scrollable body -- */}
        <div style={{ flex: 1, overflowY: "auto", padding: "26px 24px 40px" }}>
          <p style={{ fontSize: "0.875rem", color: "#2a4a5e", lineHeight: 1.75, marginBottom: 28 }}>{svc.description}</p>

          {/* - Destinations - */}
          {(svc.destinations || []).length > 0 && (
            <section style={{ marginBottom: 30 }}>
              <SectionHead label="Destinasi Wisata" title="Itinerary Perjalanan" />

              {svc.destinations.length > 1 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  {svc.destinations.map((d, i) => (
                    <button key={i} onClick={() => setDestIdx(i)}
                      style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${i === destIdx ? ac : ac + "30"}`, background: i === destIdx ? ac : "#fff", color: i === destIdx ? "#fff" : ac, fontSize: "0.6875rem", fontWeight: 600, cursor: "pointer", transition: "all .2s", fontFamily: "'DM Sans',sans-serif" }}>
                      {d.no}. {d.name}
                    </button>
                  ))}
                </div>
              )}

              {dest && (
                <div style={{ background: "#fff", borderRadius: 13, overflow: "hidden", border: `1px solid ${ac}22`, boxShadow: `0 3px 16px ${ac}12` }}>
                  <div style={{ display: "flex", flexWrap: "wrap", minHeight: 200 }}>
                    <div style={{ width: "clamp(130px,34%,220px)", flexShrink: 0, position: "relative", overflow: "hidden", background: `linear-gradient(135deg,${ac}55,#c5e8f0)`, alignSelf: "stretch", minHeight: 200 }}>
                      <img decoding="async" loading="lazy" src={cld(dest.img)} alt={dest.name}
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        onLoad={e => { e.target.style.opacity = "1"; }}
                        onError={e => { e.target.style.opacity = "0"; }} />
                      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg,${ac}44,transparent)`, pointerEvents: "none" }} />
                      <div style={{ position: "absolute", top: 10, left: 10, background: ac, color: "#fff", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5625rem", fontWeight: 800, zIndex: 2 }}>{dest.no}</div>
                    </div>
                    <div style={{ flex: 1, padding: "16px 18px", minWidth: 180 }}>
                      <div style={{ fontSize: "0.5625rem", color: ac, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 3 }}>{dest.tag}</div>
                      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.9375rem", fontWeight: 800, color: "#2E3D3F", marginBottom: 4, lineHeight: 1.3 }}>{dest.title}</h3>
                      <div style={{ fontSize: "0.6875rem", color: "#5A6A6C", marginBottom: 7 }}>{dest.sub} &nbsp;·&nbsp; {dest.duration}</div>
                      <p style={{ fontSize: "0.78125rem", color: "#3a5266", lineHeight: 1.65, marginBottom: 9 }}>{dest.desc}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
                        {(dest.points || []).map((pt, pi) => (
                          <div key={pi} style={{ display: "flex", gap: 5, alignItems: "center", fontSize: "0.6875rem", color: "#2a4a5e" }}>
                            <span style={{ width: 4, height: 4, borderRadius: "50%", background: ac, flexShrink: 0, display: "inline-block" }} />
                            {pt}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* - Facilities - */}
          {(svc.facilities || []).length > 0 && (
            <section style={{ marginBottom: 30 }}>
              <SectionHead label="Yang Sudah Termasuk" title="Fasilitas Paket" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))", gap: 9 }}>
                {(svc.facilities || []).map((f, i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "13px 15px", border: `1px solid ${ac}18`, display: "flex", gap: 9, alignItems: "flex-start", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: ac, borderRadius: "10px 0 0 10px" }} />
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{f.icon}</span>
                    <div>
                      <div style={{ fontSize: "0.78125rem", fontWeight: 700, color: "#2E3D3F", marginBottom: 1 }}>{f.label}</div>
                      <div style={{ fontSize: "0.625rem", color: "#5A6A6C", lineHeight: 1.4 }}>{f.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* - Services - */}
          {(svc.services || []).length > 0 && (
            <section style={{ marginBottom: 30 }}>
              <SectionHead label="Sudah Termasuk" title="Layanan Kami" />
              <div style={{ background: al, borderRadius: 12, padding: "16px 18px", border: `1px solid ${ac}18` }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "7px 18px" }}>
                  {(svc.services || []).map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start", fontSize: "0.78125rem", color: "#1a3a50" }}>
                      <span style={{ color: "#27ae60", fontWeight: 800, fontSize: "0.875rem", flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span style={{ lineHeight: 1.5 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* - CTA - */}
          <div style={{ background: `linear-gradient(135deg,#2E3D3F,#3D5254 40%,${ac})`, borderRadius: 14, padding: "22px 24px", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,.8)", fontSize: "0.875rem", marginBottom: 16, lineHeight: 1.65 }}>Tertarik dengan paket ini? Hubungi kami untuk konsultasi gratis dan penawaran terbaik!</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => onWaOpen && onWaOpen({ key: "paket", vars: { judul_paket: `${svc.title} — ${svc.price} ${svc.priceNote}` } })}
                style={{ padding: "11px 28px", background: "#25D366", color: "#fff", border: "none", borderRadius: 8, fontSize: "0.875rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                WhatsApp Sekarang
              </button>
              <button onClick={onClose}
                style={{ padding: "11px 22px", background: "rgba(255,255,255,.14)", color: "#fff", border: "1.5px solid rgba(255,255,255,.3)", borderRadius: 8, fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tdFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes tdSlideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </div>
  );
}

/* ─────────────── ABOUT PAGE — Data Default (dipakai bila admin belum mengisi via Control Panel) ─────────────── */
const ABOUT_STATS_DEFAULT = [
  { num: "500+", label: "Klien Puas" },
  { num: "7+",   label: "Tahun Pengalaman" },
  { num: "100+", label: "Event Sukses" },
  { num: "24/7", label: "Layanan Support" },
];

const ABOUT_MISI_DEFAULT = [
  "Menghadirkan desain arsitektur yang fungsional, estetis, dan sesuai kebutuhan setiap klien",
  "Melaksanakan pembangunan dan renovasi dengan kualitas konstruksi terbaik serta tepat waktu",
  "Memberikan RAB yang transparan dan akurat sejak tahap perencanaan awal",
  "Berinovasi secara berkelanjutan dalam desain rumah, interior, dan eksterior",
  "Membangun kepercayaan jangka panjang bersama klien dan mitra melalui profesionalisme kerja",
];

const ABOUT_WHY_DEFAULT = [
  { icon: "", title: "Desain & RAB Terpadu", desc: "Kami merancang setiap detail hunian Anda — dari konsep arsitektur, gambar kerja, hingga RAB yang akurat — agar proses pembangunan berjalan transparan sejak awal." },
  { icon: "", title: "Interior", desc: "Transformasi ruang hidup Anda dengan desain interior profesional — dari konsep, pemilihan material, hingga pemasangan." },
  { icon: "", title: "Eksterior", desc: "Pagar, kanopi, aluminium, dan landscape yang mempercantik fasad dan halaman rumah Anda secara menyeluruh." },
  { icon: "", title: "Terpercaya & Aman", desc: "Kepercayaan klien adalah prioritas kami. Setiap proyek pembangunan dan renovasi dikerjakan dengan standar mutu dan keamanan tinggi." },
  { icon: "", title: "Pengalaman Bertahun-tahun", desc: "Didukung tim arsitek dan tukang berpengalaman yang telah menuntaskan ratusan proyek pembangunan dan renovasi di seluruh Indonesia." },
  { icon: "", title: "Layanan 24/7", desc: "Tim customer service kami siap membantu kapan saja, memastikan setiap pertanyaan dan kebutuhan proyek Anda terpenuhi." },
];

const ABOUT_LAYANAN_DEFAULT = [
  { icon: "", title: "Interior",     desc: "Desain interior modern, nyaman dan fungsional sesuai kebutuhan Anda.", img: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80", slug: "interior" },
  { icon: "", title: "Eksterior",    desc: "Desain eksterior menarik, kokoh dan estetis.",                          img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80", slug: "eksterior" },
  { icon: "", title: "Desain & RAB", desc: "Desain arsitektur lengkap dengan RAB yang akurat.",                     img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80", slug: "desain-rab" },
  { icon: "", title: "Landscape",    desc: "Taman indah dan asri yang menyatu dengan hunian Anda.",                 img: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80", slug: "landscape" },
  { icon: "", title: "Aluminium",    desc: "Kusen, pintu & jendela aluminium berkualitas tinggi.",                  img: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80", slug: "aluminium" },
  { icon: "", title: "Kanopi",       desc: "Kanopi kuat, modern dan tahan segala cuaca.",                           img: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&q=80", slug: "kanopi" },
];

/* ─────────────── ADV SECTION (puzzle + quote slideshow) ─────────────── */
function AdvSection({ data, navigateTo }) {
  const [advQ, setAdvQ] = useState(0);
  // useMemo: quotes array stabil, tidak re-create tiap render
  const safeQuotes = useMemo(() => {
    const quotes = (data.content.advQuote || "").split(/\n+/).filter(Boolean);
    return quotes.length ? quotes : [data.content.advQuote || ""];
  }, [data.content.advQuote]);
  useEffect(() => {
    if (safeQuotes.length < 2) return;
    const t = setInterval(() => setAdvQ(q => (q + 1) % safeQuotes.length), 4000);
    return () => clearInterval(t);
  }, [safeQuotes.length]);
  // puzzleImgs stabil (data.images tidak sering berubah, tapi tetap memoize)
  const puzzleImgs = useMemo(() => [
    data.images.gal[0] || data.images.hero[0],
    data.images.gal[1] || data.images.hero[1],
    data.images.gal[2] || data.images.hero[2],
    data.images.gal[3] || data.images.hero[3],
  ], [data.images.gal, data.images.hero]);
  return (
    <section className="section-md" style={{ background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", position: "relative", overflow: "hidden" }}>
      {/* Flare effects */}
      <div style={{ position: "absolute", top: "30%", right: "15%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(30,216,232,.32) 0%, transparent 70%)", pointerEvents: "none", filter: "blur(16px)" }} />
      <div style={{ position: "absolute", bottom: "10%", left: "5%", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(14,165,197,.25) 0%, transparent 70%)", pointerEvents: "none", filter: "blur(20px)" }} />
      <div className="adv2-grid">
        {/* KIRI: Teks clean */}
        <div>
          <div className="adv2-eyebrow">
            <div className="line" />
            <span>{data.content.advSub || "DEVELOPER & JASA PERUMAHAN"}</span>
          </div>
          <h2 className="adv2-title">{data.content.advTitle}</h2>

          {/* Quote slideshow */}
          <div className="adv2-quote-wrap">
            <span className="adv2-quote-item active">{safeQuotes[advQ]}</span>
          </div>
          {safeQuotes.length > 1 && (
            <div className="adv2-quote-dots">
              {safeQuotes.map((_, i) => (
                <button key={i} className={`adv2-qdot${advQ === i ? " on" : ""}`} onClick={() => setAdvQ(i)} />
              ))}
            </div>
          )}

          <div className="adv2-stats">
            {[
              { num: "500+", lbl: "Event Sukses" },
              { num: "1200+", lbl: "Klien Puas" },
              { num: `${new Date().getFullYear() - parseInt(data.content.foundingYear || "2026") || 0}+`, lbl: "Tahun" },
            ].map(s => (
              <div key={s.lbl} className="adv2-stat">
                <div className="num">{s.num}</div>
                <div className="lbl">{s.lbl}</div>
              </div>
            ))}
          </div>

          <div className="adv2-btns">
            {[
              { label: "Desain Rumah", key: "desainrab" },
              { label: "Interior", key: "interior" },
              { label: "Taman & Landscape", key: "landscape" },
            ].map(item => (
              <button key={item.key} className="adv2-btn-pill" onClick={() => navigateTo(item.key)}>
                {item.label}
              </button>
            ))}
          </div>

          <button className="adv2-cta" onClick={() => navigateTo("services")}>
            Layanan Kami
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>

        {/* KANAN: Puzzle grid gambar */}
        <div className="adv2-puzzle">
          <div className="adv2-puzzle-a">
            <img decoding="async" loading="lazy" src={cld(puzzleImgs[0])} alt="Destinasi" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
          </div>
          <div className="adv2-puzzle-b">
            <img decoding="async" loading="lazy" src={cld(puzzleImgs[1])} alt="Destinasi" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
          </div>
          <div className="adv2-puzzle-c">
            <div className="adv2-puzzle-c-sm">
              <img decoding="async" loading="lazy" src={cld(puzzleImgs[2])} alt="Destinasi" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
            </div>
            <div className="adv2-puzzle-c-sm">
              <img decoding="async" loading="lazy" src={cld(puzzleImgs[3])} alt="Destinasi" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── HOME INTRO SLIDESHOW (panel kiri beranda) ─────────────── */
function HomeIntroSlideshow({ data }) {
  // useMemo: allImgs hanya dihitung ulang jika data.posts atau data.images berubah
  // Tanpa useMemo, array baru dibuat tiap render → useEffect trigger → timer reset → kedip
  const allImgs = useMemo(() => {
    const seen = new Set();
    const imgs = [];
    const add = (src, label = "") => {
      if (src && typeof src === "string" && src.startsWith("http") && !seen.has(src)) {
        seen.add(src);
        imgs.push({ src, label });
      }
    };
    // Foto Postingan Artikel -- semua seksi
    ["news", "shop", "destinations"].forEach(sec => {
      (data.posts?.[sec] || []).forEach(p => {
        const firstImg = (p.content || []).find(b => b.type === "image" && b.value);
        add(firstImg?.value || p.coverImage, p.title);
      });
    });
    // Fallback ke hero images jika belum ada foto sama sekali
    if (imgs.length === 0) {
      (data.images?.hero || []).forEach(src => add(src, "Hero"));
    }
    return imgs;
  }, [data.posts, data.images]);

  const [cur, setCur] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (allImgs.length <= 1) return;
    timerRef.current = setInterval(() => setCur(c => (c + 1) % allImgs.length), 3500);
    return () => clearInterval(timerRef.current);
  }, [allImgs.length]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 380, overflow: "hidden", background: "#2E3D3F" }}>
      <style>{`@keyframes introImgSlide { from { opacity:0; transform:scale(1.05); } to { opacity:1; transform:scale(1); } }`}</style>
      {allImgs.map((img, i) => (
        i === cur ? (
          <img decoding="async" loading="lazy" key={i} src={cld(img.src)} alt={img.label}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", animation: "introImgSlide .7s cubic-bezier(.22,1,.36,1) both", zIndex: 1 }}
            onError={e => { e.target.style.opacity = "0"; }} />
        ) : null
      ))}
      {/* Counter */}
      <div style={{ position: "absolute", top: 12, right: 16, zIndex: 4, background: "rgba(0,0,0,.38)", backdropFilter: "blur(6px)", borderRadius: 20, padding: "3px 10px", fontSize: "0.625rem", color: "rgba(255,255,255,.8)", fontWeight: 600, letterSpacing: ".06em" }}>
        {String(cur + 1).padStart(2,"0")} / {String(allImgs.length).padStart(2,"0")}
      </div>
      {/* Dot indicators */}
      {allImgs.length > 1 && (
        <div style={{ position: "absolute", bottom: 48, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5, zIndex: 3, flexWrap: "wrap", justifyContent: "center", maxWidth: "80%" }}>
          {allImgs.slice(0, 12).map((_, i) => (
            <div key={i} onClick={() => setCur(i)}
              style={{ width: i === cur ? 16 : 5, height: 5, borderRadius: 3, background: i === cur ? "#E8C96A" : "rgba(255,255,255,.4)", cursor: "pointer", transition: "all .3s ease" }} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────── HERO SLIDESHOW ─────────────── */
/* ════════════════════════════════════════════════════════
   LENS FLARE EFFECT — interaktif mengikuti mouse
════════════════════════════════════════════════════════ */
/* Efek berat (kanvas + rAF) hanya di perangkat desktop yang kuat; dimatikan di mode lite / sentuh / koneksi lambat. */
function LensFlareEffect() {
  const [on] = useState(() => !shouldUseLiteMode() && isFinePointer());
  return on ? <LensFlareEffectImpl /> : null;
}

function WaterDropsEffect() {
  const [on] = useState(() => !shouldUseLiteMode());
  return on ? <WaterDropsEffectImpl /> : null;
}

function LensFlareEffectImpl() {
  const canvasRef = useRef(null);
  const mouseRef  = useRef({ x: 0.5, y: 0.35 });
  const targetRef = useRef({ x: 0.5, y: 0.35 });
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      const cx = (e.clientX ?? e.touches?.[0]?.clientX) - r.left;
      const cy = (e.clientY ?? e.touches?.[0]?.clientY) - r.top;
      targetRef.current = { x: cx / r.width, y: cy / r.height };
    };
    canvas.parentElement.addEventListener("mousemove", onMove);
    canvas.parentElement.addEventListener("touchmove", onMove, { passive: true });

    const FLARES = [
      { offset: 0.0,  radius: 0.22, alpha: 0.55, color: [255,230,160] },
      { offset: 0.18, radius: 0.06, alpha: 0.35, color: [255,220,120] },
      { offset: 0.32, radius: 0.09, alpha: 0.22, color: [200,180,255] },
      { offset: 0.50, radius: 0.14, alpha: 0.18, color: [255,255,220] },
      { offset: 0.65, radius: 0.04, alpha: 0.45, color: [255,200,100] },
      { offset: 0.80, radius: 0.07, alpha: 0.20, color: [180,220,255] },
      { offset: 1.00, radius: 0.10, alpha: 0.15, color: [255,240,200] },
    ];

    const drawFlare = (cx, cy, r, alpha, color) => {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0,   `rgba(${color.join(",")},${alpha})`);
      g.addColorStop(0.4, `rgba(${color.join(",")},${alpha * 0.4})`);
      g.addColorStop(1,   `rgba(${color.join(",")},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawStreak = (sx, sy, ex, ey, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      const g = ctx.createLinearGradient(sx, sy, ex, ey);
      g.addColorStop(0,   "rgba(255,240,180,0)");
      g.addColorStop(0.5, "rgba(255,240,180,0.6)");
      g.addColorStop(1,   "rgba(255,240,180,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.restore();
    };

    const loop = () => {
      const m = mouseRef.current;
      const t = targetRef.current;
      // ease lerp
      m.x += (t.x - m.x) * 0.06;
      m.y += (t.y - m.y) * 0.06;

      const w = canvas.width;
      const h = canvas.height;
      const ox = m.x * w;
      const oy = m.y * h;
      const cx2 = w / 2;
      const cy2 = h / 2;
      const dx  = cx2 - ox;
      const dy  = cy2 - oy;

      ctx.clearRect(0, 0, w, h);

      // streak line
      drawStreak(ox - dx * 1.8, oy - dy * 1.8, ox + dx * 1.8, oy + dy * 1.8, 0.18);

      FLARES.forEach(f => {
        const fx = ox + dx * f.offset * 2;
        const fy = oy + dy * f.offset * 2;
        const fr = f.radius * Math.min(w, h);
        drawFlare(fx, fy, fr, f.alpha, f.color);
      });

      // bright core
      drawFlare(ox, oy, Math.min(w, h) * 0.05, 0.9, [255, 255, 240]);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      canvas.parentElement?.removeEventListener("mousemove", onMove);
      canvas.parentElement?.removeEventListener("touchmove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        pointerEvents: "none",
        zIndex: 16,
        mixBlendMode: "screen",
      }}
    />
  );
}

/* ════════════════════════════════════════════════════════
   WATER DROPS EFFECT — tetesan air interaktif
════════════════════════════════════════════════════════ */
function WaterDropsEffectImpl() {
  const canvasRef = useRef(null);
  const dropsRef  = useRef([]);
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    /* Spawn click/tap drop */
    const spawnDrop = (cx, cy) => {
      dropsRef.current.push({
        x: cx, y: cy,
        r: 0, maxR: 80 + Math.random() * 80,
        alpha: 0.7,
        speed: 1.4 + Math.random() * 1.2,
        ripples: [],
      });
    };

    const onClick = (e) => {
      const r = canvas.getBoundingClientRect();
      spawnDrop(
        (e.clientX ?? e.touches?.[0]?.clientX) - r.left,
        (e.clientY ?? e.touches?.[0]?.clientY) - r.top,
      );
    };
    canvas.parentElement.addEventListener("click",     onClick);
    canvas.parentElement.addEventListener("touchstart", onClick, { passive: true });

    /* Auto-spawn random drops */
    const autoSpawn = () => {
      if (dropsRef.current.length < 12) {
        const w = canvas.width;
        const h = canvas.height;
        spawnDrop(
          Math.random() * w,
          Math.random() * h * 0.7,
        );
      }
    };
    const autoTimer = setInterval(autoSpawn, 1200);

    const drawDrop = (d) => {
      if (d.alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = d.alpha;

      // outer ring
      ctx.strokeStyle = `rgba(180,220,255,${d.alpha})`;
      ctx.lineWidth   = 1.8;
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, d.r, d.r * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();

      // inner shimmer
      if (d.r > 10) {
        ctx.strokeStyle = `rgba(255,255,255,${d.alpha * 0.5})`;
        ctx.lineWidth   = 0.8;
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, d.r * 0.55, d.r * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // highlight dot at top
      const hg = ctx.createRadialGradient(d.x, d.y - d.r * 0.3, 0, d.x, d.y - d.r * 0.3, d.r * 0.18);
      hg.addColorStop(0, `rgba(255,255,255,${d.alpha * 0.9})`);
      hg.addColorStop(1, `rgba(255,255,255,0)`);
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.arc(d.x, d.y - d.r * 0.3, d.r * 0.18, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const loop = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      dropsRef.current = dropsRef.current.filter(d => d.alpha > 0.02);

      dropsRef.current.forEach(d => {
        d.r     += d.speed;
        d.alpha -= d.speed / d.maxR * 0.85;
        if (d.alpha < 0) d.alpha = 0;
        drawDrop(d);
      });

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(autoTimer);
      window.removeEventListener("resize", resize);
      canvas.parentElement?.removeEventListener("click",     onClick);
      canvas.parentElement?.removeEventListener("touchstart", onClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        pointerEvents: "none",
        zIndex: 17,
        mixBlendMode: "screen",
      }}
    />
  );
}

const HERO_TRANSITIONS = ["fade", "slideLeft", "slideUp", "zoomIn", "zoomOut", "flipX"];

function HeroSlideshow({ data, navigateTo }) {
  const heroMode = data.content?.heroMode || "video";
  /* Skeleton loading: lacak src foto hero yang sudah pernah selesai dimuat,
     supaya shimmer cuma tampil sekali per foto (bukan tiap kali slide berulang). */
  const [heroLoadedSrcs, setHeroLoadedSrcs] = useState(() => new Set());
  const markHeroLoaded = (src) => setHeroLoadedSrcs(prev => prev.has(src) ? prev : new Set(prev).add(src));

  // -- Compute slides -- useMemo agar tidak re-create array tiap render (penyebab kedip) --
  const slides = useMemo(() => {
    const result = [];
    const seenSrc = new Set();
    const addSlide = (src, title, section, excerpt) => {
      if (!src || seenSrc.has(src)) return;
      seenSrc.add(src);
      result.push({ src, title, section, excerpt: excerpt || "" });
    };
    ["news", "shop", "destinations"].forEach(sec => {
      (data.posts?.[sec] || []).filter(p => p.status === "published").forEach(p => {
        const firstImageBlock = (p.content || []).find(b => b.type === "image" && b.value);
        const src = firstImageBlock?.value || p.coverImage;
        addSlide(src, p.title, sec, p.excerpt || "");
      });
    });
    if (result.length === 0) {
      (data.images?.hero || []).forEach(src => {
        addSlide(src, data.content.heroTitle, "home", data.content.heroSub);
      });
    }
    return result;
  }, [data.posts, data.images, data.content.heroTitle, data.content.heroSub]);

  // -- ALL HOOKS must come before any conditional return (Rules of Hooks) --
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null);
  const [anim, setAnim] = useState("fade");
  const animatingRef = useRef(false);
  const timerRef = useRef(null);
  const currentRef = useRef(0);
  const slidesLen = slides.length;
  const slidesLenRef = useRef(slidesLen);
  slidesLenRef.current = slidesLen;

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    if (slidesLenRef.current < 2) return;
    timerRef.current = setInterval(() => {
      if (animatingRef.current) return;
      const randomAnim = HERO_TRANSITIONS[Math.floor(Math.random() * HERO_TRANSITIONS.length)];
      const nextIdx = (currentRef.current + 1) % slidesLenRef.current;
      setAnim(randomAnim);
      setPrev(currentRef.current);
      animatingRef.current = true;
      setTimeout(() => {
        setCurrent(nextIdx);
        currentRef.current = nextIdx;
        setPrev(null);
        animatingRef.current = false;
      }, 700);
    }, 4500);
  }, []);

  const goTo = useCallback((idx) => {
    if (animatingRef.current || slidesLenRef.current < 2) return;
    const randomAnim = HERO_TRANSITIONS[Math.floor(Math.random() * HERO_TRANSITIONS.length)];
    setAnim(randomAnim);
    setPrev(currentRef.current);
    animatingRef.current = true;
    setTimeout(() => {
      setCurrent(idx);
      currentRef.current = idx;
      setPrev(null);
      animatingRef.current = false;
      startTimer();
    }, 700);
  }, [startTimer]);

  /* -- Swipe touch: hero paling atas & paling sering dilihat pertama kali,
     jadi wajib bisa digeser jari seperti slideshow lain di situs ini. -- */
  const goToDelta = useCallback((dir) => {
    if (animatingRef.current || slidesLenRef.current < 2) return;
    const next = (currentRef.current + dir + slidesLenRef.current) % slidesLenRef.current;
    goTo(next);
  }, [goTo]);
  const heroTouchRef = useRef({ down: false, startX: 0, moved: false });
  const onHeroTouchStart = (e) => {
    if (slidesLen < 2) return;
    heroTouchRef.current = { down: true, startX: e.touches[0].clientX, moved: false };
  };
  const onHeroTouchMove = (e) => {
    if (!heroTouchRef.current.down) return;
    if (Math.abs(e.touches[0].clientX - heroTouchRef.current.startX) > 4) heroTouchRef.current.moved = true;
  };
  const onHeroTouchEnd = (e) => {
    if (!heroTouchRef.current.down || slidesLen < 2) return;
    const dx = e.changedTouches[0].clientX - heroTouchRef.current.startX;
    heroTouchRef.current.down = false;
    if (Math.abs(dx) > 40) goToDelta(dx < 0 ? 1 : -1);
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer, slidesLen]);

  // -- Conditional renders AFTER all hooks --

  // MODE STATIC: tampilkan satu gambar diam
  if (heroMode === "static") {
    const staticSrc = data.content?.heroStaticImage || (data.images?.hero?.[0] || "");
    return (
      <section style={{ position: "relative", width: "100%", height: "clamp(560px,88vh,800px)", overflow: "hidden", background: "#04080f" }}>
        {staticSrc && (
          <>
            {!heroLoadedSrcs.has(staticSrc) && <div className="img-skeleton img-skeleton-dark" />}
            <img decoding="async" src={cld(staticSrc)} alt="Hero" loading="eager"
              onLoad={() => markHeroLoaded(staticSrc)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: heroLoadedSrcs.has(staticSrc) ? 1 : 0, transition: "opacity .4s ease" }} />
          </>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,20,35,.35) 0%, rgba(10,20,35,.78) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6%", textAlign: "center" }}>
          <div style={{ maxWidth: 780 }}>
            <div style={{ display: "inline-block", background: "#e8a020", color: "#fff", fontSize: "0.6875rem", fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 2, marginBottom: 18 }}>
              HIKIMORI CONST
            </div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.75rem,4.2vw,2.8rem)", fontWeight: 900, color: "#fff", lineHeight: 1.18, marginBottom: 18, textShadow: "0 2px 16px rgba(0,0,0,.5)" }}>
              {data.content?.heroTitle || "Developer Perumahan & Jasa Desain"}
            </h1>
            {data.content?.heroSub && (
              <p style={{
                fontSize: "0.9375rem",
                color: "rgba(255,255,255,.82)",
                lineHeight: 1.8,
                marginBottom: 32,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                maxHeight: "5.4em",
              }}>
                {data.content.heroSub.length > 160 ? data.content.heroSub.slice(0, 160) + "…" : data.content.heroSub}
              </p>
            )}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <button onClick={() => navigateTo("services")} style={{ padding: "13px 30px", background: "#e8a020", color: "#fff", border: "none", borderRadius: 3, fontSize: "0.8125rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer" }}>Read More →</button>
              <button onClick={() => navigateTo("about")} style={{ padding: "13px 30px", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", color: "#fff", border: "2px solid rgba(255,255,255,.55)", borderRadius: 3, fontSize: "0.8125rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer" }}>About Us →</button>
            </div>
          </div>
        </div>
        {/* Side gradients */}
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "18%", background: "linear-gradient(to right, rgba(4,8,15,.82) 0%, rgba(4,8,15,0) 100%)", zIndex: 15, pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "18%", background: "linear-gradient(to left, rgba(4,8,15,.82) 0%, rgba(4,8,15,0) 100%)", zIndex: 15, pointerEvents: "none" }} />
        <LensFlareEffect />
        <WaterDropsEffect />
      </section>
    );
  }

  // MODE SLIDESHOW
  if (slides.length === 0) return null;

  const SECTION_LABEL = { news: "Exterior", shop: "Gedung & Rumah", destinations: "Interior", home: "Gedung & Properti" };

  const getEnterStyle = (a) => {
    const base = { position: "absolute", inset: 0, transition: "all 0.7s cubic-bezier(.77,0,.18,1)", zIndex: 2 };
    if (!animating) return { ...base, opacity: 1, transform: "none" };
    const map = {
      fade:      { opacity: 0, transform: "none" },
      slideLeft: { opacity: 0, transform: "translateX(80px)" },
      slideUp:   { opacity: 0, transform: "translateY(60px)" },
      zoomIn:    { opacity: 0, transform: "scale(1.12)" },
      zoomOut:   { opacity: 0, transform: "scale(0.88)" },
      flipX:     { opacity: 0, transform: "perspective(900px) rotateY(25deg)" },
    };
    return { ...base, ...(map[a] || map.fade) };
  };

  const getExitStyle = (a) => {
    const base = { position: "absolute", inset: 0, transition: "all 0.7s cubic-bezier(.77,0,.18,1)", zIndex: 1 };
    const map = {
      fade:      { opacity: 0 },
      slideLeft: { opacity: 0, transform: "translateX(-80px)" },
      slideUp:   { opacity: 0, transform: "translateY(-60px)" },
      zoomIn:    { opacity: 0, transform: "scale(0.88)" },
      zoomOut:   { opacity: 0, transform: "scale(1.12)" },
      flipX:     { opacity: 0, transform: "perspective(900px) rotateY(-25deg)" },
    };
    return { ...base, ...(map[a] || { opacity: 0 }) };
  };

  const sl = slides[current];
  const prevSl = prev !== null ? slides[prev] : null;
  const animating = prev !== null; // derived -- true selama transisi berlangsung

  return (
    <section className="hero-slideshow-section" style={{ position: "relative", width: "100%", height: "clamp(560px,88vh,800px)", overflow: "hidden", background: "#04080f", touchAction: slidesLen > 1 ? "pan-y" : "auto" }}
      onTouchStart={onHeroTouchStart} onTouchMove={onHeroTouchMove} onTouchEnd={onHeroTouchEnd}>
      <style>{`
        @keyframes heroTxtIn { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:none; } }
        @keyframes heroDotPulse { 0%,100%{transform:scale(1);opacity:.8;} 50%{transform:scale(1.3);opacity:1;} }
        @keyframes vertigoZoom { 0%{transform:scale(1.0);} 100%{transform:scale(1.08);} }
        @keyframes vertigoZoomOut { 0%{transform:scale(1.08);} 100%{transform:scale(1.0);} }
        .hero-slide-img-idle { animation: vertigoZoom 5s ease-in-out infinite alternate; transform-origin: center center; }
        .hero-slide-img-exit { animation: vertigoZoomOut 0.7s cubic-bezier(.77,0,.18,1) forwards; }
        .hero-slide-img-enter { animation: vertigoZoom 5s ease-in-out infinite alternate; }
        .hero-cta-btn { transition: all .22s !important; }
        .hero-cta-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 24px rgba(0,0,0,.35) !important; }
        .hero-dot { transition: all .3s; cursor: pointer; }
        .hero-dot:hover { transform: scale(1.3); }
        .hero-arrow { transition: all .2s; cursor: pointer; background: rgba(255,255,255,.12); border: 1.5px solid rgba(255,255,255,.25); color: #fff; border-radius: 50%; width: 44px; height: 44px; display:flex; align-items:center; justify-content:center; font-size:18px; }
        .hero-arrow:hover { background: rgba(255,255,255,.28); }
        @media (max-width: 768px) {
          .hero-slide-content-box { padding: 0 5% !important; }
          .hero-slide-title { font-size: clamp(1.2rem, 5vw, 1.75rem) !important; margin-bottom: 10px !important; -webkit-line-clamp: 2 !important; }
          .hero-slide-excerpt { font-size: 0.8125rem !important; line-height: 1.6 !important; margin-bottom: 18px !important; -webkit-line-clamp: 2 !important; max-height: 3.2em !important; }
          .hero-slide-btns { gap: 8px !important; }
          .hero-slide-btns button { padding: 10px 18px !important; font-size: 0.75rem !important; }
        }
        @media (max-width: 768px) and (orientation: landscape) {
          .hero-slideshow-section { height: 100vw !important; min-height: 280px !important; max-height: 400px !important; }
        }
      `}</style>

      {/* SLIDES */}
      <div style={{ position: "absolute", inset: 0 }}>
        {/* Prev slide (exit) */}
        {animating && prevSl && (
          <div style={getExitStyle(anim)}>
            <img decoding="async" loading="lazy" src={cld(prevSl.src)} alt="" className="hero-slide-img-exit" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,20,35,.5) 0%, rgba(10,20,35,.75) 100%)" }} />
          </div>
        )}
        {/* Current slide (enter) */}
        <div style={getEnterStyle(anim)}>
          {!heroLoadedSrcs.has(sl.src) && <div className="img-skeleton img-skeleton-dark" />}
          <img decoding="async" loading="eager" src={cld(sl.src)} alt={sl.title} className="hero-slide-img-idle"
            onLoad={() => markHeroLoaded(sl.src)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: heroLoadedSrcs.has(sl.src) ? 1 : 0, transition: "opacity .4s ease" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,20,35,.35) 0%, rgba(10,20,35,.78) 100%)" }} />
        </div>
      </div>

      {/* CONTENT OVERLAY -- rata tengah */}
      <div className="hero-slide-content-box" style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6%", textAlign: "center", overflow: "hidden" }}>
        <div style={{ maxWidth: 780, width: "100%", animation: animating ? "none" : "heroTxtIn .6s ease both" }} key={current}>
          {/* Label */}
          <div style={{ display: "inline-block", background: "#e8a020", color: "#fff", fontSize: "0.6875rem", fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 2, marginBottom: 18 }}>
            {SECTION_LABEL[sl.section] || "HIKIMORI CONST"}
          </div>
          {/* Title -- max 2 baris, potong sisanya */}
          <h1 className="hero-slide-title" style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: "clamp(1.75rem,4.2vw,2.8rem)",
            fontWeight: 900,
            color: "#fff",
            lineHeight: 1.18,
            marginBottom: 18,
            textShadow: "0 2px 16px rgba(0,0,0,.5)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {sl.title}
          </h1>
          {/* Excerpt */}
          {sl.excerpt && (
            <p className="hero-slide-excerpt" style={{
              fontSize: "0.9375rem",
              color: "rgba(255,255,255,.82)",
              lineHeight: 1.8,
              marginBottom: 32,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              maxHeight: "5.4em",
            }}>
              {sl.excerpt.length > 160 ? sl.excerpt.slice(0, 160) + "…" : sl.excerpt}
            </p>
          )}
          {/* CTA Buttons -- centered */}
          <div className="hero-slide-btns" style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button className="hero-cta-btn" onClick={() => navigateTo("services")}
              style={{ padding: "13px 30px", background: "#e8a020", color: "#fff", border: "none", borderRadius: 3, fontSize: "0.8125rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer" }}>
              Read More →
            </button>
            <button className="hero-cta-btn" onClick={() => navigateTo("about")}
              style={{ padding: "13px 30px", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", color: "#fff", border: "2px solid rgba(255,255,255,.55)", borderRadius: 3, fontSize: "0.8125rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer" }}>
              About Us →
            </button>
          </div>
        </div>
      </div>

      {/* == LENS FLARE EFFECT == */}
      <LensFlareEffect />

      {/* == WATER DROPS EFFECT == */}
      <WaterDropsEffect />

      {/* Side gradient overlays -- solid edge, fade to center */}
      <div className="hero-side-grad" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "18%", background: "linear-gradient(to right, rgba(4,8,15,.82) 0%, rgba(4,8,15,.45) 50%, rgba(4,8,15,0) 100%)", zIndex: 15, pointerEvents: "none" }} />
      <div className="hero-side-grad" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "18%", background: "linear-gradient(to left, rgba(4,8,15,.82) 0%, rgba(4,8,15,.45) 50%, rgba(4,8,15,0) 100%)", zIndex: 15, pointerEvents: "none" }} />

      {/* ARROWS */}
      <button className="hero-arrow" onClick={() => goTo((current - 1 + slides.length) % slides.length)}
        style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", zIndex: 20, background: "rgba(255,255,255,.12)", border: "1.5px solid rgba(255,255,255,.25)", color: "#fff", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer", transition: "all .2s" }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.28)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.12)"}>‹</button>
      <button className="hero-arrow" onClick={() => goTo((current + 1) % slides.length)}
        style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", zIndex: 20, background: "rgba(255,255,255,.12)", border: "1.5px solid rgba(255,255,255,.25)", color: "#fff", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer", transition: "all .2s" }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.28)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.12)"}>›</button>

      {/* DOTS */}
      <div style={{ position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)", zIndex: 20, display: "flex", gap: 8, alignItems: "center" }}>
        {slides.map((_, i) => (
          <div key={i} className="hero-dot" onClick={() => goTo(i)}
            style={{ width: i === current ? 28 : 10, height: 10, borderRadius: 5, background: i === current ? "#e8a020" : "rgba(255,255,255,.45)", transition: "all .3s" }} />
        ))}
      </div>

      {/* Slide counter */}
      <div style={{ position: "absolute", bottom: 22, right: "5%", zIndex: 20, fontSize: "0.75rem", color: "rgba(255,255,255,.5)", fontWeight: 600, letterSpacing: ".06em" }}>
        {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
      </div>
    </section>
  );
}

/* ─────────────── REVIEW SLIDESHOW (Home Page) ─────────────── */
function ReviewSlideshow({ reviews }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  const total = reviews.length;

  useEffect(() => {
    if (total < 2 || isPaused) return;
    intervalRef.current = setInterval(() => {
      setCurrent(p => (p + 1) % total);
    }, 4000);
    return () => clearInterval(intervalRef.current);
  }, [total, isPaused]);

  if (total === 0) return null;

  // Build visible indices: 6 cards centered around current
  // [-2, -1, 0, 1, 2, 3] offsets from current -- we show 6 cards
  // Cards at positions -2 and 3 are faded (gradient edges)
  const getOffset = (offset) => ((current + offset % total + total * 4) % total);

  const cardData = total === 1
    ? [{ review: reviews[0], pos: 0, opacity: 1, scale: 1, blur: 0, fade: false }]
    : total <= 3
    ? reviews.map((r, i) => {
        const dist = Math.min(Math.abs(i - current), total - Math.abs(i - current));
        return { review: r, pos: i - current, opacity: dist === 0 ? 1 : 0.6, scale: dist === 0 ? 1 : 0.93, blur: 0, fade: dist > 1 };
      }).filter(x => !x.fade)
    : (() => {
        // 6 positions: offsets -2,-1,0,1,2,3 but visual slots 0..5
        const slots = [-2, -1, 0, 1, 2, 3];
        return slots.map((offset, slotIdx) => {
          const ridx = getOffset(offset);
          const isFade = slotIdx === 0 || slotIdx === 5;
          const isEdge = slotIdx === 1 || slotIdx === 4;
          return {
            review: reviews[ridx],
            slotIdx,
            opacity: isFade ? 0.15 : isEdge ? 0.65 : 1,
            scale: isFade ? 0.88 : isEdge ? 0.94 : 1,
            fade: isFade,
          };
        });
      })();

  return (
    <section style={{ padding: "80px 0 72px", background: "linear-gradient(130deg,#084060 0%,#0a6ea0 50%,#0cb5cc 100%)", overflow: "hidden" }}>
      <style>{`
        @keyframes reviewIn { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:none; } }
        .rev-card { transition: transform .5s cubic-bezier(.22,1,.36,1), opacity .5s ease, box-shadow .3s; }
        .rev-card:hover { transform: translateY(-6px) !important; box-shadow: 0 20px 48px rgba(46,61,63,.14) !important; }
      `}</style>

      {/* Section Header */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "20%", right: "8%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(30,216,232,.28) 0%, transparent 65%)", filter: "blur(22px)" }} />
        <div style={{ position: "absolute", top: "50%", left: "3%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(14,165,197,.2) 0%, transparent 65%)", filter: "blur(26px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,.04) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      </div>
      <div style={{ textAlign: "center", marginBottom: 52, padding: "0 5%", position: "relative", zIndex: 1 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 32, height: 1.5, background: "#C9AA71" }} />
          <span style={{ fontSize: "0.6875rem", letterSpacing: "3px", color: "rgba(255,255,255,.7)", textTransform: "uppercase", fontWeight: 700 }}>Testimoni Klien</span>
          <div style={{ width: 32, height: 1.5, background: "#C9AA71" }} />
        </div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.75rem,4vw,2.75rem)", fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>
          Apa Kata Mereka?
        </h2>
        <p style={{ fontSize: "1rem", color: "rgba(255,255,255,.72)", marginTop: 12, maxWidth: 440, margin: "12px auto 0", lineHeight: 1.7 }}>
          Kepuasan klien adalah prioritas utama kami di setiap layanan.
        </p>
      </div>

      {/* Stars rating summary */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        {(() => {
          const avg = reviews.reduce((s, r) => s + (r.stars || 5), 0) / reviews.length;
          return (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 40, padding: "10px 24px", backdropFilter: "blur(8px)", boxShadow: "0 4px 16px rgba(0,0,0,.2)" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: 900, fontFamily: "'Playfair Display',serif", color: "#fff" }}>{avg.toFixed(1)}</span>
              <div style={{ display: "flex", gap: 2 }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 16, filter: s <= Math.round(avg) ? "none" : "grayscale(1) opacity(.3)" }}></span>)}
              </div>
              <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,.7)", fontWeight: 500 }}>{reviews.length} ulasan</span>
            </div>
          );
        })()}
      </div>

      {/* Cards Container */}
      <div style={{ position: "relative", width: "100%", overflow: "visible" }}
        onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>

        {/* 6-card row */}
        {total >= 4 ? (
          <div style={{ display: "flex", justifyContent: "center", gap: 16, padding: "20px 0", position: "relative" }}>
            {cardData.map(({ review, slotIdx, opacity, scale, fade }) => (
              <div key={`${slotIdx}-${review.id}`} className="rev-card"
                style={{
                  width: "calc(14% + 20px)", minWidth: 180, maxWidth: 240,
                  flexShrink: 0, opacity, transform: `scale(${scale})`,
                  pointerEvents: fade ? "none" : "auto",
                  position: "relative",
                }}>
                {/* Gradient mask for edge cards */}
                {fade && (
                  <div style={{ position: "absolute", inset: 0, zIndex: 2, borderRadius: 16,
                    background: slotIdx === 0
                      ? "linear-gradient(to right, rgba(244,249,251,1) 0%, rgba(244,249,251,0) 100%)"
                      : "linear-gradient(to left, rgba(244,249,251,1) 0%, rgba(244,249,251,0) 100%)",
                    pointerEvents: "none" }} />
                )}
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        ) : (
          /* Fewer cards: centered layout */
          <div style={{ display: "flex", justifyContent: "center", gap: 20, padding: "20px 5%", flexWrap: "wrap" }}>
            {reviews.map((review, i) => (
              <div key={review.id} className="rev-card"
                style={{ width: 280, flexShrink: 0, opacity: i === current ? 1 : 0.6, transform: i === current ? "scale(1)" : "scale(0.95)" }}>
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        )}

        {/* Navigation Arrows */}
        {total > 1 && (
          <>
            <button onClick={() => { setCurrent(p => (p - 1 + total) % total); }}
              style={{ position: "absolute", left: "2%", top: "50%", transform: "translateY(-50%)", zIndex: 10, width: 44, height: 44, borderRadius: "50%", background: "#fff", border: "1.5px solid #E8DCC8", boxShadow: "0 4px 16px rgba(13,59,102,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#2E3D3F", cursor: "pointer", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#2E3D3F"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#2E3D3F"; }}>‹</button>
            <button onClick={() => { setCurrent(p => (p + 1) % total); }}
              style={{ position: "absolute", right: "2%", top: "50%", transform: "translateY(-50%)", zIndex: 10, width: 44, height: 44, borderRadius: "50%", background: "#fff", border: "1.5px solid #E8DCC8", boxShadow: "0 4px 16px rgba(13,59,102,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#2E3D3F", cursor: "pointer", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#2E3D3F"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#2E3D3F"; }}>›</button>
          </>
        )}
      </div>

      {/* Dots */}
      {total > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 28 }}>
          {reviews.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              style={{ width: i === current ? 24 : 8, height: 8, borderRadius: 4, background: i === current ? "#C9AA71" : "rgba(255,255,255,.3)", border: "none", cursor: "pointer", transition: "all .3s", padding: 0 }} />
          ))}
        </div>
      )}
    </section>
  );
}

function ReviewCard({ review }) {
  const stars = review.stars || 5;
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "28px 24px", boxShadow: "0 4px 24px rgba(13,59,102,.08)", border: "1px solid #F5EDD8", height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stars */}
      <div style={{ display: "flex", gap: 3 }}>
        {[1,2,3,4,5].map(s => (
          <span key={s} style={{ fontSize: 14, filter: s <= stars ? "none" : "grayscale(1) opacity(.25)" }}></span>
        ))}
      </div>
      {/* Quote */}
      <p style={{ fontSize: "0.9rem", color: "#2E3D3F", lineHeight: 1.75, fontStyle: "italic", fontFamily: "'Cormorant Garamond',serif", flex: 1, whiteSpace: "pre-line" }}>
        "{review.content?.length > 180 ? review.content.slice(0, 180) + "…" : review.content}"
      </p>
      {/* Author */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 12, borderTop: "1px solid #f0f4f8" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 50%,#8B6914 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          {review.photo
            ? <img decoding="async" loading="lazy" src={cld(review.photo)} alt={review.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>{review.name?.charAt(0)?.toUpperCase() || "?"}</span>
          }
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#2E3D3F", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{review.name}</div>
          <div style={{ fontSize: "0.75rem", color: "#5A6A6C" }}>{review.date}</div>
        </div>
        {review.tokenLabel && (
          <div style={{ marginLeft: "auto", fontSize: "0.625rem", background: "#FAF7F0", color: "#8B6914", padding: "2px 8px", borderRadius: 10, fontWeight: 600, flexShrink: 0, maxWidth: 80, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{review.tokenLabel}</div>
        )}
      </div>
    </div>
  );
}

// --- Session persistence (sessionStorage) --------------------------
// Sesi bertahan saat reload, tapi otomatis bersih saat browser ditutup
// (di-hardcode juga — pola sama seperti FS_COLLECTION, supaya admin tidak ke-logout
//  tak terduga tiap deploy kalau env var-nya kebetulan tidak ter-set konsisten)
const SESSION_KEY = "re_session";

const sessionSave = (u) => {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(u)); } catch {}
};

const sessionLoad = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const sessionClear = () => {
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
};

/* ── Mapping URL pathname ↔ page key ─────────────────────────────────────── */
const PAGE_TO_PATH = {
  home: "/", about: "/about", news: "/portfolio", shop: "/renovasi-rumah-subsidi",
  destinations: "/wedding-organizer", services: "/layanan",
  desainrab: "/jasa-desain-rab",
  temarumah: "/tema-rumah",
  interior: "/interior",
  pagar: "/pagar-rumah",
  kanopi: "/kanopi",
  aluminium: "/aluminium",
  landscape: "/landscape-taman",
  kost: "/pembangunan-kost",
  cafe: "/pembangunan-cafe",
  ruko: "/pembangunan-ruko",
  furnitur: "/furnitur",
  promo: "/promo",
  "custom-furnitur": "/custom-furnitur",
  /* Sub-halaman Interior */
  "interior/kamar-tidur":    "/interior/kamar-tidur",
  "interior/kamar-mandi":    "/interior/kamar-mandi",
  "interior/ruang-keluarga": "/interior/ruang-keluarga",
  "interior/ruang-tamu":     "/interior/ruang-tamu",
  "interior/kitchen-set":    "/interior/kitchen-set",
  "interior/ruang-kerja":    "/interior/ruang-kerja",
  /* Sub-halaman Eksterior */
  "eksterior/pagar":         "/eksterior/pagar",
  "eksterior/kanopi":        "/eksterior/kanopi",
  "eksterior/kusen-partisi": "/eksterior/kusen-partisi",
  "eksterior/taman-landscape":"/eksterior/taman-landscape",
};

const PATH_TO_PAGE = Object.fromEntries(Object.entries(PAGE_TO_PATH).map(([k, v]) => [v, k]));

/* ── Mapping Control Panel: adminTab ↔ slug URL ───────────────────────────
   Setiap tab/menu di Control Panel punya slug URL sendiri, contoh:
   control-panel/plafon, control-panel/kamar-tidur, control-panel/backdrop
   dst. Sehingga setiap bagian bisa di-bookmark / dibagikan / dibuka langsung,
   dan tombol Back/Forward browser jalan sesuai bagian yang sedang dibuka. ── */
const ADMIN_TAB_TO_SLUG = {
  dashboard: "dashboard",
  messages: "pesan-masuk",
  profil: "profil",
  content: "konten-nav",
  set_layanankami: "setting-about",
  set_layanan: "setting-layanan",
  settings: "pengaturan-sistem",
  int_plafon: "plafon",
  int_kitchen_set: "kitchen-set",
  int_backdrop_tv: "backdrop",
  int_kamar_tidur: "kamar-tidur",
  int_kamar_mandi: "kamar-mandi",
  int_ruang_keluarga: "ruang-keluarga",
  int_ruang_tamu: "ruang-tamu",
  int_ruang_kerja: "ruang-kerja",
  ext_pagar: "pagar",
  ext_kanopi: "kanopi",
  ext_aluminium: "kusen-partisi",
  produk_furnitur: "furnitur",
  produk_custom_furnitur: "custom-furnitur",
  paket_landscape: "landscape",
  paket_rumahsubsidi: "rumah-subsidi",
  paket_kost: "pembangunan-kost",
  paket_cafe: "pembangunan-cafe",
  paket_ruko: "pembangunan-ruko",
  set_temarumah: "tema-rumah",
  reviews: "reviews",
  users: "users",
  backup: "backup",
  marketing: "marketing",
};

const ADMIN_SLUG_TO_TAB = Object.fromEntries(Object.entries(ADMIN_TAB_TO_SLUG).map(([k, v]) => [v, k]));

/** Bangun path URL /control-panel/<slug> dari sebuah adminTab id */
const adminTabToPath = (tab) => `/control-panel/${ADMIN_TAB_TO_SLUG[tab] || "dashboard"}`;

/** Ambil adminTab id dari path URL /control-panel/<slug> (default "dashboard") */
const adminSlugToTab = (slug) => ADMIN_SLUG_TO_TAB[slug] || "dashboard";

/* ── URL helper functions ─────────────────────────────────────────────────── */

/** Slug generator dari teks judul */
const makeSlug = (s) => String(s || "").toLowerCase()
  .replace(/[àáâãäå]/g, "a").replace(/[èéêë]/g, "e")
  .replace(/[ìíîï]/g, "i").replace(/[òóôõö]/g, "o")
  .replace(/[ùúûü]/g, "u")
  .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/**
 * URL canonical untuk artikel:
 * /artikel/{section}/{slug}-{id}
 */
const articleUrl = (post) => {
  const slug = post.slug || makeSlug(post.title);
  return `/artikel/${post.section || "news"}/${slug}-${post.id}`;
};

/**
 * URL canonical untuk paket layanan:
 * /services/{category}/{nama-paket}/{id}
 */
const paketUrl = (svc) => {
  const slug = makeSlug(svc.title);
  return `/services/${svc.category || "event"}/${slug}/${svc.id}`;
};

/** Parse URL /artikel/{section}/{slug}-{id} → { section, slug, id } atau null */
const parseArtikelPath = (path) => {
  const m = path.match(/^\/artikel\/([^/]+)\/(.+)-(\d+)$/);
  if (!m) return null;
  return { section: m[1], slug: m[2], id: Number(m[3]) };
};

/** Parse URL /services/{category}/{slug}/{id} → { category, slug, id } atau null */
const parsePaketPath = (path) => {
  const m = path.match(/^\/services\/([^/]+)\/([^/]+)\/(\d+)$/);
  if (!m) return null;
  return { category: m[1], slug: m[2], id: Number(m[3]) };
};

/** URL canonical untuk detail tema rumah: /tema-rumah/{slug} — dipakai untuk share link */
const temaDetailUrl = (slug) => `/tema-rumah/${slug}`;

/** Parse URL /tema-rumah/{slug} → slug, atau null kalau cuma landing "/tema-rumah" polos */
const parseTemaPath = (path) => {
  const m = path.match(/^\/tema-rumah\/([^/]+)$/);
  return m ? m[1] : null;
};

/** URL canonical untuk detail produk katalog: /{pageKey}/{item-slug} — dipakai untuk share link
 *  contoh: /interior/plafon-modern/plafon-pvc-motif */
const catalogItemUrl = (pageKey, itemSlug) => `/${pageKey}/${itemSlug}`;

/** Parse URL /interior/{sub}/{item-slug} atau /eksterior/{sub}/{item-slug} → { pageKey, itemSlug }, atau null
 *  kalau cuma landing kategori "/interior/{sub}" polos (2 segmen saja) */
const parseCatalogItemPath = (path) => {
  const m = path.match(/^\/(interior|eksterior)\/([^/]+)\/([^/]+)$/);
  if (!m) return null;
  return { pageKey: `${m[1]}/${m[2]}`, itemSlug: m[3] };
};

/** Baca halaman awal dari URL saat render — bukan saat module load. */
const getInitialPage = () => {
  const p = window.location.pathname;
  if (PATH_TO_PAGE[p]) return PATH_TO_PAGE[p];
  // URL detail produk katalog /interior/{sub}/{item-slug} atau /eksterior/{sub}/{item-slug}
  // → mount pageKey kategorinya saja (item detail-nya di-resolve dari state catalogItemSlug)
  const catItem = parseCatalogItemPath(p);
  if (catItem) return catItem.pageKey;
  // Sub-route interior/*  dan eksterior/*
  if (p.startsWith("/interior/")) return p.replace("/","");
  if (p.startsWith("/eksterior/")) return p.replace("/","");
  // URL paket → langsung mount ServicesPage (activePaket sudah di-init dari URL)
  if (parsePaketPath(p)) return "services";
  // URL detail tema rumah /tema-rumah/{slug} → mount TemaRumahPage (temaSlug di-init dari URL)
  if (parseTemaPath(p)) return "temarumah";
  // URL artikel → mount section yang sesuai (readPost di-resolve setelah data load)
  const art = parseArtikelPath(p);
  if (art) return { news: "news", shop: "shop", destinations: "destinations" }[art.section] || "news";
  return "home";
};

// Restore showAdmin state dari URL: /control-panel atau /control-panel/<slug> → true
const getInitialShowAdmin = () => {
  const p = window.location.pathname;
  return p === "/control-panel" || p.startsWith("/control-panel/");
};

// Restore adminTab dari URL: /control-panel/plafon → "int_plafon", dst.
const getInitialAdminTab = () => {
  const p = window.location.pathname;
  const m = p.match(/^\/control-panel\/([^/]+)$/);
  return m ? adminSlugToTab(m[1]) : "dashboard";
};

/* ═══════════════════════════════════════════════════════════════════
   TEMA RUMAH — Full Page + Sub-pages per Tema
   Landing  : /tema-rumah   (100% mirip referensi)
   Sub-page : /tema-rumah/:slug  (Denah · Eksterior · Interior · Harga · Kalkulator)
   ═══════════════════════════════════════════════════════════════════ */

/* ── Data semua tema ── */
const TEMA_DATA = [
  {
    id: 1, slug: "modern-minimalis", no: "01", nama: "Modern Minimalis",
    tagline: "Desain simpel, elegan, dan fungsional dengan garis tegas dan warna netral yang menciptakan kesan luas, bersih, dan modern.",
    fitur: [
      { icon: "", label: "Tampilan Modern" }, { icon: "", label: "Ruang Lebih Luas" },
      { icon: "", label: "Perawatan Mudah" }, { icon: "", label: "Biaya Efisien" },
    ],
    img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80",
    warna: "#C9AA71",
    deskripsi: "Modern Minimalis adalah filosofi desain yang mengedepankan fungsi di atas dekorasi. Setiap elemen hadir dengan tujuan — tidak ada ornamen berlebihan, hanya garis bersih, material premium, dan cahaya alami yang memaksimalkan kenyamanan hidup.",
    detail: {
      exterior: {
        desc: "Fasad flat dengan material plester halus atau panel GRC. Warna dominan abu-abu, putih, atau krem. Jendela frameless besar memaksimalkan pandangan keluar. Roster beton atau laser-cut sebagai aksen dekoratif.",
        poin: ["Material: GRC, ACP, Kaca Tempered", "Atap: Dak beton / genteng metal flat", "Warna: Abu-abu, putih, off-white", "Kaca frameless panoramik"],
      },
      interior: {
        desc: "Palet monokromatik dengan aksen kayu natural. Furniture built-in tersembunyi (hidden storage). Plafon tinggi dengan indirect lighting. Dapur open-plan dengan island bar.",
        poin: ["Plafon: Gypsum doff dengan hidden lamp", "Lantai: Granit polished 60×60 atau 80×80", "Furnitur: Custom built-in warna putih/abu", "Pencahayaan: LED warm white tersembunyi"],
      },
      denah: {
        desc: "Layout open-plan yang memaksimalkan sirkulasi udara dan cahaya alami. Ruang tamu, ruang makan, dan dapur terhubung tanpa sekat masif.",
        ruangan: [
          { nama: "Ruang Tamu", ukuran: "5 × 6 m", ikon: "" }, { nama: "Ruang Makan", ukuran: "4 × 4 m", ikon: "" },
          { nama: "Dapur", ukuran: "3 × 4 m", ikon: "" }, { nama: "Master Bedroom", ukuran: "5 × 5 m", ikon: "" },
          { nama: "Kamar 2", ukuran: "4 × 4 m", ikon: "" }, { nama: "Kamar Mandi", ukuran: "2 × 3 m", ikon: "" },
          { nama: "Teras Depan", ukuran: "3 × 2 m", ikon: "" }, { nama: "Carport", ukuran: "3 × 6 m", ikon: "" },
        ],
      },
      harga: {
        paket: [
          { nama: "Paket Minimalis Standar", luas: "60–80 m²", harga: 350000, termasuk: ["Desain arsitektur", "RAB lengkap", "Pengawasan 1 bulan"] },
          { nama: "Paket Minimalis Premium", luas: "80–120 m²", harga: 450000, termasuk: ["Desain arsitektur + interior", "RAB + BQ", "Pengawasan penuh", "3D visualisasi"] },
          { nama: "Paket Minimalis Luxury", luas: "120 m² ke atas", harga: 600000, termasuk: ["Full desain arsitektur, interior, landscape", "RAB + BQ detail", "Pengawasan penuh + QC", "3D + animasi walkthrough"] },
        ],
      },
    },
  },
  {
    id: 2, slug: "skandinavian", no: "02", nama: "Skandinavian",
    tagline: "Kombinasi warna terang, material alami, dan pencahayaan maksimal untuk menciptakan suasana hangat, nyaman, dan menenangkan.",
    fitur: [
      { icon: "", label: "Natural & Hangat" }, { icon: "", label: "Pencahayaan Optimal" },
      { icon: "", label: "Ruang Nyaman" }, { icon: "", label: "Estetika Abadi" },
    ],
    img: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=900&q=80",
    warna: "#7a9e87",
    deskripsi: "Skandinavian lahir dari kebutuhan masyarakat Eropa Utara untuk memaksimalkan cahaya di iklim yang gelap. Hasilnya: desain yang bersih, hangat, dan penuh fungsi — dipadu material alami kayu, kain lembut, dan tanaman hijau yang menyegarkan.",
    detail: {
      exterior: {
        desc: "Atap pelana tinggi dengan kemiringan besar, ciri khas arsitektur Skandinavia. Material kayu cedar atau WPC pada fasad memberikan kehangatan visual. Warna putih atau krem dengan aksen kayu coklat terang.",
        poin: ["Atap: Pelana tinggi / metal berprofil", "Material: Kayu cedar, WPC, bata putih", "Warna: Putih, krem, abu muda, coklat kayu", "Jendela: Besar, double-glass, frame putih"],
      },
      interior: {
        desc: "Palet putih bersih dengan sentuhan kayu pinus terang. Tekstil lembut: wol, linen, katun. Tanaman indoor menjadi elemen dekorasi utama. Dapur Hygge dengan island bar kayu dan bar stool tinggi.",
        poin: ["Lantai: Vinyl kayu atau parket pinus terang", "Tekstil: Karpet wol, bantal linen, tirai sheer", "Aksen: Tanaman pot, lilin, benda-benda craft", "Furnitur: Kaki kayu runcing, bentuk organik"],
      },
      denah: {
        desc: "Konsep 'Hygge' — menciptakan sudut-sudut nyaman di setiap ruang. Reading nook, cozy corner, dan dapur yang menjadi jantung rumah.",
        ruangan: [
          { nama: "Ruang Tamu", ukuran: "5 × 5 m", ikon: "" }, { nama: "Ruang Makan", ukuran: "4 × 3.5 m", ikon: "" },
          { nama: "Dapur Hygge", ukuran: "3.5 × 4 m", ikon: "" }, { nama: "Master Bedroom", ukuran: "4.5 × 5 m", ikon: "" },
          { nama: "Kamar 2", ukuran: "3.5 × 4 m", ikon: "" }, { nama: "Reading Nook", ukuran: "2 × 2 m", ikon: "" },
          { nama: "Kamar Mandi", ukuran: "2.5 × 3 m", ikon: "" }, { nama: "Teras Belakang", ukuran: "4 × 3 m", ikon: "" },
        ],
      },
      harga: {
        paket: [
          { nama: "Paket Skandinavia Standar", luas: "60–80 m²", harga: 380000, termasuk: ["Desain arsitektur gaya Skandinavia", "RAB material impor lokal", "3D visualisasi 2 view"] },
          { nama: "Paket Skandinavia Premium", luas: "80–130 m²", harga: 490000, termasuk: ["Full desain + interior Hygge", "RAB + spesifikasi material", "Pengawasan penuh", "3D + mood board"] },
          { nama: "Paket Skandinavia Luxury", luas: "130 m² ke atas", harga: 650000, termasuk: ["Desain arsitektur, interior & landscape nordic", "Furniture custom Skandinavia", "Pengawasan + QC ketat", "Animasi walkthrough 3D"] },
        ],
      },
    },
  },
  {
    id: 3, slug: "industrial", no: "03", nama: "Industrial",
    tagline: "Gaya maskulin dengan material ekspos seperti beton, besi, dan kayu yang menghadirkan kesan tegas, unik, dan berkarakter.",
    fitur: [
      { icon: "", label: "Kesan Maskulin" }, { icon: "", label: "Material Ekspos" },
      { icon: "", label: "Tahan Lama" }, { icon: "", label: "Desain Unik" },
    ],
    img: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=900&q=80",
    warna: "#6b7c8a",
    deskripsi: "Industrial mengambil estetika pabrik dan gudang lama — beton ekspos, pipa besi terbuka, bata merah mentah — dan mentransformasinya menjadi hunian yang berkarakter kuat. Setiap 'ketidaksempurnaan' material menjadi elemen desain yang disengaja.",
    detail: {
      exterior: {
        desc: "Fasad bata ekspos atau plester kasar (exposed concrete). Material metal Corten atau besi hitam sebagai aksen. Jendela berukuran besar dengan frame besi hitam. Kesan 'raw' yang disengaja.",
        poin: ["Material: Bata ekspos, beton kasar, besi hitam", "Atap: Spandek, metal, atau dak beton", "Warna: Abu gelap, hitam, coklat tua, merah bata", "Detail: Pipa galvanis ekspos, baut terlihat"],
      },
      interior: {
        desc: "Plafon beton ekspos atau duct AC yang terlihat. Lantai polished concrete atau vinyl semen. Furnitur besi+kayu kombinasi. Pencahayaan Edison bulb dan track light.",
        poin: ["Lantai: Polished concrete atau floor hardener", "Plafon: Ekspos rangka baja dan duct", "Pencahayaan: Edison bulb, track light hitam", "Furnitur: Kombinasi besi hollow dan kayu solid"],
      },
      denah: {
        desc: "Open space besar tanpa banyak sekat — tipikal ruang industri yang dikonversi. Mezzanine sebagai ruang tidur atau kerja memberikan kedalaman visual yang dramatik.",
        ruangan: [
          { nama: "Ruang Utama (Open)", ukuran: "8 × 10 m", ikon: "" }, { nama: "Dapur Industrial", ukuran: "4 × 5 m", ikon: "" },
          { nama: "Master Bedroom", ukuran: "5 × 6 m", ikon: "" }, { nama: "Mezzanine / Studio", ukuran: "4 × 5 m", ikon: "" },
          { nama: "Kamar Mandi", ukuran: "3 × 3 m", ikon: "" }, { nama: "Workshop / Garasi", ukuran: "6 × 5 m", ikon: "" },
          { nama: "Ruang Tamu", ukuran: "5 × 6 m", ikon: "" }, { nama: "Teras / Balkon", ukuran: "3 × 4 m", ikon: "" },
        ],
      },
      harga: {
        paket: [
          { nama: "Paket Industrial Standar", luas: "70–100 m²", harga: 400000, termasuk: ["Desain industrial + finishing ekspos", "RAB + spesifikasi material", "3D visualisasi"] },
          { nama: "Paket Industrial Premium", luas: "100–150 m²", harga: 520000, termasuk: ["Full desain + interior industrial", "Custom metalwork & carpentry", "Pengawasan penuh", "3D + foto render"] },
          { nama: "Paket Industrial Luxury", luas: "150 m² ke atas", harga: 700000, termasuk: ["Full package desain + eksekusi", "Material impor + custom fabrication", "QC ketat + garansi pekerjaan", "Dokumentasi foto & video"] },
        ],
      },
    },
  },
  {
    id: 4, slug: "tropical-modern", no: "04", nama: "Tropical Modern",
    tagline: "Menggabungkan elemen alam dan desain modern untuk sirkulasi udara maksimal dan suasana yang sejuk serta menyegarkan.",
    fitur: [
      { icon: "", label: "Sejuk & Alami" }, { icon: "", label: "Sirkulasi Udara Baik" },
      { icon: "", label: "Hemat Energi" }, { icon: "", label: "Nyaman Setiap Saat" },
    ],
    img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900&q=80",
    warna: "#4a8c6f",
    deskripsi: "Tropical Modern adalah jawaban sempurna untuk iklim Indonesia. Menggabungkan arsitektur kontemporer dengan elemen tropis — atap lebar, cross-ventilation, material alam, dan tanaman hijau lebat — menciptakan hunian yang sejuk tanpa bergantung penuh pada AC.",
    detail: {
      exterior: {
        desc: "Atap lebar menjorok (overhang) melindungi dari hujan dan panas. Void dan balkon terbuka untuk ventilasi silang. Material kayu, batu alam, dan tanaman sebagai komponen desain utama.",
        poin: ["Atap: Genteng clay, metal, atau dak dengan taman", "Material: Batu andesit, kayu ulin, bambu laminate", "Vegetasi: Tanaman fasad, vertical garden, kolam koi", "Void: Cross-ventilation pada massa bangunan"],
      },
      interior: {
        desc: "Material alam mendominasi — kayu, rotan, batu alam. Palette hijau, coklat, krem. Ruangan mengalir ke taman atau kolam melalui bukaan besar. Indoor-outdoor living sebagai konsep utama.",
        poin: ["Lantai: Batu andesit, kayu atau terracotta", "Plafon: Kayu ekspos atau anyaman bambu", "Warna: Hijau, krem, coklat kayu, abu batu", "Furniture: Rotan, kayu jati, material alam"],
      },
      denah: {
        desc: "Zoning yang memisahkan area publik dan privat dengan buffer tanaman. Ruang tengah terbuka ke halaman (courtyard). Teras menjadi ruang sosial utama.",
        ruangan: [
          { nama: "Teras & Carport", ukuran: "5 × 6 m", ikon: "" }, { nama: "Ruang Tamu", ukuran: "5 × 6 m", ikon: "" },
          { nama: "Ruang Keluarga", ukuran: "5 × 5 m", ikon: "" }, { nama: "Dapur + Makan", ukuran: "4 × 6 m", ikon: "" },
          { nama: "Master Bedroom", ukuran: "5 × 5 m", ikon: "" }, { nama: "Kamar 2 & 3", ukuran: "3.5 × 4 m", ikon: "" },
          { nama: "Kolam & Taman", ukuran: "4 × 6 m", ikon: "" }, { nama: "Musholla", ukuran: "2.5 × 3 m", ikon: "" },
        ],
      },
      harga: {
        paket: [
          { nama: "Paket Tropical Standar", luas: "80–120 m²", harga: 420000, termasuk: ["Desain tropical modern", "Material lokal premium", "RAB + landscape dasar"] },
          { nama: "Paket Tropical Premium", luas: "120–180 m²", harga: 550000, termasuk: ["Full desain + interior + landscape", "Material alam pilihan", "Kolam ikan / kolam renang mini", "Pengawasan penuh"] },
          { nama: "Paket Tropical Luxury", luas: "180 m² ke atas", harga: 750000, termasuk: ["Villa-grade tropical design", "Material import + custom joinery", "Kolam renang + taman profesional", "Full management proyek"] },
        ],
      },
    },
  },
  {
    id: 5, slug: "luxury-modern", no: "05", nama: "Luxury Modern",
    tagline: "Desain eksklusif dengan detail premium, material berkualitas tinggi, dan tata ruang mewah yang memancarkan prestise.",
    fitur: [
      { icon: "", label: "Eksklusif" }, { icon: "", label: "Material Premium" },
      { icon: "", label: "Detail Mewah" }, { icon: "", label: "Prestise Tinggi" },
    ],
    img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&q=80",
    warna: "#8B6914",
    deskripsi: "Luxury Modern adalah puncak ekspresi arsitektur kontemporer. Setiap detail dirancang dengan presisi — material marmer impor, smart home system, kolam renang infinity edge, dan pencahayaan arsitektural yang menciptakan ambiance mewah setiap saat.",
    detail: {
      exterior: {
        desc: "Volume asimetris yang dramatik dengan material marmer eksterior, ACP metalik, dan panel GRC premium. Kolam renang dengan overflow edge sebagai focal point. Landscape impresif dengan pohon palm dan pencahayaan taman yang dramatis.",
        poin: ["Material: Marmer, ACP brushed gold, GRC custom", "Kolam: Infinity pool dengan overflow edge", "Pencahayaan: Arsitektural LED + uplighting taman", "Smart gate: Akses otomatis dengan sistem keamanan"],
      },
      interior: {
        desc: "Material marmer impor pada lantai dan dinding. Plafon double-volume di ruang tamu. Tangga floating dengan railing kaca frameless. Dapur custom kitchen set dengan appliance premium.",
        poin: ["Lantai: Marmer Statuario atau Calacatta impor", "Dinding: Feature wall marmer + backlit panel", "Tangga: Floating staircase + LED step-light", "Smart Home: Lighting, AC, security terintegrasi"],
      },
      denah: {
        desc: "Layout mewah dengan foyer grand entrance, ruang tamu double-volume, ruang makan formal terpisah, dan home theater. Kamar utama dengan walk-in closet dan ensuite bathroom spa-grade.",
        ruangan: [
          { nama: "Grand Foyer", ukuran: "4 × 5 m", ikon: "" }, { nama: "Ruang Tamu (Double Vol.)", ukuran: "8 × 9 m", ikon: "" },
          { nama: "Ruang Makan Formal", ukuran: "5 × 7 m", ikon: "" }, { nama: "Dapur Premium", ukuran: "5 × 5 m", ikon: "" },
          { nama: "Master Suite", ukuran: "7 × 8 m", ikon: "" }, { nama: "Walk-in Closet", ukuran: "4 × 4 m", ikon: "" },
          { nama: "Home Theater", ukuran: "5 × 6 m", ikon: "" }, { nama: "Kolam Renang", ukuran: "4 × 10 m", ikon: "" },
        ],
      },
      harga: {
        paket: [
          { nama: "Paket Luxury Standar", luas: "150–200 m²", harga: 750000, termasuk: ["Full desain arsitektur mewah", "Material premium lokal", "Interior semi-furnished", "RAB + BQ detail"] },
          { nama: "Paket Luxury Premium", luas: "200–300 m²", harga: 1000000, termasuk: ["Full design + interior + landscape mewah", "Material marmer impor + custom joinery", "Smart home system", "Kolam renang + taman profesional"] },
          { nama: "Paket Luxury Ultra", luas: "300 m² ke atas", harga: 0, termasuk: ["Desain custom sepenuhnya", "Material world-class tanpa batas", "Full project management", "Konsultasi eksklusif, by appointment only"] },
        ],
      },
    },
  },
];

/* ── Card Content helper (reusable di landing) ── */
/* ── Per-tema photo sets untuk slideshow ── */
const TEMA_PHOTOS = {
  "modern-minimalis": [
    { img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80", label: "Fasad Modern Minimalis" },
    { img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80", label: "Eksterior Bersih & Tegas" },
    { img: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=80", label: "Rumah 2 Lantai Minimalis" },
    { img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=80", label: "Desain Carport Minimalis" },
    { img: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=900&q=80", label: "Interior Open Plan" },
    { img: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=900&q=80", label: "Dapur Minimalis Modern" },
  ],
  "skandinavian": [
    { img: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=900&q=80", label: "Fasad Skandinavian" },
    { img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&q=80", label: "Interior Hygge Living Room" },
    { img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80", label: "Kamar Tidur Skandinavian" },
    { img: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=900&q=80", label: "Dapur Putih Natural" },
    { img: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=900&q=80", label: "Ruang Tamu Hangat" },
    { img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&q=80", label: "Reading Nook Cozy" },
  ],
  "industrial": [
    { img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80", label: "Eksterior Industrial Raw" },
    { img: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=900&q=80", label: "Interior Beton Ekspos" },
    { img: "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=900&q=80", label: "Ruang Tamu Industrial" },
    { img: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=900&q=80", label: "Dapur Industrial Chic" },
    { img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&q=80", label: "Mezzanine & Open Space" },
    { img: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=900&q=80", label: "Edison Bulb Lighting" },
  ],
  "tropical-modern": [
    { img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900&q=80", label: "Villa Tropis Modern" },
    { img: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=900&q=80", label: "Fasad dengan Taman Lebat" },
    { img: "https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=900&q=80", label: "Kolam & Teras Tropis" },
    { img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80", label: "Ruang Tamu Indoor-Outdoor" },
    { img: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=900&q=80", label: "Teras Santai Rotan" },
    { img: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=900&q=80", label: "Kolam Renang Natural" },
  ],
  "klasik-mediterania": [
    { img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&q=80", label: "Fasad Mediterania Putih" },
    { img: "https://images.unsplash.com/photo-1523217162808-bba68bde2d61?w=900&q=80", label: "Pilar & Arch Klasik" },
    { img: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=900&q=80", label: "Teras Mediterania Mewah" },
    { img: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=900&q=80", label: "Interior Klasik Elegan" },
    { img: "https://images.unsplash.com/photo-1558905586-b022cc14d2b3?w=900&q=80", label: "Taman Lavender & Batu" },
    { img: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=900&q=80", label: "Ruang Makan Klasik" },
  ],
};

/* ── Slideshow komponen untuk Tema Card ── */
function TemaPhotoSlideshow({ slug, nama, cmsData, duration = 3500, fallbackImg = "" }) {
  /* Gunakan foto dari CMS override jika ada, fallback ke hardcoded TEMA_PHOTOS */
  const cmsPhotos = cmsData?.temaPhotosOverride?.[slug];
  let photosRaw = (cmsPhotos && cmsPhotos.length > 0) ? cmsPhotos : (TEMA_PHOTOS[slug] || []);
  /* Buang slot foto yang URL-nya kosong/blank (data lama yang mungkin kadung tersimpan) —
     supaya slide manapun (termasuk slide pertama) tidak pernah tampil kotak kosong ke pengunjung. */
  photosRaw = photosRaw.filter(p => p && p.img && p.img.trim());
  /* FIX: kalau slug dari data CMS tidak cocok/kosong (mis. field slug hilang saat diedit admin),
     coba cari ulang lewat nama tema supaya foto tetap ketemu (jangan sampai hilang di Home
     padahal masih ada di halaman detail Tema Rumah). */
  if (photosRaw.length === 0 && nama) {
    const match = TEMA_DATA.find(t => (t.nama || "").toLowerCase().trim() === (nama || "").toLowerCase().trim());
    if (match) {
      photosRaw = TEMA_PHOTOS[match.slug] || (match.img ? [{ img: match.img, label: match.nama }] : []);
    }
  }
  /* Kalau tidak ada foto sama sekali di TEMA_PHOTOS/CMS, pakai fallbackImg (mis. tema.img) sebagai satu foto */
  const photos = photosRaw.length > 0 ? photosRaw : (fallbackImg ? [{ img: fallbackImg, label: nama || "" }] : []);
  const [idx, setIdx] = useState(0);
  const dragRef = useRef({ down: false, startX: 0, moved: false });
  /* Kalau foto yang lagi aktif gagal dimuat (link rusak/putus), JANGAN cuma
     tampilkan kotak kosong — otomatis lompat ke foto lain yang masih valid
     di galeri yang sama, supaya pengunjung tetap lihat foto selama minimal
     1 foto di galeri itu hidup. Kotak fallback cuma tampil kalau BENAR-BENAR
     semua foto di galeri itu rusak. */
  const [brokenSet, setBrokenSet] = useState(() => new Set());
  useEffect(() => { setBrokenSet(new Set()); }, [slug]);
  const allBroken = photos.length > 0 && brokenSet.size >= photos.length;
  const handleImgError = () => {
    if (brokenSet.has(idx)) return;
    const next = new Set(brokenSet);
    next.add(idx);
    setBrokenSet(next);
    for (let step = 1; step <= photos.length; step++) {
      const tryIdx = (idx + step) % photos.length;
      if (!next.has(tryIdx)) { setIdx(tryIdx); break; }
    }
  };
  /* Skeleton loading: lacak src foto yang sudah pernah selesai dimuat,
     supaya shimmer cuma tampil sekali per foto (bukan tiap kali slide berulang). */
  const [loadedSrcs, setLoadedSrcs] = useState(() => new Set());
  const markLoaded = (src) => setLoadedSrcs(prev => prev.has(src) ? prev : new Set(prev).add(src));

  /* AUTO-SLIDE DIMATIKAN: foto TIDAK berpindah sendiri lagi.
     Berpindah HANYA lewat drag mouse (klik-tahan lalu geser), atau lewat
     tombol panah/dots kalau mau klik langsung. */
  const goTo = (i) => setIdx(i);

  const preload = (i) => {
    const im = new Image();
    im.src = photos[i]?.img;
  };

  const handleMouseDown = (e) => {
    if (photos.length < 2) return;
    dragRef.current = { down: true, startX: e.clientX, moved: false };
    // preload tetangga kiri/kanan supaya swipe langsung mulus tanpa jeda
    preload((idx + 1) % photos.length);
    preload((idx - 1 + photos.length) % photos.length);
  };
  const handleMouseMove = (e) => {
    if (!dragRef.current.down) return;
    if (Math.abs(e.clientX - dragRef.current.startX) > 4) dragRef.current.moved = true;
  };
  /* MOBILE: sentuh & geser jari (touch/swipe) -- HP tidak punya mouse, jadi
     interaksi drag mouse di atas ditiru pakai touch event di sini supaya
     tetap bisa geser foto pakai jari di HP. */
  const handleTouchStart = (e) => {
    if (photos.length < 2) return;
    const t = e.touches[0];
    dragRef.current = { down: true, startX: t.clientX, moved: false };
    preload((idx + 1) % photos.length);
    preload((idx - 1 + photos.length) % photos.length);
  };
  const handleTouchMove = (e) => {
    if (!dragRef.current.down) return;
    const t = e.touches[0];
    if (Math.abs(t.clientX - dragRef.current.startX) > 4) dragRef.current.moved = true;
  };
  const handleTouchEnd = (e) => {
    if (!dragRef.current.down) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - dragRef.current.startX;
    const wasTap = !dragRef.current.moved; // jari nyaris tidak bergeser = dianggap "tap", bukan swipe
    dragRef.current.down = false;
    if (photos.length < 2) return;
    if (Math.abs(dx) > 40) {
      // Swipe beneran: geser sesuai arah jari
      if (dx < 0) goTo((idx + 1) % photos.length);
      else goTo((idx - 1 + photos.length) % photos.length);
    } else if (wasTap) {
      // MOBILE: tap di area foto langsung ganti ke foto berikutnya (pengganti tombol panah yang disembunyikan)
      goTo((idx + 1) % photos.length);
    }
  };
  const endDrag = (e) => {
    if (!dragRef.current.down) return;
    const dx = (e.clientX ?? dragRef.current.startX) - dragRef.current.startX;
    dragRef.current.down = false;
    if (photos.length > 1 && Math.abs(dx) > 40) {
      if (dx < 0) goTo((idx + 1) % photos.length);
      else goTo((idx - 1 + photos.length) % photos.length);
    }
  };

  if (photos.length === 0) return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#E8DCC8" }}>
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#A89070" strokeWidth="1.5"><path d="M3 10.5L12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 9.5V20a1 1 0 001 1h12a1 1 0 001-1V9.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  );

  const cur = photos[idx];
  return (
    <div
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", cursor: photos.length > 1 ? "grab" : "default", userSelect: "none", touchAction: photos.length > 1 ? "pan-y" : "auto" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Image — tanpa key, jadi browser cuma ganti src elemen yang sama (tidak ada blank/kedip) */}
      {allBroken || !cur || brokenSet.has(idx) ? (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#E8DCC8" }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#A89070" strokeWidth="1.5"><path d="M3 10.5L12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 9.5V20a1 1 0 001 1h12a1 1 0 001-1V9.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      ) : (
        <>
          {!loadedSrcs.has(cur.img) && <div className="img-skeleton" />}
          <img decoding="async" loading="lazy" src={cld(cur.img)} alt={publicCaption(cur.label) || nama || "Foto tema rumah"}
            draggable={false}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none", opacity: loadedSrcs.has(cur.img) ? 1 : 0, transition: "opacity .4s ease" }}
            onLoad={() => markLoaded(cur.img)}
            onError={handleImgError} />
        </>
      )}

      {/* Overlay bottom gradient */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.55) 0%, transparent 50%)", pointerEvents: "none" }} />

      {/* Label — hanya tampil kalau admin mengisi label manual & lolos filter nama-file, tidak pernah menampilkan nama file */}
      {publicCaption(cur.label) ? (
        <div style={{ position: "absolute", bottom: 48, left: 14, right: 14 }}>
          <span style={{ background: "rgba(0,0,0,.45)", backdropFilter: "blur(6px)", color: "#fff", fontSize: "0.65rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 20 }}>
            {publicCaption(cur.label)}
          </span>
        </div>
      ) : null}

      {/* Dots -- area sentuh diperbesar (padding transparan) tanpa mengubah ukuran visual dot */}
      <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 2 }}>
        {photos.map((_, i) => (
          <button key={i} onClick={() => goTo(i)}
            style={{ width: (i === idx ? 18 : 6) + 16, height: 22, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
            <span style={{ width: i === idx ? 18 : 6, height: 6, borderRadius: 3, background: i === idx ? "#C9AA71" : "rgba(255,255,255,.55)", transition: "all .3s", display: "block" }} />
          </button>
        ))}
      </div>

      {/* Panah kiri/kanan -- ukuran diperbesar (40px) supaya nyaman disentuh di HP.
          Class "re-tema-arrow" dipakai buat aturan mobile: opacity 50% + greyscale (lihat CSS). */}
      {photos.length > 1 && ["◀","▶"].map((ch, d) => (
        <button key={d} className="re-tema-arrow"
          onClick={() => goTo((idx + (d === 0 ? -1 : 1) + photos.length) % photos.length)}
          style={{ position: "absolute", top: "50%", [d === 0 ? "left" : "right"]: 8, transform: "translateY(-50%)", background: "rgba(0,0,0,.38)", backdropFilter: "blur(4px)", border: "none", color: "#fff", fontSize: 15, width: 40, height: 40, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {ch}
        </button>
      ))}

      {/* Counter badge */}
      <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)", color: "#C9AA71", fontSize: "0.62rem", fontWeight: 800, padding: "3px 9px", borderRadius: 20 }}>
        {idx + 1}/{photos.length}
      </div>
    </div>
  );
}



/* ── Data default Layanan Section Home (bisa dioverride via CMS: data.homeServices) ── */
const HOME_SERVICES_DEFAULT = [
  { num:"01", title:"Membangun Rumah", desc:"Ingin membangun rumah baru? Kami bisa membantu mewujudkannya.", img:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80&auto=format&fit=crop" },
  { num:"02", title:"Renovasi Rumah", desc:"Rumah Anda butuh renovasi? Biarkan kami membantu Anda.", img:"https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=600&q=80&auto=format&fit=crop" },
  { num:"03", title:"Custom Properti", desc:"Ingin properti sesuai kebutuhan khusus? Kami dapat membantu.", img:"https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80&auto=format&fit=crop" },
  { num:"04", title:"Manajemen Properti", desc:"Kesulitan mengatur properti sewaan Anda? Kami siap bantu.", img:"https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80&auto=format&fit=crop" },
  { num:"05", title:"Penataan & Gaya Rumah", desc:"Ingin listing Anda lebih menarik? Biarkan kami memandu Anda.", img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80&auto=format&fit=crop" },
  { num:"06", title:"Konsultasi Investasi", desc:"Ingin kembangkan portofolio Anda? Tim kami siap bantu.", img:"https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=600&q=80&auto=format&fit=crop" },
];









/* ════════════════════════════════════════════ WA TEMPLATE HELPER ════════════════════════════════════════════ */
/**
 * buildWaMsg(templates, key, vars)
 * PERMANEN: hanya ada SATU template ("umum") yang dipakai oleh SEMUA tombol
 * WhatsApp di seluruh situs (Hubungi Kami, Konsultasi, Paket, Layanan, dll),
 * apapun `key` yang dikirim tombolnya. Diatur satu-satunya lewat Admin →
 * Settings → Template Pesan WhatsApp.
 * - templates : data.content.waTemplates
 * - vars      : { judul_paket, harga, judul_layanan, ... } — tetap bisa dipakai
 *   kalau template umum-nya memuat placeholder {xxx}, tapi tidak wajib.
 * Mengganti placeholder {xxx} dengan nilai vars, lalu memformat \n
 */
function buildWaMsg(templates = {}, key = "umum", vars = {}) {
  const tpl = templates.umum || "Halo HIKIMORI CONST!";
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] || "");
}

/* ─────────────── NOMOR TELEPON YANG DITAMPILKAN KE PUBLIK ───────────────
   PERMANEN: nomor yang ditampilkan di Footer, section Kontak, dsb SELALU
   ikut siapa yang jadi admin WA `primary` di daftar `waAdmins` — bukan dari
   field `content.phone` yang disimpan terpisah (field itu bisa "nyangkut"
   ke nilai lama kalau pernah diedit manual sebelum ada sistem waAdmins).
   Jadi kalau primary admin diganti lewat panel, nomor yang tampil di
   seluruh situs otomatis ikut berubah, tidak perlu disinkronkan manual. */
function displayPhone(content) {
  const admins = content?.waAdmins || [];
  const primary = admins.find(a => a.primary) || admins[0];
  if (primary?.wa) {
    const digits = primary.wa.replace(/\D/g, "");
    // digits diawali "62" (kode negara) -> format +62 XXX-XXXX-XXXX
    const local = digits.startsWith("62") ? digits.slice(2) : digits;
    if (local.length >= 9) {
      return `+62 ${local.slice(0, 3)}-${local.slice(3, 7)}-${local.slice(7)}`;
    }
  }
  return content?.phone || "";
}

/* ════════════════════════════════════════════ WA PICKER MODAL ════════════════════════════════════════════ */
function WaPickerModal({ admins = [], msgText = "", onClose }) {
  if (!admins || admins.length === 0) return null;

  // Urutkan: primary selalu di atas
  const sorted = [...admins].sort((a, b) => (b.primary ? 1 : 0) - (a.primary ? 1 : 0));

  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9995, background: "rgba(10,20,30,.55)",
        backdropFilter: "blur(7px)", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "12px" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 16, padding: "16px 18px 14px", maxWidth: 360, width: "100%",
          maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.22)", position: "relative" }}>

        {/* Close */}
        <button onClick={onClose}
          style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none",
            fontSize: 20, color: "#2E3D3F", cursor: "pointer", lineHeight: 1, opacity: .5 }}>✕</button>

        {/* Header -- Logo + Judul */}
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 7 }}>
            <img loading="lazy" decoding="async" src={HIKIMORI_LOGO_URL} alt="Hikimori Const"
              style={{ height: 40, maxWidth: 140, width: "auto", objectFit: "contain" }} />
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#2E3D3F", margin: "0 0 2px", letterSpacing: ".02em" }}>
            Hubungi Kami via WhatsApp
          </h2>
          <p style={{ fontSize: 11, color: "#5A6A6C", margin: 0 }}>
            Pilih kontak yang ingin Anda hubungi
          </p>
        </div>

        {/* Admin cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map(admin => {
            const waUrl = admin.wa + (msgText ? `?text=${encodeURIComponent(msgText)}` : "");
            const isPrimary = !!admin.primary;
            return (
              <div key={admin.id}
                style={{
                  border: isPrimary ? "2px solid #25d366" : "1.5px solid #E8DCC8",
                  borderRadius: 10,
                  background: isPrimary ? "#f0fdf4" : "#FDFAF4",
                  overflow: "hidden",
                }}>

                {isPrimary && (
                  <div style={{ background: "#25d366", color: "#fff", fontSize: 9.5, fontWeight: 800,
                    letterSpacing: ".1em", textTransform: "uppercase", padding: "3px 12px" }}>
                    WhatsApp Utama
                  </div>
                )}

                <div style={{ padding: "10px 14px 10px", display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Info kiri: Nama + Jabatan */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 8.5, fontWeight: 700, color: "#A89070", letterSpacing: ".1em",
                      textTransform: "uppercase", marginBottom: 1 }}>Nama</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#2E3D3F", marginBottom: 4,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {admin.name || "—"}
                    </div>
                    <div style={{ fontSize: 8.5, fontWeight: 700, color: "#A89070", letterSpacing: ".1em",
                      textTransform: "uppercase", marginBottom: 1 }}>Jabatan</div>
                    <div style={{ fontSize: 11, color: "#5A6A6C" }}>
                      {admin.jabatan || "—"}
                    </div>
                  </div>

                  {/* Tombol WA kanan -- kompak vertikal */}
                  <a href={waUrl} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                      padding: "9px 13px",
                      background: isPrimary ? "#25d366" : "#2E3D3F",
                      color: "#fff", textDecoration: "none",
                      borderRadius: 8, fontSize: 11, fontWeight: 700,
                      flexShrink: 0, whiteSpace: "nowrap",
                      transition: "opacity .18s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = ".85"; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.126 1.535 5.862L0 24l6.341-1.512C8.024 23.452 9.973 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.92 0-3.71-.507-5.25-1.39l-.375-.224-3.887.927.958-3.788-.245-.39C2.507 15.64 2 13.882 2 12 2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                    </svg>
                    Chat via<br/>WhatsApp
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Jam Layanan */}
        <div style={{ textAlign: "center", marginTop: 10, padding: "8px 0 6px",
          borderTop: "1px solid #F0EAD8" }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: "#A89070", letterSpacing: ".1em",
            textTransform: "uppercase", marginBottom: 2 }}>Jam Layanan</div>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "#5A6A6C", marginBottom: 1 }}>Setiap Hari</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#2E3D3F", letterSpacing: ".04em" }}>
            — 08.00 – 17.00 —
          </div>
        </div>

        <button onClick={onClose}
          style={{ width: "100%", marginTop: 8, padding: "9px 0", border: "1.5px solid #E8DCC8",
            borderRadius: 8, background: "transparent", color: "#5A6A6C", fontSize: 12, fontWeight: 600,
            cursor: "pointer", transition: "all .2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#2E3D3F"; e.currentTarget.style.color = "#2E3D3F"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#E8DCC8"; e.currentTarget.style.color = "#5A6A6C"; }}>
          Tutup
        </button>
      </div>
    </div>
  );
}

/* ─────────────── MOBILE LAYANAN ACCORDION (3-level) ─────────────── */
/* ─────────────── MOBILE: TEMA RUMAH ACCORDION (standalone, tepat di bawah About) ─────────────── */
function MobileTemaRumahAccordion({ page, navigateTo, setMobileMenu, temaList, temaSlug, openTemaDetail }) {
  const [open, setOpen] = useState(false);
  const mBtn = (active, depth=0) => ({
    fontSize:".8rem", letterSpacing:".12em", textTransform:"uppercase", fontFamily:"'Jost',sans-serif",
    color:active?"var(--re-black)":"var(--re-grey-dk)", fontWeight:active?700:400,
    border:"none", background:active?"rgba(139,105,20,.08)":"transparent",
    textAlign:"left", padding:`11px ${18 + depth*14}px`, borderRadius:6, width:"100%",
    borderLeft:active?"2px solid #8B6914":"2px solid transparent", transition:"all .15s", cursor:"pointer",
    display:"flex", alignItems:"center", justifyContent:"space-between",
  });
  return (
    <div style={{ width:"100%" }}>
      <button onClick={()=>setOpen(v=>!v)}
        style={{ ...mBtn(page==="temarumah"), padding:"13px 18px", fontWeight:700 }}>
        <span>Tema Rumah</span>
        <span style={{ fontSize:"0.6rem", fontWeight:800, color:"#fff", background:"#8B6914", padding:"4px 12px", borderRadius:5, letterSpacing:".06em" }}>{open?"TUTUP":"BUKA"}</span>
      </button>
      {open && (
        <div style={{ background:"rgba(0,0,0,.02)", borderLeft:"2px solid #E8DCC8", marginLeft:18 }}>
          <button onClick={()=>{ navigateTo("temarumah"); setMobileMenu(false); setOpen(false); }}
            style={mBtn(page==="temarumah" && !temaSlug, 1)}>
            Semua Tema Rumah
          </button>
          {(temaList || []).map(tema=>(
            <button key={tema.slug} onClick={()=>{ openTemaDetail(tema.slug); setMobileMenu(false); setOpen(false); }}
              style={mBtn(page==="temarumah" && temaSlug===tema.slug, 1)}>
              {tema.nama}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────── MOBILE: PAKET LAYANAN KAMI ACCORDION ─────────────── */
function MobileLayananAccordion({ page, navigateTo, setMobileMenu, navDropdownLayanan }) {
  const [open, setOpen]       = useState(false);
  const [subOpen, setSubOpen] = useState(null); // "interior"|"eksterior"|null

  const topPages = ["services","desainrab"];

  const mBtn = (active, depth=0) => ({
    fontSize:".8rem", letterSpacing:".12em", textTransform:"uppercase", fontFamily:"'Jost',sans-serif",
    color:active?"var(--re-black)":"var(--re-grey-dk)", fontWeight:active?700:400,
    border:"none", background:active?"rgba(139,105,20,.08)":"transparent",
    textAlign:"left", padding:`11px ${18 + depth*14}px`, borderRadius:6, width:"100%",
    borderLeft:active?"2px solid #8B6914":"2px solid transparent", transition:"all .15s", cursor:"pointer",
    display:"flex", alignItems:"center", justifyContent:"space-between",
  });

  const isLayananActive = [...topPages,
    "interior/kamar-tidur","interior/kamar-mandi","interior/ruang-keluarga","interior/ruang-tamu","interior/kitchen-set","interior/ruang-kerja","interior/plafon-modern","interior/backdrop",
    "eksterior/pagar","eksterior/kanopi","eksterior/kusen-partisi","eksterior/taman-landscape",
  ].some(k=>k===page);

  return (
    <div style={{ width:"100%" }}>
      {/* Header Paket Layanan Kami */}
      <button onClick={()=>{ setOpen(v=>!v); setSubOpen(null); }}
        style={{ ...mBtn(isLayananActive), padding:"13px 18px", fontWeight:700 }}>
        <span>Paket Layanan Kami</span>
        <span style={{ fontSize:"0.6rem", fontWeight:800, color:"#fff", background:"#8B6914", padding:"4px 12px", borderRadius:5, letterSpacing:".06em" }}>{open?"TUTUP":"BUKA"}</span>
      </button>

      {open && (
        <div style={{ background:"rgba(0,0,0,.02)", borderLeft:"2px solid #E8DCC8", marginLeft:18 }}>

          {/* Layanan Umum */}
          <div style={{ padding:"6px 16px 2px", fontSize:"0.58rem", fontWeight:800, letterSpacing:".14em", textTransform:"uppercase", color:"#8B9A9C" }}>Layanan</div>
          {navDropdownLayanan.filter(i=>topPages.includes(i.key)).map(item=>(
            <button key={item.key} onClick={()=>{ navigateTo(item.key); setMobileMenu(false); setOpen(false); }}
              style={mBtn(page===item.key, 1)}>
              {item.label}
            </button>
          ))}

          <div style={{ margin:"6px 16px", borderTop:"1px solid #E8DCC8" }}/>

          {/* Interior accordion */}
          <button onClick={()=>setSubOpen(v=>v==="interior"?null:"interior")}
            style={{ ...mBtn(page.startsWith("interior"), 1), justifyContent:"space-between" }}>
            <span>Interior</span>
            <span style={{ fontSize:"0.6rem", fontWeight:800, color:"#fff", background:"#8B6914", padding:"4px 12px", borderRadius:5, letterSpacing:".06em" }}>{subOpen==="interior"?"TUTUP":"BUKA"}</span>
          </button>
          {subOpen==="interior" && (
            <div style={{ borderLeft:"2px solid #C9AA71", marginLeft:28 }}>
              {[
                {key:"interior/plafon-modern",  label:"Plafon Modern"},
                {key:"interior/kitchen-set",    label:"Kitchen Set"},
                {key:"interior/backdrop",    label:"Backdrop"},
                {key:"interior/kamar-tidur",    label:"Kamar Tidur"},
                {key:"interior/kamar-mandi",    label:"Kamar Mandi"},
                {key:"interior/ruang-keluarga", label:"Ruang Keluarga"},
                {key:"interior/ruang-tamu",     label:"Ruang Tamu"},
                {key:"interior/ruang-kerja",    label:"Ruang Kerja"},
              ].map(sub=>(
                <button key={sub.key} onClick={()=>{ navigateTo(sub.key); setMobileMenu(false); setOpen(false); setSubOpen(null); }}
                  style={mBtn(page===sub.key, 2)}>
                  {sub.label}
                </button>
              ))}
            </div>
          )}

          {/* Eksterior accordion */}
          <button onClick={()=>setSubOpen(v=>v==="eksterior"?null:"eksterior")}
            style={{ ...mBtn(page.startsWith("eksterior"), 1), justifyContent:"space-between" }}>
            <span>Eksterior</span>
            <span style={{ fontSize:"0.6rem", fontWeight:800, color:"#fff", background:"#8B6914", padding:"4px 12px", borderRadius:5, letterSpacing:".06em" }}>{subOpen==="eksterior"?"TUTUP":"BUKA"}</span>
          </button>
          {subOpen==="eksterior" && (
            <div style={{ borderLeft:"2px solid #C9AA71", marginLeft:28 }}>
              {[
                {key:"eksterior/pagar",     label:"Pagar"},
                {key:"eksterior/kanopi",    label:"Kanopi"},
                {key:"eksterior/kusen-partisi", label:"Kusen & Partisi"},
              ].map(sub=>(
                <button key={sub.key} onClick={()=>{ navigateTo(sub.key); setMobileMenu(false); setOpen(false); setSubOpen(null); }}
                  style={mBtn(page===sub.key, 2)}>
                  {sub.label}
                </button>
              ))}
            </div>
          )}

          {/* Landscape & Taman -- dipindah ke bawah Interior & Eksterior */}
          <button onClick={()=>{ navigateTo("eksterior/taman-landscape"); setMobileMenu(false); setOpen(false); setSubOpen(null); }}
            style={mBtn(page==="eksterior/taman-landscape", 1)}>
            Landscape & Taman
          </button>

        </div>
      )}
    </div>
  );
}



function HikimoriFooter({ data, navigateTo, onWaOpen, showDevProfile }) {
  const c = data?.content || {};
  const accentGold = "#C9AA71";
  const darkBg     = "#1A2A2C";
  const darkCard   = "#213335";
  const borderCol  = "rgba(201,170,113,.15)";

  const layananLinks = [
    { label:"Layanan Kami",      page:"services" },
    { label:"Jasa Desain & RAB", page:"desainrab" },
    { label:"Tema Rumah",        page:"temarumah" },
    { label:"Interior",          page:"interior" },
    { label:"Pagar Rumah",       page:"eksterior/pagar" },
    { label:"Kanopi",            page:"eksterior/kanopi" },
    { label:"Kusen & Partisi",   page:"eksterior/kusen-partisi" },
    { label:"Landscape & Taman", page:"eksterior/taman-landscape" },
    { label:"Furnitur",          page:"furnitur" },
    { label:"Custom Furnitur",   page:"custom-furnitur" },
  ];

  const infoLinks = [
    { label:"Tentang Kami",  page:"about" },
    { label:"Proses Kerja",  page:"about" },
    { label:"Artikel",       page:"news" },
    { label:"FAQ",           page:"about" },
    { label:"Karir",         page:"about" },
    { label:"Kontak",        page:"about" },
  ];

  const phone   = displayPhone(c) || "0812-3456-7890";
  const email   = c.email   || "info@hikimoriconst.com";
  const address = c.address || "Jl. Contoh No.123, Kota Anda\nIndonesia 12345";
  const website = c.website || "www.hikimoriconst.com";
  const igLink  = c.igLink  || "https://instagram.com/hikimori_const";
  const fbLink  = c.fbLink  || "https://facebook.com/hikimori.const";
  const ytLink  = c.ytLink  || "https://youtube.com";
  const ttLink  = c.ttLink  || "https://tiktok.com";

  const BtnLink = ({ page, children }) => (
    <button onClick={() => navigateTo(page)}
      style={{ display:"flex", alignItems:"center", gap:8, background:"none", border:"none",
        color:"rgba(255,255,255,.72)", fontSize:13, cursor:"pointer", padding:"3px 0",
        textAlign:"left", fontFamily:"'Jost',sans-serif", transition:"color .15s, gap .15s",
        lineHeight:1.6 }}
      onMouseEnter={e => { e.currentTarget.style.color = accentGold; e.currentTarget.style.gap = "12px"; }}
      onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,.72)"; e.currentTarget.style.gap = "8px"; }}>
      <span style={{ color: accentGold, fontSize:11, flexShrink:0 }}>›</span>
      {children}
    </button>
  );

  const SocialBtn = ({ href, label, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
      style={{ width:36, height:36, borderRadius:"50%", border:`1px solid ${borderCol}`,
        background:"rgba(255,255,255,.06)", display:"flex", alignItems:"center", justifyContent:"center",
        color:"rgba(255,255,255,.75)", transition:"all .18s", flexShrink:0, textDecoration:"none" }}
      onMouseEnter={e => { e.currentTarget.style.background = accentGold; e.currentTarget.style.borderColor = accentGold; e.currentTarget.style.color = "#fff"; e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.borderColor = borderCol; e.currentTarget.style.color = "rgba(255,255,255,.75)"; e.currentTarget.style.transform = "translateY(0)"; }}>
      {children}
    </a>
  );

  return (
    <footer style={{ background: darkBg, fontFamily:"'Jost',sans-serif" }}>
      <style>{`
        .vf-col-title { font-size:11px; font-weight:800; letter-spacing:.18em; text-transform:uppercase; color:${accentGold}; margin-bottom:18px; }
        .vf-divider { height:1px; background:${borderCol}; margin:0; }
        @media(max-width:900px){.vf-grid{grid-template-columns:1fr 1fr!important;gap:32px!important}}
        @media(max-width:560px){.vf-grid{grid-template-columns:1fr!important;gap:26px!important}.vf-bottom{flex-direction:column!important;gap:10px!important;text-align:center!important}}
      `}</style>

      {/* -- Top divider accent -- */}
      <div style={{ height:3, background:`linear-gradient(90deg, transparent 0%, ${accentGold} 30%, ${accentGold} 70%, transparent 100%)` }} />

      {/* -- Main footer body -- */}
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"56px 5% 44px" }}>
        <div className="vf-grid" style={{ display:"grid", gridTemplateColumns:"2fr 1.1fr 1.1fr 1.4fr", gap:"48px" }}>

          {/* -- Col 1: Brand + Logo -- */}
          <div>
            {/* Logo -- diambil dari link logo yang sama dengan navbar */}
            <div style={{ marginBottom:20 }}>
              <img loading="lazy" decoding="async"
                src={cld(c.footerLogoImage || c.logoImage || HIKIMORI_LOGO_URL)}
                alt={c.logoText?.replace("\n"," ") || "Hikimori Const"}
                style={{ height:70, maxWidth:220, objectFit:"contain", display:"block",
                  filter:"brightness(1.05) drop-shadow(0 0 1px rgba(255,255,255,.9)) drop-shadow(0 0 1px rgba(255,255,255,.9)) drop-shadow(0 1px 3px rgba(0,0,0,.35))" }}
              />
            </div>

            {/* Deskripsi */}
            <p style={{ fontSize:13, color:"rgba(255,255,255,.58)", lineHeight:1.85, marginBottom:22, maxWidth:280 }}>
              {c.aboutDesc || "HIKIMORI CONST adalah perusahaan yang bergerak di bidang jasa desain arsitektur, interior, konstruksi, dan penataan landscape dengan komitmen pada kualitas, ketepatan waktu dan kepuasan klien."}
            </p>

            {/* Sosial media */}
            <div style={{ display:"flex", gap:9, flexWrap:"wrap" }}>
              {/* Facebook */}
              <SocialBtn href={fbLink} label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </SocialBtn>
              {/* Instagram */}
              <SocialBtn href={igLink} label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                </svg>
              </SocialBtn>
              {/* YouTube */}
              <SocialBtn href={ytLink} label="YouTube">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
                  <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#1A2A2C"/>
                </svg>
              </SocialBtn>
              {/* TikTok */}
              <SocialBtn href={ttLink} label="TikTok">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.29 6.29 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.72a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
                </svg>
              </SocialBtn>
            </div>
          </div>

          {/* -- Col 2: Layanan -- */}
          <div>
            <div className="vf-col-title">Layanan</div>
            <div style={{ display:"flex", flexDirection:"column" }}>
              {layananLinks.map(l => <BtnLink key={l.page} page={l.page}>{l.label}</BtnLink>)}
            </div>
          </div>

          {/* -- Col 3: Informasi -- */}
          <div>
            <div className="vf-col-title">Informasi</div>
            <div style={{ display:"flex", flexDirection:"column" }}>
              {infoLinks.map(l => <BtnLink key={l.label} page={l.page}>{l.label}</BtnLink>)}
            </div>
          </div>

          {/* -- Col 4: Kontak Kami -- */}
          <div>
            <div className="vf-col-title">Kontak Kami</div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {/* Alamat */}
              <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                <span style={{ color:accentGold, fontSize:16, flexShrink:0, marginTop:2 }}></span>
                <span style={{ fontSize:13, color:"rgba(255,255,255,.68)", lineHeight:1.75, whiteSpace:"pre-line" }}>{address}</span>
              </div>
              {/* Phone */}
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <span style={{ color:accentGold, fontSize:16, flexShrink:0 }}></span>
                <a href={`tel:${phone.replace(/\s/g,"")}`}
                  style={{ fontSize:13, color:"rgba(255,255,255,.68)", textDecoration:"none", transition:"color .15s" }}
                  onMouseEnter={e => e.currentTarget.style.color = accentGold}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.68)"}>
                  {phone}
                </a>
              </div>
              {/* Email */}
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <span style={{ color:accentGold, fontSize:16, flexShrink:0 }}></span>
                <a href={`mailto:${email}`}
                  style={{ fontSize:13, color:"rgba(255,255,255,.68)", textDecoration:"none", transition:"color .15s" }}
                  onMouseEnter={e => e.currentTarget.style.color = accentGold}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.68)"}>
                  {email}
                </a>
              </div>
              {/* Website */}
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <span style={{ color:accentGold, fontSize:16, flexShrink:0 }}></span>
                <span style={{ fontSize:13, color:"rgba(255,255,255,.68)" }}>{website}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* -- Divider -- */}
      <div className="vf-divider" />

      {/* -- Bottom bar -- */}
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"18px 5%" }}>
        <div className="vf-bottom" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:14, flexWrap:"wrap" }}>
          <span style={{ fontSize:12, color:"rgba(255,255,255,.35)", letterSpacing:".04em" }}>
            © {new Date().getFullYear()} HIKIMORI CONST. All Rights Reserved.
          </span>
          <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
            <button onClick={() => {}}
              style={{ background:"none", border:"none", fontSize:12, color:"rgba(255,255,255,.38)", cursor:"pointer",
                fontFamily:"'Jost',sans-serif", transition:"color .15s", padding:0 }}
              onMouseEnter={e => e.currentTarget.style.color = accentGold}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.38)"}>
              Kebijakan Privasi
            </button>
            <button onClick={() => {}}
              style={{ background:"none", border:"none", fontSize:12, color:"rgba(255,255,255,.38)", cursor:"pointer",
                fontFamily:"'Jost',sans-serif", transition:"color .15s", padding:0 }}
              onMouseEnter={e => e.currentTarget.style.color = accentGold}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.38)"}>
              Syarat & Ketentuan
            </button>
            {showDevProfile && (
              <button onClick={showDevProfile}
                style={{ background:"none", border:"none", fontSize:11, color:"rgba(255,255,255,.22)", cursor:"pointer",
                  fontFamily:"'Jost',sans-serif", transition:"color .15s", padding:0, letterSpacing:".06em" }}
                onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,.5)"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.22)"}>
                Power Developer
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */

// Mapping pageKey → crudKey di Firestore
const INT_PAGE_CRUD_KEY = {
  "interior/kamar-tidur":    "intKamarTidurItems",
  "interior/kamar-mandi":    "intKamarMandiItems",
  "interior/ruang-keluarga": "intRuangKeluargaItems",
  "interior/ruang-tamu":     "intRuangTamuItems",
  "interior/kitchen-set":    "intKitchenSetItems",
  "interior/ruang-kerja":    "intRuangKerjaItems",
  "interior/plafon-modern":  "intPlafonItems",
  "interior/backdrop":    "intBackdropTvItems",
  "eksterior/pagar":         "extPagarItems",
  "eksterior/kanopi":        "extKanopiItems",
  "eksterior/kusen-partisi": "extAluminiumItems",
};

/* ── Ambil otomatis kumpulan foto Interior + Eksterior + Furnitur ──
   Dipakai untuk "Foto Berjalan (Running) Home": campuran upload manual + asset otomatis. */
/* `catalogFallback` dioper dari pemanggil (bukan diimpor) supaya data katalog ±52 KB tidak ikut
   masuk bundle awal. Lihat RealEstateWeb.jsx: katalog hanya diunduh bila CMS memang masih kosong. */
function getAutoHomeRunningImages(data, catalogFallback = null) {
  const pool = [];
  Object.keys(INT_PAGE_CRUD_KEY).forEach(pageKey => {
    const crudKey = INT_PAGE_CRUD_KEY[pageKey];
    const items = (data && data[crudKey] && data[crudKey].length > 0)
      ? data[crudKey]
      : (catalogFallback?.[pageKey]?.items || []);
    items.filter(it => !it.hidden).forEach(it => { const src = it._img || it.img; if (src) pool.push(src); });
  });
  (data?.furniturItems || []).filter(p => !p.hidden).forEach(p => { if (p._img) pool.push(p._img); });
  (data?.customFurniturItems || []).filter(p => !p.hidden).forEach(p => { if (p._img) pool.push(p._img); });
  return [...new Set(pool)];
}

/* Selang-seling 2 array agar tampil campuran rapi (bukan numpuk per kelompok) */
function interleaveArrays(a, b) {
  const out = [];
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length) out.push(b[i]);
  }
  return out;
}

/* ═══════════════════════════════════════════════════════════════════
   MARQUEE KECEPATAN KONSTAN (px/detik)
   ───────────────────────────────────────────────────────────────────
   Bug lama: durasi animasi di-hardcode (mis. 55s / 38s) sementara jarak
   yang ditempuh bergantung pada lebar viewport (100vw) atau jumlah
   konten (banyak foto = track lebih panjang). Akibatnya kecepatan yang
   TERLIHAT beda-beda di tiap laptop/monitor — makin lebar layar atau
   makin banyak foto, makin "ngebut" walau durasi CSS-nya sama.
   Perbaikan: ukur lebar konten asli (scrollWidth/2, karena konten
   diduplikasi 2x untuk loop mulus) lalu hitung durasi = jarak / speed,
   sehingga kecepatan (px/detik) selalu KONSTAN di layar & jumlah
   konten apa pun. ── */
function useConstantMarqueeDuration(speedPxPerSec, watchKey) {
  const trackRef = useRef(null);
  const [state, setState] = useState({ duration: 30, ready: false });
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let cancelled = false;
    const measure = () => {
      const half = el.scrollWidth / 2; // konten diduplikasi 2x
      if (half > 0 && !cancelled) setState({ duration: Math.max(half / speedPxPerSec, 4), ready: true });
    };
    measure();
    let ro;
    if (typeof ResizeObserver !== "undefined") { ro = new ResizeObserver(measure); ro.observe(el); }
    window.addEventListener("resize", measure);
    // Re-ukur begitu gambar anak selesai dimuat -- lebar track bisa berubah
    // setelah gambar tampil, terutama sesaat setelah halaman baru dibuka.
    el.addEventListener("load", measure, true);
    return () => {
      cancelled = true;
      if (ro) ro.disconnect();
      window.removeEventListener("resize", measure);
      el.removeEventListener("load", measure, true);
    };
  }, [speedPxPerSec, watchKey]);
  return { trackRef, duration: state.duration, ready: state.ready };
}

/* Running text / marquee teks berjalan — kecepatan konstan di semua laptop/layar.
   Animasi baru mulai SETELAH lebar konten terukur (ready=true), supaya tidak ada
   kedipan/lompatan cepat sesaat halaman baru dibuka. */
function RunningTextMarquee({ text, speedPxPerSec = 70 }) {
  const { trackRef, duration, ready } = useConstantMarqueeDuration(speedPxPerSec, text);
  return (
    <div style={{ background:"#cc0000", overflow:"hidden", whiteSpace:"nowrap", padding:"5px 0", position:"relative", zIndex:10, lineHeight:1, display:"flex", alignItems:"center" }}>
      <style>{`
        @keyframes marqueeScrollConst { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .running-text-inner { display:inline-flex; will-change:transform; }
        .running-text-inner span { color:#ffffff; font-weight:700; font-size:0.78rem; letter-spacing:.04em; line-height:1; vertical-align:middle; padding-right:0; }
        @media (max-width: 600px) { .running-text-inner span { font-size:0.72rem; } }
      `}</style>
      <span ref={trackRef} className="running-text-inner" style={{ animation: ready ? `marqueeScrollConst ${duration}s linear infinite` : "none" }}>
        <span>&nbsp;&nbsp;{text}&nbsp;&nbsp;</span>
        <span aria-hidden="true">&nbsp;&nbsp;{text}&nbsp;&nbsp;</span>
      </span>
    </div>
  );
}

/* Satu baris foto berjalan — dipakai 2x (kanan & kiri) di Home. Kecepatan konstan
   walau jumlah foto (items) berubah-ubah (foto manual + otomatis dari katalog),
   dan tidak bergerak sama sekali sampai lebar aslinya terukur (ready=true) —
   mencegah lompatan cepat sesaat halaman baru dibuka / saat data asli baru masuk. */
function RunningPhotoRow({ items, direction = "right", speedPxPerSec = 45 }) {
  const { trackRef, duration, ready } = useConstantMarqueeDuration(speedPxPerSec, items.join("|"));
  const anim = direction === "right" ? "scrollRightConst" : "scrollLeftConst";
  return (
    <div style={{ overflow:"hidden" }}>
      <style>{`
        @keyframes scrollRightConst { from { transform:translateX(0); } to { transform:translateX(-50%); } }
        @keyframes scrollLeftConst  { from { transform:translateX(-50%); } to { transform:translateX(0); } }
        .photo-strip-track { display:flex; gap:14px; width:max-content; will-change:transform; }
        .photo-strip-track:hover { animation-play-state:paused; }
        .photo-strip-img { width:280px; height:180px; border-radius:12px; object-fit:cover; flex-shrink:0; display:block; }
      `}</style>
      <div ref={trackRef} className="photo-strip-track" style={{ animation: ready ? `${anim} ${duration}s linear infinite` : "none" }}>
        {items.concat(items).map((src, i) => (
          <img decoding="async" loading="lazy" key={i} src={cld(src)} alt={`Foto ${i+1}`} className="photo-strip-img"
            onError={onImgError} />
        ))}
      </div>
    </div>
  );
}

/* ─────────────── NAV DROPDOWN: TEMA RUMAH (standalone, tepat di bawah About) ─────────────── */
function NavDropdownTemaRumah({ page, navigateTo, temaList, temaSlug, openTemaDetail }) {
  const [ddOpen, setDdOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setDdOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const isActive = page === "temarumah";
  const ddBase = { position:"absolute", background:"rgba(255,255,255,.98)", borderRadius:10, boxShadow:"0 8px 32px rgba(0,0,0,.14)", border:"1px solid rgba(158,155,150,.15)", padding:"6px 0", zIndex:300, backdropFilter:"blur(12px)", minWidth:210, maxHeight:360, overflowY:"auto" };
  const btn = (active) => ({ display:"block", width:"100%", textAlign:"left", padding:"9px 18px", fontSize:"0.78rem", fontWeight:active?700:500, color:active?"#2E3D3F":"#3D5254", background:active?"#FAF7F0":"transparent", border:"none", cursor:"pointer", borderLeft:active?"2px solid #8B6914":"2px solid transparent", transition:"all .15s", letterSpacing:".04em" });

  return (
    <div style={{ position:"relative" }} ref={ref}>
      <button className={`nav-link${isActive?" active":""}`}
        onClick={() => setDdOpen(v=>!v)}
        style={{ border:"none", background:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4, padding:"4px 2px" }}>
        Tema Rumah <span style={{ fontSize:"0.6rem", opacity:0.7, transition:"transform .2s", display:"inline-block", transform:ddOpen?"rotate(180deg)":"rotate(0deg)" }}>▼</span>
      </button>
      {ddOpen && (
        <div style={{ ...ddBase, top:"calc(100% + 6px)", left:0 }}>
          <button onClick={()=>{ navigateTo("temarumah"); setDdOpen(false); }}
            style={{...btn(page==="temarumah" && !temaSlug), fontWeight:700}}
            onMouseEnter={e=>{e.currentTarget.style.background="#FAF7F0"; e.currentTarget.style.color="#2E3D3F";}}
            onMouseLeave={e=>{e.currentTarget.style.background=(page==="temarumah"&&!temaSlug)?"#FAF7F0":"transparent"; e.currentTarget.style.color=(page==="temarumah"&&!temaSlug)?"#2E3D3F":"#3D5254";}}>
            Semua Tema Rumah
          </button>
          <div style={{ margin:"4px 0 2px", borderTop:"1px solid #edf2f4" }}/>
          {(temaList || []).map(tema=>(
            <button key={tema.slug} onClick={()=>{ openTemaDetail(tema.slug); setDdOpen(false); }}
              style={btn(page==="temarumah" && temaSlug===tema.slug)}
              onMouseEnter={e=>{e.currentTarget.style.background="#FAF7F0"; e.currentTarget.style.color="#2E3D3F";}}
              onMouseLeave={e=>{e.currentTarget.style.background=(page==="temarumah"&&temaSlug===tema.slug)?"#FAF7F0":"transparent"; e.currentTarget.style.color=(page==="temarumah"&&temaSlug===tema.slug)?"#2E3D3F":"#3D5254";}}>
              {tema.nama}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────── NAV DROPDOWN: PAKET LAYANAN KAMI (3-level nested) ─────────────── */
function NavDropdownLayanan({ page, navigateTo, navDropdownLayanan }) {
  const [ddOpen, setDdOpen]   = useState(false);
  const [subOpen, setSubOpen] = useState(null); // "interior"|"eksterior"|null
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setDdOpen(false); setSubOpen(null); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const subIntPages = ["interior/kamar-tidur","interior/kamar-mandi","interior/ruang-keluarga","interior/ruang-tamu","interior/kitchen-set","interior/ruang-kerja","interior/plafon-modern","interior/backdrop"];
  const subExtPages = ["eksterior/pagar","eksterior/kanopi","eksterior/kusen-partisi","eksterior/taman-landscape"];
  const topPages    = ["services","desainrab"];
  const isActive    = [...topPages,...subIntPages,...subExtPages,"interior","pagar","kanopi","aluminium","landscape","furnitur"].some(k => k === page);

  const ddBase = { position:"absolute", background:"rgba(255,255,255,.98)", borderRadius:10, boxShadow:"0 8px 32px rgba(0,0,0,.14)", border:"1px solid rgba(158,155,150,.15)", padding:"6px 0", zIndex:300, backdropFilter:"blur(12px)", minWidth:210 };
  const btn = (active) => ({ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", textAlign:"left", padding:"9px 18px", fontSize:"0.78rem", fontWeight:active?700:500, color:active?"#2E3D3F":"#3D5254", background:active?"#FAF7F0":"transparent", border:"none", cursor:"pointer", borderLeft:active?"2px solid #8B6914":"2px solid transparent", transition:"all .15s", letterSpacing:".04em" });

  return (
    <div style={{ position:"relative" }} ref={ref}>
      <button className={`nav-link${isActive?" active":""}`}
        onClick={() => { setDdOpen(v=>!v); setSubOpen(null); }}
        style={{ border:"none", background:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4, padding:"4px 2px" }}>
        Paket Layanan Kami <span style={{ fontSize:"0.6rem", opacity:0.7, transition:"transform .2s", display:"inline-block", transform:ddOpen?"rotate(180deg)":"rotate(0deg)" }}>▼</span>
      </button>

      {ddOpen && (
        <div style={{ ...ddBase, top:"calc(100% + 6px)", left:0 }}>
          {/* Layanan Umum */}
          <div style={{ padding:"4px 18px 2px", fontSize:"0.63rem", fontWeight:700, color:"#8B9A9C", letterSpacing:".1em", textTransform:"uppercase" }}>Layanan Kami</div>
          {navDropdownLayanan.filter(i=>topPages.includes(i.key)).map(item=>(
            <button key={item.key} onClick={()=>{ navigateTo(item.key); setDdOpen(false); setSubOpen(null); }}
              style={btn(page===item.key)}
              onMouseEnter={e=>{e.currentTarget.style.background="#FAF7F0"; e.currentTarget.style.color="#2E3D3F";}}
              onMouseLeave={e=>{e.currentTarget.style.background=page===item.key?"#FAF7F0":"transparent"; e.currentTarget.style.color=page===item.key?"#2E3D3F":"#3D5254";}}>
              {item.label}
            </button>
          ))}

          <div style={{ margin:"4px 0 2px", borderTop:"1px solid #edf2f4" }}/>
          <div style={{ padding:"4px 18px 2px", fontSize:"0.63rem", fontWeight:700, color:"#8B9A9C", letterSpacing:".1em", textTransform:"uppercase" }}>Interior & Eksterior</div>

          {/* Interior nested */}
          <div style={{ position:"relative" }}
            onMouseEnter={()=>setSubOpen("interior")}
            onMouseLeave={()=>setSubOpen(null)}>
            <button style={btn(page.startsWith("interior"))}
              onClick={()=>setSubOpen(v=>v==="interior"?null:"interior")}
              onMouseEnter={e=>{e.currentTarget.style.background="#FAF7F0";}} onMouseLeave={e=>{e.currentTarget.style.background=page.startsWith("interior")?"#FAF7F0":"transparent";}}>
              <span>Interior</span><span style={{fontSize:"0.63rem",fontWeight:800,color:"#fff",background:"#8B6914",padding:"4px 12px",borderRadius:5,letterSpacing:".06em"}}>BUKA</span>
            </button>
            {subOpen==="interior" && (
              <div style={{...ddBase, top:0, left:"100%", marginLeft:4}}>
                {[
                  {key:"interior/plafon-modern",  label:"Plafon Modern"},
                  {key:"interior/kitchen-set",    label:"Kitchen Set"},
                  {key:"interior/backdrop",    label:"Backdrop"},
                  {key:"interior/kamar-tidur",    label:"Kamar Tidur"},
                  {key:"interior/kamar-mandi",    label:"Kamar Mandi"},
                  {key:"interior/ruang-keluarga", label:"Ruang Keluarga"},
                  {key:"interior/ruang-tamu",     label:"Ruang Tamu"},
                  {key:"interior/ruang-kerja",    label:"Ruang Kerja"},
                ].map(sub=>(
                  <button key={sub.key} onClick={()=>{ navigateTo(sub.key); setDdOpen(false); setSubOpen(null); }}
                    style={btn(page===sub.key)}
                    onMouseEnter={e=>{e.currentTarget.style.background="#FAF7F0"; e.currentTarget.style.color="#2E3D3F";}}
                    onMouseLeave={e=>{e.currentTarget.style.background=page===sub.key?"#FAF7F0":"transparent"; e.currentTarget.style.color=page===sub.key?"#2E3D3F":"#3D5254";}}>
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Eksterior nested */}
          <div style={{ position:"relative" }}
            onMouseEnter={()=>setSubOpen("eksterior")}
            onMouseLeave={()=>setSubOpen(null)}>
            <button style={btn(page.startsWith("eksterior"))}
              onClick={()=>setSubOpen(v=>v==="eksterior"?null:"eksterior")}
              onMouseEnter={e=>{e.currentTarget.style.background="#FAF7F0";}} onMouseLeave={e=>{e.currentTarget.style.background=page.startsWith("eksterior")?"#FAF7F0":"transparent";}}>
              <span>Eksterior</span><span style={{fontSize:"0.63rem",fontWeight:800,color:"#fff",background:"#8B6914",padding:"4px 12px",borderRadius:5,letterSpacing:".06em"}}>BUKA</span>
            </button>
            {subOpen==="eksterior" && (
              <div style={{...ddBase, top:0, left:"100%", marginLeft:4}}>
                {[
                  {key:"eksterior/pagar",           label:"Pagar"},
                  {key:"eksterior/kanopi",           label:"Kanopi"},
                  {key:"eksterior/kusen-partisi",    label:"Kusen & Partisi"},
                ].map(sub=>(
                  <button key={sub.key} onClick={()=>{ navigateTo(sub.key); setDdOpen(false); setSubOpen(null); }}
                    style={btn(page===sub.key)}
                    onMouseEnter={e=>{e.currentTarget.style.background="#FAF7F0"; e.currentTarget.style.color="#2E3D3F";}}
                    onMouseLeave={e=>{e.currentTarget.style.background=page===sub.key?"#FAF7F0":"transparent"; e.currentTarget.style.color=page===sub.key?"#2E3D3F":"#3D5254";}}>
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Landscape & Taman -- dipindah ke bawah Interior & Eksterior */}
          <button onClick={()=>{ navigateTo("eksterior/taman-landscape"); setDdOpen(false); setSubOpen(null); }}
            style={btn(page==="eksterior/taman-landscape")}
            onMouseEnter={e=>{e.currentTarget.style.background="#FAF7F0"; e.currentTarget.style.color="#2E3D3F";}}
            onMouseLeave={e=>{e.currentTarget.style.background=page==="eksterior/taman-landscape"?"#FAF7F0":"transparent"; e.currentTarget.style.color=page==="eksterior/taman-landscape"?"#2E3D3F":"#3D5254";}}>
            Landscape & Taman
          </button>

          {/* Divider Produk Retail */}
          <div style={{ margin:"4px 0 2px", borderTop:"1px solid #edf2f4" }}/>
          <div style={{ padding:"4px 18px 2px", fontSize:"0.63rem", fontWeight:700, color:"#8B9A9C", letterSpacing:".1em", textTransform:"uppercase" }}>Produk Retail</div>

          {/* Furnitur */}
          <button onClick={()=>{ navigateTo("furnitur"); setDdOpen(false); setSubOpen(null); }}
            style={btn(page==="furnitur")}
            onMouseEnter={e=>{e.currentTarget.style.background="#FAF7F0"; e.currentTarget.style.color="#2E3D3F";}}
            onMouseLeave={e=>{e.currentTarget.style.background=page==="furnitur"?"#FAF7F0":"transparent"; e.currentTarget.style.color=page==="furnitur"?"#2E3D3F":"#3D5254";}}>
            Furnitur
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────── NAV DROPDOWN: GALERI & PROYEK ─────────────── */
function NavDropdownGaleri({ page, navigateTo, navDropdownGaleri }) {
  const [ddOpen3, setDdOpen3] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setDdOpen3(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const isActive3 = navDropdownGaleri.some(i => i.key === page);
  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button className={`nav-link${isActive3 ? " active" : ""}`}
        onClick={() => setDdOpen3(v => !v)}
        style={{ border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "4px 2px" }}>
        Program Renovasi & Pembangunan <span style={{ fontSize: "0.6rem", opacity: 0.7, transition: "transform .2s", display: "inline-block", transform: ddOpen3 ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
      </button>
      {ddOpen3 && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, minWidth: 200,
          background: "rgba(255,255,255,.98)", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,.14)",
          border: "1px solid rgba(158,155,150,.15)", padding: "6px 0", zIndex: 200, backdropFilter: "blur(12px)" }}>
          {navDropdownGaleri.map(item => (
            <button key={item.key} onClick={() => { navigateTo(item.key); setDdOpen3(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 18px",
                fontSize: "0.78rem", fontWeight: page === item.key ? 700 : 500,
                color: page === item.key ? "#2E3D3F" : "#3D5254",
                background: page === item.key ? "#FAF7F0" : "transparent",
                border: "none", cursor: "pointer", borderLeft: page === item.key ? "2px solid #8B6914" : "2px solid transparent",
                transition: "all .15s", letterSpacing: ".04em" }}
              onMouseEnter={e => { e.currentTarget.style.background="#FAF7F0"; e.currentTarget.style.color="#2E3D3F"; }}
              onMouseLeave={e => { e.currentTarget.style.background=page===item.key?"#FAF7F0":"transparent"; e.currentTarget.style.color=page===item.key?"#2E3D3F":"#3D5254"; }}>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { ABOUT_LAYANAN_DEFAULT, ABOUT_MISI_DEFAULT, ABOUT_STATS_DEFAULT, ABOUT_WHY_DEFAULT, AutoGrowField, CEF, CardImg, DEFAULT_DATA, HARDCODED_USERS, HIKIMORI_LOGO_URL, HOME_SERVICES_DEFAULT, HikimoriFooter, INT_PAGE_CRUD_KEY, LEGACY_TEXT_MIGRATIONS, LogoDisplay, MobileLayananAccordion, MobileTemaRumahAccordion, NavDropdownGaleri, NavDropdownLayanan, NavDropdownTemaRumah, PAGE_TO_PATH, PATH_TO_PAGE, ROLES, RunningPhotoRow, RunningTextMarquee, SECTIONS, SECTION_LABELS, SocialProofCTA, TEMA_DATA, TemaPhotoSlideshow, UploadButton, VideoEmbed, WaPickerModal, adminSlugToTab, adminTabToPath, articleUrl, autoGrowTextarea, buildWaMsg, catalogItemUrl, detectVideoEmbed, displayPhone, formatDate, formatRp, genOTP, getAutoHomeRunningImages, getInitialAdminTab, getInitialPage, getInitialShowAdmin, interleaveArrays, makeSlug, onImgError, paketUrl, parseArtikelPath, parseCatalogItemPath, parsePaketPath, parseTemaPath, publicCaption, rebrandDeep, sanitizeRichHtml, sendOTPEmail, sessionClear, sessionLoad, sessionSave, temaDetailUrl, uploadToCloudinary, uploadWithProgress };
