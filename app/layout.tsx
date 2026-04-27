import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

// SỬA TẠI ĐÂY: Dán link logo online của Cloudinary bạn vừa lấy ở Bước 1 vào đây
const logoOnlineUrl = "https://res.cloudinary.com/df717ylr1/image/upload/v1777294578/logo_ifm9zc.png";

export const metadata: Metadata = {
  // SỬA YÊU CẦU 1: Đổi tiêu đề tab trình duyệt
  title: "Phòng trọ Angiahouse",
  description: "Hệ thống quản lý phòng trọ Angiahouse",
  icons: {
    // Cấu hình logo hiện trên tab (Favicon)
    icon: logoOnlineUrl,
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
        <main className="min-h-screen bg-slate-900 text-white">
          {children}
        </main>
      </body>
    </html>
  );
}