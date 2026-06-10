import { useEffect } from "react";

export default function Lightbox({ src, onClose }) {
  useEffect(() => {
    if (!src) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)",
        zIndex: 99999, display: "flex", alignItems: "center",
        justifyContent: "center", cursor: "zoom-out",
      }}
    >
      {/* Fixed-size container — image always fills it via objectFit */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(90vw, 1200px)", height: "min(90vh, 850px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "default" }}
      >
        <img
          src={src}
          alt="Preview"
          style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "8px", boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}
        />
      </div>
      <button
        onClick={onClose}
        style={{ position: "absolute", top: "16px", right: "20px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", borderRadius: "50%", width: "38px", height: "38px", cursor: "pointer", fontSize: "22px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
      >×</button>
    </div>
  );
}
