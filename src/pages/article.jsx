/* Chunk halaman "article" — dimuat lazy (React.lazy) saat rute ini dibuka.
   Dipisah dari RealEstateWeb.jsx agar pengunjung halaman lain tidak ikut mengunduh kode ini. */
import { useState } from "react";
import { cld } from "../lib/net.js";
import { articleUrl, formatDate, onImgError, sanitizeRichHtml } from "../app/core.jsx";
/* ─────────────── RICH TEXT RENDERER ─────────────── */
function RichRenderer({ blocks }) {
  if (!blocks || !blocks.length) return <p style={{ color: "#5A6A6C", fontStyle: "italic" }}>No content yet.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {blocks.map((b, i) => {
        if (b.type === "paragraph") return (
          <div key={i} style={{ fontSize: "1rem", lineHeight: 1.85, color: "#2E3D3F" }}
            dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(b.value) }} />
        );
        if (b.type === "heading") return (
          <h2 key={i} className="display" style={{ fontSize: "1.625rem", fontWeight: 800, color: "#2E3D3F", marginTop: 12 }}>{b.value}</h2>
        );
        if (b.type === "image") return (
          <figure key={i} style={{ margin: "10px 0" }}>
            <img decoding="async" loading="lazy" src={cld(b.value)} alt={b.caption || ""} style={{ width: "100%", maxHeight: 460, objectFit: "cover", borderRadius: 8 }} />
            {b.caption && <figcaption style={{ fontSize: "0.8125rem", color: "#3D5254", textAlign: "center", marginTop: 10, fontStyle: "italic", lineHeight: 1.5 }}>{b.caption}</figcaption>}
          </figure>
        );
        if (b.type === "quote") return (
          <blockquote key={i} style={{ borderLeft: "3px solid #8B6914", paddingLeft: 22, margin: "10px 0" }}>
            <p style={{ fontSize: "1.125rem", fontStyle: "italic", color: "#2E3D3F", lineHeight: 1.75, fontFamily: "'Cormorant Garamond',serif" }}>{b.value}</p>
          </blockquote>
        );
        if (b.type === "embed_instagram") return (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ background: "#FAF7F0", border: "1px solid #E8DCC8", borderRadius: 8, padding: 16, fontSize: "0.8125rem", color: "#3D5254" }}>
              <strong>Instagram Embed:</strong> <a href={b.value} target="_blank" rel="noopener noreferrer" style={{ color: "#8B6914" }}>{b.value}</a>
              <blockquote className="instagram-media" data-instgrm-permalink={b.value} data-instgrm-version="14" style={{ border: "1px solid #D4C4A0", borderRadius: 6, padding: 10, marginTop: 8, background: "#fff" }}>
                <a href={b.value} target="_blank" rel="noopener noreferrer" style={{ color: "#8B6914", display: "block", marginTop: 6 }}>View on Instagram</a>
              </blockquote>
            </div>
          </div>
        );
        if (b.type === "embed_tiktok") return (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ background: "#FAF7F0", border: "1px solid #E8DCC8", borderRadius: 8, padding: 16, fontSize: "0.8125rem", color: "#3D5254" }}>
              <strong>TikTok Embed:</strong> <a href={b.value} target="_blank" rel="noopener noreferrer" style={{ color: "#8B6914" }}>{b.value}</a>
              <div style={{ background: "#fff", borderRadius: 6, border: "1px solid #D4C4A0", padding: "12px 14px", marginTop: 8 }}>
                <blockquote className="tiktok-embed" cite={b.value} data-video-id={b.value.split("/video/")[1]?.split("?")[0] || ""}>
                  <section><a href={b.value} target="_blank" rel="noopener noreferrer" style={{ color: "#8B6914" }}>View on TikTok</a></section>
                </blockquote>
              </div>
            </div>
          </div>
        );
        if (b.type === "divider") return <hr key={i} style={{ border: "none", borderTop: "1px solid #E8DCC8" }} />;
        if (b.type === "baca_juga") return (
          <div key={i} style={{ borderLeft: "4px solid #8B6914", background: "linear-gradient(90deg,#FAF7F0 0%,#f8fdff 100%)", borderRadius: "0 10px 10px 0", padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 18 }}></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#8B6914", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 4 }}>Baca Juga</div>
              <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#2E3D3F", lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.title}</div>
            </div>
            {b.coverImage && <img decoding="async" loading="lazy" src={cld(b.coverImage)} alt="" style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} onError={onImgError} />}
          </div>
        );
        return null;
      })}
    </div>
  );
}

/* ─────────────── POST CARD ─────────────── */
function PostCard({ post, onClick, view = "grid" }) {
  const firstImg = (post.content || []).find(b => b.type === "image")?.value;

  if (view === "list") return (
    <article className="post-card hover-lift post-card-list" onClick={onClick}
      style={{ display: "flex", gap: 20, background: "#fff", borderRadius: 8, overflow: "hidden",
        cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,.06)", marginBottom: 16 }}>
      {firstImg && (
        <div className="post-thumb" style={{ flexShrink: 0, width: 180, height: 130, overflow: "hidden" }}>
          <img decoding="async" loading="lazy" src={cld(firstImg)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s" }}
            onError={onImgError} />
        </div>
      )}
      <div style={{ padding: "14px 16px 14px 0", flex: 1 }}>
        {post.category && <span className="label-xs" style={{ color: "#8B6914" }}>{post.category}</span>}
        <h3 className="post-card-title" style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700,
          fontSize: "1.1rem", color: "#2E3D3F", margin: "6px 0 8px", lineHeight: 1.35, transition: "color .2s",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.title}</h3>
        <p style={{ fontSize: "0.875rem", color: "#3D5254", lineHeight: 1.65, marginBottom: 10 }}>
          {post.excerpt?.length > 100 ? post.excerpt.slice(0, 100) + "…" : post.excerpt}
        </p>
        <span style={{ fontSize: "0.75rem", color: "#5A6A6C" }}>{formatDate(post.date)}</span>
      </div>
    </article>
  );

  return (
    <article className="post-card hover-lift" onClick={onClick}
      style={{ background: "#fff", borderRadius: 8, overflow: "hidden", cursor: "pointer",
        boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
      {firstImg && (
        <div className="img-zoom" style={{ height: 200, overflow: "hidden" }}>
          <img decoding="async" loading="lazy" src={cld(firstImg)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={onImgError} />
        </div>
      )}
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          {post.category && <span className="label-xs" style={{ color: "#8B6914" }}>{post.category}</span>}
          {post.badge && <span style={{ fontSize: "0.6875rem", background: "#fff3cd", color: "#7a5c00", padding: "2px 9px", borderRadius: 10, fontWeight: 600, letterSpacing: ".03em" }}>{post.badge}</span>}
          <span style={{ fontSize: "0.75rem", color: "#5A6A6C" }}>{formatDate(post.date)}</span>
        </div>
        <h3 className="post-card-title" style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700,
          fontSize: "1.15rem", color: "#2E3D3F", marginBottom: 10, lineHeight: 1.35, transition: "color .2s",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.title}</h3>
        <p style={{ fontSize: "0.875rem", color: "#3D5254", lineHeight: 1.7 }}>
          {post.excerpt?.length > 110 ? post.excerpt.slice(0, 110) + "…" : post.excerpt}
        </p>

        {post.tags?.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
            {post.tags.slice(0, 3).map(t => (
              <span key={t} style={{ fontSize: "0.6875rem", padding: "3px 9px", background: "#FAF7F0", border: "1px solid #E8DCC8", borderRadius: 10, color: "#3D5254", fontWeight: 500 }}>#{t}</span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

/* ─────────────── ARTICLE DETAIL VIEW ─────────────── */
function ArticleDetail({ post, onBack, allPosts = [], onReadPost }) {
  const [copied, setCopied] = useState(false);

  /* Related: same category/section */
  const related = allPosts
    .filter(p => p.status === "published" && p.id !== post.id &&
      (p.category === post.category || p.section === post.section))
    .slice(0, 8);

  /* All other published posts excluding current */
  const others = allPosts
    .filter(p => p.status === "published" && p.id !== post.id)
    .slice(-16).reverse();

  /* "Artikel Terkait" — prefer related, fallback to others */
  const artikelTerkait = related.length >= 2 ? related : others.slice(0, 6);

  /* "Pilihan Untukmu" — grid below article */
  const pilihanUntukmu = others
    .filter(p => !artikelTerkait.find(r => r.id === p.id))
    .slice(0, 6);

  /* Sidebar right — stacked cards */
  const sidebarCards = others
    .filter(p => !artikelTerkait.find(r => r.id === p.id) && !pilihanUntukmu.find(r => r.id === p.id))
    .slice(0, 6);

  const handlePost = (p) => {
    if (onReadPost) { onReadPost(p); window.scrollTo(0, 0); }
  };

  // Gunakan URL canonical artikel, bukan window.location.href yang bisa berubah
  const shareUrl = typeof window !== "undefined"
    ? window.location.origin + articleUrl(post)
    : "";

  const copyLink = () => {
    navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const sectionLabel = { news: "Exterior", shop: "Gedung & Rumah", destinations: "Interior" };
  const breadSection = sectionLabel[post.section] || post.section || "Artikel";

  return (
    <div className="fade-in art-page">

      {/* == SHARE BAR (sticky) == */}
      <div className="art-share-bar">
        <button onClick={onBack} style={{ fontSize: 12, color: "#8B6914", fontWeight: 600, background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
          ← Kembali
        </button>
        <span style={{ color: "#ddd" }}>|</span>
        <span style={{ fontSize: 11, color: "#666", fontWeight: 600, letterSpacing: ".5px" }}>BAGIKAN:</span>
        {[
          { bg: "#1877f2", label: "f", url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
          { bg: "#1da1f2", label: "𝕏", url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}` },
          { bg: "#25d366", label: "", url: `https://wa.me/?text=${encodeURIComponent(post.title + " " + shareUrl)}` },
          { bg: "#0088cc", label: "", url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}` },
        ].map(s => (
          <div key={s.label} className="art-share-icon" style={{ background: s.bg }}
            onClick={() => window.open(s.url, "_blank")}>{s.label}</div>
        ))}
        <span className="art-share-title">{post.title}</span>
        <span style={{ fontSize: 11, color: "#666", fontWeight: 600, letterSpacing: ".5px", whiteSpace: "nowrap" }}>KOMENTAR:</span>
      </div>

      {/* == BODY WRAPPER: main + right sidebar == */}
      <div className="art-body-wrap">

        {/* ==== MAIN COLUMN ==== */}
        <main className="art-main">

          {/* -- Article Card -- */}
          <div className="art-content-card" style={{ marginBottom: 20 }}>

            <div className="art-content-inner">
              {/* Breadcrumb */}
              <div className="art-breadcrumb">
                HIKIMORI CONST / <span>{breadSection}</span>
              </div>

              {/* Title */}
              <h1 className="art-h1">{post.title}</h1>

              {/* Meta Row */}
              <div className="art-meta-row">
                <div className="art-author">
                  <div className="art-avatar">
                    {(post.author || "A")[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#222" }}>{post.author || "Penulis"}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>Penulis · {formatDate(post.date)}</div>
                  </div>
                </div>
                <div className="art-actions">
                  {[
                    { icon: "", title: "Suka" },
                    { icon: "G", title: "Google", style: { fontSize: 11, fontWeight: 700, color: "#4285f4" } },
                    { icon: "", title: "Simpan" },
                    { icon: "↗", title: "Bagikan" },
                    { icon: "", title: "Komentar" },
                    { icon: "", title: "Ikuti" },
                  ].map(a => (
                    <button key={a.title} className="art-action-btn" title={a.title}>
                      <span style={a.style}>{a.icon}</span>
                    </button>
                  ))}
                </div>
              </div>


              {/* Excerpt */}
              {post.excerpt && (
                <p className="art-excerpt">{post.excerpt}</p>
              )}

              {/* Article Body */}
              <RichRenderer blocks={post.content} />

              {/* Tags */}
              {post.tags?.length > 0 && (
                <div className="art-tags">
                  <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Tags:</span>
                  {post.tags.map(t => (
                    <span key={t} style={{ fontSize: 12, padding: "3px 12px", background: "#FAF7F0", border: "1px solid #E8DCC8", borderRadius: 20, color: "#3D5254", fontWeight: 500 }}>#{t}</span>
                  ))}
                </div>
              )}

              {/* Share Bottom */}
              <div style={{ marginTop: 28, padding: "18px 0 0", borderTop: "2px solid #f0f0f0", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#555", letterSpacing: ".5px" }}>Bagikan:</span>
                {[
                  { label: "Facebook", bg: "#1877f2", icon: "f", url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
                  { label: "Twitter/X", bg: "#000", icon: "𝕏", url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}` },
                  { label: "WhatsApp", bg: "#25d366", icon: "", url: `https://wa.me/?text=${encodeURIComponent(post.title + " " + shareUrl)}` },
                  { label: "Telegram", bg: "#0088cc", icon: "", url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}` },
                ].map(s => (
                  <button key={s.label} onClick={() => window.open(s.url, "_blank")}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 16px", borderRadius: 4, background: s.bg,
                      border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    <span>{s.icon}</span> {s.label}
                  </button>
                ))}
                <button onClick={copyLink}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 16px", borderRadius: 4,
                    background: copied ? "#27ae60" : "#f0f0f0", border: "1px solid #ddd",
                    color: copied ? "#fff" : "#555", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {copied ? "Tersalin!" : "Salin Link"}
                </button>
              </div>
            </div>
          </div>

          {/* -- Artikel Terkait (horizontal scroll) -- */}
          {artikelTerkait.length > 0 && (
            <div className="art-content-card" style={{ marginBottom: 20, padding: "20px 24px" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 16, paddingBottom: 10, borderBottom: "2px solid #8B6914", display: "inline-block" }}>
                Artikel Terkait
              </h3>
              <div className="art-terkait-scroll">
                {artikelTerkait.map(p => (
                  <div key={p.id} className="art-terkait-card" onClick={() => handlePost(p)}>
                    {(() => { const img = (p.content||[]).find(b=>b.type==="image")?.value; return img
                      ? <div style={{ height: 120, overflow: "hidden" }}><img decoding="async" loading="lazy" src={cld(img)} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform .3s" }} onMouseEnter={e=>e.target.style.transform="scale(1.05)"} onMouseLeave={e=>e.target.style.transform="scale(1)"} onError={onImgError} /></div>
                      : <div style={{ height: 120, background: "linear-gradient(135deg,#FAF7F0,#E8DCC8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}></div>;
                    })()}
                    <div style={{ padding: "10px 12px 14px" }}>
                      {p.category && <div style={{ fontSize: 10, color: "#8B6914", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 5 }}>{p.category}</div>}
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: "#222", lineHeight: 1.45,
                        display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {p.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* -- Pilihan Untukmu (grid) -- */}
          {pilihanUntukmu.length > 0 && (
            <div className="art-content-card" style={{ padding: "20px 24px" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 16, paddingBottom: 10, borderBottom: "2px solid #f39c12", display: "inline-block" }}>
                Pilihan Untukmu
              </h3>
              <div className="art-pilihan-grid">
                {pilihanUntukmu.map(p => (
                  <div key={p.id} className="art-pilihan-card" onClick={() => handlePost(p)}>
                    {(() => { const img = (p.content||[]).find(b=>b.type==="image")?.value; return img
                      ? <div style={{ height: 140, overflow: "hidden" }}><img decoding="async" loading="lazy" src={cld(img)} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform .3s" }} onMouseEnter={e=>e.target.style.transform="scale(1.05)"} onMouseLeave={e=>e.target.style.transform="scale(1)"} onError={onImgError} /></div>
                      : <div style={{ height: 140, background: "linear-gradient(135deg,#FDFAF4,#FAF7F0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}></div>;
                    })()}
                    <div style={{ padding: "12px 14px 16px" }}>
                      {p.category && <div style={{ fontSize: 10, color: "#8B6914", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 5 }}>{p.category}</div>}
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#222", lineHeight: 1.45,
                        display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {p.title}
                      </p>
                      <div style={{ fontSize: 11, color: "#aaa", marginTop: 8 }}>
                        {breadSection} · · ·
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>

        {/* ==== RIGHT SIDEBAR ==== */}
        <aside className="art-sidebar">

          {/* -- Ad Placeholder -- */}
          <div style={{ background: "#fff", borderRadius: 6, border: "1px dashed #ddd", marginBottom: 20, height: 240, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#bbb", gap: 8 }}>
            <div style={{ fontSize: 28 }}></div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>HIKIMORI CONST</div>
            <div style={{ fontSize: 11, color: "#ccc", textAlign: "center", padding: "0 20px", lineHeight: 1.6 }}>
              Wujudkan perjalanan impian & momen spesialmu bersama kami
            </div>
            <a href="#" style={{ marginTop: 6, fontSize: 11, padding: "6px 16px", background: "#8B6914", color: "#fff", borderRadius: 4, fontWeight: 600, textDecoration: "none" }}>
              Hubungi Kami
            </a>
          </div>

          {/* -- Berita Populer sidebar cards -- */}
          {sidebarCards.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 6, overflow: "hidden", marginBottom: 20 }}>
              <div style={{ padding: "12px 16px", borderBottom: "2px solid #8B6914" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>Berita Terpopuler</span>
              </div>
              <div style={{ padding: "8px 16px" }}>
                {sidebarCards.map(p => (
                  <div key={p.id} className="art-sb-card" onClick={() => handlePost(p)}>
                    <div className="art-sb-thumb">
                      {(() => { const img = (p.content||[]).find(b=>b.type==="image")?.value; return img
                        ? <img decoding="async" loading="lazy" src={cld(img)} alt="" onError={onImgError} />
                        : <div style={{ width:"100%", height:"100%", background:"#FAF7F0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}></div>;
                      })()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#222", lineHeight: 1.45,
                        display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {p.title}
                      </p>
                      {p.category && <div style={{ fontSize: 10, color: "#8B6914", marginTop: 5, fontWeight: 600 }}>{p.category}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* -- Layanan Unggulan sidebar -- */}
          <div style={{ background: "linear-gradient(135deg,#2E3D3F 0%,#3D5254 55%,#E8C96A 100%)", borderRadius: 6, padding: "20px 18px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.7)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Layanan Kami</div>
            {[
              { icon: "", txt: "Gedung & Rumah" },
              { icon: "", txt: "Interior" },
              { icon: "", txt: "Exterior" },
              { icon: "", txt: "Hotel & Villa" },
            ].map(s => (
              <div key={s.txt} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,.9)", fontWeight: 500 }}>{s.txt}</span>
              </div>
            ))}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.2)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[{ v: "200+", l: "Destinasi" }, { v: "5★", l: "Rating" }, { v: "1000+", l: "Klien" }, { v: "10+", l: "Tahun" }].map(s => (
                  <div key={s.l} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", fontFamily: "'Playfair Display',serif" }}>{s.v}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,.65)" }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* -- Saran Postingan -- */}
          {sidebarCards.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", marginTop: 20, boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
              <div style={{ background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 60%,#E8C96A 100%)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 14 }}></span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "1px" }}>Saran Postingan</span>
              </div>
              <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                {sidebarCards.slice(0, 3).map(p => (
                  <div key={p.id} onClick={() => handlePost(p)}
                    style={{ display: "flex", gap: 10, cursor: "pointer", padding: "6px 0", borderBottom: "1px solid #f0f9fb" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FDFAF4"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    {(() => { const img = (p.content||[]).find(b=>b.type==="image")?.value; return img
                      ? <div style={{ width:36, height:36, borderRadius:6, overflow:"hidden", flexShrink:0 }}><img decoding="async" loading="lazy" src={cld(img)} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={onImgError} /></div>
                      : <div style={{ width:36, height:36, borderRadius:6, background:"#FAF7F0", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}></div>;
                    })()}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#1a2e3b", lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 4 }}>{p.title}</p>
                      <span style={{ fontSize: 10, color: "#8B6914", fontWeight: 600 }}>{p.category || (p.section === "news" ? "Exterior" : p.section === "shop" ? "Gedung & Rumah" : "Interior")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* -- Topik -- */}
          {(() => {
            const allTags = [];
            others.forEach(p => (p.tags || []).forEach(t => { if (!allTags.includes(t)) allTags.push(t); }));
            if (allTags.length === 0) return null;
            return (
              <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", marginTop: 16, boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #FAF7F0", display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 13 }}></span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#2E3D3F", textTransform: "uppercase", letterSpacing: "1px" }}>Topik</span>
                </div>
                <div style={{ padding: "12px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                  {allTags.slice(0, 14).map(tag => (
                    <span key={tag} style={{ fontSize: 11, padding: "4px 11px", background: "#FAF7F0", border: "1px solid #b6dff0", borderRadius: 20, color: "#3D5254", fontWeight: 500 }}>#{tag}</span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* -- Tips Perjalanan -- */}
          <div style={{ background: "linear-gradient(135deg,#0a3d55 0%,#0d5a7a 100%)", borderRadius: 8, overflow: "hidden", marginTop: 16, marginBottom: 4, boxShadow: "0 2px 10px rgba(0,0,0,.1)" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,.12)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#D4AF37", display: "inline-block", boxShadow: "0 0 6px #D4AF37" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "1px" }}>Tips Perjalanan</span>
            </div>
            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { icon: "", tip: "Periksa cuaca setempat sebelum berangkat." },
                { icon: "", tip: "Bawa asuransi perjalanan untuk ketenangan pikiran." },
                { icon: "", tip: "Simpan foto offline sebagai kenang-kenangan." },
                { icon: "", tip: "Hormati budaya & adat istiadat lokal setempat." },
                { icon: "", tip: "Siapkan uang tunai & kartu cadangan untuk keadaan darurat." },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                  <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.88)", lineHeight: 1.55 }}>{item.tip}</span>
                </div>
              ))}
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}

/* ─────────────── SECTION PAGE ─────────────── */
function SectionPage({ section, posts, onReadPost }) {
  const [filter, setFilter] = useState("All");
  const [viewMode, setViewMode] = useState("grid");
  const published = (posts[section] || []).filter(p => p.status === "published");
  const cats = ["All", ...new Set(published.map(p => p.category).filter(Boolean))];
  const filtered = filter === "All" ? published : published.filter(p => p.category === filter);
  const popular = [...published].sort((a, b) => b.id - a.id).slice(0, 8);

  const sectionMeta = {
    news: { title: "Exterior", sub: "Pagar, kanopi, landscape, aluminium & semua layanan eksterior hunian Anda.", icon: "" },
    shop: { title: "Gedung & Rumah", sub: "Proyek pembangunan, renovasi, dan pengembangan properti hunian berkualitas.", icon: "" },
    destinations: { title: "Interior", sub: "Desain dan dekorasi interior profesional untuk setiap ruangan — dari konsep hingga finishing.", icon: "" },
  };
  const meta = sectionMeta[section] || { title: section, sub: "", icon: "◈" };

  return (
    <div className="fade-in" style={{ minHeight: "100vh", background: "#FAF7F0" }}>
      {/* Hero Banner */}
      <div style={{ background: "linear-gradient(135deg, #2E3D3F 0%, #3D5254 100%)", padding: "60px 5%", color: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: "0.6875rem", letterSpacing: "2px", color: "#C9AA71", textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>
            {meta.icon} HIKIMORI CONST
          </div>
          <h1 className="display" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, lineHeight: 1.08, marginBottom: 16, color: "#fff" }}>
            {meta.title}
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,.75)", maxWidth: 460, lineHeight: 1.85 }}>{meta.sub}</p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 5%" }}>
        <div className="section-page-grid" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 40, alignItems: "start" }}>
          {/* Main */}
          <div>
            {/* Filter + View Controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {cats.map(c => (
                  <button key={c} onClick={() => setFilter(c)} style={{
                    padding: "6px 16px", fontSize: 12, borderRadius: 20,
                    border: filter === c ? "none" : "1px solid #D4C4A0",
                    background: filter === c ? "#8B6914" : "#fff",
                    color: filter === c ? "#fff" : "#3D5254", fontWeight: filter === c ? 500 : 400,
                    transition: "all .2s"
                  }}>{c}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[["grid", "▦"], ["list", "☰"]].map(([mode, icon]) => (
                  <button key={mode} onClick={() => setViewMode(mode)} style={{
                    padding: "7px 12px", fontSize: 14,
                    border: `1px solid ${viewMode === mode ? "#C9AA71" : "#D4C4A0"}`,
                    borderRadius: 6, background: viewMode === mode ? "#F5EDD8" : "#fff",
                    color: viewMode === mode ? "#C9AA71" : "#5A6A6C"
                  }}>{icon}</button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#5A6A6C" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}></div>
                <p style={{ fontSize: 15 }}>No posts published yet.</p>
              </div>
            ) : viewMode === "grid" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
                {filtered.map(p => <PostCard key={p.id} post={p} onClick={() => onReadPost(p)} view="grid" />)}
              </div>
            ) : (
              <div>{filtered.map(p => <PostCard key={p.id} post={p} onClick={() => onReadPost(p)} view="list" />)}</div>
            )}
          </div>

          {/* Sidebar */}
          <aside>
            {/* Popular / Recent */}
            <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,.06)", marginBottom: 24 }}>
              <div style={{ background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", padding: "14px 20px" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", letterSpacing: "1px", textTransform: "uppercase" }}>Most Popular</span>
              </div>
              <div style={{ padding: "8px 0" }}>
                {popular.map((p, i) => (
                  <div key={p.id} onClick={() => onReadPost(p)}
                    style={{ display: "flex", gap: 12, padding: "10px 20px", cursor: "pointer", borderBottom: "1px solid #FAF7F0", transition: "background .15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FAF7F0"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: i < 3 ? "#e74c3c" : "#A89070", fontFamily: "'Cormorant Garamond',serif", lineHeight: 1, minWidth: 24 }}>{i + 1}</span>
                    <span style={{ fontSize: 13, color: "#2E3D3F", lineHeight: 1.5, fontWeight: 400 }}>{p.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
              <div style={{ background: "#FAF7F0", padding: "14px 20px", borderBottom: "1px solid #F5EDD8" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#2E3D3F", letterSpacing: "1px", textTransform: "uppercase" }}>Categories</span>
              </div>
              <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                {cats.filter(c => c !== "All").map(c => {
                  const count = published.filter(p => p.category === c).length;
                  return (
                    <button key={c} onClick={() => setFilter(c)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "6px 0", borderBottom: "1px solid #FAF7F0", background: "none",
                        border: "none", cursor: "pointer", textAlign: "left" }}>
                      <span style={{ fontSize: 13, color: "#C9AA71" }}>→ {c}</span>
                      <span style={{ fontSize: 11, background: "#FAF7F0", color: "#5A6A6C", padding: "2px 8px", borderRadius: 10 }}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export { ArticleDetail, PostCard, RichRenderer, SectionPage };
