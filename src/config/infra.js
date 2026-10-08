/**
 * INFRASTRUKTUR BACKEND — satu-satunya tempat identifier layanan pihak ketiga.
 *
 * Project Firebase : hk-const
 * Cloudinary       : dl4pyan8v
 * Semua nilai bisa ditimpa lewat variabel VITE_* di .env / Vercel tanpa mengubah kode.
 *
 * CATATAN KEAMANAN: file ini ikut terkirim ke browser. Yang boleh ada di sini hanya identifier
 * publik (API key Firebase, cloud name, upload preset) — yang mengamankan data adalah Firestore
 * Rules dan setelan Cloudinary di server, bukan kerahasiaan nilai di bawah. API SECRET Cloudinary
 * TIDAK PERNAH ditaruh di sini; tempatnya di Environment Variables Vercel (lihat .env.example).
 */
const env = import.meta.env;

export const FIREBASE_CONFIG = {
  apiKey:            env.VITE_FIREBASE_API_KEY             || "AIzaSyBEBW6inwGOwMQkF0gVuPsgqJpmDtVWiL4",
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN         || "hk-const.firebaseapp.com",
  projectId:         env.VITE_FIREBASE_PROJECT_ID          || "hk-const",
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET      || "hk-const.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "155735960564",
  appId:             env.VITE_FIREBASE_APP_ID              || "1:155735960564:web:26d00a87bc091c5c5627a1",
  measurementId:     env.VITE_FIREBASE_MEASUREMENT_ID      || "G-22NHPZY4R7",
};

/**
 * Nama collection Firestore. Dikunci ke satu nilai tetap (BUKAN hanya dari env) supaya setiap deploy
 * selalu membaca/menulis collection yang sama — kalau bergantung env dan env lupa diisi di salah satu
 * environment, build baru bisa diam-diam menulis ke collection berbeda dan terlihat seperti "data reset".
 */
export const FS_COLLECTION = env.VITE_FS_COLLECTION || "hikimoriconst";

export const CLOUDINARY_CONFIG = {
  cloudName: env.VITE_CLOUDINARY_CLOUD_NAME || "dl4pyan8v",
  /**
   * Upload preset UNSIGNED — wajib dibuat dulu di akun Cloudinary dl4pyan8v:
   *   Settings → Upload → Upload presets → Add upload preset
   *   Signing Mode: Unsigned, lalu beri nama persis seperti di bawah.
   * Tanpa preset ini, tombol upload gambar di Control Panel akan ditolak Cloudinary.
   */
  uploadPreset: env.VITE_CLOUDINARY_UPLOAD_PRESET || "hikimori_const",
};

/**
 * EmailJS — dipakai HANYA untuk mengirim kode OTP saat admin lupa password.
 * Sengaja dikosongkan: isi lewat Control Panel/ENV dengan akun EmailJS milik Hikimori Const.
 * Selama kosong, fitur "Lupa Password" via email dimatikan dengan pesan yang jelas
 * (login username + password tetap berjalan normal).
 */
export const EMAILJS_CONFIG = {
  publicKey:  env.VITE_EMAILJS_PUBLIC_KEY  || "",
  serviceId:  env.VITE_EMAILJS_SERVICE_ID  || "",
  templateId: env.VITE_EMAILJS_TEMPLATE_ID || "",
};

/** True bila EmailJS sudah dikonfigurasi lengkap. */
export const isEmailJsReady = () =>
  Boolean(EMAILJS_CONFIG.publicKey && EMAILJS_CONFIG.serviceId && EMAILJS_CONFIG.templateId);

/**
 * Video latar hero bawaan. CATATAN: berkas ini masih berada di akun Cloudinary LAMA (dum9j7yn1),
 * bukan akun dl4pyan8v. Selama akun lama masih aktif, video tetap tampil. Disarankan unggah ulang
 * videonya ke akun baru lewat Control Panel → Konten & Nav → Hero Video, lalu nilai ini tidak terpakai lagi.
 */
export const DEFAULT_HERO_VIDEO =
  env.VITE_DEFAULT_HERO_VIDEO ||
  "https://res.cloudinary.com/dum9j7yn1/video/upload/q_auto,vc_auto/v1782135360/Backgroud_Video_Hero_nfxtof.mp4";
