"use client";
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { addMonths, defaultBillMonth, isMonthKey, monthLabel } from "../../../lib/billing";
import { api, btn, type MonthRow } from "./ui";
import MeterTab from "./MeterTab";
import PaymentsTab from "./PaymentsTab";
import RoomsTab from "./RoomsTab";
import SettingsTab from "./SettingsTab";

type Tab = "meter" | "pay" | "rooms" | "settings";

export default function BillingPage({ searchParams }: { searchParams: Promise<{ month?: string; tab?: string }> }) {
  const sp = use(searchParams);
  const [month, setMonth] = useState(isMonthKey(sp.month) ? sp.month : defaultBillMonth());
  const [tab, setTab] = useState<Tab>((["meter", "pay", "rooms", "settings"].includes(sp.tab ?? "") ? sp.tab : "meter") as Tab);
  const [rows, setRows] = useState<MonthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ rows: MonthRow[] }>(`/api/admin/billing/bills?month=${month}`);
      setRows(data.rows);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  // Giữ tháng + tab trên URL để F5 / quay lại từ trang in không bị mất
  useEffect(() => {
    window.history.replaceState(null, "", `/admin/hoa-don?month=${month}&tab=${tab}`);
  }, [month, tab]);

  const billCount = rows.filter((r) => r.bill).length;
  const tabs: [Tab, string][] = [
    ["meter", "⚡ Chốt điện & lập HĐ"],
    ["pay", `💰 Thu tiền (${billCount})`],
    ["rooms", "🏠 Phòng"],
    ["settings", "⚙️ Cài đặt phiếu"],
  ];

  return (
    <main style={{ backgroundColor: "#000", minHeight: "100vh", color: "#fff", padding: "16px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <h1 style={{ color: "#ff9800", margin: 0, fontSize: 24 }}>🧾 Hóa đơn tiền nhà</h1>
          <Link href="/admin" style={{ color: "#888", textDecoration: "none", border: "1px solid #333", padding: "8px 14px", borderRadius: 8 }}>
            ← Quản trị
          </Link>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {tabs.map(([k, t]) => (
            <button key={k} onClick={() => setTab(k)} style={{ ...btn(tab === k ? "#ff9800" : "#111", tab === k ? "#000" : "#fff"), border: "1px solid #222" }}>
              {t}
            </button>
          ))}
        </div>

        {(tab === "meter" || tab === "pay") && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <button onClick={() => setMonth(addMonths(month, -1))} style={btn("#1f1f1f")}>‹</button>
            <div style={{ fontSize: 20, fontWeight: 700, minWidth: 190, textAlign: "center" }}>
              Hóa đơn tháng {monthLabel(month)}
            </div>
            <button onClick={() => setMonth(addMonths(month, 1))} style={btn("#1f1f1f")}>›</button>
            <span style={{ color: "#888", fontSize: 13 }}>
              (tiền điện tháng {monthLabel(addMonths(month, -1))}, chốt số ~ngày 23–25)
            </span>
          </div>
        )}

        {error && <div style={{ background: "#3a1111", color: "#ff8a8a", padding: 12, borderRadius: 8, marginBottom: 12 }}>{error}</div>}

        {tab === "meter" && (
          <MeterTab key={month} month={month} rows={rows} loading={loading} onSaved={async () => { await load(); }} goPay={() => setTab("pay")} goRooms={() => setTab("rooms")} />
        )}
        {tab === "pay" && <PaymentsTab month={month} rows={rows} loading={loading} reload={load} />}
        {tab === "rooms" && <RoomsTab onChanged={load} />}
        {tab === "settings" && <SettingsTab />}
      </div>
    </main>
  );
}
