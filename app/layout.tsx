import type { Metadata } from "next"; // Thiếu dòng này sẽ bị lỗi Build
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

// Link logo Cloudinary của bạn đã chính xác
const logoOnlineUrl = "https://res.cloudinary.com/df717ylr1/image/upload/v1777294578/logo_ifm9zc.png";

export const metadata: Metadata = {
  title: "Phòng trọ Angiahouse",
  description: "Hệ thống quản lý phòng trọ Angiahouse",
  icons: {
    icon: logoOnlineUrl,
    // Thêm apple-touch-icon để hiển thị đẹp trên iPhone
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
      <body className={inter.className}>
        {/* Giữ cấu trúc đơn giản để tránh xung đột với layout của page.tsx */}
        {children}
      </body>
    </html>
  );
}