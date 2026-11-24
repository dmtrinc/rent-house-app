"use client";
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { addMonths, defaultBillMonth, isMonthKey, monthLabel, type Building } from "../../../lib/billing";
import { api, btn, card } from "./ui";
import { invalidate, prefetch, useMonthRows } from "./store";
import MeterTab from "./MeterTab";
import PaymentsTab from "./PaymentsTab";
import RoomsTab from "./RoomsTab";
import BuildingsTab from "./BuildingsTab";
import BulkTab, { type AllFile } from "./BulkTab";

type Tab = "bulk" | "meter" | "pay" | "rooms" | "buildings";
const TABS: Tab[] = ["bulk", "meter", "pay", "rooms", "buildings"];

export default function BillingPage({ searchParams }: { searchParams: Promise<{ month?: string; tab?: string; b?: string }> }) {
  const sp = use(searchParams);
  const [month, setMonth] = useState(isMonthKey(sp.month) ? sp.month : defaultBillMonth());
  const [tab, setTab] = useState<Tab>((TABS.includes(sp.tab as Tab) ? sp.tab : "bulk") as Tab);
  const [buildings, setBuildings] = useState<Building[] | null>(null);
  const [building, setBuilding] = useState(sp.b ?? "");
  const [error, setError] = useState("");
  // File tất cả nhà chọn ở tab Chốt điện → mở tab "1 file tất cả nhà" với file đó
  const [allFile, setAllFile] = useState<AllFile | null>(null);
  const { rows, ready, loading, error: rowsError, reload } = useMonthRows(building, month);

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

  // Sửa phòng → mọi tháng đã nhớ đều cũ; tải lại tháng đang xem ngay
  const onRoomsChanged = useCallback(async () => {
    invalidate((b) => b === building || b === "*");
    await reload();
  }, [building, reload]);

  // Lúc rảnh: tải trước các nhà khác cùng tháng + tháng trước/sau → bấm chuyển là có ngay
  useEffect(() => {
    if (!ready || !buildings) return;
    return prefetch([
      ...buildings.map((b): [string, string] => [b.code, month]),
      [building, addMonths(month, -1)],
      [building, addMonths(month, 1)],
    ]);
  }, [ready, buildings, building, month]);

  // Giữ tháng + nhà + tab trên URL để F5 / quay lại từ trang in không bị mất
  useEffect(() => {
    window.history.replaceState(null, "", `/admin/hoa-don?month=${month}&b=${encodeURIComponent(building)}&tab=${tab}`);
  }, [month, tab, building]);

  const current = buildings?.find((b) => b.code === building);
  const billCount = rows.filter((r) => r.bill).length;
  const tabs: [Tab, string][] = [
    ["bulk", "📥 1 file tất cả nhà"],
    ["meter", "⚡ Chốt điện từng nhà"],
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
        {buildings && buildings.length > 0 && tab !== "buildings" && tab !== "bulk" && (
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
            <button key={k} onClick={() => { setTab(k); setAllFile(null); }} style={{ ...btn(tab === k ? "#ff9800" : "#111", tab === k ? "#000" : "#fff"), border: "1px solid #222" }}>
              {t}
            </button>
          ))}
        </div>

        {(tab === "meter" || tab === "pay" || tab === "bulk") && building && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <button onClick={() => setMonth(addMonths(month, -1))} style={btn("#1f1f1f")}>‹</button>
            <div style={{ fontSize: 20, fontWeight: 700, minWidth: 190, textAlign: "center" }}>
              Hóa đơn tháng {monthLabel(month)}
            </div>
            <button onClick={() => setMonth(addMonths(month, 1))} style={btn("#1f1f1f")}>›</button>
            <span style={{ color: "#888", fontSize: 13 }}>
              {tab === "bulk" ? "Tất cả nhà" : current?.address} · tiền điện tháng {monthLabel(addMonths(month, -1))}
            </span>
            {loading && ready && tab !== "bulk" && <span style={{ color: "#555", fontSize: 12 }}>⟳ đang cập nhật…</span>}
          </div>
        )}

        {(error || (rowsError && tab !== "bulk" && tab !== "buildings")) && (
          <div style={{ background: "#3a1111", color: "#ff8a8a", padding: 12, borderRadius: 8, marginBottom: 12 }}>
            {error || rowsError}{" "}
            {rowsError && <button onClick={() => reload()} style={{ ...btn("transparent", "#ff8a8a"), padding: 0, textDecoration: "underline" }}>Thử lại</button>}
          </div>
        )}

        {buildings && buildings.length === 0 && tab !== "buildings" ? (
          <div style={card}>
            <p style={{ marginTop: 0 }}>Chưa có nhà nào. Hãy thêm nhà (địa chỉ, tài khoản nhận tiền) trước.</p>
            <button onClick={() => setTab("buildings")} style={btn("#ff9800", "#000")}>🏢 Thêm nhà</button>
          </div>
        ) : (
          <>
            {tab === "bulk" && buildings && <BulkTab key={`${month}-${allFile?.name ?? ""}`} month={month} buildings={buildings} initialFile={allFile} />}
            {tab === "meter" && building && (
              <MeterTab key={`${building}-${month}`} month={month} building={building} rows={rows} ready={ready} goPay={() => setTab("pay")} goRooms={() => setTab("rooms")}
                onAllFile={(rows, name) => { setAllFile({ rows, name }); setTab("bulk"); }} />
            )}
            {tab === "pay" && building && <PaymentsTab month={month} building={building} rows={rows} ready={ready} />}
            {tab === "rooms" && building && <RoomsTab key={building} building={building} onChanged={onRoomsChanged} />}
          </>
        )}
        {tab === "buildings" && <BuildingsTab buildings={buildings ?? []} onChanged={loadBuildings} />}
      </div>
    </main>
  );
}
