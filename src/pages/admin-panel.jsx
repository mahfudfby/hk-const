/* ══════════════════════════════════════════════════════════════════════════
   CONTROL PANEL — seluruh antarmuka admin.

   Dulu blok JSX ini (±125 KB, hampir separuh komponen utama) berada langsung di dalam
   RealEstateWeb.jsx, sehingga SETIAP pengunjung biasa ikut mengunduh kode Control Panel yang
   tidak akan pernah mereka buka. Sekarang jadi chunk tersendiri yang hanya dimuat ketika
   /control-panel benar-benar dibuka oleh admin yang sudah login.

   Isinya tidak diubah — hanya dipindahkan; state & handler yang sebelumnya berada satu scope
   dengan blok ini kini diterima sebagai props.
   ══════════════════════════════════════════════════════════════════════════ */
import React from "react";
import MarketingAdminPanel from "../marketing/MarketingAdminPanel.jsx";
import { AboutPageAdmin, AdminReviews, BackupDataPanel, DashTabs, HeroStaticImagePanel, HeroVideoPanel, HomeServiceCardEditor, LayananPageAdmin, PaketGridManager, SosmedManager, SubLayananAdmin, TeamAdmin, TemaRumahAdminPanel, WaAdminManager } from "./admin.jsx";
import { AutoGrowField, CEF, DEFAULT_DATA, HARDCODED_USERS, HOME_SERVICES_DEFAULT, ROLES, SECTIONS, SECTION_LABELS, UploadButton, autoGrowTextarea, formatDate, onImgError, uploadToCloudinary } from "../app/core.jsx";
import { CAFE_PAKET_DATA, KOST_PAKET_DATA, RS_PAKET_DATA, RUKO_PAKET_DATA } from "../data/programs.js";
import { CATALOG_DATA } from "../data/catalog.js";
import { LANDSCAPE_CATEGORIES } from "../data/landscape.js";
import { cld } from "../lib/net.js";
import { fsGet, fsSet } from "../lib/firebase.js";

export function AdminPanel({
  adminTab, allPosts, canCS, canEdit, closeAdmin, data, dataReady, draftCount, editRoleId, editUserForm, editUserId, getCEFVal, isAdmin, navigateAdminTab, notify, profileEdit, profileEditMode, publishedCount, replyMsg, replyText, replyTo, reviewTokenParam, save, saveContent, setCmsEditPost, setEditContent, setEditRoleId, setEditUserForm, setEditUserId, setProfileEdit, setProfileEditMode, setReplyText, setReplyTo, setSidebarOpen, setUser, setUserMgmtForm, setUserMgmtOpen, showAdmin, sidebarOpen, user, userMgmtForm, userMgmtOpen,
}) {
  return (
<div style={{ minHeight: "100vh", background: "#F7F5F0", paddingTop: 56 }}>

          {/* -- Top bar -- */}
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 220, height: 56, background: "#2E3D3F", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", boxShadow: "0 2px 8px rgba(0,0,0,.18)" }}>
            <button className="show-sm" onClick={() => setSidebarOpen(p => !p)}
              style={{ background: "rgba(255,255,255,.12)", border: "none", color: "#fff", borderRadius: 7, width: 36, height: 36, cursor: "pointer", fontSize: 18 }}>☰</button>
            <span style={{ color: "#C9AA71", fontWeight: 800, fontSize: 15, letterSpacing: ".04em" }}>Control Panel</span>
            <button onClick={closeAdmin}
              style={{ background: "#C9AA71", border: "none", color: "#fff", borderRadius: 7, padding: "7px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              ✕ Keluar
            </button>
          </div>

          <div style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>

            {/* -- Overlay mobile: tap di luar sidebar untuk menutup -- */}
            <div className={`sidebar-overlay${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(false)} />

            {/* -- Sidebar -- */}
            <div className={`admin-sidebar${sidebarOpen ? " open" : ""}`} style={{ background: "#2E3D3F", width: 220, flexShrink: 0, overflowY: "auto", padding: "12px 0" }}>

              {/* Kelompok menu */}
              {[
                /* ── Navigasi Utama ── */
                {
                  group: null,
                  items: [
                    { id: "dashboard", label: "Dashboard",    show: true },
                    { id: "messages",  label: "Pesan Masuk",   show: canCS },
                    { id: "profil",    label: "Profil Akun",   show: true },
                  ]
                },
                /* ── Konten & Setting Website ── */
                {
                  group: "KONTEN WEBSITE",
                  items: [
                    { id: "content",         label: "Konten & Nav",      show: isAdmin },
                    { id: "set_layanankami", label: "Setting Halaman About", show: isAdmin },
                    { id: "set_layanan",     label: "Setting Halaman Layanan", show: isAdmin },
                    { id: "settings",        label: "Pengaturan Sistem",  show: isAdmin },
                  ]
                },
                /* ── Katalog Interior (7 ruangan) ── */
                {
                  group: "INTERIOR",
                  items: [
                    { id: "int_plafon",         label: "Plafon",          show: isAdmin },
                    { id: "int_kitchen_set",    label: "Kitchen Set",     show: isAdmin },
                    { id: "int_backdrop_tv",    label: "Backdrop",     show: isAdmin },
                    { id: "int_kamar_tidur",    label: "Kamar Tidur",     show: isAdmin },
                    { id: "int_kamar_mandi",    label: "Kamar Mandi",     show: isAdmin },
                    { id: "int_ruang_keluarga", label: "Ruang Keluarga",  show: isAdmin },
                    { id: "int_ruang_tamu",     label: "Ruang Tamu",      show: isAdmin },
                    { id: "int_ruang_kerja",    label: "Ruang Kerja",     show: isAdmin },
                  ]
                },
                /* ── Katalog Eksterior (Pagar, Kanopi, Kusen & Partisi) ── */
                {
                  group: "EKSTERIOR",
                  items: [
                    { id: "ext_pagar",     label: "Pagar",     show: isAdmin },
                    { id: "ext_kanopi",    label: "Kanopi",    show: isAdmin },
                    { id: "ext_aluminium", label: "Kusen & Partisi", show: isAdmin },
                  ]
                },
                /* ── Katalog & Paket (CMS terhubung ke frontend) ── */
                {
                  group: "KATALOG & PAKET",
                  items: [
                    { id: "produk_furnitur",    label: "Produk Furnitur",       show: isAdmin },
                    { id: "produk_custom_furnitur", label: "Produk Custom Furnitur", show: isAdmin },
                    { id: "paket_landscape",    label: "Paket Landscape",        show: isAdmin },
                    { id: "paket_rumahsubsidi", label: "Paket Rumah Subsidi",    show: isAdmin },
                    { id: "paket_kost",         label: "Paket Pembangunan Kost", show: isAdmin },
                    { id: "paket_cafe",         label: "Paket Pembangunan Cafe", show: isAdmin },
                    { id: "paket_ruko",         label: "Paket Pembangunan Ruko", show: isAdmin },
                  ]
                },
                /* ── Tema Rumah ── */
                {
                  group: "TEMA RUMAH",
                  items: [
                    { id: "set_temarumah",    label: "Setting Tema Rumah", show: isAdmin },
                  ]
                },
                /* ── Marketing & Tracking ── */
                {
                  group: "MARKETING",
                  items: [
                    { id: "marketing", label: "Marketing & Tracking", show: isAdmin },
                  ]
                },
                // ── Backup & Restore Data ──
                {
                  group: "BACKUP & DATA",
                  items: [
                    { id: "backup", label: "Backup & Restore Data", show: isAdmin },
                  ]
                },
                /* ── Manajemen ── */
                {
                  group: "MANAJEMEN",
                  items: [
                    { id: "reviews", label: "Reviews",        show: isAdmin },
                    { id: "users",   label: "Users",          show: isAdmin },
                  ]
                },
              ].map(({ group, items }) => (
                <div key={group || "_main"}>
                  {group && (
                    <div style={{ padding: "14px 16px 4px", fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color: "rgba(201,170,113,.65)", textTransform: "uppercase" }}>
                      {group}
                    </div>
                  )}
                  {items.filter(it => it.show).map(item => (
                    <button key={item.id} onClick={() => { navigateAdminTab(item.id); setSidebarOpen(false); }}
                      style={{
                        display: "block", width: "100%", textAlign: "left", border: "none", padding: "11px 18px",
                        background: adminTab === item.id ? "rgba(201,170,113,.22)" : "transparent",
                        color: adminTab === item.id ? "#C9AA71" : "rgba(255,255,255,.78)",
                        fontSize: 13, fontWeight: adminTab === item.id ? 700 : 400, cursor: "pointer",
                        borderLeft: adminTab === item.id ? "3px solid #C9AA71" : "3px solid transparent",
                        transition: "all .12s",
                      }}>
                      {item.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* -- Konten -- */}
            <div style={{ flex: 1, minWidth: 0, padding: "28px 24px", overflowY: "auto" }}>

              {adminTab === "dashboard" && (
                <DashTabs
                  user={user}
                  allPosts={allPosts}
                  publishedCount={publishedCount}
                  draftCount={draftCount}
                  data={data}
                  canEdit={canEdit}
                  canCS={canCS}
                  isAdmin={isAdmin}
                  setAdminTab={navigateAdminTab}
                  setCmsEditPost={setCmsEditPost}
                  SECTION_LABELS={SECTION_LABELS}
                  SECTIONS={SECTIONS}
                  formatDate={formatDate}
                />
              )}

              {adminTab === "content" && isAdmin && (
                <div className="fade-in">
                  <h1 style={{ fontSize: 24, fontWeight: 500, color: "#2E3D3F", marginBottom: 24 }}>Konten Website</h1>
                  {[
                    { label: "Nav: Home", key: "nav1" },
                    { label: "Nav: About", key: "nav2" },
                    { label: "Nav: Program Affiliate", key: "nav3" },
                    { label: "Nav: Galeri - Traveling", key: "nav4" },
                    { label: "Nav: Galeri - Wedding Organizer", key: "nav5" },
                    { label: "Nav: Layanan Kami (Dropdown)", key: "nav6" },
                    { label: "Nav: Jasa Desain & RAB", key: "nav7" },
                    { label: "Nav: Tema Rumah", key: "nav8" },
                    { label: "Nav: Interior", key: "nav9" },
                    { label: "Nav: Pagar Rumah", key: "nav10" },
                    { label: "Nav: Kanopi", key: "nav11" },
                    { label: "Nav: Aluminium", key: "nav12" },
                    { label: "Nav: Landscape & Taman", key: "nav13" },
                  ].map(f => (
                    <div key={f.key} style={{ background: "#fff", borderRadius: 8, padding: "18px 20px", marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>{f.label}</label>
                      <CEF
                        key={f.key}
                        val={getCEFVal(f.key)}
                        multiline={f.multiline}
                        onChange={e => setEditContent(p => ({ ...p, [f.key]: e.target.value }))}
                        onSave={() => saveContent(f.key)}
                      />
                    </div>
                  ))}

                  {/* -- WA ADMIN MANAGER -- */}
                  <WaAdminManager
                    admins={data.content.waAdmins}
                    onSave={(list) => {
                      const primaryAdmin = list.find(a => a.primary) || list[0];
                      save({ ...data, content: { ...data.content, waAdmins: list, waLink: primaryAdmin?.wa || data.content.waLink, phone: primaryAdmin?.wa?.replace("https://wa.me/", "+").replace(/^\+62(\d{3})(\d{4})(\d+)$/, "+62 $1 $2-$3") || data.content.phone } });
                      notify("Daftar Admin WA disimpan!");
                    }}
                    notify={notify}
                  />
                  <SosmedManager
                    content={data.content}
                    onSave={(patch) => {
                      save({ ...data, content: { ...data.content, ...patch } });
                    }}
                    notify={notify}
                  />
                </div>
              )}

              {/* SETTING HOME */}
              {/* SETTING HALAMAN ABOUT */}
              {adminTab === "set_layanankami" && isAdmin && (
                <AboutPageAdmin data={data} save={save} notify={notify} uploadToCloudinary={uploadToCloudinary} />
              )}

              {/* SETTING HALAMAN LAYANAN — teks + foto hero, satu tempat */}
              {adminTab === "set_layanan" && isAdmin && (
                <LayananPageAdmin data={data} save={save} notify={notify} />
              )}




              {/* --- KAMAR TIDUR --- */}
              {adminTab === "int_kamar_tidur" && isAdmin && (
                <SubLayananAdmin
                  title="Kamar Tidur"
                  icon=""
                  accentColor="#6a2fa0"
                  storeKey="int_kamar_tidur"
                  data={data}
                  save={save}
                  notify={notify}
                  uploadToCloudinary={uploadToCloudinary}
                  pageDesc="Kelola katalog desain kamar tidur — tambah, edit, hapus kartu produk yang tampil di halaman Kamar Tidur."
                  sections={[]}
                  imageGroups={[]}
                  crudKey="intKamarTidurItems"
                  crudLabel="Desain Kamar Tidur"
                  crudFields={[
                    { key:"nama",     label:"Nama Desain",  type:"text",     placeholder:"contoh: Kamar Minimalis Modern" },
                    { key:"style",    label:"Style / Tag",  type:"text",     placeholder:"contoh: Best Seller, Premium, Zen..." },
                    { key:"material", label:"Material",     type:"text",     placeholder:"contoh: Kayu MDF + HPL" },
                    { key:"harga",    label:"Harga (Rp)",   type:"text",     placeholder:"contoh: 8500000" },
                    { key:"desc",     label:"Deskripsi",    type:"textarea", placeholder:"Keunggulan dan detail desain..." },
                    { key:"fitur",    label:"Fitur (pisah koma)", type:"text", placeholder:"contoh: Storage Built-in, Hidden Lamp" },
                    { key:"poin", label:"Isi Paket / Yang Didapat (1 baris = 1 poin)", type:"textarea", placeholder:"contoh:\nSurvey lokasi & konsultasi desain gratis\nMaterial sesuai spesifikasi\nGaransi pengerjaan resmi" },
                    { key:"tampilHarga", label:"Tampilkan Harga", type:"toggle", default: true, desc: "Nonaktifkan untuk sembunyikan harga -- kartu akan menampilkan tombol Konsultasi Sekarang penuh sebagai gantinya." },
                  ]}
                  crudHasImage
                  crudHasGallery={true}
                  defaultItems={CATALOG_DATA["interior/kamar-tidur"].items.map(item => ({
                    id: item.id, nama: item.nama, style: item.style || "", material: item.material || "",
                    harga: item.harga ? String(item.harga) : "",
                    desc: item.desc || "", fitur: (item.fitur||[]).join(", "), poin: (item.poin||[]).join("\n"), _img: item.img || "",
                  }))}
                />
              )}

              {/* --- KAMAR MANDI --- */}
              {adminTab === "int_kamar_mandi" && isAdmin && (
                <SubLayananAdmin
                  title="Kamar Mandi"
                  icon=""
                  accentColor="#0f3460"
                  storeKey="int_kamar_mandi"
                  data={data}
                  save={save}
                  notify={notify}
                  uploadToCloudinary={uploadToCloudinary}
                  pageDesc="Kelola katalog desain kamar mandi — tambah, edit, hapus kartu produk yang tampil di halaman Kamar Mandi."
                  sections={[]}
                  imageGroups={[]}
                  crudKey="intKamarMandiItems"
                  crudLabel="Desain Kamar Mandi"
                  crudFields={[
                    { key:"nama",     label:"Nama Desain",  type:"text",     placeholder:"contoh: Bathroom Minimalis Modern" },
                    { key:"style",    label:"Style / Tag",  type:"text",     placeholder:"contoh: Clean, Luxury, Zen..." },
                    { key:"material", label:"Material",     type:"text",     placeholder:"contoh: Granit + Keramik" },
                    { key:"harga",    label:"Harga (Rp)",   type:"text",     placeholder:"contoh: 12000000" },
                    { key:"desc",     label:"Deskripsi",    type:"textarea", placeholder:"Keunggulan dan detail desain..." },
                    { key:"fitur",    label:"Fitur (pisah koma)", type:"text", placeholder:"contoh: Shower Box, LED Mirror" },
                    { key:"poin", label:"Isi Paket / Yang Didapat (1 baris = 1 poin)", type:"textarea", placeholder:"contoh:\nSurvey lokasi & konsultasi desain gratis\nMaterial sesuai spesifikasi\nGaransi pengerjaan resmi" },
                    { key:"tampilHarga", label:"Tampilkan Harga", type:"toggle", default: true, desc: "Nonaktifkan untuk sembunyikan harga -- kartu akan menampilkan tombol Konsultasi Sekarang penuh sebagai gantinya." },
                  ]}
                  crudHasImage
                  crudHasGallery={true}
                  defaultItems={CATALOG_DATA["interior/kamar-mandi"].items.map(item => ({
                    id: item.id, nama: item.nama, style: item.style || "", material: item.material || "",
                    harga: item.harga ? String(item.harga) : "",
                    desc: item.desc || "", fitur: (item.fitur||[]).join(", "), poin: (item.poin||[]).join("\n"), _img: item.img || "",
                  }))}
                />
              )}

              {/* --- RUANG KELUARGA --- */}
              {adminTab === "int_ruang_keluarga" && isAdmin && (
                <SubLayananAdmin
                  title="Ruang Keluarga"
                  icon=""
                  accentColor="#2d6a4f"
                  storeKey="int_ruang_keluarga"
                  data={data}
                  save={save}
                  notify={notify}
                  uploadToCloudinary={uploadToCloudinary}
                  pageDesc="Kelola katalog desain ruang keluarga — tambah, edit, hapus kartu produk."
                  sections={[]}
                  imageGroups={[]}
                  crudKey="intRuangKeluargaItems"
                  crudLabel="Desain Ruang Keluarga"
                  crudFields={[
                    { key:"nama",     label:"Nama Desain",  type:"text",     placeholder:"contoh: Family Room Modern" },
                    { key:"style",    label:"Style / Tag",  type:"text",     placeholder:"contoh: Cozy, Premium, Hygge..." },
                    { key:"material", label:"Material",     type:"text",     placeholder:"contoh: Sofa Fabric + Kayu" },
                    { key:"harga",    label:"Harga (Rp)",   type:"text",     placeholder:"contoh: 18000000" },
                    { key:"desc",     label:"Deskripsi",    type:"textarea", placeholder:"Keunggulan dan detail desain..." },
                    { key:"fitur",    label:"Fitur (pisah koma)", type:"text", placeholder:"contoh: Modular Sofa, TV Wall" },
                    { key:"poin", label:"Isi Paket / Yang Didapat (1 baris = 1 poin)", type:"textarea", placeholder:"contoh:\nSurvey lokasi & konsultasi desain gratis\nMaterial sesuai spesifikasi\nGaransi pengerjaan resmi" },
                    { key:"tampilHarga", label:"Tampilkan Harga", type:"toggle", default: true, desc: "Nonaktifkan untuk sembunyikan harga -- kartu akan menampilkan tombol Konsultasi Sekarang penuh sebagai gantinya." },
                  ]}
                  crudHasImage
                  crudHasGallery={true}
                  defaultItems={CATALOG_DATA["interior/ruang-keluarga"].items.map(item => ({
                    id: item.id, nama: item.nama, style: item.style || "", material: item.material || "",
                    harga: item.harga ? String(item.harga) : "",
                    desc: item.desc || "", fitur: (item.fitur||[]).join(", "), poin: (item.poin||[]).join("\n"), _img: item.img || "",
                  }))}
                />
              )}

              {/* --- RUANG TAMU --- */}
              {adminTab === "int_ruang_tamu" && isAdmin && (
                <SubLayananAdmin
                  title="Ruang Tamu"
                  icon=""
                  accentColor="#8B4513"
                  storeKey="int_ruang_tamu"
                  data={data}
                  save={save}
                  notify={notify}
                  uploadToCloudinary={uploadToCloudinary}
                  pageDesc="Kelola katalog desain ruang tamu — tambah, edit, hapus kartu produk."
                  sections={[]}
                  imageGroups={[]}
                  crudKey="intRuangTamuItems"
                  crudLabel="Desain Ruang Tamu"
                  crudFields={[
                    { key:"nama",     label:"Nama Desain",  type:"text",     placeholder:"contoh: Ruang Tamu Minimalis" },
                    { key:"style",    label:"Style / Tag",  type:"text",     placeholder:"contoh: Clean, Timeless, Grand..." },
                    { key:"material", label:"Material",     type:"text",     placeholder:"contoh: Keramik + Fabric" },
                    { key:"harga",    label:"Harga (Rp)",   type:"text",     placeholder:"contoh: 10000000" },
                    { key:"desc",     label:"Deskripsi",    type:"textarea", placeholder:"Keunggulan dan detail desain..." },
                    { key:"fitur",    label:"Fitur (pisah koma)", type:"text", placeholder:"contoh: Space Efficient, Art Display" },
                    { key:"poin", label:"Isi Paket / Yang Didapat (1 baris = 1 poin)", type:"textarea", placeholder:"contoh:\nSurvey lokasi & konsultasi desain gratis\nMaterial sesuai spesifikasi\nGaransi pengerjaan resmi" },
                    { key:"tampilHarga", label:"Tampilkan Harga", type:"toggle", default: true, desc: "Nonaktifkan untuk sembunyikan harga -- kartu akan menampilkan tombol Konsultasi Sekarang penuh sebagai gantinya." },
                  ]}
                  crudHasImage
                  crudHasGallery={true}
                  defaultItems={CATALOG_DATA["interior/ruang-tamu"].items.map(item => ({
                    id: item.id, nama: item.nama, style: item.style || "", material: item.material || "",
                    harga: item.harga ? String(item.harga) : "",
                    desc: item.desc || "", fitur: (item.fitur||[]).join(", "), poin: (item.poin||[]).join("\n"), _img: item.img || "",
                  }))}
                />
              )}

              {/* --- KITCHEN SET --- */}
              {adminTab === "int_kitchen_set" && isAdmin && (
                <SubLayananAdmin
                  title="Kitchen Set & Dapur"
                  icon=""
                  accentColor="#2c5282"
                  storeKey="int_kitchen_set"
                  data={data}
                  save={save}
                  notify={notify}
                  uploadToCloudinary={uploadToCloudinary}
                  pageDesc="Kelola katalog desain kitchen set & dapur — tambah, edit, hapus kartu produk."
                  sections={[]}
                  imageGroups={[]}
                  crudKey="intKitchenSetItems"
                  crudLabel="Desain Kitchen Set"
                  crudFields={[
                    { key:"nama",     label:"Nama Desain",  type:"text",     placeholder:"contoh: Kitchen Set Minimalis" },
                    { key:"style",    label:"Style / Tag",  type:"text",     placeholder:"contoh: Clean, Luxury, Nordic..." },
                    { key:"material", label:"Material",     type:"text",     placeholder:"contoh: HPL + Granit" },
                    { key:"harga",    label:"Harga (Rp)",   type:"text",     placeholder:"contoh: 15000000" },
                    { key:"desc",     label:"Deskripsi",    type:"textarea", placeholder:"Keunggulan dan detail desain..." },
                    { key:"fitur",    label:"Fitur (pisah koma)", type:"text", placeholder:"contoh: Soft Close Hinge, Granite Top" },
                    { key:"poin", label:"Isi Paket / Yang Didapat (1 baris = 1 poin)", type:"textarea", placeholder:"contoh:\nSurvey lokasi & konsultasi desain gratis\nMaterial sesuai spesifikasi\nGaransi pengerjaan resmi" },
                    { key:"tampilHarga", label:"Tampilkan Harga", type:"toggle", default: true, desc: "Nonaktifkan untuk sembunyikan harga -- kartu akan menampilkan tombol Konsultasi Sekarang penuh sebagai gantinya." },
                  ]}
                  crudHasImage
                  crudHasGallery={true}
                  defaultItems={CATALOG_DATA["interior/kitchen-set"].items.map(item => ({
                    id: item.id, nama: item.nama, style: item.style || "", material: item.material || "",
                    harga: item.harga ? String(item.harga) : "",
                    desc: item.desc || "", fitur: (item.fitur||[]).join(", "), poin: (item.poin||[]).join("\n"), _img: item.img || "",
                  }))}
                />
              )}

              {/* --- RUANG KERJA --- */}
              {adminTab === "int_ruang_kerja" && isAdmin && (
                <SubLayananAdmin
                  title="Ruang Kerja"
                  icon=""
                  accentColor="#16213e"
                  storeKey="int_ruang_kerja"
                  data={data}
                  save={save}
                  notify={notify}
                  uploadToCloudinary={uploadToCloudinary}
                  pageDesc="Kelola katalog desain ruang kerja / home office — tambah, edit, hapus kartu produk."
                  sections={[]}
                  imageGroups={[]}
                  crudKey="intRuangKerjaItems"
                  crudLabel="Desain Ruang Kerja"
                  crudFields={[
                    { key:"nama",     label:"Nama Desain",  type:"text",     placeholder:"contoh: Home Office Minimalis" },
                    { key:"style",    label:"Style / Tag",  type:"text",     placeholder:"contoh: Focus, Professional, Smart..." },
                    { key:"material", label:"Material",     type:"text",     placeholder:"contoh: Kayu MDF + Metal" },
                    { key:"harga",    label:"Harga (Rp)",   type:"text",     placeholder:"contoh: 7500000" },
                    { key:"desc",     label:"Deskripsi",    type:"textarea", placeholder:"Keunggulan dan detail desain..." },
                    { key:"fitur",    label:"Fitur (pisah koma)", type:"text", placeholder:"contoh: Floating Desk, Task Light" },
                    { key:"poin", label:"Isi Paket / Yang Didapat (1 baris = 1 poin)", type:"textarea", placeholder:"contoh:\nSurvey lokasi & konsultasi desain gratis\nMaterial sesuai spesifikasi\nGaransi pengerjaan resmi" },
                    { key:"tampilHarga", label:"Tampilkan Harga", type:"toggle", default: true, desc: "Nonaktifkan untuk sembunyikan harga -- kartu akan menampilkan tombol Konsultasi Sekarang penuh sebagai gantinya." },
                  ]}
                  crudHasImage
                  crudHasGallery={true}
                  defaultItems={CATALOG_DATA["interior/ruang-kerja"].items.map(item => ({
                    id: item.id, nama: item.nama, style: item.style || "", material: item.material || "",
                    harga: item.harga ? String(item.harga) : "",
                    desc: item.desc || "", fitur: (item.fitur||[]).join(", "), poin: (item.poin||[]).join("\n"), _img: item.img || "",
                  }))}
                />
              )}

              {/* --- PLAFON MODERN --- */}
              {adminTab === "int_plafon" && isAdmin && (
                <SubLayananAdmin
                  title="Plafon Modern"
                  icon=""
                  accentColor="#0f3460"
                  storeKey="int_plafon"
                  data={data}
                  save={save}
                  notify={notify}
                  uploadToCloudinary={uploadToCloudinary}
                  pageDesc="Kelola katalog produk plafon modern — tambah, edit, hapus kartu produk yang tampil di halaman Plafon Modern."
                  sections={[]}
                  imageGroups={[]}
                  crudKey="intPlafonItems"
                  crudLabel="Produk Plafon Modern"
                  crudFields={[
                    { key:"nama",     label:"Nama Produk",  type:"text",     placeholder:"contoh: Drop Ceiling / Cove Ceiling" },
                    { key:"style",    label:"Style / Tag",  type:"text",     placeholder:"contoh: Modern Luxury, Clean, Elegant..." },
                    { key:"material", label:"Material",     type:"text",     placeholder:"contoh: Gypsum Board + LED Strip" },
                    { key:"harga",    label:"Harga per m² (Rp)", type:"text", placeholder:"contoh: 185000" },
                    { key:"desc",     label:"Deskripsi",    type:"textarea", placeholder:"Keunggulan dan detail produk plafon..." },
                    { key:"fitur",    label:"Fitur (pisah koma)", type:"text", placeholder:"contoh: LED Hidden Light, Bertingkat" },
                    { key:"poin", label:"Isi Paket / Yang Didapat (1 baris = 1 poin)", type:"textarea", placeholder:"contoh:\nSurvey lokasi & konsultasi desain gratis\nMaterial sesuai spesifikasi\nGaransi pengerjaan resmi" },
                    { key:"tampilHarga", label:"Tampilkan Harga", type:"toggle", default: true, desc: "Nonaktifkan untuk sembunyikan harga -- kartu akan menampilkan tombol Konsultasi Sekarang penuh sebagai gantinya." },
                    { key:"hargaDetail", label:"Harga Detail Per M²", type:"priceBreakdown" },
                  ]}
                  crudHasImage
                  crudHasGallery={true}
                  defaultItems={CATALOG_DATA["interior/plafon-modern"].items.map(item => ({
                    id: item.id, nama: item.nama, style: item.style || "", material: item.material || "",
                    harga: item.harga ? String(item.harga) : "",
                    desc: item.desc || "", fitur: (item.fitur||[]).join(", "), poin: (item.poin||[]).join("\n"), _img: item.img || "",
                  }))}
                />
              )}

              {/* SETTING BACKDROP TV */}
              {adminTab === "int_backdrop_tv" && isAdmin && (
                <SubLayananAdmin
                  title="Backdrop"
                  icon=""
                  accentColor="#8B6914"
                  storeKey="int_backdrop_tv"
                  data={data}
                  save={save}
                  notify={notify}
                  uploadToCloudinary={uploadToCloudinary}
                  pageDesc="Kelola katalog produk backdrop — tambah, edit, hapus kartu produk yang tampil di halaman Backdrop."
                  sections={[]}
                  imageGroups={[]}
                  crudKey="intBackdropTvItems"
                  crudLabel="Produk Backdrop"
                  crudFields={[
                    { key:"nama",     label:"Nama Produk",  type:"text",     placeholder:"contoh: Backdrop TV Kayu + Hidden LED" },
                    { key:"style",    label:"Style / Tag",  type:"text",     placeholder:"contoh: Modern Warm, Luxury, Industrial Chic..." },
                    { key:"material", label:"Material",     type:"text",     placeholder:"contoh: Kayu Veneer + LED Strip" },
                    { key:"harga",    label:"Harga per m² (Rp)", type:"text", placeholder:"contoh: 385000" },
                    { key:"desc",     label:"Deskripsi",    type:"textarea", placeholder:"Keunggulan dan detail produk backdrop TV..." },
                    { key:"fitur",    label:"Fitur (pisah koma)", type:"text", placeholder:"contoh: Ambient LED, RGB Opsional" },
                    { key:"poin", label:"Isi Paket / Yang Didapat (1 baris = 1 poin)", type:"textarea", placeholder:"contoh:\nSurvey lokasi & konsultasi desain gratis\nMaterial sesuai spesifikasi\nGaransi pengerjaan resmi" },
                    { key:"tampilHarga", label:"Tampilkan Harga", type:"toggle", default: true, desc: "Nonaktifkan untuk sembunyikan harga -- kartu akan menampilkan tombol Konsultasi Sekarang penuh sebagai gantinya." },
                    { key:"hargaDetail", label:"Harga Detail Per M²", type:"priceBreakdown" },
                  ]}
                  crudHasImage
                  crudHasGallery={true}
                  defaultItems={CATALOG_DATA["interior/backdrop"].items.map(item => ({
                    id: item.id, nama: item.nama, style: item.style || "", material: item.material || "",
                    harga: item.harga ? String(item.harga) : "",
                    desc: item.desc || "", fitur: (item.fitur||[]).join(", "), poin: (item.poin||[]).join("\n"), _img: item.img || "",
                  }))}
                />
              )}

              {/* SETTING PAGAR RUMAH */}
              {adminTab === "ext_pagar" && isAdmin && (
                <SubLayananAdmin
                  title="Pagar Rumah"
                  icon=""
                  accentColor="#0f3460"
                  storeKey="ext_pagar"
                  data={data}
                  save={save}
                  notify={notify}
                  uploadToCloudinary={uploadToCloudinary}
                  pageDesc="Kelola katalog desain pagar rumah — tambah, edit, hapus kartu produk yang tampil di halaman Pagar."
                  sections={[]}
                  imageGroups={[]}
                  crudKey="extPagarItems"
                  crudLabel="Desain Pagar"
                  crudFields={[
                    { key:"nama",     label:"Nama Desain",  type:"text",     placeholder:"contoh: Pagar Hollow Minimalis" },
                    { key:"style",    label:"Style / Tag",  type:"text",     placeholder:"contoh: Modern, Classic, Premium..." },
                    { key:"material", label:"Material",     type:"text",     placeholder:"contoh: Besi Hollow 4x4cm" },
                    { key:"harga",    label:"Harga (Rp)",   type:"text",     placeholder:"contoh: 850000" },
                    { key:"desc",     label:"Deskripsi",    type:"textarea", placeholder:"Keunggulan dan detail desain pagar..." },
                    { key:"fitur",    label:"Fitur (pisah koma)", type:"text", placeholder:"contoh: Anti Karat, Custom Warna" },
                    { key:"poin", label:"Isi Paket / Yang Didapat (1 baris = 1 poin)", type:"textarea", placeholder:"contoh:\nSurvey lokasi & konsultasi desain gratis\nMaterial sesuai spesifikasi\nGaransi pengerjaan resmi" },
                    { key:"tampilHarga", label:"Tampilkan Harga", type:"toggle", default: true, desc: "Nonaktifkan untuk sembunyikan harga -- kartu akan menampilkan tombol Konsultasi Sekarang penuh sebagai gantinya." },
                    { key:"hargaDetail", label:"Harga Detail Per M²", type:"priceBreakdown" },
                  ]}
                  crudHasImage
                  crudHasGallery={true}
                  defaultItems={CATALOG_DATA["eksterior/pagar"].items.map(item => ({
                    id: item.id, nama: item.nama, style: item.style || "", material: item.material || "",
                    harga: item.harga ? String(item.harga) : "",
                    desc: item.desc || "", fitur: (item.fitur||[]).join(", "), poin: (item.poin||[]).join("\n"), _img: item.img || "",
                  }))}
                />
              )}

              {/* SETTING KANOPI */}
              {adminTab === "ext_kanopi" && isAdmin && (
                <SubLayananAdmin
                  title="Kanopi"
                  icon=""
                  accentColor="#2d6a4f"
                  storeKey="ext_kanopi"
                  data={data}
                  save={save}
                  notify={notify}
                  uploadToCloudinary={uploadToCloudinary}
                  pageDesc="Kelola katalog desain kanopi — tambah, edit, hapus kartu produk yang tampil di halaman Kanopi."
                  sections={[]}
                  imageGroups={[]}
                  crudKey="extKanopiItems"
                  crudLabel="Desain Kanopi"
                  crudFields={[
                    { key:"nama",     label:"Nama Desain",  type:"text",     placeholder:"contoh: Kanopi Polycarbonate" },
                    { key:"style",    label:"Style / Tag",  type:"text",     placeholder:"contoh: Popular, Premium, Luxury..." },
                    { key:"material", label:"Material",     type:"text",     placeholder:"contoh: Baja Ringan + Polycarbonate" },
                    { key:"harga",    label:"Harga (Rp)",   type:"text",     placeholder:"contoh: 280000" },
                    { key:"desc",     label:"Deskripsi",    type:"textarea", placeholder:"Keunggulan dan detail desain kanopi..." },
                    { key:"fitur",    label:"Fitur (pisah koma)", type:"text", placeholder:"contoh: Tembus Cahaya, UV Protection" },
                    { key:"poin", label:"Isi Paket / Yang Didapat (1 baris = 1 poin)", type:"textarea", placeholder:"contoh:\nSurvey lokasi & konsultasi desain gratis\nMaterial sesuai spesifikasi\nGaransi pengerjaan resmi" },
                    { key:"tampilHarga", label:"Tampilkan Harga", type:"toggle", default: true, desc: "Nonaktifkan untuk sembunyikan harga -- kartu akan menampilkan tombol Konsultasi Sekarang penuh sebagai gantinya." },
                    { key:"hargaDetail", label:"Harga Detail Per M²", type:"priceBreakdown" },
                  ]}
                  crudHasImage
                  crudHasGallery={true}
                  defaultItems={CATALOG_DATA["eksterior/kanopi"].items.map(item => ({
                    id: item.id, nama: item.nama, style: item.style || "", material: item.material || "",
                    harga: item.harga ? String(item.harga) : "",
                    desc: item.desc || "", fitur: (item.fitur||[]).join(", "), poin: (item.poin||[]).join("\n"), _img: item.img || "",
                  }))}
                />
              )}

              {/* SETTING KUSEN & PARTISI (eks. Aluminium) */}
              {adminTab === "ext_aluminium" && isAdmin && (
                <SubLayananAdmin
                  title="Kusen & Partisi"
                  icon=""
                  accentColor="#555b6e"
                  storeKey="ext_aluminium"
                  data={data}
                  save={save}
                  notify={notify}
                  uploadToCloudinary={uploadToCloudinary}
                  pageDesc="Kelola katalog produk kusen & partisi aluminium — tambah, edit, hapus kartu produk yang tampil di halaman Kusen & Partisi."
                  sections={[]}
                  imageGroups={[]}
                  crudKey="extAluminiumItems"
                  crudLabel="Produk Kusen & Partisi"
                  crudFields={[
                    { key:"nama",     label:"Nama Produk",  type:"text",     placeholder:"contoh: Kusen Jendela Casement" },
                    { key:"style",    label:"Style / Tag",  type:"text",     placeholder:"contoh: Classic, Modern, Office..." },
                    { key:"material", label:"Material",     type:"text",     placeholder:"contoh: Aluminium 4 inch" },
                    { key:"harga",    label:"Harga (Rp)",   type:"text",     placeholder:"contoh: 450000" },
                    { key:"desc",     label:"Deskripsi",    type:"textarea", placeholder:"Keunggulan dan detail produk aluminium..." },
                    { key:"fitur",    label:"Fitur (pisah koma)", type:"text", placeholder:"contoh: Rapat Udara, Easy Clean" },
                    { key:"poin", label:"Isi Paket / Yang Didapat (1 baris = 1 poin)", type:"textarea", placeholder:"contoh:\nSurvey lokasi & konsultasi desain gratis\nMaterial sesuai spesifikasi\nGaransi pengerjaan resmi" },
                    { key:"tampilHarga", label:"Tampilkan Harga", type:"toggle", default: true, desc: "Nonaktifkan untuk sembunyikan harga -- kartu akan menampilkan tombol Konsultasi Sekarang penuh sebagai gantinya." },
                  ]}
                  crudHasImage
                  crudHasGallery={true}
                  defaultItems={CATALOG_DATA["eksterior/kusen-partisi"].items.map(item => ({
                    id: item.id, nama: item.nama, style: item.style || "", material: item.material || "",
                    harga: item.harga ? String(item.harga) : "",
                    desc: item.desc || "", fitur: (item.fitur||[]).join(", "), poin: (item.poin||[]).join("\n"), _img: item.img || "",
                  }))}
                />
              )}








              {/* PRODUK FURNITUR */}
              {adminTab === "produk_furnitur" && isAdmin && (
                <SubLayananAdmin
                  title="Produk Furnitur"
                  icon=""
                  accentColor="#C9AA71"
                  storeKey="furnitur"
                  data={data}
                  save={save}
                  notify={notify}
                  uploadToCloudinary={uploadToCloudinary}
                  pageDesc="Kelola katalog produk furnitur — tambah, edit, dan hapus kartu produk yang tampil di halaman Furnitur (e-commerce)."
                  sections={[]}
                  imageGroups={[]}
                  crudKey="furniturItems"
                  crudLabel="Kartu Produk Furnitur"
                  crudHasGallery={true}
                  crudFields={[
                    { key: "nama",     label: "Nama Produk",  type: "text",     placeholder: "contoh: Sofa Minimalis 3-Dudukan" },
                    { key: "kategori", label: "Kategori",     type: "category", placeholder: "contoh: Sofa, Meja, Kursi, Lemari..." },
                    { key: "harga",    label: "Harga (Rp)",   type: "text",     placeholder: "contoh: 3500000" },
                    { key: "deskripsi",label: "Deskripsi",    type: "textarea", placeholder: "Material, dimensi, warna, keunggulan produk..." },
                  ]}
                  crudHasImage
                  defaultItems={[
                    { id:"fur1", nama:"Sofa Minimalis 3-Dudukan", kategori:"Sofa", harga:"4500000", deskripsi:"Sofa modern berbahan fabric premium tahan lama. Dimensi 210×85×80 cm. Tersedia dalam warna abu-abu dan krem.", _img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80" },
                    { id:"fur2", nama:"Meja Makan Kayu Solid 6-Kursi", kategori:"Meja", harga:"6800000", deskripsi:"Meja makan dari kayu jati solid dengan finishing natural. Kapasitas 6 kursi, dimensi 180×90×76 cm.", _img:"https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80" },
                    { id:"fur3", nama:"Lemari Pakaian Sliding 3-Pintu", kategori:"Lemari", harga:"5200000", deskripsi:"Lemari geser modern dengan cermin full-length di pintu tengah. Material HPL anti-gores, dimensi 180×60×200 cm.", _img:"https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&q=80" },
                    { id:"fur4", nama:"Kursi Kerja Ergonomis", kategori:"Kursi", harga:"2100000", deskripsi:"Kursi ergonomis dengan sandaran punggung adjustable, dudukan memory foam, dan armrest 4D. Cocok untuk WFH.", _img:"https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&q=80" },
                    { id:"fur5", nama:"Nakas Kayu Minimalis", kategori:"Nakas", harga:"890000", deskripsi:"Nakas samping ranjang dengan laci tersembunyi. Material MDF dengan lapisan veneer kayu oak, dimensi 45×40×55 cm.", _img:"https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=600&q=80" },
                    { id:"fur6", nama:"Rak Buku Modular 5-Susun", kategori:"Rak", harga:"1750000", deskripsi:"Rak buku modular yang dapat diatur sesuai kebutuhan. Material besi powder coat + kayu pinus, muat 200+ buku.", _img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80" },
                  ]}
                />
              )}

              {/* PRODUK CUSTOM FURNITUR */}
              {adminTab === "produk_custom_furnitur" && isAdmin && (
                <SubLayananAdmin
                  title="Produk Custom Furnitur"
                  icon=""
                  accentColor="#C9AA71"
                  storeKey="custom_furnitur"
                  data={data}
                  save={save}
                  notify={notify}
                  uploadToCloudinary={uploadToCloudinary}
                  pageDesc="Kelola katalog referensi Custom Furnitur — tambah, edit, dan hapus kartu referensi yang tampil di halaman Custom Furnitur (made-to-order)."
                  sections={[]}
                  imageGroups={[]}
                  crudKey="customFurniturItems"
                  crudLabel="Kartu Referensi Custom Furnitur"
                  crudHasGallery={true}
                  crudFields={[
                    { key: "nama",     label: "Nama Referensi", type: "text",     placeholder: "contoh: Sofa Custom L-Shape" },
                    { key: "kategori", label: "Kategori",       type: "category", placeholder: "contoh: Sofa, Meja, Kursi, Lemari..." },
                    { key: "harga",    label: "Harga Mulai Dari (Rp)", type: "text", placeholder: "contoh: 5500000" },
                    { key: "deskripsi",label: "Deskripsi",      type: "textarea", placeholder: "Material, dimensi, opsi ukuran/warna yang bisa disesuaikan..." },
                  ]}
                  crudHasImage
                  defaultItems={[
                    { id:"cfur1", nama:"Sofa Custom L-Shape", kategori:"Sofa", harga:"7500000", deskripsi:"Sofa L-shape dengan ukuran, warna kain, dan konfigurasi disesuaikan ruangan Anda. Rangka kayu solid, busa density tinggi.", _img:"https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=80" },
                    { id:"cfur2", nama:"Meja Makan Custom Ukuran", kategori:"Meja", harga:"6500000", deskripsi:"Meja makan dibuat sesuai jumlah kursi dan luas ruang makan Anda. Pilihan kayu jati, mahoni, atau MDF laminasi.", _img:"https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=600&q=80" },
                    { id:"cfur3", nama:"Lemari Built-in Custom", kategori:"Lemari", harga:"8000000", deskripsi:"Lemari built-in yang dirancang pas dengan sudut dan dimensi ruangan — tanpa celah, memaksimalkan ruang simpan.", _img:"https://images.unsplash.com/photo-1595515106864-077fed64bd1c?w=600&q=80" },
                    { id:"cfur4", nama:"Kitchen Set Custom", kategori:"Dapur", harga:"12000000", deskripsi:"Kitchen set dengan tata letak, warna, dan material sesuai keinginan — dari minimalis modern hingga klasik.", _img:"https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&q=80" },
                    { id:"cfur5", nama:"Nakas & Headboard Custom", kategori:"Kamar Tidur", harga:"3200000", deskripsi:"Set nakas dan headboard dengan desain senada, ukuran disesuaikan kasur dan tema kamar Anda.", _img:"https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80" },
                    { id:"cfur6", nama:"Rak & Partisi Custom", kategori:"Rak", harga:"2800000", deskripsi:"Rak atau partisi ruangan dengan bentuk dan jumlah sekat sesuai kebutuhan penyimpanan dan pembagian ruang.", _img:"https://images.unsplash.com/photo-1594620302200-9a762244a156?w=600&q=80" },
                  ]}
                />
              )}


              {adminTab === "paket_landscape" && isAdmin && (
                <PaketGridManager
                  data={data}
                  save={save}
                  notify={notify}
                  storeKey="landscapeCategories"
                  title="Paket Landscape & Taman (Halaman Mixing Grid)"
                  icon=""
                  accentColor="#1a472a"
                  defaultItems={LANDSCAPE_CATEGORIES}
                  showSlideDir={false}
                  ctaHint="Kelola foto, judul, deskripsi, dan harga setiap kategori yang tampil di halaman Landscape & Taman (layout magazine mixing grid 1-3-2 kolom)."
                />
              )}

              {/* PAKET RUMAH SUBSIDI (Magazine Grid) */}
              {adminTab === "paket_rumahsubsidi" && isAdmin && (
                <PaketGridManager
                  data={data}
                  save={save}
                  notify={notify}
                  storeKey="rumahSubsidiPaket"
                  title="Paket Renovasi Rumah Subsidi (Halaman Mixing Grid)"
                  icon=""
                  accentColor="#2E3D3F"
                  defaultItems={RS_PAKET_DATA}
                  showSlideDir
                  ctaHint="Kelola foto, judul, deskripsi, harga, dan arah animasi slideshow setiap paket renovasi rumah subsidi (layout magazine mixing grid 1-3-2 kolom)."
                />
              )}

              {/* PAKET PEMBANGUNAN KOST (Magazine Grid) */}
              {adminTab === "paket_kost" && isAdmin && (
                <PaketGridManager
                  data={data}
                  save={save}
                  notify={notify}
                  storeKey="pembangunanKostPaket"
                  title="Paket Pembangunan Kost (Halaman Mixing Grid)"
                  icon=""
                  accentColor="#5C4033"
                  defaultItems={KOST_PAKET_DATA}
                  showSlideDir
                  ctaHint="Kelola foto, judul, deskripsi, harga, dan arah animasi slideshow setiap paket pembangunan kost (layout magazine mixing grid 1-3-2 kolom)."
                />
              )}

              {/* PAKET PEMBANGUNAN CAFE (Magazine Grid) */}
              {adminTab === "paket_cafe" && isAdmin && (
                <PaketGridManager
                  data={data}
                  save={save}
                  notify={notify}
                  storeKey="pembangunanCafePaket"
                  title="Paket Pembangunan Cafe (Halaman Mixing Grid)"
                  icon=""
                  accentColor="#8B6914"
                  defaultItems={CAFE_PAKET_DATA}
                  showSlideDir
                  ctaHint="Kelola foto, judul, deskripsi, harga, dan arah animasi slideshow setiap paket pembangunan cafe (layout magazine mixing grid 1-3-2 kolom)."
                />
              )}

              {/* PAKET PEMBANGUNAN RUKO (Magazine Grid) */}
              {adminTab === "paket_ruko" && isAdmin && (
                <PaketGridManager
                  data={data}
                  save={save}
                  notify={notify}
                  storeKey="pembangunanRukoPaket"
                  title="Paket Pembangunan Ruko (Halaman Mixing Grid)"
                  icon=""
                  accentColor="#3D5254"
                  defaultItems={RUKO_PAKET_DATA}
                  showSlideDir
                  ctaHint="Kelola foto, judul, deskripsi, harga, dan arah animasi slideshow setiap paket pembangunan ruko (layout magazine mixing grid 1-3-2 kolom)."
                />
              )}

              {/* ══ TEMA RUMAH — Setting teks & foto hero + CRUD konten tema ══ */}
              {adminTab === "set_temarumah" && isAdmin && (
                <TemaRumahAdminPanel data={data} save={save} notify={notify} uploadToCloudinary={uploadToCloudinary} />
              )}

              {/* SUSUNAN TIM */}
              {adminTab === "team" && isAdmin && (
                <TeamAdmin data={data} save={save} notify={notify} uploadToCloudinary={uploadToCloudinary} />
              )}

              {/* MESSAGES */}
              {adminTab === "messages" && canCS && (
                <div className="fade-in">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 500, color: "#2E3D3F" }}>Pesan Masuk</h1>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#5A6A6C" }}>Total: {data.messages.length} pesan</span>
                      {data.messages.filter(m => !m.read).length > 0 && (
                        <span style={{ fontSize: 11, background: "#e74c3c", color: "#fff", borderRadius: 10, padding: "3px 10px", fontWeight: 600 }}>
                          {data.messages.filter(m => !m.read).length} belum dibaca
                        </span>
                      )}
                      {data.messages.some(m => !m.read) && (
                        <button onClick={() => {
                          const msgs = data.messages.map(m => ({ ...m, read: true }));
                          save({ ...data, messages: msgs }); notify("Semua pesan ditandai sudah dibaca.");
                        }} style={{ fontSize: 11, padding: "5px 12px", background: "#FAF7F0", border: "1px solid #D4C4A0", borderRadius: 6, color: "#3D5254", cursor: "pointer" }}>
                          Tandai Semua Dibaca
                        </button>
                      )}
                    </div>
                  </div>

                  {data.messages.length === 0
                    ? <div style={{ textAlign: "center", padding: "60px", color: "#5A6A6C", background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}></div>
                        <p style={{ fontSize: 14 }}>Belum ada pesan masuk.</p>
                      </div>
                    : [...data.messages].reverse().map(m => (
                      <div key={m.id} style={{ background: "#fff", borderRadius: 10, marginBottom: 16,
                        boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderLeft: m.read ? "3px solid #E8DCC8" : "3px solid #e74c3c",
                        overflow: "hidden", opacity: m.deleted ? 0.5 : 1 }}>
                        {/* Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 20px 12px", borderBottom: "1px solid #FAF7F0" }}>
                          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 50%,#8B6914 100%)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16 }}>
                              {m.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: "#2E3D3F", lineHeight: 1.3 }}>
                                {m.name}
                                {!m.read && <span style={{ marginLeft: 8, fontSize: 9, background: "#e74c3c", color: "#fff", borderRadius: 8, padding: "2px 7px", fontWeight: 700, letterSpacing: ".5px" }}>BARU</span>}
                              </div>
                              <div style={{ fontSize: 12, color: "#5A6A6C", marginTop: 2 }}>{m.email}</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                            <span style={{ fontSize: 11, color: "#A89070" }}>{m.date}</span>
                            {/* READ button */}
                            <button onClick={() => {
                              const msgs = data.messages.map(x => x.id === m.id ? { ...x, read: !x.read } : x);
                              save({ ...data, messages: msgs });
                            }} title={m.read ? "Tandai belum dibaca" : "Tandai sudah dibaca"}
                              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "1px solid #D4C4A0",
                                background: m.read ? "#FAF7F0" : "#e8f8ef", color: m.read ? "#5A6A6C" : "#27ae60", cursor: "pointer", fontWeight: 600 }}>
                              {m.read ? "✓ Dibaca" : "Tandai Dibaca"}
                            </button>
                            {/* REPLY button */}
                            <button onClick={() => setReplyTo(replyTo === m.id ? null : m.id)}
                              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "1px solid #A89070",
                                background: replyTo === m.id ? "#F5EDD8" : "none", color: "#C9AA71", cursor: "pointer", fontWeight: 600 }}>
                              ↩ Reply
                            </button>
                            {/* DELETE button */}
                            <button onClick={() => {
                              if (window.confirm(`Hapus pesan dari ${m.name}? Pesan tidak dapat dikembalikan.`)) {
                                const msgs = data.messages.filter(x => x.id !== m.id);
                                save({ ...data, messages: msgs }); notify("Pesan dihapus.");
                              }
                            }} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "1px solid #f5c6c6",
                              background: "#fff", color: "#e74c3c", cursor: "pointer", fontWeight: 600 }}>
                              Hapus
                            </button>
                          </div>
                        </div>
                        {/* Body */}
                        <div style={{ padding: "14px 20px 16px" }}>
                          <p style={{ fontSize: 14, color: "#2E3D3F", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{m.message}</p>
                          {/* Reply history */}
                          {m.replies?.length > 0 && (
                            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase" }}>Riwayat Balasan</div>
                              {m.replies.map((r, i) => (
                                <div key={i} style={{ background: "#FAF7F0", borderRadius: 6, padding: "10px 14px", fontSize: 13, color: "#3a5066", borderLeft: "2px solid #C9AA71" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                    <strong style={{ color: "#C9AA71", fontSize: 12 }}>↩ {r.author}</strong>
                                    <span style={{ fontSize: 11, color: "#A89070" }}>{r.date}</span>
                                  </div>
                                  {r.text}
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Reply input */}
                          {replyTo === m.id && (
                            <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "flex-start" }}>
                              <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                                placeholder="Tulis balasan..."
                                rows={3}
                                ref={autoGrowTextarea}
                                onInput={e => autoGrowTextarea(e.target)}
                                style={{ flex: 1, padding: "10px 12px", border: "1.5px solid #C9AA71", borderRadius: 6, fontSize: 13, outline: "none", resize: "none", overflow: "hidden" }} />
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                <button onClick={() => replyMsg(m.id)}
                                  style={{ padding: "9px 18px", background: "#27ae60", color: "#fff", borderRadius: 6, fontSize: 12, border: "none", fontWeight: 600, cursor: "pointer" }}>Kirim</button>
                                <button onClick={() => { setReplyTo(null); setReplyText(""); }}
                                  style={{ padding: "9px 14px", background: "#FAF7F0", borderRadius: 6, fontSize: 12, border: "1px solid #D4C4A0", cursor: "pointer" }}>Batal</button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}

              {/* USERS */}
              {adminTab === "users" && isAdmin && (
                <div className="fade-in">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 500, color: "#2E3D3F" }}>User Management</h1>
                    <button onClick={() => setUserMgmtOpen(v => !v)}
                      style={{ padding: "9px 20px", background: userMgmtOpen ? "#FAF7F0" : "#2E3D3F", color: userMgmtOpen ? "#3D5254" : "#fff",
                        border: userMgmtOpen ? "1px solid #D4C4A0" : "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      {userMgmtOpen ? "✕ Batal" : "+ Tambah User"}
                    </button>
                  </div>

                  {/* Add User Form */}
                  {userMgmtOpen && (
                    <div className="adm-form-card" style={{ background: "#fff", borderRadius: 10, marginBottom: 24, boxShadow: "0 2px 10px rgba(0,0,0,.07)", borderTop: "4px solid #27ae60" }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: "#2E3D3F", marginBottom: 18 }}>Tambah Akun Baru</h3>
                      <div className="adm-grid-2">
                        {[
                          { label: "Nama Lengkap", key: "name", placeholder: "Nama lengkap", type: "text" },
                          { label: "Username", key: "username", placeholder: "username (tanpa spasi)", type: "text" },
                          { label: "Password", key: "password", placeholder: "Min. 6 karakter", type: "password" },
                        ].map(f => (
                          <div key={f.key}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 5 }}>{f.label}</label>
                            {f.type === "password"
                              ? <input type={f.type} placeholder={f.placeholder} value={userMgmtForm[f.key]}
                                  onChange={e => setUserMgmtForm(p => ({ ...p, [f.key]: e.target.value }))}
                                  style={{ width: "100%", padding: "9px 11px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                              : <AutoGrowField placeholder={f.placeholder} value={userMgmtForm[f.key]}
                                  onChange={e => setUserMgmtForm(p => ({ ...p, [f.key]: e.target.value }))}
                                  style={{ width: "100%", padding: "9px 11px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                            }
                          </div>
                        ))}
                        <div>
                          <label style={{ fontSize: 10, fontWeight: 700, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Role</label>
                          <select value={userMgmtForm.role} onChange={e => setUserMgmtForm(p => ({ ...p, role: e.target.value }))}
                            style={{ width: "100%", padding: "9px 11px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 13, outline: "none", background: "#fff" }}>
                            {Object.entries(ROLES).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="adm-actions" style={{ marginTop: 18 }}>
                        <button onClick={() => {
                          const { username, password, role, email, name } = userMgmtForm;
                          if (!username.trim() || !password.trim()) return notify("Username dan password wajib diisi.", "error");
                          if (password.length < 6) return notify("Password minimal 6 karakter.", "error");
                          if (data.users.find(u => u.username === username.trim())) return notify("Username sudah digunakan.", "error");
                          const newUser = { id: Date.now(), username: username.trim(), password, role, email, name: name || username, active: true };
                          save({ ...data, users: [...data.users, newUser] });
                          setUserMgmtForm({ username: "", password: "", role: "content_writer", email: "", name: "" });
                          setUserMgmtOpen(false);
                          notify(`User "${username}" berhasil ditambahkan.`);
                        }} style={{ padding: "10px 24px", background: "#27ae60", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                          Simpan User
                        </button>
                        <button onClick={() => { setUserMgmtOpen(false); setUserMgmtForm({ username: "", password: "", role: "content_writer", email: "", name: "" }); }}
                          style={{ padding: "10px 18px", background: "#FAF7F0", color: "#3D5254", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>
                          Batal
                        </button>
                      </div>
                    </div>
                  )}

                  {/* User Table */}
                  <div className="table-wrap" style={{ background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                      <thead>
                        <tr style={{ background: "#FAF7F0" }}>
                          {["#", "Nama / Username", "Role", "Email", "Status", "Aksi"].map(h => (
                            <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", borderBottom: "1px solid #e8f2f8" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.users.map((u, idx) => (
                          <React.Fragment key={u.id}>
                            <tr style={{ borderBottom: editUserId === u.id ? "none" : "1px solid #F5EDD8", background: idx % 2 === 0 ? "#fff" : "#FDFAF4" }}>
                              <td style={{ padding: "13px 16px", fontSize: 12, color: "#A89070" }}>{idx + 1}</td>
                              <td style={{ padding: "13px 16px" }}>
                                <div style={{ fontWeight: 600, fontSize: 13, color: "#2E3D3F" }}>{u.name || u.username}</div>
                                <div style={{ fontSize: 11, color: "#5A6A6C", marginTop: 1 }}>@{u.username}</div>
                              </td>
                              <td style={{ padding: "13px 16px" }}>
                                {editRoleId === u.id ? (
                                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                    <select defaultValue={u.role}
                                      id={`role-select-${u.id}`}
                                      style={{ padding: "5px 8px", border: "1px solid #D4C4A0", borderRadius: 5, fontSize: 12, outline: "none" }}>
                                      {Object.entries(ROLES).map(([k, v]) => (
                                        <option key={k} value={k}>{v.label}</option>
                                      ))}
                                    </select>
                                    <button onClick={() => {
                                      const sel = document.getElementById(`role-select-${u.id}`)?.value;
                                      if (sel) {
                                        const users = data.users.map(x => x.id === u.id ? { ...x, role: sel } : x);
                                        save({ ...data, users }); notify("Role diperbarui.");
                                      }
                                      setEditRoleId(null);
                                    }} style={{ fontSize: 11, padding: "4px 10px", background: "#27ae60", color: "#fff", borderRadius: 5, border: "none", cursor: "pointer" }}>✓</button>
                                    <button onClick={() => setEditRoleId(null)} style={{ fontSize: 11, padding: "4px 8px", background: "#FAF7F0", borderRadius: 5, border: "1px solid #D4C4A0", cursor: "pointer" }}>✕</button>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, fontWeight: 500,
                                    background: u.role === "admin" ? "#fef0f0" : u.role === "content_writer" ? "#F5EDD8" : "#e8f8ef",
                                    color: ROLES[u.role]?.color }}>
                                    {ROLES[u.role]?.label}
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: "13px 16px", fontSize: 12, color: "#5A6A6C" }}>{u.email || "—"}</td>
                              <td style={{ padding: "13px 16px" }}>
                                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, fontWeight: 500,
                                  background: u.active ? "#e8f8ef" : "#fef0f0", color: u.active ? "#27ae60" : "#e74c3c" }}>
                                  {u.active ? "Aktif" : "Nonaktif"}
                                </span>
                              </td>
                              <td style={{ padding: "13px 16px" }}>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  {/* Tombol Edit */}
                                  {u.username !== "administrator" && editUserId !== u.id && (
                                    <button onClick={() => {
                                      setEditUserId(u.id);
                                      setEditUserForm({ name: u.name || "", email: u.email || "", phone: u.phone || "", password: "" });
                                      setEditRoleId(null);
                                    }}
                                      style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, background: "#fff8e1", color: "#b7600a", border: "1px solid #f5d78e", cursor: "pointer", fontWeight: 600 }}>
                                      Edit
                                    </button>
                                  )}
                                  {/* Tutup Edit */}
                                  {editUserId === u.id && (
                                    <button onClick={() => setEditUserId(null)}
                                      style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, background: "#FAF7F0", color: "#8B6914", border: "1px solid #D4C4A0", cursor: "pointer", fontWeight: 600 }}>
                                      ✕ Tutup
                                    </button>
                                  )}
                                  {/* Ganti Role */}
                                  {u.username !== "administrator" && editRoleId !== u.id && editUserId !== u.id && (
                                    <button onClick={() => setEditRoleId(u.id)}
                                      style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, background: "#F5EDD8", color: "#C9AA71", border: "none", cursor: "pointer", fontWeight: 500 }}>
                                      Ganti Role
                                    </button>
                                  )}
                                  {/* Toggle Aktif */}
                                  {u.username !== "administrator" && editUserId !== u.id && (
                                    <button onClick={() => {
                                      const users = data.users.map(x => x.id === u.id ? { ...x, active: !x.active } : x);
                                      save({ ...data, users }); notify(`User ${u.active ? "dinonaktifkan" : "diaktifkan"}.`);
                                    }} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "none", cursor: "pointer", fontWeight: 500,
                                      background: u.active ? "#fff3f3" : "#e8f8ef", color: u.active ? "#e74c3c" : "#27ae60" }}>
                                      {u.active ? "Nonaktifkan" : "Aktifkan"}
                                    </button>
                                  )}
                                  {/* Hapus */}
                                  {u.username !== "administrator" && editUserId !== u.id && (
                                    <button onClick={() => {
                                      if (window.confirm(`Hapus user "${u.username}"? Tindakan ini tidak dapat dibatalkan.`)) {
                                        const users = data.users.filter(x => x.id !== u.id);
                                        save({ ...data, users }); notify(`User "${u.username}" dihapus.`);
                                      }
                                    }} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, background: "#fff", border: "1px solid #f5c6c6", color: "#e74c3c", cursor: "pointer", fontWeight: 500 }}>
                                      Hapus
                                    </button>
                                  )}
                                  {u.username === "administrator" && (
                                    <span style={{ fontSize: 11, color: "#A89070", fontStyle: "italic" }}>Protected</span>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* -- INLINE EDIT ROW -- */}
                            {editUserId === u.id && (
                              <tr style={{ borderBottom: "1px solid #F5EDD8", background: "#fffbea" }}>
                                <td colSpan={6} style={{ padding: "0" }}>
                                  <div style={{ padding: "18px 20px", borderTop: "2px solid #f5d78e", borderBottom: "2px solid #f5d78e", background: "linear-gradient(135deg,#fffef5 0%,#fffbea 100%)" }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#b7600a", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14 }}>
                                      Edit Data User — @{u.username}
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 14 }}>
                                      {/* Nama */}
                                      <div>
                                        <label style={{ fontSize: 10, fontWeight: 700, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Nama Lengkap</label>
                                        <input
                                          value={editUserForm.name}
                                          onChange={e => setEditUserForm(f => ({ ...f, name: e.target.value }))}
                                          placeholder="Nama lengkap"
                                          style={{ width: "100%", padding: "7px 10px", border: "1px solid #f5d78e", borderRadius: 6, fontSize: 12, outline: "none", background: "#fff", boxSizing: "border-box" }} />
                                      </div>
                                      {/* Email */}
                                      <div>
                                        <label style={{ fontSize: 10, fontWeight: 700, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Email</label>
                                        <input
                                          type="email"
                                          value={editUserForm.email}
                                          onChange={e => setEditUserForm(f => ({ ...f, email: e.target.value }))}
                                          placeholder="email@domain.com"
                                          style={{ width: "100%", padding: "7px 10px", border: "1px solid #f5d78e", borderRadius: 6, fontSize: 12, outline: "none", background: "#fff", boxSizing: "border-box" }} />
                                      </div>
                                      {/* No. HP */}
                                      <div>
                                        <label style={{ fontSize: 10, fontWeight: 700, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 4 }}>No. HP / WhatsApp</label>
                                        <input
                                          value={editUserForm.phone}
                                          onChange={e => setEditUserForm(f => ({ ...f, phone: e.target.value }))}
                                          placeholder="08xxxxxxxxxx"
                                          style={{ width: "100%", padding: "7px 10px", border: "1px solid #f5d78e", borderRadius: 6, fontSize: 12, outline: "none", background: "#fff", boxSizing: "border-box" }} />
                                      </div>
                                      {/* Password baru */}
                                      <div>
                                        <label style={{ fontSize: 10, fontWeight: 700, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Password Baru <span style={{ color: "#b0c4cc", fontWeight: 400 }}>(kosongkan jika tidak ganti)</span></label>
                                        <input
                                          type="password"
                                          value={editUserForm.password}
                                          onChange={e => setEditUserForm(f => ({ ...f, password: e.target.value }))}
                                          placeholder="••••••••"
                                          style={{ width: "100%", padding: "7px 10px", border: "1px solid #f5d78e", borderRadius: 6, fontSize: 12, outline: "none", background: "#fff", boxSizing: "border-box" }} />
                                      </div>
                                    </div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                      <button onClick={() => {
                                        const updated = {
                                          ...u,
                                          name: editUserForm.name.trim() || u.name,
                                          email: editUserForm.email.trim() || u.email,
                                          phone: editUserForm.phone.trim() || u.phone,
                                          ...(editUserForm.password.trim() ? { password: editUserForm.password.trim() } : {}),
                                        };
                                        const users = data.users.map(x => x.id === u.id ? updated : x);
                                        save({ ...data, users });
                                        notify(`Data user "@${u.username}" berhasil diperbarui.`);
                                        setEditUserId(null);
                                      }} style={{ padding: "7px 20px", background: "#b7600a", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                        Simpan Perubahan
                                      </button>
                                      <button onClick={() => setEditUserId(null)}
                                        style={{ padding: "7px 14px", background: "#FAF7F0", color: "#5A6A6C", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
                                        Batal
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                    {data.users.length === 0 && (
                      <div style={{ padding: "32px", textAlign: "center", color: "#5A6A6C", fontSize: 13 }}>Belum ada user terdaftar.</div>
                    )}
                  </div>
                </div>
              )}

              {/* PROFIL AKUN */}
              {adminTab === "profil" && (() => {
                const saveProfileFn = async () => {
                  const { name, phone, email, desc, photo, oldPass, newPass, confirmPass } = profileEdit;
                  try {
                    // Ganti password
                    if (oldPass || newPass || confirmPass) {
                      const stored = await fsGet(`profile-${user.username}`);
                      // user.password sengaja tidak lagi disimpan di sesi (lihat catatan di flow login) —
                      // fallback-nya ambil dari HARDCODED_USERS (password default akun ini) kalau
                      // belum pernah ganti password sebelumnya (belum ada stored._password).
                      const currentPass = stored?._password || HARDCODED_USERS.find(h => h.username === user.username)?.password;
                      if (oldPass !== currentPass) { notify("Password lama salah.", "error"); return; }
                      if (newPass.length < 6) { notify("Password baru minimal 6 karakter.", "error"); return; }
                      if (newPass !== confirmPass) { notify("Konfirmasi password tidak cocok.", "error"); return; }
                    }
                    const prev = await fsGet(`profile-${user.username}`) || {};
                    const patch = { ...prev, name: name || user.name, phone: phone || user.phone, email: email || user.email, desc: desc || user.desc, photo: photo || user.photo };
                    if (profileEdit.newPass) patch._password = profileEdit.newPass;
                    await fsSet(`profile-${user.username}`, patch);
                    setUser(u => ({ ...u, name: patch.name, phone: patch.phone, email: patch.email, desc: patch.desc, photo: patch.photo }));
                    setProfileEdit(p => ({ ...p, oldPass: "", newPass: "", confirmPass: "" }));
                    setProfileEditMode(false);
                    notify("Profil berhasil disimpan!");
                  } catch (err) {
                    notify("Gagal menyimpan profil: " + (err?.message || "Periksa koneksi."), "error");
                  }
                };

                const inp = (label, key, type = "text", placeholder = "") => (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5A6A6C", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{label}</label>
                    {type === "password"
                      ? <input type={type} value={profileEdit[key] ?? ""} placeholder={placeholder || label}
                          onChange={e => setProfileEdit(p => ({ ...p, [key]: e.target.value }))}
                          style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E8DCC8", borderRadius: 8, fontSize: 14, outline: "none", background: "#fff", boxSizing: "border-box" }} />
                      : <AutoGrowField value={profileEdit[key] ?? ""} placeholder={placeholder || label}
                          onChange={e => setProfileEdit(p => ({ ...p, [key]: e.target.value }))}
                          style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E8DCC8", borderRadius: 8, fontSize: 14, outline: "none", background: "#fff", boxSizing: "border-box" }} />
                    }
                  </div>
                );

                return (
                  <div className="fade-in">
                    <h1 style={{ fontSize: 24, fontWeight: 500, color: "#2E3D3F", marginBottom: 28 }}>Profil Akun</h1>
                    <div className="profile-grid">
                      {/* Left: Foto & Info */}
                      <div style={{ background: "#fff", borderRadius: 12, padding: "28px 24px", boxShadow: "0 2px 10px rgba(0,0,0,.06)", textAlign: "center" }}>
                        <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
                          {(profileEdit.photo || user.photo) ? (
                            <img decoding="async" loading="lazy" src={cld(profileEdit.photo || user.photo)} alt="Foto Profil"
                              style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", border: "3px solid #C9AA71" }}
                              onError={onImgError} />
                          ) : (
                            <div style={{ width: 100, height: 100, borderRadius: "50%", background: "linear-gradient(135deg,#2E3D3F,#8B6914)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, color: "#fff", fontWeight: 700, margin: "0 auto" }}>
                              {(user.name || user.username || "?")[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: "#2E3D3F", marginBottom: 4 }}>{user.name || user.username}</div>
                        <div style={{ fontSize: 12, color: "#8B6914", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>{user.role}</div>
                        <div style={{ fontSize: 13, color: "#5A6A6C", marginBottom: 16 }}>{user.email || "-"}</div>
                        {!profileEditMode && (
                          <button onClick={() => {
                            setProfileEdit({ name: user.name || "", phone: user.phone || "", email: user.email || "", desc: user.desc || "", photo: user.photo || "", oldPass: "", newPass: "", confirmPass: "" });
                            setProfileEditMode(true);
                          }} style={{ padding: "9px 22px", background: "linear-gradient(130deg,#2E3D3F,#8B6914)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                            Edit Profil
                          </button>
                        )}
                      </div>

                      {/* Right: Form */}
                      <div style={{ background: "#fff", borderRadius: 12, padding: "28px 28px", boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
                        {!profileEditMode ? (
                          <div>
                            {[["Nama", user.name], ["Email", user.email], ["No. HP", user.phone], ["Deskripsi", user.desc]].map(([label, val]) => (
                              <div key={label} style={{ marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid #FAF7F0" }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>{label}</div>
                                <div style={{ fontSize: 14, color: "#2E3D3F" }}>{val || <span style={{ color: "#bbb" }}>—</span>}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div>
                            <div className="adm-grid-2">
                              <div>{inp("Nama", "name")}</div>
                              <div>{inp("Email", "email", "email")}</div>
                              <div>{inp("No. HP", "phone", "tel")}</div>
                              <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5A6A6C", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>URL Foto Profil</label>
                                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                                  <input type="text" value={profileEdit.photo ?? ""} placeholder="https://..."
                                    onChange={e => setProfileEdit(p => ({ ...p, photo: e.target.value }))}
                                    style={{ flex: 1, padding: "10px 14px", border: "1.5px solid #E8DCC8", borderRadius: 8, fontSize: 13, outline: "none" }} />
                                  {profileEdit.photo && <button onClick={() => setProfileEdit(p => ({ ...p, photo: "" }))} style={{ padding: "0 10px", background: "#fee", color: "#e74c3c", border: "none", borderRadius: 6, cursor: "pointer" }}>✕</button>}
                                </div>
                              </div>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5A6A6C", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Deskripsi</label>
                              <textarea value={profileEdit.desc ?? ""} rows={3} placeholder="Deskripsi singkat..."
                                ref={autoGrowTextarea}
                                onInput={e => autoGrowTextarea(e.target)}
                                onChange={e => setProfileEdit(p => ({ ...p, desc: e.target.value }))}
                                style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E8DCC8", borderRadius: 8, fontSize: 14, outline: "none", resize: "none", overflow: "hidden", boxSizing: "border-box" }} />
                            </div>

                            {/* Ganti Password */}
                            <div style={{ marginTop: 4, marginBottom: 20, background: "#FAF7F0", borderRadius: 10, padding: "18px 20px" }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#2E3D3F", marginBottom: 14 }}>Ganti Password</div>
                              <div className="adm-grid-3">
                                {inp("Password Lama", "oldPass", "password", "••••••••")}
                                {inp("Password Baru", "newPass", "password", "Min. 6 karakter")}
                                {inp("Konfirmasi Baru", "confirmPass", "password", "Ulangi password")}
                              </div>
                              <div style={{ fontSize: 11, color: "#5A6A6C" }}>Kosongkan jika tidak ingin mengganti password.</div>
                            </div>

                            <div className="adm-actions">
                              <button onClick={saveProfileFn}
                                style={{ padding: "10px 26px", background: "linear-gradient(130deg,#2E3D3F,#8B6914)", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                                Simpan Perubahan
                              </button>
                              <button onClick={() => setProfileEditMode(false)}
                                style={{ padding: "10px 20px", background: "#F5EDD8", color: "#2E3D3F", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                                Batal
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* REVIEWS ADMIN */}
              {adminTab === "reviews" && isAdmin && <AdminReviews data={data} save={save} notify={notify} />}

              {/* MARKETING & TRACKING */}
              {adminTab === "marketing" && isAdmin && <MarketingAdminPanel data={data} save={save} notify={notify} />}

              {/* BACKUP & RESTORE DATA */}
              {adminTab === "backup" && isAdmin && <BackupDataPanel data={data} save={save} notify={notify} />}

              {/* SETTINGS */}
              {adminTab === "settings" && isAdmin && (
                <div className="fade-in">
                  <h1 style={{ fontSize: 24, fontWeight: 500, color: "#2E3D3F", marginBottom: 28 }}>Settings</h1>

                  {/* ======================================================= */}
                  {/* SECTION: LOGO */}
                  {/* ======================================================= */}
                  <div className="adm-grid-2" style={{ marginBottom: 24 }}>

                    {/* -- Logo Navbar / Header -- */}
                    <div className="adm-section-card" style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderTop: "4px solid #C9AA71" }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#2E3D3F", marginBottom: 4 }}>Logo Navbar / Header</h3>
                      <p style={{ fontSize: 12, color: "#5A6A6C", marginBottom: 14, lineHeight: 1.6 }}>
                        Tampil di navigasi atas dan admin panel. PNG transparan, rasio 3:1 atau 4:1 direkomendasikan.
                      </p>
                      {data.content.logoImage ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", marginBottom: 12 }}>
                          <img loading="lazy" decoding="async" src={cld(data.content.logoImage)} alt="Logo Navbar"
                            style={{ height: 56, maxWidth: 180, objectFit: "contain", border: "1px solid #F5EDD8", borderRadius: 6, padding: 8, background: "#FAF7F0" }} />
                          <button onClick={() => { save({ ...data, content: { ...data.content, logoImage: "" } }); notify("Logo navbar dihapus."); }}
                            style={{ fontSize: 11, padding: "4px 12px", background: "#fee", color: "#e74c3c", borderRadius: 6, border: "none", cursor: "pointer" }}>Hapus Logo</button>
                        </div>
                      ) : (
                        <div style={{ height: 56, background: "#FAF7F0", borderRadius: 6, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#5A6A6C", border: "1px dashed #D4C4A0" }}>Belum ada logo navbar</div>
                      )}
                      <UploadButton label="Upload Logo Navbar"
                        onDone={urls => {
                          save({ ...data, content: { ...data.content, logoImage: urls[0] } });
                          notify("Logo navbar berhasil diupload!");
                        }}
                        onError={() => notify("Gagal upload logo navbar.", "error")} />
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginTop: 10, marginBottom: 4 }}>Atau URL</label>
                      <div className="adm-input-btn-row">
                        <input placeholder="https://..." defaultValue={data.content.logoImage}
                          id="logo-navbar-url-input"
                          style={{ flex: 1, padding: "8px 10px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 12, outline: "none" }} />
                        <button onClick={() => {
                          const url = document.getElementById("logo-navbar-url-input")?.value?.trim();
                          if (!url) return notify("Masukkan URL logo navbar.", "error");
                          save({ ...data, content: { ...data.content, logoImage: url } });
                          notify("Logo navbar URL disimpan!");
                        }} style={{ padding: "8px 14px", background: "#C9AA71", color: "#fff", borderRadius: 6, fontSize: 12, border: "none", cursor: "pointer", fontWeight: 600 }}>Apply</button>
                      </div>
                    </div>

                    {/* -- Logo Footer -- */}
                    <div className="adm-section-card" style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderTop: "4px solid #3D5254" }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#2E3D3F", marginBottom: 4 }}>Logo Footer</h3>
                      <p style={{ fontSize: 12, color: "#5A6A6C", marginBottom: 14, lineHeight: 1.6 }}>
                        Tampil di bagian bawah halaman (section Kontak). Jika kosong, akan menggunakan Logo Navbar sebagai fallback.
                      </p>
                      {data.content.footerLogoImage ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", marginBottom: 12 }}>
                          <img loading="lazy" decoding="async" src={cld(data.content.footerLogoImage)} alt="Logo Footer"
                            style={{ height: 56, maxWidth: 180, objectFit: "contain", border: "1px solid #F5EDD8", borderRadius: 6, padding: 8, background: "#FAF7F0" }} />
                          <button onClick={() => { save({ ...data, content: { ...data.content, footerLogoImage: "" } }); notify("Logo footer dihapus."); }}
                            style={{ fontSize: 11, padding: "4px 12px", background: "#fee", color: "#e74c3c", borderRadius: 6, border: "none", cursor: "pointer" }}>Hapus Logo</button>
                        </div>
                      ) : (
                        <div style={{ height: 56, background: "#FAF7F0", borderRadius: 6, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#5A6A6C", border: "1px dashed #D4C4A0" }}>Belum ada logo footer (pakai logo navbar)</div>
                      )}
                      <UploadButton label="Upload Logo Footer"
                        onDone={urls => {
                          save({ ...data, content: { ...data.content, footerLogoImage: urls[0] } });
                          notify("Logo footer berhasil diupload!");
                        }}
                        onError={() => notify("Gagal upload logo footer.", "error")} />
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#5A6A6C", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginTop: 10, marginBottom: 4 }}>Atau URL</label>
                      <div className="adm-input-btn-row">
                        <input placeholder="https://..." defaultValue={data.content.footerLogoImage}
                          id="logo-footer-url-input"
                          style={{ flex: 1, padding: "8px 10px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 12, outline: "none" }} />
                        <button onClick={() => {
                          const url = document.getElementById("logo-footer-url-input")?.value?.trim();
                          if (!url) return notify("Masukkan URL logo footer.", "error");
                          save({ ...data, content: { ...data.content, footerLogoImage: url } });
                          notify("Logo footer URL disimpan!");
                        }} style={{ padding: "8px 14px", background: "#3D5254", color: "#fff", borderRadius: 6, fontSize: 12, border: "none", cursor: "pointer", fontWeight: 600 }}>Apply</button>
                      </div>
                    </div>

                  </div>

                  {/* ======================================================= */}
                  {/* SECTION: FOTO BERJALAN (RUNNING) HOME */}
                  {/* ======================================================= */}
                  <div className="adm-section-card" style={{ background: "#fff", borderRadius: 8, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderTop: "4px solid #3498db" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#2E3D3F", marginBottom: 4 }}>Foto Berjalan (Running) Home</h3>
                    <p style={{ fontSize: 12, color: "#5A6A6C", marginBottom: 20, lineHeight: 1.6 }}>
                      Foto yang berjalan otomatis (scroll) di halaman Home, section "Koleksi Kami". Tampilan adalah <strong>campuran</strong> foto yang Anda upload manual di sini <strong>+</strong> foto yang diambil otomatis dari katalog Interior, Eksterior, dan Furnitur. Upload manual jumlahnya bebas / tidak terbatas.
                    </p>

                    {/* Upload baru */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 18 }}>
                      <UploadButton label="Upload Foto (bisa banyak sekaligus)" multiple={true}
                        style={{ fontSize: 12, padding: "9px 16px" }}
                        onDone={urls => {
                          const next = [...(data.images?.running || []), ...urls];
                          save({ ...data, images: { ...data.images, running: next } });
                          notify(`${urls.length} foto running ditambahkan!`);
                        }}
                        onError={() => notify("Sebagian foto gagal diupload.", "error")} />
                      <div className="adm-input-btn-row" style={{ flex: "1 1 320px" }}>
                        <input id="running-img-url" placeholder="atau tempel URL gambar..."
                          style={{ flex: 1, padding: "8px 10px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 12, outline: "none", minWidth: 0 }} />
                        <button onClick={() => {
                          const inputEl = document.getElementById("running-img-url");
                          const url = inputEl?.value?.trim();
                          if (!url) return notify("Masukkan URL.", "error");
                          const next = [...(data.images?.running || []), url];
                          save({ ...data, images: { ...data.images, running: next } });
                          if (inputEl) inputEl.value = "";
                          notify("Foto running ditambahkan!");
                        }} style={{ padding: "8px 14px", background: "#3498db", color: "#fff", borderRadius: 6, fontSize: 12, border: "none", cursor: "pointer", fontWeight: 600 }}>Tambah</button>
                      </div>
                    </div>

                    {/* Daftar foto manual */}
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {(data.images?.running?.length || 0)} Foto Manual Tersimpan
                    </div>
                    {(!data.images?.running || data.images.running.length === 0) ? (
                      <div style={{ padding: "20px", background: "#FAF7F0", border: "1px dashed #D4C4A0", borderRadius: 8, textAlign: "center", color: "#5A6A6C", fontSize: 12 }}>
                        Belum ada foto manual. Section ini tetap tampil terisi karena otomatis mengambil foto dari katalog Interior, Eksterior, dan Furnitur.
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                        {data.images.running.map((img, idx) => (
                          <div key={idx} style={{ background: "#FAF7F0", borderRadius: 8, padding: 8, border: "1px solid #E8DCC8" }}>
                            <img decoding="async" loading="lazy" src={cld(img)} alt={`Running ${idx+1}`} style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 5, marginBottom: 6, border: "1px solid #D4C4A0" }}
                              onError={onImgError} />
                            <button onClick={() => {
                              const next = data.images.running.filter((_, i) => i !== idx);
                              save({ ...data, images: { ...data.images, running: next } });
                              notify("Foto dihapus.");
                            }} style={{ width: "100%", padding: "5px", background: "none", color: "#e74c3c", border: "1px solid #e74c3c", borderRadius: 5, fontSize: 10, cursor: "pointer" }}>Hapus</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ======================================================= */}
                  {/* SECTION: LAYANAN SECTION HOME */}
                  {/* ======================================================= */}
                  <div className="adm-section-card" style={{ background: "#fff", borderRadius: 8, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderTop: "4px solid #8B6914" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#2E3D3F", marginBottom: 4 }}>Layanan Section Home</h3>
                    <p style={{ fontSize: 12, color: "#5A6A6C", marginBottom: 20, lineHeight: 1.6 }}>
                      Atur foto & teks kartu pada section "Layanan HIKIMORI CONST Kami" di halaman Home.
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 16 }}>
                      {((data.homeServices && data.homeServices.length > 0) ? data.homeServices : HOME_SERVICES_DEFAULT).map((svc, idx) => (
                        <HomeServiceCardEditor key={`${idx}::${svc.title || ""}::${svc.img || ""}`} index={idx} svc={svc} data={data} save={save} notify={notify} />
                      ))}
                    </div>
                    <button onClick={() => {
                        const list = (data.homeServices && data.homeServices.length > 0) ? [...data.homeServices] : HOME_SERVICES_DEFAULT.map(x => ({ ...x }));
                        list.push({ num: String(list.length + 1).padStart(2, "0"), title: "Layanan Baru", desc: "Deskripsi singkat layanan.", img: "" });
                        save({ ...data, homeServices: list });
                        notify("Layanan baru ditambahkan!");
                      }} style={{ padding: "9px 16px", background: "#2ecc71", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Tambah Layanan</button>

                    {/* Tombol reset — sengaja dibuat kecil & ditaruh terpisah paling bawah supaya tidak gampang kepencet tidak sengaja */}
                    <div style={{ textAlign: "center", marginTop: 24 }}>
                      <button onClick={() => {
                        if (!window.confirm("Yakin ingin reset ke teks & foto default? Semua layanan yang sudah kamu ubah akan DIGANTI dan tidak bisa dikembalikan lagi.")) return;
                        save({ ...data, homeServices: [] });
                        notify("Direset ke teks & foto default.");
                      }} style={{ padding: "4px 10px", background: "transparent", border: "1px dashed #D5C9B0", color: "#A89070", borderRadius: 6, fontSize: 10.5, fontWeight: 500, cursor: "pointer", opacity: 0.7, transition: "opacity .15s" }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = 1)}
                        onMouseLeave={e => (e.currentTarget.style.opacity = 0.7)}>
                        Reset ke Default
                      </button>
                    </div>
                  </div>

                  {/* ======================================================= */}
                  {/* SECTION: KONTEN TEKS HALAMAN HOME */}
                  {/* ======================================================= */}
                  <div className="adm-section-card" style={{ background: "#fff", borderRadius: 8, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderTop: "4px solid #27ae60" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#2E3D3F", marginBottom: 4 }}>Konten Teks Halaman Home</h3>
                    <p style={{ fontSize: 12, color: "#5A6A6C", marginBottom: 20, lineHeight: 1.6 }}>
                      Edit semua teks yang tampil di halaman utama — judul hero, subtitle, teks banner, section konsultasi, dan lainnya.
                    </p>
                    {[
                      { label: "Hero — Judul Utama", key: "heroTitle", placeholder: "Developer Perumahan & Jasa Desain", multiline: false },
                      { label: "Hero — Subtitle / Deskripsi", key: "heroSub", placeholder: "Kami hadir sebagai mitra terpercaya...", multiline: true },
                      { label: "Banner Adv — Judul", key: "advTitle", placeholder: "Wujudkan Hunian Impian Anda", multiline: false },
                      { label: "Banner Adv — Sub Label", key: "advSub", placeholder: "DEVELOPER & JASA PERUMAHAN", multiline: false },
                      { label: "Banner Adv — Quote", key: "advQuote", placeholder: '"Kutipan inspiratif..."', multiline: true },
                      { label: "Section Proyek Baru — Judul", key: "newAdvTitle", placeholder: "Proyek Terbaru Kami", multiline: false },
                      { label: "Section Proyek Baru — Sub", key: "newAdvSub", placeholder: "Temukan portofolio terkini...", multiline: true },
                      { label: "Section Konsultasi — Judul", key: "bookTitle", placeholder: "Konsultasikan Proyek Anda", multiline: false },
                      { label: "Section Konsultasi — Sub", key: "bookSub", placeholder: "Tim ahli kami siap membantu...", multiline: true },
                      { label: "Newsletter — Judul", key: "newsletterTitle", placeholder: "Dapatkan Update Proyek & Promo Terbaru", multiline: false },
                    ].map(field => {
                      const fieldId = `home-content-${field.key}`;
                      return (
                        <div key={field.key} style={{ marginBottom: 18 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", letterSpacing: "0.8px", textTransform: "uppercase", display: "block", marginBottom: 6 }}>{field.label}</label>
                          {field.multiline ? (
                            <textarea id={fieldId} defaultValue={data.content[field.key] || ""} placeholder={field.placeholder} rows={3}
                              ref={autoGrowTextarea}
                              onInput={e => autoGrowTextarea(e.target)}
                              style={{ width: "100%", padding: "9px 12px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 13, outline: "none", resize: "none", overflow: "hidden", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }} />
                          ) : (
                            <input id={fieldId} defaultValue={data.content[field.key] || ""} placeholder={field.placeholder}
                              style={{ width: "100%", padding: "9px 12px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                          )}
                          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                            <button onClick={() => {
                              const val = document.getElementById(fieldId)?.value?.trim();
                              if (!val) return notify(`Isi dulu field ${field.label}.`, "error");
                              save({ ...data, content: { ...data.content, [field.key]: val } });
                              notify(`${field.label} disimpan!`);
                            }} style={{ padding: "7px 18px", background: "#27ae60", color: "#fff", borderRadius: 6, fontSize: 12, border: "none", fontWeight: 600, cursor: "pointer" }}>Simpan</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ======================================================= */}
                  {/* SECTION: KONTEN ABOUT & CONTACT */}
                  {/* ======================================================= */}
                  <div className="adm-section-card" style={{ background: "#fff", borderRadius: 8, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderTop: "4px solid #e67e22" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#2E3D3F", marginBottom: 4 }}>Konten Kontak</h3>
                    <p style={{ fontSize: 12, color: "#5A6A6C", marginBottom: 20, lineHeight: 1.6 }}>
                      Edit informasi kontak, jam operasional, dan link media sosial. Untuk teks halaman About Us (Hero, Visi Misi, Susunan Tim, Layanan), buka menu <strong>Setting Halaman About</strong>.
                    </p>
                    {[
                      { label: "Kontak — Teks", key: "contactText", multiline: true },
                      { label: "Kontak — Email", key: "email", multiline: false },
                      { label: "Kontak — Telepon / WA", key: "phone", multiline: false },
                      { label: "Kontak — Alamat", key: "address", multiline: true },
                      { label: "Kontak — Jam Operasional", key: "hours", multiline: false },
                      { label: "Link WhatsApp Utama", key: "waLink", multiline: false },
                      { label: "Link Instagram", key: "igLink", multiline: false },
                      { label: "Link Facebook", key: "fbLink", multiline: false },
                    ].map(field => {
                      const fieldId = `about-content-${field.key}`;
                      return (
                        <div key={field.key} style={{ marginBottom: 16 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#5A6A6C", letterSpacing: "0.8px", textTransform: "uppercase", display: "block", marginBottom: 6 }}>{field.label}</label>
                          {field.multiline ? (
                            <textarea id={fieldId} defaultValue={data.content[field.key] || ""} rows={3}
                              ref={autoGrowTextarea}
                              onInput={e => autoGrowTextarea(e.target)}
                              style={{ width: "100%", padding: "9px 12px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 13, outline: "none", resize: "none", overflow: "hidden", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }} />
                          ) : (
                            <input id={fieldId} defaultValue={data.content[field.key] || ""}
                              style={{ width: "100%", padding: "9px 12px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                          )}
                          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                            <button onClick={() => {
                              const val = document.getElementById(fieldId)?.value?.trim();
                              save({ ...data, content: { ...data.content, [field.key]: val } });
                              notify(`${field.label} disimpan!`);
                            }} style={{ padding: "7px 18px", background: "#e67e22", color: "#fff", borderRadius: 6, fontSize: 12, border: "none", fontWeight: 600, cursor: "pointer" }}>Simpan</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ======================================================= */}
                  {/* SECTION: TEMPLATE WHATSAPP */}
                  {/* ======================================================= */}
                  <div className="adm-section-card" style={{ background: "#fff", borderRadius: 8, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderTop: "4px solid #25d366" }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#2E3D3F", marginBottom: 4 }}>Template Pesan WhatsApp</h3>
                    <p style={{ fontSize: 12, color: "#5A6A6C", marginBottom: 6, lineHeight: 1.6 }}>
                      Hanya <strong>satu template</strong> ini yang dipakai oleh <strong>semua</strong> tombol WhatsApp di seluruh situs
                      (Hubungi Kami, Konsultasi, Paket, Layanan, dll) — tidak ada template berbeda per section.
                      Boleh pakai <code style={{ background: "#f0fdf4", padding: "1px 5px", borderRadius: 4, color: "#16a34a", fontSize: 11 }}>{"{judul_paket}"}</code> atau <code style={{ background: "#f0fdf4", padding: "1px 5px", borderRadius: 4, color: "#16a34a", fontSize: 11 }}>{"{judul_layanan}"}</code> kalau mau otomatis terisi nama paket/layanan yang diklik, tapi tidak wajib.
                    </p>
                    <p style={{ fontSize: 11, color: "#888", marginBottom: 18 }}>Gunakan <strong>*teks*</strong> untuk cetak tebal di WhatsApp. Baris baru dengan Enter.</p>

                    {(() => {
                      const key = "umum";
                      const tpl = data.content.waTemplates || {};
                      const val = tpl[key] || "";
                      return (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 16 }}></span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#2E3D3F" }}>Template Pesan (Satu-satunya)</span>
                          </div>
                          <textarea
                            rows={6}
                            id={`wa-tpl-${key}`}
                            defaultValue={val}
                            ref={autoGrowTextarea}
                            style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #D4C4A0", borderRadius: 8, fontSize: 12, fontFamily: "monospace", resize: "none", overflow: "hidden", outline: "none", boxSizing: "border-box", lineHeight: 1.7 }}
                            onInput={e => autoGrowTextarea(e.target)}
                            onFocus={e => e.target.style.borderColor = "#25d366"}
                            onBlur={e => e.target.style.borderColor = "#D4C4A0"}
                          />
                          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                            <button onClick={() => {
                              const newVal = document.getElementById(`wa-tpl-${key}`)?.value ?? "";
                              save({ ...data, content: { ...data.content, waTemplates: { umum: newVal } } });
                              notify("Template WhatsApp disimpan!");
                            }} style={{ padding: "6px 16px", background: "#25d366", color: "#fff", borderRadius: 6, fontSize: 12, border: "none", cursor: "pointer", fontWeight: 600 }}>
                              Simpan
                            </button>
                            <button onClick={() => {
                              const newVal = document.getElementById(`wa-tpl-${key}`)?.value ?? "";
                              const preview = newVal
                                .replace(/{judul_paket}/g, "Contoh Nama Paket")
                                .replace(/{judul_layanan}/g, "Contoh Layanan")
                                .replace(/{harga}/g, "Rp 5.000.000");
                              window.open("https://wa.me/?text=" + encodeURIComponent(preview), "_blank");
                            }} style={{ padding: "6px 16px", background: "#f0fdf4", color: "#16a34a", borderRadius: 6, fontSize: 12, border: "1.5px solid #25d366", cursor: "pointer", fontWeight: 600 }}>
                              Preview
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Founding Year */}
                  <div className="adm-section-card" style={{ background: "#fff", borderRadius: 8, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderTop: "4px solid #C9AA71" }}>
                    <h3 style={{ fontSize: 15, fontWeight: 500, color: "#2E3D3F", marginBottom: 6 }}>Tahun Berdiri Perusahaan</h3>
                    <p style={{ fontSize: 12, color: "#5A6A6C", marginBottom: 16, lineHeight: 1.6 }}>
                      Tahun ini digunakan untuk teks "sejak [tahun]", statistik "X Tahun Pengalaman", dan label dekorasi halaman.
                    </p>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <input
                        id="founding-year-input"
                        defaultValue={data.content.foundingYear || "2026"}
                        placeholder="cth: 2026"
                        maxLength={4}
                        style={{ width: 120, padding: "8px 12px", border: "1px solid #D4C4A0", borderRadius: 6, fontSize: 14, outline: "none" }}
                      />
                      <button onClick={() => {
                        const yr = document.getElementById("founding-year-input")?.value?.trim();
                        if (!yr || !/^\d{4}$/.test(yr)) return notify("Masukkan tahun 4 digit (misal: 2026).", "error");
                        save({ ...data, content: { ...data.content, foundingYear: yr } });
                        notify(`Tahun berdiri diperbarui ke ${yr}`);
                      }} style={{ padding: "8px 16px", background: "linear-gradient(130deg,#2E3D3F 0%,#3D5254 45%,#8B6914 78%,#C9AA71 100%)", color: "#fff", borderRadius: 6, fontSize: 12, border: "none", fontWeight: 500 }}>
                        Simpan
                      </button>
                      <span style={{ fontSize: 12, color: "#5A6A6C" }}>Saat ini: <strong style={{ color: "#2E3D3F" }}>{data.content.foundingYear || "2026"}</strong> · Pengalaman: <strong style={{ color: "#8B6914" }}>{new Date().getFullYear() - parseInt(data.content.foundingYear || "2026")} tahun</strong></span>
                    </div>
                  </div>

                  {/* Hero Display Mode */}
                  <div className="adm-section-card" style={{ background: "#fff", borderRadius: 8, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderTop: "4px solid #8e44ad" }}>
                    <h3 style={{ fontSize: 15, fontWeight: 500, color: "#2E3D3F", marginBottom: 6 }}>Mode Tampilan Hero Beranda</h3>
                    <p style={{ fontSize: 12, color: "#5A6A6C", marginBottom: 20, lineHeight: 1.6 }}>
                      Pilih mode tampilan bagian hero halaman utama: <strong>Video Background</strong> (video looping), <strong>Gambar Statis</strong> (satu foto diam), atau <strong>Slideshow Otomatis</strong> (berganti dari artikel).
                    </p>
                    {/* Toggle Pill — 3 opsi */}
                    <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                      {[
                        { val: "video",     icon: "", label: "Video Background", desc: "Video looping sebagai latar hero" },
                        { val: "static",    icon: "",  label: "Gambar Statis",    desc: "Satu gambar diam yang bisa diatur" },
                        { val: "slideshow", icon: "▶",  label: "Slideshow Otomatis", desc: "Gambar berganti dari artikel published" },
                      ].map(opt => {
                        const active = (data.content.heroMode || "video") === opt.val;
                        return (
                          <div key={opt.val} onClick={() => { save({ ...data, content: { ...data.content, heroMode: opt.val } }); notify(`Mode hero diubah ke: ${opt.label}`); }}
                            style={{ flex: 1, minWidth: 180, padding: "14px 18px", borderRadius: 10, cursor: "pointer",
                              border: active ? "2px solid #8e44ad" : "2px solid #F5EDD8",
                              background: active ? "#f5eeff" : "#FDFAF4",
                              transition: "all .18s" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                              <span style={{ fontSize: 20 }}>{opt.icon}</span>
                              <span style={{ fontWeight: 700, fontSize: 13, color: active ? "#8e44ad" : "#2E3D3F" }}>{opt.label}</span>
                              {active && <span style={{ marginLeft: "auto", fontSize: 10, background: "#8e44ad", color: "#fff", borderRadius: 8, padding: "2px 8px", fontWeight: 700 }}>AKTIF</span>}
                            </div>
                            <div style={{ fontSize: 12, color: "#5A6A6C", lineHeight: 1.5 }}>{opt.desc}</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* ── Panel Video Background ── */}
                    {(data.content.heroMode === "video" || !data.content.heroMode) && (
                      <HeroVideoPanel data={data} save={save} notify={notify} />
                    )}

                    {/* ── Panel Gambar Statis ── */}
                    {data.content.heroMode === "static" && (
                      <HeroStaticImagePanel data={data} save={save} notify={notify} />
                    )}

                  </div>{/* end hero mode card */}

                  <div className="settings-grid">
                    {[
                      { title: "Firebase Config", desc: "Connect to Firestore for real-time data sync", btn: "Configure", color: "#f39c12" },
                      { title: "Cloudinary Config", desc: "Set up image hosting and transformation pipeline", btn: "Configure", color: "#C9AA71" },
                      { title: "Vercel Deploy", desc: "Deploy updates to production via Vercel CI/CD", btn: "Deploy", color: "#2E3D3F" },
                      { title: "SEO Settings", desc: "Manage meta tags, sitemap, and schema markup", btn: "Edit SEO", color: "#27ae60" },
                      { title: "Analytics", desc: "View traffic, user behavior and conversion data", btn: "View", color: "#8e44ad" },
                      {
                        title: "Export Data", desc: "Export site data as JSON backup", btn: "Export JSON", color: "#e74c3c",
                        action: () => {
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                          const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
                          a.download = "hikimori-const-data.json"; a.click(); notify("Data exported!");
                        }
                      },
                    ].map(s => (
                      <div key={s.title} style={{ background: "#fff", borderRadius: 8, padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,.06)", borderTop: `4px solid ${s.color}` }}>
                        <h3 style={{ fontSize: 15, fontWeight: 500, color: "#2E3D3F", marginBottom: 8 }}>{s.title}</h3>
                        <p style={{ fontSize: 12, color: "#5A6A6C", lineHeight: 1.6, marginBottom: 16 }}>{s.desc}</p>
                        <button onClick={s.action || (() => notify(`${s.title} — Configure in your deployment environment.`, "success"))}
                          style={{ padding: "8px 18px", background: s.color, color: "#fff", borderRadius: 6, fontSize: 12, border: "none" }}>{s.btn}</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "#fff3cd", borderRadius: 8, padding: "16px 20px", marginTop: 20, border: "1px solid #ffc107" }}>
                    <h4 style={{ fontSize: 13, color: "#856404", marginBottom: 6 }}>Reset Site Data</h4>
                    <p style={{ fontSize: 12, color: "#856404", marginBottom: 12 }}>This will reset all content, images, and posts to defaults.</p>
                    <button onClick={async () => {
                      if (!window.confirm("Apakah yakin ingin menghapus semua isi web?")) return;
                      if (!window.confirm("Tindakan ini akan menghapus seluruh isi web dan mengembalikannya ke halaman kosong. Tindakan ini tidak bisa dibatalkan.")) return;
                      await save(DEFAULT_DATA);
                      setEditContent({});
                      notify("Data reset to defaults.");
                    }} style={{ padding: "8px 18px", background: "#e74c3c", color: "#fff", borderRadius: 6, fontSize: 12, border: "none" }}>
                      Reset to Defaults
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
  );
}
