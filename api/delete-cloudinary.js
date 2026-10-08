/**
 * /api/delete-cloudinary
 * Vercel Serverless Function — menghapus asset (gambar/video) dari Cloudinary.
 *
 * Kenapa harus lewat sini (bukan langsung dari browser)?
 * Cloudinary tidak mengizinkan penghapusan tanpa autentikasi API Key + API Secret.
 * Secret ini TIDAK BOLEH ada di kode frontend (RealEstateWeb.jsx) karena bisa
 * dibaca siapa saja lewat DevTools browser. Fungsi ini berjalan di server Vercel,
 * jadi Secret-nya aman tersimpan sebagai Environment Variable.
 *
 * WAJIB di-set di Vercel → Project Settings → Environment Variables:
 *   CLOUDINARY_CLOUD_NAME   = (cloud name akun Cloudinary Anda)
 *   CLOUDINARY_API_KEY      = (ambil dari Cloudinary Dashboard → Settings → API Keys)
 *   CLOUDINARY_API_SECRET   = (ambil dari Cloudinary Dashboard → Settings → API Keys)
 * Lalu redeploy project agar env var terbaca.
 *
 * Body request (POST, JSON):
 *   { "publicIds": ["folder/nama_file", ...], "resourceType": "image" | "video" }
 */
import { originAllowed, rateLimited, clientIp } from "./_lib/capi.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  /* Hardening: endpoint ini menghapus aset di akun Cloudinary — batasi ke origin situs sendiri + rate limit.
     (Autentikasi admin sebenarnya masih berjalan di sisi klien; lihat catatan keamanan di README.) */
  if (!originAllowed(req)) return res.status(403).json({ error: "Origin tidak diizinkan" });
  if (rateLimited("del:" + clientIp(req), 60, 10 * 60 * 1000)) return res.status(429).json({ error: "Terlalu banyak permintaan" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { publicIds, resourceType = "image" } = body || {};

  if (!Array.isArray(publicIds) || publicIds.length === 0) {
    return res.status(200).json({ ok: true, deleted: {}, note: "Tidak ada publicIds, tidak ada yang dihapus." });
  }
  if (publicIds.length > 50 || publicIds.some((id) => typeof id !== "string" || id.length > 300 || /[\u0000-\u001f]/.test(id))) {
    return res.status(400).json({ error: "publicIds tidak valid (maks 50 item)" });
  }
  if (!["image", "video", "raw"].includes(resourceType)) {
    return res.status(400).json({ error: "resourceType tidak valid" });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({
      error: "Konfigurasi Cloudinary belum lengkap di server. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET di Environment Variables Vercel, lalu redeploy."
    });
  }

  try {
    // Admin API Cloudinary pakai HTTP Basic Auth (api_key:api_secret), bukan signature.
    const basicAuth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
    const qs = publicIds
      .filter(Boolean)
      .map(id => `public_ids[]=${encodeURIComponent(id)}`)
      .join("&");

    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/${resourceType}/upload?${qs}`,
      {
        method: "DELETE",
        headers: { Authorization: `Basic ${basicAuth}` },
      }
    );

    const result = await cloudRes.json();

    if (!cloudRes.ok) {
      return res.status(cloudRes.status).json({ error: result?.error?.message || "Cloudinary menolak permintaan hapus." });
    }

    return res.status(200).json({ ok: true, deleted: result.deleted || {}, partial: result.partial || false });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Gagal menghubungi Cloudinary." });
  }
}
