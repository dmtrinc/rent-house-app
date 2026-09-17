import type { Metadata } from "next";
import { getActiveListings, getSystemConfig } from "../../lib/listings";
import { SITE_URL, SITE_NAME, HOTLINE_DISPLAY } from "../../lib/site";
import PhongTrongClient from "./PhongTrongClient";

// ISR: làm mới mỗi 60 giây; client vẫn fetch nền bản mới nhất (admin/mod thấy cả tin ẩn)
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Danh sách phòng trống Bình Thạnh – cập nhật hôm nay",
  description: `Bảng tổng hợp phòng trọ đang trống tại Bình Thạnh, TPHCM của ${SITE_NAME}: giá thuê, tiền điện nước, dịch vụ, ngày trống. Lọc theo khu vực, giá, tiện nghi. Hotline ${HOTLINE_DISPLAY}.`,
  alternates: { canonical: "/phong-trong" },
  openGraph: { url: "/phong-trong", title: `Danh sách phòng trống Bình Thạnh | ${SITE_NAME}` },
};

export default async function PhongTrongPage() {
  const [items, config] = await Promise.all([getActiveListings(), getSystemConfig()]);

  // Danh sách tin dạng ItemList để bot hiểu đây là trang tổng hợp
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: config.phongtrongTitle,
    url: `${SITE_URL}/phong-trong`,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 50).map((l, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: l.title,
      url: `${SITE_URL}/listing/${l._id}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <PhongTrongClient
        initialItems={items as never}
        initialTitle={config.phongtrongTitle}
        initialFooter={config.phongtrongFooter}
      />
    </>
  );
}
