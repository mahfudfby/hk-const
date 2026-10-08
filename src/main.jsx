import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/fonts.css'        /* font self-hosted — didaftarkan sebelum tema agar siap dipakai */
import './index.css'
import './styles/global-theme.css'   /* tema utama (dulu komponen <GS/> di dalam JS) */
import './styles/enhance.css'        /* penyempurnaan + mode lite: sengaja terakhir agar menang */
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/* Service worker: cache aset statis & gambar → kunjungan berikutnya cepat dan tahan koneksi lambat/putus. */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
