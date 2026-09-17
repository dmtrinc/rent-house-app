import type { Metadata } from "next";

// Trang nội bộ: không cho Google/Bing index
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
