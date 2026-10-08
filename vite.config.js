import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/* Rute publik untuk sitemap.xml (rute admin & detail dinamis tidak dimasukkan) */
const PUBLIC_ROUTES = [
  '/', '/promo', '/about', '/layanan', '/jasa-desain-rab', '/tema-rumah', '/interior', '/pagar-rumah', '/kanopi',
  '/aluminium', '/landscape-taman', '/pembangunan-kost', '/pembangunan-cafe', '/pembangunan-ruko', '/furnitur',
  '/custom-furnitur', '/portfolio', '/renovasi-rumah-subsidi',
]

/** Isi token __SITE_URL__/__VERIFY_*__ di index.html dari env, hapus <meta> yang nilainya kosong, dan hasilkan robots.txt + sitemap.xml */
function seoPlugin(env) {
  const site = (env.VITE_SITE_URL || 'https://hikimoriconst.com').replace(/\/$/, '')
  return {
    name: 'hikimori-seo',
    enforce: 'post',
    transformIndexHtml(html) {
      return html
        .replace(/__SITE_URL__/g, site)
        .replace(/__VERIFY_GOOGLE__/g, env.VITE_GOOGLE_SITE_VERIFY || '')
        .replace(/__VERIFY_META__/g, env.VITE_META_DOMAIN_VERIFY || '')
        .replace(/<meta [^>]*content=""[^>]*(?:google-site-verification|facebook-domain-verification)[^>]*>\s*|<meta [^>]*(?:google-site-verification|facebook-domain-verification)[^>]*content=""[^>]*>\s*/g, '')
    },
    generateBundle(_opts, bundle) {
      /* Preload dua font terpenting (judul + teks isi). Nama file ber-hash baru diketahui di sini,
         jadi tautannya disisipkan ke index.html setelah seluruh aset dipancarkan. Hanya dua — preload
         berlebihan justru merebut bandwidth dari HTML/JS pada koneksi lambat. */
      const CRITICAL = ['playfair-display-latin-wght-normal', 'dm-sans-latin-wght-normal']
      const links = Object.keys(bundle)
        .filter((f) => CRITICAL.some((c) => f.includes(c)))
        .map((f) => `<link rel="preload" as="font" type="font/woff2" crossorigin href="/${f}" />`)
        .join('\n    ')
      const html = bundle['index.html']
      if (html && typeof html.source === 'string') {
        html.source = html.source.replace('<!--PRELOAD_FONTS-->', links)
      }

      const today = new Date().toISOString().slice(0, 10)
      this.emitFile({
        type: 'asset', fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PUBLIC_ROUTES.map((r) => `  <url><loc>${site}${r}</loc><lastmod>${today}</lastmod><priority>${r === '/' ? '1.0' : r === '/promo' ? '0.9' : '0.7'}</priority></url>`).join('\n')}\n</urlset>\n`,
      })
      this.emitFile({
        type: 'asset', fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\nDisallow: /control-panel\nDisallow: /api/\nDisallow: /UlasanPelayanan/\n\nSitemap: ${site}/sitemap.xml\n`,
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), seoPlugin(env)],
    esbuild: { pure: ['console.log', 'console.debug'], drop: ['debugger'], legalComments: 'none' },
    build: {
      outDir: 'dist',
      target: 'es2020',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          /* Firebase SENGAJA tidak dikelompokkan manual: ia hanya dijangkau lewat dynamic import
             (src/lib/firebase.js), jadi biarkan Rollup memecahnya sendiri — Firestore dan Auth jadi
             chunk terpisah, sehingga pengunjung biasa tidak ikut mengunduh SDK Auth yang hanya
             dipakai admin saat login Google. */
          manualChunks: { vendor: ['react', 'react-dom'] },
        },
      },
    },
  }
})
