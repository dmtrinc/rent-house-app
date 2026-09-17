import type { Metadata } from "next";
import { preload } from "react-dom";
import { getActiveListings, getSystemConfig } from "../lib/listings";
import { SITE_URL, SITE_NAME, HOTLINE, HOTLINE_DISPLAY, LOGO_URL } from "../lib/site";
import { cld } from "../lib/image";
import HomeClient from "./HomeClient";

// ISR: HTML trang chủ được cache và làm mới mỗi 60 giây; client vẫn fetch nền bản mới nhất
export const revalidate = 60;

export const metadata: Metadata = {
  // Title/description mặc định đã đặt ở layout gốc; trang chủ chỉ cần canonical
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

const PHONE_INTL = `+84${HOTLINE.slice(1)}`;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "LocalBusiness", "RealEstateAgent"],
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      alternateName: "Phòng trọ Angiahouse",
      url: SITE_URL,
      logo: LOGO_URL,
      image: LOGO_URL,
      telephone: PHONE_INTL,
      priceRange: "3.500.000đ - 6.000.000đ/tháng",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Bình Thạnh",
        addressRegion: "Hồ Chí Minh",
        addressCountry: "VN",
      },
      areaServed: [
        { "@type": "Place", name: "Quận Bình Thạnh, TP. Hồ Chí Minh" },
        { "@type": "Place", name: "Hàng Xanh" },
        { "@type": "Place", name: "Bạch Đằng" },
        { "@type": "Place", name: "Xô Viết Nghệ Tĩnh" },
        { "@type": "Place", name: "Mai Xuân Thưởng" },
      ],
      contactPoint: {
        "@type": "ContactPoint",
        telephone: PHONE_INTL,
        contactType: "customer service",
        availableLanguage: "Vietnamese",
      },
      sameAs: [`https://zalo.me/${HOTLINE}`],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: "vi-VN",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default async function HomePage() {
  const [items, config] = await Promise.all([getActiveListings(), getSystemConfig()]);

  // Preload ảnh LCP: ảnh bìa tin đầu tiên (cùng URL/srcset với LazyImage trong HomeClient)
  const firstCover = items[0]?.coverImage;
  if (firstCover) {
    preload(cld(firstCover, { w: 600 }), {
      as: "image",
      fetchPriority: "high",
      imageSrcSet: `${cld(firstCover, { w: 400 })} 400w, ${cld(firstCover, { w: 600 })} 600w, ${cld(firstCover, { w: 800 })} 800w`,
      imageSizes: "(max-width: 640px) 100vw, 400px",
    });
  }

  // JSX truyền qua props sang client component được Flight gửi dạng lazy; React
  // không thấy được cờ "static child" nên cần key tường minh để không cảnh báo.
  const intro = (
    <section key="intro" style={{ marginBottom: 20 }}>
      <h1 style={{ fontSize: "clamp(18px, 2.5vw, 24px)", fontWeight: 800, color: "#006633", margin: "0 0 6px", letterSpacing: "-0.3px" }}>
        {`Phòng trọ Bình Thạnh giá tốt, full nội thất – ${SITE_NAME}`}
      </h1>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "#666", margin: 0, maxWidth: 900 }}>
        {SITE_NAME} cho thuê phòng trọ tại quận Bình Thạnh, TPHCM: khu Hàng Xanh, Bạch Đằng, Xô Viết Nghệ Tĩnh,
        Mai Xuân Thưởng — gần Hutech, UEF, Văn Lang. Phòng full nội thất, có gác, không chung chủ, giờ giấc tự do,
        giá từ 3,5 triệu/tháng. Hiện có {items.length} phòng trống, gọi ngay{" "}
        <a href={`tel:${HOTLINE}`} style={{ color: "#006633", fontWeight: 700, textDecoration: "none" }}>{HOTLINE_DISPLAY}</a>{" "}
        để xem phòng.
      </p>
    </section>
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <HomeClient
        initialItems={items}
        initialConfig={{ globalPostEnabled: config.globalPostEnabled }}
        intro={intro}
      />
    </>
  );
}
