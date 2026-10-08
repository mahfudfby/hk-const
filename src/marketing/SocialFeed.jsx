import React, { useEffect, useRef, useState } from "react";
import "./marketing.css";
import MediaPlaceholder from "./MediaPlaceholder.jsx";
import { trackEvent } from "./tracking.js";

/** Ambil URL embed dari link post Instagram / video TikTok. Mengembalikan null bila format tidak dikenali. */
export function toEmbed(url, platform) {
  try {
    const u = new URL(url);
    if (platform === "instagram" && /instagram\.com$/.test(u.hostname.replace(/^www\./, ""))) {
      const m = u.pathname.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
      return m ? `https://www.instagram.com/${m[1]}/${m[2]}/embed` : null;
    }
    if (platform === "tiktok" && /tiktok\.com$/.test(u.hostname.replace(/^www\./, ""))) {
      const m = u.pathname.match(/\/video\/(\d+)/);
      return m ? `https://www.tiktok.com/embed/v2/${m[1]}` : null;
    }
  } catch { /* url tidak valid */ }
  return null;
}

function useInView() {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current || seen) return;
    if (!("IntersectionObserver" in window)) { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { rootMargin: "300px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [seen]);
  return [ref, seen];
}

function Tile({ url, platform, index, tall }) {
  const [on, setOn] = useState(false);
  const embed = url ? toEmbed(url, platform) : null;
  if (!embed) {
    return <MediaPlaceholder ratio={tall ? "9/14" : "1/1"} kind={platform === "tiktok" ? "reel" : "image"} label={platform === "tiktok" ? `Video ${index + 1}` : `Foto ${index + 1}`} hint="Tambahkan link post di Control Panel › Marketing" style={{ borderRadius: 14 }} />;
  }
  return (
    <div className={`hc-tile-media${tall ? " tall" : ""}`}>
      {on ? <iframe src={embed} title={`${platform} ${index + 1}`} loading="lazy" allow="encrypted-media; autoplay" allowFullScreen />
        : <button type="button" style={{ all: "unset", cursor: "pointer", display: "block", width: "100%", height: "100%" }} onClick={() => { setOn(true); trackEvent("social_click", { content_name: `${platform}_embed_play` }, { server: false }); }} aria-label={`Putar ${platform} ${index + 1}`}>
            <MediaPlaceholder ratio={tall ? "9/14" : "1/1"} kind={platform === "tiktok" ? "reel" : "image"} label={platform === "tiktok" ? "TikTok" : "Instagram"} hint="Ketuk untuk memuat" style={{ position: "absolute", inset: 0, height: "100%" }} />
            <span className="hc-play">▶ Putar</span>
          </button>}
    </div>
  );
}

/** Section "Ikuti kami": embed dimuat hanya saat diketuk → nol script pihak ketiga di load awal. */
export default function SocialFeed({ marketing = {}, title = "Ikuti Perjalanan Proyek Kami", eyebrow = "Instagram & TikTok" }) {
  const [ref, seen] = useInView();
  const ig = (marketing.instagramPosts || []).slice(0, 6);
  const tk = (marketing.tiktokPosts || []).slice(0, 3);
  const igUser = marketing.instagramUser || "hikimori_const";
  const tkUser = marketing.tiktokUser || "hikimori_const";
  const cells = (arr, n) => Array.from({ length: n }, (_, i) => arr[i] || "");
  return (
    <section className="hc hc-social" ref={ref} aria-label="Media sosial">
      <div className="hc-container">
        <div className="hc-eyebrow">{eyebrow}</div>
        <h2 className="hc-h2">{title}</h2>
        {seen && (
          <div className="hc-social-cols">
            <div>
              <div className="hc-social-head"><h3>Instagram</h3><a href={`https://instagram.com/${igUser}`} target="_blank" rel="noopener noreferrer">@{igUser} →</a></div>
              <div className="hc-tiles">{cells(ig, 6).map((u, i) => <Tile key={i} url={u} platform="instagram" index={i} />)}</div>
            </div>
            <div>
              <div className="hc-social-head"><h3>TikTok</h3><a href={`https://tiktok.com/@${tkUser}`} target="_blank" rel="noopener noreferrer">@{tkUser} →</a></div>
              <div className="hc-tiles">{cells(tk, 3).map((u, i) => <Tile key={i} url={u} platform="tiktok" index={i} tall />)}</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
