/* Chunk halaman "about" — dimuat lazy (React.lazy) saat rute ini dibuka.
   Dipisah dari RealEstateWeb.jsx agar pengunjung halaman lain tidak ikut mengunduh kode ini. */
import { useState, useMemo } from "react";
import { cld } from "../lib/net.js";
import { ABOUT_LAYANAN_DEFAULT, ABOUT_MISI_DEFAULT, ABOUT_STATS_DEFAULT, ABOUT_WHY_DEFAULT, TEMA_DATA, TemaPhotoSlideshow, autoGrowTextarea, displayPhone, onImgError } from "../app/core.jsx";
/* ─────────────── ABOUT PAGE ─────────────── */
function AboutPage({ content, images, teamMembers, aboutStats, aboutMisiList, aboutWhyList, aboutLayananList, navigateTo, onWaOpen, temaData, cmsData, openTemaDetail }) {
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [contactSent, setContactSent] = useState(false);

  const handleContactSubmit = () => {
    if (!contactForm.name || !contactForm.message) return;
    const lines = [
      "Halo HIKIMORI CONST!",
      "",
      "Nama: " + contactForm.name,
      "Email: " + (contactForm.email || "-"),
      "No. HP: " + (contactForm.phone || "-"),
      "Keperluan: " + (contactForm.subject || "-"),
      "",
      "Pesan:",
      contactForm.message,
    ].join("\n");
    // Form kontak: kirim langsung sebagai string (data dari user, bukan template admin)
    if (onWaOpen) onWaOpen(lines);
    setContactSent(true);
    setTimeout(() => { setContactSent(false); setContactForm({ name: "", email: "", phone: "", subject: "", message: "" }); }, 4000);
  };

  // Semua section di bawah ini diatur lewat Control Panel → Setting Halaman About.
  // Selama admin belum mengisi data CRUD, halaman tetap tampil dengan teks & foto contoh (default).
  const stats   = (aboutStats   && aboutStats.length   > 0) ? aboutStats   : ABOUT_STATS_DEFAULT;
  const misi    = (aboutMisiList&& aboutMisiList.length> 0) ? aboutMisiList: ABOUT_MISI_DEFAULT;
  const values  = (aboutWhyList && aboutWhyList.length > 0) ? aboutWhyList : ABOUT_WHY_DEFAULT;
  const layananCards = (aboutLayananList && aboutLayananList.length > 0) ? aboutLayananList : ABOUT_LAYANAN_DEFAULT;

  /* Kartu "Tema Pilihan Kami" — ambil acak dari data Tema Rumah (Control Panel),
     menggantikan kartu Susunan Tim. Diacak sekali per kunjungan halaman (bukan
     tiap render) supaya tidak berubah-ubah saat pengunjung sedang melihat. */
  const featuredTemas = useMemo(() => {
    const source = ((temaData && temaData.length > 0) ? temaData : TEMA_DATA).filter(t => !t.hidden);
    const shuffled = [...source].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  }, []);

  const goToLayanan = (slug) => {
    if (typeof navigateTo !== "function") return;
    navigateTo("services");
  };

  return (
    <div className="fade-in" style={{ minHeight: "100vh", background: "#fff" }}>

      {/* -- HERO -- */}
      <div style={{ background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", padding: "80px 5% 90px", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,.12)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, left: "20%", width: 300, height: 300, borderRadius: "50%", background: "rgba(139,105,20,.1)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto" }} className="about-hero-grid">
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(8,145,178,.15)", border: "1px solid rgba(8,145,178,.3)", borderRadius: 20, padding: "5px 16px", marginBottom: 24 }}>
              <span style={{ fontSize: 10, letterSpacing: "2px", color: "rgba(255,255,255,.80)", textTransform: "uppercase", fontWeight: 700 }}>{content.aboutHeroLabel || "Tentang Kami"}</span>
            </div>
            <h1 className="display" style={{ fontSize: "clamp(2.25rem,5vw,3.75rem)", fontWeight: 900, lineHeight: 1.06, color: "#fff", marginBottom: 24 }}>
              {content.aboutHeroTitle || "HIKIMORI CONST"}
            </h1>
            <p style={{ fontSize: "1.0625rem", color: "rgba(255,255,255,.85)", lineHeight: 1.9, maxWidth: 420, marginBottom: 32, whiteSpace: "pre-line" }}>
              {content.aboutHeroSub || content.aboutText || "Mitra terpercaya Anda untuk perjalanan wisata, pernikahan impian, dan event berkesan. Kami hadir untuk mewujudkan setiap momen menjadi kenangan tak terlupakan."}
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <button onClick={() => onWaOpen && onWaOpen()}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", color: "#fff", borderRadius: 4, fontSize: "0.8125rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", border: "none", cursor: "pointer", transition: "background .2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#8B6914"}
                onMouseLeave={e => e.currentTarget.style.background = "#2E3D3F"}>
                Hubungi Kami
              </button>
              {content.phone && (
                <button onClick={() => onWaOpen && onWaOpen()}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", background: "rgba(255,255,255,.15)", color: "#fff", borderRadius: 4, fontSize: "0.8125rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", border: "1px solid rgba(255,255,255,.3)", cursor: "pointer", textDecoration: "none", transition: "background .2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.25)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.15)"}>
                  Hubungi via WhatsApp
                </button>
              )}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {images.hero.slice(0, 4).map((src, i) => (
              <div key={i} className="img-zoom" style={{ borderRadius: 8, overflow: "hidden", aspectRatio: "4/3", boxShadow: "0 8px 24px rgba(13,59,102,.15)" }}>
                <img decoding="async" loading="lazy" src={cld(src)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* -- STATS STRIP -- */}
      <div style={{ background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", padding: "36px 5%" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 24, textAlign: "center" }}>
          {stats.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: "clamp(1.75rem,4vw,2.5rem)", fontWeight: 900, color: "#D4AF37", fontFamily: "'Playfair Display',serif", lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,.65)", marginTop: 6, fontWeight: 500, letterSpacing: ".04em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* -- VISI MISI -- */}
      <div style={{ padding: "80px 5%", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }} className="grid-2">
          <div style={{ background: "linear-gradient(135deg, #2E3D3F 0%, #3D5254 100%)", borderRadius: 12, padding: "40px 36px", color: "#fff" }}>
            <div style={{ fontSize: 36, marginBottom: 20 }}></div>
            <h3 style={{ fontSize: "1.5rem", fontFamily: "'Playfair Display',serif", fontWeight: 800, marginBottom: 16, color: "#fff" }}>Visi Kami</h3>
            <p style={{ fontSize: "0.9375rem", lineHeight: 1.85, color: "rgba(255,255,255,.8)", whiteSpace: "pre-line" }}>
              {content.aboutVisiText || "Menjadi perusahaan developer perumahan dan jasa desain terkemuka di Indonesia yang dikenal atas pelayanan profesional, kualitas konstruksi, dan kemampuan mewujudkan hunian impian bagi setiap klien."}
            </p>
          </div>
          <div style={{ background: "#FAF7F0", borderRadius: 12, padding: "40px 36px", borderLeft: "4px solid #8B6914" }}>
            <div style={{ fontSize: 36, marginBottom: 20 }}></div>
            <h3 style={{ fontSize: "1.5rem", fontFamily: "'Playfair Display',serif", fontWeight: 800, marginBottom: 16, color: "#2E3D3F" }}>Misi Kami</h3>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
              {misi.map((m, i) => (
                <li key={i} style={{ display: "flex", gap: 10, fontSize: "0.9rem", color: "#3D5254", lineHeight: 1.6 }}>
                  <span style={{ color: "#8B6914", fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* -- WHY CHOOSE US -- */}
      <div style={{ background: "linear-gradient(130deg,#084060 0%,#0a6ea0 50%,#0cb5cc 100%)", padding: "80px 5%" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ fontSize: "0.6875rem", letterSpacing: "2px", color: "rgba(255,255,255,.75)", textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>{content.aboutWhyLabel || "Keunggulan Kami"}</div>
            <h2 className="display" style={{ fontSize: "clamp(1.75rem,4vw,2.75rem)", fontWeight: 900, color: "#fff" }}>{content.aboutWhyTitle || "Mengapa Memilih HIKIMORI CONST?"}</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {values.map((v, i) => (
              <div key={v.id || i} className="hover-lift" style={{ background: "#fff", borderRadius: 12, padding: "32px 28px", boxShadow: "0 2px 12px rgba(46,61,63,.06)", borderTop: "3px solid #8B6914", transition: "all .3s" }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{v.icon}</div>
                <h3 style={{ fontSize: "1.05rem", fontFamily: "'Playfair Display',serif", fontWeight: 700, color: "#2E3D3F", marginBottom: 10 }}>{v.title}</h3>
                <p style={{ fontSize: "0.9rem", color: "#3D5254", lineHeight: 1.75, whiteSpace: "pre-line" }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* -- TEMA PILIHAN KAMI (acak dari data Tema Rumah, menggantikan kartu tim) -- */}
      <div style={{ padding: "80px 5%" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            {content.aboutTeamLabel && (
              <div style={{ fontSize: "0.6875rem", letterSpacing: "2px", color: "#8B6914", textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>{content.aboutTeamLabel}</div>
            )}
            <h2 className="display" style={{ fontSize: "clamp(1.75rem,4vw,2.75rem)", fontWeight: 900, color: "#2E3D3F" }}>{content.aboutTeamTitle || "Hikimori Const INDONESIA"}</h2>
          </div>
          {featuredTemas.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#5A6A6C" }}>Data tema rumah belum diisi. Hubungi administrator.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 28 }}>
              {featuredTemas.map((tema) => (
                <div key={tema.id || tema.slug} className="hover-lift" style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 16px rgba(13,59,102,.08)", textAlign: "center", transition: "all .3s", cursor: openTemaDetail ? "pointer" : "default" }}
                  onClick={() => openTemaDetail && openTemaDetail(tema.slug)}>
                  {/* Foto tema (auto-skip kalau ada foto rusak, konsisten dengan kartu di Home) */}
                  <div style={{ height: 220, overflow: "hidden", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 50%,#8B6914 100%)", position: "relative" }}>
                    <TemaPhotoSlideshow slug={tema.slug} nama={tema.nama} cmsData={cmsData} fallbackImg={tema.img} />
                    {/* Name overlay at bottom */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "linear-gradient(to top, rgba(13,59,102,.75), transparent)", pointerEvents: "none" }} />
                  </div>
                  <div style={{ padding: "20px 20px 24px" }}>
                    <h3 style={{ fontSize: "1rem", fontFamily: "'Playfair Display',serif", fontWeight: 800, color: "#2E3D3F", marginBottom: 4 }}>{tema.nama}</h3>
                    <div style={{ fontSize: "0.8125rem", color: "#8B6914", fontWeight: 600, marginBottom: 12 }}>{tema.tagline || "Tema Rumah"}</div>
                    {tema.deskripsi && (
                      <p style={{ fontSize: "0.8125rem", color: "#5A6A6C", fontStyle: "italic", lineHeight: 1.65, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{tema.deskripsi}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* -- LAYANAN KAMI -- */}
      <div style={{ padding: "80px 5%", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: "0.6875rem", letterSpacing: "3px", color: "#C9AA71", textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>{content.aboutLayananLabel || "LAYANAN KAMI"}</div>
            <h2 className="display" style={{ fontSize: "clamp(1.6rem,3.5vw,2.5rem)", fontWeight: 900, color: "#1a1a1a" }}>{content.aboutLayananTitle || "Layanan Terbaik Untuk Anda"}</h2>
          </div>

          {/* Cards Grid -- otomatis menyesuaikan jumlah item dari Control Panel */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(layananCards.length, 6) || 1}, 1fr)`, gap: 20 }} className="layanan-grid">
            {layananCards.map((s, i) => (
              <div key={s.id || i}
                style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 18px rgba(0,0,0,.10)", background: "#fff", display: "flex", flexDirection: "column", transition: "transform .22s, box-shadow .22s", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,0,0,.16)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,.10)"; }}>

                {/* Image area */}
                <div style={{ position: "relative", height: 170, overflow: "hidden", flexShrink: 0, background: "#E8DCC8" }}>
                  {s.img && (
                    <img decoding="async"
                      src={cld(s.img)}
                      alt={s.title}
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .4s" }}
                      onMouseEnter={e => e.target.style.transform = "scale(1.06)"}
                      onMouseLeave={e => e.target.style.transform = "scale(1)"}
                      onError={e => { e.target.parentElement.style.background = "#E8DCC8"; onImgError(e); }}
                    />
                  )}
                  {/* Icon circle overlapping bottom of image */}
                  <div style={{
                    position: "absolute", bottom: -22, left: "50%", transform: "translateX(-50%)",
                    width: 48, height: 48, borderRadius: "50%",
                    background: "linear-gradient(135deg,#2E3D3F 0%,#8B6914 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, boxShadow: "0 4px 14px rgba(0,0,0,.22)", border: "3px solid #fff"
                  }}>
                    {s.icon}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: "36px 18px 22px", textAlign: "center", display: "flex", flexDirection: "column", flex: 1 }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#1a1a1a", marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ fontSize: "0.82rem", color: "#5A6A6C", lineHeight: 1.6, marginBottom: 16, flex: 1 }}>{s.desc}</p>
                  <button
                    onClick={() => goToLayanan(s.slug)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: "0.8125rem", fontWeight: 700, color: "#C9AA71",
                      display: "inline-flex", alignItems: "center", gap: 4,
                      transition: "gap .2s, color .2s", padding: 0, alignSelf: "center"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.gap = "8px"; e.currentTarget.style.color = "#8B6914"; }}
                    onMouseLeave={e => { e.currentTarget.style.gap = "4px"; e.currentTarget.style.color = "#C9AA71"; }}>
                    Selengkapnya <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Responsive style untuk layanan-grid */}
      <style>{`
        @media (max-width: 1100px) { .layanan-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 720px)  { .layanan-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 480px)  { .layanan-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* -- CONTACT US -- */}
      <div style={{ background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", padding: "80px 5%" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ fontSize: "0.6875rem", letterSpacing: "2px", color: "rgba(255,255,255,.75)", textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>Hubungi Kami</div>
            <h2 className="display" style={{ fontSize: "clamp(1.75rem,4vw,2.75rem)", fontWeight: 900, color: "#fff" }}>Contact Us</h2>
            <p style={{ fontSize: "1rem", color: "rgba(255,255,255,.85)", marginTop: 12, maxWidth: 480, margin: "12px auto 0" }}>Siap membantu Anda merencanakan momen terbaik. Hubungi kami sekarang!</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 48 }} className="contact-grid">
            {/* Info kontak */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {[
                { icon: "", label: "Telepon / WhatsApp", value: displayPhone(content), href: "#wa-picker", type: "link", onClick: (e) => { e.preventDefault(); if (onWaOpen) onWaOpen(); } },
                { icon: "", label: "Email", value: content.email, href: `mailto:${content.email}`, type: "link" },
                { icon: "", label: "Alamat", value: content.address || "Malang, Jawa Timur, Indonesia", type: "text" },
                { icon: "", label: "Jam Operasional", value: content.hours || "Senin – Sabtu: 08.00 – 20.00 WIB", type: "text" },
              ].map(info => (
                <div key={info.label} style={{ display: "flex", gap: 16, alignItems: "flex-start", background: "rgba(255,255,255,.7)", borderRadius: 10, padding: "18px 20px", backdropFilter: "blur(8px)" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{info.icon}</div>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#5A6A6C", fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 4 }}>{info.label}</div>
                    {info.type === "link"
                      ? <a href={info.href} onClick={info.onClick} target={info.href.startsWith("https") ? "_blank" : "_self"} rel="noopener noreferrer" style={{ fontSize: "0.9375rem", color: "#8B6914", fontWeight: 600, textDecoration: "none" }}>{info.value}</a>
                      : <div style={{ fontSize: "0.9375rem", color: "#2E3D3F", fontWeight: 500 }}>{info.value}</div>
                    }
                  </div>
                </div>
              ))}

              {/* Social Media */}
              <div style={{ background: "rgba(255,255,255,.7)", borderRadius: 10, padding: "18px 20px", backdropFilter: "blur(8px)" }}>
                <div style={{ fontSize: "0.75rem", color: "#5A6A6C", fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 14 }}>Media Sosial</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[
                    { label: "Instagram", icon: "", href: content.igLink || "https://instagram.com", color: "#e1306c" },
                    { label: "Facebook", icon: "", href: content.fbLink || "https://facebook.com", color: "#1877f2" },
                  ].map(s => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: s.color, color: "#fff", borderRadius: 20, fontSize: "0.8125rem", fontWeight: 600, textDecoration: "none", transition: "opacity .2s" }}
                      onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                      {s.icon} {s.label}
                    </a>
                  ))}
                  <button onClick={() => onWaOpen && onWaOpen()}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#25d366", color: "#fff", borderRadius: 20, fontSize: "0.8125rem", fontWeight: 600, border: "none", cursor: "pointer", transition: "opacity .2s" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                    WhatsApp
                  </button>
                </div>
              </div>
            </div>

            {/* Form */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "36px 32px", boxShadow: "0 8px 40px rgba(46,61,63,.12)" }}>
              <h3 style={{ fontSize: "1.25rem", fontFamily: "'Playfair Display',serif", fontWeight: 800, color: "#2E3D3F", marginBottom: 24 }}>Kirim Pesan</h3>
              {contactSent ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}></div>
                  <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.25rem", color: "#27ae60", marginBottom: 8 }}>Pesan Terkirim!</h4>
                  <p style={{ color: "#3D5254", fontSize: "0.9rem" }}>Kami akan segera menghubungi Anda melalui WhatsApp.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5A6A6C", textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: 6 }}>Nama *</label>
                      <input value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Nama lengkap"
                        style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #D4C4A0", borderRadius: 8, fontSize: "0.9rem", outline: "none", transition: "border .2s" }}
                        onFocus={e => e.target.style.borderColor = "#8B6914"}
                        onBlur={e => e.target.style.borderColor = "#D4C4A0"} />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5A6A6C", textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: 6 }}>No. HP</label>
                      <input value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="08xx-xxxx-xxxx"
                        style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #D4C4A0", borderRadius: 8, fontSize: "0.9rem", outline: "none", transition: "border .2s" }}
                        onFocus={e => e.target.style.borderColor = "#8B6914"}
                        onBlur={e => e.target.style.borderColor = "#D4C4A0"} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5A6A6C", textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: 6 }}>Email</label>
                    <input value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="email@domain.com"
                      style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #D4C4A0", borderRadius: 8, fontSize: "0.9rem", outline: "none", transition: "border .2s" }}
                      onFocus={e => e.target.style.borderColor = "#8B6914"}
                      onBlur={e => e.target.style.borderColor = "#D4C4A0"} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5A6A6C", textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: 6 }}>Keperluan</label>
                    <select value={contactForm.subject} onChange={e => setContactForm(p => ({ ...p, subject: e.target.value }))}
                      style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #D4C4A0", borderRadius: 8, fontSize: "0.9rem", outline: "none", background: "#fff", color: contactForm.subject ? "#2E3D3F" : "#7ab5cc" }}>
                      <option value="">-- Pilih keperluan --</option>
                      <option value="Gedung & Rumah">Gedung & Rumah</option>
                      <option value="Interior">Interior</option>
                      <option value="Exterior">Exterior</option>
                      <option value="Konsultasi">Konsultasi Umum</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5A6A6C", textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: 6 }}>Pesan *</label>
                    <textarea value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                      placeholder="Ceritakan kebutuhan Anda..."
                      rows={4}
                      ref={autoGrowTextarea}
                      style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #D4C4A0", borderRadius: 8, fontSize: "0.9rem", outline: "none", resize: "none", overflow: "hidden", lineHeight: 1.65, transition: "border .2s" }}
                      onInput={e => autoGrowTextarea(e.target)}
                      onFocus={e => e.target.style.borderColor = "#8B6914"}
                      onBlur={e => e.target.style.borderColor = "#D4C4A0"} />
                  </div>
                  <button onClick={handleContactSubmit}
                    style={{ padding: "13px 28px", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", color: "#fff", border: "none", borderRadius: 8, fontSize: "0.875rem", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", cursor: "pointer", transition: "background .2s", display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#8B6914"}
                    onMouseLeave={e => e.currentTarget.style.background = "#2E3D3F"}>
                    Kirim via WhatsApp
                  </button>
                  <p style={{ fontSize: "0.8rem", color: "#7ab5cc", textAlign: "center" }}>Pesan akan diteruskan ke WhatsApp kami untuk respons lebih cepat.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* -- MAP LOKASI -- */}
      <div style={{ padding: "0" }}>
        <iframe
          title="Lokasi HIKIMORI CONST"
          src="https://www.google.com/maps?q=Malang,Jawa+Timur,Indonesia&output=embed&z=12"
          width="100%" height="300"
          style={{ border: 0, display: "block" }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

    </div>
  );
}

export { AboutPage };
