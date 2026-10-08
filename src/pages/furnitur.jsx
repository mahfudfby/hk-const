/* Chunk halaman "furnitur" — dimuat lazy (React.lazy) saat rute ini dibuka.
   Dipisah dari RealEstateWeb.jsx agar pengunjung halaman lain tidak ikut mengunduh kode ini. */
import { useState, useEffect, useMemo } from "react";
import { cld } from "../lib/net.js";
import { CardImg, formatRp, onImgError } from "../app/core.jsx";
/* ═══════════════════════════════════════════════════════════════════
   FURNITUR PAGE — E-Commerce product listing dengan filter & cart UX
═══════════════════════════════════════════════════════════════════ */
function FurniturPage({ data, onWaOpen }) {
  const products = (data.furniturItems || []).filter(p => !p.hidden);
  const [search, setSearch]   = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy]   = useState("default");
  const [hoverCard, setHoverCard] = useState(null);
  const [detailItem, setDetailItem] = useState(null);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.kategori).filter(Boolean))];
    return cats;
  }, [products]);

  const formatRp = (n) => {
    if (!n || n === "" || n === "0") return "Hubungi Kami";
    const num = parseFloat(String(n).replace(/[^0-9.]/g, ""));
    if (isNaN(num)) return n;
    return "Rp " + num.toLocaleString("id-ID");
  };

  const filtered = useMemo(() => {
    let list = [...products];
    if (search) list = list.filter(p =>
      p.nama?.toLowerCase().includes(search.toLowerCase()) ||
      p.deskripsi?.toLowerCase().includes(search.toLowerCase()) ||
      p.kategori?.toLowerCase().includes(search.toLowerCase())
    );
    if (category !== "all") list = list.filter(p => p.kategori === category);
    if (sortBy === "harga_asc")  list = list.sort((a,b) => parseFloat(a.harga||0) - parseFloat(b.harga||0));
    if (sortBy === "harga_desc") list = list.sort((a,b) => parseFloat(b.harga||0) - parseFloat(a.harga||0));
    if (sortBy === "nama")       list = list.sort((a,b) => (a.nama||"").localeCompare(b.nama||""));
    return list;
  }, [products, search, category, sortBy]);

  const accentGold = "#C9AA71";
  const darkTeal   = "#2E3D3F";

  /* Jika item dipilih → tampilkan halaman detail penuh, ganti seluruh konten grid */
  if (detailItem) {
    return <FurniturDetailPage product={detailItem} onBack={() => setDetailItem(null)} onWaOpen={onWaOpen} formatRp={formatRp} />;
  }

  return (
    <div style={{ minHeight:"100vh", background:"#FAFAF7", fontFamily:"'Jost',sans-serif" }}>
      <style>{`
        .fur-card { transition: transform .22s, box-shadow .22s; }
        .fur-card:hover { transform: translateY(-4px); box-shadow: 0 12px 36px rgba(0,0,0,.13) !important; }
        .fur-img-wrap img { transition: transform .4s; }
        .fur-card:hover .fur-img-wrap img { transform: scale(1.06); }
        .fur-btn-wa { transition: background .18s, transform .15s; }
        .fur-btn-wa:hover { transform: scale(1.04); }
        @media (max-width:700px) {
          .fur-grid { grid-template-columns: 1fr !important; }
          .fur-cat-pills { display: none !important; }
          .fur-cat-dropdown { display: block !important; }
        }
      `}</style>

      {/* -- Hero -- */}
      <div style={{ background:`linear-gradient(135deg,${darkTeal} 0%,#3D5254 55%,#8B6914 85%,${accentGold} 100%)`, padding:"64px 5% 52px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, opacity:.08, backgroundImage:"radial-gradient(circle at 20% 50%,#fff 1px,transparent 1px),radial-gradient(circle at 80% 20%,#fff 1px,transparent 1px),radial-gradient(circle at 60% 80%,#fff 1px,transparent 1px)", backgroundSize:"48px 48px" }} />
        <div style={{ position:"relative" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(201,170,113,.18)", border:`1px solid rgba(201,170,113,.38)`, borderRadius:20, padding:"5px 16px", marginBottom:16 }}>
            <span style={{ fontSize:13 }}></span>
            <span style={{ fontSize:"0.7rem", letterSpacing:"3px", color:accentGold, fontWeight:700, textTransform:"uppercase" }}>Produk Retail</span>
          </div>
          <h1 style={{ fontSize:"clamp(1.8rem,4vw,3rem)", fontWeight:800, color:"#fff", letterSpacing:"-0.02em", margin:"0 0 12px", fontFamily:"'Playfair Display',serif" }}>
            Koleksi Furnitur
          </h1>
          <p style={{ fontSize:"1rem", color:"rgba(255,255,255,.72)", maxWidth:520, margin:"0 auto", lineHeight:1.7 }}>
            Temukan furnitur berkualitas untuk mempercantik setiap sudut rumah Anda — dari ruang tamu hingga kamar tidur.
          </p>
        </div>
      </div>

      {/* -- Breadcrumb -- */}
      <div style={{ padding:"14px 5%", borderBottom:"1px solid #eee", background:"#fff" }}>
        <span style={{ fontSize:"0.78rem", color:"#8B9A9C" }}>Beranda</span>
        <span style={{ fontSize:"0.78rem", color:"#8B9A9C", margin:"0 8px" }}>›</span>
        <span style={{ fontSize:"0.78rem", color:"#8B9A9C" }}>Produk Retail</span>
        <span style={{ fontSize:"0.78rem", color:"#8B9A9C", margin:"0 8px" }}>›</span>
        <span style={{ fontSize:"0.78rem", color:darkTeal, fontWeight:600 }}>Furnitur</span>
      </div>

      <div style={{ padding:"32px 5% 60px", maxWidth:1280, margin:"0 auto" }}>

        {/* -- Filter & Search Bar -- */}
        <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center", marginBottom:32, background:"#fff", borderRadius:12, padding:"16px 20px", boxShadow:"0 2px 12px rgba(0,0,0,.06)" }}>
          {/* Search */}
          <div style={{ flex:"1 1 220px", position:"relative" }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:15, opacity:.5 }}></span>
            <input
              type="text"
              placeholder="Cari produk furnitur..."
              value={search}
              onChange={e=>setSearch(e.target.value)}
              style={{ width:"100%", paddingLeft:36, paddingRight:12, height:40, border:"1.5px solid #E8DCC8", borderRadius:8, fontSize:"0.85rem", color:darkTeal, outline:"none", boxSizing:"border-box", fontFamily:"'Jost',sans-serif" }}
            />
          </div>
          {/* Category filter — Desktop: pill buttons */}
          <div className="fur-cat-pills" style={{ flex:"0 0 auto", display:"flex", gap:8, flexWrap:"wrap" }}>
            {["all",...categories].map(cat => (
              <button key={cat} onClick={()=>setCategory(cat)}
                style={{ padding:"7px 16px", borderRadius:20, border:`1.5px solid ${category===cat ? accentGold : "#E8DCC8"}`,
                  background: category===cat ? accentGold : "#fff",
                  color: category===cat ? "#fff" : darkTeal,
                  fontSize:"0.78rem", fontWeight:600, cursor:"pointer", transition:"all .15s", fontFamily:"'Jost',sans-serif" }}>
                {cat === "all" ? "Semua" : cat}
              </button>
            ))}
          </div>
          {/* Category filter — Mobile: satu dropdown saja */}
          <select className="fur-cat-dropdown" value={category} onChange={e=>setCategory(e.target.value)}
            style={{ display:"none", flex:"1 1 100%", height:40, border:"1.5px solid #E8DCC8", borderRadius:8, padding:"0 12px", fontSize:"0.85rem", color:darkTeal, background:"#fff", fontFamily:"'Jost',sans-serif", cursor:"pointer", outline:"none", boxSizing:"border-box" }}>
            {["all",...categories].map(cat => (
              <option key={cat} value={cat}>{cat === "all" ? "Semua Kategori" : cat}</option>
            ))}
          </select>
          {/* Sort */}
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
            style={{ flex:"0 0 auto", height:40, border:"1.5px solid #E8DCC8", borderRadius:8, padding:"0 12px", fontSize:"0.82rem", color:darkTeal, background:"#fff", fontFamily:"'Jost',sans-serif", cursor:"pointer", outline:"none" }}>
            <option value="default">Urutan Default</option>
            <option value="nama">Nama A–Z</option>
            <option value="harga_asc">Harga: Terendah</option>
            <option value="harga_desc">Harga: Tertinggi</option>
          </select>
          {/* Count */}
          <span style={{ fontSize:"0.78rem", color:"#8B9A9C", flex:"0 0 auto" }}>{filtered.length} produk</span>
        </div>

        {/* -- Products Grid -- */}
        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"80px 20px", color:"#8B9A9C" }}>
            <div style={{ fontSize:48, marginBottom:16 }}></div>
            <p style={{ fontSize:"1.05rem", fontWeight:600, color:darkTeal }}>Belum ada produk furnitur.</p>
            <p style={{ fontSize:"0.875rem", marginTop:8 }}>Produk akan ditampilkan di sini setelah ditambahkan dari Control Panel.</p>
          </div>
        ) : (() => {
          /* Kelompokkan produk per kategori untuk divider */
          const groups = [];
          if (category !== "all") {
            /* Filter aktif: satu grup tanpa divider header */
            groups.push({ label: null, items: filtered });
          } else {
            /* Semua: kelompokkan per kategori, urutan kemunculan pertama */
            const seen = {};
            filtered.forEach(prod => {
              const key = prod.kategori || "Lainnya";
              if (!seen[key]) { seen[key] = []; groups.push({ label: key, items: seen[key] }); }
              seen[key].push(prod);
            });
          }
          const renderCard = (prod) => (
            <div key={prod.id} className="fur-card"
              style={{ background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:"0 2px 14px rgba(0,0,0,.07)", cursor:"pointer", display:"flex", flexDirection:"column" }}
              onMouseEnter={()=>setHoverCard(prod.id)}
              onMouseLeave={()=>setHoverCard(null)}
              onClick={()=>setDetailItem(prod)}>
              {/* Image */}
              <div className="fur-img-wrap" style={{ height:220, overflow:"hidden", background:"#F5EDD8", position:"relative" }}>
                {prod._img ? (
                  <CardImg src={prod._img} alt={prod.nama} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                    onError={e=>{onImgError(e); e.target.nextSibling.style.display="flex";}} />
                ) : null}
                <div style={{ display: prod._img ? "none" : "flex", position:"absolute", inset:0, alignItems:"center", justifyContent:"center", fontSize:48, background:"#F5EDD8" }}></div>
                {prod.kategori && (
                  <span style={{ position:"absolute", top:12, left:12, background:"rgba(46,61,63,.82)", color:"#fff", fontSize:"0.65rem", padding:"3px 10px", borderRadius:12, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", backdropFilter:"blur(4px)" }}>
                    {prod.kategori}
                  </span>
                )}
              </div>
              {/* Info */}
              <div style={{ padding:"18px 18px 20px", flex:1, display:"flex", flexDirection:"column" }}>
                <h3 style={{ fontSize:"0.9375rem", fontWeight:700, color:darkTeal, marginBottom:6, lineHeight:1.35 }}>{prod.nama}</h3>
                {prod.deskripsi && (
                  <p style={{ fontSize:"0.8rem", color:"#5A6A6C", lineHeight:1.6, flex:1, marginBottom:12, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                    {prod.deskripsi}
                  </p>
                )}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, marginTop:"auto" }}>
                  <span style={{ fontSize:"1.05rem", fontWeight:800, color:prod.harga ? "#8B6914" : "#5A6A6C", fontFamily:"'Playfair Display',serif" }}>
                    {formatRp(prod.harga)}
                  </span>
                  <button
                    className="fur-btn-wa"
                    onClick={e=>{ e.stopPropagation(); onWaOpen && onWaOpen({ key:"layanan", vars:{ judul_layanan: prod.nama } }); }}
                    style={{ background:`linear-gradient(135deg,${darkTeal},#3D5254)`, color:"#fff", border:"none", borderRadius:8, padding:"8px 14px", fontSize:"0.75rem", fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"'Jost',sans-serif" }}>
                    Tanya
                  </button>
                </div>
              </div>
            </div>
          );
          return (
            <div>
              {groups.map((group, gi) => (
                <div key={group.label || "all"}>
                  {/* Garis pembatas kategori */}
                  {group.label && (
                    <div style={{ display:"flex", alignItems:"center", gap:14, margin: gi === 0 ? "0 0 24px" : "40px 0 24px" }}>
                      <div style={{ flex:1, height:1, background:"linear-gradient(to right,#E8DCC8,transparent)" }} />
                      <div style={{ display:"flex", alignItems:"center", gap:8, background:"#FAF7F0", border:"1px solid #E8DCC8", borderRadius:20, padding:"5px 16px", flexShrink:0 }}>
                        <span style={{ fontSize:"0.68rem", fontWeight:800, letterSpacing:".12em", textTransform:"uppercase", color:accentGold }}></span>
                        <span style={{ fontSize:"0.78rem", fontWeight:700, color:darkTeal, letterSpacing:".04em" }}>{group.label}</span>
                        <span style={{ fontSize:"0.68rem", color:"#8B9A9C", fontWeight:500 }}>({group.items.length})</span>
                      </div>
                      <div style={{ flex:1, height:1, background:"linear-gradient(to left,#E8DCC8,transparent)" }} />
                    </div>
                  )}
                  <div className="fur-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24 }}>
                    {group.items.map(prod => renderCard(prod))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* -- Detail Modal -- */}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FURNITUR — Halaman Detail Produk (full page, galeri foto + request custom)
═══════════════════════════════════════════════════════════════════ */
function FurniturDetailPage({ product, onBack, onWaOpen, formatRp }) {
  const accentGold = "#C9AA71";
  const darkTeal   = "#2E3D3F";

  useEffect(() => { window.scrollTo(0, 0); }, [product?.id]);

  /* Galeri: pakai imgs[] kalau ada (multi-foto), fallback ke _img tunggal */
  const gallery = (product.imgs && product.imgs.length > 0)
    ? product.imgs
    : (product._img ? [{ img: product._img, label: product.nama }] : []);

  const [activeImg, setActiveImg] = useState(0);
  const mainImg = gallery[activeImg]?.img || gallery[0]?.img || "";

  const handleRequestCustom = () => {
    onWaOpen && onWaOpen({ key: "layanan", vars: { judul_layanan: `Request Custom — ${product.nama}` } });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF7", fontFamily: "'Jost',sans-serif" }}>
      {/* Back bar */}
      <div style={{ background: `linear-gradient(90deg,${darkTeal},#3D5254)`, padding: "0 5%", position: "sticky", top: 0, zIndex: 50, borderBottom: `3px solid ${accentGold}` }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: accentGold, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", padding: "13px 0", letterSpacing: ".06em", textTransform: "uppercase" }}>
          <span style={{ fontSize: 18 }}>←</span> Kembali ke Furnitur
        </button>
      </div>

      {/* Breadcrumb */}
      <div style={{ padding: "14px 5%", borderBottom: "1px solid #eee", background: "#fff" }}>
        <span style={{ fontSize: "0.78rem", color: "#8B9A9C" }}>Beranda</span>
        <span style={{ fontSize: "0.78rem", color: "#8B9A9C", margin: "0 8px" }}>›</span>
        <span style={{ fontSize: "0.78rem", color: "#8B9A9C" }}>Furnitur</span>
        <span style={{ fontSize: "0.78rem", color: "#8B9A9C", margin: "0 8px" }}>›</span>
        <span style={{ fontSize: "0.78rem", color: darkTeal, fontWeight: 600 }}>{product.nama}</span>
      </div>

      <div style={{ padding: "36px 5% 64px", maxWidth: 1100, margin: "0 auto" }}>
        <div className="fur-detail-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 44, alignItems: "start" }}>

          {/* ── Galeri Foto ── */}
          <div>
            <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 10px 32px rgba(0,0,0,.12)", background: "#F5EDD8", aspectRatio: "4/3", position: "relative" }}>
              {mainImg ? (
                <CardImg src={mainImg} alt={product.nama} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={onImgError} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}></div>
              )}
            </div>

            {gallery.length > 1 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(72px,1fr))", gap: 10, marginTop: 12 }}>
                {gallery.map((g, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    style={{ padding: 0, border: i === activeImg ? `2.5px solid ${accentGold}` : "2.5px solid transparent", borderRadius: 9, overflow: "hidden", cursor: "pointer", background: "none", aspectRatio: "1/1" }}>
                    <img decoding="async" loading="lazy" src={cld(g.img)} alt={g.label || `Foto ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={e => e.target.parentElement.style.display = "none"} />
                  </button>
                ))}
              </div>
            )}
            {gallery.length === 0 && (
              <p style={{ fontSize: "0.78rem", color: "#A89070", marginTop: 10, textAlign: "center" }}>Belum ada foto untuk produk ini.</p>
            )}
          </div>

          {/* ── Info & Request Custom ── */}
          <div>
            {product.kategori && (
              <span style={{ display: "inline-block", background: "#FAF7F0", color: "#8B6914", fontSize: "0.68rem", padding: "4px 13px", borderRadius: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 14, border: "1px solid #E8DCC8" }}>
                {product.kategori}
              </span>
            )}
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: darkTeal, margin: "0 0 12px", fontFamily: "'Playfair Display',serif", lineHeight: 1.25 }}>
              {product.nama}
            </h1>
            <div style={{ fontSize: "1.55rem", fontWeight: 800, color: "#8B6914", fontFamily: "'Playfair Display',serif", marginBottom: 22 }}>
              {formatRp(product.harga)}
            </div>

            {product.deskripsi && (
              <div style={{ marginBottom: 26 }}>
                <div style={{ fontSize: "0.65rem", letterSpacing: ".1em", textTransform: "uppercase", color: accentGold, fontWeight: 800, marginBottom: 8 }}>Deskripsi Produk</div>
                <p style={{ fontSize: "0.92rem", color: "#5A6A6C", lineHeight: 1.85, whiteSpace: "pre-line" }}>{product.deskripsi}</p>
              </div>
            )}

            {/* ── Form Request Custom ── */}
            <div style={{ background: "#fff", border: `1.5px solid #E8DCC8`, borderRadius: 14, padding: "22px 24px", marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}></span>
                <div style={{ fontWeight: 800, fontSize: "0.95rem", color: darkTeal }}>Request Custom</div>
              </div>
              <p style={{ fontSize: "0.8rem", color: "#5A6A6C", lineHeight: 1.65, marginBottom: 16 }}>
                Ingin ukuran, warna, atau material berbeda dari produk ini? Kirim permintaan custom langsung ke tim kami via WhatsApp.
              </p>
              <button onClick={handleRequestCustom}
                style={{ width: "100%", background: "linear-gradient(135deg,#25D366,#128C7E)", color: "#fff", border: "none", borderRadius: 10, padding: "14px 24px", fontSize: "0.92rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Jost',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                Request Custom via WhatsApp
              </button>
            </div>

            <button onClick={() => onWaOpen && onWaOpen({ key: "layanan", vars: { judul_layanan: product.nama } })}
              style={{ width: "100%", marginTop: 10, background: "#FAF7F0", color: darkTeal, border: "1.5px solid #E8DCC8", borderRadius: 10, padding: "12px 20px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Jost',sans-serif" }}>
              Tanya Produk Ini (Sesuai Spesifikasi)
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .fur-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CUSTOM FURNITUR — sama persis strukturnya dengan halaman Furnitur (retail),
   tapi untuk katalog furnitur made-to-order / bespoke. Sumber data terpisah
   (data.customFurniturItems), dikelola lewat panel admin sendiri.
═══════════════════════════════════════════════════════════════════ */
function CustomFurniturPage({ data, onWaOpen }) {
  const products = (data.customFurniturItems || []).filter(p => !p.hidden);
  const [search, setSearch]   = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy]   = useState("default");
  const [hoverCard, setHoverCard] = useState(null);
  const [detailItem, setDetailItem] = useState(null);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.kategori).filter(Boolean))];
    return cats;
  }, [products]);

  const formatRp = (n) => {
    if (!n || n === "" || n === "0") return "Hubungi Kami";
    const num = parseFloat(String(n).replace(/[^0-9.]/g, ""));
    if (isNaN(num)) return n;
    return "Mulai Rp " + num.toLocaleString("id-ID");
  };

  const filtered = useMemo(() => {
    let list = [...products];
    if (search) list = list.filter(p =>
      p.nama?.toLowerCase().includes(search.toLowerCase()) ||
      p.deskripsi?.toLowerCase().includes(search.toLowerCase()) ||
      p.kategori?.toLowerCase().includes(search.toLowerCase())
    );
    if (category !== "all") list = list.filter(p => p.kategori === category);
    if (sortBy === "harga_asc")  list = list.sort((a,b) => parseFloat(a.harga||0) - parseFloat(b.harga||0));
    if (sortBy === "harga_desc") list = list.sort((a,b) => parseFloat(b.harga||0) - parseFloat(a.harga||0));
    if (sortBy === "nama")       list = list.sort((a,b) => (a.nama||"").localeCompare(b.nama||""));
    return list;
  }, [products, search, category, sortBy]);

  const accentGold = "#C9AA71";
  const darkTeal   = "#2E3D3F";

  /* Jika item dipilih → tampilkan halaman detail penuh, ganti seluruh konten grid */
  if (detailItem) {
    return <CustomFurniturDetailPage product={detailItem} onBack={() => setDetailItem(null)} onWaOpen={onWaOpen} formatRp={formatRp} />;
  }

  return (
    <div style={{ minHeight:"100vh", background:"#FAFAF7", fontFamily:"'Jost',sans-serif" }}>
      <style>{`
        .fur-card { transition: transform .22s, box-shadow .22s; }
        .fur-card:hover { transform: translateY(-4px); box-shadow: 0 12px 36px rgba(0,0,0,.13) !important; }
        .fur-img-wrap img { transition: transform .4s; }
        .fur-card:hover .fur-img-wrap img { transform: scale(1.06); }
        .fur-btn-wa { transition: background .18s, transform .15s; }
        .fur-btn-wa:hover { transform: scale(1.04); }
        @media (max-width:700px) {
          .fur-grid { grid-template-columns: 1fr !important; }
          .fur-cat-pills { display: none !important; }
          .fur-cat-dropdown { display: block !important; }
        }
      `}</style>

      {/* -- Hero -- */}
      <div style={{ background:`linear-gradient(135deg,${darkTeal} 0%,#3D5254 55%,#8B6914 85%,${accentGold} 100%)`, padding:"64px 5% 52px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, opacity:.08, backgroundImage:"radial-gradient(circle at 20% 50%,#fff 1px,transparent 1px),radial-gradient(circle at 80% 20%,#fff 1px,transparent 1px),radial-gradient(circle at 60% 80%,#fff 1px,transparent 1px)", backgroundSize:"48px 48px" }} />
        <div style={{ position:"relative" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(201,170,113,.18)", border:`1px solid rgba(201,170,113,.38)`, borderRadius:20, padding:"5px 16px", marginBottom:16 }}>
            <span style={{ fontSize:13 }}></span>
            <span style={{ fontSize:"0.7rem", letterSpacing:"3px", color:accentGold, fontWeight:700, textTransform:"uppercase" }}>Made-to-Order</span>
          </div>
          <h1 style={{ fontSize:"clamp(1.8rem,4vw,3rem)", fontWeight:800, color:"#fff", letterSpacing:"-0.02em", margin:"0 0 12px", fontFamily:"'Playfair Display',serif" }}>
            Custom Furnitur
          </h1>
          <p style={{ fontSize:"1rem", color:"rgba(255,255,255,.72)", maxWidth:560, margin:"0 auto", lineHeight:1.7 }}>
            Furnitur dibuat sesuai ukuran, material, dan desain yang Anda inginkan — dari referensi di bawah ini, kami wujudkan versi custom-nya untuk rumah Anda.
          </p>
        </div>
      </div>

      {/* -- Breadcrumb -- */}
      <div style={{ padding:"14px 5%", borderBottom:"1px solid #eee", background:"#fff" }}>
        <span style={{ fontSize:"0.78rem", color:"#8B9A9C" }}>Beranda</span>
        <span style={{ fontSize:"0.78rem", color:"#8B9A9C", margin:"0 8px" }}>›</span>
        <span style={{ fontSize:"0.78rem", color:"#8B9A9C" }}>Furnitur</span>
        <span style={{ fontSize:"0.78rem", color:"#8B9A9C", margin:"0 8px" }}>›</span>
        <span style={{ fontSize:"0.78rem", color:darkTeal, fontWeight:600 }}>Custom Furnitur</span>
      </div>

      <div style={{ padding:"32px 5% 60px", maxWidth:1280, margin:"0 auto" }}>

        {/* -- Filter & Search Bar -- */}
        <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center", marginBottom:32, background:"#fff", borderRadius:12, padding:"16px 20px", boxShadow:"0 2px 12px rgba(0,0,0,.06)" }}>
          {/* Search */}
          <div style={{ flex:"1 1 220px", position:"relative" }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:15, opacity:.5 }}></span>
            <input
              type="text"
              placeholder="Cari referensi custom furnitur..."
              value={search}
              onChange={e=>setSearch(e.target.value)}
              style={{ width:"100%", paddingLeft:36, paddingRight:12, height:40, border:"1.5px solid #E8DCC8", borderRadius:8, fontSize:"0.85rem", color:darkTeal, outline:"none", boxSizing:"border-box", fontFamily:"'Jost',sans-serif" }}
            />
          </div>
          {/* Category filter — Desktop: pill buttons */}
          <div className="fur-cat-pills" style={{ flex:"0 0 auto", display:"flex", gap:8, flexWrap:"wrap" }}>
            {["all",...categories].map(cat => (
              <button key={cat} onClick={()=>setCategory(cat)}
                style={{ padding:"7px 16px", borderRadius:20, border:`1.5px solid ${category===cat ? accentGold : "#E8DCC8"}`,
                  background: category===cat ? accentGold : "#fff",
                  color: category===cat ? "#fff" : darkTeal,
                  fontSize:"0.78rem", fontWeight:600, cursor:"pointer", transition:"all .15s", fontFamily:"'Jost',sans-serif" }}>
                {cat === "all" ? "Semua" : cat}
              </button>
            ))}
          </div>
          {/* Category filter — Mobile: satu dropdown saja */}
          <select className="fur-cat-dropdown" value={category} onChange={e=>setCategory(e.target.value)}
            style={{ display:"none", flex:"1 1 100%", height:40, border:"1.5px solid #E8DCC8", borderRadius:8, padding:"0 12px", fontSize:"0.85rem", color:darkTeal, background:"#fff", fontFamily:"'Jost',sans-serif", cursor:"pointer", outline:"none", boxSizing:"border-box" }}>
            {["all",...categories].map(cat => (
              <option key={cat} value={cat}>{cat === "all" ? "Semua Kategori" : cat}</option>
            ))}
          </select>
          {/* Sort */}
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
            style={{ flex:"0 0 auto", height:40, border:"1.5px solid #E8DCC8", borderRadius:8, padding:"0 12px", fontSize:"0.82rem", color:darkTeal, background:"#fff", fontFamily:"'Jost',sans-serif", cursor:"pointer", outline:"none" }}>
            <option value="default">Urutan Default</option>
            <option value="nama">Nama A–Z</option>
            <option value="harga_asc">Harga: Terendah</option>
            <option value="harga_desc">Harga: Tertinggi</option>
          </select>
          {/* Count */}
          <span style={{ fontSize:"0.78rem", color:"#8B9A9C", flex:"0 0 auto" }}>{filtered.length} referensi</span>
        </div>

        {/* -- Products Grid -- */}
        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"80px 20px", color:"#8B9A9C" }}>
            <div style={{ fontSize:48, marginBottom:16 }}></div>
            <p style={{ fontSize:"1.05rem", fontWeight:600, color:darkTeal }}>Belum ada referensi custom furnitur.</p>
            <p style={{ fontSize:"0.875rem", marginTop:8 }}>Referensi akan ditampilkan di sini setelah ditambahkan dari Control Panel.</p>
          </div>
        ) : (() => {
          /* Kelompokkan produk per kategori untuk divider */
          const groups = [];
          if (category !== "all") {
            groups.push({ label: null, items: filtered });
          } else {
            const seen = {};
            filtered.forEach(prod => {
              const key = prod.kategori || "Lainnya";
              if (!seen[key]) { seen[key] = []; groups.push({ label: key, items: seen[key] }); }
              seen[key].push(prod);
            });
          }
          const renderCard = (prod) => (
            <div key={prod.id} className="fur-card"
              style={{ background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:"0 2px 14px rgba(0,0,0,.07)", cursor:"pointer", display:"flex", flexDirection:"column" }}
              onMouseEnter={()=>setHoverCard(prod.id)}
              onMouseLeave={()=>setHoverCard(null)}
              onClick={()=>setDetailItem(prod)}>
              {/* Image */}
              <div className="fur-img-wrap" style={{ height:220, overflow:"hidden", background:"#F5EDD8", position:"relative" }}>
                {prod._img ? (
                  <CardImg src={prod._img} alt={prod.nama} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                    onError={e=>{onImgError(e); e.target.nextSibling.style.display="flex";}} />
                ) : null}
                <div style={{ display: prod._img ? "none" : "flex", position:"absolute", inset:0, alignItems:"center", justifyContent:"center", fontSize:48, background:"#F5EDD8" }}></div>
                {prod.kategori && (
                  <span style={{ position:"absolute", top:12, left:12, background:"rgba(46,61,63,.82)", color:"#fff", fontSize:"0.65rem", padding:"3px 10px", borderRadius:12, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", backdropFilter:"blur(4px)" }}>
                    {prod.kategori}
                  </span>
                )}
              </div>
              {/* Info */}
              <div style={{ padding:"18px 18px 20px", flex:1, display:"flex", flexDirection:"column" }}>
                <h3 style={{ fontSize:"0.9375rem", fontWeight:700, color:darkTeal, marginBottom:6, lineHeight:1.35 }}>{prod.nama}</h3>
                {prod.deskripsi && (
                  <p style={{ fontSize:"0.8rem", color:"#5A6A6C", lineHeight:1.6, flex:1, marginBottom:12, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                    {prod.deskripsi}
                  </p>
                )}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, marginTop:"auto" }}>
                  <span style={{ fontSize:"1.05rem", fontWeight:800, color:prod.harga ? "#8B6914" : "#5A6A6C", fontFamily:"'Playfair Display',serif" }}>
                    {formatRp(prod.harga)}
                  </span>
                  <button
                    className="fur-btn-wa"
                    onClick={e=>{ e.stopPropagation(); onWaOpen && onWaOpen({ key:"layanan", vars:{ judul_layanan: `Custom Furnitur — ${prod.nama}` } }); }}
                    style={{ background:`linear-gradient(135deg,${darkTeal},#3D5254)`, color:"#fff", border:"none", borderRadius:8, padding:"8px 14px", fontSize:"0.75rem", fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"'Jost',sans-serif" }}>
                    Tanya
                  </button>
                </div>
              </div>
            </div>
          );
          return (
            <div>
              {groups.map((group, gi) => (
                <div key={group.label || "all"}>
                  {group.label && (
                    <div style={{ display:"flex", alignItems:"center", gap:14, margin: gi === 0 ? "0 0 24px" : "40px 0 24px" }}>
                      <div style={{ flex:1, height:1, background:"linear-gradient(to right,#E8DCC8,transparent)" }} />
                      <div style={{ display:"flex", alignItems:"center", gap:8, background:"#FAF7F0", border:"1px solid #E8DCC8", borderRadius:20, padding:"5px 16px", flexShrink:0 }}>
                        <span style={{ fontSize:"0.68rem", fontWeight:800, letterSpacing:".12em", textTransform:"uppercase", color:accentGold }}></span>
                        <span style={{ fontSize:"0.78rem", fontWeight:700, color:darkTeal, letterSpacing:".04em" }}>{group.label}</span>
                        <span style={{ fontSize:"0.68rem", color:"#8B9A9C", fontWeight:500 }}>({group.items.length})</span>
                      </div>
                      <div style={{ flex:1, height:1, background:"linear-gradient(to left,#E8DCC8,transparent)" }} />
                    </div>
                  )}
                  <div className="fur-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24 }}>
                    {group.items.map(prod => renderCard(prod))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CUSTOM FURNITUR — Halaman Detail Referensi (full page, galeri foto + ajukan custom order)
═══════════════════════════════════════════════════════════════════ */
function CustomFurniturDetailPage({ product, onBack, onWaOpen, formatRp }) {
  const accentGold = "#C9AA71";
  const darkTeal   = "#2E3D3F";

  useEffect(() => { window.scrollTo(0, 0); }, [product?.id]);

  const gallery = (product.imgs && product.imgs.length > 0)
    ? product.imgs
    : (product._img ? [{ img: product._img, label: product.nama }] : []);

  const [activeImg, setActiveImg] = useState(0);
  const mainImg = gallery[activeImg]?.img || gallery[0]?.img || "";

  const handleRequestCustom = () => {
    onWaOpen && onWaOpen({ key: "layanan", vars: { judul_layanan: `Custom Order — ${product.nama}` } });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF7", fontFamily: "'Jost',sans-serif" }}>
      {/* Back bar */}
      <div style={{ background: `linear-gradient(90deg,${darkTeal},#3D5254)`, padding: "0 5%", position: "sticky", top: 0, zIndex: 50, borderBottom: `3px solid ${accentGold}` }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: accentGold, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", padding: "13px 0", letterSpacing: ".06em", textTransform: "uppercase" }}>
          <span style={{ fontSize: 18 }}>←</span> Kembali ke Custom Furnitur
        </button>
      </div>

      {/* Breadcrumb */}
      <div style={{ padding: "14px 5%", borderBottom: "1px solid #eee", background: "#fff" }}>
        <span style={{ fontSize: "0.78rem", color: "#8B9A9C" }}>Beranda</span>
        <span style={{ fontSize: "0.78rem", color: "#8B9A9C", margin: "0 8px" }}>›</span>
        <span style={{ fontSize: "0.78rem", color: "#8B9A9C" }}>Custom Furnitur</span>
        <span style={{ fontSize: "0.78rem", color: "#8B9A9C", margin: "0 8px" }}>›</span>
        <span style={{ fontSize: "0.78rem", color: darkTeal, fontWeight: 600 }}>{product.nama}</span>
      </div>

      <div style={{ padding: "36px 5% 64px", maxWidth: 1100, margin: "0 auto" }}>
        <div className="fur-detail-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 44, alignItems: "start" }}>

          {/* ── Galeri Foto ── */}
          <div>
            <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 10px 32px rgba(0,0,0,.12)", background: "#F5EDD8", aspectRatio: "4/3", position: "relative" }}>
              {mainImg ? (
                <CardImg src={mainImg} alt={product.nama} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={onImgError} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}></div>
              )}
            </div>

            {gallery.length > 1 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(72px,1fr))", gap: 10, marginTop: 12 }}>
                {gallery.map((g, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    style={{ padding: 0, border: i === activeImg ? `2.5px solid ${accentGold}` : "2.5px solid transparent", borderRadius: 9, overflow: "hidden", cursor: "pointer", background: "none", aspectRatio: "1/1" }}>
                    <img decoding="async" loading="lazy" src={cld(g.img)} alt={g.label || `Foto ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={e => e.target.parentElement.style.display = "none"} />
                  </button>
                ))}
              </div>
            )}
            {gallery.length === 0 && (
              <p style={{ fontSize: "0.78rem", color: "#A89070", marginTop: 10, textAlign: "center" }}>Belum ada foto untuk referensi ini.</p>
            )}
          </div>

          {/* ── Info & Ajukan Custom Order ── */}
          <div>
            {product.kategori && (
              <span style={{ display: "inline-block", background: "#FAF7F0", color: "#8B6914", fontSize: "0.68rem", padding: "4px 13px", borderRadius: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 14, border: "1px solid #E8DCC8" }}>
                {product.kategori}
              </span>
            )}
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: darkTeal, margin: "0 0 12px", fontFamily: "'Playfair Display',serif", lineHeight: 1.25 }}>
              {product.nama}
            </h1>
            <div style={{ fontSize: "1.55rem", fontWeight: 800, color: "#8B6914", fontFamily: "'Playfair Display',serif", marginBottom: 6 }}>
              {formatRp(product.harga)}
            </div>
            <p style={{ fontSize: "0.75rem", color: "#8B9A9C", marginBottom: 22 }}>
              Harga estimasi referensi — harga final tergantung ukuran, material, dan spesifikasi custom yang Anda pilih.
            </p>

            {product.deskripsi && (
              <div style={{ marginBottom: 26 }}>
                <div style={{ fontSize: "0.65rem", letterSpacing: ".1em", textTransform: "uppercase", color: accentGold, fontWeight: 800, marginBottom: 8 }}>Deskripsi</div>
                <p style={{ fontSize: "0.92rem", color: "#5A6A6C", lineHeight: 1.85, whiteSpace: "pre-line" }}>{product.deskripsi}</p>
              </div>
            )}

            {/* ── Form Ajukan Custom Order ── */}
            <div style={{ background: "#fff", border: `1.5px solid #E8DCC8`, borderRadius: 14, padding: "22px 24px", marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}></span>
                <div style={{ fontWeight: 800, fontSize: "0.95rem", color: darkTeal }}>Ajukan Custom Order</div>
              </div>
              <p style={{ fontSize: "0.8rem", color: "#5A6A6C", lineHeight: 1.65, marginBottom: 16 }}>
                Suka referensi ini? Sebutkan ukuran, warna, dan material yang Anda inginkan — tim kami akan buatkan sesuai kebutuhan Anda.
              </p>
              <button onClick={handleRequestCustom}
                style={{ width: "100%", background: "linear-gradient(135deg,#25D366,#128C7E)", color: "#fff", border: "none", borderRadius: 10, padding: "14px 24px", fontSize: "0.92rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Jost',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                Ajukan Custom Order via WhatsApp
              </button>
            </div>

            <button onClick={() => onWaOpen && onWaOpen({ key: "layanan", vars: { judul_layanan: `Custom Furnitur — ${product.nama}` } })}
              style={{ width: "100%", marginTop: 10, background: "#FAF7F0", color: darkTeal, border: "1.5px solid #E8DCC8", borderRadius: 10, padding: "12px 20px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Jost',sans-serif" }}>
              Tanya Referensi Ini
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .fur-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export { CustomFurniturDetailPage, CustomFurniturPage, FurniturDetailPage, FurniturPage };
