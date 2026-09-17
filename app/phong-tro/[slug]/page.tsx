import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { preload } from "react-dom";
import { getListingById, getSimilarListings } from "../../../lib/listings";
import { formatPrice, availabilityLabel, type ListingDoc } from "../../../lib/listing-utils";
import { SITE_URL, SITE_NAME, HOTLINE, HOTLINE_DISPLAY, LOGO_URL } from "../../../lib/site";
import { cld } from "../../../lib/image";
import { extractId, listingPath } from "../../../lib/slug";
import ListingDetailClient from "./ListingDetailClient";

// ISR: HTML được cache và làm mới mỗi 60 giây (dữ liệu lấy bằng Mongoose, không phải fetch)
export const revalidate = 60;

/* URL chuẩn: /phong-tro/<slug-tieu-de>-<id>. Chỉ 24 ký tự hex cuối quyết định tin nào;
 * phần slug sai/cũ (đổi tiêu đề) sẽ được redirect 308 về URL đúng ở page. */
type Props = { params: Promise<{ slug: string }> };

/** Lấy tin từ slug URL. Slug không có id hợp lệ → null. */
async function getListingFromSlug(slug: string): Promise<ListingDoc | null> {
  const id = extractId(slug);
  return id ? getListingById(id) : null;
}

/** Mô tả 150–160 ký tự: địa chỉ, giá, 2–3 tiện nghi, tình trạng, hotline. */
function buildDescription(l: ListingDoc): string {
  const extras = [...(l.highlights ?? []), ...(l.amenities ?? [])]
    .filter((x) => typeof x === "string" && x.trim())
    .slice(0, 3)
    .join(", ");
  const parts = [
    `Phòng trọ ${l.address || "Bình Thạnh, TPHCM"}`,
    `giá ${formatPrice(l.price)}đ/tháng`,
    extras,
    availabilityLabel(l.availableDate),
    `Hotline ${HOTLINE_DISPLAY}`,
  ].filter(Boolean);
  let desc = parts.join(". ") + ".";
  if (desc.length > 160) desc = desc.slice(0, 157).replace(/[\s,.]+$/, "") + "...";
  return desc;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingFromSlug(slug);
  if (!listing) return { title: "Không tìm thấy phòng", robots: { index: false, follow: false } };

  const title = `${listing.title} - ${formatPrice(listing.price)}đ/tháng`;
  const description = buildDescription(listing);
  // Canonical luôn là URL chuẩn, kể cả khi đang phục vụ slug cũ
  const url = listingPath(listing);
  const image = listing.coverImage ? cld(listing.coverImage, { w: 1200 }) : LOGO_URL;
  const isHidden = listing.status === "hide";

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: `${title} | ${SITE_NAME}`,
      description,
      siteName: SITE_NAME,
      locale: "vi_VN",
      images: [{ url: image, alt: listing.title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    // Tin ẩn vẫn xem được (chủ tin/admin) nhưng không cho bot index
    ...(isHidden ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function ListingPage({ params }: Props) {
  const { slug } = await params;
  const listing = await getListingFromSlug(slug);
  if (!listing) notFound();

  // Slug trong URL khác slug đúng (tiêu đề đã đổi, link gõ tay...) → 308 về URL chuẩn, tránh trùng lặp
  const canonicalPath = listingPath(listing);
  if (`/phong-tro/${slug}` !== canonicalPath) permanentRedirect(canonicalPath);

  const id = listing._id;
  const similar = await getSimilarListings(listing, 4);
  const pageUrl = `${SITE_URL}${canonicalPath}`;
  const images = ([listing.coverImage, ...(listing.images ?? [])].filter(Boolean) as string[])
    .map((u) => cld(u, { w: 1200 }));

  // Preload ảnh LCP (hero) ngay trong <head>, cùng URL/srcset với <img> ở ListingDetailClient
  if (listing.coverImage) {
    preload(cld(listing.coverImage, { w: 1200 }), {
      as: "image",
      fetchPriority: "high",
      imageSrcSet: `${cld(listing.coverImage, { w: 800 })} 800w, ${cld(listing.coverImage, { w: 1200 })} 1200w`,
      imageSizes: "(max-width: 900px) 100vw, 62vw",
    });
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${pageUrl}#product`,
        name: listing.title,
        description: listing.description || buildDescription(listing),
        image: images.length ? images : [LOGO_URL],
        url: pageUrl,
        sku: listing._id,
        category: listing.category || "Phòng trọ",
        brand: { "@type": "Brand", name: SITE_NAME },
        offers: {
          "@type": "Offer",
          url: pageUrl,
          price: listing.price,
          priceCurrency: "VND",
          availability: listing.status === "hide"
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/InStock",
          // Giá thuê theo tháng
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: listing.price,
            priceCurrency: "VND",
            unitCode: "MON",
            unitText: "tháng",
          },
          seller: { "@type": "Organization", name: SITE_NAME, telephone: `+84${HOTLINE.slice(1)}`, url: SITE_URL },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Trang chủ", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Phòng trống", item: `${SITE_URL}/phong-trong` },
          { "@type": "ListItem", position: 3, name: listing.title, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ListingDetailClient id={id} initialData={listing} initialSimilar={similar} />
    </>
  );
}
