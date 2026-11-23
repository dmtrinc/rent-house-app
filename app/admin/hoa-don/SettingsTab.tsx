"use client";
import { useEffect, useState } from "react";
import { BANKS, type BillingSettings } from "../../../lib/billing";
import { api, btn, card, input, label } from "./ui";

export default function SettingsTab() {
  const [s, setS] = useState<BillingSettings | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<BillingSettings>("/api/admin/billing/settings").then(setS).catch((e) => setMsg(e.message));
  }, []);

  if (!s) return <p style={{ color: "#888" }}>{msg || "Đang tải..."}</p>;
  const set = (k: keyof BillingSettings, v: string | number) => setS({ ...s, [k]: v });

  const save = async () => {
    setBusy(true);
    setMsg("");
    try {
      setS(await api<BillingSettings>("/api/admin/billing/settings", { method: "POST", json: s }));
      setMsg("✓ Đã lưu");
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const text = (k: keyof BillingSettings, l: string, ph = "") => (
    <div>
      <span style={label}>{l}</span>
      <input value={String(s[k] ?? "")} placeholder={ph} onChange={(e) => set(k, e.target.value)} style={input} />
    </div>
  );

  return (
    <div style={{ ...card, maxWidth: 640 }}>
      <p style={{ marginTop: 0, color: "#aaa", fontSize: 14 }}>
        Thông tin in trên phiếu thu. Mã QR trên phiếu được tạo theo chuẩn VietQR — khách quét bằng app ngân hàng là có sẵn số tiền và nội dung “Phong 101 T12 2026”.
      </p>
      <div style={{ display: "grid", gap: 12 }}>
        {text("address", "Địa chỉ căn hộ", "5/45/5 Nơ Trang Long")}
        <div>
          <span style={label}>Ngân hàng</span>
          <select value={s.bankBin} onChange={(e) => set("bankBin", e.target.value)} style={input}>
            {BANKS.map((b) => <option key={b.bin} value={b.bin}>{b.name}</option>)}
          </select>
        </div>
        {text("bankAccount", "Số tài khoản")}
        {text("accountName", "Tên chủ tài khoản (không dấu)", "BUI DAI DUONG")}
        {text("transferNote", "Dòng hướng dẫn chuyển khoản")}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <span style={label}>Hạn thanh toán (trước ngày)</span>
            <input inputMode="numeric" value={s.dueDay} onChange={(e) => set("dueDay", Number(e.target.value.replace(/\D/g, "")) || 0)} style={input} />
          </div>
          {text("city", "Nơi lập phiếu")}
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 16 }}>
        <button disabled={busy} onClick={save} style={btn("#16a34a")}>{busy ? "Đang lưu..." : "Lưu cài đặt"}</button>
        <span style={{ color: msg.startsWith("✓") ? "#4ade80" : "#f87171" }}>{msg}</span>
      </div>
    </div>
  );
}
