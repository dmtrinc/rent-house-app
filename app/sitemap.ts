import type { MetadataRoute } from "next";
import connectMongoDB from "../lib/mongodb";
import Listing from "../models/listing";
import { SITE_URL } from "../lib/site";
import { listingPath } from "../lib/slug";
import { AREAS, areaPath } from "../lib/areas";

// Sitemap được cache mặc định → tự làm mới mỗi giờ để bắt tin mới/tin bị ẩn
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/phong-trong`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    // Trang khu vực (landing page theo từ khóa)
    ...AREAS.map((a) => ({
      url: `${SITE_URL}${areaPath(a)}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
  ];

  let listingPages: MetadataRoute.Sitemap = [];
  try {
    await connectMongoDB();
    const listings = await Listing.find({ status: "active" })
      .select("_id title updatedAt")
      .lean<{ _id: { toString(): string }; title?: string; updatedAt?: Date }[]>();

    listingPages = listings.map((l) => ({
      url: `${SITE_URL}${listingPath(l)}`,
      lastModified: l.updatedAt ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch (err) {
    // Lỗi DB không được làm hỏng sitemap — vẫn trả về các trang tĩnh
    console.error("Sitemap: không lấy được danh sách tin", err);
  }

  return [...staticPages, ...listingPages];
}
