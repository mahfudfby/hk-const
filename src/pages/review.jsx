/* Chunk halaman "review" — dimuat lazy (React.lazy) saat rute ini dibuka.
   Dipisah dari RealEstateWeb.jsx agar pengunjung halaman lain tidak ikut mengunduh kode ini. */
import { useState } from "react";
import { cld } from "../lib/net.js";
import { autoGrowTextarea, uploadWithProgress } from "../app/core.jsx";
/* ─────────────── REVIEW FORM (Public, One-Time Token) ─────────────── */
function ReviewForm({ token, onSubmitDone, data, save, notify, isLoading }) {
  const [step, setStep] = useState("form"); // form | done | invalid
  const [form, setForm] = useState({ name: "", email: "", stars: 5, content: "", photo: "" });
  const [photoUploading, setPhotoUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  // Must be declared here (before any early return) to obey Rules of Hooks
  const [photoUploadItem, setPhotoUploadItem] = useState(null); // {name, pct, done, error}

  // Tunggu data selesai load dari Firestore sebelum validasi token
  if (isLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#FAF7F0,#F5EDD8)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 56, height: 56, border: "4px solid #E8DCC8", borderTopColor: "#8B6914", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "#5A6A6C", fontSize: "0.9375rem", fontWeight: 500 }}>Memuat form ulasan…</p>
      </div>
    </div>
  );

  const tokenObj = (data.reviewTokens || []).find(t => t.token === token);

  if (!tokenObj) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF7F0" }}>
      <div style={{ textAlign: "center", background: "#fff", borderRadius: 16, padding: "48px 40px", maxWidth: 400, boxShadow: "0 8px 40px rgba(0,0,0,.1)" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}></div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.5rem", color: "#2E3D3F", marginBottom: 12 }}>Link Tidak Valid</h2>
        <p style={{ color: "#5A6A6C", fontSize: "0.9375rem", lineHeight: 1.7 }}>Link form ulasan ini tidak ditemukan atau sudah tidak berlaku.</p>
      </div>
    </div>
  );

  if (tokenObj.used) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF7F0" }}>
      <div style={{ textAlign: "center", background: "#fff", borderRadius: 16, padding: "48px 40px", maxWidth: 400, boxShadow: "0 8px 40px rgba(0,0,0,.1)" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}></div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.5rem", color: "#2E3D3F", marginBottom: 12 }}>Link Sudah Digunakan</h2>
        <p style={{ color: "#5A6A6C", fontSize: "0.9375rem", lineHeight: 1.7 }}>Form ulasan ini sudah pernah diisi. Setiap link hanya bisa digunakan satu kali.</p>
      </div>
    </div>
  );

  if (step === "done") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#FAF7F0,#F5EDD8)" }}>
      <div style={{ textAlign: "center", background: "#fff", borderRadius: 20, padding: "56px 48px", maxWidth: 440, boxShadow: "0 16px 56px rgba(46,61,63,.12)" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}></div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.875rem", fontWeight: 900, color: "#2E3D3F", marginBottom: 14 }}>Terima Kasih!</h2>
        <p style={{ color: "#3D5254", fontSize: "1rem", lineHeight: 1.8 }}>Ulasan Anda telah berhasil dikirim. Kami sangat menghargai kepercayaan Anda kepada HIKIMORI CONST.</p>
        <div style={{ width: 48, height: 3, background: "#8B6914", borderRadius: 2, margin: "28px auto 0" }} />
      </div>
    </div>
  );

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setPhotoUploading(true);
    setPhotoUploadItem({ name: file.name, pct: 0, done: false, error: false });
    try {
      const url = await uploadWithProgress(file, pct => setPhotoUploadItem(p => ({ ...p, pct })));
      setPhotoUploadItem({ name: file.name, pct: 100, done: true, error: false });
      setForm(p => ({ ...p, photo: url }));
      setTimeout(() => setPhotoUploadItem(null), 2000);
    } catch {
      setPhotoUploadItem(p => ({ ...p, error: true }));
      setErr("Gagal upload foto. Coba lagi.");
      setTimeout(() => setPhotoUploadItem(null), 2000);
    }
    finally { setPhotoUploading(false); }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return setErr("Nama wajib diisi.");
    if (!form.email.trim() || !form.email.includes("@")) return setErr("Email tidak valid.");
    if (!form.content.trim()) return setErr("Isi ulasan wajib diisi.");
    setSubmitting(true);
    setErr("");
    try {
      const newReview = {
        id: Date.now().toString(),
        name: form.name.trim(),
        email: form.email.trim(),
        photo: form.photo,
        stars: form.stars,
        content: form.content.trim(),
        date: new Date().toISOString().slice(0, 10),
        tokenLabel: tokenObj.label || "",
        approved: false,
      };
      const updatedTokens = (data.reviewTokens || []).map(t =>
        t.token === token ? { ...t, used: true } : t
      );
      await save({ ...data, reviews: [...(data.reviews || []), newReview], reviewTokens: updatedTokens });
      setStep("done");
    } catch { setErr("Gagal menyimpan ulasan. Coba lagi."); }
    finally { setSubmitting(false); }
  };

  const content_data = data.content;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#FAF7F0 0%,#e8f0f8 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 5%" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "48px 44px", maxWidth: 520, width: "100%", boxShadow: "0 16px 56px rgba(46,61,63,.12)" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 50%,#8B6914 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}></div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.75rem", fontWeight: 900, color: "#2E3D3F", marginBottom: 8 }}>Berikan Ulasan Anda</h1>
          <p style={{ color: "#5A6A6C", fontSize: "0.9375rem", lineHeight: 1.6 }}>Bagikan pengalaman Anda bersama {content_data.logoText?.replace("\n"," ") || "HIKIMORI CONST"}</p>
          {tokenObj.label && <div style={{ marginTop: 10, display: "inline-block", background: "#FAF7F0", border: "1px solid #A89070", color: "#8B6914", fontSize: "0.75rem", fontWeight: 600, padding: "4px 14px", borderRadius: 20 }}>{tokenObj.label}</div>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Photo Upload */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5A6A6C", letterSpacing: ".08em", textTransform: "uppercase" }}>Foto Profil (Opsional)</label>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: form.photo ? "transparent" : "linear-gradient(135deg,#E8DCC8,#E8DCC8)", border: "2px solid #E8DCC8", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {form.photo ? <img decoding="async" loading="lazy" src={cld(form.photo)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 24 }}></span>}
              </div>
              <div style={{ flex: 1 }}>
                <input type="file" accept="image/*" onChange={e => handlePhotoUpload(e.target.files?.[0])}
                  disabled={photoUploading}
                  style={{ fontSize: "0.8125rem", color: "#3D5254", width: "100%", cursor: photoUploading ? "not-allowed" : "pointer" }} />
                {photoUploadItem && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: photoUploadItem.error ? "#e74c3c" : "#2E3D3F", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {photoUploadItem.error ? "" : photoUploadItem.done ? "" : ""}{photoUploadItem.name}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: photoUploadItem.error ? "#e74c3c" : photoUploadItem.done ? "#27ae60" : "#8B6914" }}>
                        {photoUploadItem.error ? "Gagal" : photoUploadItem.done ? "Selesai" : `${photoUploadItem.pct}%`}
                      </span>
                    </div>
                    <div style={{ height: 5, background: "#E8DCC8", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 3, width: `${photoUploadItem.pct}%`,
                        background: photoUploadItem.error ? "#e74c3c" : photoUploadItem.done ? "#27ae60" : "linear-gradient(90deg,#8B6914,#E8C96A)",
                        transition: "width .2s ease" }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5A6A6C", letterSpacing: ".08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Nama Lengkap *</label>
            <input value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErr(""); }}
              placeholder="Masukkan nama Anda"
              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #D4C4A0", borderRadius: 8, fontSize: "0.9375rem", outline: "none", transition: "border-color .2s" }}
              onFocus={e => e.target.style.borderColor = "#8B6914"} onBlur={e => e.target.style.borderColor = "#D4C4A0"} />
          </div>

          {/* Email */}
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5A6A6C", letterSpacing: ".08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Email *</label>
            <input type="email" value={form.email} onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErr(""); }}
              placeholder="email@contoh.com"
              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #D4C4A0", borderRadius: 8, fontSize: "0.9375rem", outline: "none", transition: "border-color .2s" }}
              onFocus={e => e.target.style.borderColor = "#8B6914"} onBlur={e => e.target.style.borderColor = "#D4C4A0"} />
          </div>

          {/* Stars */}
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5A6A6C", letterSpacing: ".08em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>Rating *</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setForm(p => ({ ...p, stars: s }))}
                  style={{ fontSize: 32, background: "none", border: "none", cursor: "pointer", transition: "transform .15s", filter: s <= form.stars ? "none" : "grayscale(1) opacity(.3)" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.2)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}></button>
              ))}
              <span style={{ fontSize: "0.875rem", color: "#5A6A6C", alignSelf: "center", marginLeft: 6 }}>
                {["","Sangat Buruk","Buruk","Cukup","Bagus","Sangat Bagus"][form.stars]}
              </span>
            </div>
          </div>

          {/* Review Content */}
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5A6A6C", letterSpacing: ".08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Isi Ulasan *</label>
            <textarea value={form.content} onChange={e => { setForm(p => ({ ...p, content: e.target.value })); setErr(""); }}
              placeholder="Ceritakan pengalaman Anda bersama kami..."
              rows={5}
              ref={autoGrowTextarea}
              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #D4C4A0", borderRadius: 8, fontSize: "0.9375rem", outline: "none", resize: "none", overflow: "hidden", lineHeight: 1.7, transition: "border-color .2s" }}
              onInput={e => autoGrowTextarea(e.target)}
              onFocus={e => e.target.style.borderColor = "#8B6914"} onBlur={e => e.target.style.borderColor = "#D4C4A0"} />
          </div>

          {err && <div style={{ background: "#fef0f0", border: "1px solid #f5c6c6", borderRadius: 8, padding: "10px 14px", color: "#c0392b", fontSize: "0.875rem" }}>{err}</div>}

          <button onClick={handleSubmit} disabled={submitting || photoUploading}
            style={{ padding: "14px", background: submitting ? "#5A6A6C" : "linear-gradient(135deg,#2E3D3F,#8B6914)", color: "#fff", border: "none", borderRadius: 10, fontSize: "0.9375rem", fontWeight: 700, letterSpacing: ".05em", cursor: submitting ? "not-allowed" : "pointer", transition: "opacity .2s" }}>
            {submitting ? "Mengirim..." : "Kirim Ulasan"}
          </button>
        </div>
      </div>
    </div>
  );
}

export { ReviewForm };
