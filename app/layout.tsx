import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";

// Sử dụng font Inter để giao diện trông hiện đại và chuyên nghiệp
const inter = Inter({ subsets: ["latin"] });

// Đường dẫn logo Cloudinary của bạn
const logoOnlineUrl = "https://res.cloudinary.com/dm30nbwuo/image/upload/v1777648952/logo_an_gia_house_chrome_hlb8nr.png";

export const metadata: Metadata = {
  // Tiêu đề hiển thị trên tab trình duyệt
  title: "Phòng trọ Angiahouse",
  description: "Hệ thống phòng trọ Angiahouse TPHCM - 090.222.5314",
  
  // Cấu hình để hiện logo trên tab Google (Favicon)
  icons: {
    icon: [
      {
        url: logoOnlineUrl,
        href: logoOnlineUrl,
      },
    ],
    // Hiển thị logo đẹp hơn khi lưu trang web ra màn hình chính điện thoại (iPhone/Android)
    apple: logoOnlineUrl,
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