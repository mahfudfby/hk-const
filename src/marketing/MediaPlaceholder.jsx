import React from "react";

const ICONS = {
  image: <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm2 11h12l-4-5-3 4-2-2-3 3Zm2.5-7.5a1.5 1.5 0 1 0 0 .01Z" />,
  video: <path d="M4 6h10a2 2 0 0 1 2 2v1.5l4-2.5v10l-4-2.5V16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />,
  reel: <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm3 5v8l7-4-7-4Z" />,
  map: <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />,
};

/** Placeholder ringan (tanpa file gambar) untuk foto/video/lokasi yang belum diisi. */
export default function MediaPlaceholder({ ratio = "16/9", kind = "image", label, hint, className = "", style }) {
  return (
    <div className={`hc-ph ${className}`} style={{ aspectRatio: ratio, ...style }} role="img" aria-label={label || "Media placeholder"}>
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{ICONS[kind] || ICONS.image}</svg>
      {label && <b>{label}</b>}
      {hint && <small>{hint}</small>}
    </div>
  );
}
