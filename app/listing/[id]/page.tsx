"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* ─── helpers ──────────────────────────────────── */
function getAvailabilityInfo(availableDate: string | null | undefined) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  if (!availableDate) return { label: "Có thể dọn vào ngay", type: "now", color: "#006633", bg: "#e8f5e9" };
  const avail = new Date(availableDate);
  const diff = Math.ceil((avail.getTime() - now.getTime()) / 86400000);
  if (diff < 2) return { label: "Có thể dọn vào ngay", type: "now", color: "#006633", bg: "#e8f5e9" };
  if (diff < 30) return { label: `Trống từ ${avail.toLocaleDateString("vi-VN")}`, type: "soon", color: "#b08500", bg: "#fff8e1" };
  return { label: `Trống từ ${avail.toLocaleDateString("vi-VN")}`, type: "late", color: "#888", bg: "#f5f5f5" };
}

function useVoucherCountdown(days = 3) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    const end = Date.now() + days * 76400000;
    const tick = () => {
      const diff = end - Date.now();
      if (diff <= 0) { setRemaining("Đã hết hạn"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${d} ngày ${h} giờ ${m} phút ${s} giây`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [days]);
  return remaining;
}

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= value ? "#FFB800" : "#DDD"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

function SimilarCard({ item }: { item: any }) {
  const [hov, setHov] = useState(false);
  return (
    <Link href={`/listing/${item._id}`} style={{ textDecoration: "none" }}>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ borderRadius: "12px", overflow: "hidden", background: "#fff",
          boxShadow: hov ? "0 8px 24px rgba(0,0,0,0.14)" : "0 2px 10px rgba(0,0,0,0.08)",
          transform: hov ? "translateY(-4px)" : "none", transition: "all 0.2s" }}>
        <div style={{ paddingBottom: "66%", position: "relative", overflow: "hidden" }}>
          <img src={item.coverImage || "/no-image.jpg"} alt={item.title}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
              transform: hov ? "scale(1.04)" : "scale(1)", transition: "transform 0.3s" }} />
        </div>
        <div style={{ padding: "12px" }}>
          <div style={{ fontWeight: 700, fontSize: "14px", color: "#111", overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "4px" }}>{item.title}</div>
          <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px", overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📍 {item.address || "TPHCM"}</div>
          <div style={{ fontWeight: 800, fontSize: "16px", color: "#006633" }}>
            {item.price?.toLocaleString()} đ<span style={{ fontSize: "12px", fontWeight: 400, color: "#888" }}>/tháng</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* Extract YouTube / TikTok embeds from description text */
function parseDescriptionWithMedia(text: string) {
  const ytRegex = /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
  const ttRegex = /https?:\/\/(?:www\.)?tiktok\.com\/[^\s]*/g;

  const parts: { type: "text" | "youtube" | "tiktok"; content: string }[] = [];
  let remaining = text;

  // Replace YouTube
  remaining = remaining.replace(ytRegex, (match, videoId) => {
    parts.push({ type: "youtube", content: videoId });
    return `\x00YT:${videoId}\x00`;
  });
  // Replace TikTok
  remaining = remaining.replace(ttRegex, (match) => {
    parts.push({ type: "tiktok", content: match });
    return `\x00TT:${match}\x00`;
  });

  const segments = remaining.split(/\x00/);
  const result: { type: "text" | "youtube" | "tiktok"; content: string }[] = [];
  for (const seg of segments) {
    if (seg.startsWith("YT:")) result.push({ type: "youtube", content: seg.slice(3) });
    else if (seg.startsWith("TT:")) result.push({ type: "tiktok", content: seg.slice(3) });
    else if (seg.trim()) result.push({ type: "text", content: seg });
  }
  return result;
}

const DUMMY_REVIEWS_COUNT = 3;
const DUMMY_AVG = 4.7;

/* ════════════════════════════════════════════════ */
export default function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [mapExpanded, setMapExpanded] = useState(false);
  const router = useRouter();
  const voucherTimer = useVoucherCountdown(3);

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        fetch("/api/listings")
          .then(r => r.json())
          .then((all: any[]) => {
            if (!Array.isArray(all)) return;
            const others = all.filter(i => i._id !== d._id && i.status !== "hide");
            others.sort((a, b) => Math.abs(a.price - d.price) - Math.abs(b.price - d.price));
            setSimilar(others.slice(0, 4));
          }).catch(() => {});
      })
      .catch(() => alert("Không thể tải thông tin!"));
  }, [id]);

  if (!data) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
      <div style={{ width: 40, height: 40, border: "4px solid #f3f3f3", borderTop: "4px solid #006633", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const allImages = [data.coverImage, ...(data.images || [])].filter(Boolean);
  const avail = getAvailabilityInfo(data.availableDate);
  const highlights: string[] = (data.highlights || []).slice(0, 3);
  const furniture: { icon: string; label: string }[] = data.furniture || [];

  const prevImg = () => setGalleryIdx(i => (i - 1 + allImages.length) % allImages.length);
  const nextImg = () => setGalleryIdx(i => (i + 1) % allImages.length);

  const mapsQuery = encodeURIComponent(data.address || "Ho Chi Minh City");
  const mapsEmbedUrl = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  const GREEN = "#006633";
  const RED = "#FF385C";

  const descSegments = parseDescriptionWithMedia(data.description || "");

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f7", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>

      {/* ── Gallery Modal ── */}
      {showGallery && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 2000,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowGallery(false)}>
          <button onClick={() => setShowGallery(false)}
            style={{ position: "absolute", top: 16, right: 20, background: "none", border: "none", color: "#fff", fontSize: 32, cursor: "pointer" }}>×</button>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>{galleryIdx + 1} / {allImages.length}</div>
          <img src={allImages[galleryIdx]} alt="" style={{ maxHeight: "80vh", maxWidth: "90vw", objectFit: "contain", borderRadius: 8 }} onClick={e => e.stopPropagation()} />
          {allImages.length > 1 && (<>
            <button onClick={e => { e.stopPropagation(); prevImg(); }}
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }}>‹</button>
            <button onClick={e => { e.stopPropagation(); nextImg(); }}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }}>›</button>
          </>)}
          <div style={{ display: "flex", gap: 8, marginTop: 16, overflowX: "auto", maxWidth: "90vw", padding: "4px 0" }}>
            {allImages.map((img: string, i: number) => (
              <img key={i} src={img} onClick={e => { e.stopPropagation(); setGalleryIdx(i); }}
                style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 6, cursor: "pointer",
                  opacity: i === galleryIdx ? 1 : 0.5, border: i === galleryIdx ? "2px solid #fff" : "2px solid transparent", flexShrink: 0 }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header style={{ borderBottom: "1px solid #004d26", position: "sticky", top: 0, background: GREEN, zIndex: 100, boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => router.back()}
              style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: 36, height: 36, borderRadius: "50%", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
              <img src="https://res.cloudinary.com/df717ylr1/image/upload/v1777485110/logo_an_gia_house_c600o8.png" alt="Angiahouse" style={{ height: 30, width: "auto" }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>ANGIAHOUSE</span>
            </Link>
          </div>
          <a href="tel:0902225314" style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14, background: "rgba(255,255,255,0.12)", padding: "7px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.3)" }}>
            📞 090.222.5314
          </a>
        </div>
      </header>

      {/* ── Body ── */}
      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "16px 16px 80px" }}>

        {/* TITLE BAR */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", marginBottom: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
          <h1 style={{ fontSize: "clamp(17px,3vw,23px)", fontWeight: 800, color: "#111", margin: "0 0 8px" }}>{data.title}</h1>
          {/* Address row - truncated */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap", overflow: "hidden" }}>
            <span style={{ fontSize: 13, color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
              📍 {data.address || "TPHCM"}
            </span>
            <a href={mapsSearchUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: GREEN, textDecoration: "underline", whiteSpace: "nowrap", flexShrink: 0 }}>
              Xem bản đồ ↗
            </a>
          </div>

          {/* Price + availability */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: "clamp(22px,4vw,28px)", fontWeight: 900, color: GREEN, lineHeight: 1 }}>
              {data.price?.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 500, color: "#777" }}>đ/tháng</span>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: avail.bg, color: avail.color, fontSize: 12, fontWeight: 700 }}>
              {avail.type === "now" ? "🟢" : avail.type === "soon" ? "🟡" : "⚪"} {avail.label}
            </div>
          </div>
        </div>

        {/* VOUCHER - compact on mobile */}
        <div style={{ background: "linear-gradient(135deg,#FF6B35,#FF385C)", borderRadius: 12, padding: "12px 16px", marginBottom: 12, boxShadow: "0 4px 16px rgba(255,56,92,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 22 }}>🎁</span>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>Voucher giảm giá 100.000đ/tháng. Áp dụng 3 tháng đầu.</div>
              <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 12, marginTop: 2 }}>
                Hết hạn: <span style={{ color: "#FFD966", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{voucherTimer}</span>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          <div>

            {/* GALLERY */}
            <div style={{ borderRadius: 14, overflow: "hidden", marginBottom: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
              <div style={{ display: "grid", gridTemplateColumns: allImages.length > 1 ? "1fr 1fr" : "1fr", gap: 3, background: "#000", maxHeight: 420 }}>
                <div style={{ gridRow: allImages.length > 2 ? "1/3" : "auto", position: "relative", cursor: "pointer", overflow: "hidden" }}
                  onClick={() => { setGalleryIdx(0); setShowGallery(true); }}>
                  <img src={allImages[0]} alt={data.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", minHeight: 200, transition: "transform 0.3s" }}
                    onMouseOver={e => (e.currentTarget.style.transform = "scale(1.03)")}
                    onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")} />
                </div>
                {allImages.slice(1, 5).map((img: string, i: number) => (
                  <div key={i} style={{ position: "relative", cursor: "pointer", overflow: "hidden", height: allImages.length > 2 ? 110 : 200 }}
                    onClick={() => { setGalleryIdx(i + 1); setShowGallery(true); }}>
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
                      onMouseOver={e => (e.currentTarget.style.transform = "scale(1.05)")}
                      onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")} />
                    {i === 3 && allImages.length > 5 && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 700 }}>+{allImages.length - 5} ảnh</div>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setShowGallery(true)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "9px", background: "#f5f5f5", border: "none", borderTop: "1px solid #eee", fontSize: 13, fontWeight: 600, color: "#333", cursor: "pointer" }}>
                🖼️ Xem tất cả {allImages.length} ảnh
              </button>
            </div>

            {/* HIGHLIGHTS - compact */}
            {highlights.length > 0 && (
              <div style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: "0 0 10px" }}>⭐ Đặc điểm nổi bật</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {highlights.map((h, i) => (
                    <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 20, background: "#f0faf4", border: "1px solid #c8e6c9", fontSize: 13, fontWeight: 600, color: GREEN }}>
                      ✓ {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* DESCRIPTION */}
            <div style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: "0 0 12px" }}>📝 Mô tả chi tiết</h2>
              {descSegments.length > 0 ? descSegments.map((seg, i) => {
                if (seg.type === "youtube") return (
                  <div key={i} style={{ position: "relative", paddingBottom: "56.25%", marginBottom: 14, borderRadius: 10, overflow: "hidden" }}>
                    <iframe src={`https://www.youtube.com/embed/${seg.content}`} title="YouTube" allowFullScreen
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} />
                  </div>
                );
                if (seg.type === "tiktok") return (
                  <div key={i} style={{ marginBottom: 14, padding: "10px 14px", background: "#f5f5f5", borderRadius: 10, fontSize: 13, color: "#555" }}>
                    🎵 TikTok: <a href={seg.content} target="_blank" rel="noopener noreferrer" style={{ color: GREEN, wordBreak: "break-all" }}>{seg.content}</a>
                  </div>
                );
                return <p key={i} style={{ fontSize: 15, lineHeight: 1.7, color: "#333", whiteSpace: "pre-wrap", margin: "0 0 8px" }}>{seg.content}</p>;
              }) : (
                <p style={{ fontSize: 15, color: "#888" }}>Chưa có mô tả chi tiết.</p>
              )}
            </div>

            {/* FURNITURE - compact grid */}
            {furniture.length > 0 && (
              <div style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: "0 0 10px" }}>🛋️ Nội thất & tiện nghi</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {furniture.map((f: any, i: number) => (
                    <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, background: "#fafafa", border: "1px solid #e0e0e0", fontSize: 13, color: "#333", fontWeight: 500 }}>
                      <span style={{ fontSize: 15 }}>{f.icon}</span> {f.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* GOOGLE MAP */}
            <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <div style={{ padding: "14px 18px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: 0 }}>📍 Vị trí trên bản đồ</h2>
                <a href={mapsSearchUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: GREEN, fontWeight: 600, textDecoration: "none" }}>Mở Google Maps ↗</a>
              </div>
              <div style={{ padding: "10px 18px 16px" }}>
                <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #ddd", height: mapExpanded ? 380 : 200, transition: "height 0.3s", position: "relative" }}>
                  <iframe src={mapsEmbedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Google Maps" />
                  <a href={mapsSearchUrl} target="_blank" rel="noopener noreferrer" style={{ position: "absolute", inset: 0, display: "block" }} title="Mở Google Maps" />
                </div>
                <button onClick={() => setMapExpanded(e => !e)} style={{ marginTop: 6, background: "none", border: "none", color: GREEN, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>
                  {mapExpanded ? "Thu nhỏ ▲" : "Phóng to ▼"}
                </button>
              </div>
            </div>

            {/* RATINGS - collapsed, click to expand */}
            <div style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: 0 }}>⭐ Đánh giá</h2>
                  <Stars value={Math.round(DUMMY_AVG)} size={16} />
                  <span style={{ fontWeight: 800, fontSize: 16, color: "#111" }}>{DUMMY_AVG.toFixed(1)}</span>
                  <span style={{ fontSize: 13, color: "#777" }}>({DUMMY_REVIEWS_COUNT} đánh giá)</span>
                </div>
                <span style={{ fontSize: 12, color: GREEN, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
                  Xem đánh giá →
                </span>
              </div>
            </div>

          </div>{/* end LEFT */}

          {/* SIDEBAR */}
          <div className="sidebar">
            <div className="sticky-card" style={{ background: "#fff", borderRadius: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", overflow: "hidden" }}>
              {/* Price */}
              <div style={{ background: GREEN, padding: "14px 18px" }}>
                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>Giá thuê hàng tháng</div>
                <div style={{ color: "#fff", fontSize: 24, fontWeight: 900, display: "flex", alignItems: "baseline", gap: 4, flexWrap: "nowrap" }}>
                  <span>{data.price?.toLocaleString()} đ</span>
                  <span style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap" }}>/tháng</span>
                </div>
                <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, color: "#fff" }}>
                  {avail.type === "now" ? "🟢" : "🟡"} {avail.label}
                </div>
              </div>

              <div style={{ padding: "14px 18px" }}>
                {/* Voucher mini */}
                <div style={{ background: "#fff5f5", border: "1px dashed #FF385C", borderRadius: 10, padding: "8px 12px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🎁</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12, color: "#cc2200" }}>Giảm 100K/tháng × 3 tháng</div>
                    <div style={{ fontSize: 11, color: "#999", fontVariantNumeric: "tabular-nums" }}>Còn: {voucherTimer}</div>
                  </div>
                </div>

                {/* CTA */}
                <a href="tel:0902225314"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "13px", background: "linear-gradient(to right,#E61E4D,#D70466)", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", textDecoration: "none", marginBottom: 10, boxSizing: "border-box" }}>
                  📞 Gọi ngay: 090.222.5314
                </a>
                <a href="https://zalo.me/0902225314" target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "13px", background: "#0068FF", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", textDecoration: "none", marginBottom: 12, boxSizing: "border-box" }}>
                  <img src="https://res.cloudinary.com/dm30nbwuo/image/upload/q_auto/f_auto/v1777633372/Logo_zalo_nxtzsr.svg" alt="Zalo" style={{ height: 18, width: "auto", filter: "brightness(0) invert(1)" }} />
                  Chat Zalo: 090.222.5314
                </a>

                {data.contactPhone && (
                  <div style={{ textAlign: "center", fontSize: 13, color: "#555", marginBottom: 12 }}>
                    ĐT chủ nhà: <a href={`tel:${data.contactPhone}`} style={{ color: GREEN, fontWeight: 700, textDecoration: "none" }}>{data.contactPhone}</a>
                  </div>
                )}

                <div style={{ textAlign: "center", fontSize: 12, color: "#aaa" }}>Liên hệ để xem phòng & đặt cọc</div>

                <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "14px 0" }} />

                {/* Poster info */}
                <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 8 }}>Thông tin người đăng</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ position: "relative" }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: GREEN, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16 }}>
                      {(data.userId || "A")[0]?.toUpperCase()}
                    </div>
                    <div style={{ position: "absolute", bottom: 0, right: 0, width: 14, height: 14, background: GREEN, border: "2px solid #fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#fff", fontWeight: 800 }}>✔</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#111", display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                      {data.userId ? "Thành viên" : "Angiahouse"}
                      <span style={{ fontSize: 10, color: GREEN, fontWeight: 600, background: "#e8f5e9", padding: "1px 6px", borderRadius: 20 }}>✔ Đã xác thực</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                      <Stars value={5} size={11} />
                      <span style={{ fontSize: 11, color: "#555" }}>5.0 • Phản hồi nhanh</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: "#fafafa", borderTop: "1px solid #eee", padding: "10px 18px" }}>
                <div style={{ fontSize: 11, color: "#999", lineHeight: 1.8 }}>
                  <div>Mã tin: <span style={{ color: "#555" }}>{data._id}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SIMILAR */}
        {similar.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", marginBottom: 14 }}>🏘️ Phòng tương tự</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
              {similar.map(item => <SimilarCard key={item._id} item={item} />)}
            </div>
          </div>
        )}
      </main>

      {/* Mobile CTA */}
      <div className="mobile-cta" style={{ display: "none", position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #eee", padding: "10px 16px", zIndex: 200, gap: 10 }}>
        <a href="tel:0902225314" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "13px", background: RED, color: "#fff", borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>📞 Gọi ngay</a>
        <a href="https://zalo.me/0902225314" target="_blank" rel="noopener noreferrer"
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "13px", background: "#0068FF", color: "#fff", borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
          <img src="https://res.cloudinary.com/dm30nbwuo/image/upload/q_auto/f_auto/v1777633372/Logo_zalo_nxtzsr.svg" alt="Zalo" style={{ height: 18, filter: "brightness(0) invert(1)" }} /> Zalo
        </a>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 900px) {
          .main-grid { grid-template-columns: 2fr 360px !important; gap: 20px !important; }
          .sticky-card { position: sticky !important; top: 76px !important; }
        }
        @media (max-width: 600px) {
          .mobile-cta { display: flex !important; }
          main { padding-bottom: 90px !important; }
        }
        details summary::-webkit-details-marker { display: none; }
        * { box-sizing: border-box; }
        button:focus { outline: none; }
        img { max-width: 100%; }
      `}} />
    </div>
  );
}