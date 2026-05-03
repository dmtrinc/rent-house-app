"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface UserData {
  _id: string; username: string; email?: string; phone?: string;
  role: string; status: string; canPost: boolean; suspended: boolean;
  createdAt: string; lastLogin?: string; headerText?: string; footerText?: string;
}
interface RoomCosts { elec: number; water: number; sv: number; bike: number; }
interface ListingItem {
  _id: string; title: string; address?: string; price: number;
  status: string; contactPhone?: string; coverImage?: string;
  highlights?: string[]; availableDate?: string;
  costs?: Partial<RoomCosts>; createdAt: string;
}
type Tab    = "listings" | "saved" | "history" | "account";
type SortCol = "address" | "highlights" | "price" | "elec" | "avail" | "hidden";

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

// ─── EditableBar ───────────────────────────────────────────────────────────────
function EditableBar({ text, placeholder, label, onSave, pos }: {
  text: string; placeholder: string; label: string;
  onSave: (v: string) => void; pos: "top" | "bottom";
}) {
  const [open, setOpen] = useState(false);
  const [val, setVal]   = useState(text);
  useEffect(() => setVal(text), [text]);
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 14px", gap: 8, background: GREEN,
        borderRadius: pos === "top" ? "10px 10px 0 0" : "0 0 10px 10px" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", flex: 1, lineHeight: 1.4 }}>
          {text || placeholder}
        </span>
        <button onClick={() => setOpen(true)}
          style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 8, color: "#fff", fontSize: 15, cursor: "pointer", padding: "3px 8px", flexShrink: 0 }}>
          🖊️
        </button>
      </div>
      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500,
          display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setOpen(false)}>
          <div style={{ background: "#fff", borderRadius: "16px 16px 0 0", padding: "20px 18px 32px",
            width: "100%", maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>✏️ Sửa {label}</div>
            <textarea value={val} onChange={e => setVal(e.target.value)} rows={3} autoFocus
              style={{ width: "100%", border: "1px solid #ddd", borderRadius: 10, padding: "10px 12px",
                fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 10, marginTop: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setOpen(false)}
                style={{ padding: "9px 20px", border: "1px solid #ddd", borderRadius: 10, background: "#f5f5f5", fontSize: 13, cursor: "pointer" }}>Huỷ</button>
              <button onClick={() => { onSave(val); setOpen(false); }}
                style={{ padding: "9px 24px", border: "none", borderRadius: 10,
                  background: GREEN, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Lưu</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── CostsEditor ───────────────────────────────────────────────────────────────
function CostsEditor({ item, onSaved }: { item: ListingItem; onSaved: (updated: ListingItem) => void }) {
  const [open, setOpen]     = useState(false);
  const [saving, setSaving] = useState(false);
  const [costs, setCosts]   = useState<RoomCosts>(getCosts(item));
  useEffect(() => setCosts(getCosts(item)), [item]);

  const FIELDS: { key: keyof RoomCosts; label: string; placeholder: string }[] = [
    { key: "elec",  label: "Điện (đ/kWh)",      placeholder: "4000" },
    { key: "water", label: "Nước (đ/người/th)",  placeholder: "100000" },
    { key: "sv",    label: "Dịch vụ (đ/phòng)",  placeholder: "200000" },
    { key: "bike",  label: "Xe (đ/xe/th)",        placeholder: "100000" },
  ];

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/listings/${item._id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ costs }),
    });
    setSaving(false); setOpen(false);
    onSaved({ ...item, costs });
  }

  return (
    <>
      <button onClick={e => { e.stopPropagation(); setOpen(true); }}
        style={{ padding: "2px 8px", borderRadius: 7, border: `1px solid ${GREEN}`,
          background: "#f0faf5", color: GREEN, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
        ✏️ CP
      </button>
      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500,
          display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setOpen(false)}>
          <div style={{ background: "#fff", borderRadius: "16px 16px 0 0", padding: "20px 18px 32px",
            width: "100%", maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>💰 Chi phí — {item.title}</div>
            <div style={{ fontSize: 11, color: "#999", marginBottom: 16 }}>Cập nhật vào tin đăng trong DB</div>
            {FIELDS.map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 4 }}>{f.label}</label>
                <input type="number" min={0} value={costs[f.key] ?? ""} placeholder={f.placeholder}
                  onChange={e => setCosts(c => ({ ...c, [f.key]: Number(e.target.value) }))}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #e0e0e0",
                    borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
              <button onClick={() => setOpen(false)}
                style={{ padding: "9px 20px", border: "1px solid #ddd", borderRadius: 10, background: "#f5f5f5", fontSize: 13, cursor: "pointer" }}>Huỷ</button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: "9px 24px", border: "none", borderRadius: 10,
                  background: saving ? "#ccc" : GREEN, color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "⏳..." : "💾 Lưu DB"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── MyListingsTable ──────────────────────────────────────────────────────────
function MyListingsTable({ items, onAction, onCostsSaved }: {
  items: ListingItem[];
  onAction: (item: ListingItem, action: "edit" | "hide" | "delete") => void;
  onCostsSaved: (updated: ListingItem) => void;
}) {
  const [sortCol, setSortCol]           = useState<SortCol>("avail");
  const [sortDir, setSortDir]           = useState<"asc" | "desc">("asc");
  const [filterAvail, setFilterAvail]   = useState<Set<"now" | "soon" | "late">>(new Set());
  const [filterHidden, setFilterHidden] = useState<"all" | "visible" | "hidden">("all");
  // FIX #3: customFilters was shadowed locally — lifted to component state and wired correctly
  const [customFilters, setCustomFilters] = useState<[string, string, string]>(["", "", ""]);
  const [selected, setSelected]         = useState<ListingItem | null>(null);

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }
  function toggleAvail(f: "now" | "soon" | "late") {
    setFilterAvail(prev => { const n = new Set(prev); n.has(f) ? n.delete(f) : n.add(f); return n; });
  }
  const sortIcon = (col: SortCol) => sortCol === col ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕";

  // process — FIX #3: filter logic now uses the live customFilters state
  let list = [...items];
  if (filterAvail.size > 0) list = list.filter(l => filterAvail.has(getAvailInfo(l.availableDate).type as any));
  if (filterHidden === "visible") list = list.filter(l => l.status !== "hide");
  if (filterHidden === "hidden")  list = list.filter(l => l.status === "hide");

  // Apply all non-empty keyword filters (AND logic)
  for (const kw of customFilters) {
    const k = kw.trim().toLowerCase();
    if (!k) continue;
    list = list.filter(l =>
      l.title.toLowerCase().includes(k) ||
      (l.address || "").toLowerCase().includes(k) ||
      (l.highlights || []).some(h => h.toLowerCase().includes(k))
    );
  }

  list.sort((a, b) => {
    const m = sortDir === "asc" ? 1 : -1;
    if (sortCol === "price")      return (a.price - b.price) * m;
    if (sortCol === "elec")       return (getCosts(a).elec - getCosts(b).elec) * m;
    if (sortCol === "hidden")     return ((a.status === "hide" ? 1 : 0) - (b.status === "hide" ? 1 : 0)) * m;
    if (sortCol === "avail")      return (getAvailInfo(a.availableDate).diff - getAvailInfo(b.availableDate).diff) * m;
    if (sortCol === "highlights") return ((a.highlights || []).join("").localeCompare((b.highlights || []).join(""), "vi")) * m;
    return (a.title + (a.address || "")).localeCompare(b.title + (b.address || ""), "vi") * m;
  });

  const thBase: React.CSSProperties = {
    padding: "6px 8px", textAlign: "left", color: "#fff",
    fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", background: GREEN,
  };
  const thSort:   React.CSSProperties = { ...thBase, cursor: "pointer", userSelect: "none" };
  const thNoSort: React.CSSProperties = { ...thBase, cursor: "default" };
  const td: React.CSSProperties = { padding: "4px 8px", verticalAlign: "middle", fontSize: 11, color: "#333", lineHeight: 1.3 };

  const filterBtnStyle = (active: boolean, activeColor = GREEN): React.CSSProperties => ({
    padding: "4px 11px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
    background: active ? activeColor : "#f0f0f0", color: active ? "#fff" : "#555",
    border: `1px solid ${active ? activeColor : "transparent"}`, transition: "all .15s",
  });

  return (
    <>
      {/* ── Filter bar ── */}
      <div style={{ padding: "10px 12px", borderBottom: "1px solid #f0f0f0", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#555" }}>Lọc:</span>
        {(["now", "soon", "late"] as const).map(f => {
          const labels = { now: "Trống sẵn", soon: "Dưới 1 tháng", late: "Trên 1 tháng" };
          const colors = { now: "#2e7d32", soon: "#b08500", late: "#555" };
          return <button key={f} onClick={() => toggleAvail(f)} style={filterBtnStyle(filterAvail.has(f), colors[f])}>✓ {labels[f]}</button>;
        })}
        <div style={{ width: 1, height: 16, background: "#ddd", margin: "0 2px" }} />
        {(["all", "visible", "hidden"] as const).map(v => {
          const labels = { all: "Tất cả", visible: "Đang hiện", hidden: "Đang ẩn" };
          return <button key={v} onClick={() => setFilterHidden(v)} style={filterBtnStyle(filterHidden === v, v === "hidden" ? "#c00" : GREEN)}>{labels[v]}</button>;
        })}
        {(filterAvail.size > 0 || filterHidden !== "all") && (
          <button onClick={() => { setFilterAvail(new Set()); setFilterHidden("all"); }}
            style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "#fee", color: "#c00", border: "1px solid #fcc" }}>
            ✕ Xoá lọc
          </button>
        )}
        <span style={{ fontSize: 11, color: "#aaa", marginLeft: 2 }}>{list.length} tin</span>
      </div>

      {/* ── FIX #3: Custom text search — properly controlled inputs ── */}
      <div style={{ padding: "8px 12px", borderBottom: "1px solid #f0f0f0", display: "flex", gap: 6, flexWrap: "wrap" }}>
        {([0, 1, 2] as const).map(i => (
          <input
            key={i}
            value={customFilters[i]}
            placeholder={`Tìm kiếm ${i + 1}...`}
            onChange={e => {
              const next: [string, string, string] = [...customFilters] as [string, string, string];
              next[i] = e.target.value;
              setCustomFilters(next);
            }}
            style={{
              flex: "1 1 80px", minWidth: 80, padding: "5px 10px",
              border: "1px solid #e0e0e0", borderRadius: 10,
              fontSize: 12, fontFamily: "inherit", outline: "none",
            }}
          />
        ))}
        {customFilters.some(f => f.trim()) && (
          <button
            onClick={() => setCustomFilters(["", "", ""])}
            style={{ padding: "5px 10px", borderRadius: 10, fontSize: 11, cursor: "pointer", background: "#fee", color: "#c00", border: "1px solid #fcc", fontWeight: 600 }}>
            ✕
          </button>
        )}
      </div>

      {/* ── Table ── */}
      {list.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "#aaa", fontSize: 13 }}>Không có tin nào.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{ ...thBase, width: 22 }}>#</th>
                <th style={thSort}   onClick={() => toggleSort("address")}>    Phòng / Địa chỉ{sortIcon("address")}</th>
                <th style={thSort}   onClick={() => toggleSort("highlights")}> Đặc điểm{sortIcon("highlights")}</th>
                <th style={thSort}   onClick={() => toggleSort("price")}>      Giá{sortIcon("price")}</th>
                <th style={thSort}   onClick={() => toggleSort("elec")}>       Điện{sortIcon("elec")}</th>
                <th style={thNoSort}>Nước</th>
                <th style={thNoSort}>DV</th>
                <th style={thNoSort}>Xe</th>
                <th style={thSort}   onClick={() => toggleSort("avail")}>      Trạng thái{sortIcon("avail")}</th>
                <th style={thSort}   onClick={() => toggleSort("hidden")}>     Ẩn/Hiện{sortIcon("hidden")}</th>
                <th style={thNoSort}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item, idx) => {
                const av    = getAvailInfo(item.availableDate);
                const costs = getCosts(item);
                const isHidden = item.status === "hide";
                return (
                  <tr key={item._id}
                    style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer", background: isHidden ? "#fff8f8" : "#fff" }}
                    onMouseEnter={e => (e.currentTarget.style.background = isHidden ? "#fff0f0" : "#f0faf5")}
                    onMouseLeave={e => (e.currentTarget.style.background = isHidden ? "#fff8f8" : "#fff")}
                    onClick={() => setSelected(item)}>
                    <td style={{ ...td, color: "#bbb", fontSize: 10, fontWeight: 600 }}>{idx + 1}</td>
                    <td style={td}>
                      <div style={{ fontWeight: 700, color: "#111", fontSize: 11 }}>{item.title}</div>
                      {item.address && <div style={{ fontSize: 10, color: "#999" }}>📍 {item.address}</div>}
                    </td>
                    <td style={td}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                        {(item.highlights || []).slice(0, 2).map((h, i) => (
                          <span key={i} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 10, background: "#e8f5e9", color: "#2e7d32", fontWeight: 500 }}>{h}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ ...td, fontWeight: 700, color: "#111", whiteSpace: "nowrap" }}>
                      {(item.price / 1_000_000).toFixed(1)}tr
                    </td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>{(costs.elec / 1000).toFixed(0)}k/kWh</td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>{fmtMoney(costs.water)}/ng</td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>{fmtMoney(costs.sv)}/P</td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>{fmtMoney(costs.bike)}/xe</td>
                    <td style={td}><span style={tagStyle(av.type)}>{av.label}</span></td>
                    <td style={td}>
                      {isHidden
                        ? <span style={{ fontSize: 9, background: "#fee", color: "#c00", padding: "2px 6px", borderRadius: 8, fontWeight: 600 }}>🙈 Ẩn</span>
                        : <span style={{ fontSize: 9, background: "#e8f5e9", color: "#2e7d32", padding: "2px 6px", borderRadius: 8, fontWeight: 600 }}>👁 Hiện</span>
                      }
                    </td>
                    <td style={td} onClick={e => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                        {/* FIX #4: edit button now navigates to /listing/[id]/edit */}
                        <button
                          onClick={() => onAction(item, "edit")}
                          style={actionBtn("#e8f5e9", "#2e7d32")}
                          title="Sửa tin">✏️</button>
                        <button onClick={() => onAction(item, "hide")}   style={actionBtn(isHidden ? "#e8f5e9" : "#fff8e1", isHidden ? "#2e7d32" : "#b08500")}>{isHidden ? "👁" : "🙈"}</button>
                        <button onClick={() => onAction(item, "delete")} style={actionBtn("#fff0f0", "#c00")}>🗑</button>
                        <CostsEditor item={item} onSaved={onCostsSaved} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* FIX #7: Detail modal — text colors changed to black (#111 / #222) for readability */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 400,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setSelected(null)}>
          <div style={{ background: "#fff", borderRadius: 16, maxWidth: 460, width: "100%",
            maxHeight: "88vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ background: GREEN, borderRadius: "16px 16px 0 0", padding: "14px 18px",
              display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{selected.title}</div>
                {selected.address && <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 3 }}>📍 {selected.address}</div>}
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#fff", fontSize: 24, cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: "16px 18px" }}>
              {selected.coverImage
                ? <img src={selected.coverImage} alt={selected.title} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10, marginBottom: 14 }} />
                : <div style={{ width: "100%", height: 100, background: "linear-gradient(135deg,#e8f5e9,#c8e6c9)", borderRadius: 10, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🏠</div>
              }
              {(selected.highlights || []).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                  {selected.highlights!.map((h, i) => (
                    <span key={i} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 10, background: "#e8f5e9", color: "#2e7d32", fontWeight: 500 }}>✓ {h}</span>
                  ))}
                </div>
              )}
              {(() => {
                const c = getCosts(selected);
                return [
                  { label: "Giá thuê",   value: <span style={{ color: GREEN, fontWeight: 700, fontSize: 15 }}>{selected.price.toLocaleString("vi-VN")} đ/tháng</span> },
                  { label: "Tiền điện", value: `${(c.elec / 1000).toFixed(0)}k đ/kWh` },
                  { label: "Tiền nước", value: `${fmtMoney(c.water)}/người/tháng` },
                  { label: "Dịch vụ",  value: `${fmtMoney(c.sv)}/phòng/tháng` },
                  { label: "Giữ xe",   value: `${fmtMoney(c.bike)}/xe/tháng` },
                  { label: "Liên hệ",  value: selected.contactPhone || "—" },
                  { label: "Trạng thái", value: <span style={tagStyle(getAvailInfo(selected.availableDate).type)}>{getAvailInfo(selected.availableDate).label}</span> },
                  { label: "Ngày đăng", value: new Date(selected.createdAt).toLocaleDateString("vi-VN") },
                ].map(({ label, value }, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #f5f5f5" }}>
                    {/* FIX #7: label color darkened to #555, value color to #111 for portrait phone readability */}
                    <span style={{ fontSize: 12, color: "#555", fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>{value}</span>
                  </div>
                ));
              })()}
              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <Link href={`/listing/${selected._id}`}
                  style={{ flex: 1, textAlign: "center", padding: 11, background: GREEN, color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                  Xem chi tiết →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
function actionBtn(bg: string, color: string): React.CSSProperties {
  return { padding: "3px 7px", borderRadius: 7, border: `1px solid ${color}30`, background: bg, color, fontSize: 12, cursor: "pointer", fontWeight: 600 };
}

// ─── SavedTable ───────────────────────────────────────────────────────────────
function SavedTable({ items, savedIds, onToggleSave }: {
  items: ListingItem[]; savedIds: Set<string>;
  onToggleSave: (id: string, action: "save" | "unsave") => void;
}) {
  const [selected, setSelected] = useState<ListingItem | null>(null);
  const thBase: React.CSSProperties = { padding: "6px 8px", textAlign: "left", color: "#fff", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", background: GREEN };
  const td: React.CSSProperties    = { padding: "5px 8px", verticalAlign: "middle", fontSize: 11, color: "#333", lineHeight: 1.3 };

  if (items.length === 0) return <div style={{ padding: "40px 20px", textAlign: "center", color: "#aaa", fontSize: 13 }}>Chưa có tin nào được quan tâm.</div>;

  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ ...thBase, width: 22 }}>#</th>
              <th style={thBase}>Phòng / Địa chỉ</th>
              <th style={thBase}>Đặc điểm</th>
              <th style={thBase}>Giá</th>
              <th style={thBase}>Trạng thái</th>
              <th style={thBase}>Bỏ lưu</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const av = getAvailInfo(item.availableDate);
              return (
                <tr key={item._id} style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f0faf5")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                  onClick={() => setSelected(item)}>
                  <td style={{ ...td, color: "#bbb", fontSize: 10, fontWeight: 600 }}>{idx + 1}</td>
                  <td style={td}>
                    <div style={{ fontWeight: 700, color: "#111", fontSize: 11 }}>{item.title}</div>
                    {item.address && <div style={{ fontSize: 10, color: "#999" }}>📍 {item.address}</div>}
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                      {(item.highlights || []).slice(0, 2).map((h, i) => (
                        <span key={i} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 10, background: "#e8f5e9", color: "#2e7d32", fontWeight: 500 }}>{h}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ ...td, fontWeight: 700, color: "#111", whiteSpace: "nowrap" }}>{(item.price / 1_000_000).toFixed(1)}tr</td>
                  <td style={td}><span style={tagStyle(av.type)}>{av.label}</span></td>
                  <td style={td} onClick={e => e.stopPropagation()}>
                    <button onClick={() => onToggleSave(item._id, "unsave")}
                      style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer" }} title="Bỏ quan tâm">😍</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* FIX #7: SavedTable detail modal also darkened */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setSelected(null)}>
          <div style={{ background: "#fff", borderRadius: 16, maxWidth: 460, width: "100%", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <div style={{ background: GREEN, borderRadius: "16px 16px 0 0", padding: "14px 18px", display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{selected.title}</div>
                {selected.address && <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 3 }}>📍 {selected.address}</div>}
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ padding: "16px 18px" }}>
              {selected.coverImage
                ? <img src={selected.coverImage} alt="" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10, marginBottom: 14 }} />
                : <div style={{ height: 80, background: "linear-gradient(135deg,#e8f5e9,#c8e6c9)", borderRadius: 10, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🏠</div>
              }
              <div style={{ fontWeight: 700, fontSize: 15, color: "#111", marginBottom: 6 }}>{selected.title}</div>
              {selected.address && <div style={{ fontSize: 13, color: "#444", marginBottom: 12 }}>📍 {selected.address}</div>}
              <Link href={`/listing/${selected._id}`} style={{ display: "block", textAlign: "center", padding: 11, background: GREEN, color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Xem chi tiết →</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── AccountTab ────────────────────────────────────────────────────────────────
function AccountTab({ user, onSaved }: { user: UserData; onSaved: () => void }) {
  const [form, setForm]       = useState({ username: user.username, email: user.email || "", phone: user.phone || "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState<{ text: string; ok: boolean } | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  async function handleSave() {
    if (form.newPassword && form.newPassword !== form.confirmPassword) { setMsg({ text: "Mật khẩu xác nhận không khớp", ok: false }); return; }
    setSaving(true); setMsg(null);
    const body: any = { username: form.username, email: form.email, phone: form.phone };
    if (form.newPassword) body.newPassword = form.newPassword;
    const res  = await fetch("/api/user/update-profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);
    if (res.ok) { setMsg({ text: "✅ Đã lưu thành công", ok: true }); onSaved(); }
    else setMsg({ text: "❌ " + data.error, ok: false });
  }

  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #e0e0e0", borderRadius: 10, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 5 };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: "20px 16px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg,${GREEN},#4caf50)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff" }}>
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>{user.username}</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
              {user.role} · {user.suspended ? "🚫 Bị đình chỉ" : user.status === "active" ? "✅ Hoạt động" : "🚫 lỗi"}
            </div>
          </div>
        </div>
        {[
          { label: "Tên đăng nhập", key: "username", type: "text",  placeholder: "username" },
          { label: "Email",         key: "email",    type: "email", placeholder: "email@example.com" },
          { label: "Số điện thoại", key: "phone",    type: "tel",   placeholder: "0909 xxx xxx" },
        ].map(({ label, key, type, placeholder }) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{label}</label>
            <input type={type} value={(form as any)[key]} placeholder={placeholder}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inputStyle} />
          </div>
        ))}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Mật khẩu mới</label>
            <button onClick={() => setShowPwd(v => !v)} style={{ background: "none", border: "none", fontSize: 11, color: GREEN, cursor: "pointer", fontWeight: 600 }}>{showPwd ? "Ẩn" : "Hiện"}</button>
          </div>
          <input type={showPwd ? "text" : "password"} value={form.newPassword} placeholder="Để trống nếu không đổi"
            onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} style={inputStyle} />
        </div>
        {form.newPassword && (
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Xác nhận mật khẩu mới</label>
            <input type={showPwd ? "text" : "password"} value={form.confirmPassword} placeholder="Nhập lại mật khẩu mới"
              onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} style={inputStyle} />
          </div>
        )}
        {msg && <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 14, background: msg.ok ? "#e8f5e9" : "#fff0f0", color: msg.ok ? "#2e7d32" : "#c00", fontSize: 13, fontWeight: 600 }}>{msg.text}</div>}
        <button onClick={handleSave} disabled={saving}
          style={{ width: "100%", padding: 13, background: saving ? "#ccc" : GREEN, color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "⏳ Đang lưu..." : "💾 Lưu thay đổi"}
        </button>
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #f0f0f0" }}>
          {[
            { label: "Ngày tạo",      value: new Date(user.createdAt).toLocaleDateString("vi-VN") },
            ...(user.lastLogin ? [{ label: "Đăng nhập cuối", value: new Date(user.lastLogin).toLocaleString("vi-VN") }] : []),
            { label: "Đăng bài",     value: user.canPost ? "✅ Được phép" : "🚫 lỗi" },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f8f8f8" }}>
              <span style={{ fontSize: 12, color: "#aaa" }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function UserPage() {
  const [tab, setTab]                     = useState<Tab>("listings");
  const [user, setUser]                   = useState<UserData | null>(null);
  const [myListings, setMyListings]       = useState<ListingItem[]>([]);
  const [savedListings, setSavedListings] = useState<ListingItem[]>([]);
  const [viewHistory, setViewHistory]     = useState<ListingItem[]>([]);
  const [savedIds, setSavedIds]           = useState<Set<string>>(new Set());
  const [headerText, setHeaderText]       = useState("");
  const [footerText, setFooterText]       = useState("");
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/user/dashboard");
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      setUser(data.user);
      setMyListings(data.myListings || []);
      setSavedListings(data.savedListings || []);
      setViewHistory(data.viewHistory || []);
      setSavedIds(new Set((data.savedListings || []).map((l: ListingItem) => l._id)));
      const u = data.user as UserData;
      setHeaderText(u.headerText || `Danh sách phòng trống của ${u.username}`);
      setFooterText(u.footerText || `Liên hệ xem phòng: ${u.phone || u.username} - Hoa hồng 50%/6th 80%/12th`);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveText = async (field: "headerText" | "footerText", value: string) => {
    if (field === "headerText") setHeaderText(value); else setFooterText(value);
    await fetch("/api/user/update-texts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: value }) });
  };

  const handleToggleSave = async (listingId: string, action: "save" | "unsave") => {
    await fetch("/api/user/save-listing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listingId, action }) });
    setSavedIds(prev => { const next = new Set(prev); action === "save" ? next.add(listingId) : next.delete(listingId); return next; });
    if (action === "unsave") setSavedListings(prev => prev.filter(l => l._id !== listingId));
  };

  // FIX #4: edit uses window.location.href to navigate to the listing edit page
  const handleListingAction = async (item: ListingItem, action: "edit" | "hide" | "delete") => {
    if (action === "edit") {
      window.location.href = `/edit/${item._id}`;
      return;
    }
    if (action === "delete") {
      if (!confirm(`Xóa tin "${item.title}"?`)) return;
      await fetch(`/api/listings/${item._id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      setMyListings(prev => prev.filter(l => l._id !== item._id)); return;
    }
    if (action === "hide") {
      const newStatus = item.status === "hide" ? "active" : "hide";
      await fetch(`/api/listings/${item._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
      setMyListings(prev => prev.map(l => l._id === item._id ? { ...l, status: newStatus } : l));
    }
  };

  const handleCostsSaved = (updated: ListingItem) =>
    setMyListings(prev => prev.map(l => l._id === updated._id ? updated : l));

  if (loading) return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f7f7f8" }}>
      <div style={{ width: 36, height: 36, border: `4px solid #e0e0e0`, borderTop: `4px solid ${GREEN}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ color: "#888", marginTop: 12, fontSize: 14 }}>Đang tải...</div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{to{transform:rotate(360deg)}}` }} />
    </div>
  );
  if (error) return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 20 }}>
      <div style={{ fontSize: 36 }}>⚠️</div>
      <div style={{ color: "#c0392b", fontWeight: 600 }}>{error}</div>
      {error.includes("đăng nhập") && <Link href="/login" style={{ marginTop: 8, padding: "10px 24px", background: GREEN, color: "#fff", borderRadius: 10, textDecoration: "none", fontWeight: 700 }}>Đăng nhập</Link>}
    </div>
  );

  const activeCount = myListings.filter(l => l.status === "active").length;
  const hiddenCount = myListings.filter(l => l.status === "hide").length;
  const defaultHeaderPlaceholder = `Danh sách phòng trống của ${user?.username}`;
  const defaultFooterPlaceholder = `Liên hệ ${user?.phone || user?.username}`;
  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: "listings", label: "📋 Tin đăng",  count: myListings.length },
    { key: "saved",    label: "😍 Đã lưu",    count: savedListings.length },
    { key: "history",  label: "🕐 Đã xem",    count: viewHistory.length },
    { key: "account",  label: "👤 Tài khoản" },
  ];

  return (
    <div style={{ minHeight: "100dvh", background: "#f2f4f3", fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif" }}>

      {/* TOP NAV */}
      <header style={{ background: GREEN, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* LEFT: Back home + Đăng tin mới (FIX #2) */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", padding: "5px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 12, fontWeight: 600 }}>← Trang chủ</Link>
            <Link href="/dang-tin" style={{ display: "flex", alignItems: "center", gap: 5, textDecoration: "none", padding: "5px 12px", borderRadius: 20, background: "#fff", color: GREEN, fontSize: 12, fontWeight: 700 }}>+ Đăng tin mới</Link>
          </div>

          {/* RIGHT: avatar + username */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", border: "2px solid rgba(255,255,255,0.5)", flexShrink: 0 }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <span style={{ color: "#fff", fontWeight: 600, fontSize: 13, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.username}
            </span>
          </div>
        </div>

        {/* FIX #2: Tab bar — maxWidth matches content area for alignment in landscape */}
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", overflowX: "auto", borderTop: "1px solid rgba(255,255,255,0.15)", scrollbarWidth: "none" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex: "1 1 0", minWidth: 80, padding: "10px 8px", border: "none", background: "transparent",
                color: tab === t.key ? "#fff" : "rgba(255,255,255,0.6)",
                fontSize: 12, fontWeight: tab === t.key ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap",
                borderBottom: tab === t.key ? "3px solid #fff" : "3px solid transparent", transition: "all .15s" }}>
              {t.label}{t.count !== undefined ? ` (${t.count})` : ""}
            </button>
          ))}
        </div>
      </header>

      {/* CONTENT */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 0 40px" }}>

        {/* TAB: TIN ĐĂNG */}
        {tab === "listings" && (
          <div>
            {/* Stats row */}
            <div style={{ display: "flex", gap: 10, padding: "14px 16px" }}>
              {[
                { label: "Tổng",      value: myListings.length, color: "#333" },
                { label: "Đang hiện", value: activeCount,       color: "#2e7d32" },
                { label: "Đang ẩn",  value: hiddenCount,        color: "#c00" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ flex: 1, background: "#fff", borderRadius: 12, padding: "12px 8px", textAlign: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
                  <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Card bọc toàn bộ bảng */}
            <div style={{ margin: "0 16px", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
              <div style={{ background: "#fff" }}>
                {/*
                  FIX #1: EditableBar header nằm ngay trong card trắng,
                  trực tiếp trên filter bar → trên hàng tiêu đề cột bảng.
                  Dùng pos="top" nhưng borderRadius override về 0 vì nằm trong card trắng.
                */}
                <div style={{ borderBottom: "2px solid #e8f5e9" }}>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 14px", gap: 8, background: GREEN,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", flex: 1, lineHeight: 1.4 }}>
                      {headerText || defaultHeaderPlaceholder}
                    </span>
                    <button
                      onClick={() => {
                        const v = prompt("Sửa tiêu đề:", headerText || defaultHeaderPlaceholder);
                        if (v !== null) saveText("headerText", v);
                      }}
                      style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, color: "#fff", fontSize: 15, cursor: "pointer", padding: "3px 8px", flexShrink: 0 }}>
                      🖊️
                    </button>
                  </div>
                </div>
                <MyListingsTable items={myListings} onAction={handleListingAction} onCostsSaved={handleCostsSaved} />
              </div>
              <EditableBar text={footerText} placeholder={defaultFooterPlaceholder} label="Footer" onSave={v => saveText("footerText", v)} pos="bottom" />
            </div>
          </div>
        )}

        {/* TAB: ĐÃ LƯU */}
        {tab === "saved" && (
          <div style={{ margin: "14px 16px", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
            <div style={{ background: GREEN, padding: "10px 14px", borderRadius: "10px 10px 0 0", color: "#fff", fontWeight: 700, fontSize: 13 }}>
              😍 Tin đã quan tâm ({savedListings.length})
            </div>
            <div style={{ background: "#fff" }}>
              <SavedTable items={savedListings} savedIds={savedIds} onToggleSave={handleToggleSave} />
            </div>
          </div>
        )}

        {/* TAB: LỊCH SỬ */}
        {tab === "history" && (
          <div style={{ margin: "14px 16px", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
            <div style={{ background: GREEN, padding: "10px 14px", borderRadius: "10px 10px 0 0", color: "#fff", fontWeight: 700, fontSize: 13 }}>
              🕐 Lịch sử đã xem ({viewHistory.length} tin)
            </div>
            <div style={{ background: "#fff" }}>
              <SavedTable items={viewHistory} savedIds={savedIds} onToggleSave={handleToggleSave} />
            </div>
          </div>
        )}

        {/* TAB: TÀI KHOẢN */}
        {tab === "account" && user && <AccountTab user={user} onSaved={fetchData} />}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
        @media (orientation: landscape) and (max-height: 500px) { header { position: relative !important; } }
        @media (min-width: 700px) { table { font-size: 12px !important; } th, td { padding: 6px 8px !important; } }
      `}} />
    </div>
  );
}