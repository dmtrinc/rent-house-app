import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AREAS, areaPath, findArea, filterByArea, type Area } from "../../lib/areas";
import { getActiveListings } from "../../lib/listings";
import { formatPrice, type ListingDoc } from "../../lib/listing-utils";
import { unaccent, listingPath } from "../../lib/slug";
import { SITE_URL, SITE_NAME, HOTLINE, HOTLINE_DISPLAY } from "../../lib/site";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import ListingCard from "../components/ListingCard";

/* Trang khu vực /phong-tro-<slug> (landing page theo từ khóa địa phương).
 * Prerender tất cả khu vực trong lib/areas.ts; segment khác → 404.
 * ISR 5 phút để danh sách tin không quá cũ. */
export const revalidate = 300;
export const dynamicParams = false;

type Props = { params: Promise<{ area: string }> };

const GREEN = "#006633";

export function generateStaticParams() {
  return AREAS.map((a) => ({ area: areaPath(a).slice(1) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { area: segment } = await params;
  const area = findArea(segment);
  if (!area) return { robots: { index: false, follow: false } };
  const url = areaPath(area);
  return {
    title: area.title,
    description: area.description,
    alternates: { canonical: url },
    openGraph: { url, title: `${area.title} | ${SITE_NAME}`, description: area.description },
  };
}

/** Thống kê để trả lời FAQ từ dữ liệu thật. */
function stats(area: Area, items: ListingDoc[]) {
  const prices = items.map((l) => l.price).filter((p) => p > 0);
  const min = prices.length ? Math.min(...prices) : null;
  const max = prices.length ? Math.max(...prices) : null;
  const withLoft = items.filter((l) =>
    /\b(gac|lung|duplex)\b/.test(unaccent(`${l.title} ${(l.highlights ?? []).join(" ")} ${l.description ?? ""}`))
  ).length;
  return { min, max, withLoft, count: items.length, nearby: area.nearby };
}

function buildFaq(area: Area, s: ReturnType<typeof stats>) {
  const priceAnswer = s.min !== null && s.max !== null
    ? (s.min === s.max
      ? `Hiện ${SITE_NAME} có ${s.count} phòng trọ ${area.name} đang trống với giá ${formatPrice(s.min)}đ/tháng, đã bao gồm nội thất. Điện nước tính theo giá quy định, wifi và chỗ để xe máy miễn phí.`
      : `Hiện ${SITE_NAME} có ${s.count} phòng trọ ${area.name} đang trống, giá từ ${formatPrice(s.min)}đ đến ${formatPrice(s.max)}đ/tháng tùy diện tích và loại phòng, đã bao gồm nội thất. Điện nước tính theo giá quy định, wifi và chỗ để xe máy miễn phí.`)
    : `Phòng trọ ${area.name} của ${SITE_NAME} thường có giá từ 3 đến 6,5 triệu/tháng tùy diện tích. Hiện tạm hết phòng trống ở khu này — gọi ${HOTLINE_DISPLAY} để được báo ngay khi có phòng hoặc xem các khu lân cận.`;

  const loftAnswer = s.withLoft > 0
    ? `Có. ${s.withLoft} trong số ${s.count} phòng đang trống tại ${area.name} có gác lửng hoặc dạng duplex, phù hợp ở 2–4 người hoặc gia đình nhỏ. Các phòng còn lại là phòng trệt/phòng 1 người, full nội thất.`
    : `Các phòng đang trống tại ${area.name} hiện là phòng không gác, full nội thất. ${SITE_NAME} thường xuyên có phòng gác ở các khu khác của Bình Thạnh — gọi ${HOTLINE_DISPLAY} để được tư vấn.`;

  const nearbyAnswer = `Phòng trọ ${area.name} của ${SITE_NAME} gần ${s.nearby.join(", ")}. Đi xe máy 5–10 phút, một số phòng đi bộ được tới trường.`;

  return [
    { q: `Phòng trọ ${area.name} giá bao nhiêu?`, a: priceAnswer },
    { q: `Phòng trọ ${area.name} có gác không?`, a: loftAnswer },
    { q: `Phòng trọ ${area.name} gần trường nào?`, a: nearbyAnswer },
  ];
}

export default async function AreaPage({ params }: Props) {
  const { area: segment } = await params;
  const area = findArea(segment);
  if (!area) notFound();

  const all = await getActiveListings();
  const items = filterByArea(area, all);
  const s = stats(area, items);
  const faq = buildFaq(area, s);
  const pageUrl = `${SITE_URL}${areaPath(area)}`;
  const otherAreas = AREAS.filter((a) => a.slug !== area.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": pageUrl,
        url: pageUrl,
        name: area.title,
        description: area.description,
        inLanguage: "vi-VN",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@type": "Place", name: `${area.name}, Hồ Chí Minh, Việt Nam` },
      },
      {
        "@type": "ItemList",
        name: `Phòng trọ ${area.name} đang trống`,
        numberOfItems: items.length,
        itemListElement: items.map((l, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: l.title,
          url: `${SITE_URL}${listingPath(l)}`,
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Trang chủ", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: `Phòng trọ ${area.name}`, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f8f8" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <SiteHeader />

      <main style={{ maxWidth: 1760, margin: "0 auto", padding: "24px 20px 40px" }}>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
          <Link href="/" style={{ color: GREEN, textDecoration: "none" }}>Trang chủ</Link>
          <span style={{ margin: "0 6px" }}>›</span>
          <span>Phòng trọ {area.name}</span>
        </nav>

        <section style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 800, color: GREEN, margin: "0 0 12px", letterSpacing: "-0.3px" }}>
            {area.title}
          </h1>
          {area.intro.map((p, i) => (
            <p key={i} style={{ fontSize: 14.5, lineHeight: 1.7, color: "#444", margin: "0 0 10px", maxWidth: 960 }}>{p}</p>
          ))}
          <a href={`tel:${HOTLINE}`} style={{ display: "inline-block", marginTop: 4, padding: "10px 20px", borderRadius: 24, background: "#FFD966", color: GREEN, fontWeight: 800, fontSize: 14, textDecoration: "none" }}>
            📞 Gọi {HOTLINE_DISPLAY} xem phòng
          </a>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111", margin: "0 0 14px" }}>
            {items.length > 0
              ? `${items.length} phòng trọ ${area.name} đang trống`
              : `Hiện chưa có phòng trống tại ${area.name}`}
          </h2>
          {items.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
              {items.map((item, idx) => (
                <ListingCard key={item._id} item={item} isFirst={idx < 2} />
              ))}
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 14, padding: "28px 20px", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
              <p style={{ fontSize: 15, color: "#555", margin: "0 0 14px" }}>
                Phòng khu này vừa hết. Gọi <a href={`tel:${HOTLINE}`} style={{ color: GREEN, fontWeight: 700 }}>{HOTLINE_DISPLAY}</a> để được báo ngay khi có phòng mới, hoặc xem tất cả phòng đang trống.
              </p>
              <Link href="/" style={{ display: "inline-block", padding: "10px 20px", borderRadius: 24, background: GREEN, color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                Xem tất cả phòng trống →
              </Link>
            </div>
          )}
        </section>

        <section style={{ marginBottom: 32, maxWidth: 960 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111", margin: "0 0 12px" }}>Câu hỏi thường gặp về phòng trọ {area.name}</h2>
          {faq.map((f) => (
            <details key={f.q} open style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", marginBottom: 8, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              <summary style={{ fontWeight: 700, fontSize: 15, color: GREEN, cursor: "pointer" }}>{f.q}</summary>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#444", margin: "8px 0 0" }}>{f.a}</p>
            </details>
          ))}
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111", margin: "0 0 10px" }}>Khu vực khác</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {otherAreas.map((a) => (
              <Link key={a.slug} href={areaPath(a)} style={{ padding: "7px 14px", borderRadius: 20, background: "#fff", border: `1px solid ${GREEN}`, color: GREEN, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                Phòng trọ {a.name}
              </Link>
            ))}
            <Link href="/phong-trong" style={{ padding: "7px 14px", borderRadius: 20, background: GREEN, color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
              Tất cả phòng trống
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
