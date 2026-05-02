"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

function getAvailabilityInfo(availableDate: string | null | undefined) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (!availableDate) {
    return { label: "Có thể dọn vào ngay", type: "now", btnBg: "#006633", labelColor: "#006633" };
  }

  const avail = new Date(availableDate);
  const diffDays = Math.ceil((avail.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 2) {
    return { label: "Có thể dọn vào ngay", type: "now", btnBg: "#006633", labelColor: "#006633" };
  }
  if (diffDays < 30) {
    return { label: `Trống từ ${avail.toLocaleDateString("vi-VN")}`, type: "soon", btnBg: "#FFD8A8", labelColor: "#b08500" };
  }
  return { label: `Trống từ ${avail.toLocaleDateString("vi-VN")}`, type: "late", btnBg: "#a0a0a0", labelColor: "#666" };
}

export default function HomePage() {
  const [items, setItems] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [myDeviceId, setMyDeviceId] = useState("");
  const [systemConfig, setSystemConfig] = useState({ globalPostEnabled: true });
  const [loading, setLoading] = useState(true);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function sortItems(arr: any[], loc: { lat: number; lng: number } | null) {
    if (arr.length === 0) return arr;
    const rest = [...arr];
    const cheapestIdx = rest.reduce((minIdx, item, idx) => item.price < rest[minIdx].price ? idx : minIdx, 0);
    const [cheapest] = rest.splice(cheapestIdx, 1);

    let second: any;
    if (loc && rest.length > 0) {
      const withCoords = rest.filter(i => i.lat != null && i.lng != null);
      if (withCoords.length > 0) {
        const nearest = withCoords.reduce((best, item) =>
          haversine(loc.lat, loc.lng, item.lat, item.lng) < haversine(loc.lat, loc.lng, best.lat, best.lng) ? item : best
        );
        rest.splice(rest.indexOf(nearest), 1);
        second = nearest;
      }
    }
    if (!second && rest.length > 0) {
      const newestIdx = rest.reduce((maxIdx, item, idx) =>
        new Date(item.updatedAt || item.createdAt).getTime() > new Date(rest[maxIdx].updatedAt || rest[maxIdx].createdAt).getTime() ? idx : maxIdx, 0);
      [second] = rest.splice(newestIdx, 1);
    }
    rest.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
    return [cheapest, ...(second ? [second] : []), ...rest];
  }

  useEffect(() => {
    const dId = localStorage.getItem("device_id") || "dev_" + Math.random().toString(36).substring(2, 11);
    if (!localStorage.getItem("device_id")) localStorage.setItem("device_id", dId);
    setMyDeviceId(dId);
    try { setUser(JSON.parse(localStorage.getItem("user") || "null")); } catch { setUser(null); }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation(null)
      );
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [resListings, resConfig] = await Promise.all([
          fetch("/api/listings"),
          fetch("/api/admin/config").catch(() => null)
        ]);
        if (resListings && resListings.ok) {
          const data = await resListings.json();
          setItems(Array.isArray(data) ? data : []);
        } else { setItems([]); }
        if (resConfig && resConfig.ok) {
          const cfg = await resConfig.json();
          setSystemConfig(cfg);
        }
      } catch { setItems([]); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("user");
    window.location.reload();
  };

  const toggleStar = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setStarredIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const navBtnStyle = (bg = "rgba(255,255,255,0.1)", color = "#fff"): React.CSSProperties => ({
    padding: "6px 14px",
    borderRadius: "22px",
    border: "1px solid rgba(255,255,255,0.3)",
    color,
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "600",
    background: bg,
    whiteSpace: "nowrap" as const,
    cursor: "pointer",
    display: "inline-block",
    transition: "transform 0.15s, opacity 0.15s, box-shadow 0.15s",
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f8f8" }}>

      {/* ── HEADER ── */}
      <header style={{
        borderBottom: "1px solid #004d26",
        position: "sticky", top: 0,
        backgroundColor: "#006633",
        zIndex: 100,
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
      }}>
        <div style={{
          maxWidth: "1760px", margin: "0 auto",
          padding: "12px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "12px",
        }}>

          {/* Logo + phone */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <img
                  src="https://res.cloudinary.com/dm30nbwuo/image/upload/v1777648613/logo_xjxqjd.png"
                  alt="Angiahouse"
                  style={{ height: "32px", width: "auto" }}
                />
                <span style={{ fontSize: "16px", fontWeight: "700", color: "#fff", letterSpacing: "-0.5px" }}>
                  ANGIAHOUSE
                </span>
              </div>
            </Link>
            <a
              href="tel:0902225314"
              style={{
                fontSize: "13px", fontWeight: "600", color: "#fff",
                textDecoration: "none", display: "flex", alignItems: "center", gap: "4px",
                borderLeft: "2px solid rgba(255,255,255,0.3)", paddingLeft: "12px",
              }}
            >
              <span style={{ color: "#fff", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.56.57 1 1 0 011 1V21a1 1 0 01-1 1A17 17 0 013 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.56a1 1 0 01-.25 1.01l-2.2 2.22z" />
                </svg>
                <span>090.222.5314</span>
              </span>
            </a>
          </div>

          {/* Nav buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>

            {/* Nút báo lỗi — fixed góc trên trái */}
            <button
              onClick={() => {/* TODO: mở form báo lỗi */ }}
              style={{
                position: "fixed", top: "-1px", right: "-1px", zIndex: 200,
                background: "none", border: "none", boxShadow: "none",
                color: "rgba(255,255,255,0.55)", fontSize: "18px", cursor: "pointer",
                padding: "4px", lineHeight: 1,
                transition: "transform 0.15s",
              }}
              title="Báo cáo lỗi cho Admin"
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.2)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            >
              🚨
            </button>

            {/* Thông báo bảo trì */}
            {!systemConfig.globalPostEnabled && (
              <span style={{
                fontSize: "12px", color: "#fff", padding: "5px 10px",
                background: "rgba(255,255,255,0.2)", borderRadius: "22px", whiteSpace: "nowrap",
              }}>
                Bảo trì
              </span>
            )}

            {/* Đăng tin */}
            <Link
              href={(systemConfig.globalPostEnabled && user?.canPost !== false) ? "/dang-tin" : "#"}
              onClick={e => {
                if (!systemConfig.globalPostEnabled || user?.canPost === false) {
                  e.preventDefault();
                  alert("Chức năng đăng tin tạm khóa");
                }
              }}
              style={{ ...navBtnStyle("#FFD966", "#006633"), border: "none" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1.06)"; el.style.boxShadow = "0 4px 14px rgba(0,0,0,0.25)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1)"; el.style.boxShadow = "none"; }}
            >
              Đăng tin
            </Link>

            {/* Phòng trống */}
            <Link href="/phong-trong">
              <span
                style={navBtnStyle()}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1.06)"; el.style.boxShadow = "0 4px 14px rgba(0,0,0,0.25)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1)"; el.style.boxShadow = "none"; }}
              >
                Phòng trống
              </span>
            </Link>

            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

                {/* Nút dashboard — admin: cam đỏ, mod: tím */}
                {(user.role === "admin" || user.role === "mod") && (
                  <Link
                    href={user.role === "admin" ? "/admin" : "/mod"}
                    style={{
                      ...navBtnStyle(
                        user.role === "admin" ? "#FF385C" : "#9c27b0",
                        "#fff"
                      ),
                      border: "none",
                    }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1.06)"; el.style.boxShadow = "0 4px 14px rgba(0,0,0,0.25)"; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1)"; el.style.boxShadow = "none"; }}
                  >
                    {user.role === "admin" ? "Quản trị" : "Mod"}
                  </Link>
                )}

                {/* Thẻ tên — nhúc nhích khi hover */}
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "4px 4px 4px 10px",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: "21px",
                    background: "rgba(255,255,255,0.1)",
                    cursor: "default",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1.05)"; el.style.boxShadow = "0 4px 14px rgba(0,0,0,0.25)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1)"; el.style.boxShadow = "none"; }}
                >
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#fff" }}>
                      {user.username}
                    </div>
                    <div style={{
                      fontSize: "11px",
                      fontWeight: user.role === "admin" || user.role === "mod" ? "700" : "400",
                      color: user.role === "admin"
                        ? "#FF385C"
                        : user.role === "mod"
                          ? "#ce93d8"
                          : "rgba(255,255,255,0.7)",
                    }}>
                      {user.role}
                    </div>
                  </div>

                  {/* Nút logout tròn */}
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "28px", height: "28px", borderRadius: "50%",
                      background: "rgba(255,255,255,0.2)", color: "#fff",
                      border: "none", fontSize: "14px", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    ⎋
                  </button>
                </div>

              </div>
            ) : (
              <Link
                href="/login"
                style={navBtnStyle()}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1.06)"; el.style.boxShadow = "0 4px 14px rgba(0,0,0,0.25)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1)"; el.style.boxShadow = "none"; }}
              >
                Đăng nhập
              </Link>
            )}

          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main style={{ maxWidth: "1760px", margin: "0 auto", padding: "24px 20px 60px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{
              width: "40px", height: "40px",
              border: "4px solid #f3f3f3", borderTop: "4px solid #006633",
              borderRadius: "50%", margin: "0 auto 20px",
              animation: "spin 1s linear infinite",
            }} />
            <p style={{ color: "#717171" }}>Đang tải...</p>
          </div>
        ) : items.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
            {sortItems(items, userLocation).map((item) => {

              // Admin và Mod thấy tất cả, user thường không thấy tin ẩn
              if (user?.role !== "admin" && user?.role !== "mod" && item.status === "hide") return null;

              const isOwner = (item.deviceId === myDeviceId) || (user && item.userId === user._id);
              const isMod = user?.role === "mod";
              const isHovered = hoveredId === item._id;
              const avail = getAvailabilityInfo(item.availableDate);
              const starred = starredIds.has(item._id);

              return (
                <div
                  key={item._id}
                  style={{
                    position: "relative", borderRadius: "14px", background: "#fff",
                    boxShadow: isHovered ? "0 8px 28px rgba(0,0,0,0.18)" : "0 2px 10px rgba(0,0,0,0.09)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                    overflow: "hidden",
                  }}
                  onMouseEnter={() => setHoveredId(item._id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Image */}
                  <div style={{ position: "relative", width: "100%", paddingBottom: "72%", overflow: "hidden" }}>
                    <Link href={`/listing/${item._id}`} style={{ display: "block", position: "absolute", inset: 0 }}>
                      <img
                        src={item.coverImage || "/no-image.jpg"}
                        style={{
                          width: "100%", height: "100%", objectFit: "cover",
                          transition: "transform 0.3s",
                          transform: isHovered ? "scale(1.04)" : "scale(1)",
                        }}
                        alt={item.title}
                      />
                      {item.status === "hide" && (
                        <div style={{
                          position: "absolute", top: "10px", left: "10px",
                          background: "rgba(0,0,0,0.6)", color: "#fff",
                          fontSize: "11px", padding: "4px 8px", borderRadius: "5px",
                          fontWeight: "600", backdropFilter: "blur(4px)",
                        }}>
                          ĐÃ ẨN
                        </div>
                      )}
                    </Link>

                    {/* Tool ⚙️ — hiện với admin, mod, và chủ tin */}
                    {(isOwner || user?.role === "admin" || isMod) && (
                      <div style={{ position: "absolute", bottom: "10px", right: "10px", zIndex: 2 }}>
                        <details style={{ position: "relative" }}>
                          <summary style={{
                            width: "32px", height: "32px",
                            background: "none", border: "none", outline: "none",
                            cursor: "pointer", display: "flex",
                            alignItems: "center", justifyContent: "center",
                            fontSize: "18px", listStyle: "none",
                          }}>
                            ⚙️
                          </summary>
                          <div style={{
                            position: "absolute", bottom: "38px", right: 0,
                            background: "#fff", borderRadius: "10px",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                            minWidth: "130px", overflow: "hidden", zIndex: 10,
                          }}>
                            <Link
                              href={`/edit/${item._id}`}
                              style={{ display: "block", padding: "10px 16px", fontSize: "13px", color: "#222", textDecoration: "none", fontWeight: "600" }}
                            >
                              ✏️ Chỉnh sửa
                            </Link>

                            {/* Mod không được xóa tin */}
                            {!isMod && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!confirm("Xác nhận xóa tin này?")) return;
                                  const res = await fetch(`/api/listings/${item._id}`, {
                                    method: "DELETE",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      deviceId: myDeviceId,
                                      _adminOverride: user?.role === "admin",
                                    }),
                                  });
                                  if (res.ok) setItems(prev => prev.filter(i => i._id !== item._id));
                                  else alert("Lỗi xóa tin");
                                }}
                                style={{
                                  display: "block", width: "100%", padding: "10px 16px",
                                  fontSize: "13px", color: "#dc3545",
                                  background: "none", border: "none", cursor: "pointer",
                                  fontWeight: "600", textAlign: "left",
                                }}
                              >
                                🗑️ Xóa tin
                              </button>
                            )}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <Link href={`/listing/${item._id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                    <div style={{ padding: "14px 14px 10px" }}>
                      <h3 style={{
                        fontSize: "15px", fontWeight: "700", color: "#111",
                        margin: "0 0 4px 0",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {item.title}
                      </h3>
                      <p style={{
                        fontSize: "13px", color: "#666", margin: "0 0 8px 0",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        📍 {item.address || "TPHCM"}
                      </p>

                      {item.highlights && item.highlights.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "10px" }}>
                          {item.highlights.slice(0, 3).map((h: string) => (
                            <span key={h} style={{
                              fontSize: "11px", padding: "3px 8px", borderRadius: "12px",
                              background: "#e8f5e9", color: "#2e7d32", fontWeight: "500",
                            }}>
                              ✓ {h}
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={{ marginBottom: "0px" }}>
                        <span style={{ fontSize: "17px", fontWeight: "800", color: "#111" }}>
                          {item.price?.toLocaleString()} đ
                        </span>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#555" }}>/tháng</span>
                      </div>

                      <div style={{
                        display: "flex", alignItems: "center",
                        justifyContent: "space-between", gap: "0px",
                        borderTop: "0px solid #eee", paddingTop: "0px",
                      }}>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: avail.labelColor }}>
                          {avail.label}
                        </span>
                        <span style={{
                          fontSize: "11px", fontWeight: "700",
                          padding: "5px 12px", borderRadius: "12px", whiteSpace: "nowrap",
                          background: avail.btnBg, color: "#fff",
                          cursor: "pointer", transition: "opacity 0.2s",
                        }}>
                          Chi tiết ➜
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Favorite */}
                  <button
                    onClick={e => toggleStar(e, item._id)}
                    style={{
                      position: "absolute", top: "10px", right: "10px",
                      width: "34px", height: "34px",
                      background: "none", border: "none", outline: "none",
                      cursor: "pointer", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      fontSize: "22px", transition: "transform 0.2s",
                      transform: starred ? "scale(1.2)" : "scale(1)",
                      filter: starred ? "none" : "grayscale(100%)",
                    }}
                    title="Quan tâm"
                  >
                    😍
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 20px", maxWidth: "500px", margin: "0 auto" }}>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>🏘️</div>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>
              Chưa có tin đăng nào
            </h2>
            <p style={{ fontSize: "15px", color: "#717171", marginBottom: "28px" }}>
              Hãy là người đầu tiên đăng tin cho thuê nhà
            </p>
            <Link
              href="/dang-tin"
              style={{
                display: "inline-block", padding: "12px 24px", borderRadius: "8px",
                background: "#FFD966", color: "#006633",
                textDecoration: "none", fontSize: "15px", fontWeight: "700",
              }}
            >
              Đăng tin ngay
            </Link>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          details summary::-webkit-details-marker { display: none; }
          details > summary { list-style: none; outline: none; }
          button:focus { outline: none; }
        `
      }} />
    </div>
  );
}