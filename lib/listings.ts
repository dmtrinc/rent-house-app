/* Truy vấn MongoDB cho các server component (page.tsx, generateMetadata, sitemap).
 * CHỈ import từ server — file này kéo theo mongoose. Hàm thuần dùng chung nằm ở
 * lib/listing-utils.ts. */
import { cache } from "react";
import mongoose from "mongoose";
import connectDB from "./mongodb";
import Listing from "../models/listing";
import { sortItems, type ListingDoc } from "./listing-utils";

/** Chuyển document Mongo (ObjectId, Date) sang JSON thuần để truyền qua props.
 * Dùng JSON roundtrip để có đúng hình dạng mà client nhận từ /api/listings. */
export function serializeListing<T = ListingDoc>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

/** Lấy 1 tin theo id. Trả null nếu id sai định dạng hoặc không tồn tại.
 * Tin ẩn (status "hide") VẪN được trả về để chủ tin/admin xem được; page sẽ đặt noindex.
 * Bọc React cache() để generateMetadata và page dùng chung 1 lần query. */
export const getListingById = cache(async (id: string): Promise<ListingDoc | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  try {
    await connectDB();
    const doc = await Listing.findById(id).lean();
    return doc ? serializeListing(doc) : null;
  } catch (err) {
    console.error("getListingById:", err);
    return null;
  }
});

/** Phòng tương tự: tin active khác, sắp theo chênh lệch giá — giống logic client cũ. */
export async function getSimilarListings(listing: ListingDoc, limit = 4): Promise<ListingDoc[]> {
  try {
    await connectDB();
    const others = await Listing.find({ status: "active", _id: { $ne: listing._id } })
      .select("_id title address price coverImage updatedAt")
      .lean();
    const sorted = serializeListing<ListingDoc[]>(others)
      .sort((a, b) => Math.abs(a.price - listing.price) - Math.abs(b.price - listing.price));
    return sorted.slice(0, limit);
  } catch (err) {
    console.error("getSimilarListings:", err);
    return [];
  }
}

/** Toàn bộ tin active, đã sắp theo thứ tự trang chủ. Lỗi DB → [] (không làm hỏng build). */
export const getActiveListings = cache(async (): Promise<ListingDoc[]> => {
  try {
    await connectDB();
    const docs = await Listing.find({ status: "active" }).sort({ updatedAt: -1 }).lean();
    return sortItems(serializeListing<ListingDoc[]>(docs));
  } catch (err) {
    console.error("getActiveListings:", err);
    return [];
  }
});

export interface SystemConfig {
  globalPostEnabled: boolean;
  phongtrongTitle: string;
  phongtrongFooter: string;
}

const DEFAULT_CONFIG: SystemConfig = {
  globalPostEnabled: true,
  phongtrongTitle: "Phòng trọ Angiahouse - danh sách phòng trống",
  phongtrongFooter: "Angiahouse 090.222.5314 - Phí sale 50% (HĐ6th) 70% (HĐ12th)",
};

/** Đọc thẳng collection system_config (cùng nguồn với /api/admin/config). */
export const getSystemConfig = cache(async (): Promise<SystemConfig> => {
  try {
    const conn = await connectDB();
    const doc = await conn.connection.db?.collection("system_config").findOne({ _id: "main" as never });
    return {
      globalPostEnabled: doc?.globalPostEnabled ?? DEFAULT_CONFIG.globalPostEnabled,
      phongtrongTitle: doc?.phongtrongTitle || DEFAULT_CONFIG.phongtrongTitle,
      phongtrongFooter: doc?.phongtrongFooter || DEFAULT_CONFIG.phongtrongFooter,
    };
  } catch (err) {
    console.error("getSystemConfig:", err);
    return DEFAULT_CONFIG;
  }
});
