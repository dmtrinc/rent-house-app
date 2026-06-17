"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";

/* ─── Availability ── */
function getAvailabilityInfo(availableDate: string | null | undefined) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  if (!availableDate) return { label: "Có thể dọn vào ngay", type: "now", btnBg: "#006633", labelColor: "#006633" };
  const avail = new Date(availableDate);
  const diffDays = Math.ceil((avail.getTime() - now.getTime()) / 86400000);
  if (diffDays < 2) return { label: "Có thể dọn vào ngay", type: "now", btnBg: "#006633", labelColor: "#006633" };
  if (diffDays < 30) return { label: `Trống từ ${avail.toLocaleDateString("vi-VN")}`, type: "soon", btnBg: "#FFD8A8", labelColor: "#b08500" };
  return { label: `Trống từ ${avail.toLocaleDateString("vi-VN")}`, type: "late", btnBg: "#a0a0a0", labelColor: "#666" };
}

/* ─── Skeleton card ── */
function SkeletonCard() {
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
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {!loaded && (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
      )}
      <img
        src={src || "/no-image.jpg"}
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

const PAGE_SIZE = 10;

export default function HomePage() {
  const [allItems, setAllItems] = useState<any[]>([]);
  const [visibleItems, setVisibleItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [myDeviceId, setMyDeviceId] = useState("");
  const [systemConfig, setSystemConfig] = useState({ globalPostEnabled: true });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [interactiveReady, setInteractiveReady] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  /* ─── Sort ── */
  function sortItems(arr: any[]) {
    if (!arr.length) return arr;
    const rest = [...arr];
    const cheapestIdx = rest.reduce((min, item, idx) => item.price < rest[min].price ? idx : min, 0);
    const [cheapest] = rest.splice(cheapestIdx, 1);
    const newestIdx = rest.reduce((max, item, idx) =>
      new Date(item.updatedAt || item.createdAt).getTime() > new Date(rest[max].updatedAt || rest[max].createdAt).getTime() ? idx : max, 0);
    const [second] = rest.splice(newestIdx, 1);
    rest.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
    return [cheapest, second, ...rest].filter(Boolean);
  }

  /* ─── Init ── */
  useEffect(() => {
    const dId = localStorage.getItem("device_id") || "dev_" + Math.random().toString(36).substring(2, 11);
    if (!localStorage.getItem("device_id")) localStorage.setItem("device_id", dId);
    setMyDeviceId(dId);
    try { setUser(JSON.parse(localStorage.getItem("user") || "null")); } catch { setUser(null); }

    // Load starred từ localStorage
    try {
      const saved = JSON.parse(localStorage.getItem("starred_ids") || "[]");
      setStarredIds(new Set(saved));
    } catch {}

    const fetchData = async () => {
      setLoading(true);
      try {
        const [resListings, resConfig] = await Promise.all([
          fetch("/api/listings", { cache: "no-store" }),
          fetch("/api/admin/config", { cache: "no-store" }).catch(() => null),
        ]);
        if (resListings?.ok) {
          const data = await resListings.json();
          const sorted = sortItems(Array.isArray(data) ? data : []);
          setAllItems(sorted);
          setVisibleItems(sorted.slice(0, PAGE_SIZE));
          setHasMore(sorted.length > PAGE_SIZE);
        }
        if (resConfig?.ok) {
          const cfg = await resConfig.json();
          setSystemConfig(cfg);
        }
      } catch { setAllItems([]); }
      finally {
        setLoading(false);
        // Load hiệu ứng sau 300ms để không block render đầu
        setTimeout(() => setInteractiveReady(true), 300);
      }
    };
    fetchData();
  }, []);

  /* ─── Infinite scroll ── */
  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          setTimeout(() => {
            setPage(p => {
              const next = p + 1;
              const newItems = allItems.slice(0, next * PAGE_SIZE);
              setVisibleItems(newItems);
              setHasMore(newItems.length < allItems.length);
              setLoadingMore(false);
              return next;
            });
          }, 200);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [allItems, hasMore, loadingMore]);

  /* ─── Logout ── */
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("user");
    window.location.reload();
  };

  /* ─── Toggle star — lưu vào localStorage + API ── */
  const toggleStar = useCallback(async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setStarredIds(prev => {
      const next = new Set(prev);
      const isStarred = next.has(id);
      if (isStarred) next.delete(id); else next.add(id);
      // Lưu localStorage
      localStorage.setItem("starred_ids", JSON.stringify([...next]));
      // Gọi API nếu đã đăng nhập
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          fetch("/api/user/save-listing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listingId: id, action: isStarred ? "unsave" : "save" }),
          }).catch(() => {});
        } catch {}
      }
      return next;
    });
  }, []);

  const navBtnStyle = (bg = "rgba(255,255,255,0.1)", color = "#fff"): React.CSSProperties => ({
    padding: "6px 14px", borderRadius: "22px",
    border: "1px solid rgba(255,255,255,0.3)",
    color, textDecoration: "none", fontSize: "13px", fontWeight: "600",
    background: bg, whiteSpace: "nowrap" as const, cursor: "pointer",
    display: "inline-block",
    ...(interactiveReady ? { transition: "transform 0.15s, box-shadow 0.15s" } : {}),
  });

  const GREEN = "#006633";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f8f8" }}>

      {/* HEADER */}
      <header style={{ borderBottom: "1px solid #004d26", position: "sticky", top: 0, backgroundColor: GREEN, zIndex: 100, boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
        <div style={{ maxWidth: "1760px", margin: "0 auto", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>

          {/* Logo + phone */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <img src="https://res.cloudinary.com/dm30nbwuo/image/upload/v1777648613/logo_xjxqjd.png"
                  alt="Angiahouse" style={{ height: "32px", width: "auto" }} fetchPriority="high" />
                <span style={{ fontSize: "16px", fontWeight: "700", color: "#fff", letterSpacing: "-0.5px" }}>ANGIAHOUSE</span>
              </div>
            </Link>
            <a href="tel:0902225314" style={{ fontSize: "13px", fontWeight: "600", color: "#fff", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px", borderLeft: "2px solid rgba(255,255,255,0.3)", paddingLeft: "12px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.56.57 1 1 0 011 1V21a1 1 0 01-1 1A17 17 0 013 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.56a1 1 0 01-.25 1.01l-2.2 2.22z"/>
              </svg>
              <span>090.222.5314</span>
            </a>
          </div>

          {/* Nav */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {!systemConfig.globalPostEnabled && (
              <span style={{ fontSize: "12px", color: "#fff", padding: "5px 10px", background: "rgba(255,255,255,0.2)", borderRadius: "22px", whiteSpace: "nowrap" }}>Bảo trì</span>
            )}

            <Link href={(systemConfig.globalPostEnabled && user?.canPost !== false) ? "/dang-tin" : "#"}
              onClick={e => { if (!systemConfig.globalPostEnabled || user?.canPost === false) { e.preventDefault(); alert("Chức năng đăng tin tạm khóa"); } }}
              style={{ ...navBtnStyle("#FFD966", GREEN), border: "none" }}
              {...(interactiveReady ? {
                onMouseEnter: (e: any) => { e.currentTarget.style.transform = "scale(1.06)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.25)"; },
                onMouseLeave: (e: any) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; },
              } : {})}>
              Đăng tin
            </Link>

            <Link href="/phong-trong" style={{ ...navBtnStyle(), textDecoration: "none" }}
              {...(interactiveReady ? {
                onMouseEnter: (e: any) => { e.currentTarget.style.transform = "scale(1.06)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.25)"; },
                onMouseLeave: (e: any) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; },
              } : {})}>
              Phòng trống
            </Link>

            {user ? (
              <Link href="/user" style={{ textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", borderRadius: 999, background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)", overflow: "hidden", cursor: "pointer" }}
                  {...(interactiveReady ? {
                    onMouseEnter: (e: any) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.25)"; },
                    onMouseLeave: (e: any) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; },
                  } : {})}>
                  <div style={{ padding: "2px 10px 2px 12px", lineHeight: 1.2 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#fff", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.username}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: user.role === "admin" ? "#FF8C00" : user.role === "mod" ? "#ce93d8" : "rgba(255,255,255,0.65)" }}>{user.role}</div>
                  </div>
                  <div
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLogout(); }}
                    title="Đăng xuất"
                    style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, margin: "2px 2px 2px 0", cursor: "pointer" }}
                          >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="6" x2="12" y2="12" />
                      </svg>
                   </div>
                </div>
              </Link>
            ) : (
              <Link href="/login" style={{ ...navBtnStyle(), textDecoration: "none" }}
                {...(interactiveReady ? {
                  onMouseEnter: (e: any) => { e.currentTarget.style.transform = "scale(1.06)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.25)"; },
                  onMouseLeave: (e: any) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; },
                } : {})}>
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main style={{ maxWidth: "1760px", margin: "0 auto", padding: "24px 20px 60px" }}>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : visibleItems.length > 0 ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
              {visibleItems.map((item, idx) => {
                if (user?.role !== "admin" && user?.role !== "mod" && item.status === "hide") return null;
                const isOwner = (item.deviceId === myDeviceId) || (user && item.userId === user._id);
                const isHovered = interactiveReady && hoveredId === item._id;
                const avail = getAvailabilityInfo(item.availableDate);
                const starred = starredIds.has(item._id);
                const isFirst = idx < 2;

                return (
                  <div key={item._id}
                    style={{
                      position: "relative", borderRadius: 14, background: "#fff",
                      boxShadow: isHovered ? "0 8px 28px rgba(0,0,0,0.18)" : "0 2px 10px rgba(0,0,0,0.09)",
                      ...(interactiveReady ? { transition: "transform 0.2s, box-shadow 0.2s" } : {}),
                      transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                      overflow: "hidden",
                    }}
                    onMouseEnter={interactiveReady ? () => setHoveredId(item._id) : undefined}
                    onMouseLeave={interactiveReady ? () => setHoveredId(null) : undefined}
                  >
                    {/* Image */}
                    <div style={{ position: "relative", width: "100%", paddingBottom: "72%", overflow: "hidden" }}>
                      <Link href={`/listing/${item._id}`} style={{ display: "block", position: "absolute", inset: 0 }}>
                        <LazyImage src={item.coverImage} alt={item.title} isFirst={isFirst} />
                        {item.status === "hide" && (
                          <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 11, padding: "4px 8px", borderRadius: 5, fontWeight: 600 }}>ĐÃ ẨN</div>
                        )}
                      </Link>

                      {/* ⚙️ Tool — load sau */}
                      {interactiveReady && (isOwner || user?.role === "admin" || user?.role === "mod") && (
                        <div style={{ position: "absolute", bottom: 10, right: 10, zIndex: 2 }}>
                          <details style={{ position: "relative" }}>
                            <summary style={{ width: 32, height: 32, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, listStyle: "none" }}>⚙️</summary>
                            <div style={{ position: "absolute", bottom: 38, right: 0, background: "#fff", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", minWidth: 130, overflow: "hidden", zIndex: 10 }}>
                              <Link href={`/edit/${item._id}`} style={{ display: "block", padding: "10px 16px", fontSize: 13, color: "#222", textDecoration: "none", fontWeight: 600 }}>✏️ Chỉnh sửa</Link>
                              {user?.role !== "mod" && (
                                <button onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!confirm("Xác nhận xóa tin này?")) return;
                                  const res = await fetch(`/api/listings/${item._id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId: myDeviceId }) });
                                  if (res.ok) setAllItems(prev => { const next = prev.filter(i => i._id !== item._id); setVisibleItems(next.slice(0, page * PAGE_SIZE)); return next; });
                                  else alert("Lỗi xóa tin");
                                }} style={{ display: "block", width: "100%", padding: "10px 16px", fontSize: 13, color: "#dc3545", background: "none", border: "none", cursor: "pointer", fontWeight: 600, textAlign: "left" }}>🗑️ Xóa tin</button>
                              )}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>

                    {/* Card content — hiển thị ngay, không đợi ảnh */}
                    <Link href={`/listing/${item._id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                      <div style={{ padding: "14px 14px 10px" }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.title}
                        </h3>
                        <p style={{ fontSize: 13, color: "#666", margin: "0 0 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          📍 {item.address || "TPHCM"}
                        </p>
                        {item.highlights?.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                            {item.highlights.slice(0, 3).map((h: string) => (
                              <span key={h} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 12, background: "#e8f5e9", color: "#2e7d32", fontWeight: 500 }}>✓ {h}</span>
                            ))}
                          </div>
                        )}
                        <div style={{ marginBottom: 2 }}>
                          <span style={{ fontSize: 17, fontWeight: 800, color: "#111" }}>{item.price?.toLocaleString()} đ</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>/tháng</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: avail.labelColor, opacity: 0.5 }}>{avail.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 12, whiteSpace: "nowrap", background: avail.btnBg, color: "#fff", cursor: "pointer" }}>Chi tiết ➜</span>
                        </div>
                      </div>
                    </Link>

                    {/* Quan tâm — load sau */}
                    {interactiveReady && (
                      <button onClick={e => toggleStar(e, item._id)}
                        style={{ position: "absolute", top: 10, right: 10, width: 34, height: 34, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, transform: starred ? "scale(1.2)" : "scale(1)", filter: starred ? "none" : "grayscale(100%)" }}
                        title="Quan tâm">
                        😍
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Infinite scroll loader */}
            <div ref={loaderRef} style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 16 }}>
              {loadingMore && (
                <div style={{ width: 32, height: 32, border: "3px solid #f0f0f0", borderTop: `3px solid ${GREEN}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              )}
              {!hasMore && allItems.length > PAGE_SIZE && (
                <span style={{ fontSize: 13, color: "#aaa" }}>Đã hiển thị tất cả {allItems.length} tin</span>
              )}
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 20px", maxWidth: "500px", margin: "0 auto" }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>🏘️</div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#222", marginBottom: 8 }}>Chưa có tin đăng nào</h2>
            <p style={{ fontSize: 15, color: "#717171", marginBottom: 28 }}>Hãy là người đầu tiên đăng tin cho thuê nhà</p>
            <Link href="/dang-tin" style={{ display: "inline-block", padding: "12px 24px", borderRadius: 8, background: "#FFD966", color: GREEN, textDecoration: "none", fontSize: 15, fontWeight: 700 }}>Đăng tin ngay</Link>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        details summary::-webkit-details-marker { display: none; }
        details > summary { list-style: none; outline: none; }
        button:focus { outline: none; }
        * { box-sizing: border-box; }
      `}} />
    </div>
  );
}