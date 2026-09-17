// IndexNow: báo cho Bing/Yandex biết URL vừa thêm/sửa/xóa để index gần như tức thì.
// Đọc INDEXNOW_KEY từ env; không có key thì bỏ qua. Không bao giờ throw để không làm hỏng luồng chính.
import { SITE_URL } from "./site";

const HOST = new URL(SITE_URL).host;
const ENDPOINT = "https://api.indexnow.org/indexnow";

export function getIndexNowKey(): string | undefined {
  const key = process.env.INDEXNOW_KEY?.trim();
  return key ? key : undefined;
}

// URL công khai chứa key, phục vụ bởi app/indexnow/[key]/route.ts
export function indexNowKeyLocation(key: string): string {
  return `${SITE_URL}/indexnow/${key}.txt`;
}

/**
 * Gửi danh sách đường dẫn (vd: "/phong-tro/phong-abc-<id>", "/") lên IndexNow.
 * Luôn kèm trang chủ và /phong-trong vì danh sách tin ở đó cũng thay đổi.
 */
export async function notifyIndexNow(paths: string[]): Promise<void> {
  const key = getIndexNowKey();
  if (!key) return;

  const urlList = Array.from(
    new Set([...paths, "/", "/phong-trong"].map((p) => new URL(p, SITE_URL).toString()))
  );

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOST,
        key,
        keyLocation: indexNowKeyLocation(key),
        urlList,
      }),
    });
    // 200/202 = nhận; 4xx = key/URL sai, chỉ log để biết
    if (!res.ok && res.status !== 202) {
      console.warn("IndexNow trả về", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.warn("IndexNow lỗi mạng:", err);
  }
}
