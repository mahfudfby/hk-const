import React, { Suspense, lazy } from "react";

/** Penanda muat halaman — ringan, sewarna tema, tanpa menggeser layout drastis. */
export function PageLoading({ minHeight = "60vh" }) {
  return (
    <div style={{ minHeight, display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF7F0" }}>
      <div style={{ width: 34, height: 34, border: "3px solid #E8DCC8", borderTopColor: "#8B6914", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/** Versi mungil untuk panel di dalam Control Panel. */
function PanelLoading() {
  return <PageLoading minHeight="220px" />;
}

/**
 * Bungkus React.lazy + Suspense-nya sendiri.
 *
 * Kenapa per komponen, bukan satu Suspense besar di akar: kalau batas Suspense dipasang di atas
 * seluruh aplikasi, saat chunk halaman baru diunduh SELURUH tampilan (termasuk navbar & footer)
 * diganti penanda muat — terlihat seperti halaman berkedip putih. Dengan batas per komponen, hanya
 * area halaman itu yang menampilkan loader, kerangka situs tetap diam di tempat.
 *
 * `loader` dipanggil sekali lalu hasilnya di-cache oleh React; `preload()` dipakai untuk prefetch idle.
 */
export function withLazy(loader, { panel = false } = {}) {
  const Inner = lazy(loader);
  const Fallback = panel ? PanelLoading : PageLoading;
  const Wrapped = (props) => (
    <Suspense fallback={<Fallback />}>
      <Inner {...props} />
    </Suspense>
  );
  Wrapped.preload = loader;
  return Wrapped;
}

/**
 * Prefetch chunk halaman saat browser menganggur, SETELAH halaman pertama selesai dimuat.
 * Tujuannya: muat pertama tetap seringan mungkin, tapi perpindahan halaman terasa instan.
 * Dilewati pada koneksi lambat / Data Saver supaya tidak menghabiskan kuota pengunjung.
 */
export function prefetchWhenIdle(loaders, isSlow) {
  if (isSlow) return () => {};
  let cancelled = false;
  let idleId = 0;
  const run = () => {
    const next = () => {
      if (cancelled || !loaders.length) return;
      const l = loaders.shift();
      try { l(); } catch { /* chunk gagal diambil → tidak fatal, akan dimuat ulang saat dibutuhkan */ }
      idleId = schedule(next);
    };
    idleId = schedule(next);
  };
  const schedule = (fn) =>
    "requestIdleCallback" in window ? window.requestIdleCallback(fn, { timeout: 4000 }) : setTimeout(fn, 400);
  const start = () => setTimeout(run, 1200);
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
  return () => {
    cancelled = true;
    if ("cancelIdleCallback" in window) window.cancelIdleCallback(idleId);
    window.removeEventListener("load", start);
  };
}
