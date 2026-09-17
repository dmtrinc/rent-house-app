import type { Metadata } from "next";

// Ghi đè canonical/og:url kế thừa từ layout gốc (đang trỏ về "/")
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    alternates: { canonical: `/listing/${id}` },
    openGraph: { url: `/listing/${id}` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
