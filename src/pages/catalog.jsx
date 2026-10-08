/* Chunk halaman "catalog" — dimuat lazy (React.lazy) saat rute ini dibuka.
   Dipisah dari RealEstateWeb.jsx agar pengunjung halaman lain tidak ikut mengunduh kode ini. */
import React, { useState, useEffect } from "react";
import { cld } from "../lib/net.js";
import { CardImg, INT_PAGE_CRUD_KEY, SocialProofCTA, catalogItemUrl, makeSlug, onImgError } from "../app/core.jsx";
import { CATALOG_DATA } from "../data/catalog.js";
/** Slug produk katalog (Plafon, Pagar, Kanopi, dll): pakai field slug kalau sudah ada, kalau tidak generate dari nama */
const catalogItemSlugOf = (item) => item?.slug || makeSlug(item?.nama || item?.id || "produk");

/* ─────────────── REUSABLE SERVICE PAGE TEMPLATE ─────────────── */
function DevServicePage({ pageKey, title, subtitle, icon, heroColor, sections, ctaText, onWaOpen }) {
  const waText = { key: "layanan", vars: { judul_layanan: title } };
  return (
    <div style={{ paddingTop: 72, minHeight: "100vh", background: "#f8fbfd" }}>
      {/* Hero Banner */}
      <div style={{
        background: heroColor || "linear-gradient(135deg,#2E3D3F 0%,#3D5254 50%,#B8962A 100%)",
        padding: "64px 5% 56px", textAlign: "center", position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.08, backgroundImage: "radial-gradient(circle at 20% 50%, #fff 0%, transparent 50%), radial-gradient(circle at 80% 20%, #fff 0%, transparent 40%)" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: 16 }}>{icon}</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 900, color: "#fff", marginBottom: 16, lineHeight: 1.2 }}>{title}</h1>
          <p style={{ fontSize: "clamp(0.9rem,2vw,1.1rem)", color: "rgba(255,255,255,.85)", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 28px" }}>{subtitle}</p>
          <button onClick={() => onWaOpen && onWaOpen(waText)}
            style={{ padding: "13px 32px", background: "#e8a020", color: "#fff", border: "none", borderRadius: 4, fontSize: "0.875rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,.25)" }}>
            {ctaText || "Konsultasi Gratis →"}
          </button>
        </div>
      </div>

      {/* Content Sections */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 5%" }}>
        {sections.map((sec, i) => (
          <div key={i} style={{ marginBottom: 56 }}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
              <div style={{ width: 4, height: 40, background: "linear-gradient(180deg,#8B6914,#B8962A)", borderRadius: 4, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "0.7rem", letterSpacing: ".14em", textTransform: "uppercase", color: "#8B6914", fontWeight: 700, marginBottom: 4 }}>{sec.tag || `Layanan ${String(i+1).padStart(2,"0")}`}</div>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.25rem,3vw,1.75rem)", fontWeight: 900, color: "#2E3D3F", lineHeight: 1.25 }}>{sec.title}</h2>
              </div>
            </div>

            {/* Cards grid */}
            {sec.items && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 20 }}>
                {sec.items.map((item, j) => (
                  <div key={j} style={{
                    background: "#fff", borderRadius: 12, padding: "24px 22px",
                    boxShadow: "0 2px 14px rgba(0,0,0,.07)", border: "1px solid #e8f4fb",
                    transition: "transform .2s, box-shadow .2s",
                    cursor: "default"
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 8px 28px rgba(8,145,178,.18)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 2px 14px rgba(0,0,0,.07)"; }}>
                    <div style={{ fontSize: "2rem", marginBottom: 12 }}>{item.icon}</div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#2E3D3F", marginBottom: 8 }}>{item.title}</h3>
                    <p style={{ fontSize: "0.875rem", color: "#5A6A6C", lineHeight: 1.65, whiteSpace: "pre-line" }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Prose */}
            {sec.prose && (
              <p style={{ fontSize: "1rem", color: "#2a4a5e", lineHeight: 1.8, maxWidth: 780 }}>{sec.prose}</p>
            )}
          </div>
        ))}

        {/* Contoh postingan lebih lanjut — Instagram & YouTube */}
        <SocialProofCTA />

        {/* CTA Banner */}
        <div style={{ background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 50%,#8B6914 100%)", borderRadius: 16, padding: "40px 40px", textAlign: "center", boxShadow: "0 8px 32px rgba(8,145,178,.25)" }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", fontWeight: 900, color: "#fff", marginBottom: 12 }}>Siap Wujudkan Proyek Anda?</h3>
          <p style={{ color: "rgba(255,255,255,.85)", marginBottom: 24, fontSize: "0.95rem" }}>Konsultasikan kebutuhan Anda bersama tim ahli kami — gratis & tanpa komitmen.</p>
          <button onClick={() => onWaOpen && onWaOpen(waText)}
            style={{ padding: "13px 36px", background: "#e8a020", color: "#fff", border: "none", borderRadius: 4, fontSize: "0.875rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer" }}>
            Hubungi Kami via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Page: Interior ── */
function InteriorPage({ onWaOpen }) {
  return <DevServicePage
    pageKey="interior"
    title="Desain Interior"
    subtitle="Wujudkan interior impian Anda — dari teras hingga kamar tidur, setiap ruang dirancang indah, fungsional, dan mencerminkan kepribadian Anda."
    icon=""
    heroColor="linear-gradient(135deg,#4a1942 0%,#7b3f8a 50%,#b565c0 100%)"
    onWaOpen={onWaOpen}
    sections={[
      {
        tag: "Ruang Utama",
        title: "Layanan Desain Interior Lengkap",
        items: [
          { icon: "", title: "Plafon Modern", desc: "Desain plafon kreatif — drop ceiling, gypsum, kayu, dan pencahayaan tersembunyi (hidden lamp)." },
          { icon: "", title: "Kitchen Set", desc: "Dapur impian dengan kabinet custom, material tahan lama, dan ergonomis untuk memasak." },
          { icon: "", title: "Backdrop", desc: "Feature wall TV yang menjadi focal point ruangan — material batu alam, kayu, panel 3D, dll." },
          { icon: "", title: "Teras", desc: "Desain teras yang menyambut — kombinasi material, pencahayaan, dan tanaman hias yang harmonis." },
          { icon: "", title: "Ruang Tamu", desc: "Furnitur elegan, layout optimal, dan dekorasi yang menciptakan kesan pertama yang kuat." },
          { icon: "", title: "Ruang Keluarga", desc: "Ruang hangat dan fungsional untuk quality time keluarga dengan konsep cozy living." },
          { icon: "", title: "Kamar Tidur", desc: "Desain kamar nyaman dan personal — dari master bedroom hingga kamar anak yang kreatif." },
          { icon: "", title: "Kamar Mandi", desc: "Bathroom modern dengan material premium, pencahayaan spa, dan layout yang efisien." },
        ]
      },
      {
        tag: "Proses Kerja",
        title: "Alur Proyek Interior",
        items: [
          { icon: "", title: "Survei & Ukur", desc: "Tim kami datang langsung ke lokasi untuk mengukur dan memahami kondisi lapangan." },
          { icon: "", title: "Konsep & 3D Visual", desc: "Presentasi desain 3D lengkap sebelum eksekusi agar Anda tahu hasilnya." },
          { icon: "", title: "Eksekusi & Finishing", desc: "Pengerjaan oleh tenaga ahli berpengalaman dengan quality control ketat." },
        ]
      }
    ]}
  />;
}

/* ── Page: Pagar Rumah ── */
function PagarPage({ onWaOpen }) {
  return <DevServicePage
    pageKey="pagar"
    title="Pagar Rumah"
    subtitle="Pagar bukan sekadar keamanan — ini ekspresi pertama rumah Anda. Kami menghadirkan pagar yang kokoh, estetis, dan sesuai karakter hunian Anda."
    icon=""
    heroColor="linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)"
    onWaOpen={onWaOpen}
    sections={[
      {
        tag: "Jenis Pagar",
        title: "Pilihan Model & Material Pagar",
        items: [
          { icon: "", title: "Pagar Besi Tempa", desc: "Klasik dan kokoh, tersedia berbagai motif ornamen — cocok untuk rumah gaya Eropa atau klasik." },
          { icon: "", title: "Pagar Hollow Minimalis", desc: "Garis bersih dari besi hollow finishing cat duco — populer untuk rumah modern minimalis." },
          { icon: "", title: "Pagar Panel Kayu + Besi", desc: "Kombinasi kayu solid/WPC dengan rangka besi — kesan natural namun tetap modern dan tahan lama." },
          { icon: "", title: "Pagar Tembok + Ornamen", desc: "Dinding bata/batako finishing plester dengan sisipan ornamen besi atau roster kerawang." },
          { icon: "", title: "Pintu Gerbang Otomatis", desc: "Gate geser/lipat dengan motor otomatis dan remote control untuk kemudahan akses." },
          { icon: "", title: "Pagar Stainless Steel", desc: "Tampilan premium dan anti karat — pilihan ideal untuk hunian mewah dan eksklusif." },
        ]
      },
      {
        tag: "Proses",
        title: "Cara Kerja Kami",
        items: [
          { icon: "", title: "Survei & Desain", desc: "Pengukuran lokasi dan presentasi desain 3D sebelum produksi dimulai." },
          { icon: "", title: "Fabrikasi Custom", desc: "Diproduksi sesuai ukuran dan desain di workshop kami dengan standar kualitas tinggi." },
          { icon: "", title: "Instalasi & Finishing", desc: "Pemasangan oleh tim terlatih, termasuk cat, galvanis, atau finishing sesuai spesifikasi." },
        ]
      }
    ]}
  />;
}

/* ── Page: Kanopi ── */
function KanopiPage({ onWaOpen }) {
  return <DevServicePage
    pageKey="kanopi"
    title="Kanopi"
    subtitle="Lindungi carport, teras, atau area outdoor Anda dengan kanopi yang fungsional dan estetis. Berbagai material dan model tersedia sesuai kebutuhan."
    icon=""
    heroColor="linear-gradient(135deg,#1b4332 0%,#2d6a4f 50%,#52b788 100%)"
    onWaOpen={onWaOpen}
    sections={[
      {
        tag: "Jenis Kanopi",
        title: "Model & Material Kanopi",
        items: [
          { icon: "", title: "Kanopi Polycarbonate", desc: "Ringan, tembus cahaya, dan tahan UV. Pilihan paling populer untuk carport dan teras." },
          { icon: "", title: "Kanopi Rangka Besi Hollow", desc: "Struktur kokoh dari besi hollow galvanis dengan penutup atap polycarbonate atau spandek." },
          { icon: "", title: "Kanopi Alderon / UPVC", desc: "Material anti karat, ringan, dan estetis — tidak perlu cat ulang, perawatan minimal." },
          { icon: "", title: "Kanopi Atap Kaca", desc: "Tampilan premium dan modern, memaksimalkan cahaya alami sekaligus terlindungi dari hujan." },
          { icon: "", title: "Kanopi Custom Laser Cut", desc: "Ornamen plat besi dengan pola custom dipotong laser untuk sentuhan artistik yang unik." },
          { icon: "", title: "Kanopi Alderon (HPL)", desc: "Panel HPL berwarna-warni untuk tampilan modern dan colorful sesuai selera." },
        ]
      },
      {
        tag: "Area Aplikasi",
        title: "Dimana Kanopi Dipasang?",
        items: [
          { icon: "", title: "Carport / Garasi", desc: "Pelindung kendaraan dari panas dan hujan sekaligus mempercantik area depan rumah." },
          { icon: "", title: "Teras Belakang / Balkon", desc: "Jadikan teras sebagai ruang outdoor yang nyaman sepanjang hari sepanjang tahun." },
          { icon: "", title: "Ruko & Komersial", desc: "Kanopi teras ruko, restoran, atau kafe yang meningkatkan daya tarik eksterior bisnis." },
        ]
      }
    ]}
  />;
}

/* ── Page: Aluminium ── */
function AluminiumPage({ onWaOpen }) {
  return <DevServicePage
    pageKey="aluminium"
    title="Aluminium"
    subtitle="Kusen, pintu, jendela, dan partisi aluminium berkualitas tinggi — ringan, anti karat, dan tersedia dalam berbagai profil dan warna finishing."
    icon=""
    heroColor="linear-gradient(135deg,#2b2d42 0%,#555b6e 50%,#8d99ae 100%)"
    onWaOpen={onWaOpen}
    sections={[
      {
        tag: "Produk Aluminium",
        title: "Rangkaian Produk Aluminium Kami",
        items: [
          { icon: "", title: "Kusen & Jendela Aluminium", desc: "Anti karat, tidak perlu dicat ulang, dan tersedia sistem swing, casement, maupun sliding." },
          { icon: "", title: "Pintu Aluminium", desc: "Ringan namun kuat — pilihan ideal untuk pintu kamar mandi, balkon, dan eksterior." },
          { icon: "", title: "Partisi Aluminium & Kaca", desc: "Pembatas ruang kantor atau rumah yang elegan dan mudah disesuaikan." },
          { icon: "", title: "Fasad Aluminium Composite", desc: "ACP (Aluminium Composite Panel) untuk cladding fasad eksterior modern dan premium." },
          { icon: "", title: "Canopy Aluminium", desc: "Kanopi dari profil aluminium ekstrusi — ringan, anti karat, dan estetis." },
          { icon: "", title: "Railing & Handrail", desc: "Pegangan tangga dan railing balkon dari aluminium finishing powder coat aneka warna." },
        ]
      },
      {
        tag: "Keunggulan",
        title: "Mengapa Memilih Aluminium?",
        items: [
          { icon: "", title: "Anti Karat & Tahan Lama", desc: "Tidak berkarat meski terpapar hujan dan panas ekstrem — perawatan minimal, usia panjang." },
          { icon: "", title: "Ringan & Kuat", desc: "Ratio kekuatan-bobot tinggi sehingga tidak membebani struktur bangunan." },
          { icon: "", title: "Aneka Pilihan Warna", desc: "Finishing powder coat dengan ratusan pilihan warna agar cocok dengan tema hunian Anda." },
        ]
      }
    ]}
  />;
}

function SubPageCatalog({ pageKey, heroColor, heroIcon, title, subtitle, breadcrumb, catalogData, onWaOpen, navigateTo, satuan, itemSlug, openItem, closeItem }) {
  const [hoverId, setHoverId] = useState(null);
  // Fallback lokal dipakai kalau parent belum kasih openItem/closeItem (mis. dipanggil dari konteks lain)
  const [localDetailItem, setLocalDetailItem] = useState(null);

  const formatHarga = (n) => {
    if (!n || n === 0) return "Hubungi Kami";
    const suffix = satuan ? ` / ${satuan}` : "";
    return "Mulai Rp " + Number(n).toLocaleString("id-ID") + suffix;
  };

  /* Item aktif: resolve dari slug URL (bisa di-share/bookmark) kalau tersedia, atau dari state lokal */
  const detailItem = itemSlug
    ? (catalogData.find(it => catalogItemSlugOf(it) === itemSlug) || null)
    : localDetailItem;

  const handleOpenItem = (item) => {
    if (openItem && pageKey) openItem(pageKey, catalogItemSlugOf(item));
    else setLocalDetailItem(item);
  };
  const handleCloseItem = () => {
    if (closeItem) closeItem();
    else setLocalDetailItem(null);
  };

  /* Jika item dipilih → tampilkan halaman detail penuh, ganti seluruh konten grid */
  if (detailItem) {
    return <SubPageCatalogDetailPage item={detailItem} pageKey={pageKey} onBack={handleCloseItem} onWaOpen={onWaOpen} formatHarga={formatHarga} breadcrumb={breadcrumb} navigateTo={navigateTo} />;
  }
  /* Slug ada di URL tapi item-nya tidak ditemukan (link salah / produk sudah dihapus admin) */
  if (itemSlug && !detailItem) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 5%", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: 16 }}></div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.4rem", fontWeight: 800, color: "#2E3D3F", margin: "0 0 10px" }}>Produk Tidak Ditemukan</h2>
        <p style={{ color: "#5A6A6C", fontSize: "0.9rem", maxWidth: 420, marginBottom: 24 }}>Link yang Anda buka mungkin salah, atau produk ini sudah tidak tersedia.</p>
        <button onClick={handleCloseItem} style={{ padding: "12px 28px", background: "#2E3D3F", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
          ← Lihat Semua Produk
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"#FAFAF8" }}>
      <style>{`
        /* Desktop: pindahkan tombol Konsultasi ke bawah Harga (bukan sejajar di samping) */
        @media (min-width: 701px) {
          .item-price-row { flex-direction: column !important; align-items: stretch !important; gap: 10px; }
          .item-consult-btn { width: 100% !important; padding: 10px 16px !important; }
        }
      `}</style>
      {/* -- HERO -- */}
      <div style={{ background: heroColor || "linear-gradient(135deg,#2E3D3F 0%,#8B6914 100%)", padding:"72px 5% 56px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.18)" }}/>
        <div style={{ position:"relative", zIndex:1, maxWidth:760, margin:"0 auto" }}>
          {/* Breadcrumb */}
          {breadcrumb && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginBottom:20, flexWrap:"wrap" }}>
              {breadcrumb.map((b, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span style={{ color:"rgba(255,255,255,.5)", fontSize:"0.75rem" }}>/</span>}
                  {b.page ? (
                    <button onClick={()=>navigateTo(b.page)}
                      style={{ background:"none", border:"none", color:"rgba(255,255,255,.7)", fontSize:"0.75rem", cursor:"pointer", padding:0, letterSpacing:".06em" }}>
                      {b.label}
                    </button>
                  ) : (
                    <span style={{ color:"#C9AA71", fontSize:"0.75rem", fontWeight:700, letterSpacing:".06em" }}>{b.label}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
          <div style={{ fontSize:"clamp(2.5rem,8vw,4rem)", marginBottom:16 }}>{heroIcon}</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.75rem,5vw,2.75rem)", fontWeight:900, color:"#fff", margin:"0 0 16px", lineHeight:1.2 }}>{title}</h1>
          <p style={{ fontSize:"clamp(0.875rem,2vw,1rem)", color:"rgba(255,255,255,.8)", lineHeight:1.8, margin:0 }}>{subtitle}</p>
        </div>
      </div>

      {/* -- CATALOG GRID -- */}
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"60px 5% 80px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:28 }}>
          {catalogData.map((item) => (
            <div key={item.id}
              style={{ background:"#fff", borderRadius:16, overflow:"hidden", boxShadow:hoverId===item.id?"0 16px 48px rgba(0,0,0,.14)":"0 4px 16px rgba(0,0,0,.07)", transition:"all .3s cubic-bezier(.4,0,.2,1)", transform:hoverId===item.id?"translateY(-6px)":"translateY(0)", cursor:"pointer", border:"1px solid #F0EDE8" }}
              onMouseEnter={()=>setHoverId(item.id)}
              onMouseLeave={()=>setHoverId(null)}
              onClick={()=>handleOpenItem(item)}>

              {/* Foto */}
              <div style={{ position:"relative", height:200, overflow:"hidden", background:"#E8DCC8" }}>
                {item.img ? (
                  <CardImg src={item.img} alt={item.nama}
                    style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform .5s", transform:hoverId===item.id?"scale(1.07)":"scale(1)" }}
                    onError={e=>{e.target.parentElement.style.background="#E8DCC8"; onImgError(e);}} />
                ) : (
                  <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"3rem", opacity:0.4 }}>
                    {item.icon || ""}
                  </div>
                )}
                {/* Badge Style */}
                {item.style && (
                  <div style={{ position:"absolute", top:12, left:12, background:"rgba(46,61,63,.85)", backdropFilter:"blur(8px)", color:"#C9AA71", fontSize:"0.65rem", fontWeight:800, letterSpacing:".1em", textTransform:"uppercase", padding:"4px 10px", borderRadius:20 }}>
                    {item.style}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding:"20px 20px 22px" }}>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1rem", fontWeight:800, color:"#2E3D3F", margin:"0 0 8px", lineHeight:1.35 }}>{item.nama}</h3>
                {item.material && (
                  <div style={{ fontSize:"0.75rem", color:"#8B9A9C", marginBottom:8, display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ color:"#C9AA71" }}>◆</span> {item.material}
                  </div>
                )}
                {item.desc && (
                  <p style={{ fontSize:"0.82rem", color:"#5A6A6C", lineHeight:1.65, margin:"0 0 14px", whiteSpace:"pre-line" }}>{item.desc}</p>
                )}
                {/* Fitur list */}
                {item.fitur && item.fitur.length > 0 && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
                    {item.fitur.slice(0,3).map((f,i) => (
                      <span key={i} style={{ background:"#FAF7F0", border:"1px solid #E8DCC8", color:"#5A6A6C", fontSize:"0.68rem", padding:"3px 8px", borderRadius:20 }}>{f}</span>
                    ))}
                  </div>
                )}
                {item.tampilHarga === false ? (
                  <div style={{ paddingTop:14, borderTop:"1px solid #F0EDE8" }}>
                    <button onClick={(e)=>{ e.stopPropagation(); onWaOpen && onWaOpen({ key: "layanan", vars: { judul_layanan: item.nama } }); }}
                      style={{ width:"100%", background:"linear-gradient(135deg,#2E3D3F,#8B6914)", color:"#fff", border:"none", borderRadius:8, padding:"11px 16px", fontSize:"0.8rem", fontWeight:700, cursor:"pointer", letterSpacing:".04em" }}>
                      Konsultasi Sekarang
                    </button>
                  </div>
                ) : (
                  <div className="item-price-row" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:14, borderTop:"1px solid #F0EDE8" }}>
                    <div>
                      <div style={{ fontSize:"0.65rem", color:"#8B9A9C", letterSpacing:".06em", textTransform:"uppercase", marginBottom:2 }}>Harga</div>
                      <div style={{ fontSize:"0.9rem", fontWeight:800, color:"#8B6914" }}>{formatHarga(getHargaDetailLowest(item) ?? item.harga)}</div>
                    </div>
                    <button className="item-consult-btn" onClick={(e)=>{ e.stopPropagation(); onWaOpen && onWaOpen({ key: "layanan", vars: { judul_layanan: item.nama } }); }}
                      style={{ background:"linear-gradient(135deg,#2E3D3F,#8B6914)", color:"#fff", border:"none", borderRadius:8, padding:"9px 16px", fontSize:"0.75rem", fontWeight:700, cursor:"pointer", letterSpacing:".04em" }}>
                      Konsultasi
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Contoh postingan lebih lanjut — Instagram & YouTube */}
        <SocialProofCTA />

        {/* CTA Bottom */}
        <div style={{ textAlign:"center", marginTop:56, padding:"40px 24px", background:"linear-gradient(135deg,#2E3D3F 0%,#1a2526 100%)", borderRadius:20, color:"#fff" }}>
          <div style={{ fontSize:"0.75rem", letterSpacing:".14em", textTransform:"uppercase", color:"#C9AA71", fontWeight:700, marginBottom:12 }}>Konsultasi Gratis</div>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.25rem,3vw,1.75rem)", fontWeight:900, margin:"0 0 12px" }}>Tidak menemukan yang sesuai?</h3>
          <p style={{ color:"rgba(255,255,255,.7)", fontSize:"0.875rem", margin:"0 0 24px", lineHeight:1.7 }}>Kami siap membuat desain custom sesuai kebutuhan dan budget Anda.</p>
          <button onClick={()=>onWaOpen && onWaOpen({ key: "konsultasi", vars: {} })}
            style={{ background:"#C9AA71", color:"#2E3D3F", border:"none", borderRadius:10, padding:"14px 32px", fontSize:"0.9rem", fontWeight:800, cursor:"pointer", letterSpacing:".05em" }}>
            Konsultasi Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SUB PAGE CATALOG — Halaman Detail Item (full page, galeri foto + request custom)
   Dipakai oleh semua sub-halaman Interior & Eksterior (Kamar Tidur, Kamar Mandi,
   Ruang Keluarga, Ruang Tamu, Kitchen Set, Ruang Kerja, Plafon, Pagar, Kanopi, Aluminium, dst.)
═══════════════════════════════════════════════════════════════════ */
function SubPageCatalogDetailPage({ item, pageKey, onBack, onWaOpen, formatHarga, breadcrumb, navigateTo }) {
  const accentGold = "#C9AA71";
  const darkTeal   = "#2E3D3F";
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, [item?.id]);

  const shareItemLink = () => {
    if (!pageKey) return;
    const url = window.location.origin + catalogItemUrl(pageKey, catalogItemSlugOf(item));
    const shareData = { title: `${item.nama} — HIKIMORI CONST`, text: `Lihat produk ${item.nama} dari HIKIMORI CONST:`, url };

    /* Prioritaskan native share sheet (WhatsApp/Instagram/dll langsung muncul di device),
       fallback ke copy clipboard biasa kalau browser tidak mendukung Web Share API. */
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

  /* Galeri: pakai imgs[] kalau ada (multi-foto), fallback ke img tunggal */
  const gallery = (item.imgs && item.imgs.length > 0)
    ? item.imgs
    : (item.img ? [{ img: item.img, label: item.nama }] : []);

  const [activeImg, setActiveImg] = useState(0);
  const mainImg = gallery[activeImg]?.img || gallery[0]?.img || "";

  const handleRequestCustom = () => {
    onWaOpen && onWaOpen({ key: "layanan", vars: { judul_layanan: `Request Custom — ${item.nama}` } });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF7", fontFamily: "'Jost',sans-serif" }}>
      {/* Back bar */}
      <div style={{ background: `linear-gradient(90deg,${darkTeal},#3D5254)`, padding: "0 5%", position: "sticky", top: 0, zIndex: 50, borderBottom: `3px solid ${accentGold}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: accentGold, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", padding: "13px 0", letterSpacing: ".06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          <span style={{ fontSize: 18 }}>←</span> Kembali ke Katalog
        </button>
        {pageKey && (
          <button onClick={shareItemLink} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.2)", color: linkCopied ? "#8BD9A0" : "#fff", fontWeight: 700, fontSize: "0.72rem", cursor: "pointer", padding: "6px 12px", borderRadius: 20, letterSpacing: ".04em", whiteSpace: "nowrap", flexShrink: 0 }}>
            <span></span> <span>{linkCopied ? "Link disalin!" : "Bagikan"}</span>
          </button>
        )}
      </div>

      {/* Breadcrumb */}
      {breadcrumb && (
        <div style={{ padding: "14px 5%", borderBottom: "1px solid #eee", background: "#fff" }}>
          {breadcrumb.map((b, i) => (
            <span key={i}>
              {i > 0 && <span style={{ fontSize: "0.78rem", color: "#8B9A9C", margin: "0 8px" }}>›</span>}
              {b.page ? (
                <button onClick={() => navigateTo && navigateTo(b.page)} style={{ background: "none", border: "none", padding: 0, fontSize: "0.78rem", color: "#8B9A9C", cursor: "pointer" }}>{b.label}</button>
              ) : (
                <span style={{ fontSize: "0.78rem", color: "#8B9A9C" }}>{b.label}</span>
              )}
            </span>
          ))}
          <span style={{ fontSize: "0.78rem", color: "#8B9A9C", margin: "0 8px" }}>›</span>
          <span style={{ fontSize: "0.78rem", color: darkTeal, fontWeight: 600 }}>{item.nama}</span>
        </div>
      )}

      <div style={{ padding: "36px 5% 64px", maxWidth: 1100, margin: "0 auto" }}>
        <div className="catalog-detail-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 44, alignItems: "start" }}>

          {/* ── Galeri Foto ── */}
          <div>
            <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 10px 32px rgba(0,0,0,.12)", background: "#F5EDD8", aspectRatio: "4/3", position: "relative" }}>
              {mainImg ? (
                <img decoding="async" loading="lazy" src={cld(mainImg)} alt={item.nama} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={onImgError} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>{item.icon || ""}</div>
              )}
              {item.style && (
                <div style={{ position: "absolute", top: 14, left: 14, background: "rgba(46,61,63,.85)", backdropFilter: "blur(8px)", color: accentGold, fontSize: "0.65rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", padding: "4px 12px", borderRadius: 20 }}>
                  {item.style}
                </div>
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
              <p style={{ fontSize: "0.78rem", color: "#A89070", marginTop: 10, textAlign: "center" }}>Belum ada foto untuk item ini.</p>
            )}
          </div>

          {/* ── Info & Request Custom ── */}
          <div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: darkTeal, margin: "0 0 8px", fontFamily: "'Playfair Display',serif", lineHeight: 1.25 }}>
              {item.nama}
            </h1>
            {item.material && (
              <div style={{ fontSize: "0.82rem", color: "#8B9A9C", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: accentGold }}>◆</span> {item.material}
              </div>
            )}
            {item.tampilHarga !== false && (
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#8B6914", fontFamily: "'Playfair Display',serif", marginBottom: item.hargaDetail?.aktif && item.hargaDetail.items?.length > 0 ? 6 : 18 }}>
                {formatHarga(getHargaDetailLowest(item) ?? item.harga)}
              </div>
            )}

            {/* ── Rincian Harga Per M² (kalau diaktifkan admin) ── */}
            {item.tampilHarga !== false && item.hargaDetail?.aktif && item.hargaDetail.items?.length > 0 && (
              <div style={{ background: "#FAF7F0", border: "1.5px solid #E8DCC8", borderRadius: 12, padding: "16px 18px", marginBottom: 22 }}>
                <div style={{ fontSize: "0.65rem", letterSpacing: ".1em", textTransform: "uppercase", color: accentGold, fontWeight: 800, marginBottom: 10 }}>Rincian Harga per Kombinasi</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {item.hargaDetail.items.map((it, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 8, fontSize: "0.84rem", color: "#3D4D4F", lineHeight: 1.6 }}>
                      <span style={{ color: accentGold, flexShrink: 0 }}>◦</span>
                      <span><strong>{it.label}</strong>: {fmtHargaRange(it.min, it.max)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {item.fitur && item.fitur.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 20 }}>
                {item.fitur.map((f, i) => (
                  <span key={i} style={{ background: "#FAF7F0", border: "1px solid #E8DCC8", color: "#5A6A6C", fontSize: "0.74rem", padding: "4px 11px", borderRadius: 20 }}>{f}</span>
                ))}
              </div>
            )}

            {(item.desc || item.deskripsi) && (
              <div style={{ marginBottom: 26 }}>
                <div style={{ fontSize: "0.65rem", letterSpacing: ".1em", textTransform: "uppercase", color: accentGold, fontWeight: 800, marginBottom: 8 }}>Deskripsi</div>
                <p style={{ fontSize: "0.92rem", color: "#5A6A6C", lineHeight: 1.85, whiteSpace: "pre-line" }}>{item.desc || item.deskripsi}</p>
              </div>
            )}

            {item.poin && item.poin.length > 0 && (
              <div style={{ background: "#FAF7F0", border: "1.5px solid #E8DCC8", borderRadius: 12, padding: "18px 20px", marginBottom: 26 }}>
                <div style={{ fontSize: "0.65rem", letterSpacing: ".1em", textTransform: "uppercase", color: accentGold, fontWeight: 800, marginBottom: 12 }}>Yang Anda Dapatkan Dalam Paket Ini</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {item.poin.map((p, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <span style={{ width: 18, height: 18, borderRadius: "50%", background: accentGold + "33", color: darkTeal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.62rem", fontWeight: 900, flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span style={{ fontSize: "0.86rem", color: "#3D4D4F", lineHeight: 1.6 }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Form Request Custom ── */}
            <div style={{ background: "#fff", border: `1.5px solid #E8DCC8`, borderRadius: 14, padding: "22px 24px", marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}></span>
                <div style={{ fontWeight: 800, fontSize: "0.95rem", color: darkTeal }}>Request Custom</div>
              </div>
              <p style={{ fontSize: "0.8rem", color: "#5A6A6C", lineHeight: 1.65, marginBottom: 16 }}>
                Ingin ukuran, material, atau desain berbeda dari contoh ini? Kirim permintaan custom langsung ke tim kami via WhatsApp.
              </p>
              <button onClick={handleRequestCustom}
                style={{ width: "100%", background: "linear-gradient(135deg,#25D366,#128C7E)", color: "#fff", border: "none", borderRadius: 10, padding: "14px 24px", fontSize: "0.92rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Jost',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                Request Custom via WhatsApp
              </button>
            </div>

            <button onClick={() => onWaOpen && onWaOpen({ key: "layanan", vars: { judul_layanan: item.nama } })}
              style={{ width: "100%", marginTop: 10, background: "#FAF7F0", color: darkTeal, border: "1.5px solid #E8DCC8", borderRadius: 10, padding: "12px 20px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Jost',sans-serif" }}>
              Konsultasi Item Ini
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .catalog-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// Konversi item Firestore (field desc, fitur string) → format SubPageCatalog (field desc, fitur array)
function normalizeIntItem(item) {
  return {
    ...item,
    img: item._img || item.img || "",
    harga: item.harga ? parseFloat(String(item.harga).replace(/[^0-9.]/g,"")) || 0 : 0,
    fitur: typeof item.fitur === "string"
      ? item.fitur.split(",").map(s=>s.trim()).filter(Boolean)
      : (item.fitur || []),
    poin: typeof item.poin === "string"
      ? item.poin.split("\n").map(s=>s.trim()).filter(Boolean)
      : (item.poin || []),
    tampilHarga: item.tampilHarga !== undefined ? !!item.tampilHarga : true,
    hargaDetail: item.hargaDetail && typeof item.hargaDetail === "object" ? item.hargaDetail : { aktif: false, items: [] },
  };
}

/** Harga terendah dari rincian harga per-m² (kalau aktif) — dipakai sebagai harga utama
    yang tampil di kartu produk SEBELUM pengunjung klik "Lihat Detail". */
function getHargaDetailLowest(item) {
  if (item?.hargaDetail?.aktif && Array.isArray(item.hargaDetail.items) && item.hargaDetail.items.length > 0) {
    const mins = item.hargaDetail.items.map(it => Number(it.min) || 0).filter(n => n > 0);
    if (mins.length > 0) return Math.min(...mins);
  }
  return null;
}

/** Format satu baris rincian harga: "Rp300.000–450.000" atau "Rp300.000" kalau tanpa rentang */
function fmtHargaRange(min, max) {
  const fmt = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");
  if (max && Number(max) > Number(min)) return `${fmt(min)}–${fmt(max)}`;
  return fmt(min);
}

function SubInteriorPage({ pageKey, onWaOpen, navigateTo, data, itemSlug, openItem, closeItem }) {
  useEffect(()=>{ window.scrollTo(0,0); },[pageKey]);
  const config = CATALOG_DATA[pageKey];
  if (!config) return <div style={{padding:80,textAlign:"center"}}>Halaman tidak ditemukan.</div>;

  // Ambil dari Firestore dulu, fallback ke CATALOG_DATA hardcoded
  const crudKey = INT_PAGE_CRUD_KEY[pageKey];
  const firestoreItems = data && crudKey && data[crudKey] && data[crudKey].length > 0
    ? data[crudKey].filter(it => !it.hidden).map(normalizeIntItem)
    : null;
  const catalogItems = firestoreItems || config.items;

  return <SubPageCatalog
    pageKey={pageKey}
    heroColor={config.heroColor} heroIcon={config.heroIcon}
    title={config.title} subtitle={config.subtitle}
    breadcrumb={config.breadcrumb}
    catalogData={catalogItems}
    satuan={config.satuan || null}
    onWaOpen={onWaOpen} navigateTo={navigateTo}
    itemSlug={itemSlug} openItem={openItem} closeItem={closeItem}
  />;
}

/* ── Router: Eksterior sub-pages juga pakai component yang sama ── */
const SubEksteriorPage = SubInteriorPage;

export { AluminiumPage, DevServicePage, InteriorPage, KanopiPage, PagarPage, SubEksteriorPage, SubInteriorPage, SubPageCatalog, SubPageCatalogDetailPage, catalogItemSlugOf, fmtHargaRange, getHargaDetailLowest, normalizeIntItem };
