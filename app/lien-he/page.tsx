import type { Metadata } from "next";
import Link from "next/link";
import { AREAS, areaPath } from "../../lib/areas";
import { SITE_URL, SITE_NAME, HOTLINE, HOTLINE_DISPLAY } from "../../lib/site";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

/* Trang liên hệ — nội dung tĩnh, prerender lúc build. */

const GREEN = "#006633";
const PHONE_INTL = `+84${HOTLINE.slice(1)}`;
// Khu vực hoạt động chính (chưa có địa chỉ văn phòng cố định) → nhúng bản đồ quanh Hàng Xanh
const MAP_QUERY = encodeURIComponent("Ngã tư Hàng Xanh, Bình Thạnh, Hồ Chí Minh");
const MAP_EMBED = `https://www.google.com/maps?q=${MAP_QUERY}&z=14&output=embed`;

export const metadata: Metadata = {
  title: `Liên hệ – hotline ${HOTLINE_DISPLAY}, Zalo, xem phòng trong ngày`,
  description: `Liên hệ ${SITE_NAME} để xem phòng trọ Bình Thạnh: gọi/Zalo ${HOTLINE_DISPLAY} (7h–22h hàng ngày). Khu vực Hàng Xanh, Bạch Đằng, Xô Viết Nghệ Tĩnh, Mai Xuân Thưởng, Đặng Thùy Trâm, Phú Nhuận.`,
  alternates: { canonical: "/lien-he" },
  openGraph: { url: "/lien-he", title: `Liên hệ ${SITE_NAME}` },
};

const CHANNELS = [
  { icon: "📞", label: "Gọi điện", value: HOTLINE_DISPLAY, href: `tel:${HOTLINE}`, note: "7h–22h hàng ngày, kể cả cuối tuần" },
  { icon: "💬", label: "Zalo", value: HOTLINE_DISPLAY, href: `https://zalo.me/${HOTLINE}`, note: "Nhắn tin, gửi ảnh/video phòng, hẹn giờ xem", external: true },
  { icon: "🌐", label: "Website", value: "angiahouse.site", href: "/", note: "Danh sách phòng trống cập nhật hàng ngày" },
];

export default function LienHePage() {
  const pageUrl = `${SITE_URL}/lien-he`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        "@id": pageUrl,
        url: pageUrl,
        name: `Liên hệ ${SITE_NAME}`,
        inLanguage: "vi-VN",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#organization` },
        mainEntity: {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          name: SITE_NAME,
          telephone: PHONE_INTL,
          contactPoint: {
            "@type": "ContactPoint",
            telephone: PHONE_INTL,
            contactType: "customer service",
            availableLanguage: "Vietnamese",
            hoursAvailable: { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], opens: "07:00", closes: "22:00" },
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Trang chủ", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Liên hệ", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f8f8" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <SiteHeader />

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px 40px" }}>
        <nav aria-label="Breadcrumb" style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
          <Link href="/" style={{ color: GREEN, textDecoration: "none" }}>Trang chủ</Link>
          <span style={{ margin: "0 6px" }}>›</span>
          <span>Liên hệ</span>
        </nav>

        <h1 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800, color: GREEN, margin: "0 0 8px", letterSpacing: "-0.3px" }}>
          Liên hệ {SITE_NAME} – xem phòng trọ Bình Thạnh trong ngày
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: "#444", margin: "0 0 20px" }}>
          Gọi hoặc nhắn Zalo cho chúng tôi, nói khu vực và mức giá bạn cần — Angiahouse sẽ gợi ý phòng phù hợp và hẹn giờ dẫn xem ngay,
          kể cả buổi tối và cuối tuần. Không mất phí môi giới.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 24 }}>
          {CHANNELS.map((c) => (
            <a key={c.label} href={c.href}
              {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              style={{ display: "block", background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", textDecoration: "none", color: "inherit" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{c.icon}</div>
              <div style={{ fontSize: 13, color: "#777", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{c.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: GREEN, margin: "2px 0 4px" }}>{c.value}</div>
              <div style={{ fontSize: 13, color: "#666" }}>{c.note}</div>
            </a>
          ))}
        </div>

        <section style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", marginBottom: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 10px" }}>Khu vực hoạt động</h2>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "#555", margin: "0 0 12px" }}>
            Các dãy phòng của Angiahouse tập trung quanh Hàng Xanh và các tuyến đường trung tâm Bình Thạnh, mở rộng sang Phú Nhuận và các quận lân cận.
            Chọn khu vực để xem phòng đang trống:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {AREAS.map((a) => (
              <Link key={a.slug} href={areaPath(a)} style={{ padding: "7px 14px", borderRadius: 20, background: "#f8f8f8", border: `1px solid ${GREEN}`, color: GREEN, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                {a.name}
              </Link>
            ))}
          </div>
          <div style={{ position: "relative", width: "100%", paddingBottom: "56%", borderRadius: 12, overflow: "hidden", background: "#eee" }}>
            <iframe
              src={MAP_EMBED}
              title="Bản đồ khu vực Hàng Xanh, Bình Thạnh"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
            />
          </div>
        </section>

        <section style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 10px" }}>Chủ nhà muốn đăng phòng?</h2>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "#555", margin: "0 0 12px" }}>
            Nếu bạn có phòng trống ở Bình Thạnh hoặc các quận lân cận, hãy đăng tin miễn phí trên angiahouse.site hoặc gọi hotline để được hỗ trợ đăng và tìm khách nhanh.
          </p>
          <Link href="/dang-tin" style={{ display: "inline-block", padding: "10px 20px", borderRadius: 24, background: "#FFD966", color: GREEN, fontWeight: 800, fontSize: 14, textDecoration: "none" }}>
            Đăng tin cho thuê →
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
