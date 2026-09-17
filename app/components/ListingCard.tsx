"use client";
/* Thẻ tin dùng chung cho trang chủ (HomeClient) và trang khu vực.
 * Chỉ chứa phần "tĩnh" của thẻ: ảnh + link + nội dung. Các nút tương tác
 * (sao, ⚙️ sửa/xóa) do nơi dùng truyền vào qua imageOverlay / extra. */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatPrice, formatDateVN, type ListingDoc } from "../../lib/listing-utils";
import { cld, listingAlt } from "../../lib/image";
import { listingPath } from "../../lib/slug";

const GREEN = "#006633";

export function getAvailabilityInfo(availableDate: string | null | undefined) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  if (!availableDate) return { label: "Có thể dọn vào ngay", type: "now", btnBg: GREEN, labelColor: GREEN };
  const avail = new Date(availableDate);
  const diffDays = Math.ceil((avail.getTime() - now.getTime()) / 86400000);
  if (diffDays < 2) return { label: "Có thể dọn vào ngay", type: "now", btnBg: GREEN, labelColor: GREEN };
  if (diffDays < 30) return { label: `Trống từ ${formatDateVN(avail)}`, type: "soon", btnBg: "#FFD8A8", labelColor: "#b08500" };
  return { label: `Trống từ ${formatDateVN(avail)}`, type: "late", btnBg: "#a0a0a0", labelColor: "#666" };
}

/* ─── Skeleton card ── */
export function SkeletonCard() {
  return (
    <div style={{ borderRadius: 14, background: "#fff", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
      <div style={{ width: "100%", paddingBottom: "72%", background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
      <div style={{ padding: "14px 14px 12px" }}>
        <div style={{ height: 16, background: "#f0f0f0", borderRadius: 6, marginBottom: 8, width: "80%", animation: "shimmer 1.4s infinite" }} />
        <div style={{ height: 12, background: "#f0f0f0", borderRadius: 6, marginBottom: 10, width: "60%", animation: "shimmer 1.4s infinite" }} />
        <div style={{ height: 20, background: "#f0f0f0", borderRadius: 6, width: "40%", animation: "shimmer 1.4s infinite" }} />
      </div>
    </div>
  );
}

/* ─── Lazy image with skeleton ── */
function LazyImage({ src, alt, isFirst }: { src: string; alt: string; isFirst: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // Ảnh trong HTML server có thể tải xong trước khi hydrate → onLoad không chạy.
  useEffect(() => { if (ref.current?.complete) setLoaded(true); }, []);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {!loaded && (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
      )}
      <img
        ref={ref}
        src={src ? cld(src, { w: 600 }) : "/no-image.jpg"}
        srcSet={src ? `${cld(src, { w: 400 })} 400w, ${cld(src, { w: 600 })} 600w, ${cld(src, { w: 800 })} 800w` : undefined}
        sizes="(max-width: 640px) 100vw, 400px"
        width={600}
        height={432}
        alt={alt}
        loading={isFirst ? "eager" : "lazy"}
        decoding={isFirst ? "sync" : "async"}
        fetchPriority={isFirst ? "high" : "low"}
        onLoad={() => setLoaded(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: loaded ? 1 : 0, transition: "opacity 0.3s" }}
      />
    </div>
  );
}

export interface ListingCardProps {
  item: ListingDoc;
  /** 2 thẻ đầu: ảnh eager + fetchPriority high (LCP). */
  isFirst?: boolean;
  /** Đang hover (do nơi dùng quản lý để tránh state cho từng thẻ khi chưa cần). */
  hovered?: boolean;
  /** Bật transition CSS (trang chủ chỉ bật sau khi render đầu xong). */
  animate?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  /** Phần tử đặt đè lên khung ảnh (vd: nút ⚙️ sửa/xóa). */
  imageOverlay?: React.ReactNode;
  /** Phần tử đặt ở cuối thẻ, ngoài link (vd: nút sao). */
  extra?: React.ReactNode;
}

export default function ListingCard({
  item, isFirst = false, hovered = false, animate = true, onMouseEnter, onMouseLeave, imageOverlay, extra,
}: ListingCardProps) {
  const href = listingPath(item);
  const avail = getAvailabilityInfo(item.availableDate);
  const highlights = Array.isArray(item.highlights) ? item.highlights : [];

  return (
    <div
      style={{
        position: "relative", borderRadius: 14, background: "#fff",
        boxShadow: hovered ? "0 8px 28px rgba(0,0,0,0.18)" : "0 2px 10px rgba(0,0,0,0.09)",
        ...(animate ? { transition: "transform 0.2s, box-shadow 0.2s" } : {}),
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        overflow: "hidden",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Image */}
      <div style={{ position: "relative", width: "100%", paddingBottom: "72%", overflow: "hidden" }}>
        <Link href={href} style={{ display: "block", position: "absolute", inset: 0 }}>
          <LazyImage src={item.coverImage || ""} alt={listingAlt(item.title, item.address)} isFirst={isFirst} />
          {item.status === "hide" && (
            <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 11, padding: "4px 8px", borderRadius: 5, fontWeight: 600 }}>ĐÃ ẨN</div>
          )}
        </Link>
        {imageOverlay}
      </div>

      {/* Card content — hiển thị ngay, không đợi ảnh */}
      <Link href={href} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
        <div style={{ padding: "14px 14px 10px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.title}
          </h3>
          <p style={{ fontSize: 13, color: "#666", margin: "0 0 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            📍 {item.address || "TPHCM"}
          </p>
          {highlights.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
              {highlights.slice(0, 3).map((h: string) => (
                <span key={h} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 12, background: "#e8f5e9", color: "#2e7d32", fontWeight: 500 }}>✓ {h}</span>
              ))}
            </div>
          )}
          <div style={{ marginBottom: 2 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: "#111" }}>{formatPrice(item.price)} đ</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>/tháng</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: avail.labelColor, opacity: avail.type === "late" ? 0.5 : 1 }}>{avail.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 12, whiteSpace: "nowrap", background: avail.btnBg, color: "#fff", cursor: "pointer" }}>Chi tiết ➜</span>
          </div>
        </div>
      </Link>

      {extra}
    </div>
  );
}
