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
    const end = Date.now() + days * 86400000;
    const tick = () => {
      const diff = end - Date.now();
      if (diff <= 0) { setRemaining("Đã hết hạn"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${d} ngày ${h}g ${m}p ${s}s`);
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
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= value ? "#FFB800" : "#DDD"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </span>
  );
}

function Skeleton({ w = "100%", h = 16, r = 6, mb = 0 }: { w?: string|number; h?: number; r?: number; mb?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r, marginBottom: mb,
      background: "linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite"
    }} />
  );
}

function SimilarCard({ item }: { item: any }) {
  const [hov, setHov] = useState(false);
  return (
    <Link href={`/listing/${item._id}`} style={{ textDecoration: "none" }}>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ borderRadius: 12, overflow: "hidden", background: "#fff",
          boxShadow: hov ? "0 8px 24px rgba(0,0,0,0.14)" : "0 2px 10px rgba(0,0,0,0.08)",
          transform: hov ? "translateY(-4px)" : "none", transition: "all 0.2s" }}>
        <div style={{ paddingBottom: "66%", position: "relative", overflow: "hidden" }}>
          <img src={item.coverImage || "/no-image.jpg"} alt={item.title} loading="lazy"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
              transform: hov ? "scale(1.04)" : "scale(1)", transition: "transform 0.3s" }} />
        </div>
        <div style={{ padding: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>{item.title}</div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📍 {item.address || "TPHCM"}</div>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#006633" }}>
            {item.price?.toLocaleString()} đ<span style={{ fontSize: 12, fontWeight: 400, color: "#888" }}>/tháng</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function parseDescriptionWithMedia(text: string) {
  const ytRegex = /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
  const ttRegex = /https?:\/\/(?:www\.)?tiktok\.com\/[^\s]*/g;
  let remaining = text;
  remaining = remaining.replace(ytRegex, (_m, vid) => `\x00YT:${vid}\x00`);
  remaining = remaining.replace(ttRegex, (m) => `\x00TT:${m}\x00`);
  const result: { type: "text"|"youtube"|"tiktok"; content: string }[] = [];
  for (const seg of remaining.split(/\x00/)) {
    if (seg.startsWith("YT:")) result.push({ type: "youtube", content: seg.slice(3) });
    else if (seg.startsWith("TT:")) result.push({ type: "tiktok", content: seg.slice(3) });
    else if (seg.trim()) result.push({ type: "text", content: seg });
  }
  return result;
}

const FURNITURE_OPTIONS = [
  { icon: "❄️", label: "Máy lạnh" }, { icon: "🧊", label: "Tủ lạnh" },
  { icon: "🛏️", label: "Giường" },   { icon: "🚪", label: "Tủ quần áo" },
  { icon: "🚿", label: "WC riêng" }, { icon: "🍳", label: "Kệ bếp" },
  { icon: "🏠", label: "Ban công" }, { icon: "🪟", label: "Cửa sổ" },
  { icon: "🧺", label: "Máy giặt" }, { icon: "🔑", label: "Không chung chủ" },
  { icon: "🛗", label: "Thang máy" }, { icon: "🛵", label: "Chỗ đậu xe máy" },
];

function normalizeFurniture(raw: any[]): { icon: string; label: string }[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw.map(item => {
    if (typeof item === "object" && item !== null && "label" in item) return { icon: item.icon || "✅", label: item.label };
    if (typeof item === "string") {
      const found = FURNITURE_OPTIONS.find(f => f.label === item);
      return found ?? { icon: "✅", label: item };
    }
    return { icon: "✅", label: String(item) };
  });
}

function useCurrentUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) { setUser(JSON.parse(stored)); setLoading(false); return; }
    } catch {}
    // Không có trong localStorage → user chưa đăng nhập, không cần gọi API
    setLoading(false);
  }, []);
  return { user, loading };
}

function canEditListing(user: any, listing: any, deviceId: string | null): boolean {
  if (!listing) return false;
  if (user?.role === "admin" || user?.role === "mod") return true;
  if (user && listing.userId && (listing.userId === user._id || listing.userId === user.username)) return true;
  if (deviceId && listing.deviceId && deviceId === listing.deviceId) return true;
  return false;
}

function getDeviceId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = localStorage.getItem("device_id") || localStorage.getItem("deviceId");
    if (!id) { id = Math.random().toString(36).slice(2) + Date.now(); localStorage.setItem("device_id", id); }
    return id;
  } catch { return null; }
}

const DUMMY_REVIEWS_COUNT = 3;
const DUMMY_AVG = 4.7;
const GREEN = "#006633";
const RED = "#FF385C";

/* ─── Cache trong bộ nhớ (theo từng listing id) ──
 * Quay lại tin đã xem → hiện ngay từ cache, không skeleton. Mất khi F5. */
const detailCache = new Map<string, { data: any; similar: any[] }>();

/* ════════════════════════════════════════════════ */
export default function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(() => detailCache.get(id)?.data ?? null);
  const [similar, setSimilar] = useState<any[]>(() => detailCache.get(id)?.similar ?? []);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [heroReady, setHeroReady] = useState(() => !!detailCache.get(id)?.data);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mapInput, setMapInput] = useState("");
  const [customMapUrl, setCustomMapUrl] = useState("");
  const [mapResolving, setMapResolving] = useState(false);
  const [posterUsername, setPosterUsername] = useState<string | null>(null);
  const router = useRouter();
  const voucherTimer = useVoucherCountdown(3);
  const { user } = useCurrentUser();

  useEffect(() => { setDeviceId(getDeviceId()); }, []);

  // Load/save customMapUrl theo listing id
  useEffect(() => {
    if (!id) return;
    const saved = localStorage.getItem(`map_override_${id}`);
    if (saved) setCustomMapUrl(saved);
  }, [id]);

  useEffect(() => {
    if (!id || !customMapUrl) return;
    localStorage.setItem(`map_override_${id}`, customMapUrl);
  }, [id, customMapUrl]);

  useEffect(() => {
    if (!id || id === "undefined") return;
    // Stale-while-revalidate: nếu đã có cache thì state hiện ngay, vẫn tải lại ở nền.
    fetch(`/api/listings/${id}`, { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        setData(d);
        detailCache.set(id, { data: d, similar: detailCache.get(id)?.similar ?? [] });
        if (d.coverImage) {
          const img = new Image();
          img.src = d.coverImage;
          img.onload = () => setHeroReady(true);
        } else { setHeroReady(true); }
        setTimeout(() => {
          fetch("/api/listings")
            .then(r => r.json())
            .then((all: any[]) => {
              if (!Array.isArray(all)) return;
              const others = all.filter(i => i._id !== d._id && i.status !== "hide");
              others.sort((a, b) => Math.abs(a.price - d.price) - Math.abs(b.price - d.price));
              const sim = others.slice(0, 4);
              setSimilar(sim);
              detailCache.set(id, { data: d, similar: sim });
            }).catch(() => {});
        }, 800);
      })
      .catch(() => { if (!detailCache.get(id)) alert("Không thể tải thông tin!"); });
  }, [id]);

  /* ── Skeleton ── */
  if (!data) return (
    <div style={{ minHeight: "100vh", background: "#f7f7f7" }}>
      <div style={{ background: GREEN, height: 56 }} />
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "16px 16px 80px" }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", marginBottom: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
          <Skeleton h={28} mb={10} w="70%" />
          <Skeleton h={14} mb={10} w="50%" />
          <Skeleton h={32} w="40%" />
        </div>
        <Skeleton h={260} r={14} mb={14} />
        <div style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", marginBottom: 14 }}>
          <Skeleton h={18} mb={12} w="30%" />
          <Skeleton h={14} mb={8} />
          <Skeleton h={14} mb={8} w="90%" />
          <Skeleton h={14} w="80%" />
        </div>
      </div>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );

  const allImages = [data.coverImage, ...(data.images || [])].filter(Boolean);
  const avail = getAvailabilityInfo(data.availableDate);
  const highlights: string[] = (data.highlights || []).slice(0, 3);
  const furniture = normalizeFurniture(data.furniture || []);
  const canEdit = canEditListing(user, data, deviceId);

  const dashboardHref = user?.role === "admin" ? "/admin"
    : user?.role === "mod" ? "/mod"
    : "/user/dashboard";

  // Chỉ tạo link nếu là username hợp lệ
  const isValidUsername = (s: string | null) => {
    if (!s) return false;
    if (/^[0-9a-f]{24}$/i.test(s)) return false; // ObjectId raw — không dùng làm URL
    return true; // email hoặc username đều hợp lệ
  };
  const posterProfileHref = isValidUsername(posterUsername) ? `/user/listing/${encodeURIComponent(posterUsername!)}` : null;

  const mapsQuery = encodeURIComponent(data.address || "Ho Chi Minh City");
  const mapsEmbedUrl = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const descSegments = parseDescriptionWithMedia(data.description || "");

  const prevImg = () => setGalleryIdx(i => (i - 1 + allImages.length) % allImages.length);
  const nextImg = () => setGalleryIdx(i => (i + 1) % allImages.length);

  const parseMapSrc = (input: string): string => {
    const s = input.trim();
    // 1. Iframe embed code: lay src="..."
    const srcMatch = s.match(/src="([^"]+)"/);
    if (srcMatch) return srcMatch[1];
    // 2. Da la embed URL
    if (s.includes("/maps/embed")) return s;
    // 3. Google Maps URL thuong co toa do @lat,lng
    if (s.includes("google.com/maps")) {
      const coordMatch = s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (coordMatch) {
        return `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1000!2d${coordMatch[2]}!3d${coordMatch[1]}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1svi!2svn!4v1`;
      }
    }
    // 4. Link rut gon hoac khong ro dinh dang → tra ve nguyen, mo tab moi
    return s;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f7", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>

      {/* ── Map Pin Modal ── */}
      {mapModalOpen && canEdit && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2000,
          display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setMapModalOpen(false)}>
          <div style={{ background: "#fff", borderRadius: "16px 16px 0 0", padding: "20px 18px 32px",
            width: "100%", maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111", marginBottom: 6 }}>🔧 Cập nhật vị trí bản đồ</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 12, lineHeight: 1.6 }}>
              Mở <a href={mapsSearchUrl} target="_blank" rel="noopener noreferrer" style={{ color: GREEN }}>Google Maps ↗</a>,
              tìm đúng địa chỉ → nhấn <b>Chia sẻ → Nhúng bản đồ</b> → copy đoạn <code>src="..."</code>.
              Hoặc copy thẳng URL trên thanh địa chỉ.
            </div>
            <textarea
              value={mapInput}
              onChange={e => setMapInput(e.target.value)}
              placeholder='Dán link Google Maps hoặc iframe src vào đây...'
              rows={3}
              autoFocus
              style={{ width: "100%", border: "1px solid #ddd", borderRadius: 10,
                padding: "10px 12px", fontSize: 13, fontFamily: "inherit",
                resize: "vertical", boxSizing: "border-box", marginBottom: 10 }}
            />
            {/* Preview */}
            {mapInput.trim() && (
              <div style={{ marginBottom: 12 }}>
                {mapInput.trim().includes("goo.gl") || (!mapInput.trim().includes("google.com") && !mapInput.trim().includes("src=")) ? (
                  <div style={{ padding: "10px 14px", background: "#fff8e1", borderRadius: 10, border: "1px solid #ffe082", fontSize: 12, color: "#b08500" }}>
                    ⚠️ Link rút gọn không nhúng được iframe.<br/>
                    <a href={mapInput.trim()} target="_blank" rel="noopener noreferrer" style={{ color: "#006633", fontWeight: 600 }}>
                      Mở link này → copy URL đầy đủ trên thanh địa chỉ → dán lại vào đây
                    </a>
                  </div>
                ) : (
                  <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #ddd", height: 160 }}>
                    <iframe src={parseMapSrc(mapInput.trim())} width="100%" height="160"
                      style={{ border: 0 }} allowFullScreen loading="lazy" title="Preview Map" />
                  </div>
                )}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { setMapModalOpen(false); setMapInput(""); }}
                style={{ padding: "9px 20px", border: "1px solid #ddd", borderRadius: 10,
                  background: "#f5f5f5", fontSize: 13, cursor: "pointer" }}>Hủy</button>
              
<button
                onClick={async () => {
                  const s = mapInput.trim();
                  if (!s) return;
                  // Link rút gọn → resolve qua API
                  if (s.includes("goo.gl") || s.includes("maps.app")) {
                    setMapResolving(true);
                    try {
                      const res = await fetch(`/api/resolve-map?url=${encodeURIComponent(s)}`);
                      const data = await res.json();
                      if (data.embedUrl) {
                        setCustomMapUrl(data.embedUrl);
                        setMapModalOpen(false);
                        setMapInput("");
                      } else {
                        alert("Không resolve được link. Vui lòng dùng link từ 'Nhúng bản đồ'.");
                      }
                    } catch {
                      alert("Lỗi kết nối.");
                    } finally {
                      setMapResolving(false);
                    }
                    return;
                  }
                  setCustomMapUrl(parseMapSrc(s));
                  setMapModalOpen(false);
                  setMapInput("");
                }}
                disabled={mapResolving}

                style={{ padding: "9px 24px", border: "none", borderRadius: 10,
                  background: GREEN, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                ✅ Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Gallery Modal ── */}
      {showGallery && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 2000,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowGallery(false)}>
          <button onClick={() => setShowGallery(false)}
            style={{ position: "absolute", top: 16, right: 20, background: "none", border: "none", color: "#fff", fontSize: 32, cursor: "pointer" }}>×</button>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>{galleryIdx + 1} / {allImages.length}</div>
          <img src={allImages[galleryIdx]} alt="" style={{ maxHeight: "80vh", maxWidth: "90vw", objectFit: "contain", borderRadius: 8 }}
            onClick={e => e.stopPropagation()} />
          {allImages.length > 1 && (<>
            <button onClick={e => { e.stopPropagation(); prevImg(); }}
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }}>‹</button>
            <button onClick={e => { e.stopPropagation(); nextImg(); }}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }}>›</button>
          </>)}
          <div style={{ display: "flex", gap: 8, marginTop: 16, overflowX: "auto", maxWidth: "90vw", padding: "4px 0" }}>
            {allImages.map((img: string, i: number) => (
              <img key={i} src={img} loading="lazy" onClick={e => { e.stopPropagation(); setGalleryIdx(i); }}
                style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 6, cursor: "pointer",
                  opacity: i === galleryIdx ? 1 : 0.5,
                  border: i === galleryIdx ? "2px solid #fff" : "2px solid transparent", flexShrink: 0 }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header style={{ borderBottom: "1px solid #004d26", position: "sticky", top: 0, background: GREEN, zIndex: 100, boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "10px 16px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>

          {/* LEFT */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap" }}>
            <button onClick={() => router.back()}
              style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
                width: 34, height: 34, borderRadius: "50%", fontSize: 18, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>←</button>
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <img src="https://res.cloudinary.com/dm30nbwuo/image/upload/v1777648613/logo_xjxqjd.png"
                alt="Angiahouse" style={{ height: 28, width: "auto" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>ANGIAHOUSE</span>
            </Link>
            <a href="tel:0902225314"
              style={{ fontSize: 12, fontWeight: 600, color: "#fff", textDecoration: "none",
                display: "flex", alignItems: "center", gap: 4,
                borderLeft: "2px solid rgba(255,255,255,0.3)", paddingLeft: 10, flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.56.57 1 1 0 011 1V21a1 1 0 01-1 1A17 17 0 013 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.56a1 1 0 01-.25 1.01l-2.2 2.22z"/>
              </svg>
              <span>090.222.5314</span>
            </a>
          </div>

          {/* RIGHT */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: "auto" }}>

            {/* ✏️ Nút Sửa — chỉ owner/admin/mod */}
            {canEdit && (
              <Link href={`/edit/${id}`} style={{ textDecoration: "none" }}>
                <button title="Chỉnh sửa tin đăng"
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
                    borderRadius: 20, border: "1px solid rgba(255,255,255,0.4)",
                    background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 11,
                    fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.28)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.15)"}>
                  ✏️ Sửa
                </button>
              </Link>
            )}

            {/* Account / Đăng nhập */}
            {user ? (
              <Link href="/user" style={{ textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", borderRadius: 999,
                    background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)",
                    overflow: "hidden", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1.05)"; el.style.boxShadow = "0 4px 14px rgba(0,0,0,0.25)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1)"; el.style.boxShadow = "none"; }}>
                  <div style={{ padding: "2px 10px 2px 12px", lineHeight: 1.2 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#fff", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.username}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700,
                      color: user.role === "admin" ? "#FF8C00" : user.role === "mod" ? "#ce93d8" : "rgba(255,255,255,0.65)" }}>
                      {user.role}
                    </div>
                  </div>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13, flexShrink: 0, margin: "2px 2px 2px 0" }}>
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                </div>
              </Link>
            ) : (
              <Link href="/login" style={{ textDecoration: "none" }}>
                <button style={{ padding: "6px 14px", borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: "rgba(255,255,255,0.12)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Đăng nhập
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "16px 16px 80px" }}>

        {/* TITLE BAR */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", marginBottom: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
          <h1 style={{ fontSize: "clamp(17px,3vw,23px)", fontWeight: 800, color: "#111", margin: "0 0 6px" }}>
            {data.title}
          </h1>

          {/* Address + map link + 🔧 */}
          <div style={{ display: "flex", alignItems: "center", flexWrap: "nowrap", overflow: "hidden", gap: 0 }}>
            <span style={{ fontSize: 13, color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: "0 1 auto", minWidth: 0 }}>
              📍 {data.address || "TPHCM"}
            </span>
            <a href={mapsSearchUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: GREEN, textDecoration: "underline", whiteSpace: "nowrap", flexShrink: 0, marginLeft: 6 }}>
              xem bản đồ ↗
            </a>
            {canEdit && (
              <button title="Cập nhật vị trí bản đồ"
                onClick={() => setMapModalOpen(true)}
                style={{ marginLeft: 6, flexShrink: 0, background: "none", border: "1px solid #ddd",
                  borderRadius: 8, padding: "2px 7px", fontSize: 11, color: "#555", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 3 }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "#f0faf4"; el.style.borderColor = GREEN; el.style.color = GREEN; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "none"; el.style.borderColor = "#ddd"; el.style.color = "#555"; }}>
                🔧
              </button>
            )}
          </div>

          {/* Price + availability */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: "clamp(22px,4vw,28px)", fontWeight: 900, color: GREEN, lineHeight: 1 }}>
              {data.price?.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 500, color: "#777" }}>đ/tháng</span>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px",
              borderRadius: 20, background: avail.bg, color: avail.color, fontSize: 12, fontWeight: 700 }}>
              {avail.type === "now" ? "🟢" : avail.type === "soon" ? "🟡" : "⚪"} {avail.label}
            </div>
          </div>
        </div>

        {/* VOUCHER */}
        <div style={{ background: "linear-gradient(135deg,#FF6B35,#FF385C)", borderRadius: 12,
          padding: "12px 16px", marginBottom: 12, boxShadow: "0 4px 16px rgba(255,56,92,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 20 }}>🎁</span>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>Voucher giảm giá 100.000đ/tháng. Áp dụng 3 tháng đầu.</div>
              <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 11, marginTop: 2 }}>
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
              <div style={{ display: "flex", gap: 3, background: "#000", height: "clamp(260px, 42vw, 420px)" }}>
                {/* Ảnh lớn bên trái */}
                <div style={{ flex: allImages.length > 1 ? "1 1 62%" : "1 1 100%", position: "relative", cursor: "pointer", overflow: "hidden", background: "#e0e0e0" }}
                  onClick={() => { setGalleryIdx(0); setShowGallery(true); }}>
                  {!heroReady && (
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
                  )}
                  <img
                    src={allImages[0]}
                    alt={data.title}
                    fetchPriority="high"
                    decoding="async"
                    style={{ width: "100%", height: "100%", objectFit: "cover",
                      transition: "transform 0.3s", opacity: heroReady ? 1 : 0 }}
                    onLoad={() => setHeroReady(true)}
                    onMouseOver={e => (e.currentTarget.style.transform = "scale(1.03)")}
                    onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")}
                  />
                </div>
                {/* Cột ảnh nhỏ bên phải — mỗi ảnh flex:1 nên luôn lấp đầy, không bị ô đen */}
                {allImages.length > 1 && (
                  <div style={{ flex: "1 1 38%", display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                    {allImages.slice(1, 4).map((img: string, i: number, arr: string[]) => (
                      <div key={i} style={{ flex: 1, minHeight: 0, position: "relative", cursor: "pointer", overflow: "hidden", background: "#e8e8e8" }}
                        onClick={() => { setGalleryIdx(i + 1); setShowGallery(true); }}>
                        <img src={img} alt="" loading="lazy" decoding="async"
                          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
                          onMouseOver={e => (e.currentTarget.style.transform = "scale(1.05)")}
                          onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")} />
                        {i === arr.length - 1 && allImages.length > 4 && (
                          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 700 }}>
                            +{allImages.length - 4} ảnh
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setShowGallery(true)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  width: "100%", padding: "9px", background: "#f5f5f5", border: "none",
                  borderTop: "1px solid #eee", fontSize: 13, fontWeight: 600, color: "#333", cursor: "pointer" }}>
                🖼️ Xem tất cả {allImages.length} ảnh
              </button>
            </div>

            {/* HIGHLIGHTS */}
            {highlights.length > 0 && (
              <div style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: "0 0 10px" }}>⭐ Đặc điểm nổi bật</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {highlights.map((h, i) => (
                    <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 14px",
                      borderRadius: 20, background: "#f0faf4", border: "1px solid #c8e6c9", fontSize: 13, fontWeight: 600, color: GREEN }}>
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
                    <iframe src={`https://www.youtube.com/embed/${seg.content}`} title="YouTube" allowFullScreen loading="lazy"
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} />
                  </div>
                );
                if (seg.type === "tiktok") return (
                  <div key={i} style={{ marginBottom: 14, padding: "10px 14px", background: "#f5f5f5", borderRadius: 10, fontSize: 13, color: "#555" }}>
                    🎵 TikTok: <a href={seg.content} target="_blank" rel="noopener noreferrer" style={{ color: GREEN, wordBreak: "break-all" }}>{seg.content}</a>
                  </div>
                );
                return <p key={i} style={{ fontSize: 15, lineHeight: 1.7, color: "#333", whiteSpace: "pre-wrap", margin: "0 0 8px" }}>{seg.content}</p>;
              }) : <p style={{ fontSize: 15, color: "#888" }}>Chưa có mô tả chi tiết.</p>}
            </div>

            {/* FURNITURE */}
            {furniture.length > 0 && (
              <div style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: "0 0 10px" }}>🛋️ Nội thất & tiện nghi</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {furniture.map((f, i) => (
                    <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px",
                      borderRadius: 20, background: "#fafafa", border: "1px solid #e0e0e0", fontSize: 13, color: "#333", fontWeight: 500 }}>
                      <span style={{ fontSize: 15 }}>{f.icon}</span> {f.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* GOOGLE MAP */}
            <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <div style={{ padding: "14px 18px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: 0 }}>📍 Vị trí trên bản đồ</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <a href={mapsSearchUrl} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 13, color: GREEN, fontWeight: 600, textDecoration: "none" }}>
                    Mở Google Maps ↗
                  </a>
                  {canEdit && (
                    <button onClick={() => setMapModalOpen(true)} title="Cập nhật vị trí bản đồ"
                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
                        borderRadius: 8, fontSize: 12, fontWeight: 600,
                        border: "1px solid #ddd", background: "#fafafa", color: "#555", cursor: "pointer" }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "#f0faf4"; el.style.borderColor = GREEN; el.style.color = GREEN; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "#fafafa"; el.style.borderColor = "#ddd"; el.style.color = "#555"; }}>
                      🔧 Ping vị trí
                    </button>
                  )}
                </div>
              </div>
              <div style={{ padding: "10px 18px 16px" }}>
                <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #ddd", height: mapExpanded ? 380 : 200, transition: "height 0.3s", position: "relative" }}>
                  <iframe key={customMapUrl || mapsEmbedUrl} src={customMapUrl || mapsEmbedUrl} width="100%" height="100%"
                    style={{ border: 0 }} allowFullScreen loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade" title="Google Maps" />
                  {!customMapUrl && (
                    <a href={mapsSearchUrl} target="_blank" rel="noopener noreferrer"
                      style={{ position: "absolute", inset: 0, display: "block" }} title="Mở Google Maps" />
                  )}
                </div>
                <button onClick={() => setMapExpanded(e => !e)}
                  style={{ marginTop: 6, background: "none", border: "none", color: GREEN, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>
                  {mapExpanded ? "Thu nhỏ ▲" : "Phóng to ▼"}
                </button>
              </div>
            </div>

            {/* RATINGS */}
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

              <div style={{ background: GREEN, padding: "14px 18px" }}>
                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>Giá thuê hàng tháng</div>
                <div style={{ color: "#fff", fontSize: 24, fontWeight: 900, display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span>{data.price?.toLocaleString()} đ</span>
                  <span style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.7)" }}>/tháng</span>
                </div>
                <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 5,
                  background: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, color: "#fff" }}>
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

                {/* Gọi */}
                <a href="tel:0902225314"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", padding: "13px",
                    background: "linear-gradient(to right,#E61E4D,#D70466)", color: "#fff",
                    borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: "none",
                    marginBottom: 10, boxSizing: "border-box" }}>
                  📞 Gọi ngay: 090.222.5314
                </a>

                {/* Zalo — SVG inline */}
                <a href="https://zalo.me/0902225314" target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", padding: "13px", background: "#0068FF", color: "#fff",
                    borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: "none",
                    marginBottom: 12, boxSizing: "border-box" }}>
                  <img src="https://res.cloudinary.com/dm30nbwuo/image/upload/v1777633372/Logo_zalo_nxtzsr.svg" alt="Zalo" style={{ width: 22, height: 22, display: "block", flexShrink: 0 }} />
                  Chat Zalo: 090.222.5314
                </a>

                {data.contactPhone && (
                  <div style={{ textAlign: "center", fontSize: 13, color: "#555", marginBottom: 12 }}>
                    ĐT chủ nhà: <a href={`tel:${data.contactPhone}`} style={{ color: GREEN, fontWeight: 700, textDecoration: "none" }}>{data.contactPhone}</a>
                  </div>
                )}

                <div style={{ textAlign: "center", fontSize: 12, color: "#aaa" }}>Liên hệ để xem phòng & đặt cọc</div>

                <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "14px 0" }} />

                <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 8 }}>Thông tin người đăng</div>
                <PosterCard
                  data={data}
                  GREEN={GREEN}
                  profileHref={posterProfileHref}
                  onUsernameResolved={setPosterUsername}
                />
              </div>

              <div style={{ background: "#fafafa", borderTop: "1px solid #eee", padding: "10px 18px" }}>
                <div style={{ fontSize: 11, color: "#999" }}>Mã tin: <span style={{ color: "#555" }}>{data._id}</span></div>
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
      <div className="mobile-cta" style={{ display: "none", position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff", borderTop: "1px solid #eee", padding: "10px 16px", zIndex: 200, gap: 10 }}>
        <a href="tel:0902225314"
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "13px", background: RED, color: "#fff", borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
          📞 Gọi ngay
        </a>
        <a href="https://zalo.me/0902225314" target="_blank" rel="noopener noreferrer"
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "13px", background: "#0068FF", color: "#fff", borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
          <img src="https://res.cloudinary.com/dm30nbwuo/image/upload/v1777633372/Logo_zalo_nxtzsr.svg" alt="Zalo" style={{ width: 22, height: 22, display: "block", flexShrink: 0 }} />
          Zalo
        </a>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @media (min-width: 900px) {
          .main-grid { grid-template-columns: 2fr 360px !important; gap: 20px !important; }
          .sticky-card { position: sticky !important; top: 76px !important; }
        }
        @media (max-width: 600px) {
          .mobile-cta { display: flex !important; }
          main { padding-bottom: 90px !important; }
        }
        * { box-sizing: border-box; }
        button:focus { outline: none; }
        img { max-width: 100%; }
      `}} />
    </div>
  );
}

/* ── PosterCard ── */
function PosterCard({ data, GREEN, profileHref, onUsernameResolved }: {
  data: any;
  GREEN: string;
  profileHref: string | null;
  onUsernameResolved?: (username: string) => void;
}) {
  const [posterName, setPosterName] = useState<string>("");
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (!data.userId) {
      setPosterName("Angiahouse");
      setResolved(true);
      return;
    }

const isObjectId = /^[0-9a-f]{24}$/i.test(data.userId);

if (!isObjectId) {
      // userId là username hoặc email — dùng nguyên làm display name và profile link
      setPosterName(data.userId);
      onUsernameResolved?.(data.userId);
      setResolved(true);
      return;
    }


    fetch(`/api/user?id=${data.userId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        let name = "";
        if (d?.username) name = d.username;
        else if (Array.isArray(d)) {
          const found = d.find((u: any) => String(u._id) === String(data.userId));
          if (found?.username) name = found.username;
        }
        const final = name || data.userId;
        setPosterName(final);
        if (name) onUsernameResolved?.(name);
        setResolved(true);
      })
      .catch(() => {
        setPosterName(data.userId);
        setResolved(true);
      });
  }, [data.userId]);

  const inner = (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px", borderRadius: 10,
      transition: "background 0.15s", cursor: profileHref ? "pointer" : "default" }}
      onMouseEnter={e => { if (profileHref) (e.currentTarget as HTMLElement).style.background = "#f0faf4"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: GREEN,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 800, fontSize: 18 }}>
          {resolved ? (posterName[0]?.toUpperCase() || "A") : "…"}
        </div>
        <div style={{ position: "absolute", bottom: 0, right: 0, width: 14, height: 14,
          background: "#4caf50", border: "2px solid #fff", borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 8, color: "#fff", fontWeight: 800 }}>✔</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#111",
          display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
          {!resolved
            ? <span style={{ color: "#ccc", fontSize: 12 }}>Đang tải...</span>
            : <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{posterName}</span>
          }
          <span style={{ fontSize: 10, color: GREEN, fontWeight: 600,
            background: "#e8f5e9", padding: "1px 6px", borderRadius: 20, flexShrink: 0 }}>
            ✔ Đã xác thực
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
          <Stars value={5} size={11} />
          <span style={{ fontSize: 11, color: "#555" }}>5.0 • Phản hồi nhanh</span>
        </div>
        {profileHref && (
          <span style={{ fontSize: 11, color: GREEN, textDecoration: "underline" }}>
            Xem trang cá nhân →
          </span>
        )}
      </div>
    </div>
  );

  return profileHref
    ? <Link href={profileHref} style={{ textDecoration: "none" }}>{inner}</Link>
    : inner;
}

















