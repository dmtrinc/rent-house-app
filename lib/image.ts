/* Tối ưu ảnh Cloudinary: chèn transform f_auto,q_auto,w_<w>,c_fill vào sau "/upload/".
 * Chỉ áp dụng cho URL res.cloudinary.com, URL khác trả về nguyên vẹn.
 * Dùng chung cho server (preload, JSON-LD) và client (thẻ <img>). */

export interface CldOptions {
  /** Chiều rộng tối đa (px). Cloudinary tự scale, không phóng to ảnh gốc nhỏ hơn. */
  w?: number;
  /** Chiều cao (px) — chỉ có tác dụng khi kèm w, dùng c_fill để cắt vừa khung. */
  h?: number;
  /** Chất lượng: số 1–100 hoặc "auto" (mặc định). */
  q?: number | "auto";
}

const CLOUDINARY_HOST = "res.cloudinary.com";
const UPLOAD_SEGMENT = "/upload/";

export function isCloudinaryUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && url.includes(CLOUDINARY_HOST) && url.includes(UPLOAD_SEGMENT);
}

export function cld(url: string | null | undefined, opts: CldOptions = {}): string {
  if (!url) return "";
  if (!isCloudinaryUrl(url)) return url;

  const idx = url.indexOf(UPLOAD_SEGMENT) + UPLOAD_SEGMENT.length;
  const rest = url.slice(idx);
  // Đã có transform (không bắt đầu bằng "v<số>/" hay tên file trực tiếp) → không chèn thêm để tránh trùng
  if (/^[a-z]{1,2}_[^/]+\//.test(rest)) return url;

  const parts: string[] = ["f_auto", `q_${opts.q ?? "auto"}`];
  if (opts.w) {
    parts.push(`w_${Math.round(opts.w)}`);
    if (opts.h) parts.push(`h_${Math.round(opts.h)}`, "c_fill", "g_auto");
    else parts.push("c_limit");
  }
  return url.slice(0, idx) + parts.join(",") + "/" + rest;
}

/** Alt text mô tả cho ảnh tin: "<tiêu đề> - phòng trọ <địa chỉ>". */
export function listingAlt(title: string | null | undefined, address?: string | null): string {
  const t = (title || "Phòng trọ").trim();
  const a = (address || "").trim();
  return a ? `${t} - phòng trọ ${a}` : t;
}
