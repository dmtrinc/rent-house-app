import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { SITE_URL, SITE_NAME, LOGO_URL, HOTLINE_DISPLAY } from "../lib/site";

// Sử dụng font Inter để giao diện trông hiện đại và chuyên nghiệp.
// Subset "vietnamese" để chữ có dấu không fallback sang font khác (gây CLS); display swap để text hiện ngay.
const inter = Inter({ subsets: ["latin", "vietnamese"], display: "swap" });

export const metadata: Metadata = {
  // Gốc để các URL tương đối (canonical, og:image...) thành URL tuyệt đối
  metadataBase: new URL(SITE_URL),
  // Tiêu đề hiển thị trên tab trình duyệt; trang con dùng template "%s | Angiahouse"
  title: {
    default: `Phòng trọ Bình Thạnh giá tốt, full nội thất | ${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: `${SITE_NAME} cho thuê phòng trọ Bình Thạnh, TPHCM: Hàng Xanh, Bạch Đằng, Xô Viết Nghệ Tĩnh... Full nội thất, không chung chủ, giá từ 3,5 triệu. Hotline ${HOTLINE_DISPLAY}.`,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: SITE_NAME,
    url: "/",
    images: [{ url: LOGO_URL, width: 512, height: 512, alt: SITE_NAME }],
  },
  twitter: { card: "summary_large_image" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },

  // Cấu hình để hiện logo trên tab Google (Favicon)
  icons: {
    icon: [
      {
        url: LOGO_URL,
        href: LOGO_URL,
      },
    ],
    // Hiển thị logo đẹp hơn khi lưu trang web ra màn hình chính điện thoại (iPhone/Android)
    apple: LOGO_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className} style={{ margin: 0, padding: 0 }}>
        {/* Thẻ main ở layout được lược bỏ để tránh xung đột với style trong page.tsx */}
        {children}
      </body>
    </html>
  );
}
