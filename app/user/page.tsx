"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* ─── Types ─────────────────────────────────────────────────── */
interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  role: string;
  canPost?: boolean;
  createdAt?: string;
}

interface RoomCosts {
  elec: number;
  water: string;
  sv: string;
  bike: string;
}

interface Post {
  _id: string;
  title: string;
  address: string;
  price: number;
  availableDate?: string | null;
  highlights?: string[];
  status?: string;
  coverImage?: string;
  costs?: Partial<RoomCosts>;
  views?: number;
  createdAt?: string;
}

interface SavedPost {
  id: string;
  title: string;
  address: string;
  price: string;
  area: string;
  savedAt: string;
}

interface ViewedPost {
  id: string;
  title: string;
  address: string;
  price: string;
  viewedAt: string;
}

type Tab = "posts" | "saved" | "history" | "account";

/* ─── Constants ──────────────────────────────────────────────── */
const GREEN = "#006633";

const DEFAULT_COSTS: RoomCosts = {
  elec: 4000,
  water: "100k/ng",
  sv: "200k/phòng",
  bike: "100k",
};

/* ─── Mock data (thay bằng API thực) ─────────────────────────── */
const MOCK_POSTS: Post[] = [
  {
    _id: "1",
    title: "Phòng trọ cao cấp Bình Thạnh, full nội thất, ban công riêng",
    address: "123 Đinh Bộ Lĩnh, P.26, Bình Thạnh, TP.HCM",
    price: 4500000,
    availableDate: null,
    highlights: ["Máy lạnh", "Ban công", "Full NT"],
    status: "active",
    createdAt: "2025-04-15",
    views: 142,
    costs: { elec: 4000, water: "100k/ng", sv: "200k/phòng", bike: "100k" },
  },
  {
    _id: "2",
    title: "Cho thuê căn hộ mini Quận 3, gần trung tâm, an ninh 24/7",
    address: "45 Võ Văn Tần, P.6, Q.3, TP.HCM",
    price: 6200000,
    availableDate: "2025-05-20",
    highlights: ["An ninh", "Thang máy"],
    status: "pending",
    createdAt: "2025-04-28",
    views: 38,
    costs: { elec: 3500, water: "80k/ng", sv: "150k/phòng", bike: "100k" },
  },
  {
    _id: "3",
    title: "Phòng trọ giá rẻ Thủ Đức, gần ĐH Quốc Gia",
    address: "88 Võ Văn Ngân, Thủ Đức, TP.HCM",
    price: 2800000,
    availableDate: "2025-07-01",
    highlights: ["Giá rẻ", "Wifi"],
    status: "hide",
    createdAt: "2025-02-10",
    views: 317,
    costs: { elec: 4500, water: "120k/ng", sv: "200k/phòng", bike: "80k" },
  },
];

const MOCK_SAVED: SavedPost[] = [
  { id: "s1", title: "Căn hộ 2PN Vinhomes Grand Park, view hồ bơi", address: "Vinhomes Grand Park, Q.9, TP.HCM", price: "12.000.000", area: "68", savedAt: "2025-04-30" },
  { id: "s2", title: "Phòng trọ khép kín Gò Vấp, WC riêng, máy lạnh", address: "15 Quang Trung, P.10, Gò Vấp, TP.HCM", price: "3.200.000", area: "20", savedAt: "2025-04-22" },
];

const MOCK_HISTORY: ViewedPost[] = [
  { id: "h1", title: "Studio full nội thất Tân Bình, gần sân bay", address: "22 Hoàng Văn Thụ, Tân Bình", price: "5.500.000", viewedAt: "2025-05-02 14:32" },
  { id: "h2", title: "Phòng trọ Bình Chánh, yên tĩnh, có chỗ để xe", address: "Nguyễn Văn Linh, Bình Chánh", price: "2.200.000", viewedAt: "2025-05-01 09:15" },
  { id: "h3", title: "Căn hộ dịch vụ Q.1, trung tâm thành phố", address: "78 Lê Lợi, P.Bến Nghé, Q.1", price: "9.800.000", viewedAt: "2025-04-30 20:44" },
];

/* ─── Helpers (copy từ PhongTrongPage) ───────────────────────── */
function getAvailInfo(dateStr?: string | null) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  if (!dateStr) return { label: "Trống sẵn", type: "now" };
  const av = new Date(dateStr);
  const diff = Math.ceil((av.getTime() - now.getTime()) / 86400000);
  if (diff < 2)  return { label: "Trống sẵn",                              type: "now"  };
  if (diff < 30) return { label: "Trống " + av.toLocaleDateString("vi-VN"), type: "soon" };
  return              { label: "Trống " + av.toLocaleDateString("vi-VN"), type: "late" };
}

function getCosts(post: Post): RoomCosts {
  return {
    elec:  post.costs?.elec  ?? DEFAULT_COSTS.elec,
    water: post.costs?.water ?? DEFAULT_COSTS.water,
    sv:    post.costs?.sv    ?? DEFAULT_COSTS.sv,
    bike:  post.costs?.bike  ?? DEFAULT_COSTS.bike,
  };
}

/* ─── Style helpers ──────────────────────────────────────────── */
const TAB_CONFIG: { key: Tab; label: string; icon: string }[] = [
  { key: "posts",   label: "Tin đã đăng", icon: "📋" },
  { key: "saved",   label: "Tin đã lưu",  icon: "🔖" },
  { key: "history", label: "Lịch sử xem", icon: "🕓" },
  { key: "account", label: "Tài khoản",   icon: "👤" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active:  { label: "Đang hiển thị", color: "#2e7d32", bg: "#e8f5e9" },
  pending: { label: "Chờ duyệt",     color: "#b45309", bg: "#fef3c7" },
  hide:    { label: "Đang ẩn",       color: "#888",    bg: "#f5f5f5" },
};

const tagStyle = (type: string): React.CSSProperties => ({
  display: "inline-block", padding: "1px 7px", borderRadius: 10,
  fontSize: 10, fontWeight: 600, whiteSpace: "nowrap",
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

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: "1px solid #d1d5db", fontSize: 14, color: "#1a2e1f",
  background: "#fafafa", outline: "none", boxSizing: "border-box",
};

/* ══════════════════════════════════════════════════════════════ */
export default function UserDashboard() {
  const router = useRouter();
  const [user,      setUser]      = useState<User | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("posts");

  /* Posts table state */
  const [selected, setSelected] = useState<Post | null>(null);
  const [sortCol,  setSortCol]  = useState<"avail" | "price" | "address" | "elec" | "highlights">("avail");
  const [sortDir,  setSortDir]  = useState<"asc" | "desc">("asc");
  const [filters,  setFilters]  = useState<Set<"now" | "soon" | "late">>(new Set());

  /* Account form state */
  const [formUsername, setFormUsername] = useState("");
  const [formEmail,    setFormEmail]    = useState("");
  const [formPhone,    setFormPhone]    = useState("");
  const [oldPw,        setOldPw]        = useState("");
  const [newPw,        setNewPw]        = useState("");
  const [confirmPw,    setConfirmPw]    = useState("");
  const [saving,       setSaving]       = useState(false);
  const [saveMsg,      setSaveMsg]      = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) { router.push("/login"); return; }
      const u: User = JSON.parse(stored);
      if (u.role !== "user") { router.push("/"); return; }
      setUser(u);
      setFormUsername(u.username || "");
      setFormEmail(u.email || "");
      setFormPhone(u.phone || "");
    } catch { router.push("/login"); }
    finally { setLoading(false); }
  }, [router]);

  /* ── Sort ── */
  function toggleSort(col: typeof sortCol) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }
  const sortIcon = (col: typeof sortCol) =>
    sortCol === col ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕";

  /* ── Filter ── */
  function toggleFilter(f: "now" | "soon" | "late") {
    setFilters(prev => { const n = new Set(prev); n.has(f) ? n.delete(f) : n.add(f); return n; });
  }

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

  /* ── Processed posts ── */
  const filteredPosts = MOCK_POSTS.filter(r => {
    if (filters.size === 0) return true;
    return filters.has(getAvailInfo(r.availableDate).type as "now" | "soon" | "late");
  });
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1;
    switch (sortCol) {
      case "price":      return (a.price - b.price) * mul;
      case "elec":       return (getCosts(a).elec - getCosts(b).elec) * mul;
      case "address":    return a.address.localeCompare(b.address, "vi") * mul;
      case "highlights": return (a.highlights || []).join().localeCompare((b.highlights || []).join(), "vi") * mul;
      default: {
        const ta = a.availableDate ? new Date(a.availableDate).getTime() : 0;
        const tb = b.availableDate ? new Date(b.availableDate).getTime() : 0;
        return (ta - tb) * mul;
      }
    }
  });

  /* ── Save account ── */
  async function handleSaveAccount() {
    if (newPw && newPw !== confirmPw) { setSaveMsg("❌ Mật khẩu xác nhận không khớp"); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 800)); // TODO: gọi API
    setSaving(false);
    setSaveMsg("✅ Lưu thành công!");
    setTimeout(() => setSaveMsg(""), 3000);
  }

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#9ca3af" }}>
      Đang tải...
    </div>
  );
  if (!user) return null;

  /* ══════════════════════ RENDER ══════════════════════ */
  return (
    <div style={{ minHeight: "100vh", background: "#f5f7f5", fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px", display: "flex", gap: 24, alignItems: "flex-start" }}>

        {/* ── Sidebar ── */}
        <aside style={{ width: 210, flexShrink: 0, position: "sticky", top: 80 }}>

          {/* Avatar card */}
          <div style={{ background: "#fff", border: "1px solid #e8ede9", borderRadius: 16, padding: "20px 16px", textAlign: "center", marginBottom: 12, boxShadow: "0 2px 8px rgba(0,102,51,0.07)" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg,${GREEN} 0%,#00a854 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#fff", fontWeight: 700, margin: "0 auto 10px", boxShadow: "0 4px 12px rgba(0,102,51,0.3)" }}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1a2e1f" }}>{user.username}</div>
            <div style={{ fontSize: 11, color: GREEN, fontWeight: 600, background: "#e6f4ee", borderRadius: 20, padding: "2px 10px", marginTop: 6, display: "inline-block" }}>
              Thành viên
            </div>
            {user.createdAt && (
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 5 }}>Tham gia: {user.createdAt}</div>
            )}
          </div>

          {/* Nav tabs */}
          <nav style={{ background: "#fff", border: "1px solid #e8ede9", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,102,51,0.07)", marginBottom: 12 }}>
            {TAB_CONFIG.map((tab, i) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                width: "100%", textAlign: "left", padding: "11px 14px",
                display: "flex", alignItems: "center", gap: 9,
                fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500,
                color: activeTab === tab.key ? GREEN : "#4b5563",
                background: activeTab === tab.key ? "#e6f4ee" : "transparent",
                border: "none", borderTop: i > 0 ? "1px solid #f0f4f0" : "none",
                borderLeft: activeTab === tab.key ? `3px solid ${GREEN}` : "3px solid transparent",
                cursor: "pointer", transition: "background 0.15s",
              }}
                onMouseEnter={e => { if (activeTab !== tab.key) (e.currentTarget as HTMLElement).style.background = "#f5faf6"; }}
                onMouseLeave={e => { if (activeTab !== tab.key) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <span style={{ fontSize: 15 }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          <Link href="/dang-tin" style={{ textDecoration: "none" }}>
            <button style={{ width: "100%", padding: 11, borderRadius: 12, background: GREEN, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,102,51,0.25)", transition: "background 0.15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#00522a"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = GREEN}
            >
              + Đăng tin mới
            </button>
          </Link>
        </aside>

        {/* ── Main content ── */}
        <main style={{ flex: 1, minWidth: 0 }}>

          {/* ══ TAB: Tin đã đăng ══ */}
          {activeTab === "posts" && (
            <div>
              {/* Stats row */}
              <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                {[
                  { label: "Đang hiển thị", value: MOCK_POSTS.filter(p => p.status === "active").length,  color: "#2e7d32", bg: "#e8f5e9" },
                  { label: "Chờ duyệt",     value: MOCK_POSTS.filter(p => p.status === "pending").length, color: "#b45309", bg: "#fef3c7" },
                  { label: "Đang ẩn",       value: MOCK_POSTS.filter(p => p.status === "hide").length,    color: "#888",    bg: "#f5f5f5" },
                ].map(s => (
                  <div key={s.label} style={{ padding: "8px 14px", borderRadius: 10, background: s.bg, border: `1px solid ${s.color}22` }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Filter bar */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#555", marginRight: 2 }}>Lọc:</span>
                {(["now", "soon", "late"] as const).map(f => (
                  <button key={f} onClick={() => toggleFilter(f)} style={filterBtn(filters.has(f), f)}>
                    ✓ {f === "now" ? "Trống sẵn" : f === "soon" ? "Dưới 1 tháng" : "Trên 1 tháng"}
                  </button>
                ))}
                {filters.size > 0 && (
                  <button onClick={() => setFilters(new Set())} style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "#fee", color: "#c00", border: "1px solid #fcc" }}>
                    ✕ Xoá lọc
                  </button>
                )}
                <span style={{ fontSize: 11, color: "#aaa", marginLeft: 2 }}>{sortedPosts.length} tin</span>
              </div>

              {/* Table block — đồng nhất với PhongTrongPage */}
              <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", marginBottom: 24 }}>

                <div style={{ padding: "8px 12px 6px", borderBottom: "1px solid #e8f5e9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: GREEN }}>📋 Danh sách tin đã đăng</div>
                  <div style={{ fontSize: 10, color: "#999", fontStyle: "italic" }}>
                    Cập nhật: {new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </div>
                </div>

                {sortedPosts.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#aaa", fontSize: 13 }}>Không có tin nào phù hợp.</div>
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
                          <th style={thNoSort}>👁</th>
                          <th style={thNoSort}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedPosts.map((post, idx) => {
                          const av    = getAvailInfo(post.availableDate);
                          const costs = getCosts(post);
                          const st    = STATUS_CONFIG[post.status || "active"] || STATUS_CONFIG.active;
                          return (
                            <tr key={post._id}
                              style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "#f0faf5")}
                              onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                              onClick={() => setSelected(post)}
                            >
                              <td style={{ ...tdStyle, color: "#bbb", fontWeight: 600, fontSize: 10 }}>{idx + 1}</td>
                              <td style={tdStyle}>
                                <div style={{ fontWeight: 700, color: "#111", marginBottom: 1, fontSize: 11 }}>{post.title}</div>
                                <div style={{ fontSize: 10, color: "#999" }}>📍 {post.address || "TP.HCM"}</div>
                                <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 8, fontWeight: 600, background: st.bg, color: st.color, display: "inline-block", marginTop: 2 }}>
                                  {st.label}
                                </span>
                              </td>
                              <td style={tdStyle}>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                                  {(post.highlights || []).slice(0, 2).map((h, i) => (
                                    <span key={i} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 10, background: "#e8f5e9", color: "#2e7d32", fontWeight: 500 }}>{h}</span>
                                  ))}
                                </div>
                              </td>
                              <td style={{ ...tdStyle, fontWeight: 700, color: "#111", whiteSpace: "nowrap" }}>
                                {(post.price / 1000000).toFixed(1)}tr
                              </td>
                              <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{(costs.elec / 1000).toFixed(0)}k/kWh</td>
                              <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{costs.water}</td>
                              <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{costs.sv}</td>
                              <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{costs.bike}</td>
                              <td style={tdStyle}><span style={tagStyle(av.type)}>{av.label}</span></td>
                              <td style={{ ...tdStyle, color: "#aaa" }}>{post.views ?? 0}</td>
                              <td style={tdStyle} onClick={e => e.stopPropagation()}>
                                <div style={{ display: "flex", gap: 4 }}>
                                  <Link href={`/edit/${post._id}`}>
                                    <button style={{ padding: "2px 8px", borderRadius: 7, border: `1px solid ${GREEN}`, background: "#f0faf5", color: GREEN, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                                      Sửa
                                    </button>
                                  </Link>
                                  <button style={{ padding: "2px 8px", borderRadius: 7, border: "1px solid #fca5a5", background: "#fff5f5", color: "#dc2626", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                                    Xóa
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ background: GREEN, color: "#fff", textAlign: "center", padding: "7px 16px", fontSize: 11, fontWeight: 600 }}>
                  Angiahouse 090.222.5314 — Quản lý tin đăng của bạn
                </div>
              </div>
            </div>
          )}

          {/* ══ TAB: Tin đã lưu ══ */}
          {activeTab === "saved" && (
            <div>
              <SectionHeader title="🔖 Tin đã lưu" count={MOCK_SAVED.length} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {MOCK_SAVED.length === 0
                  ? <EmptyState icon="🔖" text="Bạn chưa lưu tin nào" />
                  : MOCK_SAVED.map(p => (
                    <div key={p.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "12px 16px", borderRadius: 12, background: "#fff", border: "1px solid #e8ede9", boxShadow: "0 1px 4px rgba(0,102,51,0.06)", transition: "box-shadow 0.2s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(0,102,51,0.12)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,102,51,0.06)"}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,#dbeafe,#bfdbfe)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🏘</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link href={`/listing/${p.id}`} style={{ textDecoration: "none" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2e1f", marginBottom: 2 }}>{p.title}</div>
                        </Link>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>📍 {p.address}</div>
                        <div style={{ display: "flex", gap: 12, marginTop: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: GREEN }}>{p.price} đ/tháng</span>
                          <span style={{ fontSize: 11, color: "#aaa" }}>🔖 {p.savedAt}</span>
                        </div>
                      </div>
                      <button style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid #fca5a5", color: "#dc2626", background: "#fff5f5", fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                        Bỏ lưu
                      </button>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* ══ TAB: Lịch sử xem ══ */}
          {activeTab === "history" && (
            <div>
              <SectionHeader title="🕓 Lịch sử xem" count={MOCK_HISTORY.length} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {MOCK_HISTORY.length === 0
                  ? <EmptyState icon="🕓" text="Chưa có lịch sử xem" />
                  : MOCK_HISTORY.map(p => (
                    <Link key={p.id} href={`/listing/${p.id}`} style={{ textDecoration: "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, background: "#fff", border: "1px solid #e8ede9", gap: 12, transition: "box-shadow 0.2s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(0,102,51,0.10)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2e1f", marginBottom: 2 }}>{p.title}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>📍 {p.address}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: GREEN }}>{p.price} đ</div>
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>{p.viewedAt}</div>
                        </div>
                      </div>
                    </Link>
                  ))
                }
              </div>
            </div>
          )}

          {/* ══ TAB: Tài khoản ══ */}
          {activeTab === "account" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <FormSection title="Thông tin cơ bản">
                <FormField label="Tên hiển thị">
                  <input value={formUsername} onChange={e => setFormUsername(e.target.value)} style={inputStyle} placeholder="Tên của bạn" />
                </FormField>
                <FormField label="Email">
                  <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} style={inputStyle} placeholder="email@example.com" />
                </FormField>
                <FormField label="Số điện thoại">
                  <input value={formPhone} onChange={e => setFormPhone(e.target.value)} style={inputStyle} placeholder="09x.xxx.xxxx" />
                </FormField>
              </FormSection>

              <FormSection title="Đổi mật khẩu">
                <FormField label="Mật khẩu hiện tại">
                  <input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} style={inputStyle} placeholder="••••••••" />
                </FormField>
                <FormField label="Mật khẩu mới">
                  <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} style={inputStyle} placeholder="••••••••" />
                </FormField>
                <FormField label="Xác nhận mật khẩu mới">
                  <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} style={inputStyle} placeholder="••••••••" />
                </FormField>
              </FormSection>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={handleSaveAccount} disabled={saving} style={{ padding: "10px 28px", borderRadius: 10, background: saving ? "#9ca3af" : GREEN, color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                {saveMsg && <span style={{ fontSize: 13, color: saveMsg.startsWith("✅") ? GREEN : "#dc2626" }}>{saveMsg}</span>}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── Modal: Chi tiết tin (copy style từ PhongTrongPage) ── */}
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
              <div style={{ width: "100%", height: 100, background: "linear-gradient(135deg,#e8f5e9,#c8e6c9)", borderRadius: 10, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🏠</div>
              {(selected.highlights || []).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                  {selected.highlights!.map((h, i) => (
                    <span key={i} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 10, background: "#e8f5e9", color: "#2e7d32", fontWeight: 500 }}>✓ {h}</span>
                  ))}
                </div>
              )}
              {([
                { label: "Giá thuê",    value: <span style={{ color: GREEN, fontSize: 15, fontWeight: 700 }}>{selected.price.toLocaleString()} đ/tháng</span> },
                { label: "Tiền điện",  value: `${(getCosts(selected).elec / 1000).toFixed(0)}k đồng/kWh` },
                { label: "Tiền nước",  value: getCosts(selected).water },
                { label: "Dịch vụ",   value: getCosts(selected).sv },
                { label: "Giữ xe",    value: getCosts(selected).bike },
                { label: "Trạng thái", value: <span style={tagStyle(getAvailInfo(selected.availableDate).type)}>{getAvailInfo(selected.availableDate).label}</span> },
                { label: "Lượt xem",  value: `${selected.views ?? 0}` },
              ]).map(({ label, value }, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #f5f5f5" }}>
                  <span style={{ fontSize: 12, color: "#888" }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{value}</span>
                </div>
              ))}
              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <Link href={`/edit/${selected._id}`} onClick={() => setSelected(null)}
                  style={{ flex: 1, textAlign: "center", padding: 11, background: "#f0faf5", color: GREEN, borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none", border: `1px solid ${GREEN}` }}>
                  ✏️ Chỉnh sửa
                </Link>
                <Link href={`/listing/${selected._id}`} onClick={() => setSelected(null)}
                  style={{ flex: 1, textAlign: "center", padding: 11, background: GREEN, color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                  Xem chi tiết →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box;}` }} />
    </div>
  );
}

/* ─── Micro components ───────────────────────────────────────── */
function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div style={{ padding: "4px 0 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: GREEN }}>{title}</div>
      <span style={{ fontSize: 11, color: "#aaa" }}>{count} mục</span>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ textAlign: "center", padding: "50px 20px", background: "#fff", borderRadius: 14, border: "1px dashed #d1fae5" }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 13, color: "#9ca3af" }}>{text}</div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8ede9", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,102,51,0.07)" }}>
      <div style={{ padding: "12px 20px", borderBottom: "1px solid #f0f4f0", fontSize: 13, fontWeight: 700, color: GREEN, background: "#f9fcfa" }}>
        {title}
      </div>
      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4b5563", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}