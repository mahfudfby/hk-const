import React, { useRef, useState } from "react";
import "./marketing.css";
import { trackLead, getAttribution, getIdentifiers, getConsent, toE164 } from "./tracking.js";

export const LEAD_SERVICES = [
  "Bangun Rumah Baru", "Renovasi Rumah", "Desain & RAB", "Interior", "Pagar / Kanopi / Aluminium",
  "Landscape & Taman", "Pembangunan Kost / Cafe / Ruko", "Rumah Subsidi", "Lainnya",
];
export const LEAD_BUDGETS = ["< Rp 50 juta", "Rp 50 – 150 juta", "Rp 150 – 500 juta", "Rp 500 juta – 1 miliar", "> Rp 1 miliar", "Belum tahu"];

/**
 * Form lead universal (beranda, landing page iklan, halaman layanan).
 * - Validasi sisi klien, honeypot anti-bot, persetujuan data (UU PDP)
 * - Kirim ke /api/lead (webhook/Sheets/Telegram + Conversions API), event browser ber-ID sama
 * - Jika API tidak tersedia (mis. hosting statis) lead tetap diteruskan lewat onSuccess (inbox CMS + WhatsApp)
 */
export default function LeadForm({ source = "website", services = LEAD_SERVICES, onSuccess, title, subtitle, submitLabel = "Kirim & Konsultasi via WhatsApp", compact = false }) {
  const [f, setF] = useState({ name: "", phone: "", email: "", service: "", budget: "", location: "", message: "", consent: true, hp: "" });
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [apiErr, setApiErr] = useState("");
  const startedAt = useRef(Date.now());
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const validate = () => {
    const e = {};
    if (f.name.trim().length < 2) e.name = "Nama wajib diisi";
    const ph = toE164(f.phone).replace(/\D/g, "");
    if (ph.length < 10 || ph.length > 15) e.phone = "Masukkan nomor WhatsApp yang valid";
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Format email tidak valid";
    if (!f.service) e.service = "Pilih kebutuhan Anda";
    if (!f.consent) e.consent = "Persetujuan diperlukan";
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (busy) return;
    const e = validate(); setErrs(e);
    if (Object.keys(e).length) return;
    if (Date.now() - startedAt.current < 1500) return;      // terlalu cepat = bot
    setBusy(true); setApiErr("");
    const consent = getConsent();
    const eventId = trackLead({ name: f.name, phone: f.phone, email: f.email, service: f.service });
    const payload = {
      ...f, phone: toE164(f.phone), eventId, source, pageUrl: window.location.href, referrer: document.referrer,
      attribution: getAttribution(), ids: getIdentifiers(), consentMarketing: consent.marketing,
    };
    let delivered = false;
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 9000);
    try {
      const r = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: ctrl.signal });
      if (r.status === 429) { setApiErr("Terlalu banyak pengiriman. Coba lagi beberapa menit lagi."); setBusy(false); return; }
      if (r.status === 400) { const j = await r.json().catch(() => ({})); setApiErr(j.error || "Data belum valid."); setBusy(false); return; }
      if (r.ok) delivered = !!(await r.json().catch(() => ({}))).delivered;
    } catch { /* offline / API belum tersedia → tetap lanjut ke WhatsApp & inbox */ }
    clearTimeout(to);
    setDone(true); setBusy(false);
    onSuccess?.({ ...payload, id: eventId }, { delivered });
  };

  if (done) {
    return (
      <div className="hc hc-ok" role="status">
        <div className="tick">✓</div>
        <h3 style={{ margin: "0 0 .4rem", color: "#2E3D3F" }}>Terima kasih, {f.name.split(" ")[0]}!</h3>
        <p style={{ margin: 0, color: "#56676a", lineHeight: 1.6 }}>Permintaan Anda sudah kami terima. Tim kami akan menghubungi Anda melalui WhatsApp secepatnya.</p>
      </div>
    );
  }
  /* fungsi render (BUKAN komponen) agar input tidak remount & kehilangan fokus tiap ketikan */
  const field = (k, label, children) => (
    <div key={k} className={`hc-field${errs[k] ? " err" : ""}`}>
      <label htmlFor={`lf-${source}-${k}`}>{label}</label>{children}
      {errs[k] && <div className="hc-err" role="alert">{errs[k]}</div>}
    </div>
  );
  const id = (k) => `lf-${source}-${k}`;
  return (
    <form className="hc hc-form" onSubmit={submit} noValidate aria-label="Form konsultasi gratis">
      {title && <div><h3 style={{ margin: 0, fontFamily: "'Playfair Display',serif", color: "#2E3D3F", fontSize: "1.35rem" }}>{title}</h3>{subtitle && <p style={{ margin: ".3rem 0 0", color: "#59696c", fontSize: ".9rem" }}>{subtitle}</p>}</div>}
      {field("name", "Nama lengkap", <input id={id("name")} autoComplete="name" value={f.name} onChange={set("name")} placeholder="Nama Anda" maxLength={80} />)}
      <div className="hc-row">
        {field("phone", "No. WhatsApp", <input id={id("phone")} type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} placeholder="0812 3456 7890" maxLength={20} />)}
        {field("email", "Email (opsional)", <input id={id("email")} type="email" autoComplete="email" value={f.email} onChange={set("email")} placeholder="nama@email.com" maxLength={120} />)}
      </div>
      {field("service", "Kebutuhan", <select id={id("service")} value={f.service} onChange={set("service")}><option value="">Pilih layanan…</option>{services.map((s) => <option key={s}>{s}</option>)}</select>)}
      {!compact && (
        <div className="hc-row">
          {field("budget", "Perkiraan budget", <select id={id("budget")} value={f.budget} onChange={set("budget")}><option value="">Pilih…</option>{LEAD_BUDGETS.map((s) => <option key={s}>{s}</option>)}</select>)}
          {field("location", "Lokasi proyek", <input id={id("location")} value={f.location} onChange={set("location")} placeholder="Kota / kecamatan" maxLength={120} />)}
        </div>
      )}
      {!compact && field("message", "Ceritakan kebutuhan Anda (opsional)", <textarea id={id("message")} value={f.message} onChange={set("message")} maxLength={1500} />)}
      <div className="hc-hp" aria-hidden="true"><label>Jangan diisi<input tabIndex={-1} autoComplete="off" value={f.hp} onChange={set("hp")} /></label></div>
      <label className="hc-check"><input type="checkbox" checked={f.consent} onChange={set("consent")} /><span>Saya setuju data saya digunakan Hikimori Const untuk menghubungi saya terkait konsultasi ini.</span></label>
      {errs.consent && <div className="hc-err" role="alert">{errs.consent}</div>}
      {apiErr && <div className="hc-err" role="alert">{apiErr}</div>}
      <button className="hc-btn hc-btn-gold" type="submit" disabled={busy} data-track={`lead_submit_${source}`}>{busy ? "Mengirim…" : submitLabel}</button>
    </form>
  );
}
