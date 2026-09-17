/* Footer dùng chung (server component): link nội bộ tới các trang khu vực,
 * giới thiệu, liên hệ — để bot đi được tới mọi landing page từ bất kỳ trang nào. */
import Link from "next/link";
import { AREAS, areaPath } from "../../lib/areas";
import { SITE_NAME, HOTLINE, HOTLINE_DISPLAY } from "../../lib/site";

const GREEN = "#006633";
const YELLOW = "#FFD966";

const linkStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.85)", textDecoration: "none", fontSize: 13, lineHeight: 1.9, display: "block",
};
const headingStyle: React.CSSProperties = {
  color: YELLOW, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 8px",
};

export default function SiteFooter() {
  return (
    <footer style={{ background: GREEN, color: "#fff", marginTop: 40 }}>
      <div style={{ maxWidth: 1760, margin: "0 auto", padding: "32px 20px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 28 }}>
        <div>
          <p style={headingStyle}>{SITE_NAME}</p>
          <p style={{ fontSize: 13, lineHeight: 1.7, margin: "0 0 10px", color: "rgba(255,255,255,0.85)" }}>
            Cho thuê phòng trọ Bình Thạnh, Phú Nhuận và các quận trung tâm TPHCM. Full nội thất, không chung chủ, giờ giấc tự do, chủ nhà cho thuê trực tiếp.
          </p>
          <a href={`tel:${HOTLINE}`} style={{ color: YELLOW, fontWeight: 800, fontSize: 16, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1L6.6 10.8z" />
            </svg>
            {HOTLINE_DISPLAY}
          </a>
          <br />
          <a href={`https://zalo.me/${HOTLINE}`} target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, display: "inline-block", marginTop: 4 }}>Zalo: {HOTLINE_DISPLAY}</a>
        </div>

        <nav aria-label="Phòng trọ theo khu vực">
          <p style={headingStyle}>Phòng trọ theo khu vực</p>
          {AREAS.map((a) => (
            <Link key={a.slug} href={areaPath(a)} style={linkStyle}>Phòng trọ {a.name}</Link>
          ))}
        </nav>

        <nav aria-label="Liên kết">
          <p style={headingStyle}>Angiahouse</p>
          <Link href="/" style={linkStyle}>Trang chủ</Link>
          <Link href="/phong-trong" style={linkStyle}>Danh sách phòng trống</Link>
          <Link href="/gioi-thieu" style={linkStyle}>Giới thiệu</Link>
          <Link href="/lien-he" style={linkStyle}>Liên hệ</Link>
          <Link href="/dang-tin" style={linkStyle}>Đăng tin cho thuê</Link>
        </nav>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", padding: "12px 20px", textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
        © {new Date().getFullYear()} {SITE_NAME} — Phòng trọ Bình Thạnh, TPHCM
      </div>
    </footer>
  );
}
