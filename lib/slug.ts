/* URL thân thiện cho tin đăng: /phong-tro/<slug-tieu-de>-<id>.
 * Hàm thuần, dùng chung server + client (không import mongoose). */

const LISTING_PREFIX = "/phong-tro/";
const MAX_SLUG_LENGTH = 80;

/** Bỏ dấu tiếng Việt, lowercase, thay ký tự đặc biệt bằng "-", cắt 80 ký tự.
 * "P3 88/9 Bạch Đằng, Hàng Xanh" → "p3-88-9-bach-dang-hang-xanh" */
export function toSlug(input: string | null | undefined): string {
  const s = (input || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // bỏ dấu tổ hợp
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (s.length <= MAX_SLUG_LENGTH) return s;
  // Cắt tại dấu "-" gần nhất để không đứt giữa từ
  const cut = s.slice(0, MAX_SLUG_LENGTH);
  const lastDash = cut.lastIndexOf("-");
  return (lastDash > 20 ? cut.slice(0, lastDash) : cut).replace(/-+$/, "");
}

/** Đường dẫn chuẩn của 1 tin. Slug rỗng (tiêu đề toàn ký tự lạ) → chỉ còn id. */
export function listingPath(listing: { _id: unknown; title?: string | null }): string {
  const id = String(listing._id);
  const slug = toSlug(listing.title);
  return slug ? `${LISTING_PREFIX}${slug}-${id}` : `${LISTING_PREFIX}${id}`;
}

/** Lấy ObjectId (24 ký tự hex) ở cuối slug URL. Không có → null. */
export function extractId(slug: string | null | undefined): string | null {
  const m = (slug || "").match(/([0-9a-f]{24})$/i);
  return m ? m[1].toLowerCase() : null;
}
