"use client";
import { memo, useMemo } from "react";
import { money } from "../../../../lib/billing";
import type { MonthRow } from "../ui";
import { computeRow, type Entry, type Field, type RowStatus } from "./logic";

/* 1 dòng của bảng chốt điện. memo → gõ ở 1 phòng chỉ vẽ lại đúng dòng đó, không vẽ lại cả bảng. */

export type ChangeFn = (roomId: string, field: Field, value: string) => void;

const STATUS: Record<RowStatus, [text: string, color: string]> = {
  saved: ["✓ Đã lập", "#4ade80"],
  edited: ["Đã sửa", "#fbbf24"],
  new: ["Mới", "#60a5fa"],
  empty: ["Chưa nhập", "#555"],
};

/** Enter ở ô số mới → nhảy xuống ô số mới của phòng kế tiếp (nhập nhanh như Excel). */
function nextOnEnter(ev: React.KeyboardEvent<HTMLInputElement>) {
  if (ev.key !== "Enter") return;
  ev.preventDefault();
  const all = Array.from(document.querySelectorAll<HTMLInputElement>('input[data-nav="meter"]'));
  const next = all[all.indexOf(ev.currentTarget) + 1];
  if (next) { next.focus(); next.select(); }
}

function MeterRow({ index, row, entry, anyWater, onChange }: {
  index: number;
  row: MonthRow;
  entry: Entry;
  anyWater: boolean;
  onChange: ChangeFn;
}) {
  const c = useMemo(() => computeRow(row, entry), [row, entry]);
  const id = row.room._id;
  const bind = (field: Field) => ({
    value: entry[field],
    onChange: (ev: React.ChangeEvent<HTMLInputElement>) => onChange(id, field, ev.target.value),
  });
  const [statusText, statusColor] = STATUS[c.status];

  return (
    <tr className={c.bad ? "bad" : undefined}>
      <td className="muted">{index + 1}</td>
      <td className="room">
        <b>{row.room.code}</b>
        {row.room.tenantName && <div className="tenant">{row.room.tenantName}</div>}
      </td>
      <td><input inputMode="numeric" className="old" style={{ width: 90 }} {...bind("oldMeter")} /></td>
      <td>
        <input
          data-nav="meter"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Nhập số"
          className={`new ${c.badE ? "err" : "elec"}`}
          style={{ width: 110 }}
          onKeyDown={nextOnEnter}
          {...bind("newMeter")}
        />
      </td>
      {anyWater && (
        <td>{c.wm && <input inputMode="numeric" className="old" style={{ width: 80 }} {...bind("waterOld")} />}</td>
      )}
      {anyWater && (
        <td>
          {c.wm && (
            <input
              data-nav="meter"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Nhập số"
              className={`new ${c.badW ? "err" : "water"}`}
              style={{ width: 95 }}
              onKeyDown={nextOnEnter}
              {...bind("waterNew")}
            />
          )}
        </td>
      )}
      <td className={`usage${c.bad ? " err-text" : ""}`}>
        {c.badE ? "Mới < cũ!" : c.badW ? "Nước mới < cũ!" : entry.newMeter.trim() ? `${c.kwh} kWh` : "—"}
        {c.wm && !c.badW && entry.waterNew.trim() && <div>{c.m3} m³</div>}
      </td>
      <td><input inputMode="numeric" placeholder="0" style={{ width: 100 }} {...bind("otherAmount")} /></td>
      <td><input placeholder="VD: Tủ lạnh" style={{ width: 150 }} {...bind("otherNote")} /></td>
      <td className="total">{c.filled && !c.bad ? `${money(c.total)} đ` : ""}</td>
      <td className="status" style={{ color: statusColor }}>{statusText}</td>
    </tr>
  );
}

export default memo(MeterRow);

/** CSS của bảng — dùng class thay vì style inline cho từng ô (nhẹ hơn khi bảng dài). */
export const meterTableCss = `
.meter-table{width:100%;border-collapse:collapse;font-size:14px}
.meter-table th{padding:10px 12px;text-align:left;background:#1a1a1a;color:#aaa;font-size:13px;font-weight:500;border-bottom:1px solid #222;white-space:nowrap}
.meter-table th.r{text-align:right}
.meter-table td{padding:6px 8px;border-bottom:1px solid #1a1a1a;vertical-align:middle}
.meter-table tbody tr:hover{background:#151515}
.meter-table tbody tr.bad{background:#2a0f0f}
.meter-table input{padding:7px 8px;background:#222;color:#fff;border:1px solid #444;border-radius:8px;box-sizing:border-box;font-size:15px}
.meter-table input.old{color:#aaa}
.meter-table input.new{font-weight:700;font-size:16px}
.meter-table input.elec{border-color:#ff9800}
.meter-table input.water{border-color:#3b82f6}
.meter-table input.err{border-color:#b91c1c}
.meter-table .muted{color:#666}
.meter-table .room{white-space:nowrap}
.meter-table .room b{font-size:16px;color:#ff9800}
.meter-table .tenant{color:#888;font-size:11px;max-width:140px;overflow:hidden;text-overflow:ellipsis}
.meter-table .usage{text-align:right;white-space:nowrap;color:#aaa;font-size:13px}
.meter-table .err-text{color:#f87171}
.meter-table .total{text-align:right;font-weight:700;white-space:nowrap}
.meter-table .status{font-size:12px;white-space:nowrap}
`;
