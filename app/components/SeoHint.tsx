"use client";
/* Gợi ý SEO cho form đăng/sửa tin: đếm ký tự và cảnh báo (không chặn submit)
 * khi tiêu đề/mô tả quá ngắn hoặc thiếu ảnh. Xem SEO-PLAN.md bước 5.3. */

export const SEO_TITLE_MIN = 40;
export const SEO_TITLE_MAX = 65;
export const SEO_DESC_MIN = 300;
export const SEO_IMAGES_MIN = 5;

type Level = "ok" | "warn";

function Hint({ level, children }: { level: Level; children: React.ReactNode }) {
  const color = level === "ok" ? "#2e7d32" : "#b08500";
  const bg = level === "ok" ? "#e8f5e9" : "#fff8e1";
  return (
    <p style={{ fontSize: 12, lineHeight: 1.5, color, background: bg, borderRadius: 8, padding: "6px 10px", margin: "6px 0 0" }}>
      {level === "ok" ? "✓ " : "⚠ "}{children}
    </p>
  );
}

/** Dưới ô tiêu đề: tốt nhất 40–65 ký tự, có loại phòng + đặc điểm + tên đường + quận. */
export function TitleSeoHint({ value }: { value: string }) {
  const n = value.trim().length;
  if (n === 0) return null;
  if (n < SEO_TITLE_MIN) {
    return (
      <Hint level="warn">
        Tiêu đề mới {n} ký tự — nên dài {SEO_TITLE_MIN}–{SEO_TITLE_MAX} ký tự để lên Google tốt hơn.
        Gợi ý: <i>loại phòng + điểm nổi bật + tên đường + quận</i>, VD: &quot;Phòng trọ gác lửng 35m² full nội thất Xô Viết Nghệ Tĩnh, Bình Thạnh&quot;.
      </Hint>
    );
  }
  if (n > SEO_TITLE_MAX) {
    return <Hint level="warn">Tiêu đề {n} ký tự — Google sẽ cắt bớt sau ~{SEO_TITLE_MAX} ký tự. Đưa từ khóa quan trọng (tên đường, quận) lên đầu.</Hint>;
  }
  return <Hint level="ok">Độ dài tiêu đề tốt ({n} ký tự).</Hint>;
}

/** Độ dài mô tả thực: bỏ qua các dòng nhãn có sẵn trong mẫu (vd "Giá phòng: ")
 * để mẫu chưa điền không bị tính là "đủ dài". */
function effectiveLength(value: string, template?: string): number {
  const text = value.trim();
  if (!template) return text.length;
  const labels = template.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return text.split(/\r?\n/).reduce((sum, line) => {
    const t = line.trim();
    const label = labels.find((l) => t.startsWith(l));
    return sum + (label ? t.length - label.length : t.length);
  }, 0);
}

/** Dưới ô mô tả: cần ≥ 300 ký tự với diện tích, giá điện nước, tiện ích quanh, cọc.
 * `template`: mẫu mô tả mặc định của form (các dòng nhãn không tính vào độ dài). */
export function DescriptionSeoHint({ value, template }: { value: string; template?: string }) {
  const n = effectiveLength(value, template);
  if (n < SEO_DESC_MIN) {
    return (
      <Hint level="warn">
        Mô tả mới {n}/{SEO_DESC_MIN} ký tự. Mô tả càng đầy đủ Google càng ưu tiên: diện tích, giá điện/nước/xe,
        tiện ích quanh (chợ, trường Hutech/UEF, Hàng Xanh...), giờ giấc, tiền cọc.
      </Hint>
    );
  }
  return <Hint level="ok">Mô tả đủ dài ({n} ký tự).</Hint>;
}

/** Cạnh ô ảnh: nên ≥ 5 ảnh, ảnh bìa sáng và nằm ngang. */
export function ImagesSeoHint({ count }: { count: number }) {
  if (count === 0) return null;
  if (count < SEO_IMAGES_MIN) {
    return <Hint level="warn">Mới {count} ảnh — nên có ít nhất {SEO_IMAGES_MIN} ảnh, ảnh bìa sáng, chụp ngang để tin nổi bật hơn.</Hint>;
  }
  return <Hint level="ok">Đủ ảnh ({count}).</Hint>;
}
