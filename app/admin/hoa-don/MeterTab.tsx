"use client";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { addMonths, money, monthLabel, parseNumber } from "../../../lib/billing";
import { readMeterFile, type MeterFileRow } from "../../../lib/meter-file";
import { downloadAllHousesTemplate, type Draft } from "./BulkTab";
import { api, btn, card, input, label, todayVN, type Bill, type MonthRow } from "./ui";
import { applyBills, invalidateAfter } from "./store";
import { computeRow, entryFromRow, loadDraft, saveDraft, shouldSave, type Edits, type Entry, type Field } from "./meter/logic";
import MeterRow, { meterTableCss } from "./meter/MeterRow";

type Msg = { ok: boolean; text: string; errors?: string[] };

/* Tab "Chốt điện từng nhà".
 * - Số đang nhập = dữ liệu máy chủ (base) + các dòng đã sửa (edits). Không cần đồng bộ bằng useEffect.
 * - Bấm Lưu chạy ngầm: vẫn gõ tiếp được; dòng nào sửa thêm trong lúc lưu sẽ giữ lại để lưu lần sau.
 * - Nháp tự lưu trên máy (localStorage) → đổi tab / đổi nhà / F5 không mất số đã gõ.
 * - Ctrl+S (⌘S) = Lưu & lập hóa đơn. */
export default function MeterTab({
  month, building, rows, ready, goPay, goRooms, onAllFile,
}: {
  month: string;
  building: string;
  rows: MonthRow[];
  ready: boolean;
  goPay: () => void;
  goRooms: () => void;
  /** File có cột "Nhà" (file tất cả nhà) → chuyển sang xem trước & lập hóa đơn cho mọi nhà cùng lúc */
  onAllFile: (rows: MeterFileRow[], name: string) => void;
}) {
  const [draft] = useState(() => loadDraft(building, month));
  const [edits, setEdits] = useState<Edits>(() => draft?.edits ?? {});
  const [dateEdit, setDateEdit] = useState<string | null>(() => draft?.readingDate ?? null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<Msg | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<Msg | null>(null);

  // Giá trị gốc từng dòng theo dữ liệu máy chủ — chỉ tính lại khi dữ liệu máy chủ đổi
  const base = useMemo(() => {
    const m: Record<string, Entry> = {};
    for (const r of rows) m[r.room._id] = entryFromRow(r);
    return m;
  }, [rows]);

  const savedDate = useMemo(() => rows.find((r) => r.bill?.readingDate)?.bill?.readingDate?.slice(0, 10), [rows]);
  const readingDate = dateEdit ?? savedDate ?? todayVN();
  const anyWater = useMemo(() => rows.some((r) => r.room.waterMeter), [rows]);
  const dirtyCount = Object.keys(edits).length;

  // Tự lưu nháp (chạy sau khi vẽ xong → không làm chậm lúc gõ)
  useEffect(() => {
    saveDraft(building, month, { edits, readingDate: dateEdit });
  }, [building, month, edits, dateEdit]);

  const onChange = useCallback(
    (id: string, field: Field, value: string) =>
      setEdits((ed) => ({ ...ed, [id]: { ...(ed[id] ?? base[id]), [field]: value } })),
    [base]
  );

  // Tổng & đếm ở thanh dưới: dùng giá trị "trễ" để ô đang gõ luôn được ưu tiên vẽ trước
  const lazyEdits = useDeferredValue(edits);
  const summary = useMemo(() => {
    let toSave = 0, missing = 0, grand = 0;
    for (const r of rows) {
      const c = computeRow(r, lazyEdits[r.room._id] ?? base[r.room._id]);
      if (!c.filled) missing++;
      else if (!c.bad) grand += c.total;
      if (shouldSave(c)) toSave++;
    }
    return { toSave, missing, grand };
  }, [rows, base, lazyEdits]);

  const save = async () => {
    if (saving) return;
    // Chụp lại đúng các dòng gửi đi (tính từ giá trị mới nhất, không dùng giá trị "trễ")
    const batch = rows
      .map((r) => {
        const e = edits[r.room._id] ?? base[r.room._id];
        return { id: r.room._id, e, c: computeRow(r, e) };
      })
      .filter((x) => shouldSave(x.c));
    if (!batch.length) return;

    setSaving(true);
    setMsg(null);
    try {
      const res = await api<{ saved: number; errors: string[]; bills?: Bill[] }>("/api/admin/billing/bills", {
        method: "POST",
        json: { month, readingDate, entries: batch.map((x) => x.c.payload) },
      });
      const bills = res.bills ?? [];
      applyBills(building, month, bills);
      invalidateAfter(building, month);
      // Bỏ nháp của các dòng đã lưu — trừ dòng người dùng sửa tiếp trong lúc đang lưu
      const savedIds = new Set(bills.map((b) => b.roomId));
      setEdits((ed) => {
        const next = { ...ed };
        for (const x of batch) if (savedIds.has(x.id) && next[x.id] === x.e) delete next[x.id];
        return next;
      });
      setDateEdit((d) => (d === readingDate ? null : d));
      setMsg({ ok: res.errors.length === 0, text: `Đã lập ${res.saved} hóa đơn tháng ${monthLabel(month)}.`, errors: res.errors });
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setSaving(false);
    }
  };

  // Ctrl+S / ⌘S → lưu (luôn gọi bản save mới nhất)
  const saveRef = useRef(save);
  useEffect(() => { saveRef.current = save; });
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "s") {
        ev.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const discard = () => {
    if (!confirm(`Bỏ số đã nhập nhưng chưa lưu của ${dirtyCount} phòng?`)) return;
    setEdits({});
    setDateEdit(null);
  };

  // File mẫu gồm tất cả nhà, tất cả phòng (số đang gõ dở của nhà này cũng được điền sẵn)
  const [downloading, setDownloading] = useState(false);
  const downloadTemplate = async () => {
    setDownloading(true);
    try {
      const drafts: Record<string, Draft> = {};
      for (const [id, e] of Object.entries(edits)) {
        drafts[id] = {
          newMeter: e.newMeter.trim() ? parseNumber(e.newMeter) : null,
          waterNew: e.waterNew.trim() ? parseNumber(e.waterNew) : null,
        };
      }
      await downloadAllHousesTemplate(month, undefined, drafts);
    } catch (e: any) {
      setImportMsg({ ok: false, text: e.message });
    } finally {
      setDownloading(false);
    }
  };

  const importFile = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const fileRows = await readMeterFile(file);
      // File tất cả nhà → cập nhật mọi nhà cùng lúc ở màn xem trước
      if (fileRows.some((f) => f.building)) {
        onAllFile(fileRows, file.name);
        return;
      }
      const byCode = new Map(rows.map((r) => [r.room.code.toLowerCase(), r.room._id]));
      const unknown = new Set<string>();
      const patch: Edits = {};
      let filled = 0;
      for (const f of fileRows) {
        const id = byCode.get(f.code.toLowerCase());
        if (!id) { unknown.add(f.code); continue; }
        const e = { ...(patch[id] ?? edits[id] ?? base[id]) };
        if (f.newMeter !== null) { e.newMeter = String(f.newMeter); filled++; }
        if (f.waterNew !== null) e.waterNew = String(f.waterNew);
        if (f.otherAmount !== null) e.otherAmount = money(f.otherAmount);
        if (f.otherNote !== null) e.otherNote = f.otherNote;
        patch[id] = e;
      }
      setEdits((ed) => ({ ...ed, ...patch }));
      setImportMsg({
        ok: filled > 0,
        text:
          `Đã điền số mới cho ${filled} phòng từ file “${file.name}”. Kiểm tra lại rồi bấm Lưu & lập hóa đơn.` +
          (unknown.size ? ` Không có phòng: ${[...unknown].join(", ")}.` : ""),
      });
    } catch (e: any) {
      setImportMsg({ ok: false, text: e.message });
    } finally {
      setImporting(false);
    }
  };

  if (!ready) return <p style={{ color: "#888" }}>Đang tải...</p>;
  if (rows.length === 0)
    return (
      <div style={card}>
        <p style={{ marginTop: 0 }}>Chưa có phòng nào. Hãy thêm phòng hoặc nhập danh sách phòng từ file Excel trước.</p>
        <button onClick={goRooms} style={btn("#ff9800", "#000")}>🏠 Đến mục Phòng</button>
      </div>
    );

  return (
    <div>
      <div style={{ ...card, display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ width: 180 }}>
          <span style={label}>Ngày chốt số điện</span>
          <input type="date" value={readingDate} onChange={(e) => setDateEdit(e.target.value)} style={input} />
        </div>
        <div style={{ color: "#aaa", fontSize: 14, flex: 1, minWidth: 220 }}>
          Nhập <b>số điện mới</b> (và số nước với phòng có đồng hồ nước) của từng phòng (đồng hồ ngày 23–25/{monthLabel(addMonths(month, -1)).slice(0, 2)}).
          Số cũ tự lấy từ hóa đơn tháng trước. Hệ thống tự tính tiền phòng, điện, nước, xe, phí quản lý.
          <br />File mẫu gồm <b>tất cả nhà</b> — điền xong nhập lại 1 lần là lập hóa đơn cho mọi nhà.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={downloadTemplate} disabled={downloading} style={btn("#1f1f1f")} title="1 file gồm tất cả nhà, tất cả phòng">
            {downloading ? "Đang tạo file..." : "⬇️ Tải file mẫu (tất cả nhà)"}
          </button>
          <label style={{ ...btn("#2563eb"), display: "inline-block" }}>
            {importing ? "Đang đọc..." : "📤 Nhập file số điện"}
            <input type="file" accept=".xlsx,.csv" onChange={importFile} style={{ display: "none" }} disabled={importing} />
          </label>
        </div>
        {importMsg && <div style={{ width: "100%", fontSize: 14, color: importMsg.ok ? "#4ade80" : "#f87171" }}>{importMsg.text}</div>}
      </div>

      <div style={{ overflowX: "auto", border: "1px solid #222", borderRadius: 12 }}>
        <table className="meter-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Phòng</th>
              <th>Điện cũ</th>
              <th>Điện mới ⚡</th>
              {anyWater && <th>Nước cũ</th>}
              {anyWater && <th>Nước mới 💧</th>}
              <th className="r">Tiêu thụ</th>
              <th>Khác (đ)</th>
              <th>Nội dung khác</th>
              <th className="r">Tổng tiền</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <MeterRow
                key={r.room._id}
                index={i}
                row={r}
                entry={edits[r.room._id] ?? base[r.room._id]}
                anyWater={anyWater}
                onChange={onChange}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ position: "sticky", bottom: 0, background: "#000", padding: "12px 0", borderTop: "1px solid #222", marginTop: 12, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button
          disabled={saving || summary.toSave === 0}
          onClick={save}
          title="Phím tắt: Ctrl+S"
          style={{ ...btn(summary.toSave ? "#16a34a" : "#333"), padding: "12px 20px", fontSize: 16, opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Đang lưu..." : `💾 Lưu & lập hóa đơn (${summary.toSave} phòng)`}
        </button>
        <span style={{ color: "#aaa", fontSize: 14 }}>
          Tổng dự kiến: <b style={{ color: "#fff" }}>{money(summary.grand)} đ</b>
          {summary.missing > 0 && <> · <span style={{ color: "#fbbf24" }}>{summary.missing} phòng chưa nhập số</span></>}
        </span>
        {dirtyCount > 0 && (
          <span style={{ color: "#777", fontSize: 13 }}>
            Nháp {dirtyCount} phòng tự lưu trên máy này ·{" "}
            <button onClick={discard} style={{ ...btn("transparent", "#aaa"), padding: 0, fontWeight: 400, fontSize: 13, textDecoration: "underline" }}>
              Bỏ thay đổi
            </button>
          </span>
        )}
        {msg && (
          <div style={{ width: "100%", color: msg.ok ? "#4ade80" : "#f87171", fontSize: 14 }}>
            {msg.text}{" "}
            {msg.ok && (
              <button onClick={goPay} style={{ ...btn("transparent", "#ff9800"), padding: 0, textDecoration: "underline" }}>
                Xem / in / gửi phiếu →
              </button>
            )}
            {msg.errors?.map((x) => <div key={x}>⚠️ {x}</div>)}
          </div>
        )}
      </div>

      <style>{meterTableCss}</style>
    </div>
  );
}
