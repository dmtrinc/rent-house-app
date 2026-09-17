/* Header tĩnh (server component) cho các trang nội dung: khu vực, giới thiệu, liên hệ.
 * Cùng màu/khoảng cách với header trang chủ (HomeClient) nhưng không có trạng thái đăng nhập. */
import Link from "next/link";
import { cld } from "../../lib/image";
import { HOTLINE, HOTLINE_DISPLAY } from "../../lib/site";

const GREEN = "#006633";
const YELLOW = "#FFD966";

const navBtn: React.CSSProperties = {
  padding: "6px 14px", borderRadius: 22, border: "1px solid rgba(255,255,255,0.3)",
  color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 600,
  background: "rgba(255,255,255,0.1)", whiteSpace: "nowrap", display: "inline-block",
};

export default function SiteHeader() {
  return (
    <header style={{ borderBottom: "1px solid #004d26", position: "sticky", top: 0, backgroundColor: GREEN, zIndex: 100, boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
      <div style={{ maxWidth: 1760, margin: "0 auto", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <img src={cld("https://res.cloudinary.com/dm30nbwuo/image/upload/v1777648613/logo_xjxqjd.png", { w: 128 })}
              alt="Angiahouse" width={68} height={63} style={{ height: 32, width: "auto" }} fetchPriority="high" />
            <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: -0.5 }}>ANGIAHOUSE</span>
          </Link>
          <a href={`tel:${HOTLINE}`} style={{ fontSize: 13, fontWeight: 600, color: "#fff", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, borderLeft: "2px solid rgba(255,255,255,0.3)", paddingLeft: 12 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.56.57 1 1 0 011 1V21a1 1 0 01-1 1A17 17 0 013 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.56a1 1 0 01-.25 1.01l-2.2 2.22z"/>
            </svg>
            <span>{HOTLINE_DISPLAY}</span>
          </a>
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Link href="/dang-tin" style={{ ...navBtn, background: YELLOW, color: GREEN, border: "none" }}>Đăng tin</Link>
          <Link href="/phong-trong" style={navBtn}>Phòng trống</Link>
          <Link href="/" style={navBtn}>Trang chủ</Link>
        </nav>
      </div>
    </header>
  );
}
