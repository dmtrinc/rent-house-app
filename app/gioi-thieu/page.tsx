import type { Metadata } from "next";
import Link from "next/link";
import { AREAS, areaPath } from "../../lib/areas";
import { SITE_URL, SITE_NAME, HOTLINE, HOTLINE_DISPLAY, LOGO_URL } from "../../lib/site";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

/* Trang giới thiệu — nội dung tĩnh, prerender lúc build. */

const GREEN = "#006633";
const PHONE_INTL = `+84${HOTLINE.slice(1)}`;

export const metadata: Metadata = {
  title: "Giới thiệu – cho thuê phòng trọ Bình Thạnh trực tiếp từ chủ nhà",
  description: `${SITE_NAME} quản lý và cho thuê trực tiếp hàng chục phòng trọ tại Bình Thạnh, Phú Nhuận, TPHCM. Không qua trung gian, không phí môi giới, full nội thất, không chung chủ. Hotline ${HOTLINE_DISPLAY}.`,
  alternates: { canonical: "/gioi-thieu" },
  openGraph: { url: "/gioi-thieu", title: `Giới thiệu ${SITE_NAME}` },
};

const COMMITMENTS = [
  { icon: "🏠", title: "Chủ nhà cho thuê trực tiếp", text: "Toàn bộ phòng do Angiahouse quản lý hoặc hợp tác trực tiếp với chủ nhà. Bạn không mất phí môi giới, giá đăng là giá thuê." },
  { icon: "🛋️", title: "Full nội thất, vào ở ngay", text: "Máy lạnh, tủ lạnh, giường nệm, tủ quần áo, kệ bếp, WC riêng. Chỉ cần mang vali tới." },
  { icon: "🔑", title: "Không chung chủ, giờ giấc tự do", text: "Khóa riêng từng phòng, camera an ninh, chỗ để xe trong nhà. Không giới hạn giờ ra vào." },
  { icon: "💡", title: "Điện nước minh bạch", text: "Điện nước tính theo giá quy định, có đồng hồ riêng. Không phát sinh phí lạ, hợp đồng rõ ràng." },
  { icon: "📞", title: "Xem phòng trong ngày", text: "Gọi hotline là có người dẫn xem phòng ngay, kể cả cuối tuần. Ảnh trên web là ảnh thật của phòng." },
  { icon: "🔄", title: "Cập nhật liên tục", text: "Tin trên angiahouse.site là phòng đang trống thật; phòng đã cho thuê được ẩn ngay để bạn không mất công." },
];

export default function GioiThieuPage() {
  const pageUrl = `${SITE_URL}/gioi-thieu`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": pageUrl,
        url: pageUrl,
        name: `Giới thiệu ${SITE_NAME}`,
        inLanguage: "vi-VN",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": ["Organization", "LocalBusiness", "RealEstateAgent"],
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: LOGO_URL,
        telephone: PHONE_INTL,
        address: { "@type": "PostalAddress", addressLocality: "Bình Thạnh", addressRegion: "Hồ Chí Minh", addressCountry: "VN" },
        areaServed: AREAS.map((a) => ({ "@type": "Place", name: a.name })),
        sameAs: [`https://zalo.me/${HOTLINE}`],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Trang chủ", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Giới thiệu", item: pageUrl },
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
          <span>Giới thiệu</span>
        </nav>

        <h1 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800, color: GREEN, margin: "0 0 14px", letterSpacing: "-0.3px" }}>
          {SITE_NAME} – phòng trọ Bình Thạnh cho thuê trực tiếp từ chủ nhà
        </h1>

        <section style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", marginBottom: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", fontSize: 15, lineHeight: 1.75, color: "#333" }}>
          <p style={{ margin: "0 0 12px" }}>
            <strong>{SITE_NAME}</strong> là hệ thống phòng trọ tại quận Bình Thạnh, TPHCM, hoạt động từ nhiều năm nay với các dãy phòng
            ở khu Hàng Xanh (Bạch Đằng, Xô Viết Nghệ Tĩnh), Mai Xuân Thưởng, Nguyễn Văn Đậu, Lê Quang Định, Đặng Thùy Trâm và mở rộng sang Phú Nhuận,
            quận 3, quận 10, Gò Vấp, Tân Bình.
          </p>
          <p style={{ margin: "0 0 12px" }}>
            Khác với các trang rao vặt, mọi tin trên <strong>angiahouse.site</strong> đều là phòng do chúng tôi quản lý trực tiếp hoặc hợp tác
            với chủ nhà — bạn gọi là gặp đúng người có chìa khóa, không qua môi giới, không mất phí. Ảnh trên web là ảnh thật của từng phòng,
            giá đăng là giá thuê thực tế.
          </p>
          <p style={{ margin: 0 }}>
            Khách hàng của Angiahouse chủ yếu là sinh viên Hutech, UEF, Văn Lang, Giao thông vận tải, Ngoại thương và người đi làm ở quận 1,
            Bình Thạnh, Thủ Đức. Chúng tôi hiểu các bạn cần: phòng sạch, an ninh, giờ giấc tự do, điện nước rõ ràng và chủ nhà dễ nói chuyện.
          </p>
        </section>

        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111", margin: "0 0 12px" }}>Cam kết của {SITE_NAME}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, marginBottom: 24 }}>
          {COMMITMENTS.map((c) => (
            <div key={c.title} style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 26, marginBottom: 6 }}>{c.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: GREEN, margin: "0 0 6px" }}>{c.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "#555", margin: 0 }}>{c.text}</p>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111", margin: "0 0 12px" }}>Khu vực có phòng</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
          {AREAS.map((a) => (
            <Link key={a.slug} href={areaPath(a)} style={{ padding: "8px 14px", borderRadius: 20, background: "#fff", border: `1px solid ${GREEN}`, color: GREEN, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
              Phòng trọ {a.name}
            </Link>
          ))}
        </div>

        <section style={{ background: GREEN, borderRadius: 14, padding: "22px 20px", textAlign: "center", color: "#fff" }}>
          <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 10px" }}>Cần xem phòng hôm nay?</p>
          <a href={`tel:${HOTLINE}`} style={{ display: "inline-block", padding: "10px 22px", borderRadius: 24, background: "#FFD966", color: GREEN, fontWeight: 800, fontSize: 16, textDecoration: "none", marginRight: 8 }}>
            📞 {HOTLINE_DISPLAY}
          </a>
          <a href={`https://zalo.me/${HOTLINE}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", padding: "10px 22px", borderRadius: 24, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
            💬 Zalo
          </a>
          <p style={{ fontSize: 13, margin: "12px 0 0", opacity: 0.85 }}>
            Hoặc xem <Link href="/lien-he" style={{ color: "#FFD966", fontWeight: 700 }}>trang liên hệ</Link> để biết thêm cách kết nối.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
