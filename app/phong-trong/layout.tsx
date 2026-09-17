import type { Metadata } from "next";

// Ghi đè canonical/og:url kế thừa từ layout gốc (đang trỏ về "/")
export const metadata: Metadata = {
  alternates: { canonical: "/phong-trong" },
  openGraph: { url: "/phong-trong" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
