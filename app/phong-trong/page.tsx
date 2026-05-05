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
  description?: string;
  coverImage?: string;
  images?: string[];
  status?: string;           // "active" | "hide"
  category?: string;
  amenities?: string[];
  contactPhone?: string;
  deviceId?: string;
  userId?: string;
  availableDate?: string | null;
  highlights?: string[];
  autoHideDays?: number | null;
  autoDeleteDays?: number | null;
  costs?: Partial<RoomCosts>;
  ownerUsername?: string;    // populated từ userId
}

/* Draft khi admin/mod đang chỉnh sửa 1 tin */
interface EditDraft {
  room: Listing;
  price: number;
  availableDate: string;     // "YYYY-MM-DD" hoặc ""
  status: "active" | "hide";
  costs: RoomCosts;
  saving: boolean;
  saveMsg: string;
}

interface CurrentUser {
  _id?: string;
  username?: string;
  role?: "user" | "mod" | "admin" | "guest";
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
  if (diff < 2)  return { label: "Trống sẵn",                              type: "now"  };
  if (diff < 30) return { label: "Trống " + av.toLocaleDateString("vi-VN"), type: "soon" };
  return             { label: "Trống " + av.toLocaleDateString("vi-VN"), type: "late" };
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

/** ISO date string → "YYYY-MM-DD" cho <input type="date"> */
function toDateInput(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/* ── Keyword filter helpers ── */
function parseKeywords(raw: string): string[] {
  return raw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
}

function buildHaystack(listing: Listing): string {
  const costs = listing.costs;
  return [
    listing.title,
    listing.address,
    listing.price != null ? String(listing.price) : "",
    listing.price != null ? (listing.price / 1_000_000).toFixed(1) + "tr" : "",
    listing.contactPhone ?? "",
    listing.availableDate
      ? new Date(listing.availableDate).toLocaleDateString("vi-VN")
      : "trống sẵn",
    ...(listing.highlights ?? []),
    ...(listing.amenities  ?? []),
    listing.description ?? "",
    listing.category    ?? "",
    listing.ownerUsername ?? "",
    costs?.elec != null ? `${costs.elec} ${(Number(costs.elec) / 1000).toFixed(0)}k` : "",
    costs?.water ?? "",
    costs?.sv    ?? "",
    costs?.bike  ?? "",
  ].join(" ").toLowerCase();
}

function matchesKeywords(listing: Listing)    { const h = buildHaystack(listing); return (kw: string[]) => kw.every(k => h.includes(k));  }
function matchesAnyKeyword(listing: Listing)  { const h = buildHaystack(listing); return (kw: string[]) => kw.some(k  => h.includes(k));  }

/* ════════════════════════════════════════════════════════════════ */
export default function PhongTrongPage() {
  const [items,   setItems]   = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [user,    setUser]    = useState<CurrentUser | null>(null);

  // Availability filter
  const [filters, setFilters] = useState<Set<"now" | "soon" | "late">>(new Set());

  // Status filter cho admin/mod: "active" | "hide" | "all" — mặc định "active"
  const [statusFilter, setStatusFilter] = useState<"active" | "hide" | "all">("active");

  // Keyword filters
  const [andKeywords, setAndKeywords] = useState("");
  const [orKeywords,  setOrKeywords]  = useState("");
  const [notKeywords, setNotKeywords] = useState("");

  // Sort
  const [sortCol, setSortCol] = useState<"avail" | "price" | "address" | "elec" | "highlights">("avail");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Config bar
  const [pageTitle,  setPageTitle]  = useState(DEFAULT_PHONGTRONG_TITLE);
  const [footerText, setFooterText] = useState(DEFAULT_PHONGTRONG_FOOTER);
  const [editTitle,  setEditTitle]  = useState(DEFAULT_PHONGTRONG_TITLE);
  const [editFooter, setEditFooter] = useState(DEFAULT_PHONGTRONG_FOOTER);
  const [adminOpen,  setAdminOpen]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saveMsg,    setSaveMsg]    = useState("");

  // Chế độ chỉnh sửa (admin/mod bật thì click vào row mở EditModal thay vì ViewModal)
  const [editMode, setEditMode] = useState(false);

  // View modal (xem chi tiết)
  const [selected, setSelected] = useState<Listing | null>(null);

  // Edit modal (admin/mod chỉnh sửa tin)
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);

  /* ── Init ── */
  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem("user") || "null")); } catch { setUser(null); }
    fetchConfig();
    fetchListings();
  }, []);

  /* ── Config: GET ── */
  async function fetchConfig() {
    try {
      const res = await fetch("/api/admin/config", { cache: "no-store" });
      if (!res.ok) return;
      const cfg: PageConfig = await res.json();
      const t = cfg.phongtrongTitle  || DEFAULT_PHONGTRONG_TITLE;
      const f = cfg.phongtrongFooter || DEFAULT_PHONGTRONG_FOOTER;
      setPageTitle(t);  setEditTitle(t);
      setFooterText(f); setEditFooter(f);
    } catch {}
  }

  /* ── Config: POST ── */
  async function saveConfig() {
    setSaving(true); setSaveMsg("");
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phongtrongTitle: editTitle, phongtrongFooter: editFooter }),
      });
      if (res.ok) {
        setPageTitle(editTitle); setFooterText(editFooter);
        setSaveMsg("✅ Đã lưu");
        setTimeout(() => { setSaveMsg(""); setAdminOpen(false); }, 1500);
      } else { setSaveMsg("❌ Lỗi lưu"); }
    } catch { setSaveMsg("❌ Lỗi kết nối"); }
    finally { setSaving(false); }
  }

  /* ── Listings ── */
  async function fetchListings() {
    setLoading(true);
    try {
      const res = await fetch("/api/listings");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const ov = getCostsOverrides();
          setItems(data.map((item: Listing) => ({ ...item, costs: ov[item._id] ?? item.costs })));
        }
      }
    } catch {}
    finally { setLoading(false); }
  }

  /* ── Costs overrides (localStorage) ── */
  function getCostsOverrides(): Record<string, Partial<RoomCosts>> {
    try { return JSON.parse(localStorage.getItem("phongtrong_costs") || "{}"); }
    catch { return {}; }
  }
  function saveCostsOverride(roomId: string, costs: RoomCosts) {
    const ov = getCostsOverrides();
    ov[roomId] = costs;
    localStorage.setItem("phongtrong_costs", JSON.stringify(ov));
  }

  /* ── Mở EditDraft khi click row trong edit mode ── */
  function openEditDraft(room: Listing) {
    setEditDraft({
      room,
      price: room.price,
      availableDate: toDateInput(room.availableDate),
      status: (room.status === "hide" ? "hide" : "active") as "active" | "hide",
      costs: getCosts(room),
      saving: false,
      saveMsg: "",
    });
  }

  /* ── Lưu EditDraft ── */
  async function saveEditDraft() {
    if (!editDraft) return;
    setEditDraft(p => p ? { ...p, saving: true, saveMsg: "" } : null);

    const { room, price, availableDate, status, costs } = editDraft;

    // 1. Lưu costs vào localStorage
    saveCostsOverride(room._id, costs);

    // 2. PATCH lên API (price, availableDate, status)
    try {
      const body: Record<string, unknown> = {
        price,
        status,
        availableDate: availableDate ? new Date(availableDate).toISOString() : null,
      };
      const res = await fetch(`/api/listings/${room._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        // Cập nhật local state
        setItems(prev => prev.map(i =>
          i._id === room._id
            ? { ...i, price, availableDate: availableDate || null, status, costs }
            : i
        ));
        setEditDraft(p => p ? { ...p, saving: false, saveMsg: "✅ Đã lưu" } : null);
        setTimeout(() => setEditDraft(null), 1200);
      } else {
        // Dù API lỗi vẫn lưu costs local + cập nhật state
        setItems(prev => prev.map(i =>
          i._id === room._id ? { ...i, costs } : i
        ));
        setEditDraft(p => p ? { ...p, saving: false, saveMsg: "⚠️ Lưu CP thành công, API lỗi" } : null);
      }
    } catch {
      setItems(prev => prev.map(i =>
        i._id === room._id ? { ...i, costs } : i
      ));
      setEditDraft(p => p ? { ...p, saving: false, saveMsg: "⚠️ Lưu CP thành công, mất kết nối" } : null);
    }
  }

  /* ── Filter / Sort ── */
  function toggleFilter(f: "now" | "soon" | "late") {
    setFilters(prev => { const n = new Set(prev); n.has(f) ? n.delete(f) : n.add(f); return n; });
  }
  function toggleSort(col: typeof sortCol) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  const isAdmin = user?.role === "admin";
  const isMod   = user?.role === "mod";
  const canEdit = isAdmin || isMod;
  const GREEN   = "#006633";

  const andKw = parseKeywords(andKeywords);
  const orKw  = parseKeywords(orKeywords);
  const notKw = parseKeywords(notKeywords);

  const filtered = items.filter(r => {
    // Lọc status
    if (canEdit) {
      if (statusFilter === "active" && r.status === "hide") return false;
      if (statusFilter === "hide"   && r.status !== "hide") return false;
    } else {
      if (r.status === "hide") return false;
    }
    // Lọc ngày trống
    if (filters.size > 0 && !filters.has(getAvailInfo(r.availableDate).type as "now" | "soon" | "late")) return false;
    // Keyword
    if (andKw.length > 0 && !matchesKeywords(r)(andKw))   return false;
    if (orKw.length  > 0 && !matchesAnyKeyword(r)(orKw))  return false;
    if (notKw.length > 0 &&  matchesAnyKeyword(r)(notKw)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1;
    switch (sortCol) {
      case "price":      return (a.price - b.price) * mul;
      case "elec":       return (getCosts(a).elec - getCosts(b).elec) * mul;
      case "address":    return a.address.localeCompare(b.address, "vi") * mul;
      case "highlights": return highlightsStr(a).localeCompare(highlightsStr(b), "vi") * mul;
      default: {
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
  const thSort:   React.CSSProperties = { ...thBase, cursor: "pointer", userSelect: "none" };
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

  const statusBtn = (val: "active" | "hide" | "all"): React.CSSProperties => ({
    padding: "4px 11px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
    background: statusFilter === val
      ? (val === "hide" ? "#c00" : val === "active" ? GREEN : "#555")
      : (val === "hide" ? "#fee" : val === "active" ? "#e8f5e9" : "#f0f0f0"),
    color: statusFilter === val ? "#fff"
      : (val === "hide" ? "#c00" : val === "active" ? GREEN : "#555"),
    border: `1px solid ${statusFilter === val
      ? (val === "hide" ? "#c00" : val === "active" ? GREEN : "#555")
      : "transparent"}`,
    transition: "all .15s",
  });

  const kwInputStyle: React.CSSProperties = {
    padding: "4px 10px", borderRadius: 8, fontSize: 11, border: "1px solid #ddd",
    background: "#fff", outline: "none", minWidth: 140, width: "100%",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "6px 10px", borderRadius: 8,
    border: "1px solid #ddd", fontSize: 12, boxSizing: "border-box" as const,
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
            {canEdit && (
              <>
                {/* Nút bật/tắt edit mode */}
                <button
                  onClick={() => setEditMode(v => !v)}
                  className={editMode ? "header-btn header-btn--edit-on" : "header-btn header-btn--edit-off"}
                >
                  {editMode ? "✏️ Đang sửa" : "✏️ Chỉnh sửa"}
                </button>
                {/* Nút Admin/Mod config */}
                <button
                  onClick={() => setAdminOpen(v => !v)}
                  className="header-btn header-btn--yellow"
                >
                  ⚙️ {isAdmin ? "Admin" : "Mod"}
                </button>
              </>
            )}
            <Link href="/" className="header-btn header-btn--ghost">← Trang chủ</Link>
            <Link href="/dang-tin" className="dang-tin-btn">Đăng tin</Link>
          </div>
        </div>
      </header>

      {/* ── Admin/Mod Config Bar ── */}
      {canEdit && adminOpen && (
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

      {/* ── Thanh báo edit mode ── */}
      {canEdit && editMode && (
        <div style={{ background: "#fff3cd", borderBottom: "2px solid #ffc107", padding: "6px 20px", fontSize: 12, fontWeight: 600, color: "#856404", textAlign: "center" }}>
          ✏️ Chế độ chỉnh sửa đang bật — Nhấn vào dòng tin để chỉnh sửa nội dung
        </div>
      )}

      {/* ── Main ── */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 14px 0" }}>

        {/* ── Filter bar ── */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#555", marginRight: 2 }}>Lọc:</span>

          {/* Availability */}
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

          {/* Status filter — chỉ cho admin/mod */}
          {canEdit && (
            <>
              <span style={{ fontSize: 11, color: "#bbb", margin: "0 2px" }}>|</span>
              <button onClick={() => setStatusFilter("active")} style={statusBtn("active")}>✓ Đang hiện</button>
              <button onClick={() => setStatusFilter("hide")}   style={statusBtn("hide")}> Đang ẩn</button>
              <button onClick={() => setStatusFilter("all")}    style={statusBtn("all")}>Tất cả</button>
            </>
          )}

          <span style={{ fontSize: 11, color: "#aaa", marginLeft: 2 }}>{sorted.length} phòng</span>
        </div>

        {/* ── Keyword filter bar ── */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10, alignItems: "center", background: "#fff", borderRadius: 10, padding: "8px 12px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #eee" }}>
          {/* AND */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, flex: "1 1 160px", minWidth: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 6, background: "#e8f5e9", color: "#2e7d32", whiteSpace: "nowrap", flexShrink: 0 }}>AND</span>
            <input value={andKeywords} onChange={e => setAndKeywords(e.target.value)}
              placeholder="tất cả từ khóa (phân cách bằng ,)"
              style={{ ...kwInputStyle, borderColor: andKeywords ? "#81c784" : "#ddd" }} />
            {andKeywords && <button onClick={() => setAndKeywords("")} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 14, flexShrink: 0, padding: "0 2px" }}>✕</button>}
          </div>
          {/* OR */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, flex: "1 1 160px", minWidth: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 6, background: "#e3f2fd", color: "#1565c0", whiteSpace: "nowrap", flexShrink: 0 }}>OR</span>
            <input value={orKeywords} onChange={e => setOrKeywords(e.target.value)}
              placeholder="bất kỳ từ khóa (phân cách bằng ,)"
              style={{ ...kwInputStyle, borderColor: orKeywords ? "#64b5f6" : "#ddd" }} />
            {orKeywords && <button onClick={() => setOrKeywords("")} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 14, flexShrink: 0, padding: "0 2px" }}>✕</button>}
          </div>
          {/* NOT */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, flex: "1 1 160px", minWidth: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 6, background: "#fce4ec", color: "#c62828", whiteSpace: "nowrap", flexShrink: 0 }}>NOT</span>
            <input value={notKeywords} onChange={e => setNotKeywords(e.target.value)}
              placeholder="loại trừ từ khóa (phân cách bằng ,)"
              style={{ ...kwInputStyle, borderColor: notKeywords ? "#e57373" : "#ddd" }} />
            {notKeywords && <button onClick={() => setNotKeywords("")} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 14, flexShrink: 0, padding: "0 2px" }}>✕</button>}
          </div>
          {(andKeywords || orKeywords || notKeywords) && (
            <button onClick={() => { setAndKeywords(""); setOrKeywords(""); setNotKeywords(""); }}
              style={{ padding: "3px 9px", borderRadius: 14, fontSize: 10, fontWeight: 600, cursor: "pointer", background: "#fee", color: "#c00", border: "1px solid #fcc", whiteSpace: "nowrap", flexShrink: 0 }}>
              ✕ Xoá từ khóa
            </button>
          )}
        </div>

        {/* Table block */}
        <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", marginBottom: 24 }}>

          {/* Tiêu đề */}
          <div style={{ padding: "8px 12px 6px", borderBottom: "1px solid #e8f5e9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: GREEN }}>{pageTitle}</div>
            <div style={{ fontSize: 10, color: "#999", fontStyle: "italic", whiteSpace: "nowrap" }}>
              Cập nhật: {new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </div>
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
                    <th style={thNoSort}>Đậu xe</th>
                    <th style={thSort}   onClick={() => toggleSort("avail")}>       Trạng thái{sortIcon("avail")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((room, idx) => {
                    const av    = getAvailInfo(room.availableDate);
                    const costs = getCosts(room);
                    const isHidden = room.status === "hide";
                    return (
                      <tr key={room._id}
                        style={{
                          borderBottom: "1px solid #f0f0f0", cursor: "pointer",
                          opacity: isHidden ? 0.6 : 1,
                          background: isHidden ? "#fff8f8" : undefined,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = editMode && canEdit ? "#fffde7" : "#f0faf5")}
                        onMouseLeave={e => (e.currentTarget.style.background = isHidden ? "#fff8f8" : "#fff")}
                        onClick={() => {
                          if (canEdit && editMode) openEditDraft(room);
                          else setSelected(room);
                        }}>
                        <td style={{ ...tdStyle, color: "#bbb", fontWeight: 600, fontSize: 10 }}>{idx + 1}</td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 700, color: "#111", marginBottom: 1, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                            {room.title}
                            {isHidden && <span style={{ fontSize: 9, background: "#fee", color: "#c00", padding: "1px 5px", borderRadius: 8, fontWeight: 600, flexShrink: 0 }}>Ẩn</span>}
                          </div>
                          <div style={{ fontSize: 10, color: "#999" }}>📍 {room.address || "TPHCM"}</div>
                          {room.ownerUsername && <div style={{ fontSize: 9, color: "#bbb", marginTop: 1 }}>👤 {room.ownerUsername}</div>}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                            {(room.highlights || []).slice(0, 2).map((h, i) => (
                              <span key={i} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 10, background: "#e8f5e9", color: "#2e7d32", fontWeight: 500 }}>{h}</span>
                            ))}
                            {(room.amenities || []).slice(0, 1).map((a, i) => (
                              <span key={"a" + i} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 10, background: "#e3f2fd", color: "#1565c0", fontWeight: 500 }}>{a}</span>
                            ))}
                          </div>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: "#111", whiteSpace: "nowrap" }}>
                          {(room.price / 1_000_000).toFixed(1)}tr
                        </td>
                        <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{(costs.elec / 1000).toFixed(0)}k/kWh</td>
                        <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{costs.water}</td>
                        <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{costs.sv}</td>
                        <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{costs.bike}</td>
                        <td style={tdStyle}><span style={tagStyle(av.type)}>{av.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Banner */}
          <div style={{ background: GREEN, color: "#fff", textAlign: "center", padding: "7px 16px", fontSize: 11, fontWeight: 600 }}>
            {footerText}
          </div>
        </div>
      </main>

      {/* ════════════ Modal: Xem chi tiết (user thường) ════════════ */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setSelected(null)}>
          <div style={{ background: "#fff", borderRadius: 16, maxWidth: 460, width: "100%", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ background: GREEN, borderRadius: "16px 16px 0 0", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{selected.title}</div>
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 3 }}>📍 {selected.address}</div>
                {selected.contactPhone && (
                  <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 }}>📞 {selected.contactPhone}</div>
                )}
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.8)", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: "16px 18px" }}>
              {selected.coverImage
                ? <img src={selected.coverImage} alt={selected.title} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10, marginBottom: 14 }} />
                : <div style={{ width: "100%", height: 100, background: "linear-gradient(135deg,#e8f5e9,#c8e6c9)", borderRadius: 10, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🏠</div>
              }
              {(selected.highlights || []).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                  {selected.highlights!.map((h, i) => <span key={i} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 10, background: "#e8f5e9", color: "#2e7d32", fontWeight: 500 }}>✓ {h}</span>)}
                </div>
              )}
              {(selected.amenities || []).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                  {selected.amenities!.map((a, i) => <span key={i} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 10, background: "#e3f2fd", color: "#1565c0", fontWeight: 500 }}>🛋 {a}</span>)}
                </div>
              )}
              {selected.description && (
                <div style={{ fontSize: 12, color: "#555", background: "#f9f9f9", borderRadius: 8, padding: "8px 10px", marginBottom: 10, lineHeight: 1.6, whiteSpace: "pre-line" }}>
                  {selected.description}
                </div>
              )}
              {([
                { label: "Giá thuê",    value: <span style={{ color: GREEN, fontSize: 15, fontWeight: 700 }}>{selected.price.toLocaleString()} đ/tháng</span> },
                { label: "Tiền điện",  value: `${(getCosts(selected).elec / 1000).toFixed(0)}k đồng/kWh` },
                { label: "Tiền nước",  value: getCosts(selected).water },
                { label: "Dịch vụ",   value: getCosts(selected).sv },
                { label: "Đậu xe",    value: getCosts(selected).bike },
                { label: "Trạng thái", value: <span style={tagStyle(getAvailInfo(selected.availableDate).type)}>{getAvailInfo(selected.availableDate).label}</span> },
              ]).map(({ label, value }, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <span style={{ fontSize: 13, color: "#444", fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{value}</span>
                </div>
              ))}
              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <a href={`tel:${selected.contactPhone || "0902225314"}`}
                  style={{ flex: 1, textAlign: "center", padding: "11px", background: "#E61E4D", color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
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

      {/* ════════════ Modal: Chỉnh sửa tin (Admin + Mod) ════════════ */}
      {editDraft && canEdit && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setEditDraft(null)}>
          <div style={{ background: "#fff", borderRadius: 16, maxWidth: 480, width: "100%", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.22)" }}
            onClick={e => e.stopPropagation()}>

            {/* Header modal */}
            <div style={{ background: "#fff8e1", borderRadius: "16px 16px 0 0", padding: "13px 18px", borderBottom: "2px solid #ffe082", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#7a5c00" }}>✏️ Chỉnh sửa tin đăng</div>
                <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{editDraft.room.title}</div>
              </div>
              <button onClick={() => setEditDraft(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#aaa", lineHeight: 1 }}>×</button>
            </div>

            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>

              {/* ── Giá thuê ── */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#444", marginBottom: 4 }}>💰 Giá thuê (đ/tháng)</label>
                <input type="number" value={editDraft.price} min={0} step={100000}
                  onChange={e => setEditDraft(p => p ? { ...p, price: Number(e.target.value) } : null)}
                  style={inputStyle} />
                <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>
                  = {(editDraft.price / 1_000_000).toFixed(2)}tr
                </div>
              </div>

              {/* ── Ngày trống phòng ── */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#444", marginBottom: 4 }}>📅 Ngày trống phòng</label>
                <input type="date" value={editDraft.availableDate}
                  onChange={e => setEditDraft(p => p ? { ...p, availableDate: e.target.value } : null)}
                  style={inputStyle} />
                <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>
                  Để trống = trống sẵn ngay
                </div>
              </div>

              {/* ── Trạng thái ẩn/hiện ── */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#444", marginBottom: 6 }}>👁 Trạng thái tin đăng</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["active", "hide"] as const).map(s => (
                    <button key={s} onClick={() => setEditDraft(p => p ? { ...p, status: s } : null)}
                      style={{
                        flex: 1, padding: "8px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer",
                        background: editDraft.status === s
                          ? (s === "active" ? GREEN : "#c00")
                          : (s === "active" ? "#e8f5e9" : "#fee"),
                        color: editDraft.status === s ? "#fff" : (s === "active" ? GREEN : "#c00"),
                        border: `2px solid ${editDraft.status === s ? (s === "active" ? GREEN : "#c00") : "transparent"}`,
                        transition: "all .15s",
                      }}>
                      {s === "active" ? "✅ Hiện" : "🚫 Ẩn"}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Chi phí ── */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#444", marginBottom: 6 }}>⚡ Chi phí</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {([
                    { key: "elec",  label: "Điện (đ/kWh)", type: "number", placeholder: "4000" },
                    { key: "water", label: "Nước",          type: "text",   placeholder: "100k/ng" },
                    { key: "sv",    label: "Dịch vụ",       type: "text",   placeholder: "200k/phòng" },
                    { key: "bike",  label: "Đậu xe",        type: "text",   placeholder: "100k" },
                  ] as const).map(({ key, label, type, placeholder }) => (
                    <div key={key}>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#777", marginBottom: 3 }}>{label}</label>
                      <input type={type} value={editDraft.costs[key] as string} placeholder={placeholder}
                        onChange={e => setEditDraft(p => p ? {
                          ...p, costs: { ...p.costs, [key]: type === "number" ? Number(e.target.value) : e.target.value }
                        } : null)}
                        style={{ ...inputStyle }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Nút lưu / hủy ── */}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button onClick={() => setEditDraft(null)}
                  style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #ddd", background: "#f5f5f5", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Hủy
                </button>
                <button onClick={saveEditDraft} disabled={editDraft.saving}
                  style={{ flex: 2, padding: "10px", borderRadius: 10, border: "none", background: editDraft.saving ? "#aaa" : GREEN, color: "#fff", fontSize: 13, fontWeight: 700, cursor: editDraft.saving ? "not-allowed" : "pointer", transition: "background .15s" }}>
                  {editDraft.saving ? "⏳ Đang lưu..." : "💾 Lưu thay đổi"}
                </button>
              </div>

              {editDraft.saveMsg && (
                <div style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: editDraft.saveMsg.startsWith("✅") ? "#2e7d32" : "#b08500" }}>
                  {editDraft.saveMsg}
                </div>
              )}

              <div style={{ fontSize: 10, color: "#bbb", textAlign: "center" }}>
                * Giá, ngày trống, trạng thái lưu qua <code>PATCH /api/listings/{"{id}"}</code>. Chi phí lưu local.
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          20%       { transform: rotate(-8deg); }
          40%       { transform: rotate(8deg); }
          60%       { transform: rotate(-5deg); }
          80%       { transform: rotate(5deg); }
        }
        * { box-sizing: border-box; }

        .header-btn {
          display: inline-block;
          padding: 5px 12px;
          border-radius: 22px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          border: 1px solid transparent;
          transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.12s;
        }
        .header-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(0,0,0,0.18);
        }
        .header-btn--yellow {
          border-color: rgba(255,255,255,0.3);
          color: #FFD966;
          background: rgba(255,255,255,0.1);
        }
        .header-btn--yellow:hover {
          background: rgba(255,215,0,0.22);
          color: #ffe680;
          box-shadow: 0 3px 10px rgba(255,200,0,0.25);
        }
        .header-btn--ghost {
          border-color: rgba(255,255,255,0.3);
          color: #fff;
          background: rgba(255,255,255,0.1);
        }
        .header-btn--ghost:hover {
          background: rgba(255,255,255,0.22);
        }
        /* Edit mode OFF */
        .header-btn--edit-off {
          border-color: rgba(255,255,255,0.3);
          color: rgba(255,255,255,0.8);
          background: rgba(255,255,255,0.08);
        }
        .header-btn--edit-off:hover {
          background: rgba(255,255,255,0.18);
          color: #fff;
        }
        /* Edit mode ON */
        .header-btn--edit-on {
          border-color: #ffc107;
          color: #333;
          background: #ffc107;
          animation: pulse-yellow 1.8s ease-in-out infinite;
        }
        @keyframes pulse-yellow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,193,7,0.5); }
          50%       { box-shadow: 0 0 0 6px rgba(255,193,7,0); }
        }

        .dang-tin-btn {
          display: inline-block;
          padding: 5px 13px;
          border-radius: 22px;
          border: 1px solid #d4a800;
          color: #006633;
          background: #FFD966;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
        }
        .dang-tin-btn:hover {
          background: #ffd27a;
          box-shadow: 0 2px 8px rgba(180,120,0,0.22);
          transform: translateY(-1px);
          animation: wiggle 0.5s ease;
        }
      ` }} />
    </div>
  );
}