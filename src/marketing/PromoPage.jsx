import React from "react";
import "./marketing.css";
import LeadForm from "./LeadForm.jsx";
import MediaPlaceholder from "./MediaPlaceholder.jsx";
import { trackEvent } from "./tracking.js";

const SERVICES = [
  ["🏠", "Bangun Rumah", "Desain, RAB, dan konstruksi rumah impian dengan standar kualitas tinggi."],
  ["🛠️", "Renovasi", "Perbaikan & perombakan rumah tanpa biaya tersembunyi, jadwal jelas."],
  ["📐", "Desain & RAB", "Gambar kerja 3D dan Rencana Anggaran Biaya yang transparan."],
  ["🛋️", "Interior", "Kitchen set, kamar, ruang keluarga & custom furnitur sesuai gaya Anda."],
  ["🌿", "Landscape & Taman", "Taman tropis, kolam, dan pencahayaan outdoor yang menenangkan."],
  ["🏢", "Kost, Cafe & Ruko", "Bangun properti komersial dengan perhitungan balik modal yang jelas."],
];
const STEPS = [["01", "Konsultasi gratis", "Ceritakan kebutuhan & budget Anda."], ["02", "Survey & desain", "Tim kami survei lokasi lalu menyiapkan desain + RAB."], ["03", "Pembangunan", "Dikerjakan tim berpengalaman dengan laporan progres berkala."], ["04", "Serah terima", "Pengecekan akhir bersama sebelum kunci diserahkan."]];
const FAQ = [
  ["Apakah konsultasi benar-benar gratis?", "Ya. Konsultasi awal, diskusi kebutuhan, dan estimasi kasar tidak dikenakan biaya."],
  ["Berapa lama proses dari desain sampai selesai?", "Tergantung skala proyek. Jadwal tertulis disepakati di awal dan dipantau bersama selama pengerjaan."],
  ["Apakah RAB bisa disesuaikan dengan budget?", "Bisa. Kami menyusun opsi material dan spesifikasi agar sesuai anggaran tanpa mengorbankan kualitas struktur."],
  ["Area layanan di mana saja?", "Hubungi kami dengan lokasi proyek Anda — tim akan konfirmasi jangkauan layanan dan jadwal survei."],
];

/**
 * Landing page khusus iklan (Meta Ads / Google Ads / TikTok / Instagram bio) — rute /promo.
 * Ringan: tanpa gambar wajib, tanpa video, form di paro-atas, CTA sticky di mobile.
 * Judul/sub dapat diubah dari Control Panel › Marketing (promoTitle, promoSub).
 */
export default function PromoPage({ marketing = {}, content = {}, onLead, onWaOpen }) {
  const title = marketing.promoTitle || "Wujudkan Rumah Impian, Tanpa Drama Biaya";
  const sub = marketing.promoSub || "Hikimori Const membantu Anda dari desain, RAB, hingga serah terima kunci — transparan, tepat waktu, dan berkualitas.";
  const toForm = () => { document.getElementById("promo-form")?.scrollIntoView({ behavior: "smooth", block: "center" }); trackEvent("cta_click", { content_name: "promo_scroll_form" }, { server: false }); };
  return (
    <div className="hc">
      <header className="hc-hero">
        <div className="hc-container hc-hero-grid">
          <div>
            <div className="hc-eyebrow" style={{ color: "#C9AA71" }}>Hikimori Const · Konsultasi Gratis</div>
            <h1>{title.split(",")[0]}{title.includes(",") && <>, <em>{title.split(",").slice(1).join(",").trim()}</em></>}</h1>
            <p>{sub}</p>
            <ul className="hc-bullets">
              <li>RAB detail & transparan — tidak ada biaya tersembunyi</li>
              <li>Tim arsitek, desainer interior & pelaksana berpengalaman</li>
              <li>Jadwal tertulis dan laporan progres berkala</li>
            </ul>
            <div style={{ display: "flex", gap: ".7rem", flexWrap: "wrap" }}>
              <button className="hc-btn hc-btn-gold" onClick={toForm} data-track="promo_hero_cta">Minta Konsultasi Gratis</button>
              <button className="hc-btn hc-btn-ghost" onClick={() => onWaOpen?.("")} data-track="promo_hero_wa">Chat WhatsApp</button>
            </div>
            <div className="hc-stats">
              <div><b>100%</b><span>RAB transparan</span></div>
              <div><b>Gratis</b><span>konsultasi awal</span></div>
              <div><b>24 jam</b><span>respon tim kami</span></div>
            </div>
          </div>
          <div className="hc-card" id="promo-form">
            <LeadForm source="promo" onSuccess={onLead} title="Konsultasi Gratis" subtitle="Isi singkat — kami hubungi Anda via WhatsApp." />
          </div>
        </div>
      </header>

      <section className="hc-section">
        <div className="hc-container">
          <div className="hc-eyebrow">Layanan</div>
          <h2 className="hc-h2">Satu mitra untuk semua kebutuhan hunian</h2>
          <div className="hc-grid3">
            {SERVICES.map(([ic, t, d]) => <div className="hc-tile" key={t}><div className="ic">{ic}</div><h3>{t}</h3><p>{d}</p></div>)}
          </div>
        </div>
      </section>

      <section className="hc-section alt">
        <div className="hc-container">
          <div className="hc-eyebrow">Portofolio</div>
          <h2 className="hc-h2">Hasil kerja kami</h2>
          <p className="hc-lead">Ganti placeholder ini dengan foto proyek (Control Panel › Layanan / Tema Rumah) agar calon klien melihat bukti nyata.</p>
          <div className="hc-grid3">
            {[1, 2, 3].map((n) => <MediaPlaceholder key={n} ratio="4/3" kind="image" label={`Foto Proyek ${n}`} hint="Rekomendasi 1600×1200 px, JPG/WebP" style={{ borderRadius: 18 }} />)}
          </div>
        </div>
      </section>

      <section className="hc-section">
        <div className="hc-container">
          <div className="hc-eyebrow">Cara kerja</div>
          <h2 className="hc-h2">Empat langkah, jelas dari awal</h2>
          <div className="hc-grid4">
            {STEPS.map(([n, t, d]) => <div className="hc-tile hc-step" key={n}><div className="n">{n}</div><h3 style={{ marginTop: ".5rem" }}>{t}</h3><p>{d}</p></div>)}
          </div>
        </div>
      </section>

      <section className="hc-section alt">
        <div className="hc-container hc-faq" style={{ maxWidth: 820 }}>
          <div className="hc-eyebrow">FAQ</div>
          <h2 className="hc-h2">Pertanyaan yang sering diajukan</h2>
          {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
        </div>
      </section>

      <section className="hc-section" style={{ paddingTop: 0 }}>
        <div className="hc-container">
          <div className="hc-cta">
            <h2 className="hc-h2" style={{ color: "#fff", marginTop: 0 }}>Siap mulai proyek Anda?</h2>
            <p style={{ color: "rgba(255,255,255,.8)", margin: "0 auto 1.4rem", maxWidth: "36em" }}>Konsultasikan ide dan budget Anda bersama tim Hikimori Const — gratis dan tanpa kewajiban.</p>
            <button className="hc-btn hc-btn-gold" onClick={toForm} data-track="promo_footer_cta">Jadwalkan Konsultasi</button>
          </div>
        </div>
      </section>

      <div className="hc-sticky" role="region" aria-label="Aksi cepat">
        <button className="hc-btn hc-btn-wa" onClick={() => onWaOpen?.("")} data-track="promo_sticky_wa">WhatsApp</button>
        <button className="hc-btn hc-btn-gold" onClick={toForm} data-track="promo_sticky_form">Konsultasi Gratis</button>
      </div>
      <div style={{ height: 72 }} className="hc-sticky-spacer" />
    </div>
  );
}
