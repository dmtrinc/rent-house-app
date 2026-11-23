"use client";
import { useEffect, useState } from "react";
import { money, parseNumber } from "../../../lib/billing";
import { api, btn, card, input, label, smallBtn, td, th, type Room } from "./ui";

type Form = Record<string, string | boolean>;

const EMPTY: Form = {
  code: "", tenantName: "", phone: "", people: "1", vehicles: "1", rent: "", deposit: "",
  electricPrice: "4,000", waterPrice: "100,000", parkingPrice: "100,000", serviceFee: "200,000",
  contractStart: "", contractEnd: "", meterStart: "", waterMeterStart: "", note: "", active: true, waterMeter: false,
};

const FIELDS: [string, string, "text" | "money" | "num" | "date"][] = [
  ["code", "Số phòng *", "text"],
  ["tenantName", "Tên khách", "text"],
  ["phone", "SĐT", "text"],
  ["people", "Số người (tính nước)", "num"],
  ["vehicles", "Số xe", "num"],
  ["rent", "Giá thuê (đ)", "money"],
  ["deposit", "Tiền cọc (đ)", "money"],
  ["electricPrice", "Giá điện (đ/kWh)", "money"],
  ["waterPrice", "Giá nước (đ/người hoặc đ/m³)", "money"],
  ["parkingPrice", "Giá giữ xe (đ/xe)", "money"],
  ["serviceFee", "Phí quản lý (đ/phòng)", "money"],
  ["meterStart", "Chỉ số điện gốc", "num"],
  ["waterMeterStart", "Chỉ số nước gốc (nếu có ĐH nước)", "num"],
  ["contractStart", "HĐ bắt đầu", "date"],
  ["contractEnd", "HĐ kết thúc", "date"],
];

function toForm(r: Room): Form {
  const f: Form = { ...EMPTY };
  for (const [k, , t] of FIELDS) {
    const v = (r as any)[k];
    f[k] = t === "date" ? (v ? String(v).slice(0, 10) : "") : t === "money" ? money(v) : String(v ?? "");
  }
  f.note = r.note ?? "";
  f.active = r.active;
  f.waterMeter = !!r.waterMeter;
  return f;
}

/* ─── Nhập từ Excel ──────────────────────────────────────────────────────────
 * Bôi đen các dòng phòng trong sheet "DOANH THU" từ cột B (STT) đến cột Z (Nội dung),
 * Ctrl+C rồi dán vào ô. Thứ tự cột theo file DOANH THU NTL. */
function excelDate(s: string): string {
  const m = s.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!m) return "";
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function parsePaste(text: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const line of text.split(/\r?\n/)) {
    const raw = line.split("\t");
    if (raw.length < 14) continue;
    // Dán từ cột B (có STT) → 25 cột; dán từ cột C → bỏ lệch 1 cột
    const c = raw.length >= 25 ? raw : ["", ...raw];
    const code = (c[1] ?? "").trim();
    if (!code || /phòng|phong/i.test(code)) continue;
    const n = (i: number) => parseNumber(c[i]);
    out.push({
      code,
      tenantName: (c[2] ?? "").trim(),
      phone: (c[3] ?? "").trim(),
      people: n(5),
      vehicles: n(6),
      contractStart: excelDate(c[8] ?? "") || null,
      contractEnd: excelDate(c[9] ?? "") || null,
      rent: n(10),
      deposit: n(11),
      meterStart: n(13) || n(12), // số điện mới của tháng trong file = số cũ của kỳ tới
      electricPrice: n(15) || 4000,
      waterPrice: n(17) || 100000,
      parkingPrice: n(19) || 100000,
      serviceFee: n(22) || n(21),
      active: true,
    });
  }
  return out;
}

export default function RoomsTab({ building, onChanged }: { building: string; onChanged: () => Promise<void> }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [editing, setEditing] = useState<Room | "new" | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [showImport, setShowImport] = useState(false);
  const [paste, setPaste] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => setRooms(await api<Room[]>(`/api/admin/billing/rooms?building=${encodeURIComponent(building)}`));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load().catch((e) => setErr(e.message)); }, [building]);

  const open = (r: Room | "new") => {
    setErr("");
    setEditing(r);
    setForm(r === "new" ? EMPTY : toForm(r));
  };

  const save = async () => {
    setBusy(true);
    setErr("");
    try {
      const body: Record<string, unknown> = { building, note: form.note, active: form.active, waterMeter: form.waterMeter };
      for (const [k, , t] of FIELDS) body[k] = t === "money" || t === "num" ? parseNumber(form[k]) : form[k] || (t === "date" ? null : "");
      if (editing === "new") await api("/api/admin/billing/rooms", { method: "POST", json: body });
      else await api(`/api/admin/billing/rooms/${(editing as Room)._id}`, { method: "PATCH", json: body });
      setEditing(null);
      await load();
      await onChanged();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const del = async (r: Room) => {
    if (!confirm(`Xóa phòng ${r.code}?`)) return;
    try {
      await api(`/api/admin/billing/rooms/${r._id}`, { method: "DELETE" });
      setEditing(null);
      await load();
      await onChanged();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const preview = parsePaste(paste);
  const doImport = async () => {
    setBusy(true);
    setErr("");
    try {
      const res = await api<{ created: number; updated: number }>("/api/admin/billing/rooms", { method: "POST", json: { building, rooms: preview } });
      alert(`Đã thêm ${res.created} phòng, cập nhật ${res.updated} phòng.`);
      setShowImport(false);
      setPaste("");
      await load();
      await onChanged();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={() => open("new")} style={btn("#16a34a")}>+ Thêm phòng</button>
        <button onClick={() => setShowImport((v) => !v)} style={btn("#1f1f1f")}>📥 Nhập từ Excel</button>
        <span style={{ color: "#888", alignSelf: "center", fontSize: 13 }}>
          {rooms.filter((r) => r.active).length} phòng đang thuê · {rooms.filter((r) => !r.active).length} trống
        </span>
      </div>
      {err && <div style={{ color: "#f87171", marginBottom: 12 }}>{err}</div>}

      {showImport && (
        <div style={{ ...card, marginBottom: 16 }}>
          <p style={{ marginTop: 0, color: "#ccc", fontSize: 14 }}>
            Mở file Excel doanh thu, sheet <b>DOANH THU</b>: bôi đen các dòng phòng từ <b>cột B (STT)</b> đến{" "}
            <b>cột Z (Nội dung)</b>, nhấn Ctrl+C rồi dán vào ô dưới. Phòng trùng số sẽ được cập nhật.
            Cột <b>SỐ ĐIỆN MỚI</b> được lấy làm chỉ số điện gốc cho kỳ tới.
          </p>
          <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={5} placeholder="Dán dữ liệu ở đây..." style={{ ...input, fontFamily: "monospace", fontSize: 12 }} />
          {preview.length > 0 && (
            <>
              <div style={{ overflowX: "auto", marginTop: 12 }}>
                <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%" }}>
                  <thead>
                    <tr>{["Phòng", "Người", "Xe", "Giá thuê", "Cọc", "Chỉ số điện", "Giá điện", "Nước/ng", "Xe/chiếc", "Quản lý", "HĐ"].map((h) => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {preview.map((p: any) => (
                      <tr key={p.code}>
                        <td style={td}><b>{p.code}</b></td>
                        <td style={td}>{p.people}</td>
                        <td style={td}>{p.vehicles}</td>
                        <td style={td}>{money(p.rent)}</td>
                        <td style={td}>{money(p.deposit)}</td>
                        <td style={td}>{p.meterStart}</td>
                        <td style={td}>{money(p.electricPrice)}</td>
                        <td style={td}>{money(p.waterPrice)}</td>
                        <td style={td}>{money(p.parkingPrice)}</td>
                        <td style={td}>{money(p.serviceFee)}</td>
                        <td style={{ ...td, whiteSpace: "nowrap" }}>{p.contractStart ?? "?"} → {p.contractEnd ?? "?"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button disabled={busy} onClick={doImport} style={{ ...btn("#ff9800", "#000"), marginTop: 12 }}>
                Nhập {preview.length} phòng
              </button>
            </>
          )}
          {paste && preview.length === 0 && <p style={{ color: "#fbbf24" }}>Không đọc được dòng nào — hãy chép đủ từ cột B đến cột Z.</p>}
        </div>
      )}

      <div style={{ overflowX: "auto", border: "1px solid #222", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              {["Phòng", "Khách", "Người/Xe", "Giá thuê", "Điện", "Nước", "Xe", "Quản lý", "HĐ đến", ""].map((h) => <th key={h} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rooms.map((r) => {
              const expired = r.contractEnd && new Date(r.contractEnd) < new Date();
              return (
                <tr key={r._id} style={{ opacity: r.active ? 1 : 0.45 }}>
                  <td style={td}><b style={{ color: "#ff9800" }}>{r.code}</b>{!r.active && <span style={{ fontSize: 11, marginLeft: 6 }}>(trống)</span>}</td>
                  <td style={td}>{r.tenantName || <span style={{ color: "#555" }}>—</span>}<div style={{ fontSize: 12, color: "#888" }}>{r.phone}</div></td>
                  <td style={td}>{r.people} / {r.vehicles}</td>
                  <td style={td}>{money(r.rent)}</td>
                  <td style={td}>{money(r.electricPrice)}</td>
                  <td style={td}>{money(r.waterPrice)}{r.waterMeter && <span style={{ color: "#60a5fa", fontSize: 11 }}> /m³</span>}</td>
                  <td style={td}>{money(r.parkingPrice)}</td>
                  <td style={td}>{money(r.serviceFee)}</td>
                  <td style={{ ...td, whiteSpace: "nowrap", color: expired ? "#f87171" : "#aaa" }}>
                    {r.contractEnd ? new Date(r.contractEnd).toLocaleDateString("vi-VN") : "—"}
                  </td>
                  <td style={td}><button onClick={() => open(r)} style={smallBtn}>✏️ Sửa</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <div onClick={() => setEditing(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 12 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...card, width: "100%", maxWidth: 640, maxHeight: "92vh", overflowY: "auto" }}>
            <h3 style={{ marginTop: 0 }}>{editing === "new" ? "Thêm phòng" : `Sửa phòng ${(editing as Room).code}`}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10 }}>
              {FIELDS.map(([k, l, t]) => (
                <div key={k}>
                  <span style={label}>{l}</span>
                  <input
                    type={t === "date" ? "date" : "text"}
                    inputMode={t === "money" || t === "num" ? "numeric" : undefined}
                    value={String(form[k] ?? "")}
                    onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                    onBlur={t === "money" ? () => setForm((f) => ({ ...f, [k]: money(parseNumber(f[k])) })) : undefined}
                    style={input}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10 }}>
              <span style={label}>Ghi chú</span>
              <input value={String(form.note)} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} style={input} />
            </div>
            <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={!!form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
              Đang cho thuê (bỏ chọn = phòng trống, không lập hóa đơn)
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={!!form.waterMeter} onChange={(e) => setForm((f) => ({ ...f, waterMeter: e.target.checked }))} />
              Tính nước theo đồng hồ (m³) — giá nước là đ/m³, mỗi tháng nhập thêm số nước
            </label>
            {editing !== "new" && (
              <p style={{ color: "#888", fontSize: 12 }}>
                Sửa giá chỉ áp dụng cho hóa đơn lập sau. Muốn tính lại hóa đơn tháng này, vào tab Chốt điện và bấm Lưu lại.
              </p>
            )}
            {err && <div style={{ color: "#f87171", marginTop: 8 }}>{err}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <button disabled={busy} onClick={save} style={btn("#16a34a")}>{busy ? "Đang lưu..." : "Lưu"}</button>
              <button onClick={() => setEditing(null)} style={btn("#333")}>Hủy</button>
              {editing !== "new" && (
                <button onClick={() => del(editing as Room)} style={{ ...btn("transparent", "#f87171"), marginLeft: "auto" }}>Xóa phòng</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
