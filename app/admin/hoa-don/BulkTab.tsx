"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { addMonths, billTotal, electricUsage, money, monthLabel, type Building } from "../../../lib/billing";
import { downloadMeterTemplate, readMeterFile, type MeterFileRow } from "../../../lib/meter-file";
import { api, btn, card, input, label, td, th, todayVN, type MonthRow } from "./ui";
import { invalidate } from "./store";

function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/\s+/g, " ").trim();
}

type Line = {
  row: MonthRow;
  oldMeter: number;
  newMeter: number;
  waterOld: number;
  waterNew: number;
  otherAmount: number;
  otherNote: string;
  total: number;
  error: string | null;
};

export type AllFile = { rows: MeterFileRow[]; name: string };

/** Số mới đang gõ dở (chưa lưu) của 1 phòng — để điền sẵn vào file mẫu. */
export type Draft = { newMeter: number | null; waterNew: number | null };

/** Tải file mẫu gồm TẤT CẢ nhà, tất cả phòng của tháng `month` (có cột "Nhà").
 *  rows: dữ liệu building=* nếu đã có; không có thì tự tải. drafts: số đang gõ dở theo roomId. */
export async function downloadAllHousesTemplate(month: string, rows?: MonthRow[], drafts?: Record<string, Draft>) {
  const all = rows ?? (await api<{ rows: MonthRow[] }>(`/api/admin/billing/bills?month=${month}&building=*`)).rows;
  await downloadMeterTemplate(
    `so-dien-tat-ca-nha-thang-${month.slice(5)}-${month.slice(0, 4)}.xlsx`,
    `Tất cả nhà - chốt số điện, hóa đơn tháng ${monthLabel(month)}`,
    all.map((r) => {
      const d = drafts?.[r.room._id];
      return {
        building: r.room.building,
        code: r.room.code,
        tenantName: r.room.tenantName,
        oldMeter: r.bill ? r.bill.oldMeter : r.prevMeter,
        newMeter: d?.newMeter ?? (r.bill ? r.bill.newMeter : null),
        waterMeter: !!r.room.waterMeter,
        waterOld: r.bill?.waterMeter ? r.bill.waterOld : r.prevWater,
        waterNew: d?.waterNew ?? (r.bill?.waterMeter ? r.bill.waterNew : null),
      };
    })
  );
}

/* Nhập 1 file số điện cho tất cả nhà → xem trước → lập hóa đơn hàng loạt.
 * initialFile: file đã chọn ở tab Chốt điện (có cột "Nhà") → mở thẳng phần xem trước. */
export default function BulkTab({ month, buildings, initialFile }: { month: string; buildings: Building[]; initialFile?: AllFile | null }) {
  const [rows, setRows] = useState<MonthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fileRows, setFileRows] = useState<MeterFileRow[] | null>(initialFile?.rows ?? null);
  const [fileName, setFileName] = useState(initialFile?.name ?? "");
  const [readingDate, setReadingDate] = useState(todayVN());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; errors?: string[] } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ rows: MonthRow[] }>(`/api/admin/billing/bills?month=${month}&building=*`);
      setRows(data.rows);
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  // Tên/mã nhà trong file → mã nhà
  const houseOf = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of buildings) {
      m.set(norm(b.code), b.code);
      if (b.name) m.set(norm(b.name), b.code);
    }
    return (v: string | null) => (v ? m.get(norm(v)) ?? null : null);
  }, [buildings]);

  const { lines, unknown, missing } = useMemo(() => {
    // Chưa tải xong danh sách phòng → chưa so khớp (tránh báo nhầm "không tìm thấy")
    if (!fileRows || loading) return { lines: [] as Line[], unknown: [] as string[], missing: [] as MonthRow[] };
    const byKey = new Map(rows.map((r) => [`${r.room.building}|${r.room.code.toLowerCase()}`, r]));
    const used = new Set<string>();
    const unknown: string[] = [];
    const lines: Line[] = [];
    for (const f of fileRows) {
      if (f.newMeter === null && f.waterNew === null && f.otherAmount === null) continue;
      const house = houseOf(f.building);
      if (!house) { unknown.push(`${f.building ?? "(chưa ghi nhà)"} ${f.code}`); continue; }
      const r = byKey.get(`${house}|${f.code.toLowerCase()}`);
      if (!r) { unknown.push(`${house} ${f.code}`); continue; }
      used.add(r.room._id);
      const b = r.bill;
      const oldMeter = b ? b.oldMeter : r.prevMeter;
      const newMeter = f.newMeter ?? (b ? b.newMeter : NaN);
      const wm = !!r.room.waterMeter;
      const waterOld = wm ? (b?.waterMeter ? b.waterOld : r.prevWater) : 0;
      const waterNew = wm ? f.waterNew ?? (b?.waterMeter ? b.waterNew : NaN) : 0;
      const otherAmount = f.otherAmount ?? b?.otherAmount ?? 0;
      const otherNote = f.otherNote ?? b?.otherNote ?? "";
      let error: string | null = null;
      if (isNaN(newMeter)) error = "Thiếu số điện mới";
      else if (newMeter < oldMeter) error = `Điện mới < cũ (${oldMeter})`;
      else if (wm && isNaN(waterNew)) error = "Thiếu số nước mới";
      else if (wm && waterNew < waterOld) error = `Nước mới < cũ (${waterOld})`;
      const total = error ? 0 : billTotal({ ...r.room, oldMeter, newMeter, waterOld, waterNew, otherAmount, otherNote });
      lines.push({ row: r, oldMeter, newMeter, waterOld, waterNew, otherAmount, otherNote, total, error });
    }
    const missing = rows.filter((r) => !used.has(r.room._id) && !r.bill);
    return { lines, unknown, missing };
  }, [fileRows, rows, houseOf, loading]);

  const ok = lines.filter((l) => !l.error);
  const grand = ok.reduce((s, l) => s + l.total, 0);

  const pick = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    setMsg(null);
    try {
      const parsed = await readMeterFile(file);
      if (!parsed.some((p) => p.building))
        throw new Error("File chưa có cột “Nhà”. Hãy dùng file mẫu tất cả nhà, hoặc nhập theo từng nhà ở tab Chốt điện.");
      setFileRows(parsed);
      setFileName(file.name);
    } catch (e: any) {
      setFileRows(null);
      setMsg({ ok: false, text: e.message });
    }
  };

  const template = async () => {
    try {
      await downloadAllHousesTemplate(month, rows);
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    }
  };

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await api<{ saved: number; errors: string[] }>("/api/admin/billing/bills", {
        method: "POST",
        json: {
          month,
          readingDate,
          entries: ok.map((l) => ({
            roomId: l.row.room._id,
            oldMeter: l.oldMeter,
            newMeter: l.newMeter,
            waterOld: l.waterOld,
            waterNew: l.waterNew,
            otherAmount: l.otherAmount,
            otherNote: l.otherNote,
          })),
        },
      });
      setMsg({ ok: res.errors.length === 0, text: `Đã lập ${res.saved} hóa đơn tháng ${monthLabel(month)} cho ${new Set(ok.map((l) => l.row.room.building)).size} nhà. Vào tab Thu tiền của từng nhà để in / gửi phiếu.`, errors: res.errors });
      setFileRows(null);
      invalidate((_b, m) => m >= month); // tab từng nhà sẽ tải lại tháng này + các tháng sau
      await load();
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const billed = rows.filter((r) => r.bill).length;

  return (
    <div>
      <div style={{ ...card, display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 260, color: "#aaa", fontSize: 14, lineHeight: 1.6 }}>
          <b style={{ color: "#fff" }}>1 file cho tất cả nhà</b> — {rows.length} phòng / {buildings.length} nhà
          {billed > 0 && <> · đã lập {billed} hóa đơn tháng {monthLabel(month)}</>}.<br />
          Tải file mẫu → điền cột <b>Điện mới</b> (và <b>Nước mới</b> nếu có) ngày 23–25/{monthLabel(addMonths(month, -1)).slice(0, 2)} → nhập file → kiểm tra → lập hóa đơn.
        </div>
        <div style={{ width: 170 }}>
          <span style={label}>Ngày chốt số điện</span>
          <input type="date" value={readingDate} onChange={(e) => setReadingDate(e.target.value)} style={input} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={template} disabled={loading} style={btn("#1f1f1f")}>⬇️ Tải file mẫu tất cả nhà</button>
          <label style={{ ...btn("#2563eb"), display: "inline-block" }}>
            📤 Chọn file số điện
            <input type="file" accept=".xlsx,.csv" onChange={pick} style={{ display: "none" }} />
          </label>
        </div>
      </div>

      {msg && (
        <div style={{ ...card, marginBottom: 12, color: msg.ok ? "#4ade80" : "#f87171" }}>
          {msg.text}
          {msg.errors?.map((x) => <div key={x}>⚠️ {x}</div>)}
        </div>
      )}

      {fileRows && loading && <p style={{ color: "#888" }}>Đang đọc file “{fileName}”…</p>}
      {fileRows && !loading && (
        <>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
            <span style={{ color: "#aaa" }}>
              File <b style={{ color: "#fff" }}>{fileName}</b>: {ok.length} phòng hợp lệ
              {lines.length - ok.length > 0 && <span style={{ color: "#f87171" }}> · {lines.length - ok.length} lỗi</span>}
              {unknown.length > 0 && <span style={{ color: "#fbbf24" }}> · {unknown.length} dòng không khớp phòng</span>}
              {missing.length > 0 && <span style={{ color: "#fbbf24" }}> · {missing.length} phòng chưa có số</span>}
              {" "}· Tổng <b style={{ color: "#fff" }}>{money(grand)} đ</b>
            </span>
            <button disabled={busy || ok.length === 0} onClick={save} style={{ ...btn(ok.length ? "#16a34a" : "#333"), padding: "12px 20px", fontSize: 16 }}>
              {busy ? "Đang lập..." : `💾 Lập hóa đơn ${ok.length} phòng`}
            </button>
            <button onClick={() => setFileRows(null)} style={btn("#333")}>Hủy</button>
          </div>

          {unknown.length > 0 && (
            <div style={{ color: "#fbbf24", fontSize: 13, marginBottom: 8 }}>Không tìm thấy: {unknown.join(", ")}</div>
          )}
          {missing.length > 0 && (
            <div style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>
              Chưa có số điện: {missing.map((r) => `${r.room.building} ${r.room.code}`).join(", ")}
            </div>
          )}

          <div style={{ overflowX: "auto", border: "1px solid #222", borderRadius: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  {["Nhà", "Phòng", "Điện cũ → mới", "kWh", "Nước (m³)", "Khác", "Tổng", ""].map((h) => <th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.row.room._id} style={{ background: l.error ? "#2a0f0f" : undefined }}>
                    <td style={td}>{l.row.room.building}</td>
                    <td style={td}><b style={{ color: "#ff9800" }}>{l.row.room.code}</b></td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>{l.oldMeter} → {isNaN(l.newMeter) ? "?" : l.newMeter}</td>
                    <td style={td}>{l.error ? "" : electricUsage(l.oldMeter, l.newMeter)}</td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>
                      {l.row.room.waterMeter ? `${l.waterOld} → ${isNaN(l.waterNew) ? "?" : l.waterNew}` : ""}
                    </td>
                    <td style={td}>{l.otherAmount ? `${money(l.otherAmount)} ${l.otherNote}` : ""}</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>{l.error ? "" : `${money(l.total)} đ`}</td>
                    <td style={{ ...td, fontSize: 12, color: l.error ? "#f87171" : l.row.bill ? "#fbbf24" : "#4ade80" }}>
                      {l.error ?? (l.row.bill ? "Lập lại" : "Mới")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
