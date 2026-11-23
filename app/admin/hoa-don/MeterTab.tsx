"use client";
import { useEffect, useMemo, useState } from "react";
import { addMonths, billTotal, electricUsage, money, monthLabel, parseNumber } from "../../../lib/billing";
import { downloadMeterTemplate, readMeterFile } from "../../../lib/meter-file";
import { api, btn, card, input, label, type MonthRow } from "./ui";

type Entry = { oldMeter: string; newMeter: string; waterOld: string; waterNew: string; otherAmount: string; otherNote: string };

function todayVN(): string {
  return new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
}

export default function MeterTab({
  month, building, rows, loading, onSaved, goPay, goRooms,
}: {
  month: string;
  building: string;
  rows: MonthRow[];
  loading: boolean;
  onSaved: () => Promise<void>;
  goPay: () => void;
  goRooms: () => void;
}) {
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [readingDate, setReadingDate] = useState(todayVN());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; errors?: string[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Điền sẵn: phòng đã có hóa đơn → lấy số đã lập; chưa có → số cũ = số mới của tháng trước
  useEffect(() => {
    const next: Record<string, Entry> = {};
    for (const r of rows) {
      const b = r.bill;
      next[r.room._id] = b
        ? {
            oldMeter: String(b.oldMeter), newMeter: String(b.newMeter),
            waterOld: String(b.waterMeter ? b.waterOld : r.prevWater ?? 0), waterNew: b.waterMeter ? String(b.waterNew) : "",
            otherAmount: b.otherAmount ? money(b.otherAmount) : "", otherNote: b.otherNote,
          }
        : { oldMeter: String(r.prevMeter ?? 0), newMeter: "", waterOld: String(r.prevWater ?? 0), waterNew: "", otherAmount: "", otherNote: "" };
    }
    setEntries(next);
    const withDate = rows.find((r) => r.bill?.readingDate);
    if (withDate?.bill?.readingDate) setReadingDate(withDate.bill.readingDate.slice(0, 10));
  }, [rows]);

  const set = (id: string, k: keyof Entry, v: string) =>
    setEntries((e) => ({ ...e, [id]: { ...e[id], [k]: v } }));

  const computed = useMemo(
    () =>
      rows.map((r) => {
        const e = entries[r.room._id];
        const wm = !!r.room.waterMeter;
        const filled = !!e && e.newMeter.trim() !== "" && (!wm || e.waterNew.trim() !== "");
        const oldMeter = parseNumber(e?.oldMeter);
        const newMeter = parseNumber(e?.newMeter);
        const waterOld = wm ? parseNumber(e?.waterOld) : 0;
        const waterNew = wm ? parseNumber(e?.waterNew) : 0;
        const kwh = electricUsage(oldMeter, newMeter);
        const m3 = electricUsage(waterOld, waterNew);
        const total = billTotal({
          ...r.room,
          oldMeter,
          newMeter,
          waterOld,
          waterNew,
          otherAmount: parseNumber(e?.otherAmount),
          otherNote: e?.otherNote ?? "",
        });
        const badE = !!e && e.newMeter.trim() !== "" && newMeter < oldMeter;
        const badW = wm && !!e && e.waterNew.trim() !== "" && waterNew < waterOld;
        const bad = badE || badW;
        const changed =
          !r.bill ||
          r.bill.total !== total || // giá phòng đã sửa sau khi lập
          r.bill.oldMeter !== oldMeter ||
          r.bill.newMeter !== newMeter ||
          (wm && (r.bill.waterOld !== waterOld || r.bill.waterNew !== waterNew)) ||
          (r.bill.otherAmount || 0) !== parseNumber(e?.otherAmount) ||
          (r.bill.otherNote || "") !== (e?.otherNote ?? "").trim();
        return { r, e, wm, filled, kwh, m3, total, bad, badE, badW, changed, oldMeter, newMeter, waterOld, waterNew };
      }),
    [rows, entries]
  );

  const toSave = computed.filter((c) => c.filled && !c.bad && c.changed);
  const missing = computed.filter((c) => !c.filled).length;
  const grand = computed.filter((c) => c.filled && !c.bad).reduce((s, c) => s + c.total, 0);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await api<{ saved: number; errors: string[] }>("/api/admin/billing/bills", {
        method: "POST",
        json: {
          month,
          readingDate,
          entries: toSave.map((c) => ({
            roomId: c.r.room._id,
            oldMeter: c.oldMeter,
            newMeter: c.newMeter,
            waterOld: c.waterOld,
            waterNew: c.waterNew,
            otherAmount: parseNumber(c.e?.otherAmount),
            otherNote: c.e?.otherNote ?? "",
          })),
        },
      });
      setMsg({ ok: res.errors.length === 0, text: `Đã lập ${res.saved} hóa đơn tháng ${monthLabel(month)}.`, errors: res.errors });
      await onSaved();
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      await downloadMeterTemplate(
        `so-dien-${building}-thang-${month.slice(5)}-${month.slice(0, 4)}.xlsx`,
        `Nhà ${building} - chốt số điện, hóa đơn tháng ${monthLabel(month)}`,
        rows.map((r) => {
          const e = entries[r.room._id];
          return {
            code: r.room.code,
            tenantName: r.room.tenantName,
            oldMeter: parseNumber(e?.oldMeter),
            newMeter: e?.newMeter.trim() ? parseNumber(e.newMeter) : null,
            waterMeter: !!r.room.waterMeter,
            waterOld: parseNumber(e?.waterOld),
            waterNew: e?.waterNew.trim() ? parseNumber(e.waterNew) : null,
          };
        })
      );
    } catch (e: any) {
      setImportMsg({ ok: false, text: e.message });
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
      const byCode = new Map(rows.map((r) => [r.room.code.toLowerCase(), r.room._id]));
      const unknown: string[] = [];
      let filled = 0;
      const next = { ...entries };
      for (const f of fileRows) {
        const id = byCode.get(f.code.toLowerCase());
        if (!id) { unknown.push(f.code); continue; }
        const e = { ...next[id] };
        if (f.newMeter !== null) { e.newMeter = String(f.newMeter); filled++; }
        if (f.waterNew !== null) e.waterNew = String(f.waterNew);
        if (f.otherAmount !== null) e.otherAmount = money(f.otherAmount);
        if (f.otherNote !== null) e.otherNote = f.otherNote;
        next[id] = e;
      }
      setEntries(next);
      setImportMsg({
        ok: filled > 0,
        text:
          `Đã điền số mới cho ${filled} phòng từ file “${file.name}”. Kiểm tra lại rồi bấm Lưu & lập hóa đơn.` +
          (unknown.length ? ` Không có phòng: ${[...new Set(unknown)].join(", ")}.` : ""),
      });
    } catch (e: any) {
      setImportMsg({ ok: false, text: e.message });
    } finally {
      setImporting(false);
    }
  };

  if (loading && rows.length === 0) return <p style={{ color: "#888" }}>Đang tải...</p>;
  if (!loading && rows.length === 0)
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
          <input type="date" value={readingDate} onChange={(e) => setReadingDate(e.target.value)} style={input} />
        </div>
        <div style={{ color: "#aaa", fontSize: 14, flex: 1, minWidth: 220 }}>
          Nhập <b>số điện mới</b> (và số nước với phòng có đồng hồ nước) của từng phòng (đồng hồ ngày 23–25/{monthLabel(addMonths(month, -1)).slice(0, 2)}).
          Số cũ tự lấy từ hóa đơn tháng trước. Hệ thống tự tính tiền phòng, điện, nước, xe, phí quản lý.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={downloadTemplate} style={btn("#1f1f1f")}>⬇️ Tải file mẫu</button>
          <label style={{ ...btn("#2563eb"), display: "inline-block" }}>
            {importing ? "Đang đọc..." : "📤 Nhập file số điện"}
            <input type="file" accept=".xlsx,.csv" onChange={importFile} style={{ display: "none" }} disabled={importing} />
          </label>
        </div>
        {importMsg && <div style={{ width: "100%", fontSize: 14, color: importMsg.ok ? "#4ade80" : "#f87171" }}>{importMsg.text}</div>}
      </div>

      <div className="meter-grid">
        {computed.map(({ r, e, wm, kwh, m3, total, bad, badE, badW, filled, changed }) => (
          <div key={r.room._id} style={{ ...card, borderColor: bad ? "#b91c1c" : r.bill && !changed ? "#14532d" : "#222" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10, gap: 8 }}>
              <div>
                <span style={{ fontSize: 20, fontWeight: 800, color: "#ff9800" }}>{r.room.code}</span>
                {r.room.tenantName && <span style={{ color: "#888", marginLeft: 8, fontSize: 13 }}>{r.room.tenantName}</span>}
              </div>
              {r.bill && !changed ? (
                <span style={{ fontSize: 12, color: "#4ade80" }}>✓ Đã lập</span>
              ) : r.bill ? (
                <span style={{ fontSize: 12, color: "#fbbf24" }}>Đã sửa — chưa lưu</span>
              ) : null}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 8 }}>
              <div>
                <span style={label}>Điện cũ</span>
                <input inputMode="numeric" value={e?.oldMeter ?? ""} onChange={(ev) => set(r.room._id, "oldMeter", ev.target.value)} style={{ ...input, color: "#aaa" }} />
              </div>
              <div>
                <span style={label}>Điện mới ⚡</span>
                <input
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Nhập số"
                  value={e?.newMeter ?? ""}
                  onChange={(ev) => set(r.room._id, "newMeter", ev.target.value)}
                  style={{ ...input, fontSize: 18, fontWeight: 700, borderColor: badE ? "#b91c1c" : "#ff9800" }}
                />
              </div>
              {wm && (
                <>
                  <div>
                    <span style={label}>Nước cũ</span>
                    <input inputMode="numeric" value={e?.waterOld ?? ""} onChange={(ev) => set(r.room._id, "waterOld", ev.target.value)} style={{ ...input, color: "#aaa" }} />
                  </div>
                  <div>
                    <span style={label}>Nước mới 💧</span>
                    <input
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="Nhập số"
                      value={e?.waterNew ?? ""}
                      onChange={(ev) => set(r.room._id, "waterNew", ev.target.value)}
                      style={{ ...input, fontSize: 18, fontWeight: 700, borderColor: badW ? "#b91c1c" : "#3b82f6" }}
                    />
                  </div>
                </>
              )}
              <div>
                <span style={label}>Khác (đ)</span>
                <input inputMode="numeric" placeholder="0" value={e?.otherAmount ?? ""} onChange={(ev) => set(r.room._id, "otherAmount", ev.target.value)} style={input} />
              </div>
              <div>
                <span style={label}>Nội dung khác</span>
                <input placeholder="VD: Tủ lạnh" value={e?.otherNote ?? ""} onChange={(ev) => set(r.room._id, "otherNote", ev.target.value)} style={input} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 14 }}>
              <span style={{ color: bad ? "#f87171" : "#aaa" }}>
                {badE ? "Số điện mới nhỏ hơn số cũ!" : badW ? "Số nước mới nhỏ hơn số cũ!" : filled
                  ? `${kwh} kWh = ${money(kwh * r.room.electricPrice)} đ` + (wm ? ` · ${m3} m³` : "")
                  : "Chưa nhập"}
              </span>
              {filled && !bad && <b>{money(total)} đ</b>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ position: "sticky", bottom: 0, background: "#000", padding: "12px 0", borderTop: "1px solid #222", marginTop: 12, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button disabled={saving || toSave.length === 0} onClick={save} style={{ ...btn(toSave.length ? "#16a34a" : "#333"), padding: "12px 20px", fontSize: 16, opacity: saving ? 0.6 : 1 }}>
          {saving ? "Đang lưu..." : `💾 Lưu & lập hóa đơn (${toSave.length} phòng)`}
        </button>
        <span style={{ color: "#aaa", fontSize: 14 }}>
          Tổng dự kiến: <b style={{ color: "#fff" }}>{money(grand)} đ</b>
          {missing > 0 && <> · <span style={{ color: "#fbbf24" }}>{missing} phòng chưa nhập số</span></>}
        </span>
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

      <style>{`.meter-grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
        @media(max-width:400px){.meter-grid{grid-template-columns:1fr}}`}</style>
    </div>
  );
}
