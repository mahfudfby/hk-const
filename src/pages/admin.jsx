/* Chunk halaman "admin" — dimuat lazy (React.lazy) saat rute ini dibuka.
   Dipisah dari RealEstateWeb.jsx agar pengunjung halaman lain tidak ikut mengunduh kode ini. */
import React, { useState, useEffect, useRef, useMemo } from "react";
import { cld } from "../lib/net.js";
import { ABOUT_LAYANAN_DEFAULT, ABOUT_MISI_DEFAULT, ABOUT_STATS_DEFAULT, ABOUT_WHY_DEFAULT, AutoGrowField, HOME_SERVICES_DEFAULT, SECTION_LABELS, TEMA_DATA, UploadButton, VideoEmbed, autoGrowTextarea, detectVideoEmbed, formatDate, makeSlug, onImgError, sanitizeRichHtml, uploadToCloudinary, uploadWithProgress } from "../app/core.jsx";
/* ─────────────── CRUD FIELD (dipakai SubLayananAdmin) ───────────────
   PENTING: komponen ini SENGAJA didefinisikan di top-level (bukan di dalam
   SubLayananAdmin), karena kalau didefinisikan ulang di setiap render, React
   menganggapnya "tipe komponen baru" tiap kali form berubah — akibatnya
   input/textarea di-unmount+mount ulang tiap ketik 1 huruf, dan kursor jadi
   hilang terus (harus klik lagi tiap huruf). Dengan di-hoist ke sini + props
   eksplisit (form, setForm, accent), identitas komponennya stabil antar
   render sehingga fokus & kursor tetap terjaga saat mengetik. */
function CrudField({ fd, form, setForm, accent }) {
  /* Hooks untuk mode "category" WAJIB dipanggil di awal, tidak bersyarat,
     supaya urutan Hooks selalu konsisten walau field ini bukan tipe "category". */
  const catOptions   = fd.options || [];
  const catCurrentVal = form[fd.key] || "";
  const catIsKnown   = catOptions.includes(catCurrentVal);
  const [manualMode, setManualMode] = useState(!catIsKnown && catCurrentVal !== "");
  useEffect(() => { if (fd.type === "category" && catIsKnown) setManualMode(false); }, [fd.type, catCurrentVal, catIsKnown]);

  if (fd.type === "toggle") {
    const checked = form[fd.key] !== undefined ? !!form[fd.key] : (fd.default !== undefined ? fd.default : true);
    return (
      <div className="adm-toggle-row" style={{ marginBottom: 14, background: "#FAF7F0", border: "1.5px solid #E8DCC8", borderRadius: 10, padding: "12px 16px" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#2E3D3F" }}>{fd.label}</div>
          {fd.desc && <div style={{ fontSize: 11.5, color: "#8B9A9C", marginTop: 2 }}>{fd.desc}</div>}
        </div>
        <button type="button" onClick={() => setForm(p => ({ ...p, [fd.key]: !checked }))}
          style={{ position: "relative", width: 46, height: 26, borderRadius: 20, border: "none", cursor: "pointer", flexShrink: 0, background: checked ? accent : "#D5C9B0", transition: "background .2s" }}>
          <span style={{ position: "absolute", top: 3, left: checked ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.3)", transition: "left .2s" }} />
        </button>
      </div>
    );
  }
  if (fd.type === "priceBreakdown") {
    const val = form[fd.key] || { aktif: false, items: [] };
    const setVal = (patch) => setForm(p => ({ ...p, [fd.key]: { ...(p[fd.key] || { aktif: false, items: [] }), ...patch } }));
    const updateItem = (i, patch) => setVal({ items: val.items.map((it, idx) => idx === i ? { ...it, ...patch } : it) });
    const addItem = () => setVal({ items: [...(val.items || []), { label: "", min: 0, max: 0 }] });
    const removeItem = (i) => setVal({ items: val.items.filter((_, idx) => idx !== i) });
    return (
      <div style={{ marginBottom: 14, background: "#FAF7F0", border: "1.5px solid #E8DCC8", borderRadius: 10, padding: "14px 16px" }}>
        <div className="adm-toggle-row" style={{ marginBottom: val.aktif ? 14 : 0 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#2E3D3F" }}>{fd.label}</div>
            <div style={{ fontSize: 11.5, color: "#8B9A9C", marginTop: 2 }}>Aktifkan untuk isi rincian harga per kombinasi material (per m²). Harga TERENDAH dari daftar ini otomatis jadi harga utama di kartu produk sebelum diklik; rincian lengkap muncul di halaman Lihat Detail.</div>
          </div>
          <button type="button" onClick={() => setVal({ aktif: !val.aktif })}
            style={{ position: "relative", width: 46, height: 26, borderRadius: 20, border: "none", cursor: "pointer", flexShrink: 0, background: val.aktif ? accent : "#D5C9B0", transition: "background .2s" }}>
            <span style={{ position: "absolute", top: 3, left: val.aktif ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.3)", transition: "left .2s" }} />
          </button>
        </div>
        {val.aktif && (
          <>
            {(val.items || []).map((it, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
                <AutoGrowField value={it.label || ""} placeholder="contoh: Polycarbonate Twinwall + Baja Ringan"
                  onChange={e => updateItem(i, { label: e.target.value })}
                  style={{ flex: "1 1 220px", padding: "8px 10px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 12.5, boxSizing: "border-box" }} />
                <input type="number" value={it.min || 0} placeholder="Harga min"
                  onChange={e => updateItem(i, { min: Number(e.target.value) })}
                  style={{ width: 110, padding: "8px 10px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 12.5, boxSizing: "border-box" }} />
                <span style={{ fontSize: 12, color: "#8B9A9C" }}>–</span>
                <input type="number" value={it.max || 0} placeholder="Harga max (opsional)"
                  onChange={e => updateItem(i, { max: Number(e.target.value) })}
                  style={{ width: 130, padding: "8px 10px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 12.5, boxSizing: "border-box" }} />
                <button onClick={() => removeItem(i)}
                  style={{ padding: "7px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, flexShrink: 0 }}>✕</button>
              </div>
            ))}
            <button onClick={addItem}
              style={{ padding: "7px 14px", background: "#F5EDD8", border: "1.5px dashed #D5C9B0", color: "#5A6A6C", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Tambah Kombinasi Harga</button>
          </>
        )}
      </div>
    );
  }
  if (fd.type === "category") {
    const options = catOptions;
    const currentVal = catCurrentVal;
    const isKnown = catIsKnown;
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#5A6A6C", marginBottom: 5 }}>{fd.label}</div>
        {!manualMode ? (
          <select value={isKnown ? currentVal : ""} onChange={e => {
              if (e.target.value === "__new__") { setManualMode(true); setForm(p => ({ ...p, [fd.key]: "" })); }
              else setForm(p => ({ ...p, [fd.key]: e.target.value }));
            }}
            style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 14, boxSizing: "border-box", background: "#fff", cursor: "pointer" }}>
            <option value="" disabled>{options.length ? "Pilih kategori..." : "Belum ada kategori terdaftar"}</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
            <option value="__new__">+ Kategori Baru...</option>
          </select>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <AutoGrowField placeholder={fd.placeholder || ""} value={currentVal}
              onChange={e => setForm(p => ({ ...p, [fd.key]: e.target.value }))}
              style={{ flex: 1, padding: "10px 12px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
            {options.length > 0 && (
              <button type="button" onClick={() => setManualMode(false)}
                style={{ flexShrink: 0, padding: "0 14px", border: "1.5px solid #D5C9B0", borderRadius: 8, background: "#FAF7F0", color: "#5A6A6C", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                Pilih dari daftar
              </button>
            )}
          </div>
        )}
        {manualMode && <div style={{ fontSize: 11, color: "#8B9A9C", marginTop: 5 }}>Kategori baru ini akan otomatis muncul di daftar dropdown setelah disimpan.</div>}
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#5A6A6C", marginBottom: 5 }}>{fd.label}</div>
      {fd.type === "textarea"
        ? <textarea rows={3} placeholder={fd.placeholder || ""} value={form[fd.key] || ""}
            ref={autoGrowTextarea}
            onFocus={e => autoGrowTextarea(e.target)}
            onInput={e => autoGrowTextarea(e.target)}
            onBlur={e => { e.target.style.height = ""; }}
            onChange={e => setForm(p => ({ ...p, [fd.key]: e.target.value }))}
            style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 14, resize: "none", overflow: "hidden", fontFamily: "inherit", boxSizing: "border-box" }} />
        : <AutoGrowField placeholder={fd.placeholder || ""} value={form[fd.key] || ""}
            onChange={e => setForm(p => ({ ...p, [fd.key]: e.target.value }))}
            style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
      }
    </div>
  );
}

/* ─────────────── DASHBOARD TABS SUB-COMPONENT ─────────────── */
function DashTabs({ user, allPosts, publishedCount, draftCount, data, canEdit, canCS, isAdmin, setAdminTab, setCmsEditPost, SECTION_LABELS, SECTIONS, formatDate }) {
  // setAdminTab is navigateAdminTab from parent; alias it so inline references resolve
  const navigateAdminTab = setAdminTab;
  const [dashTab, setDashTab] = useState("notifications");
  const tabs = [
    { id: "notifications", label: "Notifikasi" },
    ...(canEdit ? [{ id: "articles", label: "Kelola Artikel" }] : []),
    { id: "stats", label: "Statistik" },
    { id: "guide", label: "Panduan & FAQ" },
  ];
  return (
    <div className="dash-grid">
      {/* Left column */}
      <div>
        <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,.06)", marginBottom: 16 }}>
          <div style={{ display: "flex", borderBottom: "2px solid #FAF7F0" }} className="dash-tab-row">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setDashTab(t.id)}
                style={{ flex: 1, padding: "14px 8px", fontSize: "0.8125rem", fontWeight: dashTab === t.id ? 700 : 500,
                  color: dashTab === t.id ? "#2E3D3F" : "#5A6A6C", background: dashTab === t.id ? "#fff" : "#FDFAF4",
                  border: "none", borderBottom: dashTab === t.id ? "2px solid #2E3D3F" : "2px solid transparent",
                  marginBottom: -2, cursor: "pointer", transition: "all .15s" }}>
                {t.label}
              </button>
            ))}
          </div>

          {dashTab === "notifications" && (
            <div style={{ padding: "8px 0" }}>
              {data.messages.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: "#5A6A6C", fontSize: "0.875rem" }}>Belum ada notifikasi.</div>
              ) : data.messages.slice().reverse().slice(0, 5).map(m => (
                <div key={m.id} style={{ display: "flex", gap: 14, padding: "16px 20px", borderBottom: "1px solid #FAF7F0", alignItems: "flex-start" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: "#FAF7F0", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}></div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.875rem", color: "#2E3D3F", lineHeight: 1.6, marginBottom: 4 }}>
                      Pesan baru dari <strong>{m.name}</strong> ({m.email}): <em style={{ color: "#3D5254" }}>{m.message?.slice(0, 80)}{m.message?.length > 80 ? "…" : ""}</em>
                    </p>
                    <span style={{ fontSize: "0.75rem", color: "#5A6A6C" }}>{m.date}</span>
                    {!m.read && <span style={{ marginLeft: 8, fontSize: "0.625rem", background: "#e74c3c", color: "#fff", borderRadius: 8, padding: "1px 7px", fontWeight: 700 }}>BARU</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {dashTab === "articles" && canEdit && (
            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#2E3D3F" }}>Artikel Terbaru</span>
                <button onClick={() => { navigateAdminTab("cms"); setCmsEditPost("new"); }}
                  style={{ fontSize: "0.75rem", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", color: "#fff", border: "none", borderRadius: 16, padding: "5px 14px", fontWeight: 600, cursor: "pointer" }}>+ Baru</button>
              </div>
              {allPosts.length === 0 ? (
                <p style={{ fontSize: "0.875rem", color: "#5A6A6C" }}>Belum ada artikel.</p>
              ) : allPosts.slice(-5).reverse().map(p => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #FAF7F0" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: "#FAF7F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                    {(() => { const img = (p.content||[]).find(b=>b.type==="image")?.value; return img ? <img decoding="async" loading="lazy" src={cld(img)} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={onImgError} /> : ""; })()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#2E3D3F", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</p>
                    <span style={{ fontSize: "0.75rem", color: "#5A6A6C" }}>{p.section} · {formatDate(p.date)}</span>
                  </div>
                  <span style={{ fontSize: "0.6875rem", padding: "2px 10px", borderRadius: 10, fontWeight: 600, background: p.status === "published" ? "#e8f8ef" : "#fff8e1", color: p.status === "published" ? "#27ae60" : "#f39c12" }}>
                    {p.status === "published" ? "Tayang" : "Draft"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {dashTab === "stats" && (
            <div style={{ padding: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Total Artikel", value: allPosts.length, icon: "", color: "#8B6914" },
                  { label: "Tayang", value: publishedCount, icon: "", color: "#27ae60" },
                  { label: "Draft", value: draftCount, icon: "", color: "#f39c12" },
                  { label: "Pesan Masuk", value: data.messages.length, icon: "", color: "#8e44ad" },
                ].map(s => (
                  <div key={s.label} style={{ background: "rgba(255,255,255,.1)", borderRadius: 10, padding: "16px 18px", backdropFilter: "blur(6px)", borderLeft: `3px solid ${s.color}` }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 900, color: s.color, fontFamily: "'Playfair Display',serif" }}>{s.value}</div>
                    <div style={{ fontSize: "0.8125rem", color: "#5A6A6C", marginTop: 2 }}>{s.icon} {s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#FAF7F0", borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5A6A6C", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>Distribusi per Seksi</div>
                {["news","shop","destinations"].map(s => {
                  const total = allPosts.length || 1;
                  const count = (data.posts?.[s] || []).length;
                  const pct = Math.round(count / total * 100);
                  return (
                    <div key={s} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: "0.8125rem", color: "#2E3D3F", fontWeight: 600 }}>{SECTION_LABELS[s]}</span>
                        <span style={{ fontSize: "0.8125rem", color: "#5A6A6C" }}>{count}</span>
                      </div>
                      <div style={{ height: 6, background: "#E8DCC8", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "#8B6914", borderRadius: 3, transition: "width .5s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {dashTab === "guide" && (
            <div style={{ padding: "20px" }}>
              {[
                { q: "Bagaimana cara membuat artikel baru?", a: "Klik tombol 'Buat Artikel' di dashboard atau masuk ke menu Posts / CMS lalu klik '+ New Post'." },
                { q: "Bagaimana cara mengubah gambar hero?", a: "Masuk ke menu 'Images' di sidebar, lalu klik gambar yang ingin diganti dan masukkan URL baru." },
                { q: "Cara membalas pesan dari pengunjung?", a: "Masuk ke menu 'Messages', buka pesan, lalu klik tombol Reply untuk membalas." },
                { q: "Bagaimana cara mengganti teks di website?", a: "Masuk ke menu 'Site Content' (khusus admin) untuk mengedit semua teks halaman." },
                { q: "Apa perbedaan Draft dan Published?", a: "Draft hanya terlihat di admin panel. Published akan tampil di website untuk pengunjung umum." },
              ].map((faq, i) => (
                <div key={i} style={{ marginBottom: 14, padding: "14px 16px", background: "#FAF7F0", borderRadius: 8, borderLeft: "3px solid #8B6914" }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#2E3D3F", marginBottom: 6 }}>{faq.q}</p>
                  <p style={{ fontSize: "0.8125rem", color: "#3D5254", lineHeight: 1.65 }}>{faq.a}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Top Kontributor */}
        <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #FAF7F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.125rem", fontWeight: 800, color: "#2E3D3F" }}>Top Kontributor</span>
            <span style={{ fontSize: "0.6875rem", color: "#5A6A6C" }}>Artikel tayang</span>
          </div>
          <div style={{ padding: "8px 0" }}>
            {(() => {
              const authorMap = {};
              allPosts.filter(p => p.status === "published").forEach(p => { authorMap[p.author] = (authorMap[p.author] || 0) + 1; });
              const sorted = Object.entries(authorMap).sort((a,b) => b[1]-a[1]).slice(0, 3);
              const medals = ["","",""];
              if (!sorted.length) return <p style={{ padding: "16px 20px", fontSize: "0.8125rem", color: "#5A6A6C" }}>Belum ada artikel tayang.</p>;
              return sorted.map(([author, count], i) => (
                <div key={author} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderBottom: "1px solid #FAF7F0" }}>
                  <span style={{ fontSize: "1.25rem", flexShrink: 0, minWidth: 28 }}>{medals[i]}</span>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 50%,#8B6914 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.875rem", flexShrink: 0 }}>
                    {author.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#2E3D3F" }}>{author}</div>
                    <div style={{ fontSize: "0.75rem", color: "#5A6A6C" }}>Artikel: {count}</div>
                  </div>
                  {author === user.username && <span style={{ fontSize: "0.625rem", background: "#e8f8ef", color: "#27ae60", borderRadius: 8, padding: "2px 7px", fontWeight: 700 }}>YOU</span>}
                </div>
              ));
            })()}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", background: "#FAF7F0" }}>
              <span style={{ fontSize: "1.25rem", minWidth: 28 }}>—</span>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#3D5254,#C9AA71)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.875rem", flexShrink: 0 }}>
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#2E3D3F" }}>You ({user.username})</div>
                <div style={{ fontSize: "0.75rem", color: "#5A6A6C" }}>Artikel: {allPosts.filter(p => p.author === user.username && p.status === "published").length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Akses Cepat */}
        <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #FAF7F0" }}>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.125rem", fontWeight: 800, color: "#2E3D3F" }}>Akses Cepat</span>
          </div>
          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              ...(canEdit ? [{ label: "Buat Artikel Baru", action: () => { navigateAdminTab("cms"); setCmsEditPost("new"); } }] : []),
              ...(canCS ? [{ label: `Pesan (${data.messages.length})`, action: () => setAdminTab("messages") }] : []),
              ...(isAdmin ? [{ label: "Kelola Gambar", action: () => setAdminTab("images") }] : []),
              ...(isAdmin ? [{ label: "Konten Website", action: () => setAdminTab("content") }] : []),
              ...(isAdmin ? [{ label: "Pengaturan", action: () => setAdminTab("settings") }] : []),
            ].map(item => (
              <button key={item.label} onClick={item.action}
                style={{ textAlign: "left", padding: "9px 12px", background: "#FAF7F0", border: "none", borderRadius: 7, fontSize: "0.8125rem", color: "#2E3D3F", fontWeight: 500, cursor: "pointer", transition: "background .15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#E8DCC8"}
                onMouseLeave={e => e.currentTarget.style.background = "#FAF7F0"}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Hapus Asset Cloudinary (dipanggil saat tombol "Hapus" produk/tema diklik) ───
   Penghapusan sesungguhnya dieksekusi oleh serverless function /api/delete-cloudinary
   (lihat file api/delete-cloudinary.js) karena butuh API Secret yang tidak boleh
   ada di kode frontend. Fungsi di sini hanya: (1) ekstrak public_id dari URL,
   (2) kelompokkan per resource type (image/video), (3) panggil endpoint tsb. */
function extractCloudinaryAsset(url) {
  if (!url || typeof url !== "string") return null;
  // Contoh URL: https://res.cloudinary.com/<cloud>/image/upload/v169.../folder/nama_odul9j.png
  //             https://res.cloudinary.com/<cloud>/video/upload/v169.../nama_xyz.mp4
  const m = url.match(/\/(image|video)\/upload\/(?:[^/]*\/)*?v\d+\/(.+?)\.\w+(?:\?.*)?$/);
  if (!m) return null;
  return { resourceType: m[1], publicId: m[2] };
}

async function deleteCloudinaryAssets(urls) {
  const assets = (urls || []).map(extractCloudinaryAsset).filter(Boolean);
  if (assets.length === 0) return true;
  const images = [...new Set(assets.filter(a => a.resourceType === "image").map(a => a.publicId))];
  const videos = [...new Set(assets.filter(a => a.resourceType === "video").map(a => a.publicId))];
  const calls = [];
  if (images.length) calls.push(
    fetch("/api/delete-cloudinary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicIds: images, resourceType: "image" }) })
  );
  if (videos.length) calls.push(
    fetch("/api/delete-cloudinary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicIds: videos, resourceType: "video" }) })
  );
  if (calls.length === 0) return true;
  try {
    const results = await Promise.all(calls);
    return results.every(r => r.ok);
  } catch {
    return false;
  }
}

/**
 * UploadButton — tombol upload foto dengan progress bar inline.
 * Props:
 *   accept        string   (default "image/*")
 *   multiple      bool
 *   label         string   (teks tombol)
 *   onDone        (urls: string[]) => void
 *   onError       (msg: string) => void
 *   style         object   (override style tombol/label)
 *   dropZone      bool     (tampilkan sebagai drop zone besar)
 */
function HeroVideoPanel({ data, save, notify }) {
  const [videoUrl, setVideoUrl] = React.useState(data.content.heroVideoUrl || "");
  return (
    <div style={{ background: "#f5eeff", borderRadius: 8, padding: "16px 18px", border: "1px solid #d8b4fe" }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#8e44ad", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 10 }}>URL Video Background Hero</label>
      <p style={{ fontSize: 12, color: "#5A6A6C", marginBottom: 12, lineHeight: 1.5 }}>
        Masukkan link URL video (format MP4 direkomendasikan). Video akan diputar otomatis, senyap, dan berulang sebagai latar hero.
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={videoUrl}
          onChange={e => setVideoUrl(e.target.value)}
          placeholder="https://res.cloudinary.com/.../video.mp4"
          style={{ flex: 1, padding: "9px 12px", border: "1px solid #d8b4fe", borderRadius: 6, fontSize: 13, outline: "none", background: "#fff" }}
        />
        <button onClick={() => {
          const url = videoUrl.trim();
          if (!url) return notify("Masukkan URL video.", "error");
          save({ ...data, content: { ...data.content, heroVideoUrl: url } });
          notify("URL video background disimpan!");
        }} style={{ padding: "9px 16px", background: "#8e44ad", color: "#fff", borderRadius: 6, fontSize: 12, border: "none", fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer" }}>
          Simpan
        </button>
      </div>
      {data.content.heroVideoUrl && (
        <div style={{ fontSize: 11, color: "#5A6A6C", background: "#fff", borderRadius: 6, padding: "8px 12px", border: "1px solid #e8d4fe", wordBreak: "break-all" }}>
          <strong>URL Aktif:</strong> {data.content.heroVideoUrl}
        </div>
      )}
      {!data.content.heroVideoUrl && (
        <div style={{ fontSize: 11, color: "#8e44ad", background: "#fff", borderRadius: 6, padding: "8px 12px", border: "1px dashed #d8b4fe" }}>
          Belum ada URL disimpan — menggunakan video bawaan Hikimori Const.
        </div>
      )}
    </div>
  );
}

function HeroStaticImagePanel({ data, save, notify }) {
  const [imgUrl, setImgUrl] = React.useState(data.content.heroStaticImage || "");
  return (
    <div style={{ background: "#f5eeff", borderRadius: 8, padding: "16px 18px", border: "1px solid #d8b4fe" }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#8e44ad", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 10 }}>URL Gambar Statis Hero</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={imgUrl}
          onChange={e => setImgUrl(e.target.value)}
          placeholder="https://..."
          style={{ flex: 1, padding: "9px 12px", border: "1px solid #d8b4fe", borderRadius: 6, fontSize: 13, outline: "none", background: "#fff" }}
        />
        <button onClick={() => {
          const url = imgUrl.trim();
          if (!url) return notify("Masukkan URL gambar.", "error");
          save({ ...data, content: { ...data.content, heroStaticImage: url } });
          notify("Gambar statis hero disimpan!");
        }} style={{ padding: "9px 16px", background: "#8e44ad", color: "#fff", borderRadius: 6, fontSize: 12, border: "none", fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer" }}>
          Simpan
        </button>
      </div>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Atau Upload Gambar</label>
      <UploadButton label="Pilih Gambar Hero"
        style={{ border: "1.5px dashed #8e44ad", color: "#8e44ad", background: "#fff" }}
        onDone={urls => {
          setImgUrl(urls[0]);
          save({ ...data, content: { ...data.content, heroStaticImage: urls[0] } });
          notify("Gambar hero statis diupload!");
        }}
        onError={() => notify("Gagal upload. Coba lagi.", "error")} />
      {data.content.heroStaticImage && (
        <img decoding="async" loading="lazy" src={cld(data.content.heroStaticImage)} alt="Hero Preview"
          style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 8, border: "1px solid #d8b4fe", marginTop: 10 }}
          onError={onImgError} />
      )}
    </div>
  );
}

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/* ─────────────── RICH PARAGRAPH EDITOR ─────────────── */
function RichParagraphEditor({ value, onChange, placeholder = "Write your content here..." }) {
  const editorRef = useRef();
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [highlightMenuOpen, setHighlightMenuOpen] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!value);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
      setIsEmpty(!value);
    }
  }, []); // only on mount

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(cmd, false, val);
    if (editorRef.current) { onChange(editorRef.current.innerHTML); setIsEmpty(!editorRef.current.textContent.trim()); }
  };

  const handleInput = () => {
    if (editorRef.current) { onChange(editorRef.current.innerHTML); setIsEmpty(!editorRef.current.textContent.trim()); }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      // Insert non-breaking spaces as indent (2em = ~4 chars)
      document.execCommand("insertHTML", false, "\u00a0\u00a0\u00a0\u00a0");
      if (editorRef.current) { onChange(editorRef.current.innerHTML); }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    // Ambil plain text saja -- buang semua HTML/formatting dari Word/browser lain
    const plain = e.clipboardData.getData("text/plain");
    if (!plain) return;
    // Preserve line breaks sebagai <br>, escape karakter HTML
    const safe = plain
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\r\n|\r|\n/g, "<br>");
    document.execCommand("insertHTML", false, safe);
    if (editorRef.current) { onChange(editorRef.current.innerHTML); setIsEmpty(false); }
  };


  useEffect(() => {
    const close = (e) => { if (!e.target.closest?.("[data-richpicker]")) { setColorMenuOpen(false); setHighlightMenuOpen(false); } };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const TB = ({ cmd, val = null, title, children, extraStyle = {} }) => (
    <button title={title} onMouseDown={e => { e.preventDefault(); exec(cmd, val); }}
      style={{ padding: "3px 7px", fontSize: 13, border: "1px solid #D4C4A0", borderRadius: 4, background: "#fff", color: "#3D5254", cursor: "pointer", lineHeight: 1.4, display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 26, ...extraStyle }}>
      {children}
    </button>
  );
  const SEP = () => <span style={{ width: 1, height: 20, background: "#D4C4A0", display: "inline-block", margin: "0 3px", verticalAlign: "middle" }} />;

  const textColors = ["#000000","#2E3D3F","#8B6914","#e74c3c","#27ae60","#f39c12","#8e44ad","#e67e22","#7f8c8d","#ffffff"];
  const hlColors  = ["#ffff00","#00ff7f","#ff9900","#ffcccc","#cce5ff","#e2ccff","transparent"];
  const fontSizeMap = {"8":1,"10":2,"12":3,"14":4,"18":5,"24":6,"36":7};

  return (
    <div style={{ border: "1.5px solid #D4C4A0", borderRadius: 8, overflow: "visible", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
      {/* -- Toolbar Row 1: Font, Size, Basic Formatting -- */}
      <div style={{ background: "#FAF7F0", borderBottom: "1px solid #E8DCC8", padding: "6px 10px", display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
        <select onChange={e => exec("fontName", e.target.value)}
          style={{ height: 26, fontSize: 12, padding: "1px 4px", border: "1px solid #D4C4A0", borderRadius: 4, background: "#fff", color: "#2E3D3F", maxWidth: 130, cursor: "pointer" }}>
          {["Calibri (Body)","Arial","Times New Roman","Georgia","Verdana","Courier New","Trebuchet MS"].map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select onChange={e => exec("fontSize", fontSizeMap[e.target.value] || 3)}
          style={{ height: 26, fontSize: 12, padding: "1px 4px", border: "1px solid #D4C4A0", borderRadius: 4, background: "#fff", color: "#2E3D3F", width: 52, cursor: "pointer" }}>
          {["8","10","11","12","14","16","18","20","24","28","32","36"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <SEP />
        <TB cmd="bold" title="Bold (Ctrl+B)"><strong style={{fontSize:13,fontWeight:900}}>B</strong></TB>
        <TB cmd="italic" title="Italic (Ctrl+I)"><em style={{fontSize:13}}>I</em></TB>
        <TB cmd="underline" title="Underline (Ctrl+U)"><span style={{textDecoration:"underline",fontSize:13}}>U</span></TB>
        <TB cmd="strikeThrough" title="Strikethrough"><span style={{textDecoration:"line-through",fontSize:13}}>S</span></TB>
        <SEP />
        {/* Text Color */}
        <div style={{position:"relative"}} data-richpicker="1">
          <button title="Font Color" onMouseDown={e=>{e.preventDefault();setColorMenuOpen(p=>!p);setHighlightMenuOpen(false);}}
            style={{padding:"2px 7px",border:"1px solid #D4C4A0",borderRadius:4,background:"#fff",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,minHeight:26,lineHeight:1}}>
            <span style={{fontSize:13,fontWeight:900,color:"#2E3D3F",lineHeight:1}}>A</span>
            <span style={{width:14,height:3,background:"#e74c3c",borderRadius:1}}/>
          </button>
          {colorMenuOpen && (
            <div style={{position:"absolute",top:32,left:0,background:"#fff",border:"1px solid #D4C4A0",borderRadius:8,padding:8,zIndex:9999,display:"flex",gap:4,flexWrap:"wrap",width:132,boxShadow:"0 6px 20px rgba(0,0,0,.15)"}}>
              <div style={{width:"100%",fontSize:10,color:"#5A6A6C",fontWeight:600,letterSpacing:".5px",textTransform:"uppercase",marginBottom:2}}>Warna Teks</div>
              {textColors.map(c=>(
                <button key={c} onMouseDown={e=>{e.preventDefault();exec("foreColor",c);setColorMenuOpen(false);}}
                  style={{width:22,height:22,borderRadius:4,background:c,border:"1.5px solid #D4C4A0",cursor:"pointer",outline:"none"}}/>
              ))}
            </div>
          )}
        </div>
        {/* Highlight */}
        <div style={{position:"relative"}} data-richpicker="1">
          <button title="Sorot Teks" onMouseDown={e=>{e.preventDefault();setHighlightMenuOpen(p=>!p);setColorMenuOpen(false);}}
            style={{padding:"2px 7px",border:"1px solid #D4C4A0",borderRadius:4,background:"#fff",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,minHeight:26,lineHeight:1}}>
            <span style={{fontSize:11,color:"#333",lineHeight:1,fontWeight:600}}>ab</span>
            <span style={{width:14,height:3,background:"#ffff00",border:"1px solid #ccc",borderRadius:1}}/>
          </button>
          {highlightMenuOpen && (
            <div style={{position:"absolute",top:32,left:0,background:"#fff",border:"1px solid #D4C4A0",borderRadius:8,padding:8,zIndex:9999,display:"flex",gap:4,flexWrap:"wrap",width:110,boxShadow:"0 6px 20px rgba(0,0,0,.15)"}}>
              <div style={{width:"100%",fontSize:10,color:"#5A6A6C",fontWeight:600,letterSpacing:".5px",textTransform:"uppercase",marginBottom:2}}>Sorotan</div>
              {hlColors.map(c=>(
                <button key={c} onMouseDown={e=>{e.preventDefault();exec("hiliteColor",c);setHighlightMenuOpen(false);}}
                  style={{width:22,height:22,borderRadius:4,background:c,border:"1.5px solid #D4C4A0",cursor:"pointer",outline:"none"}} title={c === "transparent" ? "Hapus Sorotan" : c}/>
              ))}
            </div>
          )}
        </div>
        <SEP />
        <TB cmd="undo" title="Undo (Ctrl+Z)">↶</TB>
        <TB cmd="redo" title="Redo (Ctrl+Y)">↷</TB>
      </div>

      {/* -- Toolbar Row 2: Lists, Indent, Paragraph, Alignment -- */}
      <div style={{ background: "#FAF7F0", borderBottom: "1px solid #E8DCC8", padding: "5px 10px", display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
        <TB cmd="insertUnorderedList" title="Daftar Bullet">
          <span style={{display:"flex",flexDirection:"column",gap:2,alignItems:"flex-start"}}>
            <span style={{display:"flex",alignItems:"center",gap:3}}><span style={{width:4,height:4,borderRadius:"50%",background:"currentColor"}}/>
            <span style={{width:12,height:1.5,background:"currentColor"}}/></span>
            <span style={{display:"flex",alignItems:"center",gap:3}}><span style={{width:4,height:4,borderRadius:"50%",background:"currentColor"}}/>
            <span style={{width:9,height:1.5,background:"currentColor"}}/></span>
          </span>
        </TB>
        <TB cmd="insertOrderedList" title="Daftar Bernomor">
          <span style={{fontSize:11,fontWeight:600,lineHeight:1,letterSpacing:-1}}>1.≡</span>
        </TB>
        <SEP />
        <TB cmd="outdent" title="Kurangi Indent">
          <svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor"><rect x="4" y="0" width="10" height="1.5" rx=".75"/><rect x="4" y="5" width="10" height="1.5" rx=".75"/><rect x="4" y="10" width="10" height="1.5" rx=".75"/><polygon points="3,6 0,4 0,8"/></svg>
        </TB>
        <TB cmd="indent" title="Tambah Indent">
          <svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor"><rect x="4" y="0" width="10" height="1.5" rx=".75"/><rect x="4" y="5" width="10" height="1.5" rx=".75"/><rect x="4" y="10" width="10" height="1.5" rx=".75"/><polygon points="0,6 3,4 3,8"/></svg>
        </TB>
        <SEP />
        {/* Alignment */}
        <TB cmd="justifyLeft" title="Rata Kiri">
          <svg width="14" height="12" viewBox="0 0 14 12" stroke="currentColor" strokeWidth="1.5" fill="none"><line x1="0" y1="1" x2="14" y2="1"/><line x1="0" y1="5" x2="9" y2="5"/><line x1="0" y1="9" x2="14" y2="9"/><line x1="0" y1="11.5" x2="7" y2="11.5"/></svg>
        </TB>
        <TB cmd="justifyCenter" title="Tengah">
          <svg width="14" height="12" viewBox="0 0 14 12" stroke="currentColor" strokeWidth="1.5" fill="none"><line x1="0" y1="1" x2="14" y2="1"/><line x1="2.5" y1="5" x2="11.5" y2="5"/><line x1="0" y1="9" x2="14" y2="9"/><line x1="3.5" y1="11.5" x2="10.5" y2="11.5"/></svg>
        </TB>
        <TB cmd="justifyRight" title="Rata Kanan">
          <svg width="14" height="12" viewBox="0 0 14 12" stroke="currentColor" strokeWidth="1.5" fill="none"><line x1="0" y1="1" x2="14" y2="1"/><line x1="5" y1="5" x2="14" y2="5"/><line x1="0" y1="9" x2="14" y2="9"/><line x1="7" y1="11.5" x2="14" y2="11.5"/></svg>
        </TB>
        <TB cmd="justifyFull" title="Rata Kanan-Kiri (Justify)">
          <svg width="14" height="12" viewBox="0 0 14 12" stroke="currentColor" strokeWidth="1.5" fill="none"><line x1="0" y1="1" x2="14" y2="1"/><line x1="0" y1="5" x2="14" y2="5"/><line x1="0" y1="9" x2="14" y2="9"/><line x1="0" y1="11.5" x2="14" y2="11.5"/></svg>
        </TB>
        <SEP />
        {/* Line spacing quick insert */}
        <TB cmd="formatBlock" val="blockquote" title="Blockquote" extraStyle={{fontSize:11}}>❝</TB>
        <TB cmd="removeFormat" title="Hapus Format" extraStyle={{fontSize:11,color:"#e74c3c"}}>✕</TB>
      </div>

      {/* -- Editor Area -- */}
      <div style={{ position: "relative" }}>
        {isEmpty && (
          <div style={{ position:"absolute", top:16, left:18, color:"#b0c4d4", fontSize:14, fontStyle:"italic", pointerEvents:"none", userSelect:"none" }}>
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setIsEmpty(false)}
          onBlur={() => setIsEmpty(!editorRef.current?.textContent?.trim())}
          style={{
            minHeight: 220, padding: "16px 18px", fontSize: 14, color: "#2E3D3F",
            lineHeight: 1.85, outline: "none", background: "#fff",
            fontFamily: "'Calibri', Arial, sans-serif",
            borderRadius: "0 0 6px 6px",
          }}
        />
      </div>
    </div>
  );
}

/* ─────────────── CMS EDITOR ─────────────── */
function CMSEditor({ post, onSave, onCancel, section, onSectionChange, user, notify: notifyFn, allPosts = [] }) {
  const notify = typeof notifyFn === "function" ? notifyFn : (msg) => alert(msg);
  const authorDefault = post?.author || user?.name || user?.username || "";
  const [form, setForm] = useState(post || {
    title: "", date: new Date().toISOString().slice(0, 10), author: authorDefault, category: "",
    coverImage: "", excerpt: "", content: [], tags: "", status: "draft", section,
  });
  const [blocks, setBlocks] = useState(post?.content || []);
  const [addType, setAddType] = useState("paragraph");
  const [addVal, setAddVal] = useState("");
  const [addCaption, setAddCaption] = useState("");
  const [editBlockIdx, setEditBlockIdx] = useState(null);
  const [editBlockVal, setEditBlockVal] = useState("");
  const [imgUploadMode, setImgUploadMode] = useState("url");
  const [coverUploadMode, setCoverUploadMode] = useState("url");
  const [coverUploading, setCoverUploading] = useState(false);
  const [publishModal, setPublishModal] = useState(false);
  const [bacaJugaSearch, setBacaJugaSearch] = useState("");
  const [bacaJugaSelected, setBacaJugaSelected] = useState(null); // { id, title, coverImage, section }
  const coverFileRef = useRef();
  const [autoSaveStatus, setAutoSaveStatus] = useState(""); // "", "saving…", "tersimpan ✓"
  const fileRef = useRef();
  const autoSaveTimer = useRef();
  const draftKey = `cms-draft-${post?.id || "new"}`;

  /* ── Restore draft dari storage saat pertama kali buka (hanya post baru) ── */
  useEffect(() => {
    if (post?.id) return; // jangan timpa post yang sedang diedit
    (async () => {
      try {
        const r = await window.storage?.get(draftKey);
        if (r?.value) {
          const saved = JSON.parse(r.value);
          if (saved.title || (saved.content && saved.content.length > 0)) {
            setForm(f => ({ ...f, ...saved, author: saved.author || authorDefault }));
            setBlocks(saved.content || []);
            setAutoSaveStatus("↩ Draft dipulihkan");
            setTimeout(() => setAutoSaveStatus(""), 3000);
          }
        }
      } catch {}
    })();
  }, []);

  /* ── Auto-Save persisten: simpan ke window.storage agar bertahan meski halaman ditutup ── */
  useEffect(() => {
    if (!form.title && blocks.length === 0) return; // skip form kosong
    setAutoSaveStatus("Mengetik…");
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      setAutoSaveStatus("Menyimpan…");
      const p = {
        ...form, content: blocks, status: "draft",
        id: form.id || Date.now(), section: form.section || section,
        tags: typeof form.tags === "string" ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : form.tags,
        slug: form.slug || slugify(form.title || "artikel"),
        _autoSaved: true,
      };
      // Simpan ke storage persisten (bertahan saat tab ditutup / perangkat mati)
      try { await window.storage?.set(draftKey, JSON.stringify({ ...form, content: blocks })); } catch {}
      onSave(p, true); // silent=true → tetap di editor, tidak keluar
      setAutoSaveStatus("✓ Tersimpan otomatis");
      setTimeout(() => setAutoSaveStatus(""), 3000);
    }, 3000);
    return () => clearTimeout(autoSaveTimer.current);
  }, [form.title, form.excerpt, form.author, form.category, form.date, form.coverImage, form.tags, blocks]);

  const addBlock = () => {
    if (addType === "baca_juga") {
      if (!bacaJugaSelected) return;
      setBlocks(p => [...p, { type: "baca_juga", postId: bacaJugaSelected.id, title: bacaJugaSelected.title, coverImage: bacaJugaSelected.coverImage || "", section: bacaJugaSelected.section || "" }]);
      setBacaJugaSelected(null); setBacaJugaSearch("");
      return;
    }
    const val = (addType === "paragraph" ? addVal : addVal).trim?.() ?? addVal;
    if (addType !== "divider" && !val) return;
    const block = { type: addType, value: val };
    if (addCaption) block.caption = addCaption;
    setBlocks(p => [...p, block]);
    setAddVal(""); setAddCaption("");
  };

  const removeBlock = (i) => setBlocks(p => p.filter((_, idx) => idx !== i));
  const moveBlock = (i, dir) => {
    const b = [...blocks];
    const j = i + dir;
    if (j < 0 || j >= b.length) return;
    [b[i], b[j]] = [b[j], b[i]];
    setBlocks(b);
  };

  const saveEditBlock = (i) => {
    const stripped = editBlockVal.replace(/<[^>]*>/g, "").trim();
    if (!stripped && editBlockVal.trim() === "") return;
    setBlocks(p => p.map((b, idx) => idx === i ? { ...b, value: editBlockVal } : b));
    setEditBlockIdx(null); setEditBlockVal("");
  };

  const [imgUploadItems, setImgUploadItems] = useState([]);
  const [coverUploadItems, setCoverUploadItems] = useState([]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgUploadItems([{ name: file.name, pct: 0, done: false, error: false }]);
    try {
      const url = await uploadWithProgress(file, pct => setImgUploadItems([{ name: file.name, pct, done: false, error: false }]));
      setImgUploadItems([{ name: file.name, pct: 100, done: true, error: false }]);
      setAddVal(url);
      notify("Gambar berhasil diupload!");
    } catch {
      setImgUploadItems([{ name: file.name, pct: 0, done: false, error: true }]);
      notify("Gagal upload gambar. Periksa koneksi & Cloudinary preset.", "error");
    }
    setTimeout(() => { setImgUploadItems([]); if (fileRef.current) fileRef.current.value = ""; }, 2500);
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    setCoverUploadItems([{ name: file.name, pct: 0, done: false, error: false }]);
    try {
      const url = await uploadWithProgress(file, pct => setCoverUploadItems([{ name: file.name, pct, done: false, error: false }]));
      setCoverUploadItems([{ name: file.name, pct: 100, done: true, error: false }]);
      setForm(p => ({ ...p, coverImage: url }));
      notify("Cover image berhasil diupload!");
    } catch {
      setCoverUploadItems([{ name: file.name, pct: 0, done: false, error: true }]);
      notify("Gagal upload cover. Periksa koneksi & Cloudinary preset.", "error");
    } finally {
      setCoverUploading(false);
      setTimeout(() => { setCoverUploadItems([]); if (coverFileRef.current) coverFileRef.current.value = ""; }, 2500);
    }
  };

  const handleSave = async (status, targetSection = section) => {
    clearTimeout(autoSaveTimer.current);
    const postId = form.id || Date.now();
    const p = {
      ...form,
      content: blocks,
      status,
      id: postId,
      section: targetSection,
      tags: typeof form.tags === "string" ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : form.tags,
      slug: form.slug || slugify(form.title || "artikel"),
    };
    // Sync form.section agar autosave berikutnya pakai seksi yang benar
    setForm(f => ({ ...f, section: targetSection }));
    // Hapus draft persisten setelah publish / save manual
    try { await window.storage?.delete(draftKey); } catch {}
    onSave(p);
  };

  const blockLabels = {
    paragraph: "Paragraph", heading: "Heading", image: "Image",
    quote: "Quote", embed_instagram: "Instagram Embed", embed_tiktok: "TikTok Embed", divider: "⸻ Divider",
    baca_juga: "Baca Juga",
  };

  const needsValue = addType !== "divider" && addType !== "baca_juga";

  return (
    <div className="fade-in" style={{ background: "#fff", borderRadius: 12, overflow: "visible", boxShadow: "0 4px 24px rgba(0,0,0,.1)" }}>
      {/* -- Publish Destination Modal -- */}
      {publishModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(20,35,55,.55)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div className="fade-in" style={{ background: "#fff", borderRadius: 14, padding: "28px 32px", maxWidth: 440, width: "90%",
            boxShadow: "0 24px 60px rgba(0,0,0,.22)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 32 }}></span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#2E3D3F", textAlign: "center", marginBottom: 6, fontFamily: "'Playfair Display',serif" }}>
              Pilih Tujuan Publish
            </h2>
            <p style={{ fontSize: 13, color: "#5A6A6C", textAlign: "center", marginBottom: 24, lineHeight: 1.6 }}>
              Artikel akan ditayangkan di seksi yang kamu pilih di bawah ini.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { key: "shop", icon: "", label: "Gedung & Rumah", desc: "Proyek rumah, gedung & properti" },
                { key: "news", icon: "", label: "Exterior", desc: "Pagar, kanopi, landscape & eksterior" },
                { key: "destinations", icon: "", label: "Interior", desc: "Desain & dekorasi interior rumah" },
              ].map(opt => (
                <button key={opt.key} onClick={() => {
                  if (onSectionChange) onSectionChange(opt.key);
                  setPublishModal(false);
                  handleSave("published", opt.key);
                }} style={{
                  display: "flex", alignItems: "center", gap: 16, padding: "14px 18px",
                  border: section === opt.key ? "2px solid #2E3D3F" : "1.5px solid #E8DCC8",
                  borderRadius: 10, background: section === opt.key ? "#f0f5fa" : "#fff",
                  cursor: "pointer", textAlign: "left", transition: "all .15s"
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#8B6914"; e.currentTarget.style.background = "#FAF7F0"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = section === opt.key ? "#2E3D3F" : "#E8DCC8"; e.currentTarget.style.background = section === opt.key ? "#f0f5fa" : "#fff"; }}>
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{opt.icon}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#2E3D3F" }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: "#5A6A6C", marginTop: 2 }}>{opt.desc}</div>
                  </div>
                  {section === opt.key && <span style={{ marginLeft: "auto", fontSize: 16, color: "#27ae60" }}>✓</span>}
                </button>
              ))}
            </div>
            <button onClick={() => setPublishModal(false)} style={{
              width: "100%", marginTop: 16, padding: "10px", border: "1px solid #D4C4A0",
              borderRadius: 8, fontSize: 13, color: "#5A6A6C", background: "#FDFAF4", cursor: "pointer"
            }}>Batal</button>
          </div>
        </div>
      )}

      {/* CMS Top Bar */}
      <div className="cms-topbar" style={{ background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>
            {post?.id ? "Edit Post" : "Add New Post"} — <span style={{ color: "#C9AA71" }}>{SECTION_LABELS[section] || section}</span>
          </span>
          {autoSaveStatus && (
            <span style={{ fontSize: 11, color: autoSaveStatus.startsWith("✓") ? "#C9AA71" : "rgba(255,255,255,.5)", letterSpacing: ".3px" }}>
              {autoSaveStatus}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => handleSave("draft")} style={{
            padding: "7px 18px", border: "1px solid rgba(255,255,255,.3)", borderRadius: 6,
            color: "rgba(255,255,255,.85)", fontSize: 12, background: "none", letterSpacing: ".5px"
          }}>Save Draft</button>
          <button onClick={() => setPublishModal(true)} style={{
            padding: "7px 18px", background: "#27ae60", borderRadius: 6,
            color: "#fff", fontSize: 12, border: "none", fontWeight: 500, letterSpacing: ".5px"
          }}>Publish…</button>
          <button onClick={onCancel} style={{
            padding: "7px 14px", border: "none", borderRadius: 6,
            color: "rgba(255,255,255,.6)", fontSize: 12, background: "rgba(255,255,255,.08)"
          }}>✕</button>
        </div>
      </div>

      <div className="cms-editor-grid">
        {/* Left: Editor */}
        <div className="cms-editor-left">
          {/* Title */}
          <textarea value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="Masukkan judul artikel di sini..."
            rows={2}
            ref={autoGrowTextarea}
            style={{ width: "100%", fontSize: 28, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600,
              color: "#2E3D3F", border: "none", outline: "none", borderBottom: "2px solid #F5EDD8",
              paddingBottom: 14, marginBottom: 24, background: "transparent",
              resize: "none", overflow: "hidden", lineHeight: 1.3, boxSizing: "border-box",
              fontStyle: "normal" }}
            onInput={e => autoGrowTextarea(e.target)} />

          {/* Excerpt */}
          <textarea value={form.excerpt} onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))}
            placeholder="Ringkasan singkat artikel..."
            rows={3}
            ref={autoGrowTextarea}
            onInput={e => autoGrowTextarea(e.target)}
            style={{ width: "100%", fontSize: 14, color: "#5A6A6C", border: "1px solid #F5EDD8",
              borderRadius: 6, padding: "12px 14px", outline: "none", resize: "none", overflow: "hidden",
              marginBottom: 28, lineHeight: 1.65, background: "#FDFAF4" }} />

          {/* Blocks */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>Content Blocks</div>
            {blocks.length === 0 && (
              <div style={{ background: "#FDFAF4", border: "2px dashed #D4C4A0", borderRadius: 8, padding: "32px", textAlign: "center", color: "#5A6A6C", fontSize: 13 }}>
                No content yet. Add your first block below.
              </div>
            )}
            {blocks.map((b, i) => (
              <div key={i} style={{ background: "#FDFAF4", border: `1px solid ${editBlockIdx === i ? "#C9AA71" : "#F5EDD8"}`, borderRadius: 8, padding: "14px 16px", marginBottom: 10, position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, background: "#F5EDD8", color: "#C9AA71", padding: "2px 8px", borderRadius: 10, fontWeight: 500 }}>{blockLabels[b.type] || b.type}</span>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                    <button onClick={() => moveBlock(i, -1)} title="Naik" style={{ padding: "3px 8px", fontSize: 11, border: "1px solid #D4C4A0", borderRadius: 4, color: "#5A6A6C", background: "#fff" }}>↑</button>
                    <button onClick={() => moveBlock(i, 1)} title="Turun" style={{ padding: "3px 8px", fontSize: 11, border: "1px solid #D4C4A0", borderRadius: 4, color: "#5A6A6C", background: "#fff" }}>↓</button>
                    {b.type !== "divider" && b.type !== "image" && b.type !== "baca_juga" && (
                      <button onClick={() => { setEditBlockIdx(i); setEditBlockVal(b.value || ""); }} title="Edit" style={{ padding: "3px 8px", fontSize: 11, border: "1px solid #C9AA71", background: "#FAF7F0", color: "#C9AA71", borderRadius: 4 }}></button>
                    )}
                    <button onClick={() => { if (editBlockIdx === i) { setEditBlockIdx(null); setEditBlockVal(""); } removeBlock(i); }} title="Hapus" style={{ padding: "3px 8px", fontSize: 11, border: "none", background: "#fee", color: "#e74c3c", borderRadius: 4 }}>✕</button>
                  </div>
                </div>
                {/* Inline edit mode */}
                {editBlockIdx === i ? (
                  <div>
                    {b.type === "paragraph" ? (
                      <RichParagraphEditor
                        value={editBlockVal}
                        onChange={setEditBlockVal}
                        placeholder="Tulis konten paragraf di sini..."
                      />
                    ) : (
                      <AutoGrowField value={editBlockVal} onChange={e => setEditBlockVal(e.target.value)}
                        autoFocus
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid #C9AA71", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button onClick={() => saveEditBlock(i)} style={{ padding: "6px 16px", background: "#27ae60", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✓ Simpan</button>
                      <button onClick={() => { setEditBlockIdx(null); setEditBlockVal(""); }} style={{ padding: "6px 12px", background: "#eee", color: "#5A6A6C", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Batal</button>
                    </div>
                  </div>
                ) : b.type === "image" ? (
                  <div>
                    <img decoding="async" loading="lazy" src={cld(b.value)} alt="" style={{ width: "100%", maxHeight: 480, objectFit: "contain", borderRadius: 6, background: "#FDFAF4" }} onError={onImgError} />
                    {b.caption && <p style={{ fontSize: 11, color: "#5A6A6C", marginTop: 4, fontStyle: "italic" }}>{b.caption}</p>}
                  </div>
                ) : b.type === "divider" ? (
                  <hr style={{ border: "none", borderTop: "2px solid #D4C4A0" }} />
                ) : b.type === "baca_juga" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#FAF7F0", borderLeft: "3px solid #8B6914", borderRadius: "0 6px 6px 0", padding: "8px 12px" }}>
                    <span style={{ fontSize: 15 }}></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#8B6914", textTransform: "uppercase", letterSpacing: ".06em" }}>Baca Juga</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#2E3D3F", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.title}</div>
                    </div>
                    {b.coverImage && <img decoding="async" loading="lazy" src={cld(b.coverImage)} alt="" style={{ width: 40, height: 30, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} onError={onImgError} />}
                  </div>
                ) : b.type === "paragraph" ? (
                  <div style={{ fontSize: 13, color: "#3D5254", lineHeight: 1.6, wordBreak: "break-word" }}
                    dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(b.value) }} />
                ) : (
                  <p style={{ fontSize: 13, color: "#3D5254", lineHeight: 1.6, wordBreak: "break-word" }}>
                    {b.value}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Add Block Toolbar */}
          <div style={{ background: "#FAF7F0", border: "1px solid #E8DCC8", borderRadius: 10, padding: "18px 20px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 14 }}>Add Block</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {Object.entries(blockLabels).map(([k, label]) => (
                <button key={k} onClick={() => setAddType(k)} style={{
                  padding: "5px 12px", fontSize: 12, borderRadius: 20,
                  border: addType === k ? "none" : "1px solid #D4C4A0",
                  background: addType === k ? "#C9AA71" : "#fff",
                  color: addType === k ? "#fff" : "#3D5254", fontWeight: addType === k ? 600 : 400,
                  transition: "all .15s"
                }}>{label}</button>
              ))}
            </div>

            {needsValue && (
              <>
                {addType === "image" && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    {["url", "upload"].map(m => (
                      <button key={m} onClick={() => setImgUploadMode(m)} style={{
                        padding: "4px 12px", fontSize: 11, borderRadius: 4,
                        border: imgUploadMode === m ? "none" : "1px solid #D4C4A0",
                        background: imgUploadMode === m ? "#2E3D3F" : "#fff",
                        color: imgUploadMode === m ? "#fff" : "#5A6A6C"
                      }}>{m === "url" ? "URL" : "Upload File"}</button>
                    ))}
                  </div>
                )}

                {addType === "image" && imgUploadMode === "upload" ? (
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                    <button onClick={() => fileRef.current?.click()} disabled={imgUploadItems.some(it => !it.done && !it.error)}
                      style={{
                        padding: "10px 20px", border: "1.5px dashed #C9AA71", borderRadius: 8,
                        color: imgUploadItems.some(it => !it.done && !it.error) ? "#5A6A6C" : "#C9AA71",
                        fontSize: 13, background: "#FAF7F0", width: "100%", marginBottom: 8,
                        cursor: imgUploadItems.some(it => !it.done && !it.error) ? "not-allowed" : "pointer"
                      }}>{imgUploadItems.some(it => !it.done && !it.error) ? "Mengupload..." : "Click to Upload Image"}</button>
                    {imgUploadItems.length > 0 && imgUploadItems.map((it, i) => (
                      <div key={i} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: it.error ? "#e74c3c" : "#2E3D3F", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {it.error ? "" : it.done ? "" : ""}{it.name}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 800, color: it.error ? "#e74c3c" : it.done ? "#27ae60" : "#8B6914" }}>
                            {it.error ? "Gagal" : it.done ? "Selesai" : `${it.pct}%`}
                          </span>
                        </div>
                        <div style={{ height: 6, background: "#E8DCC8", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 3, width: `${it.pct}%`,
                            background: it.error ? "#e74c3c" : it.done ? "#27ae60" : "linear-gradient(90deg,#8B6914,#E8C96A)",
                            transition: "width .2s ease" }} />
                        </div>
                      </div>
                    ))}
                    {addVal && <img decoding="async" loading="lazy" src={cld(addVal)} alt="" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 6, marginBottom: 8 }} />}
                  </div>
                ) : addType === "paragraph" ? (
                  <div style={{ marginBottom: 8 }}>
                    <RichParagraphEditor
                      value={addVal}
                      onChange={setAddVal}
                      placeholder="Tulis konten paragraf di sini. Gunakan toolbar di atas untuk format teks..."
                    />
                  </div>
                ) : addType === "quote" ? (
                  <textarea value={addVal} onChange={e => setAddVal(e.target.value)}
                    placeholder="Teks kutipan..."
                    rows={4}
                    ref={autoGrowTextarea}
                    onInput={e => autoGrowTextarea(e.target)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #D4C4A0",
                      borderRadius: 6, fontSize: 13, outline: "none", resize: "none", overflow: "hidden", marginBottom: 8, lineHeight: 1.6 }} />
                ) : (
                  <AutoGrowField value={addVal} onChange={e => setAddVal(e.target.value)}
                    placeholder={
                      addType === "heading" ? "Section heading..." :
                      addType === "image" ? "https://example.com/image.jpg" :
                      addType === "embed_instagram" ? "https://www.instagram.com/p/..." :
                      addType === "embed_tiktok" ? "https://www.tiktok.com/@user/video/..." : ""
                    }
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #D4C4A0",
                      borderRadius: 6, fontSize: 13, outline: "none", marginBottom: 8 }} />
                )}

                {addType === "image" && (
                  <AutoGrowField value={addCaption} onChange={e => setAddCaption(e.target.value)}
                    placeholder="Image caption (optional)"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #D4C4A0",
                      borderRadius: 6, fontSize: 12, outline: "none", marginBottom: 8 }} />
                )}
              </>
            )}

            {addType === "baca_juga" && (() => {
              const otherPosts = allPosts.filter(p => p.id !== post?.id && p.status === "published");
              const filtered = bacaJugaSearch.trim()
                ? otherPosts.filter(p => p.title?.toLowerCase().includes(bacaJugaSearch.toLowerCase()))
                : otherPosts;
              return (
                <div style={{ marginBottom: 8 }}>
                  <input
                    value={bacaJugaSearch}
                    onChange={e => { setBacaJugaSearch(e.target.value); setBacaJugaSelected(null); }}
                    placeholder="Cari judul artikel..."
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 13, outline: "none", marginBottom: 8, boxSizing: "border-box" }}
                  />
                  {bacaJugaSelected ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#FAF7F0", borderRadius: 8, border: "1.5px solid #C9AA71" }}>
                      {bacaJugaSelected.coverImage && <img decoding="async" loading="lazy" src={cld(bacaJugaSelected.coverImage)} alt="" style={{ width: 48, height: 36, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} onError={onImgError} />}
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#2E3D3F", flex: 1 }}>{bacaJugaSelected.title}</span>
                      <button onClick={() => setBacaJugaSelected(null)} style={{ fontSize: 11, color: "#e74c3c", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #E8DCC8", borderRadius: 8, background: "#fff" }}>
                      {filtered.length === 0 ? (
                        <div style={{ padding: "14px 12px", fontSize: 12, color: "#5A6A6C", textAlign: "center" }}>
                          {otherPosts.length === 0 ? "Belum ada artikel published lain." : "Artikel tidak ditemukan."}
                        </div>
                      ) : filtered.map(p => (
                        <div key={p.id} onClick={() => { setBacaJugaSelected(p); setBacaJugaSearch(""); }}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", cursor: "pointer", borderBottom: "1px solid #FAF7F0", transition: "background .12s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#FAF7F0"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          {p.coverImage && <img decoding="async" loading="lazy" src={cld(p.coverImage)} alt="" style={{ width: 40, height: 30, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} onError={onImgError} />}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#2E3D3F", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</div>
                            <div style={{ fontSize: 11, color: "#5A6A6C" }}>{p.section}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            <button onClick={addBlock} style={{
              padding: "9px 22px", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", color: "#fff",
              borderRadius: 6, fontSize: 13, border: "none", fontWeight: 500
            }}>+ Add Block</button>
          </div>
        </div>

        {/* Right: Meta / Publish */}
        <div className="cms-editor-right">
          {/* Section Selector */}
          <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #F5EDD8", overflow: "hidden" }}>
            <div style={{ background: "#FAF7F0", padding: "8px 14px", borderBottom: "1px solid #F5EDD8" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#2E3D3F", letterSpacing: ".5px" }}>PUBLISH TO</span>
            </div>
            <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
              {Object.entries(SECTION_LABELS).map(([key, label]) => (
                <button key={key} onClick={() => onSectionChange && onSectionChange(key)} style={{
                  padding: "6px 10px", borderRadius: 6, fontSize: 12, fontWeight: section === key ? 600 : 400,
                  border: section === key ? "none" : "1px solid #D4C4A0",
                  background: section === key ? "#2E3D3F" : "#fff",
                  color: section === key ? "#fff" : "#3D5254",
                  textAlign: "left", transition: "all .15s", cursor: "pointer"
                }}>{section === key ? "✓ " : ""}{label}</button>
              ))}
            </div>
          </div>

          {/* Publish Box */}
          <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #F5EDD8", overflow: "hidden" }}>
            <div style={{ background: "#FAF7F0", padding: "8px 14px", borderBottom: "1px solid #F5EDD8" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#2E3D3F", letterSpacing: ".5px" }}>PUBLISH</span>
            </div>
            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#5A6A6C" }}>Status:</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: form.status === "published" ? "#27ae60" : "#f39c12",
                  background: form.status === "published" ? "#eeffee" : "#fff9ee", padding: "2px 9px", borderRadius: 10 }}>
                  {form.status === "published" ? "Published" : "Draft"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#5A6A6C" }}>Visibility:</span>
                <span style={{ fontSize: 12, color: "#3D5254", fontWeight: 500 }}>Public</span>
              </div>
              <div style={{ borderTop: "1px solid #F5EDD8", paddingTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                <button onClick={() => handleSave("draft")} style={{
                  padding: "7px 0", border: "1px solid #D4C4A0", borderRadius: 6,
                  fontSize: 12, color: "#3D5254", background: "#fff", fontWeight: 500, cursor: "pointer"
                }}>Save Draft</button>
                <button onClick={() => setPublishModal(true)} style={{
                  padding: "8px 0", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", border: "none",
                  borderRadius: 6, fontSize: 12, color: "#fff", fontWeight: 600, letterSpacing: ".5px", cursor: "pointer"
                }}>Publish…</button>
              </div>
            </div>
          </div>

          {/* Meta Fields */}
          {[
            { label: "Date", key: "date", type: "date" },
            { label: "Category", key: "category", placeholder: "e.g. Beach, Gear, Asia" },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 4 }}>{f.label}</label>
              <input type={f.type || "text"} value={form[f.key] || ""} placeholder={f.placeholder || ""}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: "100%", padding: "7px 10px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}

          {/* Author -- auto dari akun yang login */}
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 4 }}>
              Author <span style={{ fontSize: 10, color: "#27ae60", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>· otomatis</span>
            </label>
            <div style={{ position: "relative" }}>
              <input value={form.author || ""} readOnly
                style={{ width: "100%", padding: "7px 28px 7px 10px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 12, outline: "none", background: "#FAF7F0", color: "#2E3D3F", fontWeight: 600, cursor: "default", boxSizing: "border-box" }} />
              <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11 }}></span>
            </div>
            <p style={{ fontSize: 10, color: "#5A6A6C", marginTop: 3 }}>Diisi otomatis dari akun yang login</p>
          </div>

          {/* Tags */}
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 4 }}>Tags</label>
            <input value={typeof form.tags === "string" ? form.tags : (form.tags || []).join(", ")}
              onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
              placeholder="beach, travel, gear"
              style={{ width: "100%", padding: "7px 10px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
            <p style={{ fontSize: 10, color: "#5A6A6C", marginTop: 3 }}>Separate with commas</p>
          </div>

          {/* Section badge */}
          <div style={{ fontSize: 11, color: "#5A6A6C", fontStyle: "italic", textAlign: "center", paddingBottom: 8 }}>
            Posting to: <strong style={{ color: "#C9AA71" }}>{SECTION_LABELS[section] || section}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
/* ─────────────── TEAM ADMIN ─────────────── */
function TeamAdmin({ data, save, notify, uploadToCloudinary, embedded = false }) {
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const members = data.teamMembers || [];
  const { ordered: orderedMembers, draggingIdx, onDragStart, onDragEnter, onDragOver, onDragEnd, moveUp, moveDown } =
    useDragReorder(members, async (next) => { await save({ ...data, teamMembers: next }); notify("Urutan tim berhasil disimpan!"); });

  const openNew = () => { setForm({ id: Date.now(), name: "", role: "", quotes: "", photo: "" }); setEditId("new"); };
  const openEdit = (m) => { setForm({ ...m }); setEditId(m.id); };
  const cancelEdit = () => { setEditId(null); setForm({}); };

  const saveMember = () => {
    if (!form.name?.trim()) return notify("Nama anggota tim wajib diisi.", "error");
    const idx = members.findIndex(x => x.id === form.id);
    const updated = idx >= 0 ? members.map((x, i) => i === idx ? form : x) : [...members, form];
    save({ ...data, teamMembers: updated });
    cancelEdit();
    notify("Data tim berhasil disimpan!");
  };

  const deleteMember = (id) => {
    if (!window.confirm("Hapus anggota tim ini?")) return;
    save({ ...data, teamMembers: members.filter(x => x.id !== id) });
    notify("Anggota tim dihapus.");
  };

  return (
    <div className={embedded ? "" : "fade-in"}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        {!embedded && <h1 style={{ fontSize: 24, fontWeight: 500, color: "#2E3D3F" }}>Susunan Tim</h1>}
        {embedded && <div style={{ fontSize: 12, color: "#8B9A9C" }}>{members.length} anggota tim ditampilkan di halaman About.</div>}
        {!editId && <button onClick={openNew} style={{ padding: "10px 20px", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Tambah Anggota</button>}
      </div>

      {/* Form Edit */}
      {editId && (
        <div className="adm-form-card" style={{ background: "#fff", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,.08)", marginBottom: 28, borderTop: "4px solid #C9AA71" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#2E3D3F", marginBottom: 20 }}>{editId === "new" ? "Tambah Anggota Tim" : "Edit Anggota Tim"}</h2>
          <div className="adm-grid-2" style={{ marginBottom: 16 }}>
            {[
              { label: "Nama *", key: "name", placeholder: "Budi Santoso" },
              { label: "Jabatan", key: "role", placeholder: "Interior Designer" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>{f.label}</label>
                <AutoGrowField value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder} style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #D4C4A0", borderRadius: 6, fontSize: 13, outline: "none" }} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>Quotes / Motto</label>
            <AutoGrowField value={form.quotes || ""} onChange={e => setForm(p => ({ ...p, quotes: e.target.value }))}
              placeholder="Setiap momen spesial layak dirayakan dengan sempurna."
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #D4C4A0", borderRadius: 6, fontSize: 13, outline: "none" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>Foto</label>
            {form.photo && <img decoding="async" loading="lazy" src={cld(form.photo)} alt="preview" style={{ height: 80, width: 80, objectFit: "cover", borderRadius: "50%", marginBottom: 10, border: "2px solid #E8DCC8" }} />}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <UploadButton label="Upload Foto Tim"
                onDone={urls => { setForm(p => ({ ...p, photo: urls[0] })); notify("Foto berhasil diupload!"); }}
                onError={msg => notify(msg, "error")} />
              <div style={{ fontSize: 11, color: "#7ab5cc", textAlign: "center" }}>— atau paste URL foto —</div>
              <input type="url" value={form.photo || ""} onChange={e => setForm(p => ({ ...p, photo: e.target.value }))}
                placeholder="https://..." style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #D4C4A0", borderRadius: 6, fontSize: 12, outline: "none" }} />
            </div>
          </div>
          <div className="adm-actions">
            <button onClick={saveMember} style={{ padding: "10px 22px", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Simpan</button>
            <button onClick={cancelEdit} style={{ padding: "10px 18px", background: "#FAF7F0", color: "#5A6A6C", border: "1px solid #D4C4A0", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>Batal</button>
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
        {orderedMembers.map((m, idx) => (
          <div key={m.id}
            draggable
            onDragStart={onDragStart(idx)}
            onDragEnter={onDragEnter(idx)}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            style={{ background: "#fff", borderRadius: 12, padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,.06)", display: "flex", flexDirection: "column", gap: 12, alignItems: "center", textAlign: "center", opacity: draggingIdx === idx ? 0.4 : 1 }}>
            <div style={{ alignSelf: "flex-end", marginTop: -10, marginBottom: -10 }}>
              <OrderControls idx={idx} count={orderedMembers.length} onUp={moveUp} onDown={moveDown} />
            </div>
            <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", background: "#FAF7F0", border: "2px solid #E8DCC8", flexShrink: 0 }}>
              {m.photo ? <img decoding="async" loading="lazy" src={cld(m.photo)} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}></div>}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#2E3D3F", fontSize: 14 }}>{m.name}</div>
              <div style={{ fontSize: 12, color: "#8B6914", fontWeight: 600 }}>{m.role}</div>
              {m.quotes && <div style={{ fontSize: 11, color: "#5A6A6C", fontStyle: "italic", marginTop: 6, lineHeight: 1.5, whiteSpace: "pre-line" }}>"{m.quotes}"</div>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => openEdit(m)} style={{ padding: "6px 14px", background: "#FAF7F0", color: "#C9AA71", border: "1px solid #E8DCC8", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Edit</button>
              <button onClick={() => deleteMember(m.id)} style={{ padding: "6px 14px", background: "#fee", color: "#e74c3c", border: "1px solid #fecaca", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Hapus</button>
            </div>
          </div>
        ))}
        {members.length === 0 && !editId && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0", color: "#5A6A6C" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}></div>
            <p>Belum ada anggota tim. Klik "+ Tambah Anggota" untuk mulai.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* Format teks harga jadi Rupiah, aman untuk berbagai format input
   (angka murni "4500000", sudah ada "Rp", desimal, atau teks bebas seperti "Mulai dari 500rb/m²") */
function formatHargaRp(raw) {
  if (raw === null || raw === undefined) return "";
  const str = String(raw).trim();
  if (str === "") return "";
  // Ambil hanya digit (dan titik desimal) dari string
  const numMatch = str.replace(/\./g, "").match(/-?\d+(?:,\d+)?/);
  if (!numMatch) return str; // bukan angka sama sekali → tampilkan apa adanya
  const num = parseFloat(numMatch[0].replace(",", "."));
  if (isNaN(num)) return str;
  const formatted = "Rp " + Math.round(num).toLocaleString("id-ID");
  // Jika string asli punya teks tambahan di luar angka (mis. "500000 / m²"), pertahankan suffix-nya
  const suffix = str.replace(numMatch[0], "").replace(/^Rp\.?\s*/i, "").trim();
  return suffix ? `${formatted} ${suffix}` : formatted;
}

/* ══════════════════════════════════════════════════════════
   ABOUT PAGE ADMIN — Setting Halaman About (CRUD penuh)
   Mengatur SEMUA konten yang tampil di hikimoriconst.com/about:
   Hero & Background, Statistik, Visi Misi, Mengapa Memilih Kami,
   Susunan Tim (embed TeamAdmin), dan Layanan Kami.
   ══════════════════════════════════════════════════════════ */

/* ── Wrapper kartu section ── */
function AboutAdminSection({ title, accent = "#8B6914", desc, children }) {
  return (
    <div className="adm-section-card" style={{ background: "#fff", borderRadius: 8, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderTop: `4px solid ${accent}` }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#2E3D3F", marginBottom: 4 }}>{title}</h3>
      {desc && <p style={{ fontSize: 12, color: "#5A6A6C", marginBottom: 20, lineHeight: 1.6 }}>{desc}</p>}
      {children}
    </div>
  );
}

/* ── Field teks uncontrolled + tombol simpan (konsisten dengan section lain) ── */
function AboutTextField({ data, save, notify, label, fieldKey, multiline, placeholder, accent = "#8B6914" }) {
  const fieldId = `aboutadmin-${fieldKey}`;
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", letterSpacing: "0.8px", textTransform: "uppercase", display: "block", marginBottom: 6 }}>{label}</label>
      {multiline ? (
        <textarea id={fieldId} defaultValue={data.content[fieldKey] || ""} placeholder={placeholder} rows={3}
          ref={autoGrowTextarea}
          onInput={e => autoGrowTextarea(e.target)}
          style={{ width: "100%", padding: "9px 12px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 13, outline: "none", resize: "none", overflow: "hidden", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }} />
      ) : (
        <input id={fieldId} defaultValue={data.content[fieldKey] || ""} placeholder={placeholder}
          style={{ width: "100%", padding: "9px 12px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
        <button onClick={() => {
          const val = document.getElementById(fieldId)?.value ?? "";
          save({ ...data, content: { ...data.content, [fieldKey]: val.trim() } });
          notify(`${label} disimpan!`);
        }} style={{ padding: "7px 18px", background: accent, color: "#fff", borderRadius: 6, fontSize: 12, border: "none", fontWeight: 600, cursor: "pointer" }}>Simpan</button>
      </div>
    </div>
  );
}

/* ── Statistik (Stats Strip): num + label, CRUD ── */
function AboutStatsEditor({ data, save, notify }) {
  const list = (data.aboutStats && data.aboutStats.length > 0) ? data.aboutStats : ABOUT_STATS_DEFAULT;

  const patch = (idx, field, val) => {
    const next = list.map(x => ({ ...x }));
    next[idx][field] = val;
    save({ ...data, aboutStats: next });
  };
  const addItem = () => save({ ...data, aboutStats: [...list, { num: "0", label: "Statistik Baru" }] });
  const removeItem = (idx) => save({ ...data, aboutStats: list.filter((_, i) => i !== idx) });

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10, marginBottom: 12 }}>
        {list.map((s, idx) => (
          <div key={`${idx}::${s.num || ""}::${s.label || ""}`} style={{ background: "#FAF7F0", borderRadius: 8, padding: 10, border: "1px solid #E8DCC8" }}>
            <input defaultValue={s.num} onBlur={e => patch(idx, "num", e.target.value)} placeholder="500+"
              style={{ width: "100%", padding: "6px 8px", border: "1px solid #D4C4A0", borderRadius: 5, fontSize: 13, fontWeight: 700, marginBottom: 6, boxSizing: "border-box" }} />
            <input defaultValue={s.label} onBlur={e => patch(idx, "label", e.target.value)} placeholder="Klien Puas"
              style={{ width: "100%", padding: "6px 8px", border: "1px solid #D4C4A0", borderRadius: 5, fontSize: 12, marginBottom: 6, boxSizing: "border-box" }} />
            <button onClick={() => removeItem(idx)}
              style={{ width: "100%", padding: "5px", background: "none", color: "#e74c3c", border: "1px solid #e74c3c", borderRadius: 5, fontSize: 10, cursor: "pointer" }}>Hapus</button>
          </div>
        ))}
      </div>
      <button onClick={addItem} style={{ padding: "8px 16px", background: "#3D5254", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Tambah Statistik</button>
      <span style={{ fontSize: 11, color: "#8B9A9C", marginLeft: 10 }}>Klik di luar kotak teks (blur) untuk menyimpan otomatis.</span>
    </div>
  );
}

/* ── Misi Kami: daftar poin teks, CRUD ── */
function AboutMisiEditor({ data, save, notify }) {
  const list = (data.aboutMisiList && data.aboutMisiList.length > 0) ? data.aboutMisiList : ABOUT_MISI_DEFAULT;

  const patch = (idx, val) => {
    const next = [...list];
    next[idx] = val;
    save({ ...data, aboutMisiList: next });
  };
  const addItem = () => save({ ...data, aboutMisiList: [...list, "Poin misi baru"] });
  const removeItem = (idx) => save({ ...data, aboutMisiList: list.filter((_, i) => i !== idx) });

  return (
    <div>
      {list.map((m, idx) => (
        <div key={`${idx}::${m}`} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
          <span style={{ color: "#8B6914", fontWeight: 700, flexShrink: 0 }}>✓</span>
          <input defaultValue={m} onBlur={e => patch(idx, e.target.value)}
            style={{ flex: 1, padding: "8px 10px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 13, boxSizing: "border-box" }} />
          <button onClick={() => removeItem(idx)}
            style={{ padding: "7px 10px", background: "none", color: "#e74c3c", border: "1px solid #e74c3c", borderRadius: 5, fontSize: 11, cursor: "pointer", flexShrink: 0 }}></button>
        </div>
      ))}
      <button onClick={addItem} style={{ padding: "8px 16px", background: "#8B6914", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", marginTop: 6 }}>+ Tambah Poin Misi</button>
      <span style={{ fontSize: 11, color: "#8B9A9C", marginLeft: 10 }}>Klik di luar kotak teks (blur) untuk menyimpan otomatis.</span>
    </div>
  );
}

/* ── Mengapa Memilih Kami: kartu icon + judul + deskripsi, CRUD ── */
function AboutWhyUsEditor({ data, save, notify }) {
  const list = (data.aboutWhyList && data.aboutWhyList.length > 0) ? data.aboutWhyList : ABOUT_WHY_DEFAULT;

  const patch = (idx, field, val) => {
    const next = list.map(x => ({ ...x }));
    next[idx][field] = val;
    save({ ...data, aboutWhyList: next });
  };
  const addItem = () => save({ ...data, aboutWhyList: [...list, { icon: "", title: "Keunggulan Baru", desc: "Deskripsi singkat keunggulan." }] });
  const removeItem = (idx) => save({ ...data, aboutWhyList: list.filter((_, i) => i !== idx) });

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10, marginBottom: 12 }}>
        {list.map((v, idx) => (
          <div key={`${idx}::${v.title || ""}::${v.desc || ""}`} style={{ background: "#FAF7F0", borderRadius: 8, padding: 10, border: "1px solid #E8DCC8" }}>
            <input defaultValue={v.icon} onBlur={e => patch(idx, "icon", e.target.value)} placeholder=""
              style={{ width: "100%", padding: "6px 8px", border: "1px solid #D4C4A0", borderRadius: 5, fontSize: 18, marginBottom: 6, boxSizing: "border-box", textAlign: "center" }} />
            <input defaultValue={v.title} onBlur={e => patch(idx, "title", e.target.value)} placeholder="Judul keunggulan"
              style={{ width: "100%", padding: "6px 8px", border: "1px solid #D4C4A0", borderRadius: 5, fontSize: 12, fontWeight: 700, marginBottom: 6, boxSizing: "border-box" }} />
            <textarea defaultValue={v.desc} onBlur={e => patch(idx, "desc", e.target.value)} placeholder="Deskripsi singkat" rows={2}
              ref={autoGrowTextarea}
              onInput={e => autoGrowTextarea(e.target)}
              style={{ width: "100%", padding: "6px 8px", border: "1px solid #D4C4A0", borderRadius: 5, fontSize: 11, marginBottom: 6, boxSizing: "border-box", resize: "none", overflow: "hidden", fontFamily: "inherit" }} />
            <button onClick={() => removeItem(idx)}
              style={{ width: "100%", padding: "5px", background: "none", color: "#e74c3c", border: "1px solid #e74c3c", borderRadius: 5, fontSize: 10, cursor: "pointer" }}>Hapus</button>
          </div>
        ))}
      </div>
      <button onClick={addItem} style={{ padding: "8px 16px", background: "#0a6ea0", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Tambah Kartu Keunggulan</button>
      <span style={{ fontSize: 11, color: "#8B9A9C", marginLeft: 10 }}>Klik di luar kotak teks (blur) untuk menyimpan otomatis.</span>
    </div>
  );
}

/* ── Layanan Kami (kartu About): icon + judul + deskripsi + foto, CRUD ── */
function AboutLayananCardEditor({ index, item, data, save, notify, uploadToCloudinary }) {
  const [title, setTitle] = useState(item.title || "");
  const [desc, setDesc]   = useState(item.desc || "");
  const [icon, setIcon]   = useState(item.icon || "");
  const [saving, setSaving] = useState(false);

  const getList = () => ((data.aboutLayananList && data.aboutLayananList.length > 0) ? data.aboutLayananList : ABOUT_LAYANAN_DEFAULT).map(x => ({ ...x }));

  const patchAndSave = async (patch) => {
    const list = getList();
    list[index] = { ...list[index], ...patch };
    await save({ ...data, aboutLayananList: list });
  };

  const doSaveText = async () => {
    setSaving(true);
    try { await patchAndSave({ title, desc, icon }); notify("Kartu layanan diperbarui!"); }
    catch { notify("Gagal menyimpan.", "error"); }
    setSaving(false);
  };

  const doRemove = async () => {
    const list = getList().filter((_, i) => i !== index);
    await save({ ...data, aboutLayananList: list });
    notify("Kartu layanan dihapus.");
  };

  return (
    <div style={{ background: "#FAF7F0", borderRadius: 8, padding: 12, border: "1px solid #E8DCC8" }}>
      {item.img ? (
        <img decoding="async" loading="lazy" src={cld(item.img)} alt={item.title} style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 6, marginBottom: 8, border: "1px solid #D4C4A0" }}
          onError={onImgError} />
      ) : (
        <div style={{ width: "100%", height: 110, background: "#E8DCC8", borderRadius: 6, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#5A6A6C", fontSize: 11 }}>Belum ada foto</div>
      )}
      <UploadButton label="Ganti Foto"
        style={{ fontSize: 11, padding: "6px 10px", marginBottom: 8, width: "100%", justifyContent: "center" }}
        onDone={urls => { patchAndSave({ img: urls[0] }); notify("Foto kartu layanan diperbarui!"); }}
        onError={() => notify("Gagal upload.", "error")} />
      <input value={icon} onChange={e => setIcon(e.target.value)} placeholder="Icon (mis.)"
        style={{ width: "100%", padding: "7px 9px", border: "1px solid #D4C4A0", borderRadius: 5, fontSize: 16, marginBottom: 6, boxSizing: "border-box", textAlign: "center" }} />
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul layanan"
        style={{ width: "100%", padding: "7px 9px", border: "1px solid #D4C4A0", borderRadius: 5, fontSize: 12, marginBottom: 6, boxSizing: "border-box", fontWeight: 700 }} />
      <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Deskripsi singkat" rows={2}
        ref={autoGrowTextarea}
        onInput={e => autoGrowTextarea(e.target)}
        style={{ width: "100%", padding: "7px 9px", border: "1px solid #D4C4A0", borderRadius: 5, fontSize: 11, marginBottom: 8, boxSizing: "border-box", resize: "none", overflow: "hidden", fontFamily: "inherit" }} />
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={doSaveText} disabled={saving}
          style={{ flex: 1, padding: "6px", background: "#C9AA71", color: "#fff", border: "none", borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
          {saving ? "..." : "Simpan Teks"}
        </button>
        <button onClick={doRemove}
          style={{ padding: "6px 10px", background: "none", color: "#e74c3c", border: "1px solid #e74c3c", borderRadius: 5, fontSize: 11, cursor: "pointer" }}></button>
      </div>
    </div>
  );
}

function AboutLayananListEditor({ data, save, notify, uploadToCloudinary }) {
  const list = (data.aboutLayananList && data.aboutLayananList.length > 0) ? data.aboutLayananList : ABOUT_LAYANAN_DEFAULT;
  const { ordered: orderedList, draggingIdx, onDragStart, onDragEnter, onDragOver, onDragEnd, moveUp, moveDown } =
    useDragReorder(list, async (next) => { await save({ ...data, aboutLayananList: next }); notify("Urutan kartu layanan berhasil disimpan!"); });

  const addItem = () => {
    const next = list.map(x => ({ ...x }));
    next.push({ icon: "", title: "Layanan Baru", desc: "Deskripsi singkat layanan.", img: "", slug: "" });
    save({ ...data, aboutLayananList: next });
    notify("Kartu layanan baru ditambahkan!");
  };
  const resetDefault = () => {
    if (!window.confirm("Yakin ingin reset kartu layanan ke default? Semua kartu yang sudah kamu ubah akan DIGANTI dan tidak bisa dikembalikan lagi.")) return;
    save({ ...data, aboutLayananList: [] });
    notify("Direset ke kartu layanan default.");
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 16 }}>
        {orderedList.map((item, idx) => (
          <div key={`${idx}::${item.title || ""}::${item.img || ""}`}
            draggable
            onDragStart={onDragStart(idx)}
            onDragEnter={onDragEnter(idx)}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            style={{ opacity: draggingIdx === idx ? 0.4 : 1, position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <OrderControls idx={idx} count={orderedList.length} onUp={moveUp} onDown={moveDown} />
            </div>
            <AboutLayananCardEditor index={idx} item={item} data={data} save={save} notify={notify} uploadToCloudinary={uploadToCloudinary} />
          </div>
        ))}
      </div>
      <button onClick={addItem} style={{ padding: "9px 16px", background: "#2ecc71", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Tambah Kartu Layanan</button>

      {/* Tombol reset — sengaja dibuat kecil & ditaruh terpisah paling bawah supaya tidak gampang kepencet tidak sengaja */}
      <div style={{ textAlign: "center", marginTop: 28 }}>
        <button onClick={resetDefault}
          style={{ padding: "4px 10px", background: "transparent", border: "1px dashed #D5C9B0", color: "#A89070", borderRadius: 6, fontSize: 10.5, fontWeight: 500, cursor: "pointer", opacity: 0.7, transition: "opacity .15s" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = 1)}
          onMouseLeave={e => (e.currentTarget.style.opacity = 0.7)}>
          Reset ke Default
        </button>
      </div>
    </div>
  );
}

/* ── Background Hero: 4 foto grid (sama dengan Hero Slideshow Home) ── */
function AboutHeroBgEditor({ data, save, notify }) {
  const heroImgs = (data.images && data.images.hero) || ["", "", "", ""];
  const handleUpload = (idx, urls) => {
    const next = [heroImgs[0] || "", heroImgs[1] || "", heroImgs[2] || "", heroImgs[3] || ""];
    next[idx] = urls[0];
    save({ ...data, images: { ...data.images, hero: next } });
    notify("Foto Background Hero diperbarui!");
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 10 }}>
      {[0, 1, 2, 3].map(idx => (
        <div key={idx} style={{ background: "#FAF7F0", borderRadius: 8, padding: 8, border: "1px solid #E8DCC8" }}>
          {heroImgs[idx] ? (
            <img decoding="async" loading="lazy" src={cld(heroImgs[idx])} alt="" style={{ width: "100%", height: 78, objectFit: "cover", borderRadius: 5, marginBottom: 6 }} onError={onImgError} />
          ) : (
            <div style={{ width: "100%", height: 78, background: "#E8DCC8", borderRadius: 5, marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#8B9A9C" }}>Foto {idx + 1}</div>
          )}
          <UploadButton label="Ganti"
            style={{ fontSize: 10, padding: "5px 8px", width: "100%", justifyContent: "center" }}
            onDone={urls => handleUpload(idx, urls)} onError={() => notify("Gagal upload.", "error")} />
        </div>
      ))}
    </div>
  );
}

/* ── Komponen utama: Setting Halaman About ── */
function AboutPageAdmin({ data, save, notify, uploadToCloudinary }) {
  return (
    <div className="fade-in" style={{ maxWidth: 860 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 30 }}></span>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#2E3D3F", margin: 0 }}>Setting Halaman About</h1>
          <p style={{ fontSize: 13, color: "#8B9A9C", margin: "3px 0 0" }}>
            Kelola semua konten yang tampil di hikimoriconst.com/about — Hero & Background, Statistik, Visi Misi, Mengapa Memilih Kami, Susunan Tim, dan Layanan Kami. Semua teks, gambar, dan kartu di bawah ini bisa ditambah, diedit, dihapus, dan diganti fotonya.
          </p>
        </div>
      </div>

      <AboutAdminSection title="Hero & Background" accent="#8B6914"
        desc="Label kecil, judul besar, dan deskripsi yang tampil di bagian paling atas halaman About. Background Hero adalah 4 foto grid yang juga dipakai sebagai Hero Slideshow di halaman Home.">
        <AboutTextField data={data} save={save} notify={notify} label="Hero — Label Kecil" fieldKey="aboutHeroLabel" placeholder="Tentang Kami" />
        <AboutTextField data={data} save={save} notify={notify} label="Hero — Judul Utama" fieldKey="aboutHeroTitle" placeholder="Membangun Hunian, Mewujudkan Impian" />
        <AboutTextField data={data} save={save} notify={notify} label="Hero — Sub / Deskripsi" fieldKey="aboutHeroSub" multiline placeholder="HIKIMORI CONST adalah developer perumahan dan jasa desain terpercaya..." />
        <AboutTextField data={data} save={save} notify={notify} label="Teks Deskripsi Cadangan (fallback bila Hero Sub kosong)" fieldKey="aboutText" multiline />
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 8 }}>Background Hero (4 Foto Grid)</div>
          <AboutHeroBgEditor data={data} save={save} notify={notify} />
        </div>
      </AboutAdminSection>

      <AboutAdminSection title="Statistik (Stats Strip)" accent="#3D5254"
        desc='Angka pencapaian yang tampil sebagai strip di bawah Hero, misalnya "500+ Klien Puas".'>
        <AboutStatsEditor data={data} save={save} notify={notify} />
      </AboutAdminSection>

      <AboutAdminSection title="Visi & Misi" accent="#2E3D3F" desc="Teks Visi perusahaan dan daftar poin Misi.">
        <AboutTextField data={data} save={save} notify={notify} label="Visi Kami" fieldKey="aboutVisiText" multiline accent="#2E3D3F" />
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 8 }}>Misi Kami (Daftar Poin)</div>
          <AboutMisiEditor data={data} save={save} notify={notify} />
        </div>
      </AboutAdminSection>

      <AboutAdminSection title="Mengapa Memilih Kami" accent="#0a6ea0" desc="Label, judul section, dan kartu-kartu keunggulan (icon, judul, deskripsi).">
        <AboutTextField data={data} save={save} notify={notify} label="Label Kecil" fieldKey="aboutWhyLabel" placeholder="Keunggulan Kami" accent="#0a6ea0" />
        <AboutTextField data={data} save={save} notify={notify} label="Judul Section" fieldKey="aboutWhyTitle" placeholder="Mengapa Memilih HIKIMORI CONST?" accent="#0a6ea0" />
        <div style={{ marginTop: 14 }}>
          <AboutWhyUsEditor data={data} save={save} notify={notify} />
        </div>
      </AboutAdminSection>

      <AboutAdminSection title="Susunan Tim" accent="#8B6914" desc="Label & judul section di sini dipakai untuk section 'Tema Rumah Pilihan Kami' di halaman About (kartu tema diambil otomatis-acak dari data Tema Rumah). Data anggota tim di bawah ini TIDAK lagi ditampilkan ke publik — datanya tetap tersimpan kalau nanti mau diaktifkan lagi.">
        <AboutTextField data={data} save={save} notify={notify} label="Label Kecil" fieldKey="aboutTeamLabel" placeholder="Kosongkan jika tidak dipakai" />
        <AboutTextField data={data} save={save} notify={notify} label="Judul Section" fieldKey="aboutTeamTitle" placeholder="Hikimori Const INDONESIA" />
        <div style={{ marginTop: 14, background: "#FAF7F0", borderRadius: 10, padding: 16, border: "1px dashed #D5C9B0" }}>
          <div style={{ fontSize: 12, color: "#8B6914", fontWeight: 700, marginBottom: 10 }}>Data anggota tim (tidak tampil publik saat ini)</div>
          <TeamAdmin data={data} save={save} notify={notify} uploadToCloudinary={uploadToCloudinary} embedded />
        </div>
      </AboutAdminSection>

      <AboutAdminSection title="Layanan Kami (Kartu di Halaman About)" accent="#C9AA71" desc="Label, judul, dan kartu-kartu layanan (icon, judul, deskripsi, foto) yang tampil di bagian bawah halaman About.">
        <AboutTextField data={data} save={save} notify={notify} label="Label Kecil" fieldKey="aboutLayananLabel" placeholder="LAYANAN KAMI" />
        <AboutTextField data={data} save={save} notify={notify} label="Judul Section" fieldKey="aboutLayananTitle" placeholder="Layanan Terbaik Untuk Anda" />
        <div style={{ marginTop: 14 }}>
          <AboutLayananListEditor data={data} save={save} notify={notify} uploadToCloudinary={uploadToCloudinary} />
        </div>
      </AboutAdminSection>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SETTING HALAMAN LAYANAN (/services) — satu tempat khusus
   berisi teks (judul + deskripsi) DAN foto hero, digabung
   jadi satu supaya tidak tersebar di tab lain.
   ══════════════════════════════════════════════════════════ */
function LayananPageAdmin({ data, save, notify }) {
  return (
    <div className="fade-in" style={{ maxWidth: 860 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 30 }}></span>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#2E3D3F", margin: 0 }}>Setting Halaman Layanan</h1>
          <p style={{ fontSize: 13, color: "#8B9A9C", margin: "3px 0 0" }}>
            Kelola teks (judul & deskripsi) dan foto hero halaman Layanan (/services) — semuanya di satu tempat ini.
          </p>
        </div>
      </div>

      <AboutAdminSection title="Teks Hero Halaman Layanan" accent="#C9AA71"
        desc="Judul besar dan deskripsi singkat yang tampil di bagian atas halaman Layanan.">
        <AboutTextField data={data} save={save} notify={notify} label="Judul Halaman" fieldKey="servicesPageTitle" placeholder="SOLUSI LENGKAP DESAIN & KONSTRUKSI" accent="#C9AA71" />
        <AboutTextField data={data} save={save} notify={notify} label="Deskripsi / Subjudul" fieldKey="servicesPageSub" multiline placeholder="Melayani desain, renovasi, interior, eksterior hingga penataan taman dengan standar profesional." accent="#C9AA71" />
      </AboutAdminSection>

      <AboutAdminSection title="Foto Hero Halaman Layanan" accent="#8B6914"
        desc="Foto latar belakang besar di bagian paling atas halaman Layanan.">
        <LayananHeroImagePanel data={data} save={save} notify={notify} />
      </AboutAdminSection>
    </div>
  );
}

function LayananHeroImagePanel({ data, save, notify }) {
  const [imgUrl, setImgUrl] = React.useState(data.content.servicesHeroImage || "");
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", letterSpacing: "0.8px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>URL Foto Hero</label>
      <div className="adm-input-btn-row" style={{ marginBottom: 12 }}>
        <input
          value={imgUrl}
          onChange={e => setImgUrl(e.target.value)}
          placeholder="https://..."
          style={{ flex: 1, padding: "9px 12px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" }}
        />
        <button onClick={() => {
          const url = imgUrl.trim();
          if (!url) return notify("Masukkan URL gambar.", "error");
          save({ ...data, content: { ...data.content, servicesHeroImage: url } });
          notify("Foto hero Layanan disimpan!");
        }} style={{ padding: "9px 16px", background: "#8B6914", color: "#fff", borderRadius: 6, fontSize: 12, border: "none", fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer" }}>
          Simpan
        </button>
      </div>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Atau Upload Foto</label>
      <UploadButton label="Pilih Foto Hero"
        style={{ border: "1.5px dashed #8B6914", color: "#8B6914", background: "#fff" }}
        onDone={urls => {
          setImgUrl(urls[0]);
          save({ ...data, content: { ...data.content, servicesHeroImage: urls[0] } });
          notify("Foto hero Layanan diupload!");
        }}
        onError={() => notify("Gagal upload. Coba lagi.", "error")} />
      {data.content.servicesHeroImage && (
        <img decoding="async" loading="lazy" src={cld(data.content.servicesHeroImage)} alt="Preview Hero Layanan"
          style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 8, border: "1px solid #E8DCC8", marginTop: 12 }}
          onError={onImgError} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SUB LAYANAN ADMIN — Universal CRUD + Gambar + Teks Setting
   Dipakai oleh: Home, LayananKami, DesainRab, TemaRumah,
                 Interior, Pagar, Kanopi, Aluminium, Landscape
   ══════════════════════════════════════════════════════════ */
/* ─── Drag-reorder helpers (dipakai di semua panel admin yang punya daftar urutan tampil publik) ─── */
function moveArrayItem(arr, from, to) {
  const copy = arr.slice();
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
}

function DragHandle({ style = {} }) {
  return (
    <span title="Tahan & geser untuk mengubah urutan" style={{ cursor: "grab", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 32, color: "#A89070", touchAction: "none", ...style }}>
      <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor">
        <circle cx="4" cy="3" r="1.6" /><circle cx="10" cy="3" r="1.6" />
        <circle cx="4" cy="10" r="1.6" /><circle cx="10" cy="10" r="1.6" />
        <circle cx="4" cy="17" r="1.6" /><circle cx="10" cy="17" r="1.6" />
      </svg>
    </span>
  );
}

/* Hook generik: kelola drag-reorder untuk sebuah array item + auto-persist saat drag selesai. */
function useDragReorder(items, onCommit) {
  const [ordered, setOrdered] = useState(items);
  useEffect(() => { setOrdered(items); }, [items]);
  const dragIdxRef = useRef(null);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const onDragStart = (idx) => (e) => { dragIdxRef.current = idx; setDraggingIdx(idx); e.dataTransfer.effectAllowed = "move"; };
  const onDragEnter = (idx) => (e) => {
    e.preventDefault();
    if (dragIdxRef.current === null || dragIdxRef.current === idx) return;
    setOrdered(prev => moveArrayItem(prev, dragIdxRef.current, idx));
    dragIdxRef.current = idx;
  };
  const onDragOver = (e) => e.preventDefault();
  const onDragEnd = async () => {
    setDraggingIdx(null); dragIdxRef.current = null;
    const changed = ordered.length === items.length && ordered.some((it, i) => (it.id ?? it.slug ?? i) !== (items[i]?.id ?? items[i]?.slug ?? i));
    if (changed) {
      try { await onCommit(ordered); }
      catch { setOrdered(items); }
    }
  };
  /* Geser 1 posisi via tombol panah (dipakai mode "Atur Posisi" khusus smartphone) — commit langsung. */
  const moveStep = async (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= ordered.length) return;
    const next = moveArrayItem(ordered, idx, target);
    setOrdered(next);
    try { await onCommit(next); }
    catch { setOrdered(items); }
  };
  const moveUp = (idx) => moveStep(idx, -1);
  const moveDown = (idx) => moveStep(idx, 1);
  return { ordered, draggingIdx, onDragStart, onDragEnter, onDragOver, onDragEnd, moveUp, moveDown };
}

/* Tombol panah naik/turun — dipakai saat mode "Atur Posisi" aktif (khusus tampilan smartphone). */
function OrderArrows({ idx, count, onUp, onDown }) {
  const btnStyle = (disabled) => ({ width: 26, height: 20, border: "1px solid #D5C9B0", background: disabled ? "#F5EDD8" : "#fff", borderRadius: 5, cursor: disabled ? "default" : "pointer", color: "#5A6A6C", fontSize: 10, opacity: disabled ? 0.4 : 1, lineHeight: 1, padding: 0 });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, flexShrink: 0 }}>
      <button type="button" onClick={() => onUp(idx)} disabled={idx === 0} style={btnStyle(idx === 0)}>▲</button>
      <button type="button" onClick={() => onDown(idx)} disabled={idx === count - 1} style={btnStyle(idx === count - 1)}>▼</button>
    </div>
  );
}

/* Tombol "Atur Posisi" — hanya tampil di layar smartphone (drag-and-drop tidak nyaman di layar sentuh). */
/* Tombol "Atur Posisi" — tampil di semua perangkat (desktop & smartphone). Saat aktif, tiap item
   menampilkan tombol panah naik/turun sebagai alternatif drag-and-drop (drag tetap berfungsi juga). */
/* Kontrol urutan gabungan — grip untuk drag (mouse) + tombol panah naik/turun (klik), tampil bersamaan
   di semua perangkat. Drag tetap berfungsi lewat atribut draggable pada baris, arrow untuk klik langsung. */
function OrderControls({ idx, count, onUp, onDown }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
      <DragHandle />
      <OrderArrows idx={idx} count={count} onUp={onUp} onDown={onDown} />
    </div>
  );
}

/* Catatan: label "Atur Posisi" toggle dihapus — drag handle & tombol panah kini selalu tampil
   bersamaan (lihat OrderControls di atas) sehingga tidak perlu mode terpisah lagi. */

function SubLayananAdmin({

  title, icon, accentColor = "#C9AA71",
  storeKey, data, save, notify, uploadToCloudinary,
  pageDesc,
  sections = [],
  imageGroups = [],
  crudKey,
  crudLabel,
  crudFields = [],
  crudHasImage = false,
  crudHasGallery = false,
  defaultItems = null,
}) {
  /* PENTING: fallback ke defaultItems di sini HANYA untuk tampilan (tidak pernah otomatis
     ditulis ke Firestore). Ini memperbaiki bug serius: sebelumnya ada useEffect yang otomatis
     men-save() defaultItems ke Firestore begitu komponen ini mount dan `items` kosong — termasuk
     saat kosong itu cuma KEADAAN SEMENTARA (data asli dari Firestore belum selesai dimuat saat
     tab admin ini dibuka). Race condition itu bisa diam-diam MENIMPA seluruh data yang sudah
     dikonfigurasi dengan data contoh, persis seperti yang dikeluhkan user. Sekarang: kalau
     Firestore benar-benar sudah punya data → itu yang dipakai (dan TIDAK PERNAH ditimpa otomatis).
     Kalau memang masih kosong (first-run atau admin sengaja hapus semua) → contoh ditampilkan
     sebagai starting point yang bisa diedit, dan baru betulan tersimpan ke Firestore saat admin
     melakukan aksi eksplisit (edit/hapus/tambah/atur urutan) — bukan otomatis saat halaman dibuka. */
  const items     = (data[crudKey] && data[crudKey].length > 0) ? data[crudKey] : (defaultItems || []);
  const accent    = accentColor;

  /* Kategori yang sudah pernah dipakai di daftar item ini → jadi opsi dropdown untuk field type "category" */
  const categoryOptions = useMemo(() => {
    const keys = crudFields.filter(f => f.type === "category").map(f => f.key);
    const set = new Set();
    items.forEach(it => keys.forEach(k => { if (it[k]) set.add(it[k]); }));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [items, crudFields]);

  /* ── State ── */
  const emptyForm = () => { const o = {}; crudFields.forEach(f => { o[f.key] = f.type === "toggle" ? (f.default !== undefined ? f.default : true) : f.type === "priceBreakdown" ? { aktif: false, items: [] } : ""; }); if (crudHasImage) o._img = ""; if (crudHasGallery) o.imgs = []; return o; };
  const [mode, setMode]         = useState("list");   // "list" | "add" | "edit"
  const [editItem, setEditItem] = useState(null);
  const [form, setForm]         = useState(emptyForm());
  const [uploading, setUploading] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [seeding, setSeeding]   = useState(false);

  /* ── Seed manual (tetap tersedia lewat tombol di bawah list jika diperlukan) ── */
  const handleSeed = async () => {
    if (!defaultItems || seeding) return;
    if (!window.confirm("Yakin ingin reset ke data contoh awal? Semua produk yang sudah kamu tambah/ubah di sini akan DIGANTI dan tidak bisa dikembalikan lagi.")) return;
    setSeeding(true);
    try {
      const seeded = defaultItems.map((it, i) => ({ ...it, id: it.id || String(Date.now() + i) }));
      await save({ ...data, [crudKey]: seeded });
      notify("Data berhasil dimuat!");
    } catch { notify("Gagal memuat data."); }
    setSeeding(false);
  };

  /* ── Upload gambar ── */
  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setForm(p => ({ ...p, _img: url }));
      notify("Foto berhasil diupload!");
    } catch { notify("Gagal upload foto."); }
    setUploading(false);
  };

  /* ── Upload galeri multi-foto (opsional, lewat crudHasGallery) ── */
  const handleGalleryUpload = async (file) => {
    if (!file) return;
    setUploadingGallery(true);
    try {
      const url = await uploadToCloudinary(file);
      setForm(p => ({ ...p, imgs: [...(p.imgs || []), { img: url, label: "" }] }));
      notify("Foto galeri ditambahkan!");
    } catch { notify("Gagal upload foto galeri."); }
    setUploadingGallery(false);
  };
  const removeGalleryImg = (i) => setForm(p => ({ ...p, imgs: (p.imgs || []).filter((_, j) => j !== i) }));

  /* ── Simpan (tambah / edit) ── */
  const handleSave = async () => {
    if (!form[crudFields[0]?.key]?.trim()) { notify("Nama tidak boleh kosong."); return; }
    setSaving(true);
    try {
      let next;
      if (mode === "add") {
        next = [...items, { ...form, id: Date.now().toString() }];
      } else {
        next = items.map(it => it.id === editItem.id ? { ...it, ...form } : it);
      }
      await save({ ...data, [crudKey]: next });
      notify("Tersimpan!");
      setMode("list"); setForm(emptyForm()); setEditItem(null);
    } catch (err) { notify("Gagal menyimpan: " + (err?.message || "Periksa koneksi.")); }
    finally { setSaving(false); }
  };

  /* ── Hapus (data Firestore + foto/video terkait di Cloudinary) ── */
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async (id) => {
    const item = items.find(it => it.id === id);
    setDeleting(true);
    try {
      const urls = [item?._img, ...((item?.imgs || []).map(g => g?.img))].filter(Boolean);
      const cloudOk = urls.length > 0 ? await deleteCloudinaryAssets(urls) : true;
      await save({ ...data, [crudKey]: items.filter(it => it.id !== id) });
      notify(cloudOk
        ? "Item & foto terkait berhasil dihapus permanen."
        : "Data berhasil dihapus, tapi sebagian foto di Cloudinary gagal terhapus otomatis (cek konfigurasi /api/delete-cloudinary).");
      setDelTarget(null);
    } catch (err) { notify("Gagal menghapus: " + (err?.message || "Periksa koneksi.")); }
    finally { setDeleting(false); }
  };

  /* ── Toggle Hide/Publish: item tetap tersimpan di database, hanya disembunyikan dari halaman publik ── */
  const handleToggleHidden = async (item) => {
    try {
      const nextHidden = !item.hidden;
      const next = items.map(it => it.id === item.id ? { ...it, hidden: nextHidden } : it);
      await save({ ...data, [crudKey]: next });
      notify(nextHidden ? "Produk disembunyikan dari halaman publik." : "Produk sekarang tampil di halaman publik.");
    } catch (err) { notify("Gagal mengubah status tampilan: " + (err?.message || "Periksa koneksi.")); }
  };

  /* ── Buka form edit ── */
  const openEdit = (item) => {
    const f = emptyForm();
    crudFields.forEach(fd => {
      if (fd.type === "toggle") f[fd.key] = item[fd.key] !== undefined ? !!item[fd.key] : (fd.default !== undefined ? fd.default : true);
      else if (fd.type === "priceBreakdown") f[fd.key] = (item[fd.key] && typeof item[fd.key] === "object") ? item[fd.key] : { aktif: false, items: [] };
      else f[fd.key] = item[fd.key] || "";
    });
    if (crudHasImage) f._img = item._img || "";
    if (crudHasGallery) f.imgs = item.imgs || [];
    setForm(f); setEditItem(item); setMode("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── Buka form tambah ── */
  const openAdd = () => { setForm(emptyForm()); setEditItem(null); setMode("add"); window.scrollTo({ top: 0, behavior: "smooth" }); };

  /* ── Drag-reorder daftar item: urutan di sini = urutan tampil di halaman publik ── */
  const { ordered: orderedItems, draggingIdx, onDragStart, onDragEnter, onDragOver, onDragEnd, moveUp, moveDown } =
    useDragReorder(items, async (next) => { await save({ ...data, [crudKey]: next }); notify("Urutan berhasil disimpan!"); });

  /* Field component di-hoist ke top-level module scope (lihat CrudField) supaya
     tidak dibuat ulang setiap render — mencegah bug kursor hilang saat mengetik. */

  /* ═══ LIST VIEW ═══ */
  if (mode === "list") return (
    <div style={{ maxWidth: 680 }}>
      {/* Judul halaman */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 30 }}>{icon}</span>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#2E3D3F", margin: 0 }}>{title}</h2>
          {pageDesc && <p style={{ fontSize: 13, color: "#8B9A9C", margin: "3px 0 0" }}>{pageDesc}</p>}
        </div>
      </div>

      {/* Tombol tambah */}
      <button onClick={openAdd}
        style={{ width: "100%", padding: "14px 20px", background: accent, color: "#fff", border: "none",
          borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 16,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: `0 4px 18px ${accent}50`, transition: "transform .15s, box-shadow .15s",
          position: "relative", overflow: "hidden" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 28px ${accent}60`; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 18px ${accent}50`; }}>
        <span style={{ fontSize: 20, fontWeight: 900 }}>＋</span>
        Tambah {crudLabel || "Item"} Baru
      </button>

      {/* Loading indicator saat auto-seed */}
      {seeding && (
        <div style={{ width: "100%", padding: "12px 20px", background: "#FAF7F0", border: `2px dashed ${accent}`,
          color: "#8B6914", borderRadius: 10, fontSize: 14, fontWeight: 600,
          marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <span style={{ width: 16, height: 16, border: "2px solid rgba(139,105,20,.3)", borderTop: "2px solid #8B6914",
            borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />
          Memuat data awal otomatis...
        </div>
      )}

      {/* Tombol reset ke data hardcoded dipindah ke paling bawah halaman (lihat akhir list) */}

      {/* Daftar item */}
      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", border: "1.5px dashed #D5C9B0", borderRadius: 12, color: "#A89070", fontSize: 14 }}>
          Belum ada data. Klik tombol di atas untuk menambahkan.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {orderedItems.map((item, idx) => { const isHidden = !!item.hidden; return (
            <div key={item.id || idx}
              draggable
              onDragStart={onDragStart(idx)}
              onDragEnter={onDragEnter(idx)}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
              style={{ background: "#fff", border: `1.5px solid ${isHidden ? "#E5C07B" : "#E8DCC8"}`, borderRadius: 12, overflow: "hidden", opacity: draggingIdx === idx ? 0.4 : isHidden ? 0.72 : 1, transition: "opacity .15s" }}>
              {/* Row item */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", flexWrap: "wrap" }}>
                <OrderControls idx={idx} count={orderedItems.length} onUp={moveUp} onDown={moveDown} />
                {item._img
                  ? <img decoding="async" loading="lazy" src={cld(item._img)} alt="" style={{ width: 54, height: 44, objectFit: "cover", borderRadius: 7, flexShrink: 0 }} />
                  : <div style={{ width: 54, height: 44, background: "#F5EDD8", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{icon}</div>
                }
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#2E3D3F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
                      {item.nama || item[crudFields[0]?.key] || `Item ${idx + 1}`}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".03em", padding: "2px 8px", borderRadius: 20,
                      background: isHidden ? "#FDF3E3" : "#E8F8EF", color: isHidden ? "#A9720F" : "#1A7A40", flexShrink: 0 }}>
                      {isHidden ? "TERSEMBUNYI" : "PUBLIK"}
                    </span>
                  </div>
                  {item.harga && <div style={{ fontSize: 12, color: "#8B6914", fontWeight: 600, marginTop: 2 }}>{formatHargaRp(item.harga)}</div>}
                </div>

                {/* Toggle Hide / Public */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}
                  title={isHidden ? "Tersembunyi dari halaman publik — klik untuk publikasikan" : "Tampil di halaman publik — klik untuk sembunyikan"}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isHidden ? "#A9720F" : "#1A7A40", minWidth: 34, textAlign: "right" }}>
                    {isHidden ? "Hide" : "Public"}
                  </span>
                  <button type="button" onClick={() => handleToggleHidden(item)}
                    style={{ position: "relative", width: 42, height: 24, borderRadius: 20, border: "none", cursor: "pointer",
                      flexShrink: 0, background: isHidden ? "#D5C9B0" : accent, transition: "background .2s" }}>
                    <span style={{ position: "absolute", top: 3, left: isHidden ? 3 : 21, width: 18, height: 18, borderRadius: "50%",
                      background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.3)", transition: "left .2s" }} />
                  </button>
                </div>

                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => openEdit(item)}
                    style={{ background: accent, color: "#fff", border: "none", borderRadius: 7,
                      padding: "7px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                      transition: "transform .12s, box-shadow .12s" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.06)"; e.currentTarget.style.boxShadow = `0 4px 12px ${accent}50`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}>
                    Edit
                  </button>
                  <button onClick={() => setDelTarget(item.id)}
                    style={{ display: "flex", alignItems: "center", gap: 5, background: "#fef2f2", color: "#e74c3c", border: "1.5px solid #fca5a5",
                      borderRadius: 7, padding: "7px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                      transition: "all .12s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#e74c3c"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#e74c3c"; }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                    Hapus
                  </button>
                </div>
              </div>

              {/* Konfirmasi hapus */}
              {delTarget === item.id && (
                <div style={{ background: "#fef2f2", borderTop: "1px solid #fca5a5", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, color: "#b91c1c", fontWeight: 600, flex: 1 }}>
                    {deleting ? "Menghapus data & foto di Cloudinary..." : "Yakin ingin menghapus ini? Foto terkait juga akan dihapus dari Cloudinary."}
                  </span>
                  <button onClick={() => handleDelete(item.id)} disabled={deleting}
                    style={{ background: "#e74c3c", color: "#fff", border: "none", borderRadius: 7, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: deleting ? "default" : "pointer", opacity: deleting ? 0.7 : 1 }}>
                    {deleting ? "Menghapus..." : "Ya, Hapus"}
                  </button>
                  <button onClick={() => setDelTarget(null)} disabled={deleting}
                    style={{ background: "#fff", color: "#5A6A6C", border: "1.5px solid #D5C9B0", borderRadius: 7, padding: "7px 14px", fontSize: 13, cursor: deleting ? "default" : "pointer" }}>
                    Batal
                  </button>
                </div>
              )}
            </div>
          ); })}
        </div>
      )}

      {/* Tombol reset ke data contoh — sengaja dibuat kecil & ditaruh paling bawah
          supaya tidak gampang kepencet tidak sengaja (bisa menghapus semua data
          yang sudah di-setting). Ada juga konfirmasi sebelum benar-benar reset. */}
      {defaultItems && defaultItems.length > 0 && !seeding && (
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <button onClick={handleSeed}
            style={{ padding: "4px 10px", background: "transparent", border: "1px dashed #D5C9B0",
              color: "#A89070", borderRadius: 6, fontSize: 10.5, fontWeight: 500, cursor: "pointer",
              opacity: 0.7, transition: "opacity .15s" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = 1)}
            onMouseLeave={e => (e.currentTarget.style.opacity = 0.7)}>
            Reset ke Data Contoh Awal
          </button>
        </div>
      )}
    </div>
  );

  /* ═══ ADD / EDIT VIEW ═══ */
  return (
    <div style={{ maxWidth: 580 }}>
      {/* Header form */}
      <button onClick={() => { setMode("list"); setForm(emptyForm()); }}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#5A6A6C", fontSize: 14, cursor: "pointer", marginBottom: 18, padding: 0, fontWeight: 600 }}>
        ← Kembali ke daftar
      </button>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#2E3D3F", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
        <span>{mode === "add" ? "＋" : ""}</span>
        {mode === "add" ? `Tambah ${crudLabel || "Item"}` : `Edit: ${editItem?.nama || editItem?.[crudFields[0]?.key] || "Item"}`}
      </h2>

      <div style={{ background: "#fff", border: "1.5px solid #E8DCC8", borderRadius: 14, padding: "22px 20px" }}>
        {/* Upload foto */}
        {crudHasImage && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#5A6A6C", marginBottom: 8 }}>Foto Produk</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {form._img
                ? <img decoding="async" loading="lazy" src={cld(form._img)} alt="" style={{ width: 90, height: 70, objectFit: "cover", borderRadius: 8, border: "1.5px solid #E8DCC8" }} />
                : <div style={{ width: 90, height: 70, background: "#F5EDD8", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, border: "1.5px dashed #D5C9B0" }}>{icon}</div>
              }
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", cursor: uploading ? "default" : "pointer" }}>
                  <div style={{ borderRadius: 8, padding: "10px 0", fontSize: 14, fontWeight: 700, textAlign: "center",
                    color: "#fff", position: "relative", overflow: "hidden",
                    background: uploading ? "linear-gradient(130deg,#2980b9,#3498db)" : accent,
                    opacity: uploading ? 1 : 1, transition: "background .2s" }}>
                    {uploading && (
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent)",
                        animation: "shimmer 1.2s linear infinite", backgroundSize: "200% 100%" }} />
                    )}
                    <span style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      {uploading ? (
                        <>
                          <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,.3)", borderTop: "2px solid #fff",
                            borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />
                          Mengupload...
                        </>
                      ) : "Upload Foto"}
                    </span>
                  </div>
                  <input type="file" accept="image/*" style={{ display: "none" }} disabled={uploading}
                    onChange={e => handleUpload(e.target.files?.[0])} />
                </label>
                {form._img && (
                  <button onClick={() => setForm(p => ({ ...p, _img: "" }))}
                    style={{ marginTop: 6, background: "none", border: "none", color: "#e74c3c", fontSize: 12, cursor: "pointer", padding: 0 }}>
                    Hapus foto
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Galeri multi-foto (opsional, mis. produk furnitur) */}
        {crudHasGallery && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#5A6A6C", marginBottom: 8 }}>Galeri Foto Produk (untuk halaman detail)</div>
            {(form.imgs || []).length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(80px,1fr))", gap: 8, marginBottom: 10 }}>
                {(form.imgs || []).map((g, i) => (
                  <div key={i} style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: "1.5px solid #E8DCC8" }}>
                    <img decoding="async" loading="lazy" src={cld(g.img)} alt="" style={{ width: "100%", height: 64, objectFit: "cover", display: "block" }} onError={onImgError} />
                    <button onClick={() => removeGalleryImg(i)}
                      style={{ position: "absolute", top: 3, right: 3, width: 18, height: 18, background: "rgba(220,38,38,.85)", color: "#fff", border: "none", borderRadius: "50%", cursor: "pointer", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <label style={{ display: "inline-block", padding: "8px 14px", background: uploadingGallery ? "#ccc" : "#3498db", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: uploadingGallery ? "default" : "pointer" }}>
              {uploadingGallery ? "Mengupload..." : "Tambah Foto Galeri"}
              <input type="file" accept="image/*" style={{ display: "none" }} disabled={uploadingGallery} onChange={e => handleGalleryUpload(e.target.files?.[0])} />
            </label>
            <div style={{ fontSize: 11, color: "#8B9A9C", marginTop: 6 }}>
              Bisa upload beberapa foto. Foto ini tampil sebagai galeri di halaman detail produk.
            </div>
          </div>
        )}

        {/* Fields */}
        {crudFields.map(fd => <CrudField key={fd.key} fd={fd.type === "category" ? { ...fd, options: categoryOptions } : fd} form={form} setForm={setForm} accent={accent} />)}

        {/* Tombol simpan */}
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 1, padding: "13px 0", color: "#fff", border: "none", borderRadius: 9,
              fontSize: 15, fontWeight: 700, cursor: saving ? "default" : "pointer",
              background: saving ? "linear-gradient(130deg,#1a7a40,#27ae60)" : "#27ae60",
              position: "relative", overflow: "hidden", transition: "all .2s",
              animation: saving ? "none" : "none",
              boxShadow: saving ? "0 0 0 4px rgba(39,174,96,.25)" : "none" }}>
            {/* shimmer sweep on idle */}
            {!saving && (
              <span style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,.18) 50%,transparent 100%)",
                backgroundSize: "200% 100%", animation: "shimmer 2.2s linear infinite" }} />
            )}
            {saving ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <span style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,.3)", borderTop: "2.5px solid #fff",
                  borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite", flexShrink: 0 }} />
                Menyimpan...
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Simpan
              </span>
            )}
          </button>
          <button onClick={() => { setMode("list"); setForm(emptyForm()); }}
            style={{ padding: "13px 20px", background: "#F5EDD8", color: "#5A6A6C", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── ADMIN REVIEWS COMPONENT ─────────────── */
/* ═══════════════════════════════════════════════════════════════════
   BACKUP & RESTORE DATA WEBSITE
   Download seluruh isi data website (data object utuh, sama seperti yang
   tersimpan di Firestore dokumen "main") sebagai file JSON yang bisa
   disimpan di komputer/HP admin, dan mengembalikannya kapan saja lewat
   Restore jika suatu saat data di server bermasalah (tertimpa, terhapus,
   dsb). Ini murni client-side (download/upload file) — tidak menyentuh
   server sampai admin benar-benar menekan tombol Restore.
═══════════════════════════════════════════════════════════════════ */
function BackupDataPanel({ data, save, notify }) {
  const [restoring, setRestoring] = useState(false);
  const [preview, setPreview] = useState(null); // { fileName, parsed } — menunggu konfirmasi restore
  const fileInputRef = useRef(null);

  const handleDownload = () => {
    try {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const stamp = now.toISOString().slice(0, 16).replace(/[T:]/g, "-");
      const a = document.createElement("a");
      a.href = url;
      a.download = `hikimori-const-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify("Backup berhasil diunduh!");
    } catch (err) {
      notify("Gagal membuat file backup: " + (err?.message || "Terjadi kesalahan."));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset supaya bisa pilih file yang sama lagi kalau perlu
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          notify("File tidak valid — bukan file backup JSON yang benar.");
          return;
        }
        setPreview({ fileName: file.name, parsed });
      } catch {
        notify("Gagal membaca file — pastikan ini file backup .json yang benar dan tidak rusak.");
      }
    };
    reader.onerror = () => notify("Gagal membaca file.");
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!preview) return;
    setRestoring(true);
    try {
      await save(preview.parsed); // save() sudah otomatis merge dengan DEFAULT_DATA
      notify("Data berhasil di-restore dari backup!");
      setPreview(null);
    } catch (err) {
      notify("Gagal restore: " + (err?.message || "Periksa koneksi lalu coba lagi."));
    }
    setRestoring(false);
  };

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: 24, fontWeight: 500, color: "#2E3D3F", marginBottom: 6 }}>Backup & Restore Data</h1>
      <p style={{ fontSize: 13, color: "#5A6A6C", marginBottom: 28, lineHeight: 1.6, maxWidth: 640 }}>
        Unduh seluruh isi website (konten, katalog produk, paket, halaman About, dll.) sebagai satu file cadangan.
        Simpan file ini di komputer/HP kamu secara berkala — kalau suatu saat data di server bermasalah, kamu bisa
        mengembalikannya sendiri lewat Restore di bawah tanpa perlu menunggu bantuan siapa pun.
      </p>

      {/* -- Download Backup -- */}
      <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderTop: "4px solid #27ae60", padding: 22, marginBottom: 20, maxWidth: 640 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#2E3D3F", marginBottom: 6 }}>⬇ Download Backup Sekarang</h3>
        <p style={{ fontSize: 12.5, color: "#5A6A6C", marginBottom: 16, lineHeight: 1.6 }}>
          Mengunduh kondisi data website SAAT INI (yang sedang tampil di situs kamu sekarang) sebagai file .json.
        </p>
        <button onClick={handleDownload}
          style={{ background: "#27ae60", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          ⬇ Backup Semua Data Website
        </button>
      </div>

      {/* -- Restore dari Backup -- */}
      <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderTop: "4px solid #c0392b", padding: 22, maxWidth: 640 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#2E3D3F", marginBottom: 6 }}>⬆ Restore dari File Backup</h3>
        <p style={{ fontSize: 12.5, color: "#5A6A6C", marginBottom: 16, lineHeight: 1.6 }}>
          <strong>Perhatian:</strong> ini akan MENGGANTI seluruh data website yang sedang aktif sekarang dengan isi file backup yang kamu pilih. Pastikan file yang dipilih benar sebelum konfirmasi.
        </p>
        <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleFileSelect} style={{ display: "none" }} />
        <button onClick={() => fileInputRef.current?.click()}
          style={{ background: "#FAF7F0", color: "#2E3D3F", border: "1.5px solid #D5C9B0", borderRadius: 8, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Pilih File Backup (.json)
        </button>

        {preview && (
          <div style={{ marginTop: 18, padding: 16, background: "#FEF3C7", border: "1.5px solid #f59e0b", borderRadius: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#78350f", marginBottom: 6 }}>⚠️ Konfirmasi Restore</div>
            <p style={{ fontSize: 12.5, color: "#78350f", marginBottom: 12, lineHeight: 1.6 }}>
              File <strong>{preview.fileName}</strong> siap di-restore. Ini akan MENGGANTI seluruh data website yang aktif sekarang. Tindakan ini tidak bisa dibatalkan kecuali kamu punya backup lain.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleConfirmRestore} disabled={restoring}
                style={{ background: "#c0392b", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: restoring ? "default" : "pointer", opacity: restoring ? 0.6 : 1 }}>
                {restoring ? "Me-restore..." : "Ya, Restore Sekarang"}
              </button>
              <button onClick={() => setPreview(null)} disabled={restoring}
                style={{ background: "transparent", color: "#78350f", border: "1.5px solid #f59e0b", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Batal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminReviews({ data, save, notify }) {
  const reviews = data.reviews || [];
  const tokens = data.reviewTokens || [];
  const [editReviewId, setEditReviewId] = useState(null);
  const [editReviewForm, setEditReviewForm] = useState({});
  const [newTokenLabel, setNewTokenLabel] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");

  const generateToken = () => {
    // ID berurut berdasarkan jumlah token yang sudah ada
    const nextId = (tokens.length + 1).toString().padStart(3, "0");
    const token = nextId; // token = ID singkat, e.g. "001", "002"
    const label = newTokenLabel.trim() || "Tamu";
    const newToken = { id: Date.now().toString(), token, label, used: false, createdAt: new Date().toISOString().slice(0,10) };
    save({ ...data, reviewTokens: [...tokens, newToken] });
    const link = `${window.location.origin}/UlasanPelayanan/${token}`;
    setGeneratedLink(link);
    setNewTokenLabel("");
    notify("Link ulasan berhasil dibuat!");
  };

  const deleteToken = (id) => {
    save({ ...data, reviewTokens: tokens.filter(t => t.id !== id) });
    notify("Token dihapus.");
  };

  const deleteReview = (id) => {
    save({ ...data, reviews: reviews.filter(r => r.id !== id) });
    notify("Ulasan dihapus.");
  };

  const approveReview = (id) => {
    save({ ...data, reviews: reviews.map(r => r.id === id ? { ...r, approved: true } : r) });
    notify("Ulasan disetujui dan ditampilkan ke publik.");
  };

  const rejectReview = (id) => {
    save({ ...data, reviews: reviews.map(r => r.id === id ? { ...r, approved: false } : r) });
    notify("Ulasan disembunyikan dari publik.");
  };

  const startEditReview = (r) => {
    setEditReviewId(r.id);
    setEditReviewForm({ name: r.name, content: r.content, stars: r.stars });
  };

  const saveEditReview = () => {
    save({ ...data, reviews: reviews.map(r => r.id === editReviewId ? { ...r, ...editReviewForm } : r) });
    setEditReviewId(null);
    notify("Ulasan diperbarui.");
  };

  return (
  <div className="fade-in">
    <h1 style={{ fontSize: 24, fontWeight: 500, color: "#2E3D3F", marginBottom: 28 }}>Kelola Ulasan</h1>

    {/* Generate Review Link */}
    <div className="adm-section-card" style={{ background: "#fff", borderRadius: 8, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderTop: "4px solid #C9AA71" }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: "#2E3D3F", marginBottom: 6 }}>Buat Link Form Ulasan</h3>
      <p style={{ fontSize: 12, color: "#5A6A6C", marginBottom: 16, lineHeight: 1.6 }}>
        Buat link sekali pakai untuk dikirimkan ke klien. Link hanya bisa digunakan satu kali — setelah diisi, link akan hangus otomatis.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <input value={newTokenLabel} onChange={e => setNewTokenLabel(e.target.value)}
          placeholder="Label (misal: Klien Wedding Budi, opsional)"
          style={{ flex: 1, minWidth: 240, padding: "9px 12px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 13, outline: "none" }} />
        <button onClick={generateToken}
          style={{ padding: "9px 18px", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", color: "#fff", borderRadius: 6, fontSize: 13, border: "none", fontWeight: 600, whiteSpace: "nowrap" }}>
          + Buat Link
        </button>
      </div>
      {generatedLink && (
        <div style={{ background: "#FAF7F0", border: "1px solid #A89070", borderRadius: 8, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#8B6914", marginBottom: 4, letterSpacing: ".05em", textTransform: "uppercase" }}>Link Form Ulasan Terbaru</div>
            <code style={{ fontSize: 12, color: "#2E3D3F", wordBreak: "break-all", display: "block" }}>{generatedLink}</code>
          </div>
          <button onClick={() => { navigator.clipboard?.writeText(generatedLink); notify("Link disalin!"); }}
            style={{ padding: "7px 14px", background: "#8B6914", color: "#fff", borderRadius: 6, fontSize: 12, border: "none", fontWeight: 600, flexShrink: 0 }}>
            Salin
          </button>
        </div>
      )}
    </div>

    {/* Active Tokens */}
    <div className="adm-section-card" style={{ background: "#fff", borderRadius: 8, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: "#2E3D3F", marginBottom: 14 }}>Token Aktif ({tokens.filter(t => !t.used).length})</h3>
      {tokens.length === 0 ? (
        <p style={{ fontSize: 13, color: "#5A6A6C" }}>Belum ada token dibuat.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tokens.slice().reverse().map(tok => (
            <div key={tok.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: tok.used ? "#f9f9f9" : "#FAF7F0", borderRadius: 8, border: `1px solid ${tok.used ? "#e8e8e8" : "#A89070"}` }}>
              <span style={{ fontSize: 16 }}>{tok.used ? "" : ""}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#2E3D3F" }}>{tok.label || "—"}</div>
                <div style={{ fontSize: 11, color: "#5A6A6C", fontFamily: "monospace", wordBreak: "break-all" }}>/UlasanPelayanan/{tok.token}</div>
                <div style={{ fontSize: 11, color: "#5A6A6C" }}>Dibuat: {tok.createdAt} · {tok.used ? "Sudah digunakan" : "Belum digunakan"}</div>
              </div>
              {!tok.used && (
                <button onClick={() => { const l = `${window.location.origin}/UlasanPelayanan/${tok.token}`; navigator.clipboard?.writeText(l); notify("Link disalin!"); }}
                  style={{ padding: "5px 10px", background: "#C9AA71", color: "#fff", borderRadius: 5, fontSize: 11, border: "none" }}></button>
              )}
              <button onClick={() => deleteToken(tok.id)}
                style={{ padding: "5px 10px", background: "#fee", color: "#e74c3c", borderRadius: 5, fontSize: 11, border: "none" }}>Hapus</button>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Reviews List */}
    <div className="adm-section-card" style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: "#2E3D3F", marginBottom: 14 }}>
        Ulasan Masuk ({reviews.length})
        {reviews.filter(r => !r.approved).length > 0 && (
          <span style={{ marginLeft: 8, background: "#e74c3c", color: "#fff", borderRadius: 10, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
            {reviews.filter(r => !r.approved).length} pending
          </span>
        )}
      </h3>
      {reviews.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px", color: "#5A6A6C", fontSize: 13 }}>Belum ada ulasan masuk. Buat link dan kirimkan ke klien!</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {reviews.slice().reverse().map(r => (
            <div key={r.id} style={{ border: "1px solid #F5EDD8", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 20px" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 50%,#8B6914 100%)", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18 }}>
                  {r.photo ? <img decoding="async" loading="lazy" src={cld(r.photo)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : r.name?.charAt(0)?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#2E3D3F" }}>{r.name}</span>
                    <span style={{ fontSize: 12, color: "#5A6A6C" }}>{r.email}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8,
                      background: r.approved ? "#e8f8ef" : "#fff8e1",
                      color: r.approved ? "#27ae60" : "#f39c12",
                      border: `1px solid ${r.approved ? "#27ae60" : "#f39c12"}40`
                    }}>
                      {r.approved ? "✓ Tayang" : "Pending"}
                    </span>
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "#5A6A6C" }}>{r.date}</span>
                  </div>
                  <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
                    {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 13, filter: s <= r.stars ? "none" : "grayscale(1) opacity(.3)" }}></span>)}
                  </div>
                  {editReviewId === r.id ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <input value={editReviewForm.name} onChange={e => setEditReviewForm(p => ({ ...p, name: e.target.value }))}
                        style={{ padding: "7px 10px", border: "1px solid #D4C4A0", borderRadius: 5, fontSize: 13 }} placeholder="Nama" />
                      <div style={{ display: "flex", gap: 4 }}>
                        {[1,2,3,4,5].map(s => (
                          <button key={s} onClick={() => setEditReviewForm(p => ({ ...p, stars: s }))}
                            style={{ fontSize: 18, background: "none", border: "none", cursor: "pointer", filter: s <= editReviewForm.stars ? "none" : "grayscale(1) opacity(.3)" }}></button>
                        ))}
                      </div>
                      <textarea value={editReviewForm.content} onChange={e => setEditReviewForm(p => ({ ...p, content: e.target.value }))}
                        ref={autoGrowTextarea}
                        onInput={e => autoGrowTextarea(e.target)}
                        rows={3} style={{ padding: "7px 10px", border: "1px solid #D4C4A0", borderRadius: 5, fontSize: 13, resize: "none", overflow: "hidden" }} />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={saveEditReview} style={{ padding: "6px 16px", background: "#27ae60", color: "#fff", borderRadius: 5, fontSize: 12, border: "none" }}>Simpan</button>
                        <button onClick={() => setEditReviewId(null)} style={{ padding: "6px 14px", background: "#FAF7F0", color: "#5A6A6C", borderRadius: 5, fontSize: 12, border: "1px solid #D4C4A0" }}>Batal</button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: "#2E3D3F", lineHeight: 1.7, fontStyle: "italic", whiteSpace: "pre-line" }}>"{r.content}"</p>
                  )}
                  {r.tokenLabel && <div style={{ marginTop: 6, fontSize: 11, color: "#8B6914", fontWeight: 500 }}>{r.tokenLabel}</div>}
                </div>
              </div>
              {editReviewId !== r.id && (
                <div style={{ padding: "10px 20px", background: "#FDFAF4", borderTop: "1px solid #f0f4f8", display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {r.approved ? (
                    <button onClick={() => rejectReview(r.id)} style={{ padding: "5px 14px", background: "#fff8e1", color: "#f39c12", borderRadius: 5, fontSize: 12, border: "1px solid #f39c1240", fontWeight: 500 }}>Sembunyikan</button>
                  ) : (
                    <button onClick={() => approveReview(r.id)} style={{ padding: "5px 14px", background: "#e8f8ef", color: "#27ae60", borderRadius: 5, fontSize: 12, border: "1px solid #27ae6040", fontWeight: 600 }}>Setujui & Tayangkan</button>
                  )}
                  <button onClick={() => startEditReview(r)} style={{ padding: "5px 14px", background: "#F5EDD8", color: "#8B6914", borderRadius: 5, fontSize: 12, border: "none", fontWeight: 500 }}>Edit</button>
                  <button onClick={() => { if (window.confirm("Hapus ulasan ini?")) deleteReview(r.id); }} style={{ padding: "5px 14px", background: "#fee", color: "#e74c3c", borderRadius: 5, fontSize: 12, border: "none" }}>Hapus</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
}

/* ─────────────── WA ADMIN MANAGER ─────────────── */
function WaAdminManager({ admins = [], onSave, notify }) {
  const [list, setList] = useState(() => admins.map((a, i) => ({ ...a, id: a.id ?? i + 1 })));
  const [dirty, setDirty] = useState(false);

  function update(id, field, val) {
    setList(prev => prev.map(a => a.id === id ? { ...a, [field]: val } : a));
    setDirty(true);
  }
  function setPrimary(id) {
    setList(prev => prev.map(a => ({ ...a, primary: a.id === id })));
    setDirty(true);
  }
  function addAdmin() {
    const newId = Date.now();
    setList(prev => [...prev, { id: newId, name: "", jabatan: "", wa: "https://wa.me/62", primary: false }]);
    setDirty(true);
  }
  function removeAdmin(id) {
    setList(prev => prev.filter(a => a.id !== id));
    setDirty(true);
  }
  function handleSave() {
    const invalid = list.find(a => !a.name.trim() || !a.wa.trim());
    if (invalid) { notify("Nama dan nomor WA wajib diisi!"); return; }
    onSave(list);
    setDirty(false);
  }

  const cardStyle = { background: "#fff", borderRadius: 8, padding: "16px 18px", marginBottom: 10, boxShadow: "0 1px 4px rgba(0,0,0,.06)", border: "1px solid #eee", display: "flex", flexDirection: "column", gap: 10 };
  const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, boxSizing: "border-box" };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#5A6A6C", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4, display: "block" };

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: "18px 20px", marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase" }}>Admin WhatsApp</label>
        <button onClick={addAdmin} style={{ fontSize: 12, padding: "5px 12px", background: "#25d366", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>+ Tambah Admin</button>
      </div>

      {list.map((admin) => (
        <div key={admin.id} style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="radio" name="wa_primary" checked={!!admin.primary} onChange={() => setPrimary(admin.id)} title="Jadikan Admin Utama" style={{ accentColor: "#25d366", width: 16, height: 16 }} />
            <span style={{ fontSize: 11, color: "#888" }}>{admin.primary ? "Admin Utama (WA default)" : "Jadikan utama"}</span>
            <button onClick={() => removeAdmin(admin.id)} style={{ marginLeft: "auto", fontSize: 11, padding: "3px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 5, cursor: "pointer" }}>Hapus</button>
          </div>
          <div>
            <label style={labelStyle}>Nama Admin</label>
            <AutoGrowField style={inputStyle} value={admin.name} onChange={e => update(admin.id, "name", e.target.value)} placeholder="cth: Nama Admin" />
          </div>
          <div>
            <label style={labelStyle}>Jabatan</label>
            <AutoGrowField style={inputStyle} value={admin.jabatan || ""} onChange={e => update(admin.id, "jabatan", e.target.value)} placeholder="cth: Chief Executive Officer" />
          </div>
          <div>
            <label style={labelStyle}>Nomor WA Link (format: https://wa.me/628xxx)</label>
            <AutoGrowField style={inputStyle} value={admin.wa} onChange={e => update(admin.id, "wa", e.target.value)} placeholder="https://wa.me/628123456789" />
          </div>
        </div>
      ))}

      {list.length === 0 && <p style={{ fontSize: 13, color: "#aaa", textAlign: "center", padding: "12px 0" }}>Belum ada admin. Klik "+ Tambah Admin".</p>}

      {dirty && (
        <button onClick={handleSave} style={{ marginTop: 6, width: "100%", padding: "10px", background: "#2E3D3F", color: "#fff", border: "none", borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          Simpan Daftar Admin WA
        </button>
      )}
    </div>
  );
}

/* ─────────────── SOSMED MANAGER ─────────────── */
function SosmedManager({ content, onSave, notify }) {
  const [ig, setIg] = useState(content.igLink || "");
  const [fb, setFb] = useState(content.fbLink || "");
  const [dirty, setDirty] = useState(false);

  function handleSave() {
    onSave({ igLink: ig, fbLink: fb });
    setDirty(false);
    notify("Link sosial media disimpan!");
  }

  const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, boxSizing: "border-box" };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#5A6A6C", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4, display: "block" };

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: "18px 20px", marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 14 }}>Link Sosial Media</label>
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Instagram URL</label>
        <AutoGrowField style={inputStyle} value={ig} onChange={e => { setIg(e.target.value); setDirty(true); }} placeholder="https://instagram.com/username" />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Facebook URL</label>
        <AutoGrowField style={inputStyle} value={fb} onChange={e => { setFb(e.target.value); setDirty(true); }} placeholder="https://facebook.com/username" />
      </div>
      {dirty && (
        <button onClick={handleSave} style={{ width: "100%", padding: "10px", background: "#2E3D3F", color: "#fff", border: "none", borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          Simpan Link Sosmed
        </button>
      )}
    </div>
  );
}

/* ─────────────── NAV DROPDOWN: LAYANAN ─────────────── */

/* ═══════════════════════════════════════════════════════════════════
   PAKET GRID MANAGER — admin editor untuk paket magazine-grid
   (dipakai untuk "Landscape & Taman" dan "Rumah Subsidi")
   Bisa edit: icon, judul, deskripsi, harga, satuan, arah animasi slide,
   daftar "yang termasuk", dan foto slideshow (upload / paste URL).
═══════════════════════════════════════════════════════════════════ */
function PaketGridManager({ data, save, notify, storeKey, title, icon, accentColor = "#2E3D3F", defaultItems = [], showSlideDir = false, ctaHint = "" }) {
  const items = (data[storeKey] && data[storeKey].length) ? data[storeKey] : defaultItems;
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const { ordered: orderedItems, draggingIdx, onDragStart, onDragEnter, onDragOver, onDragEnd, moveUp, moveDown } =
    useDragReorder(items, async (next) => { await save({ ...data, [storeKey]: next }); notify("Urutan berhasil disimpan!"); });

  const blankItem = () => ({
    id: `paket-${Date.now()}`,
    icon: "",
    title: "",
    desc: "",
    startFrom: 0,
    satuan: "paket",
    tampilHarga: true,
    hidden: false,
    slideDir: "right",
    includes: [],
    slides: [],
  });

  const openNew = () => { setForm(blankItem()); setEditId("new"); };
  const openEdit = (it) => { setForm({ ...it, includes: [...(it.includes || [])], slides: [...(it.slides || [])] }); setEditId(it.id); };
  const cancelEdit = () => { setEditId(null); setForm({}); };

  const persist = (updatedList) => save({ ...data, [storeKey]: updatedList });

  const saveItem = () => {
    if (!form.title?.trim()) return notify("Judul paket wajib diisi.", "error");
    const idx = items.findIndex(x => x.id === form.id);
    const updated = idx >= 0 ? items.map((x, i) => i === idx ? form : x) : [...items, form];
    persist(updated);
    cancelEdit();
    notify("Paket berhasil disimpan!");
  };

  const deleteItem = (id) => {
    if (!window.confirm("Hapus paket ini? Tindakan ini tidak bisa dibatalkan.")) return;
    persist(items.filter(x => x.id !== id));
    notify("Paket dihapus.");
  };

  const toggleHidden = (it) => {
    const next = !it.hidden;
    persist(items.map(x => x.id === it.id ? { ...x, hidden: next } : x));
    notify(next ? "Paket disembunyikan dari halaman publik." : "Paket ditampilkan kembali di halaman publik.");
  };

  // -- Includes helpers --
  const addInclude = () => setForm(p => ({ ...p, includes: [...(p.includes || []), { icon: "", item: "" }] }));
  const updateInclude = (i, field, val) => setForm(p => ({ ...p, includes: p.includes.map((inc, idx) => idx === i ? { ...inc, [field]: val } : inc) }));
  const removeInclude = (i) => setForm(p => ({ ...p, includes: p.includes.filter((_, idx) => idx !== i) }));

  // -- Slides helpers --
  const addSlide = () => setForm(p => ({ ...p, slides: [...(p.slides || []), { img: "", tema: "", desc: "" }] }));
  const updateSlide = (i, field, val) => setForm(p => ({ ...p, slides: p.slides.map((s, idx) => idx === i ? { ...s, [field]: val } : s) }));
  const removeSlide = (i) => setForm(p => ({ ...p, slides: p.slides.filter((_, idx) => idx !== i) }));

  const fmt = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID") + ",-";
  const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 };
  const inputStyle = { width: "100%", padding: "9px 12px", border: "1.5px solid #D4C4A0", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#2E3D3F", display: "flex", alignItems: "center", gap: 8 }}>
          <span>{icon}</span>{title}
        </h1>
        {!editId && (
          <button onClick={openNew} style={{ padding: "10px 20px", background: `linear-gradient(130deg,${accentColor} 0%,#8B6914 100%)`, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            + Tambah Paket Baru
          </button>
        )}
      </div>
      {ctaHint && <p style={{ fontSize: 12.5, color: "#5A6A6C", marginBottom: 22, lineHeight: 1.6 }}>{ctaHint}</p>}

      {/* == FORM EDIT / TAMBAH == */}
      {editId && (
        <div className="pgm-form-card" style={{ background: "#fff", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,.08)", marginBottom: 28, borderTop: `4px solid ${accentColor}` }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#2E3D3F", marginBottom: 20 }}>
            {editId === "new" ? "Tambah Paket Baru" : "Edit Paket"}
          </h2>

          {/* Icon + Title */}
          <div className="pgm-row-icon-title">
            <div>
              <label style={labelStyle}>Ikon</label>
              <input value={form.icon || ""} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
                placeholder="" style={{ ...inputStyle, textAlign: "center", fontSize: 20 }} />
            </div>
            <div>
              <label style={labelStyle}>Judul Paket *</label>
              <AutoGrowField value={form.title || ""} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="contoh: Renovasi Cat & Dinding" style={inputStyle} />
            </div>
          </div>

          {/* Desc */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Deskripsi Singkat</label>
            <textarea value={form.desc || ""} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))}
              placeholder="Deskripsi singkat paket ini..." rows={3}
              ref={autoGrowTextarea}
              onInput={e => autoGrowTextarea(e.target)}
              style={{ ...inputStyle, resize: "none", overflow: "hidden", fontFamily: "inherit" }} />
          </div>

          {/* Harga + Satuan + slideDir */}
          <div className="pgm-row-fields">
            <div>
              <label style={labelStyle}>Harga Mulai Dari (Rp)</label>
              <input type="number" value={form.startFrom || 0} onChange={e => setForm(p => ({ ...p, startFrom: Number(e.target.value) }))}
                placeholder="3500000" style={inputStyle} />
              <div style={{ fontSize: 11, color: "#27ae60", marginTop: 4, fontWeight: 600 }}>Preview: {fmt(form.startFrom)}</div>
            </div>
            <div>
              <label style={labelStyle}>Satuan</label>
              <input value={form.satuan || ""} onChange={e => setForm(p => ({ ...p, satuan: e.target.value }))}
                placeholder="paket / m² / unit" style={inputStyle} />
            </div>
            {showSlideDir && (
              <div>
                <label style={labelStyle}>Arah Animasi Slide</label>
                <select value={form.slideDir || "right"} onChange={e => setForm(p => ({ ...p, slideDir: e.target.value }))} style={inputStyle}>
                  <option value="right">➡ Kanan (masuk dari kiri)</option>
                  <option value="up">⬆ Atas (masuk dari bawah)</option>
                  <option value="left">⬅ Kiri (masuk dari kanan)</option>
                  <option value="down">⬇ Bawah (masuk dari atas)</option>
                </select>
              </div>
            )}
          </div>

          {/* -- Toggle Tampilkan Harga -- */}
          <div className="pgm-toggle-row" style={{ background: "#FAF7F0", border: "1.5px solid #E8DCC8", borderRadius: 10, padding: "12px 16px", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#2E3D3F" }}>Tampilkan Harga</div>
              <div style={{ fontSize: 11.5, color: "#8B9A9C", marginTop: 2 }}>Nonaktifkan untuk sembunyikan harga — kartu akan menampilkan tombol Konsultasi Sekarang penuh sebagai gantinya.</div>
            </div>
            <button type="button" onClick={() => setForm(p => ({ ...p, tampilHarga: p.tampilHarga === false ? true : false }))}
              style={{ position: "relative", width: 46, height: 26, borderRadius: 20, border: "none", cursor: "pointer", flexShrink: 0, background: form.tampilHarga === false ? "#D5C9B0" : accentColor, transition: "background .2s" }}>
              <span style={{ position: "absolute", top: 3, left: form.tampilHarga === false ? 3 : 23, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.3)", transition: "left .2s" }} />
            </button>
          </div>

          {/* -- Toggle Tampil / Sembunyikan Paket di Halaman Publik -- */}
          <div className="pgm-toggle-row" style={{ background: "#FAF7F0", border: "1.5px solid #E8DCC8", borderRadius: 10, padding: "12px 16px", marginBottom: 22 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#2E3D3F" }}>Tampil di Halaman Publik</div>
              <div style={{ fontSize: 11.5, color: "#8B9A9C", marginTop: 2 }}>Nonaktifkan untuk menyembunyikan item ini dari halaman publik — datanya tetap tersimpan, tidak dihapus.</div>
            </div>
            <button type="button" onClick={() => setForm(p => ({ ...p, hidden: !p.hidden }))}
              style={{ position: "relative", width: 46, height: 26, borderRadius: 20, border: "none", cursor: "pointer", flexShrink: 0, background: form.hidden ? "#D5C9B0" : accentColor, transition: "background .2s" }}>
              <span style={{ position: "absolute", top: 3, left: form.hidden ? 3 : 23, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.3)", transition: "left .2s" }} />
            </button>
          </div>

          {/* -- Yang Termasuk -- */}
          <div style={{ marginBottom: 24, background: "#f4faf6", borderRadius: 10, padding: "16px 18px", border: "1.5px solid #bbf7d0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <label style={{ ...labelStyle, marginBottom: 0, color: "#166534" }}>Yang Termasuk dalam Paket</label>
              <button onClick={addInclude} style={{ padding: "5px 12px", background: "#27ae60", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+ Tambah Item</button>
            </div>
            {(form.includes || []).length === 0 && <p style={{ fontSize: 12, color: "#5A6A6C", margin: 0 }}>Belum ada item. Klik "+ Tambah Item".</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(form.includes || []).map((inc, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <input value={inc.icon} onChange={e => updateInclude(i, "icon", e.target.value)}
                    style={{ ...inputStyle, width: 52, textAlign: "center", flexShrink: 0 }} placeholder="" />
                  <AutoGrowField value={inc.item} onChange={e => updateInclude(i, "item", e.target.value)}
                    style={{ ...inputStyle, flex: 1 }} placeholder="Deskripsi item yang termasuk..." />
                  <button onClick={() => removeInclude(i)} style={{ flexShrink: 0, padding: "8px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 }}></button>
                </div>
              ))}
            </div>
          </div>

          {/* -- Slideshow Foto -- */}
          <div style={{ marginBottom: 24, background: "#FAF7F0", borderRadius: 10, padding: "16px 18px", border: "1.5px solid #E8DCC8" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <label style={{ ...labelStyle, marginBottom: 0, color: "#8B6914" }}>Foto Slideshow</label>
              <button onClick={addSlide} style={{ padding: "5px 12px", background: "#8B6914", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+ Tambah Foto</button>
            </div>
            {(form.slides || []).length === 0 && <p style={{ fontSize: 12, color: "#5A6A6C", margin: 0 }}>Belum ada foto. Klik "+ Tambah Foto" (minimal 4 foto direkomendasikan).</p>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 14 }}>
              {(form.slides || []).map((s, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 10, padding: 14, border: "1px solid #E8DCC8", position: "relative" }}>
                  <button onClick={() => removeSlide(i)} style={{ position: "absolute", top: 8, right: 8, background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 5, width: 22, height: 22, fontSize: 11, cursor: "pointer", zIndex: 2 }}>✕</button>
                  <div style={{ height: 110, borderRadius: 6, overflow: "hidden", background: "#FAF7F0", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {s.img ? <img decoding="async" loading="lazy" src={cld(s.img)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={onImgError} /> : <span style={{ fontSize: 24 }}></span>}
                  </div>
                  <UploadButton label="Upload Foto"
                    onDone={urls => { updateSlide(i, "img", urls[0]); notify("Foto berhasil diupload!"); }}
                    onError={msg => notify(msg, "error")}
                    style={{ fontSize: 11, padding: "7px 10px" }} />
                  <AutoGrowField value={s.img || ""} onChange={e => updateSlide(i, "img", e.target.value)}
                    placeholder="atau paste URL foto..." style={{ ...inputStyle, fontSize: 11, marginTop: 6 }} />
                  <AutoGrowField value={s.tema || ""} onChange={e => updateSlide(i, "tema", e.target.value)}
                    placeholder="Nama tema foto" style={{ ...inputStyle, fontSize: 12, marginTop: 6 }} />
                  <textarea value={s.desc || ""} onChange={e => updateSlide(i, "desc", e.target.value)}
                    placeholder="Keterangan singkat foto..." rows={2}
                    ref={autoGrowTextarea}
                    onFocus={e => autoGrowTextarea(e.target)}
                    onInput={e => autoGrowTextarea(e.target)}
                    onBlur={e => { e.target.style.height = ""; }}
                    style={{ ...inputStyle, fontSize: 12, marginTop: 6, resize: "none", overflow: "hidden", fontFamily: "inherit" }} />
                </div>
              ))}
            </div>
          </div>

          <div className="pgm-actions">
            <button onClick={saveItem} style={{ padding: "10px 22px", background: `linear-gradient(130deg,${accentColor} 0%,#8B6914 100%)`, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Simpan Paket</button>
            <button onClick={cancelEdit} style={{ padding: "10px 18px", background: "#FAF7F0", color: "#5A6A6C", border: "1px solid #D4C4A0", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>Batal</button>
          </div>
        </div>
      )}

      {/* == LIST PAKET == */}
      {!editId && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {orderedItems.map((it, idx) => (
            <div key={it.id}
              draggable
              onDragStart={onDragStart(idx)}
              onDragEnter={onDragEnter(idx)}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
              style={{ background: "#fff", borderRadius: 12, padding: "18px", boxShadow: "0 2px 8px rgba(0,0,0,.06)", display: "flex", flexDirection: "column", gap: 10, opacity: draggingIdx === idx ? 0.4 : it.hidden ? 0.6 : 1, border: it.hidden ? "1.5px dashed #D5C9B0" : "1.5px solid transparent" }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: -4 }}>
                <OrderControls idx={idx} count={orderedItems.length} onUp={moveUp} onDown={moveDown} />
              </div>
              <div style={{ height: 110, borderRadius: 8, overflow: "hidden", background: "#FAF7F0", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                {it.slides?.[0]?.img ? <img decoding="async" loading="lazy" src={cld(it.slides[0].img)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={onImgError} /> : <span style={{ fontSize: 30 }}>{it.icon}</span>}
                {it.hidden && (
                  <span style={{ position: "absolute", top: 8, left: 8, background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, letterSpacing: ".04em", textTransform: "uppercase" }}>Disembunyikan</span>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#2E3D3F", fontSize: 14 }}>{it.icon} {it.title}</div>
                <div style={{ fontSize: 12, color: "#27ae60", fontWeight: 700, marginTop: 3 }}>{fmt(it.startFrom)} / {it.satuan}</div>
                <div style={{ fontSize: 11, color: "#5A6A6C", marginTop: 4 }}>{(it.slides || []).length} foto · {(it.includes || []).length} item termasuk</div>
              </div>
              {/* Toggle Tampilkan / Sembunyikan di halaman publik */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "#FAF7F0", border: "1px solid #E8DCC8", borderRadius: 8, padding: "8px 12px" }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: it.hidden ? "#dc2626" : "#27ae60" }}>{it.hidden ? "Tersembunyi" : "Tampil di publik"}</span>
                <button type="button" onClick={() => toggleHidden(it)} title={it.hidden ? "Tampilkan di halaman publik" : "Sembunyikan dari halaman publik"}
                  style={{ position: "relative", width: 40, height: 22, borderRadius: 20, border: "none", cursor: "pointer", flexShrink: 0, background: it.hidden ? "#D5C9B0" : accentColor, transition: "background .2s" }}>
                  <span style={{ position: "absolute", top: 3, left: it.hidden ? 3 : 21, width: 16, height: 16, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.3)", transition: "left .2s" }} />
                </button>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                <button onClick={() => openEdit(it)} style={{ flex: 1, padding: "7px 0", background: "#FAF7F0", color: "#8B6914", border: "1px solid #E8DCC8", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                <button onClick={() => deleteItem(it.id)} style={{ flex: 1, padding: "7px 0", background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Hapus</button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0", color: "#5A6A6C" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
              <p>Belum ada paket. Klik "+ Tambah Paket Baru" untuk mulai.</p>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Editor 1 kartu Layanan Section Home (foto + judul + deskripsi) ── */
function HomeServiceCardEditor({ index, svc, data, save, notify }) {
  const [title, setTitle] = useState(svc.title || "");
  const [desc, setDesc]   = useState(svc.desc || "");
  const [saving, setSaving] = useState(false);

  const getList = () => (data.homeServices && data.homeServices.length > 0)
    ? data.homeServices.map(x => ({ ...x }))
    : HOME_SERVICES_DEFAULT.map(x => ({ ...x }));

  const patchAndSave = async (patch) => {
    const list = getList();
    list[index] = { ...list[index], ...patch };
    await save({ ...data, homeServices: list });
  };

  const doSaveText = async () => {
    setSaving(true);
    try { await patchAndSave({ title, desc }); notify("Layanan diperbarui!"); }
    catch { notify("Gagal menyimpan.", "error"); }
    setSaving(false);
  };

  const doRemove = async () => {
    const list = getList().filter((_, i) => i !== index);
    await save({ ...data, homeServices: list });
    notify("Layanan dihapus.");
  };

  return (
    <div style={{ background: "#FAF7F0", borderRadius: 8, padding: 12, border: "1px solid #E8DCC8" }}>
      {svc.img ? (
        <img decoding="async" loading="lazy" src={cld(svc.img)} alt={svc.title} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 6, marginBottom: 8, border: "1px solid #D4C4A0" }}
          onError={onImgError} />
      ) : (
        <div style={{ width: "100%", height: 120, background: "#E8DCC8", borderRadius: 6, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#5A6A6C", fontSize: 11 }}>Belum ada foto</div>
      )}
      <UploadButton label="Ganti Foto"
        style={{ fontSize: 11, padding: "6px 10px", marginBottom: 8, width: "100%", justifyContent: "center" }}
        onDone={urls => { patchAndSave({ img: urls[0] }); notify("Foto layanan diperbarui!"); }}
        onError={() => notify("Gagal upload.", "error")} />
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul layanan"
        style={{ width: "100%", padding: "7px 9px", border: "1px solid #D4C4A0", borderRadius: 5, fontSize: 12, marginBottom: 6, boxSizing: "border-box", fontWeight: 700 }} />
      <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Deskripsi singkat" rows={2}
        ref={autoGrowTextarea}
        onInput={e => autoGrowTextarea(e.target)}
        style={{ width: "100%", padding: "7px 9px", border: "1px solid #D4C4A0", borderRadius: 5, fontSize: 11, marginBottom: 8, boxSizing: "border-box", resize: "none", overflow: "hidden", fontFamily: "inherit" }} />
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={doSaveText} disabled={saving}
          style={{ flex: 1, padding: "6px", background: "#3498db", color: "#fff", border: "none", borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
          {saving ? "..." : "Simpan Teks"}
        </button>
        <button onClick={doRemove}
          style={{ padding: "6px 10px", background: "none", color: "#e74c3c", border: "1px solid #e74c3c", borderRadius: 5, fontSize: 11, cursor: "pointer" }}></button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TEMA RUMAH ADMIN — proper components (no IIFE, Rules of Hooks safe)
   ══════════════════════════════════════════════════════════════ */

/* ── 1. Per-field row di Hero tab ── */
function TemaHeroFieldRow({ fieldKey, label, placeholder, data, save, notify }) {
  const [val, setVal] = useState(data[fieldKey] || "");
  const [saving, setSaving] = useState(false);
  const doSave = async () => {
    setSaving(true);
    try { await save({ ...data, [fieldKey]: val }); notify("Tersimpan!"); }
    catch { notify("Gagal menyimpan."); }
    setSaving(false);
  };
  return (
    <div style={{ background:"#fff", border:"1.5px solid #E8DCC8", borderRadius:10, padding:"16px 18px", marginBottom:12 }}>
      <div style={{ fontSize:12, fontWeight:700, color:"#5A6A6C", marginBottom:6 }}>{label}</div>
      <div style={{ display:"flex", gap:10 }}>
        <input type="text" value={val} placeholder={placeholder} onChange={e => setVal(e.target.value)}
          style={{ flex:1, padding:"9px 12px", border:"1.5px solid #D5C9B0", borderRadius:8, fontSize:14, boxSizing:"border-box" }} />
        <button onClick={doSave} disabled={saving}
          style={{ padding:"9px 18px", background:"#C9AA71", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
          {saving ? "..." : "Simpan"}
        </button>
      </div>
      {data[fieldKey] && <div style={{ fontSize:11, color:"#8B9A9C", marginTop:4 }}>Tersimpan: <em>{data[fieldKey]}</em></div>}
    </div>
  );
}

/* ── 2. Upload foto hero ── */
function TemaHeroImgRow({ data, save, notify, uploadToCloudinary }) {
  const [url, setUrl] = useState(data.temaHeroImg || "");
  const [upl, setUpl] = useState(false);
  const [sav, setSav] = useState(false);
  const doUpload = async (f) => {
    if (!f) return; setUpl(true);
    try { const u = await uploadToCloudinary(f); setUrl(u); notify("Foto diupload!"); }
    catch { notify("Gagal upload."); }
    setUpl(false);
  };
  const doSave = async () => {
    setSav(true);
    try { await save({ ...data, temaHeroImg: url }); notify("Foto hero tersimpan!"); }
    catch { notify("Gagal simpan."); }
    setSav(false);
  };
  return (
    <div style={{ marginTop:24, background:"#fff", border:"1.5px solid #E8DCC8", borderRadius:10, padding:"16px 18px" }}>
      <div style={{ fontSize:13, fontWeight:700, color:"#5A6A6C", marginBottom:8 }}>Foto Background Hero Tema Rumah</div>
      {url && <img decoding="async" loading="lazy" src={cld(url)} alt="" style={{ width:"100%", maxHeight:160, objectFit:"cover", borderRadius:8, marginBottom:10 }} />}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <label style={{ padding:"9px 18px", background:"#3498db", color:"#fff", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer" }}>
          {upl ? "Upload..." : "Upload Foto"}
          <input type="file" accept="image/*" style={{ display:"none" }} onChange={e => doUpload(e.target.files[0])} />
        </label>
        <button onClick={doSave} disabled={sav}
          style={{ padding:"9px 18px", background:"#C9AA71", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer" }}>
          {sav ? "..." : "Simpan URL"}
        </button>
      </div>
      <input type="text" value={url} onChange={e => setUrl(e.target.value)}
        placeholder="https://... atau paste URL foto"
        style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #D5C9B0", borderRadius:8, fontSize:13, marginTop:8, boxSizing:"border-box" }} />
    </div>
  );
}

/* ── 3. Form edit satu tema ── */
function TemaEditForm({ temaOrig, editIdx, activeTemas, data, save, notify, onBack, uploadToCloudinary }) {
  const [draft, setDraft] = useState(() => {
    const initial = JSON.parse(JSON.stringify(temaOrig));
    /* Tema baru (slug masih kosong saat dibuat) → langsung isi slug otomatis dari nama,
       supaya admin tidak perlu mengetik slug sendiri sama sekali. */
    if (!initial.slug) {
      const base = makeSlug(initial.nama || "tema-baru") || "tema-baru";
      let candidate = base, i = 2;
      while (activeTemas.some(t => t.slug === candidate)) { candidate = `${base}-${i}`; i++; }
      initial.slug = candidate;
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  /* ── Auto-slug: tema baru (slug masih kosong) → slug ikut mengikuti "Nama Tema" otomatis,
     berhenti mengikuti begitu admin mengetik manual di kolom Slug. Tema lama (sudah punya
     slug) tidak pernah disentuh otomatis, supaya link yang sudah di-share tidak berubah. */
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!temaOrig.slug);
  /* Pastikan slug otomatis tidak bentrok dengan tema lain yang sudah ada */
  const uniqueSlug = (base) => {
    if (!base) return base;
    let candidate = base;
    let i = 2;
    while (activeTemas.some((t, idx) => idx !== editIdx && t.slug === candidate)) {
      candidate = `${base}-${i}`;
      i++;
    }
    return candidate;
  };
  const handleNamaChange = (val) => {
    setDraft(prev => {
      const next = { ...prev, nama: val };
      if (!slugManuallyEdited) next.slug = uniqueSlug(makeSlug(val));
      return next;
    });
  };
  const handleSlugChange = (val) => {
    setSlugManuallyEdited(true);
    setDraft(prev => ({ ...prev, slug: val }));
  };

  /* ── Multi-foto slideshow state ── */
  const initImgs = () => {
    const slug = temaOrig.slug;
    const fromOverride = data?.temaPhotosOverride?.[slug];
    if (fromOverride && fromOverride.length > 0) return fromOverride;
    if (temaOrig.imgs && temaOrig.imgs.length > 0) return temaOrig.imgs;
    if (temaOrig.img) return [{ img: temaOrig.img, label: temaOrig.nama || "" }];
    return [];
  };
  const [slideshowImgs, setSlideshowImgs] = useState(initImgs);
  const [slideshowPrev, setSlideshowPrev] = useState(0);
  /* Lacak URL foto yang gagal dimuat (rusak/link putus/dihapus) — dipakai untuk
     tampilkan peringatan jelas ke admin, bukan cuma kotak kosong membingungkan. */
  const [brokenImgUrls, setBrokenImgUrls] = useState(() => new Set());
  const markImgBroken = (url) => setBrokenImgUrls(prev => { const next = new Set(prev); next.add(url); return next; });

  /* ── Multi-lantai foto denah state ── */
  const initLantai = () => {
    const existing = temaOrig?.detail?.denah?.lantai;
    if (existing && existing.length > 0) return existing;
    return [{ label: "Lantai 1", imgs: [] }];
  };
  const [denahLantai, setDenahLantai] = useState(initLantai);
  const [uploadingDenah, setUploadingDenah] = useState(null); // index lantai yg sedang upload

  const addLantai = () => {
    setDenahLantai(prev => [...prev, { label: `Lantai ${prev.length + 1}`, imgs: [] }]);
  };
  const removeLantai = (li) => {
    if (!window.confirm("Hapus lantai ini beserta semua fotonya?")) return;
    setDenahLantai(prev => prev.filter((_, j) => j !== li));
  };
  const updateLantaiLabel = (li, lbl) => {
    setDenahLantai(prev => prev.map((l, j) => j === li ? { ...l, label: lbl } : l));
  };
  const handleDenahUpload = async (li, f) => {
    if (!f) return;
    setUploadingDenah(li);
    try {
      const u = await uploadToCloudinary(f);
      setDenahLantai(prev => prev.map((l, j) => j === li ? { ...l, imgs: [...l.imgs, u] } : l));
      notify("Foto denah ditambahkan!");
    } catch { notify("Gagal upload foto denah."); }
    setUploadingDenah(null);
  };
  const removeDenahImg = (li, ii) => {
    setDenahLantai(prev => prev.map((l, j) => j === li ? { ...l, imgs: l.imgs.filter((_, k) => k !== ii) } : l));
  };

  /* Upload foto denah via paste URL (per lantai) */
  const [pasteUrlDenah, setPasteUrlDenah] = useState({}); // { [lantaiIndex]: "url string" }
  const addDenahByUrl = (li) => {
    const url = (pasteUrlDenah[li] || "").trim();
    if (!url) return;
    setDenahLantai(prev => prev.map((l, j) => j === li ? { ...l, imgs: [...l.imgs, url] } : l));
    setPasteUrlDenah(prev => ({ ...prev, [li]: "" }));
    notify("Foto denah ditambahkan dari URL!");
  };

  const upd = (path, val) => {
    setDraft(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
      cur[keys[keys.length - 1]] = val;
      return next;
    });
  };

  const handleSlideUpload = async (f) => {
    if (!f) return;
    if (slideshowImgs.length >= 8) { notify("Maksimal 8 foto per tema."); return; }
    setUploadingImg(true);
    try {
      const u = await uploadToCloudinary(f);
      setSlideshowImgs(prev => [...prev, { img: u, label: "" }]); // label dikosongkan, jangan pakai nama file mentah ke publik
      notify("Foto ditambahkan!");
    } catch { notify("Gagal upload foto."); }
    setUploadingImg(false);
  };

  const removeSlide = (i) => {
    setSlideshowImgs(prev => {
      const next = prev.filter((_, j) => j !== i);
      setSlideshowPrev(p => Math.min(p, Math.max(0, next.length - 1)));
      return next;
    });
  };

  const updateSlideLabel = (i, lbl) =>
    setSlideshowImgs(prev => prev.map((ph, j) => j === i ? { ...ph, label: lbl } : ph));

  const moveSlide = (i, dir) => {
    setSlideshowImgs(prev => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  // Upload foto via URL paste
  const [pasteUrl, setPasteUrl] = useState("");
  const addByUrl = () => {
    if (!pasteUrl.trim()) return;
    if (slideshowImgs.length >= 8) { notify("Maksimal 8 foto."); return; }
    setSlideshowImgs(prev => [...prev, { img: pasteUrl.trim(), label: "" }]);
    setPasteUrl("");
    notify("Foto ditambahkan dari URL!");
  };

  const handleImgUpload = async (f) => {
    if (!f) return;
    setUploadingImg(true);
    try { upd("img", await uploadToCloudinary(f)); notify("Foto diupload!"); }
    catch { notify("Gagal upload foto."); }
    setUploadingImg(false);
  };

  const saveTema = async () => {
    if (!draft.nama?.trim()) { notify("Nama tema wajib diisi."); return; }
    if (!draft.slug?.trim()) { notify("Slug (URL key) wajib diisi."); return; }
    const slugClash = activeTemas.some((t, i) => i !== editIdx && t.slug === draft.slug.trim());
    if (slugClash) { notify("Slug sudah dipakai tema lain, gunakan slug unik."); return; }
    setSaving(true);
    try {
      /* Buang slot foto yang URL-nya kosong/blank sebelum disimpan — slot kosong
         inilah yang bikin slide pertama tampil blank permanen di Home walau
         foto lain sudah diganti/digeser (slot kosongnya sendiri tidak pernah terhapus). */
      const cleanImgs = (slideshowImgs || []).filter(p => p && p.img && p.img.trim());
      /* Simpan imgs[] dan img (foto pertama sebagai fallback) ke dalam draft */
      const imgFirst = cleanImgs[0]?.img || draft.img || "";
      const finalDraft = {
        ...draft, imgs: cleanImgs, img: imgFirst,
        detail: { ...draft.detail, denah: { ...draft.detail.denah, lantai: denahLantai } },
      };
      const nextTemas = activeTemas.map((t, i) => i === editIdx ? finalDraft : t);
      /* Juga update temaPhotosOverride agar slideshow kartu ikut berubah */
      const nextOverride = { ...(data.temaPhotosOverride || {}), [draft.slug]: cleanImgs };
      await save({ ...data, temaData: nextTemas, temaPhotosOverride: nextOverride });
      notify("Tema berhasil disimpan!");
      onBack();
    } catch (err) {
      notify("Gagal menyimpan: " + (err?.message || "Periksa koneksi internet Anda."));
    } finally {
      setSaving(false);
    }
  };

  const inp = (label, path, multiline = false, placeholder = "") => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</div>
      {multiline
        ? <textarea value={path.split(".").reduce((o, k) => o?.[k], draft) || ""} onChange={e => upd(path, e.target.value)} placeholder={placeholder} rows={3}
            ref={autoGrowTextarea}
            onFocus={e => autoGrowTextarea(e.target)}
            onInput={e => autoGrowTextarea(e.target)}
            onBlur={e => { e.target.style.height = ""; }}
            style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", resize: "none", overflow: "hidden", fontFamily: "inherit" }} />
        : <AutoGrowField value={path.split(".").reduce((o, k) => o?.[k], draft) || ""} onChange={e => upd(path, e.target.value)} placeholder={placeholder}
            style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
      }
    </div>
  );

  const SS = { background: "#fff", border: "1.5px solid #E8DCC8", borderRadius: 12, padding: "18px 20px", marginBottom: 16 };
  const ST = (icon, title) => (
    <div style={{ fontSize: 14, fontWeight: 800, color: "#2E3D3F", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
      <span>{icon}</span> {title}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <button onClick={onBack}
          style={{ padding: "8px 16px", background: "#F5EDD8", color: "#5A6A6C", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          ← Kembali
        </button>
        <div style={{ fontWeight: 800, fontSize: 16, color: "#2E3D3F" }}>Edit: {draft.no} · {draft.nama}</div>
        <button onClick={saveTema} disabled={saving}
          style={{ padding: "8px 20px", background: "#C9AA71", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          {saving ? "Menyimpan..." : "Simpan Tema"}
        </button>
      </div>

      {/* Identitas */}
      <div style={SS}>
        {ST("", "Identitas Tema")}
        <div className="adm-grid-2">
          <div>{inp("No. Urut", "no", false, "01")}</div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".04em" }}>
              Slug (URL key) {!slugManuallyEdited && <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#A89070" }}>— otomatis dari nama</span>}
            </div>
            <input type="text" value={draft.slug || ""} onChange={e => handleSlugChange(e.target.value)} placeholder="modern-minimalis"
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".04em" }}>Nama Tema</div>
          <input type="text" value={draft.nama || ""} onChange={e => handleNamaChange(e.target.value)} placeholder="Modern Minimalis"
            style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
        </div>
        {inp("Tagline (1 kalimat singkat)", "tagline", false, "Desain simpel, elegan...")}
        {inp("Deskripsi panjang (hero detail)", "deskripsi", true)}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".04em" }}>Warna Aksen (hex)</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input type="color" value={draft.warna || "#C9AA71"} onChange={e => upd("warna", e.target.value)}
              style={{ width: 40, height: 36, border: "1.5px solid #D5C9B0", borderRadius: 6, cursor: "pointer", padding: 2 }} />
            <input type="text" value={draft.warna || ""} onChange={e => upd("warna", e.target.value)}
              style={{ flex: 1, padding: "9px 12px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 13 }} />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>
            Foto Slideshow ({slideshowImgs.length}/8)
          </div>

          {/* Preview slideshow */}
          {slideshowImgs.length > 0 && (
            <div style={{ position: "relative", width: "100%", height: 160, borderRadius: 10, overflow: "hidden", marginBottom: 10, background: "#E8DCC8" }}>
              {slideshowImgs[slideshowPrev]?.img && !brokenImgUrls.has(slideshowImgs[slideshowPrev].img) ? (
                <img decoding="async" loading="lazy"
                  key={slideshowPrev}
                  src={cld(slideshowImgs[slideshowPrev]?.img)}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  onError={() => markImgBroken(slideshowImgs[slideshowPrev].img)}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, background: "#FDF3F0" }}>
                  <span style={{ fontSize: 26 }}></span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>Foto ini rusak / link putus</span>
                  <span style={{ fontSize: 10.5, color: "#A89070" }}>Hapus (✕) lalu upload ulang fotonya</span>
                </div>
              )}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.45) 0%, transparent 60%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 8, left: 10, fontSize: 11, color: "#fff", fontWeight: 700, textShadow: "0 1px 4px rgba(0,0,0,.7)" }}>
                {slideshowImgs[slideshowPrev]?.label || `Foto ${slideshowPrev + 1}`}
              </div>
              <div style={{ position: "absolute", top: 8, right: 10, background: "rgba(0,0,0,.45)", color: "#C9AA71", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 12 }}>
                {slideshowPrev + 1}/{slideshowImgs.length}
              </div>
              {slideshowImgs.length > 1 && (
                <>
                  <button onClick={() => setSlideshowPrev(p => (p - 1 + slideshowImgs.length) % slideshowImgs.length)}
                    style={{ position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.4)", border: "none", color: "#fff", borderRadius: "50%", width: 26, height: 26, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>◀</button>
                  <button onClick={() => setSlideshowPrev(p => (p + 1) % slideshowImgs.length)}
                    style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.4)", border: "none", color: "#fff", borderRadius: "50%", width: 26, height: 26, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>▶</button>
                </>
              )}
            </div>
          )}

          {/* Thumbnail grid */}
          {slideshowImgs.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(100px,1fr))", gap: 8, marginBottom: 10 }}>
              {slideshowImgs.map((ph, i) => (
                <div key={i} style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: slideshowPrev === i ? "2.5px solid #C9AA71" : "1.5px solid #E8DCC8", cursor: "pointer" }}
                  onClick={() => setSlideshowPrev(i)}>
                  {ph.img && !brokenImgUrls.has(ph.img) ? (
                    <img decoding="async" loading="lazy" src={cld(ph.img)} alt={ph.label} style={{ width: "100%", height: 70, objectFit: "cover", display: "block" }} onError={() => markImgBroken(ph.img)} />
                  ) : (
                    <div style={{ width: "100%", height: 70, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, background: "#FDF3F0" }}>
                      <span style={{ fontSize: 16 }}></span>
                      <span style={{ fontSize: 8.5, fontWeight: 700, color: "#dc2626" }}>Foto rusak</span>
                    </div>
                  )}
                  <div style={{ padding: "4px 6px 3px" }}>
                    <AutoGrowField value={ph.label || ""} onClick={e => e.stopPropagation()} onChange={e => updateSlideLabel(i, e.target.value)}
                      placeholder={`Foto ${i + 1}`}
                      style={{ width: "100%", fontSize: 10, padding: "2px 5px", border: "1px solid #D5C9B0", borderRadius: 4, boxSizing: "border-box" }} />
                  </div>
                  {/* Tombol urutan & hapus */}
                  <div style={{ display: "flex", justifyContent: "center", gap: 3, padding: "0 4px 4px" }}>
                    <button onClick={e => { e.stopPropagation(); moveSlide(i, -1); }}
                      style={{ flex: 1, fontSize: 10, background: "#F5EDD8", border: "none", borderRadius: 4, cursor: "pointer", padding: "2px 0", color: "#5A6A6C", fontWeight: 700 }}>←</button>
                    <button onClick={e => { e.stopPropagation(); moveSlide(i, 1); }}
                      style={{ flex: 1, fontSize: 10, background: "#F5EDD8", border: "none", borderRadius: 4, cursor: "pointer", padding: "2px 0", color: "#5A6A6C", fontWeight: 700 }}>→</button>
                    <button onClick={e => { e.stopPropagation(); removeSlide(i); }}
                      style={{ flex: 1, fontSize: 10, background: "#fee2e2", border: "none", borderRadius: 4, cursor: "pointer", padding: "2px 0", color: "#dc2626", fontWeight: 700 }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {slideshowImgs.length === 0 && (
            <div style={{ textAlign: "center", padding: "20px", border: "1.5px dashed #D5C9B0", borderRadius: 8, color: "#A89070", fontSize: 13, marginBottom: 10 }}>
              Belum ada foto. Upload foto atau paste URL di bawah.
            </div>
          )}

          {/* Tombol upload */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <label style={{ padding: "9px 16px", background: slideshowImgs.length >= 8 ? "#ccc" : "#3498db", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: slideshowImgs.length >= 8 ? "default" : "pointer" }}>
              {uploadingImg ? "Mengupload..." : "Upload Foto"}
              <input type="file" accept="image/*" style={{ display: "none" }} disabled={uploadingImg || slideshowImgs.length >= 8} onChange={e => handleSlideUpload(e.target.files?.[0])} />
            </label>
          </div>

          {/* Paste URL */}
          <div style={{ display: "flex", gap: 8 }}>
            <input type="text" value={pasteUrl} onChange={e => setPasteUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addByUrl()}
              placeholder="https://... paste URL foto lalu tekan Enter atau Tambah"
              style={{ flex: 1, padding: "9px 12px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 12, boxSizing: "border-box" }} />
            <button onClick={addByUrl} disabled={!pasteUrl.trim() || slideshowImgs.length >= 8}
              style={{ padding: "9px 14px", background: "#C9AA71", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
              + Tambah
            </button>
          </div>
          <div style={{ fontSize: 11, color: "#8B9A9C", marginTop: 6 }}>
            {slideshowImgs.length}/8 foto · Foto pertama jadi thumbnail kartu. Klik thumbnail untuk preview. ← → untuk urutan.
          </div>
        </div>

        {/* ── Foto Denah per Lantai ── */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: ".04em", display: "flex", alignItems: "center", gap: 6 }}>
            Foto Denah per Lantai
            <span style={{ fontWeight: 400, fontSize: 10, color: "#A89070", textTransform: "none", letterSpacing: 0 }}>— tampil di halaman publik</span>
          </div>

          {denahLantai.map((lantai, li) => (
            <div key={li} style={{ background: "#FAF7F0", border: "1.5px solid #E8DCC8", borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <AutoGrowField value={lantai.label} onChange={e => updateLantaiLabel(li, e.target.value)}
                  placeholder="Lantai 1" style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 13, fontWeight: 700 }} />
                {denahLantai.length > 1 && (
                  <button onClick={() => removeLantai(li)}
                    style={{ padding: "7px 11px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>Hapus</button>
                )}
              </div>

              {lantai.imgs.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(90px,1fr))", gap: 8, marginBottom: 10 }}>
                  {lantai.imgs.map((img, ii) => (
                    <div key={ii} style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: "1.5px solid #E8DCC8" }}>
                      <img decoding="async" loading="lazy" src={cld(img)} alt={`${lantai.label} ${ii + 1}`} style={{ width: "100%", height: 70, objectFit: "cover", display: "block" }} onError={onImgError} />
                      <button onClick={() => removeDenahImg(li, ii)}
                        style={{ position: "absolute", top: 3, right: 3, width: 20, height: 20, background: "rgba(220,38,38,.85)", color: "#fff", border: "none", borderRadius: "50%", cursor: "pointer", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              {lantai.imgs.length === 0 && (
                <div style={{ textAlign: "center", padding: "12px", border: "1.5px dashed #D5C9B0", borderRadius: 8, color: "#A89070", fontSize: 12, marginBottom: 10 }}>
                  Belum ada foto denah untuk {lantai.label || "lantai ini"}.
                </div>
              )}

              <label style={{ display: "inline-block", padding: "8px 14px", background: uploadingDenah === li ? "#ccc" : "#3498db", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: uploadingDenah === li ? "default" : "pointer", marginBottom: 8 }}>
                {uploadingDenah === li ? "Mengupload..." : "Upload Foto Denah"}
                <input type="file" accept="image/*" style={{ display: "none" }} disabled={uploadingDenah === li} onChange={e => handleDenahUpload(li, e.target.files?.[0])} />
              </label>

              {/* Paste URL foto denah */}
              <div style={{ display: "flex", gap: 8 }}>
                <input type="text" value={pasteUrlDenah[li] || ""} onChange={e => setPasteUrlDenah(prev => ({ ...prev, [li]: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && addDenahByUrl(li)}
                  placeholder="https://... paste URL foto denah lalu tekan Enter atau Tambah"
                  style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 12, boxSizing: "border-box" }} />
                <button onClick={() => addDenahByUrl(li)} disabled={!(pasteUrlDenah[li] || "").trim()}
                  style={{ padding: "8px 14px", background: "#C9AA71", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                  + Tambah
                </button>
              </div>
            </div>
          ))}

          <button onClick={addLantai}
            style={{ padding: "7px 16px", background: "#F5EDD8", color: "#5A6A6C", border: "1.5px dashed #D5C9B0", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 6 }}>
            + Tambah Lantai
          </button>
          <div style={{ fontSize: 11, color: "#8B9A9C", marginTop: 4 }}>
            Bisa 1 lantai, 2 lantai, atau lebih. Foto ini tampil di section "Denah Ruang" halaman publik.
          </div>
        </div>
      </div>

      {/* Fitur */}
      <div style={SS}>
        {ST("", "Fitur (badge kartu)")}
        {(draft.fitur || []).map((f, fi) => (
          <div key={fi} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <input type="text" value={f.icon || ""} onChange={e => { const a = [...draft.fitur]; a[fi] = { ...a[fi], icon: e.target.value }; upd("fitur", a); }}
              placeholder="" style={{ width: 50, padding: "8px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 16, textAlign: "center" }} />
            <AutoGrowField value={f.label || ""} onChange={e => { const a = [...draft.fitur]; a[fi] = { ...a[fi], label: e.target.value }; upd("fitur", a); }}
              placeholder="Label fitur" style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 13 }} />
            <button onClick={() => { const a = draft.fitur.filter((_, j) => j !== fi); upd("fitur", a); }}
              style={{ padding: "8px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>✕</button>
          </div>
        ))}
        <button onClick={() => upd("fitur", [...(draft.fitur || []), { icon: "", label: "" }])}
          style={{ padding: "7px 16px", background: "#F5EDD8", color: "#5A6A6C", border: "1.5px dashed #D5C9B0", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Tambah Fitur</button>
      </div>

      {/* Eksterior */}
      <div style={SS}>
        {ST("", "Eksterior")}
        {inp("Deskripsi eksterior", "detail.exterior.desc", true)}
        <div style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".04em" }}>Poin Eksterior</div>
        {(draft.detail?.exterior?.poin || []).map((p, pi) => (
          <div key={pi} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <AutoGrowField value={p} onChange={e => { const a = [...draft.detail.exterior.poin]; a[pi] = e.target.value; upd("detail.exterior.poin", a); }}
              style={{ flex: 1, padding: "7px 12px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 13 }} />
            <button onClick={() => upd("detail.exterior.poin", draft.detail.exterior.poin.filter((_, j) => j !== pi))}
              style={{ padding: "7px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>✕</button>
          </div>
        ))}
        <button onClick={() => upd("detail.exterior.poin", [...(draft.detail?.exterior?.poin || []), ""])}
          style={{ padding: "6px 14px", background: "#F5EDD8", border: "1.5px dashed #D5C9B0", color: "#5A6A6C", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Poin</button>
      </div>

      {/* Video Tur Rumah — YouTube / TikTok / Instagram Reels */}
      <div style={SS}>
        {ST("", "Video Tur Rumah")}
        <p style={{ fontSize: 12, color: "#5A6A6C", margin: "0 0 12px", lineHeight: 1.6 }}>
          Tempel link video YouTube (biasa atau Shorts), TikTok, atau Instagram Reels. Video akan diputar langsung di website — pengunjung tidak perlu pindah ke aplikasi lain.
        </p>
        {(draft.videos || []).map((v, vi) => {
          const url = typeof v === "string" ? v : v.url;
          const info = detectVideoEmbed(url);
          return (
            <div key={vi} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12, padding: 10, background: "#FAF7F0", borderRadius: 10, border: "1px solid #F0E6D0" }}>
              <div style={{ width: info?.vertical ? 70 : 120, flexShrink: 0 }}>
                <VideoEmbed url={url} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <input type="text" value={url}
                  onChange={e => { const a = [...(draft.videos || [])]; a[vi] = e.target.value; upd("videos", a); }}
                  placeholder="https://youtube.com/watch?v=... atau tiktok.com/... atau instagram.com/reel/..."
                  style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 12, boxSizing: "border-box", marginBottom: 6 }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: info ? "#3A7D4F" : "#dc2626" }}>
                  {info ? `✓ Terdeteksi: ${info.platform === "youtube" ? "YouTube" + (info.vertical ? " Shorts" : "") : info.platform === "tiktok" ? "TikTok" : "Instagram Reels"}` : "Link belum valid / tidak dikenali"}
                </div>
              </div>
              <button onClick={() => upd("videos", (draft.videos || []).filter((_, j) => j !== vi))}
                style={{ padding: "7px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, flexShrink: 0 }}>✕</button>
            </div>
          );
        })}
        <button onClick={() => upd("videos", [...(draft.videos || []), ""])}
          style={{ padding: "7px 16px", background: "#F5EDD8", color: "#5A6A6C", border: "1.5px dashed #D5C9B0", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Tambah Video</button>
      </div>

      {/* Interior */}
      <div style={SS}>
        {ST("", "Interior")}
        {inp("Deskripsi interior", "detail.interior.desc", true)}
        <div style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".04em" }}>Poin Interior</div>
        {(draft.detail?.interior?.poin || []).map((p, pi) => (
          <div key={pi} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <AutoGrowField value={p} onChange={e => { const a = [...draft.detail.interior.poin]; a[pi] = e.target.value; upd("detail.interior.poin", a); }}
              style={{ flex: 1, padding: "7px 12px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 13 }} />
            <button onClick={() => upd("detail.interior.poin", draft.detail.interior.poin.filter((_, j) => j !== pi))}
              style={{ padding: "7px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>✕</button>
          </div>
        ))}
        <button onClick={() => upd("detail.interior.poin", [...(draft.detail?.interior?.poin || []), ""])}
          style={{ padding: "6px 14px", background: "#F5EDD8", border: "1.5px dashed #D5C9B0", color: "#5A6A6C", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Poin</button>
      </div>

      {/* Denah */}
      <div style={SS}>
        {ST("", "Denah Ruang")}
        {inp("Deskripsi denah", "detail.denah.desc", true)}

        <div style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".04em" }}>Daftar Ruangan (data internal, tidak tampil di publik)</div>
        {(draft.detail?.denah?.ruangan || []).map((r, ri) => (
          <div key={ri} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input type="text" value={r.ikon || ""} onChange={e => { const a = [...draft.detail.denah.ruangan]; a[ri] = { ...a[ri], ikon: e.target.value }; upd("detail.denah.ruangan", a); }}
              placeholder="" style={{ width: 50, padding: "8px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 16, textAlign: "center" }} />
            <AutoGrowField value={r.nama || ""} onChange={e => { const a = [...draft.detail.denah.ruangan]; a[ri] = { ...a[ri], nama: e.target.value }; upd("detail.denah.ruangan", a); }}
              placeholder="Nama ruangan" style={{ flex: "2 1 120px", padding: "8px 12px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 13 }} />
            <input type="text" value={r.ukuran || ""} onChange={e => { const a = [...draft.detail.denah.ruangan]; a[ri] = { ...a[ri], ukuran: e.target.value }; upd("detail.denah.ruangan", a); }}
              placeholder="5 × 6 m" style={{ flex: "1 1 90px", padding: "8px 12px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 13 }} />
            <button onClick={() => upd("detail.denah.ruangan", draft.detail.denah.ruangan.filter((_, j) => j !== ri))}
              style={{ padding: "8px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>✕</button>
          </div>
        ))}
        <button onClick={() => upd("detail.denah.ruangan", [...(draft.detail?.denah?.ruangan || []), { ikon: "", nama: "", ukuran: "" }])}
          style={{ padding: "6px 14px", background: "#F5EDD8", border: "1.5px dashed #D5C9B0", color: "#5A6A6C", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Ruangan</button>
      </div>

      {/* Harga */}
      <div style={SS}>
        {ST("", "Paket Harga")}
        {(draft.detail?.harga?.paket || []).map((p, pi) => (
          <div key={pi} style={{ background: "#FAF7F0", border: "1.5px solid #E8DCC8", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#2E3D3F" }}>Paket {pi + 1}</div>
              <button onClick={() => upd("detail.harga.paket", draft.detail.harga.paket.filter((_, j) => j !== pi))}
                style={{ padding: "4px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Hapus</button>
            </div>
            <div className="pgm-row-fields" style={{ marginBottom: 8 }}>
              <AutoGrowField value={p.nama || ""} onChange={e => { const a = [...draft.detail.harga.paket]; a[pi] = { ...a[pi], nama: e.target.value }; upd("detail.harga.paket", a); }}
                placeholder="Nama paket" style={{ padding: "8px 12px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 13 }} />
              <input type="text" value={p.luas || ""} onChange={e => { const a = [...draft.detail.harga.paket]; a[pi] = { ...a[pi], luas: e.target.value }; upd("detail.harga.paket", a); }}
                placeholder="60–80 m²" style={{ padding: "8px 12px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 13 }} />
              <input type="number" value={p.harga || 0} onChange={e => { const a = [...draft.detail.harga.paket]; a[pi] = { ...a[pi], harga: +e.target.value }; upd("detail.harga.paket", a); }}
                placeholder="Harga/m²" style={{ padding: "8px 12px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 13 }} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", marginBottom: 6 }}>SUDAH TERMASUK:</div>
            {(p.termasuk || []).map((t, ti) => (
              <div key={ti} style={{ display: "flex", gap: 6, marginBottom: 5 }}>
                <AutoGrowField value={t} onChange={e => { const a = [...draft.detail.harga.paket]; const tr = [...a[pi].termasuk]; tr[ti] = e.target.value; a[pi] = { ...a[pi], termasuk: tr }; upd("detail.harga.paket", a); }}
                  style={{ flex: 1, padding: "6px 10px", border: "1.5px solid #D5C9B0", borderRadius: 8, fontSize: 12 }} />
                <button onClick={() => { const a = [...draft.detail.harga.paket]; const tr = a[pi].termasuk.filter((_, j) => j !== ti); a[pi] = { ...a[pi], termasuk: tr }; upd("detail.harga.paket", a); }}
                  style={{ padding: "6px 8px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}>✕</button>
              </div>
            ))}
            <button onClick={() => { const a = [...draft.detail.harga.paket]; a[pi] = { ...a[pi], termasuk: [...(a[pi].termasuk || []), ""] }; upd("detail.harga.paket", a); }}
              style={{ padding: "5px 12px", background: "#F5EDD8", border: "1.5px dashed #D5C9B0", color: "#5A6A6C", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", marginTop: 2 }}>+ Item</button>
          </div>
        ))}
        <button onClick={() => upd("detail.harga.paket", [...(draft.detail?.harga?.paket || []), { nama: "Paket Baru", luas: "", harga: 0, termasuk: [] }])}
          style={{ padding: "7px 16px", background: "#F5EDD8", border: "1.5px dashed #D5C9B0", color: "#5A6A6C", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Paket Harga</button>
      </div>

      {/* Save bawah */}
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <button onClick={onBack}
          style={{ padding: "10px 20px", background: "#F5EDD8", color: "#5A6A6C", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Batal</button>
        <button onClick={saveTema} disabled={saving}
          style={{ padding: "10px 24px", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 50%,#C9AA71 100%)", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          {saving ? "Menyimpan..." : "Simpan Tema"}
        </button>
      </div>
    </div>
  );
}

/* ── 4. Panel utama admin tema rumah ── */
function TemaRumahAdminPanel({ data, save, notify, uploadToCloudinary }) {
  const [temaTab, setTemaTab] = useState("hero");
  const [editIdx, setEditIdx] = useState(null);
  const [loadingDefault, setLoadingDefault] = useState(false);

  const activeTemas = (data.temaData && data.temaData.length > 0) ? data.temaData : TEMA_DATA;
  const { ordered: orderedTemas, draggingIdx: draggingTemaIdx, onDragStart: onTemaDragStart, onDragEnter: onTemaDragEnter, onDragOver: onTemaDragOver, onDragEnd: onTemaDragEnd, moveUp: moveTemaUp, moveDown: moveTemaDown } =
    useDragReorder(activeTemas, async (next) => { await save({ ...data, temaData: next }); notify("Urutan tema berhasil disimpan!"); });

  /* Template kosong untuk tema baru — struktur lengkap & konsisten dengan tema yang sudah ada,
     supaya otomatis kompatibel dengan halaman publik (single-scroll), eksterior grid, denah multi-lantai, dst. */
  const buildBlankTema = () => {
    const nextNo = String(activeTemas.length + 1).padStart(2, "0");
    return {
      id: Date.now(),
      slug: "",
      no: nextNo,
      nama: "Tema Baru",
      tagline: "",
      fitur: [
        { icon: "", label: "Fitur 1" }, { icon: "", label: "Fitur 2" },
        { icon: "", label: "Fitur 3" }, { icon: "", label: "Fitur 4" },
      ],
      img: "",
      imgs: [],
      videos: [],
      warna: "#C9AA71",
      deskripsi: "",
      detail: {
        exterior: { desc: "", poin: [] },
        interior: { desc: "", poin: [] },
        denah: { desc: "", ruangan: [], lantai: [{ label: "Lantai 1", imgs: [] }] },
        harga: {
          paket: [
            { nama: "Paket Standar", luas: "60–80 m²", harga: 0, termasuk: [] },
            { nama: "Paket Premium", luas: "80–120 m²", harga: 0, termasuk: [] },
            { nama: "Paket Luxury", luas: "120 m² ke atas", harga: 0, termasuk: [] },
          ],
        },
      },
    };
  };

  const handleAddNewTema = async () => {
    const blank = buildBlankTema();
    const nextTemas = [...activeTemas, blank];
    try {
      await save({ ...data, temaData: nextTemas });
      notify("Tema baru ditambahkan. Lengkapi datanya sekarang.");
      setEditIdx(nextTemas.length - 1);
    } catch {
      notify("Gagal menambah tema baru.");
    }
  };

  const handleDeleteTema = async (i) => {
    const t = activeTemas[i];
    if (!window.confirm(`Hapus tema "${t.nama || "(tanpa nama)"}" secara permanen beserta semua foto & videonya di Cloudinary? Tindakan ini tidak bisa dibatalkan.`)) return;
    const nextTemas = activeTemas.filter((_, j) => j !== i);
    try {
      const urls = [
        t?.img,
        ...((t?.imgs || []).map(g => g?.img)),
        ...((t?.videos || [])),
      ].filter(Boolean);
      const cloudOk = urls.length > 0 ? await deleteCloudinaryAssets(urls) : true;
      await save({ ...data, temaData: nextTemas });
      notify(cloudOk
        ? "Tema & seluruh foto/video terkait berhasil dihapus permanen."
        : "Tema berhasil dihapus, tapi sebagian foto/video di Cloudinary gagal terhapus otomatis.");
    } catch {
      notify("Gagal menghapus tema.");
    }
  };

  const handleLoadDefault = async () => {
    if (!window.confirm("Load semua data default dari kode ke database? Data yang ada di DB akan ditimpa.")) return;
    setLoadingDefault(true);
    try {
      await save({ ...data, temaData: TEMA_DATA });
      notify("Data default berhasil dimuat ke database!");
      setEditIdx(null);
    } catch { notify("Gagal load data default."); }
    setLoadingDefault(false);
  };

  /* ── Toggle Hide/Publish tema: tema tetap tersimpan, hanya disembunyikan dari halaman publik ── */
  const handleToggleHiddenTema = async (i) => {
    const t = activeTemas[i];
    const nextHidden = !t.hidden;
    const nextTemas = activeTemas.map((tt, j) => j === i ? { ...tt, hidden: nextHidden } : tt);
    try {
      await save({ ...data, temaData: nextTemas });
      notify(nextHidden ? "Tema disembunyikan dari halaman publik." : "Tema sekarang tampil di halaman publik.");
    } catch { notify("Gagal mengubah status tampilan tema."); }
  };

  const HERO_FIELDS = [
    { key: "temaHeroLabel",     label: "Label di atas judul (uppercase kecil)", placeholder: "TEMA RUMAH" },
    { key: "temaHeroTitle1",    label: "Judul baris 1 (warna putih)",           placeholder: "PILIH TEMA RUMAH" },
    { key: "temaHeroTitle2",    label: "Judul baris 2 (warna emas)",            placeholder: "SESUAI KARAKTER ANDA" },
    { key: "temaHeroDesc",      label: "Deskripsi hero",                        placeholder: "Berbagai pilihan tema rumah yang dirancang..." },
    { key: "temaBtnKonsultasi", label: "Label tombol CTA",                      placeholder: "KONSULTASI GRATIS" },
    { key: "temaCtaTitle",      label: "Teks CTA bawah (judul)",                placeholder: "Wujudkan Rumah Impian Anda Bersama HIKIMORI CONST" },
    { key: "temaCtaDesc",       label: "Teks CTA bawah (deskripsi)",            placeholder: "Konsultasikan kebutuhan desain rumah Anda dengan tim profesional kami." },
  ];

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 30 }}></span>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#2E3D3F", margin: 0 }}>Setting Halaman Tema Rumah</h2>
            <p style={{ fontSize: 13, color: "#8B9A9C", margin: "3px 0 0" }}>Kelola hero, konten, dan data tiap tema rumah.</p>
          </div>
        </div>
        <button onClick={handleLoadDefault} disabled={loadingDefault}
          style={{ padding: "9px 16px", background: data.temaData?.length > 0 ? "#6c757d" : "#2ecc71", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          {loadingDefault ? "Loading..." : data.temaData?.length > 0 ? "Reload Default" : "Load Data Default"}
        </button>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {[{ id: "hero", label: "Hero & CTA" }, { id: "temas", label: "Kelola Tema" }].map(t => (
          <button key={t.id} onClick={() => { setTemaTab(t.id); setEditIdx(null); }}
            style={{ padding: "8px 18px", borderRadius: 20, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer",
              background: temaTab === t.id ? "#2E3D3F" : "#F5EDD8", color: temaTab === t.id ? "#fff" : "#5A6A6C" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Hero tab */}
      {temaTab === "hero" && (
        <div>
          {HERO_FIELDS.map(f => (
            <TemaHeroFieldRow key={f.key} fieldKey={f.key} label={f.label} placeholder={f.placeholder} data={data} save={save} notify={notify} />
          ))}
          <TemaHeroImgRow data={data} save={save} notify={notify} uploadToCloudinary={uploadToCloudinary} />
        </div>
      )}

      {/* Temas tab */}
      {temaTab === "temas" && (
        <div>
          <div style={{ background: data.temaData?.length > 0 ? "#e8f8ef" : "#fff8e1", border: `1.5px solid ${data.temaData?.length > 0 ? "#27ae60" : "#f39c12"}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13 }}>
            {data.temaData?.length > 0
              ? `${data.temaData.length} tema tersimpan di database. Halaman menggunakan data dari DB.`
              : "Data tema belum dimuat ke database. Halaman masih menggunakan data hardcoded. Klik \"Load Data Default\" di atas untuk memuat."
            }
          </div>

          {editIdx === null ? (
            <div>
              <button onClick={handleAddNewTema}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 18px", background: "#2ecc71", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: "pointer", marginBottom: 16 }}>
                Tambah Tema Baru
              </button>
              {orderedTemas.map((tema, i) => { const isHidden = !!tema.hidden; return (
                <div key={tema.slug}
                  draggable
                  onDragStart={onTemaDragStart(i)}
                  onDragEnter={onTemaDragEnter(i)}
                  onDragOver={onTemaDragOver}
                  onDragEnd={onTemaDragEnd}
                  style={{ background: "#fff", border: `1.5px solid ${isHidden ? "#E5C07B" : "#E8DCC8"}`, borderRadius: 12, padding: "16px 18px", marginBottom: 12, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", opacity: draggingTemaIdx === i ? 0.4 : isHidden ? 0.72 : 1 }}>
                  <OrderControls idx={i} count={orderedTemas.length} onUp={moveTemaUp} onDown={moveTemaDown} />
                  <img decoding="async" loading="lazy" src={cld(tema.img)} alt={tema.nama} style={{ width: 70, height: 52, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} onError={onImgError} />
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: "#2E3D3F" }}>{tema.no} · {tema.nama}</div>
                      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".03em", padding: "2px 8px", borderRadius: 20,
                        background: isHidden ? "#FDF3E3" : "#E8F8EF", color: isHidden ? "#A9720F" : "#1A7A40", flexShrink: 0 }}>
                        {isHidden ? "TERSEMBUNYI" : "PUBLIK"}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#5A6A6C", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tema.tagline}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                      {(tema.fitur || []).map((f, fi) => (
                        <span key={fi} style={{ fontSize: 10, background: "#FAF7F0", border: "1px solid #E8DCC8", borderRadius: 20, padding: "2px 8px", color: "#5A6A6C" }}>{f.icon} {f.label}</span>
                      ))}
                    </div>
                  </div>

                  {/* Toggle Hide / Public */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}
                    title={isHidden ? "Tersembunyi dari halaman publik — klik untuk publikasikan" : "Tampil di halaman publik — klik untuk sembunyikan"}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: isHidden ? "#A9720F" : "#1A7A40", minWidth: 34, textAlign: "right" }}>
                      {isHidden ? "Hide" : "Public"}
                    </span>
                    <button type="button" onClick={() => handleToggleHiddenTema(i)}
                      style={{ position: "relative", width: 42, height: 24, borderRadius: 20, border: "none", cursor: "pointer",
                        flexShrink: 0, background: isHidden ? "#D5C9B0" : "#C9AA71", transition: "background .2s" }}>
                      <span style={{ position: "absolute", top: 3, left: isHidden ? 3 : 21, width: 18, height: 18, borderRadius: "50%",
                        background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.3)", transition: "left .2s" }} />
                    </button>
                  </div>

                  <button onClick={() => setEditIdx(i)}
                    style={{ padding: "8px 16px", background: "#C9AA71", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                    Edit
                  </button>
                  <button onClick={() => handleDeleteTema(i)}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                    Hapus
                  </button>
                </div>
              ); })}
            </div>
          ) : (
            <TemaEditForm
              temaOrig={activeTemas[editIdx]}
              editIdx={editIdx}
              activeTemas={activeTemas}
              data={data}
              save={save}
              notify={notify}
              uploadToCloudinary={uploadToCloudinary}
              onBack={() => setEditIdx(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export { AboutAdminSection, AboutHeroBgEditor, AboutLayananCardEditor, AboutLayananListEditor, AboutMisiEditor, AboutPageAdmin, AboutStatsEditor, AboutTextField, AboutWhyUsEditor, AdminReviews, BackupDataPanel, CMSEditor, CrudField, DashTabs, DragHandle, HeroStaticImagePanel, HeroVideoPanel, HomeServiceCardEditor, LayananHeroImagePanel, LayananPageAdmin, OrderArrows, OrderControls, PaketGridManager, RichParagraphEditor, SosmedManager, SubLayananAdmin, TeamAdmin, TemaEditForm, TemaHeroFieldRow, TemaHeroImgRow, TemaRumahAdminPanel, WaAdminManager, deleteCloudinaryAssets, extractCloudinaryAsset, formatHargaRp, moveArrayItem, slugify, useDragReorder };
