import React, { useEffect, useMemo, useState } from "react";
import "./marketing.css";
import { MARKETING_FIELDS, resolveMarketing } from "./config.js";
import { integrationStatus, trackEvent, initTracking } from "./tracking.js";

const SHEETS_SCRIPT = `function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var s = ss.getSheetByName('Leads') || ss.insertSheet('Leads');
  var d = JSON.parse(e.postData.contents);
  if (s.getLastRow() === 0) s.appendRow(['Waktu','Nama','WhatsApp','Email','Layanan','Budget','Lokasi','Pesan','Sumber','Medium','Campaign','Halaman']);
  var at = d.attribution || {};
  var a = (at.last && at.last.utm_source) ? at.last : (at.first || {});
  s.appendRow([d.createdAt, d.name, "'" + d.phone, d.email, d.service, d.budget, d.location, d.message, a.utm_source || '', a.utm_medium || '', a.utm_campaign || '', d.page]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}
// Deploy → New deployment → Web app → Execute as: Me · Who has access: Anyone → salin URL ke LEAD_WEBHOOK_URL di Vercel.`;

const PRESETS = {
  "Meta Ads (FB/IG)":  { source: "facebook", medium: "paid_social", content: "{{ad.name}}", term: "{{adset.name}}", campaign: "{{campaign.name}}" },
  "Instagram Bio/Story": { source: "instagram", medium: "social", content: "bio", term: "", campaign: "organik" },
  "Google Ads":        { source: "google", medium: "cpc", content: "{creative}", term: "{keyword}", campaign: "{campaignid}" },
  "TikTok Ads":        { source: "tiktok", medium: "paid_social", content: "__CID_NAME__", term: "__AID_NAME__", campaign: "__CAMPAIGN_NAME__" },
  "TikTok Bio":        { source: "tiktok", medium: "social", content: "bio", term: "", campaign: "organik" },
  "WhatsApp Broadcast": { source: "whatsapp", medium: "broadcast", content: "", term: "", campaign: "promo" },
};

const copy = (t, notify) => { try { navigator.clipboard.writeText(t); notify?.("Disalin ke clipboard."); } catch { notify?.("Gagal menyalin.", "error"); } };

export default function MarketingAdminPanel({ data, save, notify }) {
  const saved = data.content?.marketing || {};
  const [m, setM] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [preset, setPreset] = useState("Meta Ads (FB/IG)");
  const [camp, setCamp] = useState("promo-oktober");
  const [base, setBase] = useState(`${window.location.origin}/promo`);
  useEffect(() => { setM(data.content?.marketing || {}); }, [data.content?.marketing]);
  const set = (k, v) => setM((p) => ({ ...p, [k]: v }));
  const status = useMemo(() => { initTracking(resolveMarketing(saved)); return integrationStatus(); }, [saved]);

  const onSave = async () => {
    setBusy(true);
    const clean = { ...m, instagramPosts: lines(m._igText ?? (m.instagramPosts || []).join("\n")), tiktokPosts: lines(m._tkText ?? (m.tiktokPosts || []).join("\n")) };
    delete clean._igText; delete clean._tkText;
    await save({ ...data, content: { ...data.content, marketing: clean } });
    initTracking(resolveMarketing(clean));
    setBusy(false);
  };
  const lines = (t) => String(t || "").split(/\n+/).map((s) => s.trim()).filter(Boolean);

  const link = useMemo(() => {
    const p = PRESETS[preset];
    const q = [["utm_source", p.source], ["utm_medium", p.medium], ["utm_campaign", camp || p.campaign], ["utm_content", p.content], ["utm_term", p.term]].filter(([, v]) => v);
    // placeholder {{…}} / {…} / __…__ harus TIDAK di-encode agar diganti platform iklan
    return `${base}${base.includes("?") ? "&" : "?"}${q.map(([k, v]) => `${k}=${/[{_]/.test(v) ? v : encodeURIComponent(v)}`).join("&")}`;
  }, [preset, camp, base]);

  const groups = [...new Set(MARKETING_FIELDS.map((f) => f.group))];
  const chip = (on, label) => <span key={label} className={`hc-chip${on ? " on" : ""}`}><i />{label}{on ? " aktif" : " belum diisi"}</span>;

  return (
    <div className="hc hc-admin fade-in">
      <h1>Marketing & Tracking</h1>
      <p style={{ color: "#5A6A6C", fontSize: 13, margin: "0 0 10px" }}>Hubungkan Google Analytics, Google Ads, Meta (Facebook/Instagram), TikTok. ID disimpan di CMS — tidak perlu build ulang. Script dimuat tertunda agar website tetap ringan.</p>
      <div>{chip(status.ga4 || status.gtm, "Google Analytics")}{chip(status.gads, "Google Ads")}{chip(status.meta, "Meta Pixel")}{chip(status.tiktok, "TikTok Pixel")}{chip(status.clarity, "Clarity")}{chip(status.serverEvents, "Server-side (CAPI)")}</div>

      {groups.map((g) => (
        <div className="box" key={g}>
          <h3>{g}</h3>
          <div className="grid2">
            {MARKETING_FIELDS.filter((f) => f.group === g).map((f) => (
              <div key={f.key}><label htmlFor={`mk-${f.key}`}>{f.label}</label>
                <input id={`mk-${f.key}`} type="text" value={m[f.key] || ""} placeholder={f.ph} onChange={(e) => set(f.key, e.target.value)} autoComplete="off" /></div>
            ))}
          </div>
        </div>
      ))}

      <div className="box">
        <h3>Landing page iklan (/promo)</h3>
        <div className="grid2">
          <div><label>Judul (pisahkan dengan koma untuk bagian beraksen emas)</label><input type="text" value={m.promoTitle || ""} placeholder="Wujudkan Rumah Impian, Tanpa Drama Biaya" onChange={(e) => set("promoTitle", e.target.value)} /></div>
          <div><label>Sub-judul</label><input type="text" value={m.promoSub || ""} placeholder="Hikimori Const membantu Anda dari desain…" onChange={(e) => set("promoSub", e.target.value)} /></div>
        </div>
      </div>

      <div className="box">
        <h3>Konten Instagram & TikTok (satu link per baris)</h3>
        <div className="grid2">
          <div><label>Link post/reel Instagram (maks 6)</label><textarea value={m._igText ?? (m.instagramPosts || []).join("\n")} onChange={(e) => set("_igText", e.target.value)} placeholder="https://www.instagram.com/p/XXXXXXXX/" /></div>
          <div><label>Link video TikTok (maks 3)</label><textarea value={m._tkText ?? (m.tiktokPosts || []).join("\n")} onChange={(e) => set("_tkText", e.target.value)} placeholder="https://www.tiktok.com/@user/video/1234567890" /></div>
        </div>
      </div>

      <div className="box">
        <h3>Opsi</h3>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 500 }}><input type="checkbox" checked={m.capiEnabled ?? status.serverEvents} onChange={(e) => set("capiEnabled", e.target.checked)} /> Kirim event server-side (Meta Conversions API, TikTok Events API, GA4) — butuh token di Vercel</label>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 500, marginTop: 8 }}><input type="checkbox" checked={m.consentRequired ?? status.consentRequired} onChange={(e) => set("consentRequired", e.target.checked)} /> Tampilkan banner persetujuan cookie (disarankan)</label>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="hc-btn hc-btn-gold" onClick={onSave} disabled={busy}>{busy ? "Menyimpan…" : "Simpan Pengaturan"}</button>
        <button className="hc-btn" style={{ background: "#f1ece0", color: "#2E3D3F" }} onClick={() => { trackEvent("test_event", { content_name: "admin_test" }, { server: false }); notify("Event uji dikirim — cek Meta Test Events / GA4 DebugView / TikTok Test Events."); }}>Kirim Event Uji</button>
      </div>

      <div className="box">
        <h3>Pembuat link UTM</h3>
        <div className="grid2">
          <div><label>Halaman tujuan</label><input type="text" value={base} onChange={(e) => setBase(e.target.value)} /></div>
          <div><label>Platform</label><select value={preset} onChange={(e) => setPreset(e.target.value)}>{Object.keys(PRESETS).map((k) => <option key={k}>{k}</option>)}</select></div>
          <div><label>Nama campaign</label><input type="text" value={camp} onChange={(e) => setCamp(e.target.value)} /></div>
        </div>
        <pre style={{ marginTop: 12, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{link}</pre>
        <button className="hc-btn" style={{ background: "#f1ece0", color: "#2E3D3F", padding: ".5rem 1rem" }} onClick={() => copy(link, notify)}>Salin link</button>
      </div>

      <div className="box">
        <h3>Simpan lead ke Google Sheets (gratis)</h3>
        <p style={{ fontSize: 13, color: "#5A6A6C", marginTop: 0 }}>Buat Google Sheet → Extensions → Apps Script → tempel kode ini → deploy sebagai Web App → isi URL-nya ke <b>LEAD_WEBHOOK_URL</b> di Vercel. Notifikasi Telegram opsional via <b>TELEGRAM_BOT_TOKEN</b> & <b>TELEGRAM_CHAT_ID</b>.</p>
        <pre>{SHEETS_SCRIPT}</pre>
        <button className="hc-btn" style={{ background: "#f1ece0", color: "#2E3D3F", padding: ".5rem 1rem" }} onClick={() => copy(SHEETS_SCRIPT, notify)}>Salin kode Apps Script</button>
      </div>
    </div>
  );
}
