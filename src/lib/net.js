/**
 * Deteksi kondisi perangkat/jaringan → dipakai untuk mode "lite":
 * koneksi lambat, Data Saver aktif, atau pengguna meminta animasi dikurangi.
 */
const nav = typeof navigator !== "undefined" ? navigator : {};
const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

export function isSlowConnection() {
  if (!conn) return false;
  if (conn.saveData) return true;
  if (/(^|-)2g$/.test(conn.effectiveType || "")) return true;   // slow-2g, 2g
  if (conn.effectiveType === "3g") return true;
  if (typeof conn.downlink === "number" && conn.downlink > 0 && conn.downlink < 1.2) return true;
  return false;
}

export function prefersReducedMotion() {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
}

export function isLowEndDevice() {
  const mem = nav.deviceMemory;      // GB (Chromium)
  const cores = nav.hardwareConcurrency;
  return (typeof mem === "number" && mem <= 2) || (typeof cores === "number" && cores <= 2);
}

export function isFinePointer() {
  try { return window.matchMedia("(pointer: fine) and (hover: hover)").matches; } catch { return false; }
}

/** true bila efek berat (video latar, lens-flare, tetesan air, cursor kustom) sebaiknya dimatikan */
export function shouldUseLiteMode() {
  return isSlowConnection() || prefersReducedMotion() || isLowEndDevice();
}

/** Pasang class `lite` di <html> & pantau perubahan jaringan; mengembalikan fungsi cleanup. */
export function initPerformanceMode() {
  const root = document.documentElement;
  const apply = () => {
    root.classList.toggle("lite", shouldUseLiteMode());
    root.classList.toggle("reduced-motion", prefersReducedMotion());
  };
  apply();
  /* Font dekoratif (Jost + Cormorant, ±94 KB) hanya diunduh bila koneksi/perangkat memadai.
     Impor dinamis → Vite membuatkan stylesheet terpisah yang disisipkan saat dibutuhkan saja. */
  if (!shouldUseLiteMode()) {
    import("../styles/fonts-display.css").catch(() => {});
  }
  const onVis = () => root.classList.toggle("tab-hidden", document.hidden);
  document.addEventListener("visibilitychange", onVis);
  conn?.addEventListener?.("change", apply);
  return () => {
    document.removeEventListener("visibilitychange", onVis);
    conn?.removeEventListener?.("change", apply);
  };
}

/**
 * Optimasi URL gambar Cloudinary: format otomatis (AVIF/WebP), kualitas otomatis, lebar dibatasi.
 * URL non-Cloudinary / sudah bertransformasi / bukan string dikembalikan apa adanya.
 * Public-id asli tidak berubah, sehingga fitur hapus aset tetap bekerja (lihat extractCloudinaryAsset).
 */
export function cld(url, width = 1200) {
  if (typeof url !== "string") return url;
  const m = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/);
  if (!m) return url;
  const rest = m[2];
  // sudah ada transformasi (segmen pertama berisi pola "x_y" bukan "v123456")
  if (/^(?:[a-z]{1,3}_[^/]+,?)+\//i.test(rest) && !/^v\d+\//.test(rest)) return url;
  const t = `f_auto,q_${isSlowConnection() ? "auto:low" : "auto"},w_${width},c_limit`;
  return `${m[1]}${t}/${rest}`;
}

/** Poster (frame pertama) dari URL video Cloudinary → dipakai saat video ditunda */
export function videoPoster(videoUrl, width = 1280) {
  if (typeof videoUrl !== "string") return "";
  const m = videoUrl.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)(?:[^/]*\/)?(v\d+\/[^?#]+?)(?:\.[a-z0-9]+)?(?:[?#].*)?$/i);
  if (!m) return "";
  return `${m[1]}so_0,f_auto,q_auto,w_${width}/${m[2]}.jpg`;
}
