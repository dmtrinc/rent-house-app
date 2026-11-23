"use client";
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { addMonths, defaultBillMonth, isMonthKey, monthLabel, type Building } from "../../../lib/billing";
import { api, btn, card, type MonthRow } from "./ui";
import MeterTab from "./MeterTab";
import PaymentsTab from "./PaymentsTab";
import RoomsTab from "./RoomsTab";
import BuildingsTab from "./BuildingsTab";

type Tab = "meter" | "pay" | "rooms" | "buildings";
const TABS: Tab[] = ["meter", "pay", "rooms", "buildings"];

export default function BillingPage({ searchParams }: { searchParams: Promise<{ month?: string; tab?: string; b?: string }> }) {
  const sp = use(searchParams);
  const [month, setMonth] = useState(isMonthKey(sp.month) ? sp.month : defaultBillMonth());
  const [tab, setTab] = useState<Tab>((TABS.includes(sp.tab as Tab) ? sp.tab : "meter") as Tab);
  const [buildings, setBuildings] = useState<Building[] | null>(null);
  const [building, setBuilding] = useState(sp.b ?? "");
  const [rows, setRows] = useState<MonthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBuildings = useCallback(async () => {
    try {
      const list = await api<Building[]>("/api/admin/billing/buildings");
      setBuildings(list);
      setBuilding((cur) => (list.some((b) => b.code === cur) ? cur : list[0]?.code ?? ""));
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { loadBuildings(); }, [loadBuildings]);

  const load = useCallback(async () => {
    if (!building) { setRows([]); setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const data = await api<{ rows: MonthRow[] }>(`/api/admin/billing/bills?month=${month}&building=${encodeURIComponent(building)}`);
      setRows(data.rows);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [month, building]);

  useEffect(() => { load(); }, [load]);

  // Giữ tháng + nhà + tab trên URL để F5 / quay lại từ trang in không bị mất
  useEffect(() => {
    window.history.replaceState(null, "", `/admin/hoa-don?month=${month}&b=${encodeURIComponent(building)}&tab=${tab}`);
  }, [month, tab, building]);

  const current = buildings?.find((b) => b.code === building);
  const billCount = rows.filter((r) => r.bill).length;
  const tabs: [Tab, string][] = [
    ["meter", "⚡ Chốt điện & lập HĐ"],
    ["pay", `💰 Thu tiền (${billCount})`],
    ["rooms", "🏠 Phòng"],
    ["buildings", "🏢 Nhà & tài khoản"],
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

        {/* Chọn nhà */}
        {buildings && buildings.length > 0 && tab !== "buildings" && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {buildings.map((b) => (
              <button
                key={b.code}
                onClick={() => setBuilding(b.code)}
                title={b.address}
                style={{
                  ...btn(building === b.code ? "#fff" : "#111", building === b.code ? "#000" : "#ccc"),
                  border: "1px solid #333", padding: "8px 12px",
                }}
              >
                {b.code}
                {b.name && <span style={{ fontWeight: 400, marginLeft: 6, opacity: 0.7 }}>{b.name}</span>}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {tabs.map(([k, t]) => (
            <button key={k} onClick={() => setTab(k)} style={{ ...btn(tab === k ? "#ff9800" : "#111", tab === k ? "#000" : "#fff"), border: "1px solid #222" }}>
              {t}
            </button>
          ))}
        </div>

        {(tab === "meter" || tab === "pay") && building && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <button onClick={() => setMonth(addMonths(month, -1))} style={btn("#1f1f1f")}>‹</button>
            <div style={{ fontSize: 20, fontWeight: 700, minWidth: 190, textAlign: "center" }}>
              Hóa đơn tháng {monthLabel(month)}
            </div>
            <button onClick={() => setMonth(addMonths(month, 1))} style={btn("#1f1f1f")}>›</button>
            <span style={{ color: "#888", fontSize: 13 }}>
              {current?.address} · tiền điện tháng {monthLabel(addMonths(month, -1))}
            </span>
          </div>
        )}

        {error && <div style={{ background: "#3a1111", color: "#ff8a8a", padding: 12, borderRadius: 8, marginBottom: 12 }}>{error}</div>}

        {buildings && buildings.length === 0 && tab !== "buildings" ? (
          <div style={card}>
            <p style={{ marginTop: 0 }}>Chưa có nhà nào. Hãy thêm nhà (địa chỉ, tài khoản nhận tiền) trước.</p>
            <button onClick={() => setTab("buildings")} style={btn("#ff9800", "#000")}>🏢 Thêm nhà</button>
          </div>
        ) : (
          <>
            {tab === "meter" && building && (
              <MeterTab key={`${building}-${month}`} month={month} building={building} rows={rows} loading={loading} onSaved={load} goPay={() => setTab("pay")} goRooms={() => setTab("rooms")} />
            )}
            {tab === "pay" && building && <PaymentsTab month={month} building={building} rows={rows} loading={loading} reload={load} />}
            {tab === "rooms" && building && <RoomsTab key={building} building={building} onChanged={load} />}
          </>
        )}
        {tab === "buildings" && <BuildingsTab buildings={buildings ?? []} onChanged={loadBuildings} />}
      </div>
    </main>
  );
}
