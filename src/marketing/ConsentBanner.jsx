import React, { useEffect, useState } from "react";
import "./marketing.css";
import { getConsent, setConsent, integrationStatus } from "./tracking.js";

/** Banner persetujuan cookie/tracking (Consent Mode v2). Hanya muncul bila ada integrasi aktif & belum memilih. */
export default function ConsentBanner({ marketing }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const st = integrationStatus();
    const any = st.ga4 || st.gtm || st.gads || st.meta || st.tiktok || st.clarity;
    setShow(!!any && st.consentRequired && !getConsent().decided);
  }, [marketing]);
  if (!show) return null;
  const choose = (all) => { setConsent({ analytics: all, marketing: all }); setShow(false); };
  return (
    <div className="hc hc-consent" role="dialog" aria-live="polite" aria-label="Preferensi privasi">
      <p>Kami memakai cookie untuk mengukur kinerja website dan menampilkan iklan yang relevan. Anda bisa menolak tanpa mengurangi akses ke website.</p>
      <div className="acts">
        <button className="hc-btn hc-btn-gold" onClick={() => choose(true)}>Terima semua</button>
        <button className="hc-btn plain" onClick={() => choose(false)}>Hanya yang penting</button>
      </div>
    </div>
  );
}
