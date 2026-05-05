"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface ProfileUser {
  _id: string;
  username: string;
  phone?: string;
  role: string;
  headerText?: string;
  footerText?: string;
}
interface RoomCosts { elec: number; water: number; sv: number; bike: number; }
interface ListingItem {
  _id: string; title: string; address?: string; price: number;
  status: string; contactPhone?: string; coverImage?: string;
  highlights?: string[]; availableDate?: string;
  costs?: Partial<RoomCosts>; createdAt: string;
}
type SortCol = "address" | "highlights" | "price" | "elec" | "avail";

const GREEN = "#006633";
const DEFAULT_COSTS: RoomCosts = { elec: 4000, water: 100000, sv: 200000, bike: 100000 };

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getAvailInfo(dateStr?: string | null) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  if (!dateStr) return { label: "Trống sẵn", type: "now", diff: -1 };
  const av   = new Date(dateStr);
  const diff = Math.ceil((av.getTime() - now.getTime()) / 86400000);
  if (diff < 2)  return { label: "Trống sẵn",                               type: "now",  diff };
  if (diff < 30) return { label: "Trống " + av.toLocaleDateString("vi-VN"), type: "soon", diff };
  return            { label: "Trống " + av.toLocaleDateString("vi-VN"),     type: "late", diff };
}
function getCosts(item: ListingItem): RoomCosts {
  return {
    elec:  item.costs?.elec  ?? DEFAULT_COSTS.elec,
    water: item.costs?.water ?? DEFAULT_COSTS.water,
    sv:    item.costs?.sv    ?? DEFAULT_COSTS.sv,
    bike:  item.costs?.bike  ?? DEFAULT_COSTS.bike,
  };
}
function fmtMoney(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "tr";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "k";
  return n.toLocaleString("vi-VN");
}
const tagStyle = (type: string): React.CSSProperties => ({
  display: "inline-block", padding: "2px 8px", borderRadius: 10,
  fontSize: 10, fontWeight: 600, whiteSpace: "nowrap",
  background: type === "now" ? "#e8f5e9" : type === "soon" ? "#fff8e1" : "#f5f5f5",
  color:      type === "now" ? "#2e7d32" : type === "soon" ? "#b08500" : "#888",
});

// ─── Quick Edit Modal (only for owner/admin/mod) ──────────────────────────────
function QuickEditModal({ item, onClose, onSaved }: {
  item: ListingItem;
  onClose: () => void;
  onSaved: (updated: ListingItem) => void;
}) {
  const c0 = getCosts(item);
  const [saving, setSaving]       = useState(false);
  const [price, setPrice]         = useState(item.price);
  const [elec, setElec]           = useState(c0.elec);
  const [water, setWater]         = useState(c0.water);
  const [sv, setSv]               = useState(c0.sv);
  const [bike, setBike]           = useState(c0.bike);
  const [availDate, setAvailDate] = useState(item.availableDate || "");
  const [status, setStatus]       = useState(item.status);

  async function handleSave() {
    setSaving(true);
    const costs = { elec, water, sv, bike };
    await fetch(`/api/listings/${item._id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price, costs, availableDate: availDate || null, status }),
    });
    setSaving(false);
    const updated: ListingItem = { ...item, price, costs, availableDate: availDate || undefined, status };
    onSaved(updated);
    onClose();
  }

  const isHidden = status === "hide";
  const inputSm: React.CSSProperties = {
    width: "100%", padding: "7px 10px", border: "1px solid #e0e0e0", borderRadius: 8,
    fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none",
    transition: "border-color .15s",
  };
  const row = (label: string, edit: React.ReactNode) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#666", marginBottom: 4 }}>{label}</label>
      {edit}
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 500,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, maxWidth: 440, width: "100%",
        maxHeight: "92vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
        animation: "slideUp .25s cubic-bezier(.32,1.2,.5,1)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ background: GREEN, borderRadius: "16px 16px 0 0", padding: "14px 18px",
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>✏️ Sửa nhanh</div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 }}>{item.title}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", fontSize: 24, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "18px 18px 24px" }}>
          {row("💰 Giá thuê (đ/tháng)",
            <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} style={inputSm} />
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#666", marginBottom: 4 }}>⚡ Điện (đ/kWh)</label>
              <input type="number" value={elec} onChange={e => setElec(Number(e.target.value))} style={inputSm} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#666", marginBottom: 4 }}>💧 Nước (đ/ng/th)</label>
              <input type="number" value={water} onChange={e => setWater(Number(e.target.value))} style={inputSm} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#666", marginBottom: 4 }}>🧹 Dịch vụ (đ/P)</label>
              <input type="number" value={sv} onChange={e => setSv(Number(e.target.value))} style={inputSm} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#666", marginBottom: 4 }}>🚲 Đậu xe (đ/xe)</label>
              <input type="number" value={bike} onChange={e => setBike(Number(e.target.value))} style={inputSm} />
            </div>
          </div>
          {row("📅 Ngày trống",
            <input type="date" value={availDate} onChange={e => setAvailDate(e.target.value)} style={inputSm} />
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#666", marginBottom: 6 }}>👁 Ẩn / Hiện tin</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["active", "hide"].map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 8,
                    border: `1.5px solid ${status === s ? (s === "hide" ? "#c00" : GREEN) : "#e0e0e0"}`,
                    background: status === s ? (s === "hide" ? "#fff0f0" : "#e8f5e9") : "#f9f9f9",
                    color: status === s ? (s === "hide" ? "#c00" : GREEN) : "#aaa",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    transition: "all .15s" }}>
                  {s === "hide" ? "🙈 Ẩn" : "👁 Hiện"}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose}
              style={{ flex: 1, padding: "10px 0", border: "1px solid #ddd", borderRadius: 10, background: "#f5f5f5",
                fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background .15s" }}>Huỷ</button>
            <button onClick={handleSave} disabled={saving}
              style={{ flex: 2, padding: "10px 0", border: "none", borderRadius: 10,
                background: saving ? "#ccc" : GREEN, color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
                transition: "background .15s" }}>
              {saving ? "⏳ Đang lưu..." : "💾 Lưu thay đổi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ item, onClose, canEdit, onQuickEdit }: {
  item: ListingItem;
  onClose: () => void;
  canEdit: boolean;
  onQuickEdit: (item: ListingItem) => void;
}) {
  const av     = getAvailInfo(item.availableDate);
  const costs  = getCosts(item);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 400,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, maxWidth: 460, width: "100%",
        maxHeight: "92vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        animation: "slideUp .25s cubic-bezier(.32,1.2,.5,1)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ background: GREEN, borderRadius: "16px 16px 0 0", padding: "14px 18px",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{item.title}</div>
            {item.address && <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 3 }}>📍 {item.address}</div>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", fontSize: 24, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "16px 18px" }}>
          {item.coverImage
            ? <img src={item.coverImage} alt={item.title} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10, marginBottom: 14 }} />
            : <div style={{ height: 80, background: "linear-gradient(135deg,#e8f5e9,#c8e6c9)", borderRadius: 10, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🏠</div>
          }
          {(item.highlights || []).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
              {item.highlights!.map((h, i) => (
                <span key={i} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#e8f5e9", color: "#2e7d32", fontWeight: 500 }}>✓ {h}</span>
              ))}
            </div>
          )}
          {[
            { label: "Giá thuê",       value: <span style={{ color: GREEN, fontWeight: 800, fontSize: 15 }}>{item.price.toLocaleString("vi-VN")} đ/th</span> },
            { label: "⚡ Điện",         value: `${(costs.elec/1000).toFixed(0)}k đ/kWh` },
            { label: "💧 Nước",         value: `${fmtMoney(costs.water)} đ/ng/th` },
            { label: "🧹 Dịch vụ",      value: `${fmtMoney(costs.sv)} đ/phòng` },
            { label: "🚲 Đậu xe",       value: `${fmtMoney(costs.bike)} đ/xe` },
            { label: "📅 Ngày trống",   value: <span style={tagStyle(av.type)}>{av.label}</span> },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "7px 0", borderBottom: "1px solid #f5f5f5" }}>
              <span style={{ fontSize: 12, color: "#777", fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>{value}</span>
            </div>
          ))}
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            {canEdit && (
              <button onClick={() => { onClose(); onQuickEdit(item); }}
                style={{ flex: 1, padding: "10px 0", border: `1.5px solid ${GREEN}`, borderRadius: 10,
                  background: "#e8f5e9", color: GREEN, fontSize: 13, fontWeight: 700,
                  cursor: "pointer", transition: "all .15s" }}>
                ✏️ Sửa nhanh
              </button>
            )}
            <Link href={`/listing/${item._id}`}
              style={{ flex: 2, textAlign: "center", padding: "10px 0", background: GREEN, color: "#fff",
                borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              Xem chi tiết →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inline Header/Footer Editor ──────────────────────────────────────────────
function InlineTextEditor({ value, onSave, style: extraStyle }: {
  value: string; onSave: (v: string) => void; style?: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value);
  const ref                   = useRef<HTMLTextAreaElement>(null);
  useEffect(() => setVal(value), [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  if (editing) return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", flex: 1, ...extraStyle }}>
      <textarea ref={ref} value={val} onChange={e => setVal(e.target.value)} rows={1}
        style={{ flex: 1, background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.5)",
          borderRadius: 8, padding: "4px 8px", color: "#fff", fontSize: 12, fontFamily: "inherit",
          resize: "none", outline: "none" }} />
      <button onClick={() => { onSave(val); setEditing(false); }}
        style={{ padding: "3px 10px", background: "#fff", color: GREEN, borderRadius: 7, border: "none",
          fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Lưu</button>
      <button onClick={() => setEditing(false)}
        style={{ padding: "3px 8px", background: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: 7,
          border: "1px solid rgba(255,255,255,0.3)", fontSize: 11, cursor: "pointer" }}>Huỷ</button>
    </div>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, ...extraStyle }}>
      <span style={{ fontSize: 12, color: "#fff", fontWeight: 600, lineHeight: 1.4, flex: 1 }}>{value}</span>
      <button onClick={() => setEditing(true)}
        style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 7, color: "#fff", fontSize: 13, cursor: "pointer", padding: "2px 7px",
          flexShrink: 0, transition: "background .15s" }}>🖊️</button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function UserListingPage({ params }: { params: Promise<{ user: string }> }) {
  const { user: username } = React.use(params);
  const router = useRouter();

  const [profileUser, setProfileUser]   = useState<ProfileUser | null>(null);
  const [listings, setListings]         = useState<ListingItem[]>([]);
  const [currentUser, setCurrentUser]   = useState<{ _id: string; role: string } | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [headerText, setHeaderText]     = useState("");
  const [footerText, setFooterText]     = useState("");
  const [isEditMode, setIsEditMode]     = useState(false);
  const [selected, setSelected]         = useState<ListingItem | null>(null);
  const [quickEditItem, setQuickEditItem] = useState<ListingItem | null>(null);

  // Filters & Sort
  const [sortCol, setSortCol]           = useState<SortCol>("avail");
  const [sortDir, setSortDir]           = useState<"asc" | "desc">("asc");
  const [filterAvail, setFilterAvail]   = useState<Set<"now" | "soon" | "late">>(new Set());
  const [andFilter, setAndFilter]       = useState("");
  const [orFilter, setOrFilter]         = useState("");

  const fetchData = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/user/${username}/listing`);
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      setProfileUser(data.user);
      setListings(data.listings || []);
      setHeaderText(data.user.headerText || `Danh sách phòng trống của ${data.user.username}`);
      setFooterText(data.user.footerText || `Liên hệ xem phòng: ${data.user.phone || data.user.username}`);

      // Fetch current session user
      try {
        const meRes  = await fetch("/api/user/me");
        const meData = await meRes.json();
        if (!meData.error) setCurrentUser(meData);
      } catch {}
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [username]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const canEdit = !!(currentUser && profileUser && (
    currentUser._id === profileUser._id ||
    currentUser.role === "admin" ||
    currentUser.role === "mod"
  ));

  const saveText = async (field: "headerText" | "footerText", value: string) => {
    if (field === "headerText") setHeaderText(value); else setFooterText(value);
    await fetch("/api/user/update-texts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: value }) });
  };

  const handleQuickSaved = (updated: ListingItem) => {
    setListings(prev => prev.map(l => l._id === updated._id ? updated : l));
  };

  // Sort & filter
  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }
  function toggleAvail(f: "now" | "soon" | "late") {
    setFilterAvail(prev => { const n = new Set(prev); n.has(f) ? n.delete(f) : n.add(f); return n; });
  }
  const sortIcon = (col: SortCol) => sortCol === col ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕";

  function matchItem(l: ListingItem, kw: string) {
    const k = kw.trim().toLowerCase();
    if (!k) return true;
    return l.title.toLowerCase().includes(k) || (l.address || "").toLowerCase().includes(k) || (l.highlights || []).some(h => h.toLowerCase().includes(k));
  }

  // In edit mode show all listings; in public mode only show active (non-hidden)
  let list = isEditMode ? [...listings] : listings.filter(l => l.status !== "hide");

  if (filterAvail.size > 0) list = list.filter(l => filterAvail.has(getAvailInfo(l.availableDate).type as any));
  const andTerms = andFilter.split(",").map(s => s.trim()).filter(Boolean);
  if (andTerms.length > 0) list = list.filter(l => andTerms.every(kw => matchItem(l, kw)));
  const orTerms = orFilter.split(",").map(s => s.trim()).filter(Boolean);
  if (orTerms.length > 0) list = list.filter(l => orTerms.some(kw => matchItem(l, kw)));

  list.sort((a, b) => {
    const m = sortDir === "asc" ? 1 : -1;
    if (sortCol === "price")      return (a.price - b.price) * m;
    if (sortCol === "elec")       return (getCosts(a).elec - getCosts(b).elec) * m;
    if (sortCol === "avail")      return (getAvailInfo(a.availableDate).diff - getAvailInfo(b.availableDate).diff) * m;
    if (sortCol === "highlights") return ((a.highlights || []).join("").localeCompare((b.highlights || []).join(""), "vi")) * m;
    return (a.title + (a.address || "")).localeCompare(b.title + (b.address || ""), "vi") * m;
  });

  const thBase: React.CSSProperties = {
    padding: "7px 8px", textAlign: "left", color: "#fff",
    fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", background: GREEN,
    position: "sticky", top: 0,
  };
  const thSort: React.CSSProperties   = { ...thBase, cursor: "pointer", userSelect: "none" };
  const thNoSort: React.CSSProperties = { ...thBase, cursor: "default" };
  const td: React.CSSProperties = { padding: "5px 8px", verticalAlign: "middle", fontSize: 11, color: "#333", lineHeight: 1.3 };

  const filterBtnStyle = (active: boolean, activeColor = GREEN): React.CSSProperties => ({
    padding: "4px 11px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
    background: active ? activeColor : "#f0f0f0", color: active ? "#fff" : "#555",
    border: `1px solid ${active ? activeColor : "transparent"}`, transition: "all .15s",
  });

  // ── Loading ──
  if (loading) return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f7f7f8" }}>
      <div style={{ width: 36, height: 36, border: `4px solid #e0e0e0`, borderTop: `4px solid ${GREEN}`, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <div style={{ color: "#888", marginTop: 12, fontSize: 14 }}>Đang tải...</div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{to{transform:rotate(360deg)}}` }} />
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 20 }}>
      <div style={{ fontSize: 36 }}>⚠️</div>
      <div style={{ color: "#c0392b", fontWeight: 600 }}>{error}</div>
    </div>
  );

  const activeCount = listings.filter(l => l.status === "active").length;
  const hiddenCount = listings.filter(l => l.status === "hide").length;

  return (
    <div style={{ minHeight: "100dvh", background: "#f2f4f3", fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif" }}>

      {/* ── TOP NAV ── */}
      <header style={{ background: GREEN, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "10px 16px",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>

          {/* LEFT */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img src="https://res.cloudinary.com/dm30nbwuo/image/upload/v1777648613/logo_xjxqjd.png"
                  alt="Angiahouse" style={{ height: 32, width: "auto" }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}>ANGIAHOUSE</span>
              </div>
            </Link>
            <Link href="/dang-tin"
              style={{ display: "flex", alignItems: "center", gap: 5, textDecoration: "none",
                padding: "5px 12px", borderRadius: 20, background: "#fff", color: GREEN,
                fontSize: 12, fontWeight: 700, transition: "opacity .15s" }}>
              + Đăng tin
            </Link>
          </div>

          {/* RIGHT: username → back to dashboard */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {canEdit && (
              <button
                onClick={() => setIsEditMode(v => !v)}
                style={{ padding: "5px 12px", borderRadius: 20,
                  background: isEditMode ? "#fff" : "rgba(255,255,255,0.15)",
                  color: isEditMode ? GREEN : "#fff",
                  border: `1px solid ${isEditMode ? "#fff" : "rgba(255,255,255,0.4)"}`,
                  fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .2s",
                  transform: "scale(1)", boxShadow: isEditMode ? "0 2px 8px rgba(0,0,0,0.15)" : "none" }}>
                {isEditMode ? "✅ Chỉnh sửa" : "✏️ Chỉnh sửa"}
              </button>
            )}
            <button
              onClick={() => router.push("/user")}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)", borderRadius: 20, padding: "5px 10px",
                cursor: "pointer", transition: "background .15s" }}>
              <span style={{ color: "#fff", fontWeight: 600, fontSize: 12,
                maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profileUser?.username}
              </span>
              <div style={{ width: 28, height: 28, borderRadius: "50%",
                background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff",
                border: "2px solid rgba(255,255,255,0.5)", flexShrink: 0 }}>
                {profileUser?.username?.[0]?.toUpperCase()}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 0 50px" }}>

        {/* Stats row */}
        {isEditMode && (
          <div style={{ display: "flex", gap: 8, padding: "10px 16px", animation: "fadeIn .2s ease" }}>
            {[
              { label: "Tổng",      value: listings.length, color: "#333",    bg: "#f5f5f5" },
              { label: "Đang hiện", value: activeCount,     color: "#2e7d32", bg: "#e8f5e9" },
              { label: "Đang ẩn",   value: hiddenCount,     color: "#c00",    bg: "#fff0f0" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ flex: 1, background: bg, borderRadius: 8, padding: "6px 8px", textAlign: "center",
                animation: "slideUp .2s ease", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <span style={{ fontSize: 17, fontWeight: 800, color }}>{value}</span>
                <span style={{ fontSize: 10, color: "#888", marginLeft: 4 }}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Main card */}
        <div style={{ margin: isEditMode ? "0 16px" : "14px 16px", borderRadius: 12, overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.09)", transition: "margin .2s" }}>

          {/* 1. Filter bar */}
          <div style={{ padding: "8px 12px", borderBottom: "1px solid #f0f0f0", background: "#fff",
            borderRadius: "12px 12px 0 0",
            display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#555" }}>Lọc:</span>
            {(["now", "soon", "late"] as const).map(f => {
              const labels = { now: "Trống sẵn", soon: "Dưới 1 tháng", late: "Trên 1 tháng" };
              const colors = { now: "#2e7d32", soon: "#b08500", late: "#555" };
              return <button key={f} onClick={() => toggleAvail(f)} style={filterBtnStyle(filterAvail.has(f), colors[f])}>✓ {labels[f]}</button>;
            })}
            {filterAvail.size > 0 && (
              <button onClick={() => setFilterAvail(new Set())}
                style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  cursor: "pointer", background: "#fee", color: "#c00", border: "1px solid #fcc" }}>
                ✕ Xoá lọc
              </button>
            )}
            <span style={{ fontSize: 11, color: "#aaa", marginLeft: 2 }}>{list.length} tin</span>
          </div>

          {/* 2. Search bars */}
          <div style={{ padding: "8px 12px", borderBottom: "1px solid #f0f0f0", background: "#fff",
            display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: "1 1 140px", position: "relative" }}>
              <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
                fontSize: 9, fontWeight: 700, background: "#e8f5e9", color: "#2e7d32",
                padding: "1px 5px", borderRadius: 6, pointerEvents: "none" }}>VÀ</span>
              <input value={andFilter} placeholder="vd: quận 1, ban công (cách bằng dấu phẩy)"
                onChange={e => setAndFilter(e.target.value)}
                style={{ width: "100%", padding: "6px 10px 6px 34px", border: "1px solid #b2dfdb",
                  borderRadius: 10, fontSize: 12, fontFamily: "inherit", outline: "none",
                  boxSizing: "border-box", transition: "border-color .15s" }} />
            </div>
            <div style={{ flex: "1 1 140px", position: "relative" }}>
              <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
                fontSize: 9, fontWeight: 700, background: "#fff8e1", color: "#b08500",
                padding: "1px 5px", borderRadius: 6, pointerEvents: "none" }}>HOẶC</span>
              <input value={orFilter} placeholder="vd: wifi, điều hoà (cách bằng dấu phẩy)"
                onChange={e => setOrFilter(e.target.value)}
                style={{ width: "100%", padding: "6px 10px 6px 42px", border: "1px solid #ffe082",
                  borderRadius: 10, fontSize: 12, fontFamily: "inherit", outline: "none",
                  boxSizing: "border-box", transition: "border-color .15s" }} />
            </div>
            {(andFilter || orFilter) && (
              <button onClick={() => { setAndFilter(""); setOrFilter(""); }}
                style={{ padding: "5px 10px", borderRadius: 10, fontSize: 11, cursor: "pointer",
                  background: "#fee", color: "#c00", border: "1px solid #fcc", fontWeight: 600, flexShrink: 0 }}>
                ✕
              </button>
            )}
          </div>

          {/* 3. Header bar (green) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "7px 14px", gap: 8, background: `${GREEN}18`, borderBottom: `2px solid ${GREEN}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0, flexWrap: "wrap" }}>
              {isEditMode
                ? <InlineTextEditor value={headerText} onSave={v => saveText("headerText", v)} />
                : <span style={{ fontSize: 12, fontWeight: 700, color: GREEN, lineHeight: 1.4, flex: 1 }}>{headerText}</span>
              }
              <span style={{ fontSize: 10, color: "#888", whiteSpace: "nowrap", flexShrink: 0 }}>
                📅 {new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
              </span>
            </div>
            {isEditMode && (
              <button onClick={() => {
                const v = window.prompt("Sửa tiêu đề:", headerText);
                if (v !== null) saveText("headerText", v);
              }}
                style={{ background: `${GREEN}22`, border: `1px solid ${GREEN}55`, borderRadius: 8,
                  color: GREEN, fontSize: 13, cursor: "pointer", padding: "2px 8px", flexShrink: 0 }}>
                🖊️
              </button>
            )}
          </div>

          {/* 4. Table */}
          <div style={{ background: "#fff" }}>
            {list.length === 0 ? (
              <div style={{ padding: "50px 20px", textAlign: "center", color: "#aaa", fontSize: 13 }}>
                {isEditMode ? "Chưa có tin nào." : "Hiện tại không có phòng trống."}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr>
                      <th style={{ ...thBase, width: 22 }}>#</th>
                      <th style={thSort} onClick={() => toggleSort("address")}>Phòng / Địa chỉ{sortIcon("address")}</th>
                      <th style={thSort} onClick={() => toggleSort("highlights")}>Đặc điểm{sortIcon("highlights")}</th>
                      <th style={thSort} onClick={() => toggleSort("price")}>Giá{sortIcon("price")}</th>
                      <th style={thSort} onClick={() => toggleSort("elec")}>Điện{sortIcon("elec")}</th>
                      <th style={thNoSort}>Nước</th>
                      <th style={thNoSort}>DV</th>
                      <th style={thNoSort}>Xe</th>
                      <th style={thSort} onClick={() => toggleSort("avail")}>Trạng thái{sortIcon("avail")}</th>
                      {isEditMode && <th style={thNoSort}>Ẩn/Hiện</th>}
                      {isEditMode && <th style={thNoSort}>Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((item, idx) => {
                      const av     = getAvailInfo(item.availableDate);
                      const costs  = getCosts(item);
                      const isHidden = item.status === "hide";
                      return (
                        <tr key={item._id}
                          style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer",
                            background: isHidden && isEditMode ? "#fff8f8" : "#fff",
                            transition: "background .1s, transform .1s" }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = isHidden && isEditMode ? "#fff0f0" : "#f0faf5";
                            e.currentTarget.style.transform  = "translateX(1px)";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = isHidden && isEditMode ? "#fff8f8" : "#fff";
                            e.currentTarget.style.transform  = "translateX(0)";
                          }}
                          onClick={() => setSelected(item)}>
                          <td style={{ ...td, color: "#bbb", fontSize: 10, fontWeight: 600 }}>{idx + 1}</td>
                          <td style={td}>
                            <div style={{ fontWeight: 700, color: "#111", fontSize: 11 }}>{item.title}</div>
                            {item.address && <div style={{ fontSize: 10, color: "#999" }}>📍 {item.address}</div>}
                          </td>
                          <td style={td}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                              {(item.highlights || []).slice(0, 2).map((h, i) => (
                                <span key={i} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 10,
                                  background: "#e8f5e9", color: "#2e7d32", fontWeight: 500 }}>{h}</span>
                              ))}
                            </div>
                          </td>
                          <td style={{ ...td, fontWeight: 700, color: GREEN, whiteSpace: "nowrap" }}>
                            {(item.price / 1_000_000).toFixed(1)}tr
                          </td>
                          <td style={{ ...td, whiteSpace: "nowrap" }}>{(costs.elec/1000).toFixed(0)}k/kWh</td>
                          <td style={{ ...td, whiteSpace: "nowrap" }}>{fmtMoney(costs.water)}/ng</td>
                          <td style={{ ...td, whiteSpace: "nowrap" }}>{fmtMoney(costs.sv)}/P</td>
                          <td style={{ ...td, whiteSpace: "nowrap" }}>{fmtMoney(costs.bike)}/xe</td>
                          <td style={td}><span style={tagStyle(av.type)}>{av.label}</span></td>
                          {isEditMode && (
                            <td style={td} onClick={e => e.stopPropagation()}>
                              <button
                                onClick={async () => {
                                  const newStatus = item.status === "hide" ? "active" : "hide";
                                  await fetch(`/api/listings/${item._id}`, {
                                    method: "PATCH", headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ status: newStatus }),
                                  });
                                  setListings(prev => prev.map(l => l._id === item._id ? { ...l, status: newStatus } : l));
                                }}
                                title={isHidden ? "Đang ẩn — nhấn để hiện" : "Đang hiện — nhấn để ẩn"}
                                style={{ background: "none", border: "none", cursor: "pointer", padding: 0,
                                  transition: "transform .15s" }}
                                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.15)")}
                                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
                                {isHidden
                                  ? <span style={{ fontSize: 9, background: "#fee", color: "#c00", padding: "2px 6px", borderRadius: 8, fontWeight: 600 }}>🙈 Ẩn</span>
                                  : <span style={{ fontSize: 9, background: "#e8f5e9", color: "#2e7d32", padding: "2px 6px", borderRadius: 8, fontWeight: 600 }}>👁 Hiện</span>
                                }
                              </button>
                            </td>
                          )}
                          {isEditMode && (
                            <td style={td} onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => setQuickEditItem(item)}
                                style={{ padding: "3px 9px", borderRadius: 7, border: `1px solid ${GREEN}`,
                                  background: "#e8f5e9", color: GREEN, fontSize: 11, fontWeight: 600,
                                  cursor: "pointer", transition: "all .15s" }}
                                onMouseEnter={e => { e.currentTarget.style.background = GREEN; e.currentTarget.style.color = "#fff"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#e8f5e9"; e.currentTarget.style.color = GREEN; }}>
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
          </div>

          {/* Footer bar */}
          <div style={{ display: "flex", alignItems: "center", padding: "9px 14px", gap: 8, background: GREEN,
            borderRadius: "0 0 10px 10px" }}>
            {isEditMode
              ? <InlineTextEditor value={footerText} onSave={v => saveText("footerText", v)} />
              : <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", flex: 1 }}>{footerText}</span>
            }
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <DetailModal
          item={selected}
          onClose={() => setSelected(null)}
          canEdit={canEdit && isEditMode}
          onQuickEdit={(item) => { setSelected(null); setQuickEditItem(item); }}
        />
      )}

      {/* Quick Edit Modal */}
      {quickEditItem && (
        <QuickEditModal
          item={quickEditItem}
          onClose={() => setQuickEditItem(null)}
          onSaved={handleQuickSaved}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
        input:focus, textarea:focus { border-color: ${GREEN} !important; box-shadow: 0 0 0 2px ${GREEN}22; }
        @media (orientation: landscape) and (max-height: 500px) { header { position: relative !important; } }
        @media (min-width: 700px) { table { font-size: 12px !important; } th, td { padding: 7px 10px !important; } }
        button { font-family: inherit; }
      `}} />
    </div>
  );
}