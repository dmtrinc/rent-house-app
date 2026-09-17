# KẾ HOẠCH SEO — angiahouse.site (Google + Bing)

> File này là lộ trình từng bước để đưa cho Claude Opus thực hiện. Mỗi bước là **một phiên làm việc độc lập**: có mục tiêu, việc cần làm, file liên quan, cách kiểm tra và câu prompt gợi ý. Làm **đúng thứ tự** vì bước sau phụ thuộc bước trước.
>
> Ngày lập: 15/09/2026. Stack: Next.js 16.2.4 (App Router), React 19, MongoDB/Mongoose, Cloudinary, deploy Vercel. Repo: `C:\Users\Admin\rent-house`.
>
> ⚠️ Quy tắc chung cho Opus khi thực hiện bất kỳ bước nào:
> 1. Đọc `AGENTS.md` và guide tương ứng trong `node_modules/next/dist/docs/` trước khi viết code (Next 16 khác bản cũ).
> 2. Không phá vỡ hành vi hiện có: cache trong bộ nhớ (`homeCache`, `detailCache`), infinite scroll, nút sửa/ẩn tin, đăng nhập bằng cookie `user_role`.
> 3. Sau mỗi bước: `npm run build` phải pass, chạy `npm run dev` kiểm tra bằng `curl` (xem mục "Cách kiểm tra"), rồi commit riêng với message tiếng Việt.
> 4. Không commit file `.env.local`.

---

## 0. Hiện trạng (đã khảo sát ngày 15/09/2026)

| Hạng mục | Tình trạng | Ảnh hưởng SEO |
|---|---|---|
| `robots.txt` | 404 | Bot không biết sitemap, không có hướng dẫn crawl |
| `sitemap.xml` | 404 | Google/Bing không biết 31 trang tin đang có |
| Render | 100% `"use client"` (`app/page.tsx`, `app/listing/[id]/page.tsx`, `app/phong-trong/page.tsx`...) | HTML trả về cho bot **rỗng**, nội dung phòng chỉ có sau khi JS fetch `/api/listings` |
| Title / description | 1 bộ cố định trong `app/layout.tsx`: "Phòng trọ Angiahouse" | 31 trang tin trùng title → Google coi là trùng lặp |
| Canonical / Open Graph / Twitter card | Không có | Chia sẻ Zalo/Facebook không có ảnh, Google không biết URL chuẩn |
| JSON-LD (structured data) | Không có | Không có rich result |
| Domain `www.angiahouse.site` | Không phân giải DNS (curl trả 000) | Người gõ www không vào được, mất link |
| HTTP → HTTPS | 308 đúng | OK |
| URL tin | `/listing/6a8ed7754bc1a05410ef2501` | Không có từ khóa trong URL |
| Trang nội bộ (`/admin`, `/mod`, `/login`, `/register`, `/dang-tin`, `/edit`, `/user`, `/page2`) | Không chặn index | Rác trong kết quả tìm kiếm |
| Ảnh | `<img>` thường, `alt={item.title}`, Cloudinary không có `f_auto,q_auto` | LCP chậm, Google Images kém |
| H1 trang chủ | Không có | Thiếu tín hiệu chủ đề |
| 404 page | Mặc định tiếng Anh của Next | Trải nghiệm kém |
| Dữ liệu | 31 tin active, chủ yếu quận Bình Thạnh (Hàng Xanh, Bạch Đằng, Xô Viết Nghệ Tĩnh, Mai Xuân Thưởng), giá 3.9–5.7 triệu | Từ khóa mục tiêu rõ ràng |

**Từ khóa mục tiêu** (dùng xuyên suốt title/description/nội dung):
- Chính: `phòng trọ Bình Thạnh`, `thuê phòng trọ Bình Thạnh`, `phòng trọ TPHCM`, `phòng trọ Angiahouse`
- Khu vực: `phòng trọ Hàng Xanh`, `phòng trọ Bạch Đằng Bình Thạnh`, `phòng trọ Xô Viết Nghệ Tĩnh`, `phòng trọ Mai Xuân Thưởng`, `phòng trọ gần Hutech`, `phòng trọ gần UEF`
- Đặc tính: `phòng trọ full nội thất Bình Thạnh`, `phòng trọ có gác Bình Thạnh`, `phòng trọ không chung chủ Bình Thạnh`, `phòng trọ giá rẻ Bình Thạnh`

---

## GIAI ĐOẠN 1 — NỀN TẢNG KỸ THUẬT (bắt buộc, làm trước tiên)

### Bước 1.1 — `robots.ts` + chặn index trang nội bộ

**Mục tiêu:** Bot biết được phép crawl gì, tìm sitemap ở đâu.

**Việc cần làm:**
1. Tạo `app/robots.ts` (đọc `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/robots.md`):
   - `allow: "/"`
   - `disallow: ["/api/", "/admin", "/mod", "/login", "/register", "/dang-tin", "/edit/", "/user", "/page2"]`
   - `sitemap: "https://angiahouse.site/sitemap.xml"`
   - `host: "https://angiahouse.site"`
2. Tạo `lib/site.ts` chứa hằng số dùng chung: `SITE_URL = "https://angiahouse.site"`, `SITE_NAME = "Angiahouse"`, `HOTLINE = "0902225314"`, `LOGO_URL` (link Cloudinary hiện có trong `app/layout.tsx`).

**Cách kiểm tra:**
```bash
curl -s http://localhost:3000/robots.txt
```
Phải thấy `Sitemap:` và các dòng `Disallow`.

**Prompt cho Opus:**
> Đọc SEO-PLAN.md bước 1.1. Tạo `lib/site.ts` và `app/robots.ts` theo mô tả. Chạy build, kiểm tra bằng curl, commit "SEO: thêm robots.txt và hằng số site".

---

### Bước 1.2 — `sitemap.ts` động từ MongoDB

**Mục tiêu:** Google/Bing biết toàn bộ tin active và ngày cập nhật.

**Việc cần làm:**
1. Tạo `app/sitemap.ts` (đọc `sitemap.md` cùng thư mục docs với robots):
   - Kết nối Mongo qua `lib/mongodb.ts`, query `Listing.find({ status: "active" }).select("_id updatedAt").lean()`.
   - Trả về: trang chủ (priority 1, `changeFrequency: "daily"`), `/phong-trong` (0.8, daily), mỗi tin `/listing/<id>` (0.7, weekly, `lastModified: updatedAt`).
   - Docs ghi rõ sitemap **được cache mặc định** nếu không dùng request-time API → thêm `export const revalidate = 3600` để tự làm mới mỗi giờ.
2. Không đưa tin `status: "hide"` vào.

**Cách kiểm tra:**
```bash
curl -s http://localhost:3000/sitemap.xml | head -40
```
Phải thấy `<loc>https://angiahouse.site/listing/...` với đủ số tin active.

**Prompt cho Opus:**
> Đọc SEO-PLAN.md bước 1.2. Tạo `app/sitemap.ts` lấy tin active từ MongoDB, revalidate 3600. Build, curl kiểm tra, commit "SEO: sitemap.xml động từ MongoDB".

---

### Bước 1.3 — Metadata gốc trong `app/layout.tsx`

**Mục tiêu:** Có `metadataBase`, title template, Open Graph, Twitter card, canonical mặc định, robots mặc định.

**Việc cần làm:** Sửa `export const metadata` trong `app/layout.tsx` (đọc `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`):
```ts
metadataBase: new URL(SITE_URL),
title: { default: "Phòng trọ Bình Thạnh giá tốt, full nội thất | Angiahouse", template: "%s | Angiahouse" },
description: "Angiahouse cho thuê phòng trọ Bình Thạnh, TPHCM: Hàng Xanh, Bạch Đằng, Xô Viết Nghệ Tĩnh... Full nội thất, không chung chủ, giá từ 3,5 triệu. Hotline 090.222.5314.",
alternates: { canonical: "/" },
openGraph: { type: "website", locale: "vi_VN", siteName: "Angiahouse", url: "/", images: [{ url: LOGO_URL, width: 512, height: 512 }] },
twitter: { card: "summary_large_image" },
robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
icons: { ...giữ nguyên... },
```
- Giữ nguyên `lang="vi"`.
- Thêm `export const viewport` nếu Next 16 yêu cầu tách (kiểm tra docs `generate-viewport.md`).

**Cách kiểm tra:**
```bash
curl -s http://localhost:3000/ | grep -o "<meta[^>]*og:[^>]*>\|<link rel=\"canonical\"[^>]*>\|<title>[^<]*</title>"
```

**Prompt cho Opus:**
> Đọc SEO-PLAN.md bước 1.3. Cập nhật metadata gốc trong app/layout.tsx dùng hằng số từ lib/site.ts. Build, curl kiểm tra, commit "SEO: metadata gốc, Open Graph, canonical".

---

### Bước 1.4 — Chặn index các trang nội bộ bằng metadata

**Mục tiêu:** Dù robots.txt đã disallow, vẫn cần `noindex` để chắc chắn không lọt vào Google.

**Việc cần làm:** Các trang `/admin`, `/mod`, `/login`, `/register`, `/dang-tin`, `/edit/[id]`, `/user`, `/user/listing/[user]`, `/page2` hiện là `"use client"` nên **không export được `metadata`**. Cách làm cho từng trang:
1. Tạo `layout.tsx` trong thư mục của trang đó (server component) chỉ chứa:
   ```ts
   export const metadata = { robots: { index: false, follow: false } };
   export default function Layout({ children }) { return children; }
   ```
2. Không sửa `page.tsx` của các trang này.

**Cách kiểm tra:**
```bash
curl -s http://localhost:3000/login | grep -o '<meta name="robots"[^>]*>'
```
Phải thấy `noindex`.

**Prompt cho Opus:**
> Đọc SEO-PLAN.md bước 1.4. Thêm layout.tsx với robots noindex cho từng trang nội bộ liệt kê. Build, curl kiểm tra, commit "SEO: noindex trang quản trị và đăng nhập".

---

### Bước 1.5 — Trang 404 tiếng Việt

**Việc cần làm:** Tạo `app/not-found.tsx` (server component): tiêu đề "Không tìm thấy phòng này", nút về trang chủ và `/phong-trong`, hotline. Metadata `robots: noindex`.

**Prompt cho Opus:**
> Đọc SEO-PLAN.md bước 1.5. Tạo app/not-found.tsx tiếng Việt, giao diện đồng bộ màu xanh #006633 và vàng #FFD966 như trang chủ. Commit.

---

## GIAI ĐOẠN 2 — RENDER PHÍA SERVER (quan trọng nhất, quyết định có lên top hay không)

> Nguyên tắc: **tách mỗi trang thành 2 file**: `page.tsx` (server component, không có `"use client"`, export `metadata`/`generateMetadata`, fetch dữ liệu từ MongoDB trực tiếp, render JSON-LD) và `XxxClient.tsx` (toàn bộ code client hiện tại, nhận `initialData` qua props). Docs Next 16 mô tả đúng mẫu này trong phần "Why generateMetadata is Server Component only" của `generate-metadata.md`.
>
> Lưu ý caching Next 16: page lấy dữ liệu bằng Mongoose (không phải `fetch`) sẽ bị **prerender tĩnh lúc build** nếu không khai báo. Phải thêm `export const revalidate = 60` (ISR, làm mới mỗi 60 giây) hoặc `export const dynamic = "force-dynamic"`. Đọc `node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md` trước.

### Bước 2.1 — Trang chi tiết tin `/listing/[id]` (ưu tiên số 1)

**Mục tiêu:** Mỗi tin có title, description, OG image, canonical, JSON-LD riêng và **nội dung có sẵn trong HTML**.

**Việc cần làm:**
1. Đổi tên `app/listing/[id]/page.tsx` → `app/listing/[id]/ListingDetailClient.tsx`. Sửa signature: thay vì nhận `params` và fetch, nhận props `{ id: string; initialData: Listing | null; initialSimilar: Listing[] }`. Khởi tạo state `data` từ `initialData` (giống cách `detailCache` đang làm), vẫn giữ fetch nền (stale-while-revalidate) để không đổi hành vi.
2. Tạo `lib/listings.ts` (server-only) với:
   - `getListingById(id)`: validate ObjectId, `Listing.findById(id).lean()`, trả `null` nếu không có hoặc `status === "hide"` (tin ẩn → 404 với bot; nếu muốn chủ tin vẫn xem được tin ẩn thì trả về nhưng metadata `noindex`).
   - `getSimilarListings(listing, limit = 4)`: giống logic sắp xếp theo chênh lệch giá hiện có ở client.
   - `serializeListing(doc)`: chuyển `_id`, `Date` sang string để truyền qua props (tránh lỗi serialize).
3. Tạo lại `app/listing/[id]/page.tsx` (server):
   - `export const revalidate = 60`.
   - `generateMetadata`: 
     - `title`: `${listing.title} - ${listing.price.toLocaleString("vi-VN")}đ/tháng` (template sẽ thêm "| Angiahouse").
     - `description`: 150–160 ký tự, gồm địa chỉ, giá, 2–3 tiện nghi đầu, "Trống từ ..." hoặc "Dọn vào ngay", hotline.
     - `alternates.canonical: /listing/${id}`.
     - `openGraph`: `type: "article"` hoặc `"website"`, `images: [listing.coverImage]`, `url`.
     - Nếu không có tin → `notFound()`.
   - Render JSON-LD (đọc `node_modules/next/dist/docs/01-app/02-guides/json-ld.md`, nhớ `.replace(/</g, "\\u003c")`):
     - `@type: "Product"` với `offers: { @type: "Offer", price, priceCurrency: "VND", availability: "https://schema.org/InStock" }`, `image`, `description`, `name`.
     - Kèm `BreadcrumbList`: Trang chủ → Phòng trống → tên tin.
   - Render `<ListingDetailClient id={id} initialData={...} initialSimilar={...} />`.
4. Giữ nguyên toàn bộ tính năng: nút sửa, sao, voucher, bản đồ, YouTube/TikTok trong mô tả, phòng tương tự.
5. Kiểm tra hydration: state ban đầu client phải giống HTML server (không dùng `localStorage` khi tính state khởi tạo, chỉ trong `useEffect`).

**Cách kiểm tra:**
```bash
curl -s http://localhost:3000/listing/6a8ed7754bc1a05410ef2501 | grep -o "<title>[^<]*</title>\|<h1[^>]*>[^<]*\|application/ld+json"
```
Phải thấy title riêng, `<h1>` có tên tin ngay trong HTML, và `application/ld+json`. Mở trình duyệt xác nhận không có lỗi hydration trong console. Dán HTML vào https://validator.schema.org kiểm tra JSON-LD.

**Prompt cho Opus:**
> Đọc SEO-PLAN.md bước 2.1 và các docs Next 16 được nêu. Tách app/listing/[id]/page.tsx thành server page (generateMetadata + JSON-LD + fetch Mongo) và ListingDetailClient.tsx. Tạo lib/listings.ts. Giữ nguyên mọi tính năng client. Build, curl kiểm tra, test hydration trên dev, commit "SEO: render server + metadata riêng cho trang chi tiết tin".

---

### Bước 2.2 — Trang chủ `/`

**Mục tiêu:** HTML trang chủ có sẵn H1, đoạn giới thiệu và 10 tin đầu để bot đọc.

**Việc cần làm:**
1. Đổi `app/page.tsx` → `app/HomeClient.tsx`, nhận prop `initialItems` (đã sort bằng `sortItems` — chuyển hàm này sang `lib/listings.ts` để server và client dùng chung). Khởi tạo `allItems`/`visibleItems` từ `homeCache ?? initialItems`. Giữ nguyên fetch nền, infinite scroll, sao, config.
2. `app/page.tsx` mới (server): `revalidate = 60`, `metadata` với title/description/canonical trang chủ (có thể để layout lo, chỉ cần `alternates.canonical: "/"`), lấy `getActiveListings()` từ Mongo, render:
   - `<h1>` duy nhất, ví dụ: "Phòng trọ Bình Thạnh giá tốt – Angiahouse" (có thể style nhỏ, không phá layout).
   - 1 đoạn giới thiệu 2–3 câu có từ khóa (khu vực, full nội thất, không chung chủ, hotline). Có thể đặt trong `<p>` mờ dưới header hoặc ở footer.
   - JSON-LD `Organization` + `LocalBusiness` (name, url, logo, telephone `+84902225314`, address `addressLocality: "Bình Thạnh", addressRegion: "Hồ Chí Minh", addressCountry: "VN"`, `areaServed`) và `WebSite`.
   - `<HomeClient initialItems={...} />`.
3. Mỗi thẻ tin trong `HomeClient` bọc bằng `<Link href="/listing/...">` thật (thẻ `<a>`) để bot đi theo link — kiểm tra hiện tại có dùng `Link` chưa; nếu dùng `onClick` + `router.push` thì đổi sang `Link`.

**Cách kiểm tra:**
```bash
curl -s http://localhost:3000/ | grep -o "<h1[^>]*>[^<]*\|href=\"/listing/[^\"]*\"" | head
```
Phải thấy H1 và ≥10 link `/listing/...` trong HTML thô.

**Prompt cho Opus:**
> Đọc SEO-PLAN.md bước 2.2. Tách app/page.tsx thành server page (metadata, H1, giới thiệu, JSON-LD Organization/LocalBusiness, fetch 10+ tin) và HomeClient.tsx giữ nguyên hành vi. Build, curl kiểm tra, commit "SEO: render server trang chủ + JSON-LD doanh nghiệp".

---

### Bước 2.3 — Trang `/phong-trong`

**Việc cần làm:** Làm tương tự bước 2.2: `PhongTrongClient.tsx` + `page.tsx` server với `metadata` (title "Danh sách phòng trống Bình Thạnh – cập nhật hôm nay", canonical `/phong-trong`), H1, fetch dữ liệu ban đầu. Title/footer động từ `system_config` (`phongtrongTitle`) có thể lấy trên server bằng cách đọc thẳng collection `system_config`.

**Prompt cho Opus:**
> Đọc SEO-PLAN.md bước 2.3. Tách app/phong-trong/page.tsx theo mẫu bước 2.2. Build, curl, commit "SEO: render server trang phòng trống".

---

### Bước 2.4 — Kiểm tra toàn bộ giai đoạn 2 trên production

**Việc cần làm:**
1. Deploy lên Vercel (push `main`).
2. Chạy:
```bash
curl -s https://angiahouse.site/robots.txt
curl -s https://angiahouse.site/sitemap.xml | grep -c "<loc>"
curl -s https://angiahouse.site/ | grep -o "<h1[^>]*>[^<]*"
curl -s -A "Googlebot" https://angiahouse.site/listing/6a8ed7754bc1a05410ef2501 | grep -o "<title>[^<]*</title>"
```
3. Kiểm tra https://search.google.com/test/rich-results với 1 URL tin và trang chủ.
4. Kiểm tra https://pagespeed.web.dev với trang chủ và 1 tin, ghi lại điểm mobile để so sánh sau giai đoạn 4.

---

## GIAI ĐOẠN 3 — ĐĂNG KÝ VỚI GOOGLE & BING (việc ngoài code, chủ site làm, Opus hỗ trợ phần code)

### Bước 3.1 — Google Search Console

1. Vào https://search.google.com/search-console → Add property → chọn **Domain** `angiahouse.site` (xác minh bằng DNS TXT tại nhà cung cấp domain) **hoặc** URL-prefix `https://angiahouse.site` (xác minh bằng meta tag).
2. Nếu dùng meta tag: Opus thêm `verification: { google: "<mã>" }` vào metadata trong `app/layout.tsx`.
3. Submit sitemap: `https://angiahouse.site/sitemap.xml`.
4. Dùng **URL Inspection** → "Request indexing" cho trang chủ, `/phong-trong` và 5 tin tốt nhất.
5. Sau 3–7 ngày: xem báo cáo Pages (Indexed / Not indexed) và Core Web Vitals.

### Bước 3.2 — Bing Webmaster Tools + IndexNow

1. Vào https://www.bing.com/webmasters → **Import from Google Search Console** (nhanh nhất, khỏi xác minh lại). Nếu không: xác minh bằng meta tag, Opus thêm `verification: { other: { "msvalidate.01": "<mã>" } }`.
2. Submit sitemap trong Bing.
3. **IndexNow** (Bing/Yandex index gần như tức thì khi có tin mới):
   - Tạo key (chuỗi 32 ký tự hex) → lưu vào biến môi trường `INDEXNOW_KEY` trên Vercel.
   - Opus tạo route `app/[key].txt` **hoặc** đơn giản hơn: file tĩnh `public/<key>.txt` có nội dung là chính key đó.
   - Opus tạo `lib/indexnow.ts`: hàm `notifyIndexNow(urls: string[])` gọi `POST https://api.indexnow.org/indexnow` với body `{ host, key, keyLocation, urlList }`, nuốt lỗi (không làm hỏng luồng chính).
   - Gọi hàm này (fire-and-forget) trong `POST /api/listings` (tin mới), `PATCH`/`DELETE /api/listings/[id]` và `app/api/cron/cleanup`. Gửi cả URL trang chủ và `/phong-trong`.

**Cách kiểm tra:** Bing Webmaster → IndexNow → xem "URLs submitted" tăng sau khi đăng/sửa 1 tin.

**Prompt cho Opus:**
> Đọc SEO-PLAN.md bước 3.2. Thêm hỗ trợ IndexNow: file key trong public/, lib/indexnow.ts, gọi khi tạo/sửa/xóa tin và trong cron cleanup. Đọc INDEXNOW_KEY từ env, bỏ qua nếu không có. Commit "SEO: IndexNow cho Bing khi có tin mới".

### Bước 3.3 — Google Business Profile (rất hiệu quả cho từ khóa địa phương)

1. Tạo hồ sơ tại https://business.google.com: tên "Angiahouse – Phòng trọ Bình Thạnh", danh mục "Dịch vụ cho thuê nhà ở" / "Nhà trọ", địa chỉ văn phòng/khu trọ chính, SĐT 090.222.5314, website `https://angiahouse.site`.
2. Đăng ảnh phòng thật, cập nhật bài đăng mỗi tuần (link tới tin mới).
3. Xin đánh giá 5 sao từ người thuê.

### Bước 3.4 — Sửa DNS cho `www`

Tại nhà cung cấp domain: thêm record `CNAME www → cname.vercel-dns.com`. Trên Vercel → Project Settings → Domains: thêm `www.angiahouse.site` và chọn **Redirect to angiahouse.site (308)**. Kiểm tra:
```bash
curl -sI https://www.angiahouse.site/ | head -3
```

---

## GIAI ĐOẠN 4 — HIỆU NĂNG & ẢNH (Core Web Vitals)

### Bước 4.1 — Tối ưu ảnh Cloudinary

**Việc cần làm:**
1. Tạo `lib/image.ts` với hàm `cld(url, { w, h, q })` chèn `f_auto,q_auto,w_<w>,c_fill` vào sau `/upload/` của URL Cloudinary (chỉ khi URL chứa `res.cloudinary.com`). Ví dụ: `.../upload/f_auto,q_auto,w_800/v1787.../abc.jpg`.
2. Áp dụng trong `HomeClient.tsx` (thẻ tin: w=600), `ListingDetailClient.tsx` (ảnh hero: w=1200; thumbnail: w=300; phòng tương tự: w=400), `PhongTrongClient.tsx`.
3. Thêm `width`/`height` (hoặc `aspect-ratio` CSS đã có) cho mọi `<img>` để tránh CLS.
4. Alt text mô tả hơn: `${title} - phòng trọ ${address}` thay vì chỉ `title`.
5. Ảnh hero trang chi tiết: server page thêm `<link rel="preload" as="image" href={cld(coverImage, {w:1200})} fetchPriority="high">` (Next 16: dùng `ReactDOM.preload` hoặc metadata; kiểm tra docs `link` preload).
6. Cân nhắc `next/image` với `images.remotePatterns` cho `res.cloudinary.com` trong `next.config.ts` — chỉ làm nếu không phá layout `paddingBottom: 72%` hiện có.

**Cách kiểm tra:** PageSpeed Insights mobile: LCP < 2.5s, CLS < 0.1. So với số đo ở bước 2.4.

**Prompt cho Opus:**
> Đọc SEO-PLAN.md bước 4.1. Tạo lib/image.ts, áp dụng transform Cloudinary f_auto,q_auto cho mọi ảnh, alt text mô tả, preload ảnh hero. Build, kiểm tra không vỡ layout trên mobile, commit "SEO: tối ưu ảnh Cloudinary, alt text, preload LCP".

### Bước 4.2 — Giảm JS và font

1. `app/layout.tsx`: font Inter thêm `display: "swap"` và `subsets: ["latin", "vietnamese"]` (hiện thiếu `vietnamese` → chữ có dấu fallback sang font khác gây CLS).
2. `app/globals.css`: bỏ khối `prefers-color-scheme: dark` đặt nền đen (site không hỗ trợ dark mode, gây nền đen trên máy dark mode).
3. Xóa `app/page2` nếu chỉ là trang debug (hỏi chủ site trước).

---

## GIAI ĐOẠN 5 — URL & NỘI DUNG (tăng thứ hạng theo từ khóa)

### Bước 5.1 — URL thân thiện `/phong-tro/<slug>-<id>`

**Mục tiêu:** URL chứa từ khóa, ví dụ `/phong-tro/p3-88-9-bach-dang-hang-xanh-6a8ed7754bc1a05410ef2501`.

**Việc cần làm:**
1. `lib/slug.ts`: hàm `toSlug(title)` bỏ dấu tiếng Việt (đ → d), lowercase, thay ký tự đặc biệt bằng `-`, cắt 80 ký tự. Hàm `listingPath(listing)` trả `/phong-tro/${toSlug(title)}-${_id}`. Hàm `extractId(slug)` lấy 24 ký tự hex cuối.
2. Tạo route `app/phong-tro/[slug]/page.tsx` dùng lại server page và `ListingDetailClient` của bước 2.1 (import chung, không copy). Nếu slug trong URL khác slug đúng → `permanentRedirect` sang URL đúng (tránh trùng lặp).
3. `app/listing/[id]/page.tsx` → `permanentRedirect(listingPath(listing))` (308). Giữ route này vĩnh viễn vì link cũ đã chia sẻ trên Zalo/Facebook.
4. Đổi mọi `href="/listing/..."` trong client sang `listingPath(item)`. Sitemap dùng URL mới. Canonical dùng URL mới.
5. IndexNow gửi URL mới.

**Cách kiểm tra:**
```bash
curl -sI http://localhost:3000/listing/6a8ed7754bc1a05410ef2501 | head -3
```
Phải thấy 308 → `/phong-tro/...`. URL mới trả 200 với title đúng.

**Prompt cho Opus:**
> Đọc SEO-PLAN.md bước 5.1. Thêm URL thân thiện /phong-tro/<slug>-<id>, redirect 308 từ /listing/<id>, cập nhật sitemap, link nội bộ, canonical. Build, curl, commit "SEO: URL thân thiện có từ khóa cho tin".

### Bước 5.2 — Trang khu vực (landing page theo từ khóa)

**Mục tiêu:** Có trang riêng cho từng từ khóa địa phương: `/phong-tro-binh-thanh`, `/phong-tro-hang-xanh`, `/phong-tro-xo-viet-nghe-tinh`, `/phong-tro-bach-dang`, `/phong-tro-mai-xuan-thuong`.

**Việc cần làm:**
1. `lib/areas.ts`: mảng cấu hình `{ slug, name, keywords: string[] (chuỗi khớp trong address, không dấu), title, description, intro (200–300 chữ có từ khóa) }`.
2. Route `app/[area]/page.tsx` (hoặc `app/khu-vuc/[area]`): server component, `generateStaticParams` từ `areas`, `revalidate = 300`. Lọc tin active có `address` khớp keyword (so sánh không dấu). Render H1, intro, lưới tin (tái dùng component thẻ tin — tách `ListingCard.tsx` dùng chung từ `HomeClient`), JSON-LD `ItemList`, FAQ ngắn (3 câu hỏi: giá bao nhiêu, có gác không, gần trường nào) kèm JSON-LD `FAQPage`.
3. Thêm các trang này vào sitemap và menu/footer trang chủ (link nội bộ quan trọng).
4. Nếu khu vực không có tin → vẫn render trang với intro + link về trang chủ (không trả 404, giữ thứ hạng).

**Prompt cho Opus:**
> Đọc SEO-PLAN.md bước 5.2. Tạo lib/areas.ts và route trang khu vực với generateStaticParams, tách ListingCard dùng chung, thêm vào sitemap và footer. Build, kiểm tra 5 URL, commit "SEO: trang khu vực theo từ khóa Bình Thạnh".

### Bước 5.3 — Nội dung tin đăng chuẩn SEO (hướng dẫn cho người đăng)

Không phải code, là quy trình khi đăng tin trong `/dang-tin`:
- **Tiêu đề** 50–65 ký tự, có: loại phòng + đặc điểm nổi bật + tên đường + quận. VD: "Phòng trọ gác lửng 35m² full nội thất Xô Viết Nghệ Tĩnh, Bình Thạnh".
- **Mô tả** ≥ 300 chữ, có: diện tích, giá điện/nước/xe, tiện ích quanh (chợ, trường Hutech/UEF, Hàng Xanh), giờ giấc, cọc. Mô tả hiện chỉ 110–200 ký tự → quá ngắn.
- **Ảnh** ≥ 5, ảnh bìa sáng, ngang.
- Opus có thể thêm gợi ý/đếm ký tự trong form `app/dang-tin/page.tsx` (cảnh báo nếu tiêu đề < 40 hoặc mô tả < 300 ký tự).

### Bước 5.4 — Trang giới thiệu, liên hệ, blog nhỏ

1. `/gioi-thieu`: về Angiahouse, khu vực hoạt động, cam kết, hotline, Zalo. JSON-LD `AboutPage`.
2. `/lien-he`: hotline, Zalo link, bản đồ nhúng. JSON-LD `ContactPage`.
3. `/cam-nang` (tùy chọn, làm sau): 5–10 bài markdown như "Kinh nghiệm thuê phòng trọ Bình Thạnh", "Giá phòng trọ Bình Thạnh 2026", "Phòng trọ gần Hutech". Mỗi bài link tới trang khu vực tương ứng. Có thể dùng file `.md` trong `content/` + route `app/cam-nang/[slug]`.
4. Footer chung (component server `SiteFooter.tsx`) có link tới tất cả trang khu vực, giới thiệu, liên hệ → link nội bộ đều.

---

## GIAI ĐOẠN 6 — OFF-PAGE & THEO DÕI (làm liên tục)

### Bước 6.1 — Backlink & mạng xã hội
- Fanpage Facebook, Zalo OA, TikTok: mỗi tin mới đăng kèm link `/phong-tro/...`.
- Đăng tin lên các trang rao vặt (chotot, phongtro123, mogi…) với link về angiahouse.site trong phần liên hệ/mô tả nếu được phép.
- Nhóm Facebook "Phòng trọ Bình Thạnh", "Sinh viên Hutech/UEF tìm trọ".
- Google Maps (bước 3.3) là backlink chất lượng nhất cho từ khóa địa phương.

### Bước 6.2 — Theo dõi hàng tuần
| Việc | Công cụ |
|---|---|
| Số trang được index | Google Search Console → Pages; Bing Webmaster → Site Explorer |
| Từ khóa đang lên | GSC → Performance (lọc query chứa "bình thạnh") |
| Lỗi crawl, trang bị noindex nhầm | GSC → Pages → Not indexed |
| Core Web Vitals | GSC → Experience; PageSpeed Insights |
| Rich results | GSC → Enhancements |
| Sitemap còn đúng sau khi tin bị auto-delete | `curl sitemap.xml` so với `/api/listings` |

### Bước 6.3 — Analytics (tùy chọn)
Thêm Google Analytics 4 hoặc Vercel Analytics (`@vercel/analytics`) để biết lượng truy cập từ Google/Bing. Nếu dùng GA4: đặt script trong `app/layout.tsx` bằng `next/script` với `strategy="afterInteractive"`.

---

## THỨ TỰ THỰC HIỆN & THỜI GIAN DỰ KIẾN

| Tuần | Bước | Ghi chú |
|---|---|---|
| 1 | 1.1 → 1.5 | Nửa ngày. Deploy ngay. |
| 1–2 | 2.1 → 2.4 | Phần nặng nhất, cần test kỹ hydration. Deploy. |
| 2 | 3.1, 3.2, 3.4 | Chủ site đăng ký GSC/Bing, Opus làm IndexNow. |
| 2 | 3.3 | Google Business Profile (chờ xác minh 1–2 tuần). |
| 3 | 4.1, 4.2 | Đo PageSpeed trước/sau. |
| 3–4 | 5.1, 5.2 | URL mới + trang khu vực. Sau khi deploy, request indexing lại. |
| 4+ | 5.3, 5.4, 6.x | Nội dung và backlink làm liên tục. |

**Kỳ vọng thực tế:** Google index đầy đủ sau 1–3 tuần từ khi có sitemap + SSR. Từ khóa dài ("phòng trọ xô viết nghệ tĩnh bình thạnh") có thể lên trang 1 trong 1–2 tháng. Từ khóa ngắn ("phòng trọ bình thạnh") cạnh tranh với chotot/phongtro123, cần 3–6 tháng nội dung + backlink + Google Maps.

---

## CHECKLIST NGHIỆM THU CUỐI CÙNG

- [ ] `robots.txt` 200, có Sitemap
- [ ] `sitemap.xml` 200, đủ tin active, không có tin ẩn
- [ ] HTML thô trang chủ có H1 + ≥10 link tin
- [ ] HTML thô trang tin có title riêng, description riêng, H1, JSON-LD hợp lệ, OG image
- [ ] Trang quản trị/đăng nhập có `noindex`
- [ ] `www` redirect về apex
- [ ] GSC + Bing đã xác minh, sitemap submitted, không lỗi
- [ ] IndexNow gửi thành công khi đăng tin mới
- [ ] PageSpeed mobile ≥ 80, LCP < 2.5s, CLS < 0.1
- [ ] URL tin có slug từ khóa, link cũ redirect 308
- [ ] 5 trang khu vực live, có trong sitemap và footer
- [ ] Google Business Profile đã xác minh, có link website
