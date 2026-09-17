/* Cấu hình trang khu vực (landing page theo từ khóa địa phương): /phong-tro-<slug>.
 * Hàm thuần, dùng chung server + client. Tin được lọc theo địa chỉ/tiêu đề
 * chứa keyword (so khớp không dấu, xem matchArea). */
import { unaccent } from "./slug";
import type { ListingDoc } from "./listing-utils";

export interface Area {
  /** Phần sau "phong-tro-" trong URL, vd "binh-thanh" → /phong-tro-binh-thanh */
  slug: string;
  /** Tên hiển thị: "Bình Thạnh" */
  name: string;
  /** Chuỗi không dấu khớp trong address hoặc title của tin */
  keywords: string[];
  title: string;
  description: string;
  /** Đoạn giới thiệu 200–300 chữ, mỗi phần tử là 1 <p> */
  intro: string[];
  /** Trường học/địa điểm gần — dùng cho FAQ "gần trường nào" */
  nearby: string[];
}

export const AREA_PREFIX = "phong-tro-";

export const AREAS: Area[] = [
  {
    slug: "binh-thanh",
    name: "Bình Thạnh",
    keywords: ["binh thanh", "q. bt", "q.bt", "hang xanh", "bach dang", "xo viet nghe tinh", "mai xuan thuong", "dang thuy tram", "nguyen van dau", "le quang dinh"],
    title: "Phòng trọ Bình Thạnh giá rẻ, full nội thất, không chung chủ",
    description: "Cho thuê phòng trọ quận Bình Thạnh, TPHCM: Hàng Xanh, Bạch Đằng, Xô Viết Nghệ Tĩnh, Mai Xuân Thưởng, Đặng Thùy Trâm. Full nội thất, có gác, giờ giấc tự do, giá từ 2,9 triệu.",
    intro: [
      "Bình Thạnh là quận cửa ngõ phía Đông Sài Gòn, chỉ cách quận 1 một cây cầu, nên phòng trọ Bình Thạnh luôn là lựa chọn hàng đầu của sinh viên và người đi làm. Angiahouse quản lý trực tiếp nhiều dãy phòng tại các tuyến đường trung tâm quận: Bạch Đằng và Xô Viết Nghệ Tĩnh (khu Hàng Xanh), Mai Xuân Thưởng, Nguyễn Văn Đậu, Lê Quang Định, Đặng Thùy Trâm (phường 13, sát Đại học Văn Lang cơ sở 3).",
      "Phòng trọ tại đây đa số là phòng mới xây hoặc mới sửa, full nội thất: máy lạnh, tủ lạnh, giường, tủ quần áo, kệ bếp, WC riêng. Nhiều phòng có gác lửng rộng 25–35m², cửa sổ thoáng, ban công. Tất cả đều không chung chủ, giờ giấc tự do, có chỗ để xe máy và camera an ninh. Điện nước tính theo giá quy định, không phát sinh phí lạ.",
      "Giá thuê phòng trọ Bình Thạnh của Angiahouse dao động từ 2,9 đến 6,5 triệu đồng/tháng tùy diện tích và vị trí — rẻ hơn mặt bằng chung khu vực nhờ chủ nhà cho thuê trực tiếp, không qua trung gian. Từ phòng đi 5–10 phút tới Hutech, UEF, Văn Lang, Đại học Giao thông vận tải, bến xe Miền Đông cũ, chợ Bà Chiểu và Landmark 81. Gọi hotline để được dẫn xem phòng trong ngày.",
    ],
    nearby: ["Hutech (cơ sở Điện Biên Phủ, Ung Văn Khiêm)", "UEF", "Đại học Văn Lang cơ sở 3", "Đại học Giao thông vận tải", "Đại học Ngoại thương cơ sở 2"],
  },
  {
    slug: "hang-xanh",
    name: "Hàng Xanh",
    keywords: ["hang xanh", "bach dang", "xo viet nghe tinh", "dien bien phu"],
    title: "Phòng trọ Hàng Xanh Bình Thạnh – gần Hutech, UEF, full nội thất",
    description: "Phòng trọ khu Hàng Xanh (Bạch Đằng, Xô Viết Nghệ Tĩnh, Điện Biên Phủ) Bình Thạnh. Full nội thất, có gác, giường tầng, không chung chủ. Giá từ 4,5 triệu, gần Hutech, UEF.",
    intro: [
      "Ngã tư Hàng Xanh là nút giao thông lớn nhất Bình Thạnh, nơi gặp nhau của Điện Biên Phủ, Xô Viết Nghệ Tĩnh, Bạch Đằng và Nguyễn Xí. Thuê phòng trọ Hàng Xanh nghĩa là bạn ở ngay trung tâm: 5 phút xe máy tới quận 1, 3 phút tới Hutech và UEF, đi bộ tới siêu thị Coopmart, chợ Thị Nghè và rất nhiều quán ăn đêm.",
      "Angiahouse có các dãy phòng tại hẻm Bạch Đằng và Xô Viết Nghệ Tĩnh, hẻm xe hơi, an ninh tốt. Phòng full nội thất với máy lạnh, tủ lạnh, giường (có loại giường tầng phù hợp ở ghép 2–3 người), tủ quần áo, kệ bếp và WC riêng. Một số phòng có gác rộng tới 35m², phù hợp gia đình nhỏ hoặc nhóm bạn.",
      "Giá thuê phòng trọ Hàng Xanh của Angiahouse từ 4,5 đến 5,7 triệu/tháng, đã bao gồm nội thất. Không chung chủ, giờ giấc tự do, wifi riêng từng phòng, chỗ để xe trong nhà. Xem danh sách phòng đang trống bên dưới hoặc gọi hotline để được dẫn xem trực tiếp.",
    ],
    nearby: ["Hutech cơ sở Điện Biên Phủ", "UEF", "Đại học Ngoại thương cơ sở 2", "Coopmart Xô Viết Nghệ Tĩnh"],
  },
  {
    slug: "xo-viet-nghe-tinh",
    name: "Xô Viết Nghệ Tĩnh",
    keywords: ["xo viet nghe tinh", "xvnt"],
    title: "Phòng trọ Xô Viết Nghệ Tĩnh Bình Thạnh có gác, full nội thất",
    description: "Cho thuê phòng trọ đường Xô Viết Nghệ Tĩnh, Bình Thạnh: phòng gác rộng 35m², full nội thất, không chung chủ, gần Hàng Xanh, Hutech, UEF. Giá từ 5,7 triệu/tháng.",
    intro: [
      "Xô Viết Nghệ Tĩnh là trục đường chính nối Hàng Xanh với bến xe Miền Đông cũ và quốc lộ 13, tập trung đông sinh viên Hutech, UEF, Giao thông vận tải và người đi làm ở quận 1, Bình Thạnh, Thủ Đức. Phòng trọ Xô Viết Nghệ Tĩnh vì thế luôn được tìm kiếm nhiều nhưng cũng nhanh hết phòng.",
      "Angiahouse cho thuê phòng tại hẻm 86 Xô Viết Nghệ Tĩnh — hẻm rộng, xe hơi vào được, cách mặt tiền vài chục mét nên yên tĩnh mà vẫn tiện đi lại. Phòng có gác lửng rộng 35m², trần cao, cửa sổ thoáng, full nội thất: máy lạnh, tủ lạnh, giường nệm, tủ quần áo, kệ bếp, WC riêng. Không chung chủ, ra vào bằng khóa vân tay, giờ giấc tự do.",
      "Giá thuê từ 5,7 triệu/tháng cho phòng gác 35m², ở được 2–4 người nên chia ra rất rẻ. Điện nước theo giá quy định, wifi và chỗ để xe máy miễn phí. Xem chi tiết từng phòng bên dưới hoặc gọi hotline để đặt lịch xem phòng.",
    ],
    nearby: ["Hutech", "UEF", "Đại học Giao thông vận tải", "Bến xe Miền Đông cũ"],
  },
  {
    slug: "bach-dang",
    name: "Bạch Đằng",
    keywords: ["bach dang"],
    title: "Phòng trọ Bạch Đằng Bình Thạnh – giường tầng, full nội thất, gần Hàng Xanh",
    description: "Cho thuê phòng trọ đường Bạch Đằng, phường 24, Bình Thạnh: full nội thất, giường tầng ở ghép, WC riêng, không chung chủ. Giá 4,5 triệu/tháng, cách Hàng Xanh 300m.",
    intro: [
      "Đường Bạch Đằng chạy song song với Xô Viết Nghệ Tĩnh, nối từ ngã tư Hàng Xanh tới đường Đinh Bộ Lĩnh và bến xe Miền Đông cũ. Ở phòng trọ Bạch Đằng bạn có thể đi bộ ra Hàng Xanh, tới Hutech, UEF trong 5 phút và tới quận 1 chỉ 10 phút xe máy.",
      "Dãy phòng Angiahouse tại hẻm 88 Bạch Đằng là nhà mới sửa, full nội thất: máy lạnh, tủ lạnh, giường tầng (phù hợp 2–3 bạn sinh viên ở ghép để chia tiền phòng), tủ quần áo, kệ bếp, WC riêng trong phòng. Không chung chủ, khóa cửa riêng, camera an ninh và chỗ để xe máy trong nhà.",
      "Giá thuê phòng trọ Bạch Đằng khoảng 4,5 triệu/tháng, đã có nội thất — chia cho 2–3 người chỉ còn 1,5–2,2 triệu/người, rất phù hợp sinh viên. Xung quanh có chợ Thị Nghè, Coopmart, nhiều quán cơm sinh viên. Gọi hotline để xem phòng ngay hôm nay.",
    ],
    nearby: ["Hutech", "UEF", "Đại học Ngoại thương cơ sở 2", "Chợ Thị Nghè"],
  },
  {
    slug: "mai-xuan-thuong",
    name: "Mai Xuân Thưởng",
    keywords: ["mai xuan thuong"],
    title: "Phòng trọ Mai Xuân Thưởng Bình Thạnh giá rẻ, full nội thất",
    description: "Cho thuê phòng trọ Mai Xuân Thưởng, khu Văn Thánh, Bình Thạnh: giá rẻ từ 3,9 triệu, full nội thất, không chung chủ, gần Hutech Ung Văn Khiêm, chợ Văn Thánh, Landmark 81.",
    intro: [
      "Mai Xuân Thưởng là con đường nhỏ yên tĩnh nằm giữa Ung Văn Khiêm và Xô Viết Nghệ Tĩnh, khu Văn Thánh, Bình Thạnh. Khu vực này gần cơ sở Ung Văn Khiêm của Hutech, gần chợ Văn Thánh, công viên Văn Thánh và Landmark 81, nhưng giá phòng trọ Mai Xuân Thưởng lại rẻ hơn hẳn mặt tiền Xô Viết Nghệ Tĩnh hay Điện Biên Phủ.",
      "Angiahouse có dãy phòng tại 24 Mai Xuân Thưởng, phòng mới, sạch sẽ, full nội thất: máy lạnh, tủ lạnh, giường, tủ quần áo, kệ bếp, WC riêng. Không chung chủ, giờ giấc tự do, có chỗ để xe máy và camera. Phù hợp sinh viên Hutech, người đi làm ở Bình Thạnh, quận 1, Thủ Đức.",
      "Giá thuê từ 3,9 triệu/tháng — một trong những mức giá tốt nhất Bình Thạnh cho phòng full nội thất, không chung chủ. Xem các phòng đang trống bên dưới, hoặc gọi hotline để được dẫn xem phòng trực tiếp.",
    ],
    nearby: ["Hutech cơ sở Ung Văn Khiêm", "Chợ Văn Thánh", "Landmark 81", "Đại học Giao thông vận tải"],
  },
  {
    slug: "dang-thuy-tram",
    name: "Đặng Thùy Trâm",
    keywords: ["dang thuy tram"],
    title: "Phòng trọ Đặng Thùy Trâm Bình Thạnh gần Văn Lang, full nội thất",
    description: "Cho thuê phòng trọ Đặng Thùy Trâm, phường 13, Bình Thạnh: sát Đại học Văn Lang cơ sở 3, phòng duplex, cửa sổ, full nội thất, không chung chủ. Giá từ 2,9 triệu/tháng.",
    intro: [
      "Đặng Thùy Trâm thuộc phường 13, Bình Thạnh, giáp Gò Vấp — khu vực nổi tiếng với sinh viên Đại học Văn Lang cơ sở 3 (đường Đặng Thùy Trâm) và Đại học Công nghệ Sài Gòn. Phòng trọ Đặng Thùy Trâm luôn được sinh viên Văn Lang săn tìm vì đi bộ tới trường chỉ vài phút.",
      "Angiahouse có nhiều loại phòng tại hẻm 160 và số 81 Đặng Thùy Trâm: phòng 1 người, phòng 1 phòng ngủ tách bếp, duplex có gác, phòng cửa sổ trời. Tất cả đều full nội thất — máy lạnh, tủ lạnh, giường, tủ quần áo, kệ bếp, WC riêng — không chung chủ, giờ giấc tự do, có chỗ để xe và camera an ninh.",
      "Giá thuê phòng trọ Đặng Thùy Trâm của Angiahouse từ 2,9 triệu (phòng 1 người, rẻ nhất khu vực) tới 6 triệu (phòng rộng, duplex). Điện nước giá dân, wifi miễn phí. Xem danh sách bên dưới hoặc gọi hotline để xem phòng trong ngày.",
    ],
    nearby: ["Đại học Văn Lang cơ sở 3", "Đại học Công nghệ Sài Gòn", "Emart Gò Vấp", "Chợ Bình Hòa"],
  },
  {
    slug: "phu-nhuan",
    name: "Phú Nhuận",
    keywords: ["phu nhuan"],
    title: "Phòng trọ Phú Nhuận mới xây, full nội thất, không chung chủ",
    description: "Cho thuê phòng trọ quận Phú Nhuận, TPHCM: Lê Tự Tài, Lam Sơn. Phòng mới xây, ban công, gác lửng, full nội thất, không chung chủ. Giá từ 4 triệu/tháng, cách sân bay 10 phút.",
    intro: [
      "Phú Nhuận là quận trung tâm nằm giữa quận 1, quận 3, Bình Thạnh, Tân Bình và Gò Vấp, đi đâu cũng gần: 10 phút tới sân bay Tân Sơn Nhất, 10 phút tới quận 1. Phòng trọ Phú Nhuận phù hợp người đi làm văn phòng, tiếp viên hàng không và sinh viên các trường quanh quận 3, Bình Thạnh.",
      "Angiahouse có dãy phòng mới xây tại 72 Lê Tự Tài (phường 4) với 3 loại phòng: phòng trong yên tĩnh, phòng ban công thoáng mát và phòng lửng có gác. Phòng full nội thất: máy lạnh, tủ lạnh, giường, tủ quần áo, kệ bếp, WC riêng; nhà có camera, chỗ để xe. Không chung chủ, giờ giấc tự do.",
      "Giá thuê phòng trọ Phú Nhuận của Angiahouse từ 4 đến 6,3 triệu/tháng tùy loại phòng — rẻ hơn mặt bằng chung của quận trung tâm nhờ chủ nhà cho thuê trực tiếp. Xem các phòng đang trống bên dưới hoặc gọi hotline để đặt lịch xem phòng.",
    ],
    nearby: ["Sân bay Tân Sơn Nhất", "Đại học Sư phạm TPHCM", "Chợ Phú Nhuận", "Coopmart Nguyễn Kiệm"],
  },
];

export function areaPath(area: Pick<Area, "slug">): string {
  return `/${AREA_PREFIX}${area.slug}`;
}

/** Tìm khu vực theo segment URL (vd "phong-tro-binh-thanh"). */
export function findArea(segment: string): Area | undefined {
  if (!segment.startsWith(AREA_PREFIX)) return undefined;
  const slug = segment.slice(AREA_PREFIX.length);
  return AREAS.find((a) => a.slug === slug);
}

/** Tin thuộc khu vực nếu address hoặc title (không dấu) chứa 1 keyword. */
export function matchArea(area: Area, listing: Pick<ListingDoc, "address" | "title">): boolean {
  const hay = unaccent(`${listing.address || ""} ${listing.title || ""}`);
  return area.keywords.some((k) => hay.includes(k));
}

export function filterByArea(area: Area, listings: ListingDoc[]): ListingDoc[] {
  return listings.filter((l) => matchArea(area, l));
}
