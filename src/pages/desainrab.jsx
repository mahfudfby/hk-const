/* Chunk halaman "desainrab" — dimuat lazy (React.lazy) saat rute ini dibuka.
   Dipisah dari RealEstateWeb.jsx agar pengunjung halaman lain tidak ikut mengunduh kode ini. */
import { useState } from "react";
import { cld } from "../lib/net.js";
import { onImgError } from "../app/core.jsx";
/* ── Page: Jasa Desain & RAB ── */
const DESAIN_RAB_PAKET = [
  {
    key:"basic", label:"PAKET BASIC", tag:null, sub:"Cocok untuk rumah kecil / minimalis",
    harga:"6.000", satuan:"/m²", color:"#1a2526", bgCard:"#fff", textColor:"#1a2526", border:"1.5px solid #d9d9d9",
    fitur:["Denah Arsitektur","Tampak Depan","3D Eksterior","RAB Estimasi","2x Revisi"],
    btnBg:"#fff", btnColor:"#1a2526", btnBorder:"1.5px solid #1a2526", btnLabel:"PILIH PAKET BASIC",
  },
  {
    key:"standard", label:"PAKET STANDARD", tag:"REKOMENDASI", sub:"Cocok untuk rumah tinggal",
    harga:"9.000", satuan:"/m²", color:"#C9AA71", bgCard:"#1a2526", textColor:"#fff", border:"2px solid #C9AA71",
    fitur:["Denah Arsitektur","Tampak & Potongan","3D Eksterior & Interior","Gambar Kerja Lengkap","RAB Detail","3x Revisi"],
    btnBg:"#C9AA71", btnColor:"#1a2526", btnBorder:"none", btnLabel:"PILIH PAKET STANDARD",
  },
  {
    key:"premium", label:"PAKET PREMIUM", tag:null, sub:"Cocok untuk rumah mewah / villa",
    harga:"12.000", satuan:"/m²", color:"#1a2526", bgCard:"#fff", textColor:"#1a2526", border:"1.5px solid #d9d9d9",
    fitur:["Semua Fitur Standard","Video Animasi 3D","Detail Struktur","Konsultasi Intensif","Revisi Unlimited"],
    btnBg:"#fff", btnColor:"#1a2526", btnBorder:"1.5px solid #1a2526", btnLabel:"PILIH PAKET PREMIUM",
  },
];

function DesainRabPage({ onWaOpen }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [activePaket, setActivePaket] = useState(null);

  const PROSES = [
    { no:"01", icon:"", label:"Konsultasi", desc:"Konsultasi kebutuhan, konsep desain & budget awal." },
    { no:"02", icon:"", label:"Survey Lokasi", desc:"Survey lokasi untuk pengambilan data dan analisa." },
    { no:"03", icon:"", label:"Konsep Desain", desc:"Pembuatan konsep desain sesuai kebutuhan Anda." },
    { no:"04", icon:"", label:"Revisi Desain", desc:"Revisi desain hingga sesuai dengan keinginan." },
    { no:"05", icon:"", label:"Final Drawing", desc:"Penyelesaian gambar kerja dan dokumen lengkap." },
    { no:"06", icon:"", label:"RAB & Estimasi", desc:"Perhitungan RAB detail dan estimasi biaya." },
  ];

  const DAPATKAN = [
    { icon:"", title:"Denah Ruangan", desc:"Denah arsitektur dengan ukuran yang presisi dan detail." },
    { icon:"", title:"Gambar Kerja Lengkap", desc:"Gambar kerja teknis untuk panduan pelaksanaan konstruksi." },
    { icon:"", title:"Tampak & Potongan", desc:"Tampak depan, samping, belakang dan potongan bangunan." },
    { icon:"", title:"RAB Detail", desc:"Rincian anggaran biaya material dan upah secara transparan." },
    { icon:"", title:"3D Rendering", desc:"Visualisasi 3D eksterior & interior realistis dan detail." },
    { icon:"", title:"Konsultasi & Revisi", desc:"Revisi desain fleksibel sampai Anda puas dengan hasilnya." },
  ];

  const GALERI = [
    { label:"Desain Rumah Modern 2 Lantai", luas:"220 m²", img:"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80" },
    { label:"Desain Rumah Minimalis", luas:"150 m²", img:"https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80" },
    { label:"Desain Rumah Classic Modern", luas:"300 m²", img:"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80" },
    { label:"Desain Villa Tropis Modern", luas:"450 m²", img:"https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&q=80" },
    { label:"Desain Rumah Industrial", luas:"180 m²", img:"https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80" },
  ];

  const PAKET = DESAIN_RAB_PAKET;

  const FAQ = [
    { q:"Berapa lama waktu pengerjaan desain?", a:"Tergantung kompleksitas proyek. Rata-rata 7–14 hari kerja untuk desain rumah standar, dan 14–30 hari untuk proyek besar/villa." },
    { q:"Apakah bisa hanya desain tanpa RAB?", a:"Bisa. Kami menyediakan layanan desain saja tanpa RAB, maupun RAB saja tanpa desain sesuai kebutuhan Anda." },
    { q:"Apakah revisi desain dikenakan biaya?", a:"Revisi sudah termasuk dalam paket sesuai jumlah yang tertera. Revisi di luar batas paket dikenakan biaya tambahan." },
    { q:"Apakah melayani seluruh Indonesia?", a:"Ya, kami melayani desain untuk seluruh wilayah Indonesia secara online maupun dengan survei langsung untuk area tertentu." },
    { q:"Apakah sudah termasuk perhitungan struktur?", a:"Untuk Paket Premium sudah termasuk. Paket Basic dan Standard bisa ditambahkan dengan biaya terpisah." },
    { q:"Bagaimana cara memulai proyek?", a:"Hubungi kami via WhatsApp, lakukan konsultasi gratis, lalu kami akan menyiapkan proposal dan timeline pengerjaan." },
  ];

  const waMsg = { key: "desainrab", vars: { judul_paket: "Jasa Desain & RAB" } };

  return (
    <div style={{ minHeight:"100vh", background:"#fff", fontFamily:"'Sora','DM Sans',sans-serif" }}>
      <style>{`
        @keyframes drFadeUp { from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:none;} }
        .dr-faq-row { transition: background .2s; cursor:pointer; }
        .dr-faq-row:hover { background:#FAF7F0 !important; }
        .dr-paket-btn { transition: opacity .2s; cursor:pointer; }
        .dr-paket-btn:hover { opacity:.85; }
        .dr-galeri-item { overflow:hidden; border-radius:10px; cursor:pointer; }
        .dr-galeri-item img { transition:transform .4s; display:block; width:100%; height:100%; object-fit:cover; }
        .dr-galeri-item:hover img { transform:scale(1.06); }
        .dr-proses-item:hover .dr-proses-circle { background:#C9AA71 !important; color:#1a2526 !important; }
        .dr-proses-circle { transition:background .2s,color .2s; }
        .dr-stat { transition:transform .2s; }
        .dr-stat:hover { transform:translateY(-3px); }
        @media(max-width:900px){ .dr-paket-grid{grid-template-columns:1fr 1fr !important;} .dr-galeri-grid{grid-template-columns:repeat(3,1fr) !important;} }
        @media(max-width:640px){ .dr-paket-grid{grid-template-columns:1fr !important;} .dr-galeri-grid{grid-template-columns:repeat(2,1fr) !important;} .dr-dapatkan-grid{grid-template-columns:1fr !important;} .dr-proses-grid{grid-template-columns:repeat(2,1fr) !important;} .dr-faq-grid{grid-template-columns:1fr !important;} }
      `}</style>

      {/* == HERO == */}
      <div style={{ position:"relative", minHeight:"clamp(420px,60vw,620px)", overflow:"hidden", background:"#1a2526" }}>
        <img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&q=85" alt="Hero" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:.55 }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right,rgba(20,30,30,.92) 42%,rgba(10,20,20,.35) 100%)" }} />
        <div style={{ position:"relative", zIndex:2, height:"100%", display:"flex", alignItems:"center", padding:"80px clamp(22px,6%,120px) 40px" }}>
          <div style={{ maxWidth:560, animation:"drFadeUp .55s ease both" }}>
            <h1 style={{ fontSize:"clamp(2rem,5vw,3.2rem)", fontWeight:900, color:"#fff", lineHeight:1.1, marginBottom:14 }}>
              Jasa Desain<br/>
              &amp; RAB <span style={{ color:"#C9AA71" }}>Profesional</span>
            </h1>
            <p style={{ fontSize:"clamp(.875rem,1.8vw,1rem)", color:"rgba(255,255,255,.8)", lineHeight:1.75, marginBottom:20, maxWidth:400 }}>
              Desain arsitektur yang estetik, fungsional,<br/>dan perhitungan RAB yang akurat &amp; transparan.
            </p>
            {/* Mini badges */}
            <div style={{ display:"flex", gap:18, flexWrap:"wrap", marginBottom:28 }}>
              {[{i:"",t:"Desain Berkualitas"},{i:"",t:"RAB Akurat & Transparan"},{i:"",t:"Revisi Fleksibel"},{i:"",t:"Pengerjaan Cepat"}].map((b,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:5, color:"rgba(255,255,255,.78)", fontSize:"0.75rem", fontWeight:600 }}>
                  <span style={{ fontSize:"0.9rem" }}>{b.i}</span>{b.t}
                </div>
              ))}
            </div>
            {/* Buttons */}
            <div style={{ display:"flex", gap:14, flexWrap:"wrap", alignItems:"center" }}>
              <button onClick={()=>onWaOpen&&onWaOpen(waMsg)}
                style={{ padding:"12px 24px", background:"#C9AA71", color:"#1a2526", border:"none", borderRadius:7, fontSize:"0.9rem", fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
                KONSULTASI GRATIS
              </button>
              <button style={{ padding:"12px 20px", background:"transparent", color:"#fff", border:"none", fontSize:"0.85rem", fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ width:32, height:32, borderRadius:"50%", border:"2px solid rgba(255,255,255,.6)", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:"0.7rem" }}>▶</span>
                LIHAT VIDEO PROSES PENGERJAAN
              </button>
            </div>
          </div>
        </div>
        {/* Stats bar */}
        <div style={{ position:"absolute", bottom:0, right:0, zIndex:3, display:"flex", gap:0 }}>
          {[{n:"250+",l:"Proyek Selesai"},{n:"98%",l:"Kepuasan Klien"},{n:"5 Tahun",l:"Pengalaman"},{n:"100%",l:"Transparan"}].map((s,i)=>(
            <div key={i} className="dr-stat" style={{ padding:"14px 22px", background:"rgba(0,0,0,.62)", borderLeft:"1px solid rgba(255,255,255,.1)", textAlign:"center", backdropFilter:"blur(8px)" }}>
              <div style={{ fontSize:"1.1rem", fontWeight:800, color:"#C9AA71" }}>{s.n}</div>
              <div style={{ fontSize:"0.65rem", color:"rgba(255,255,255,.7)", marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* == PROSES PENGERJAAN == */}
      <section style={{ background:"#fff", padding:"clamp(48px,7vw,80px) 5%" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:44 }}>
            <div style={{ fontSize:"0.7rem", letterSpacing:"4px", color:"#C9AA71", textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>STEP BY STEP</div>
            <h2 style={{ fontSize:"clamp(1.5rem,3.5vw,2.2rem)", fontWeight:800, color:"#1a2526", margin:0 }}>PROSES PENGERJAAN</h2>
            <div style={{ width:48, height:3, background:"#C9AA71", borderRadius:2, margin:"14px auto 0" }} />
          </div>
          {/* Steps -- connected line */}
          <div style={{ position:"relative" }}>
            {/* Connecting line */}
            <div style={{ position:"absolute", top:38, left:"8.33%", right:"8.33%", height:2, background:"linear-gradient(to right,#C9AA71,#E8D5A3)", borderRadius:2, zIndex:0 }} />
            <div className="dr-proses-grid" style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12, position:"relative", zIndex:1 }}>
              {PROSES.map((p,i)=>(
                <div key={i} className="dr-proses-item" style={{ textAlign:"center", cursor:"default" }}>
                  <div style={{ position:"relative", display:"inline-block", marginBottom:14 }}>
                    <div className="dr-proses-circle" style={{ width:68, height:68, borderRadius:"50%", background:"#F5F0E8", border:"2.5px solid #C9AA71", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.6rem", margin:"0 auto" }}>{p.icon}</div>
                    <div style={{ position:"absolute", top:-8, left:-8, width:22, height:22, borderRadius:"50%", background:"#C9AA71", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.6rem", fontWeight:800, color:"#1a2526" }}>{p.no}</div>
                  </div>
                  <div style={{ fontWeight:800, fontSize:"0.875rem", color:"#1a2526", marginBottom:6 }}>{p.label}</div>
                  <div style={{ fontSize:"0.72rem", color:"#5A6A6C", lineHeight:1.55 }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* == YANG ANDA DAPATKAN == */}
      <section style={{ background:"#FAF7F0", padding:"clamp(48px,7vw,80px) 5%" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:44 }}>
            <div style={{ fontSize:"0.7rem", letterSpacing:"4px", color:"#C9AA71", textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>BENEFIT</div>
            <h2 style={{ fontSize:"clamp(1.5rem,3.5vw,2.2rem)", fontWeight:800, color:"#1a2526", margin:0 }}>YANG ANDA DAPATKAN</h2>
            <div style={{ width:48, height:3, background:"#C9AA71", borderRadius:2, margin:"14px auto 0" }} />
          </div>
          <div style={{ display:"flex", gap:32, alignItems:"flex-start", flexWrap:"wrap" }}>
            {/* Left image collage */}
            <div style={{ flex:"0 0 clamp(260px,40%,440px)", display:"grid", gridTemplateColumns:"1fr 1fr", gridTemplateRows:"auto auto", gap:8, borderRadius:14, overflow:"hidden" }}>
              <img decoding="async" loading="lazy" src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500&q=80" alt="d1" style={{ gridColumn:"1/3", width:"100%", height:180, objectFit:"cover", display:"block" }} />
              <img decoding="async" loading="lazy" src="https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=300&q=80" alt="d2" style={{ width:"100%", height:130, objectFit:"cover", display:"block" }} />
              <img decoding="async" loading="lazy" src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=300&q=80" alt="d3" style={{ width:"100%", height:130, objectFit:"cover", display:"block" }} />
            </div>
            {/* Right 2-col features */}
            <div style={{ flex:"1 1 340px" }}>
              <div className="dr-dapatkan-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                {DAPATKAN.map((d,i)=>(
                  <div key={i} style={{ display:"flex", gap:14, alignItems:"flex-start", padding:"18px 16px", background:"#fff", borderRadius:10, boxShadow:"0 2px 10px rgba(0,0,0,.06)", border:"1px solid #F0EAE0" }}>
                    <div style={{ width:42, height:42, borderRadius:8, background:"#1a2526", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", flexShrink:0 }}>{d.icon}</div>
                    <div>
                      <div style={{ fontWeight:800, fontSize:"0.875rem", color:"#1a2526", marginBottom:5 }}>{d.title}</div>
                      <div style={{ fontSize:"0.75rem", color:"#5A6A6C", lineHeight:1.6 }}>{d.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* == CONTOH HASIL DESAIN == */}
      <section style={{ background:"#fff", padding:"clamp(48px,7vw,80px) 0" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 5%", marginBottom:36 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:"0.7rem", letterSpacing:"4px", color:"#C9AA71", textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>PORTOFOLIO</div>
            <h2 style={{ fontSize:"clamp(1.5rem,3.5vw,2.2rem)", fontWeight:800, color:"#1a2526", margin:0 }}>CONTOH HASIL DESAIN</h2>
            <div style={{ width:48, height:3, background:"#C9AA71", borderRadius:2, margin:"14px auto 0" }} />
          </div>
        </div>

        {/* -- MARQUEE RUNNER -- */}
        <style>{`
          @keyframes drMarquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
          .dr-marquee-track { display:flex; width:max-content; animation:drMarquee 28s linear infinite; }
          .dr-marquee-track:hover { animation-play-state:paused; }
          .dr-marquee-wrap { overflow:hidden; width:100%; position:relative; }
          .dr-marquee-wrap::before,.dr-marquee-wrap::after {
            content:""; position:absolute; top:0; bottom:0; width:80px; z-index:2; pointer-events:none;
          }
          .dr-marquee-wrap::before { left:0; background:linear-gradient(to right,#fff 0%,transparent 100%); }
          .dr-marquee-wrap::after  { right:0; background:linear-gradient(to left,#fff 0%,transparent 100%); }
          .dr-gcard { flex:0 0 auto; width:280px; margin-right:18px; border-radius:12px; overflow:hidden; box-shadow:0 3px 16px rgba(0,0,0,.09); transition:transform .3s,box-shadow .3s; cursor:pointer; background:#fff; }
          .dr-gcard:hover { transform:translateY(-6px); box-shadow:0 12px 32px rgba(0,0,0,.16); }
          .dr-gcard img { width:100%; height:192px; object-fit:cover; display:block; transition:transform .45s; }
          .dr-gcard:hover img { transform:scale(1.06); }
        `}</style>

        <div className="dr-marquee-wrap">
          <div className="dr-marquee-track">
            {/* Render dua kali untuk loop seamless */}
            {[...GALERI, ...GALERI, ...GALERI, ...GALERI].map((g, i) => (
              <div key={i} className="dr-gcard">
                <div style={{ overflow:"hidden" }}>
                  <img decoding="async" loading="lazy" src={cld(g.img)} alt={g.label} onError={onImgError} />
                </div>
                <div style={{ padding:"12px 14px 14px", background:"#fff" }}>
                  <div style={{ fontWeight:800, fontSize:"0.8125rem", color:"#1a2526", lineHeight:1.35, marginBottom:4 }}>{g.label}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:"0.7rem", color:"#5A6A6C" }}>
                    <span style={{ color:"#C9AA71", fontWeight:700 }}></span> Luas {g.luas}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign:"center", marginTop:32, padding:"0 5%" }}>
          <button style={{ padding:"11px 28px", background:"#fff", color:"#1a2526", border:"1.5px solid #1a2526", borderRadius:7, fontSize:"0.85rem", fontWeight:700, cursor:"pointer" }}>
            LIHAT SEMUA PROYEK +
          </button>
        </div>
      </section>

      {/* == PAKET JASA DESAIN & RAB == */}
      <section style={{ background:"#FAF7F0", padding:"clamp(48px,7vw,80px) 5%" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:40 }}>
            <div style={{ fontSize:"0.7rem", letterSpacing:"4px", color:"#C9AA71", textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>HARGA</div>
            <h2 style={{ fontSize:"clamp(1.5rem,3.5vw,2.2rem)", fontWeight:800, color:"#1a2526", margin:0 }}>PAKET JASA DESAIN & RAB</h2>
            <div style={{ width:48, height:3, background:"#C9AA71", borderRadius:2, margin:"14px auto 0" }} />
          </div>
          <div className="dr-paket-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:18, alignItems:"stretch" }}>
            {PAKET.map(p=>(
              <div key={p.key} style={{ borderRadius:14, background:p.bgCard, border:p.border, overflow:"hidden", display:"flex", flexDirection:"column", boxShadow: p.key==="standard"?"0 12px 40px rgba(0,0,0,.2)":"0 4px 14px rgba(0,0,0,.07)", position:"relative" }}>
                {p.tag && (
                  <div style={{ background:"#C9AA71", color:"#1a2526", textAlign:"center", fontSize:"0.62rem", fontWeight:800, letterSpacing:"2px", padding:"5px 0" }}>{p.tag}</div>
                )}
                <div style={{ padding:"24px 22px", flex:1, display:"flex", flexDirection:"column" }}>
                  <div style={{ fontSize:"0.72rem", fontWeight:800, letterSpacing:"2px", color:p.key==="standard"?"#C9AA71":"#5A6A6C", marginBottom:6 }}>{p.label}</div>
                  <div style={{ fontSize:"0.78rem", color:p.key==="standard"?"rgba(255,255,255,.65)":"#5A6A6C", marginBottom:18 }}>{p.sub}</div>
                  <div style={{ marginBottom:22 }}>
                    <span style={{ fontSize:"0.75rem", fontWeight:700, color:p.key==="standard"?"#fff":"#1a2526", verticalAlign:"top", lineHeight:2 }}>Rp </span>
                    <span style={{ fontSize:"2rem", fontWeight:900, color:p.key==="standard"?"#C9AA71":"#1a2526", lineHeight:1 }}>{p.harga}</span>
                    <span style={{ fontSize:"0.8rem", color:p.key==="standard"?"rgba(255,255,255,.6)":"#5A6A6C" }}>{p.satuan}</span>
                  </div>
                  <div style={{ flex:1, marginBottom:24 }}>
                    {p.fitur.map((f,i)=>(
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:9 }}>
                        <span style={{ color:"#C9AA71", fontWeight:700, fontSize:"0.85rem" }}>✓</span>
                        <span style={{ fontSize:"0.8rem", color:p.key==="standard"?"rgba(255,255,255,.85)":"#1a2526" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button className="dr-paket-btn" onClick={()=>onWaOpen&&onWaOpen({ key: "desainrab", vars: { judul_paket: p.label } })}
                    style={{ padding:"12px", background:p.btnBg, color:p.btnColor, border:p.btnBorder, borderRadius:8, fontSize:"0.78rem", fontWeight:800, letterSpacing:"0.5px", width:"100%", cursor:"pointer" }}>
                    {p.btnLabel}
                  </button>
                </div>
              </div>
            ))}
            {/* Custom box */}
            <div style={{ borderRadius:14, background:"#1a2526", padding:"28px 24px", display:"flex", flexDirection:"column", justifyContent:"center", boxShadow:"0 4px 14px rgba(0,0,0,.15)" }}>
              <div style={{ fontWeight:800, fontSize:"1rem", color:"#fff", marginBottom:10 }}>Butuh Paket Custom?</div>
              <p style={{ fontSize:"0.8rem", color:"rgba(255,255,255,.7)", lineHeight:1.65, marginBottom:22 }}>Kami siap menyesuaikan kebutuhan proyek Anda.</p>
              <button onClick={()=>onWaOpen&&onWaOpen({ key: "desainrab", vars: { judul_paket: "Custom" } })}
                style={{ padding:"12px 16px", background:"#C9AA71", color:"#1a2526", border:"none", borderRadius:8, fontSize:"0.8rem", fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                KONSULTASI SEKARANG
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* == FAQ == */}
      <section style={{ background:"#fff", padding:"clamp(48px,7vw,80px) 5%" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:40 }}>
            <div style={{ fontSize:"0.7rem", letterSpacing:"4px", color:"#C9AA71", textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>FAQ</div>
            <h2 style={{ fontSize:"clamp(1.5rem,3.5vw,2.2rem)", fontWeight:800, color:"#1a2526", margin:0 }}>PERTANYAAN YANG SERING DITANYAKAN</h2>
            <div style={{ width:48, height:3, background:"#C9AA71", borderRadius:2, margin:"14px auto 0" }} />
          </div>
          <div className="dr-faq-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0, border:"1px solid #EDE8DF", borderRadius:12, overflow:"hidden" }}>
            {FAQ.map((f,i)=>(
              <div key={i} className="dr-faq-row" style={{ borderBottom:"1px solid #EDE8DF", borderRight: i%2===0?"1px solid #EDE8DF":"none", padding:"0" }}
                onClick={()=>setOpenFaq(openFaq===i?null:i)}>
                <div style={{ padding:"18px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
                  <span style={{ fontSize:"0.845rem", fontWeight:600, color:"#1a2526", lineHeight:1.45 }}>{f.q}</span>
                  <span style={{ fontSize:"1rem", color:"#C9AA71", flexShrink:0, transition:"transform .2s", transform:openFaq===i?"rotate(180deg)":"none" }}>⌄</span>
                </div>
                {openFaq===i && (
                  <div style={{ padding:"0 20px 18px", fontSize:"0.8rem", color:"#5A6A6C", lineHeight:1.7 }}>{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* == CTA BANNER == */}
      <section style={{ position:"relative", overflow:"hidden" }}>
        <img decoding="async" loading="lazy" src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1400&q=80" alt="CTA" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
        <div style={{ position:"absolute", inset:0, background:"rgba(20,30,30,.85)" }} />
        <div style={{ position:"relative", zIndex:1, padding:"clamp(48px,7vw,80px) 5%", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:24, maxWidth:1200, margin:"0 auto" }}>
          <div>
            <h2 style={{ fontSize:"clamp(1.5rem,3.5vw,2.1rem)", fontWeight:800, color:"#fff", margin:"0 0 8px", lineHeight:1.2 }}>Siap Mewujudkan Hunian Impian Anda?</h2>
            <p style={{ fontSize:"0.95rem", color:"rgba(255,255,255,.72)", margin:0 }}>Konsultasikan kebutuhan desain dan RAB Anda sekarang juga!</p>
          </div>
          <button onClick={()=>onWaOpen&&onWaOpen(waMsg)}
            style={{ padding:"14px 30px", background:"#C9AA71", color:"#1a2526", border:"none", borderRadius:8, fontSize:"0.95rem", fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", gap:10, whiteSpace:"nowrap", flexShrink:0 }}>
            KONSULTASI GRATIS
          </button>
        </div>
      </section>

    </div>
  );
}

export { DESAIN_RAB_PAKET, DesainRabPage };
