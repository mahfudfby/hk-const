/* Service worker Hikimori Const — strategi cache ringan.
   • /assets/* (nama berhash)         → cache-first
   • gambar (same-origin, Cloudinary, Unsplash) → stale-while-revalidate (maks 150 entri)
   • navigasi HTML                     → network-first (timeout 3 dtk) → fallback ke shell tersimpan
   • /api/*, Firebase, analytics, iklan → TIDAK disentuh */
const V = 'hc-v1';
const STATIC = `${V}-static`, IMG = `${V}-img`, PAGES = `${V}-pages`;
const SKIP = /(\/api\/|firestore\.googleapis|firebase|googleapis\.com\/identitytoolkit|google-analytics|googletagmanager|facebook\.|tiktok|clarity\.ms|emailjs|api\.cloudinary)/i;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(PAGES).then((c) => c.add('/')).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => !k.startsWith(V)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function trim(name, max) {
  const c = await caches.open(name); const keys = await c.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map((k) => c.delete(k)));
}

self.addEventListener('fetch', (e) => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== 'GET' || SKIP.test(req.url)) return;

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(PAGES);
      try {
        const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 3000);
        const res = await fetch(req, { signal: ctrl.signal }); clearTimeout(t);
        if (res.ok) cache.put('/', res.clone());
        return res;
      } catch { return (await cache.match('/')) || Response.error(); }
    })());
    return;
  }

  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    e.respondWith(caches.open(STATIC).then(async (c) => {
      const hit = await c.match(req); if (hit) return hit;
      const res = await fetch(req); if (res.ok) c.put(req, res.clone()); return res;
    }));
    return;
  }

  const isImg = req.destination === 'image' || /\.(png|jpe?g|webp|avif|svg|gif)(\?|$)/i.test(url.pathname);
  if (isImg && /^(res\.cloudinary\.com|images\.unsplash\.com)$/.test(url.hostname) || (isImg && url.origin === self.location.origin)) {
    e.respondWith(caches.open(IMG).then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req).then((res) => { if (res.ok || res.type === 'opaque') { c.put(req, res.clone()); trim(IMG, 150); } return res; }).catch(() => hit);
      return hit || net;
    }));
  }
});
