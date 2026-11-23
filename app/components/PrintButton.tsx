"use client";

export default function PrintButton({ label = "🖨️ In / Lưu PDF" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      style={{
        background: "#ff9800", color: "#000", border: "none", padding: "10px 18px",
        borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 15,
      }}
    >
      {label}
    </button>
  );
}
