import type { Metadata } from "next";
import Link from "next/link";
import { HOTLINE, HOTLINE_DISPLAY } from "../lib/site";

export const metadata: Metadata = {
  title: "Không tìm thấy phòng này",
  robots: { index: false, follow: false },
};

const GREEN = "#006633";
const YELLOW = "#FFD966";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#f9f9f9",
        fontFamily: "inherit",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <div style={{ fontSize: 72, fontWeight: 800, color: GREEN, lineHeight: 1 }}>404</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#222", margin: "16px 0 8px" }}>
          Không tìm thấy phòng này
        </h1>
        <p style={{ fontSize: 15, color: "#666", margin: "0 0 24px", lineHeight: 1.5 }}>
          Tin có thể đã cho thuê hoặc đường dẫn không đúng. Xem các phòng trống khác hoặc gọi
          cho Angiahouse để được hỗ trợ.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              borderRadius: 8,
              background: GREEN,
              color: "#fff",
              textDecoration: "none",
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            Về trang chủ
          </Link>
          <Link
            href="/phong-trong"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              borderRadius: 8,
              background: YELLOW,
              color: GREEN,
              textDecoration: "none",
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            Xem phòng trống
          </Link>
        </div>
        <p style={{ fontSize: 14, color: "#444", marginTop: 24 }}>
          Hotline:{" "}
          <a href={`tel:${HOTLINE}`} style={{ color: GREEN, fontWeight: 700, textDecoration: "none" }}>
            {HOTLINE_DISPLAY}
          </a>
        </p>
      </div>
    </main>
  );
}
