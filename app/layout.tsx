import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Thuê Nhà App",
  description: "Ứng dụng cho thuê nhà hiện đại",
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