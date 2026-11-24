"use client";
import { useState } from "react";
import { electricUsage, money, monthLabel, parseNumber } from "../../../lib/billing";
import { api, btn, card, input, smallBtn, td, th, type Bill, type MonthRow } from "./ui";
import { applyBills, invalidateAfter, removeBill } from "./store";

function tenantLink(b: Bill) {
  return `${window.location.origin}/hoa-don/${b.token}`;
}

function zaloText(b: Bill) {
  const kwh = electricUsage(b.oldMeter, b.newMeter);
  const m3 = electricUsage(b.waterOld, b.waterNew);
  const water = b.waterMeter
    ? `nước ${m3}m³ ${b.waterOld}→${b.waterNew} = ${money(m3 * b.waterPrice)}đ`
    : `nước ${money(b.people * b.waterPrice)}đ`;
  return (
    `Phòng ${b.roomCode} - Tiền nhà tháng ${monthLabel(b.month)}: ${money(b.total)}đ\n` +
    `(Phòng ${money(b.rent)}đ, điện ${kwh}kWh ${b.oldMeter}→${b.newMeter} = ${money(kwh * b.electricPrice)}đ, ` +
    `${water}, quản lý ${money(b.serviceFee)}đ, xe ${money(b.vehicles * b.parkingPrice)}đ` +
    (b.otherAmount ? `, ${b.otherNote || "khác"} ${money(b.otherAmount)}đ` : "") +
    `)\nXem phiếu thu & mã QR chuyển khoản: ${tenantLink(b)}`
  );
}

export default function PaymentsTab({
  month, building, rows, ready,
}: {
  month: string;
  building: string;
  rows: MonthRow[];
  ready: boolean;
}) {
  const bills = rows.filter((r) => r.bill).map((r) => r.bill!) as Bill[];
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState("");
  const [busy, setBusy] = useState("");

  const patch = async (b: Bill, json: object) => {
    setBusy(b._id);
    try {
      const updated = await api<Bill>(`/api/admin/billing/bills/${b._id}`, { method: "PATCH", json });
      setDraft((d) => { const n = { ...d }; delete n[b._id]; return n; });
      applyBills(building, month, [updated]);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy("");
    }
  };

  const remove = async (b: Bill) => {
    if (!confirm(`Xóa hóa đơn phòng ${b.roomCode} tháng ${monthLabel(b.month)}? Link đã gửi khách sẽ không mở được nữa.`)) return;
    setBusy(b._id);
    try {
      await api(`/api/admin/billing/bills/${b._id}`, { method: "DELETE" });
      removeBill(building, month, b._id);
      invalidateAfter(building, month);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy("");
    }
  };

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      prompt("Sao chép nội dung:", text);
    }
  };

  if (!ready) return <p style={{ color: "#888" }}>Đang tải...</p>;
  if (bills.length === 0)
    return <div style={card}>Chưa lập hóa đơn tháng {monthLabel(month)}. Vào tab “Chốt điện & lập HĐ” để nhập số điện.</div>;

  const sum = bills.reduce((s, b) => s + b.total, 0);
  const paid = bills.reduce((s, b) => s + (b.paidAmount || 0), 0);
  const kwh = bills.reduce((s, b) => s + electricUsage(b.oldMeter, b.newMeter), 0);
  const elec = bills.reduce((s, b) => s + electricUsage(b.oldMeter, b.newMeter) * b.electricPrice, 0);
  const paidCount = bills.filter((b) => b.paidAmount >= b.total).length;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginBottom: 16 }}>
        {[
          ["Tổng phải thu", `${money(sum)} đ`, "#fff"],
          ["Đã thu", `${money(paid)} đ`, "#4ade80"],
          ["Còn thiếu", `${money(sum - paid)} đ`, sum - paid > 0 ? "#fbbf24" : "#4ade80"],
          ["Phòng đã đóng", `${paidCount}/${bills.length}`, "#fff"],
          ["Điện tiêu thụ", `${money(kwh)} kWh · ${money(elec)} đ`, "#fff"],
        ].map(([k, v, c]) => (
          <div key={k} style={card}>
            <div style={{ color: "#888", fontSize: 12 }}>{k}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: c, marginTop: 4 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <a href={`/admin/hoa-don/in?month=${month}&b=${encodeURIComponent(building)}`} target="_blank" style={{ ...btn("#ff9800", "#000"), textDecoration: "none" }}>
          🖨️ Xem & in tất cả phiếu
        </a>
        <button
          onClick={() => copy("all", bills.map(zaloText).join("\n\n"))}
          style={btn("#1f1f1f")}
        >
          {copied === "all" ? "✓ Đã chép" : "📋 Chép tin nhắn tất cả phòng"}
        </button>
      </div>

      <div style={{ overflowX: "auto", border: "1px solid #222", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              <th style={th}>Phòng</th>
              <th style={{ ...th, textAlign: "right" }}>Điện</th>
              <th style={{ ...th, textAlign: "right" }}>Tổng tiền</th>
              <th style={th}>Thực thu</th>
              <th style={{ ...th, textAlign: "right" }}>Còn thiếu</th>
              <th style={th}>Phiếu / gửi khách</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => {
              const k = electricUsage(b.oldMeter, b.newMeter);
              const owe = b.total - (b.paidAmount || 0);
              const isPaid = owe <= 0;
              return (
                <tr key={b._id} style={{ opacity: busy === b._id ? 0.5 : 1 }}>
                  <td style={td}>
                    <b style={{ color: "#ff9800", fontSize: 16 }}>{b.roomCode}</b>
                  </td>
                  <td style={{ ...td, textAlign: "right", color: "#aaa", whiteSpace: "nowrap" }}>
                    {k} kWh
                    <div style={{ fontSize: 11 }}>{b.oldMeter} → {b.newMeter}</div>
                  </td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>{money(b.total)} đ</td>
                  <td style={{ ...td, minWidth: 210 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input
                        inputMode="numeric"
                        value={draft[b._id] ?? (b.paidAmount ? money(b.paidAmount) : "")}
                        placeholder="0"
                        onChange={(e) => setDraft((d) => ({ ...d, [b._id]: e.target.value }))}
                        onBlur={() => {
                          if (draft[b._id] !== undefined && parseNumber(draft[b._id]) !== (b.paidAmount || 0))
                            patch(b, { paidAmount: parseNumber(draft[b._id]) });
                        }}
                        style={{ ...input, padding: "6px 8px", width: 120 }}
                      />
                      <button
                        onClick={() => patch(b, { paid: !isPaid })}
                        style={{ ...smallBtn, background: isPaid ? "#14532d" : "#1f1f1f", color: isPaid ? "#4ade80" : "#ddd" }}
                        title={isPaid ? "Bỏ đánh dấu đã thu" : "Đánh dấu đã thu đủ"}
                      >
                        {isPaid ? "✓ Đã thu" : "Thu đủ"}
                      </button>
                    </div>
                  </td>
                  <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap", color: owe > 0 ? "#fbbf24" : "#4ade80" }}>
                    {owe > 0 ? `${money(owe)} đ` : owe < 0 ? `Dư ${money(-owe)} đ` : "—"}
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <a href={`/admin/hoa-don/in?month=${month}&b=${encodeURIComponent(building)}&room=${encodeURIComponent(b.roomCode)}`} target="_blank" style={{ ...smallBtn, textDecoration: "none" }}>
                        👁 Xem/In
                      </a>
                      <button onClick={() => copy(b._id + "z", zaloText(b))} style={smallBtn}>
                        {copied === b._id + "z" ? "✓ Đã chép" : "💬 Tin nhắn"}
                      </button>
                      <button onClick={() => copy(b._id + "l", tenantLink(b))} style={smallBtn}>
                        {copied === b._id + "l" ? "✓ Đã chép" : "🔗 Link"}
                      </button>
                      <button onClick={() => remove(b)} style={{ ...smallBtn, color: "#f87171" }}>🗑</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
