"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

/* ─── Types ─────────────────────────────────────────────────── */
interface RoomCosts {
  elec: number;
  water: string;
  sv: string;
  bike: string;
}

interface Listing {
  _id: string;
  title: string;
  address: string;
  price: number;
  availableDate?: string | null;
  highlights?: string[];
  status?: string;
  coverImage?: string;
  costs?: Partial<RoomCosts>;
}

interface PageConfig {
  pageTitle: string;
  footerText: string;
  phongtrongTitle?: string;
  phongtrongFooter?: string;
  [key: string]: unknown;
}

/* ─── Defaults ───────────────────────────────────────────────── */
const DEFAULT_COSTS: RoomCosts = {
  elec: 4000,
  water: "100k/ng",
  sv: "200k/phòng",
  bike: "100k",
};

const DEFAULT_PHONGTRONG_TITLE  = "Phòng trọ Angiahouse - danh sách phòng trống";
const DEFAULT_PHONGTRONG_FOOTER = "Angiahouse 090.222.5314 - Phí sale 50% (HĐ6th) 70% (HĐ12th)";

/* ─── Helpers ────────────────────────────────────────────────── */
function getAvailInfo(dateStr?: string | null) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (!dateStr) return { label: "Trống sẵn", type: "now" };
  const av   = new Date(dateStr);
  const diff = Math.ceil((av.getTime() - now.getTime()) / 86400000);
  if (diff < 2)  return { label: "Trống sẵn",                             type: "now"  };
  if (diff < 30) return { label: "Trống " + av.toLocaleDateString("vi-VN"), type: "soon" };
  return            { label: "Trống " + av.toLocaleDateString("vi-VN"), type: "late" };
}

function getCosts(listing: Listing): RoomCosts {
  return {
    elec:  listing.costs?.elec  ?? DEFAULT_COSTS.elec,
    water: listing.costs?.water ?? DEFAULT_COSTS.water,
    sv:    listing.costs?.sv    ?? DEFAULT_COSTS.sv,
    bike:  listing.costs?.bike  ?? DEFAULT_COSTS.bike,
  };
}

function highlightsStr(listing: Listing): string {
  return (listing.highlights || []).join(", ");
}

/* ════════════════════════════════════════════════════════════════ */
export default function PhongTrongPage() {
  const [items,   setItems]   = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [user,    setUser]    = useState<any>(null);

  // Filter: multi-select; empty = show all
  const [filters, setFilters] = useState<Set<"now" | "soon" | "late">>(new Set());

  // Sort
  const [sortCol, setSortCol] = useState<"avail" | "price" | "address" | "elec" | "highlights">("avail");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Config (title + footer) — synced with /api/admin/config in DB
  const [pageTitle,  setPageTitle]  = useState(DEFAULT_PHONGTRONG_TITLE);
  const [footerText, setFooterText] = useState(DEFAULT_PHONGTRONG_FOOTER);
  const [editTitle,  setEditTitle]  = useState(DEFAULT_PHONGTRONG_TITLE);
  const [editFooter, setEditFooter] = useState(DEFAULT_PHONGTRONG_FOOTER);
  const [adminOpen,  setAdminOpen]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saveMsg,    setSaveMsg]    = useState("");

  // Modals
  const [selected,  setSelected]  = useState<Listing | null>(null);
  const [editCosts, setEditCosts] = useState<{ room: Listing; costs: RoomCosts } | null>(null);

  /* ── Init ── */
  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem("user") || "null")); } catch { setUser(null); }
    fetchConfig();
    fetchListings();
  }, []);

  /* ── Config: GET from DB ── */
async function fetchConfig() {
  try {
    const res = await fetch("/api/admin/config", {
      cache: "no-store",           // ← thêm dòng này
      headers: { "Pragma": "no-cache" }
    });
    if (!res.ok) return;
    const cfg: PageConfig = await res.json();
    const t = cfg.phongtrongTitle  || DEFAULT_PHONGTRONG_TITLE;
    const f = cfg.phongtrongFooter || DEFAULT_PHONGTRONG_FOOTER;
    setPageTitle(t);  setEditTitle(t);
    setFooterText(f); setEditFooter(f);
  } catch {}
}

  /* ── Config: POST (merge) to DB ── */
  async function saveConfig() {
  setSaving(true); setSaveMsg("");
  try {
    const existing: PageConfig = await fetch("/api/admin/config", { cache: "no-store" })
      .then(r => r.json()).catch(() => ({}));
    const res = await fetch("/api/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...existing, phongtrongTitle: editTitle, phongtrongFooter: editFooter }),
    });
    if (res.ok) {
      setPageTitle(editTitle);
      setFooterText(editFooter);
      setSaveMsg("✅ Đã lưu");
      setTimeout(() => { setSaveMsg(""); setAdminOpen(false); }, 1500);
    } else {
      setSaveMsg("❌ Lỗi lưu");
    }
  } catch {
    setSaveMsg("❌ Lỗi kết nối");
  } finally { setSaving(false); }
}

  /* ── Listings ── */
  async function fetchListings() {
    setLoading(true);
    try {
      const res = await fetch("/api/listings");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const overrides = getCostsOverrides();
          setItems(data.map((item: Listing) => ({
            ...item,
            costs: overrides[item._id] ?? item.costs,
          })));
        }
      }
    } catch {}
    finally { setLoading(false); }
  }

  /* ── Costs overrides (localStorage).
     TODO: khi Listing schema có field `costs`, dùng PATCH /api/listings/:id thay thế ── */
  function getCostsOverrides(): Record<string, Partial<RoomCosts>> {
    try { return JSON.parse(localStorage.getItem("phongtrong_costs") || "{}"); }
    catch { return {}; }
  }
  function saveCostsOverride(roomId: string, costs: RoomCosts) {
    const ov = getCostsOverrides();
    ov[roomId] = costs;
    localStorage.setItem("phongtrong_costs", JSON.stringify(ov));
    setItems(prev => prev.map(i => i._id === roomId ? { ...i, costs } : i));
  }

  /* ── Filter ── */
  function toggleFilter(f: "now" | "soon" | "late") {
    setFilters(prev => {
      const n = new Set(prev);
      n.has(f) ? n.delete(f) : n.add(f);
      return n;
    });
  }

  /* ── Sort ── */
  function toggleSort(col: typeof sortCol) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  const isAdmin = user?.role === "admin";
  const GREEN = "#006633";

  const filtered = items.filter(r => {
    if (!isAdmin && r.status === "hide") return false;
    if (filters.size === 0) return true;
    return filters.has(getAvailInfo(r.availableDate).type as "now" | "soon" | "late");
  });

  const sorted = [...filtered].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1;
    switch (sortCol) {
      case "price":      return (a.price - b.price) * mul;
      case "elec":       return (getCosts(a).elec - getCosts(b).elec) * mul;
      case "address":    return a.address.localeCompare(b.address, "vi") * mul;
      case "highlights": return highlightsStr(a).localeCompare(highlightsStr(b), "vi") * mul;
      default: { // avail
        const ta = a.availableDate ? new Date(a.availableDate).getTime() : 0;
        const tb = b.availableDate ? new Date(b.availableDate).getTime() : 0;
        return (ta - tb) * mul;
      }
    }
  });

  /* ── Style helpers ── */
  const sortIcon = (col: typeof sortCol) =>
    sortCol === col ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕";

  const tagStyle = (type: string): React.CSSProperties => ({
    display: "inline-block", padding: "1px 7px", borderRadius: "10px",
    fontSize: "10px", fontWeight: 600, whiteSpace: "nowrap" as const,
    background: type === "now" ? "#e8f5e9" : type === "soon" ? "#fff8e1" : "#f5f5f5",
    color:      type === "now" ? "#2e7d32" : type === "soon" ? "#b08500" : "#888",
  });

  const thBase: React.CSSProperties = {
    padding: "6px 8px", textAlign: "left", color: "#fff", fontSize: "11px",
    fontWeight: 600, whiteSpace: "nowrap", background: GREEN,
  };
  const thSort:   React.CSSProperties = { ...thBase, cursor: "pointer",  userSelect: "none" };
  const thNoSort: React.CSSProperties = { ...thBase, cursor: "default" };
  const tdStyle:  React.CSSProperties = {
    padding: "4px 8px", verticalAlign: "middle", fontSize: "11px", color: "#333", lineHeight: "1.3",
  };

  const filterBtn = (active: boolean, type: "now" | "soon" | "late"): React.CSSProperties => {
    const m = {
      now:  { bg: "#e8f5e9", color: "#2e7d32", act: "#2e7d32" },
      soon: { bg: "#fff8e1", color: "#b08500", act: "#b08500" },
      late: { bg: "#f5f5f5", color: "#666",    act: "#555"    },
    };
    const c = m[type];
    return {
      padding: "4px 11px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
      background: active ? c.act : c.bg, color: active ? "#fff" : c.color,
      border: `1px solid ${active ? c.act : "transparent"}`, transition: "all .15s",
    };
  };

  /* ══════════════════════ RENDER ══════════════════════ */
  return (
    <div style={{ minHeight: "100vh", background: "#f8f8f8" }}>

      {/* ── Header ── */}
      <header style={{ background: GREEN, borderBottom: "1px solid #004d26", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
              <img src="https://res.cloudinary.com/dm30nbwuo/image/upload/v1777648613/logo_xjxqjd.png" alt="Angiahouse" style={{ height: 28, width: "auto" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>ANGIAHOUSE</span>
            </Link>
            <a href="tel:0902225314" style={{ fontSize: 12, fontWeight: 600, color: "#fff", textDecoration: "none", borderLeft: "2px solid rgba(255,255,255,0.3)", paddingLeft: 12, marginLeft: 4 }}>
              📞 090.222.5314
            </a>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {isAdmin && (
              <button onClick={() => setAdminOpen(v => !v)}
                style={{ padding: "5px 12px", borderRadius: 22, border: "1px solid rgba(255,255,255,0.3)", color: "#FFD966", background: "rgba(255,255,255,0.1)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                ⚙️ Admin
              </button>
            )}
            <Link href="/" style={{ padding: "5px 12px", borderRadius: 22, border: "1px solid rgba(255,255,255,0.3)", color: "#fff", background: "rgba(255,255,255,0.1)", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
              ← Trang chủ
            </Link>
          </div>
        </div>
      </header>

      {/* ── Admin Config Bar ── */}
      {isAdmin && adminOpen && (
        <div style={{ background: "#fff8e1", borderBottom: "2px solid #ffe082", padding: "10px 20px", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#b08500", whiteSpace: "nowrap" }}>✏️ Tiêu đề:</span>
          <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
            style={{ flex: 1, minWidth: 200, fontSize: 12, padding: "4px 9px", borderRadius: 7, border: "1px solid #ffe082", background: "#fffde7" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#b08500", whiteSpace: "nowrap" }}>✏️ Footer:</span>
          <input value={editFooter} onChange={e => setEditFooter(e.target.value)}
            style={{ flex: 1, minWidth: 220, fontSize: 12, padding: "4px 9px", borderRadius: 7, border: "1px solid #ffe082", background: "#fffde7" }} />
          <button onClick={saveConfig} disabled={saving}
            style={{ padding: "5px 14px", borderRadius: 20, border: "none", background: GREEN, color: "#fff", fontSize: 12, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "⏳ Đang lưu..." : "💾 Lưu DB"}
          </button>
          {saveMsg && <span style={{ fontSize: 12, fontWeight: 600 }}>{saveMsg}</span>}
        </div>
      )}

      {/* ── Main ── */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 14px 0" }}>

        {/* Filter bar */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#555", marginRight: 2 }}>Lọc:</span>
          {(["now", "soon", "late"] as const).map(f => (
            <button key={f} onClick={() => toggleFilter(f)} style={filterBtn(filters.has(f), f)}>
              ✓ {f === "now" ? "Trống sẵn" : f === "soon" ? "Dưới 1 tháng" : "Trên 1 tháng"}
            </button>
          ))}
          {filters.size > 0 && (
            <button onClick={() => setFilters(new Set())}
              style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "#fee", color: "#c00", border: "1px solid #fcc" }}>
              ✕ Xoá lọc
            </button>
          )}
          <span style={{ fontSize: 11, color: "#aaa", marginLeft: 2 }}>{sorted.length} phòng</span>
        </div>

        {/* Table block: title + table + footer */}
        <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", marginBottom: 24 }}>

          {/* Tiêu đề (từ DB) */}
          <div style={{ padding: "8px 12px 6px", fontSize: 13, fontWeight: 700, color: GREEN, borderBottom: "1px solid #e8f5e9" }}>
            {pageTitle}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 50 }}>
              <div style={{ width: 32, height: 32, border: "3px solid #eee", borderTop: `3px solid ${GREEN}`, borderRadius: "50%", margin: "0 auto 10px", animation: "spin 1s linear infinite" }} />
              <p style={{ color: "#aaa", fontSize: 12 }}>Đang tải...</p>
            </div>
          ) : sorted.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#aaa", fontSize: 13 }}>Không có phòng nào phù hợp.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr>
                    <th style={{ ...thBase, width: 24 }}>#</th>
                    <th style={thSort}   onClick={() => toggleSort("address")}>    Phòng / Địa chỉ{sortIcon("address")}</th>
                    <th style={thSort}   onClick={() => toggleSort("highlights")}>  Đặc điểm{sortIcon("highlights")}</th>
                    <th style={thSort}   onClick={() => toggleSort("price")}>       Giá{sortIcon("price")}</th>
                    <th style={thSort}   onClick={() => toggleSort("elec")}>        Điện{sortIcon("elec")}</th>
                    <th style={thNoSort}>Nước</th>
                    <th style={thNoSort}>DV</th>
                    <th style={thNoSort}>Xe</th>
                    <th style={thSort}   onClick={() => toggleSort("avail")}>       Trạng thái{sortIcon("avail")}</th>
                    {isAdmin && <th style={thNoSort}>Sửa CP</th>}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((room, idx) => {
                    const av    = getAvailInfo(room.availableDate);
                    const costs = getCosts(room);
                    return (
                      <tr key={room._id}
                        style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f0faf5")}
                        onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                        onClick={() => setSelected(room)}>
                        <td style={{ ...tdStyle, color: "#bbb", fontWeight: 600, fontSize: 10 }}>{idx + 1}</td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 700, color: "#111", marginBottom: 1, fontSize: 11 }}>{room.title}</div>
                          <div style={{ fontSize: 10, color: "#999" }}>📍 {room.address || "TPHCM"}</div>
                          {isAdmin && room.status === "hide" && (
                            <span style={{ fontSize: 9, background: "#fee", color: "#c00", padding: "1px 5px", borderRadius: 8, fontWeight: 600 }}>Ẩn</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                            {(room.highlights || []).slice(0, 2).map((h, i) => (
                              <span key={i} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 10, background: "#e8f5e9", color: "#2e7d32", fontWeight: 500 }}>{h}</span>
                            ))}
                          </div>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: "#111", whiteSpace: "nowrap" }}>
                          {(room.price / 1000000).toFixed(1)}tr
                        </td>
                        <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{(costs.elec / 1000).toFixed(0)}k/kWh</td>
                        <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{costs.water}</td>
                        <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{costs.sv}</td>
                        <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{costs.bike}</td>
                        <td style={tdStyle}><span style={tagStyle(av.type)}>{av.label}</span></td>
                        {isAdmin && (
                          <td style={tdStyle} onClick={e => { e.stopPropagation(); setEditCosts({ room, costs: { ...costs } }); }}>
                            <button style={{ padding: "2px 8px", borderRadius: 7, border: `1px solid ${GREEN}`, background: "#f0faf5", color: GREEN, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                              ✏️ Sửa
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Banner (từ DB) */}
          <div style={{ background: GREEN, color: "#fff", textAlign: "center", padding: "7px 16px", fontSize: 11, fontWeight: 600 }}>
            {footerText}
          </div>
        </div>
      </main>

      {/* ── Modal: Chi tiết phòng ── */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setSelected(null)}>
          <div style={{ background: "#fff", borderRadius: 16, maxWidth: 460, width: "100%", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ background: GREEN, borderRadius: "16px 16px 0 0", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{selected.title}</div>
                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 3 }}>📍 {selected.address}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.8)", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: "16px 18px" }}>
              {selected.coverImage
                ? <img src={selected.coverImage} alt={selected.title} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10, marginBottom: 14 }} />
                : <div style={{ width: "100%", height: 100, background: "linear-gradient(135deg,#e8f5e9,#c8e6c9)", borderRadius: 10, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🏠</div>
              }
              {(selected.highlights || []).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                  {selected.highlights!.map((h, i) => (
                    <span key={i} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 10, background: "#e8f5e9", color: "#2e7d32", fontWeight: 500 }}>✓ {h}</span>
                  ))}
                </div>
              )}
              {([
                { label: "Giá thuê",   value: <span style={{ color: GREEN, fontSize: 15, fontWeight: 700 }}>{selected.price.toLocaleString()} đ/tháng</span> },
                { label: "Tiền điện", value: `${(getCosts(selected).elec / 1000).toFixed(0)}k đồng/kWh` },
                { label: "Tiền nước", value: getCosts(selected).water },
                { label: "Dịch vụ",  value: getCosts(selected).sv },
                { label: "Giữ xe",   value: getCosts(selected).bike },
                { label: "Trạng thái", value: <span style={tagStyle(getAvailInfo(selected.availableDate).type)}>{getAvailInfo(selected.availableDate).label}</span> },
              ]).map(({ label, value }, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #f5f5f5" }}>
                  <span style={{ fontSize: 12, color: "#888" }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{value}</span>
                </div>
              ))}
              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <a href="tel:0902225314" style={{ flex: 1, textAlign: "center", padding: "11px", background: "#E61E4D", color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                  📞 Gọi ngay
                </a>
                <Link href={`/listing/${selected._id}`} onClick={() => setSelected(null)}
                  style={{ flex: 1, textAlign: "center", padding: "11px", background: GREEN, color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                  Xem chi tiết →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Sửa chi phí (Admin) ── */}
      {editCosts && isAdmin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setEditCosts(null)}>
          <div style={{ background: "#fff", borderRadius: 14, maxWidth: 380, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ background: "#fff8e1", borderRadius: "14px 14px 0 0", padding: "12px 18px", borderBottom: "1px solid #ffe082" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#b08500" }}>✏️ Sửa chi phí phòng</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{editCosts.room.title}</div>
            </div>
            <div style={{ padding: "14px 18px" }}>
              {([
                { key: "elec",  label: "Tiền điện (đ/kWh)", type: "number", placeholder: "4000" },
                { key: "water", label: "Tiền nước",          type: "text",   placeholder: "100k/ng" },
                { key: "sv",    label: "Dịch vụ",            type: "text",   placeholder: "200k/phòng" },
                { key: "bike",  label: "Giữ xe",             type: "text",   placeholder: "100k" },
              ] as const).map(({ key, label, type, placeholder }) => (
                <div key={key} style={{ marginBottom: 10 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 3 }}>{label}</label>
                  <input type={type} value={editCosts.costs[key] as string} placeholder={placeholder}
                    onChange={e => setEditCosts(prev => prev ? {
                      ...prev, costs: { ...prev.costs, [key]: type === "number" ? Number(e.target.value) : e.target.value }
                    } : null)}
                    style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 12, boxSizing: "border-box" }} />
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button onClick={() => setEditCosts(null)}
                  style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1px solid #ddd", background: "#f5f5f5", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Hủy
                </button>
                <button onClick={() => { saveCostsOverride(editCosts.room._id, editCosts.costs); setEditCosts(null); }}
                  style={{ flex: 1, padding: "9px", borderRadius: 10, border: "none", background: GREEN, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  💾 Lưu
                </button>
              </div>
              <div style={{ fontSize: 10, color: "#aaa", marginTop: 8, textAlign: "center" }}>
                * Chi phí lưu local. Thêm field <code>costs</code> vào Listing schema để lưu DB.
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box;}` }} />
    </div>
  );
}