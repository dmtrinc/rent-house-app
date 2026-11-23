"use client";
import { useState } from "react";
import { BANKS, DEFAULT_SETTINGS, bankName, type Building } from "../../../lib/billing";
import { api, btn, card, input, label, smallBtn } from "./ui";

const EMPTY: Building = { ...DEFAULT_SETTINGS, code: "", name: "", order: 0 };

/* Danh sách nhà + thông tin in trên phiếu thu (địa chỉ, tài khoản, hạn thanh toán). */
export default function BuildingsTab({ buildings, onChanged }: { buildings: Building[]; onChanged: () => Promise<void> }) {
  const [edit, setEdit] = useState<Building | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: keyof Building, v: string | number) => setEdit((e) => (e ? { ...e, [k]: v } : e));

  const save = async () => {
    if (!edit) return;
    setBusy(true);
    setErr("");
    try {
      if (edit._id) await api(`/api/admin/billing/buildings/${edit._id}`, { method: "PATCH", json: edit });
      else await api("/api/admin/billing/buildings", { method: "POST", json: edit });
      setEdit(null);
      await onChanged();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!edit?._id || !confirm(`Xóa nhà ${edit.code}?`)) return;
    try {
      await api(`/api/admin/billing/buildings/${edit._id}`, { method: "DELETE" });
      setEdit(null);
      await onChanged();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const text = (k: keyof Building, l: string, ph = "") => (
    <div>
      <span style={label}>{l}</span>
      <input value={String(edit?.[k] ?? "")} placeholder={ph} onChange={(e) => set(k, e.target.value)} style={input} />
    </div>
  );

  return (
    <div>
      <button onClick={() => { setErr(""); setEdit({ ...EMPTY }); }} style={{ ...btn("#16a34a"), marginBottom: 12 }}>+ Thêm nhà</button>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))" }}>
        {buildings.map((b) => (
          <div key={b.code} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <div>
                <b style={{ color: "#ff9800", fontSize: 18 }}>{b.code}</b>
                <span style={{ marginLeft: 8 }}>{b.name}</span>
              </div>
              <button onClick={() => { setErr(""); setEdit({ ...b }); }} style={smallBtn}>✏️ Sửa</button>
            </div>
            <div style={{ color: "#aaa", fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>
              <div>📍 {b.address || <i>chưa có địa chỉ</i>}</div>
              <div>🏦 {b.bankAccount ? `${bankName(b.bankBin)} ${b.bankAccount} — ${b.accountName}` : <i style={{ color: "#fbbf24" }}>chưa có tài khoản (phiếu không có mã QR)</i>}</div>
              <div>⏰ Thanh toán trước ngày {String(b.dueDay).padStart(2, "0")}</div>
            </div>
          </div>
        ))}
      </div>

      {edit && (
        <div onClick={() => setEdit(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 12 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...card, width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto" }}>
            <h3 style={{ marginTop: 0 }}>{edit._id ? `Sửa nhà ${edit.code}` : "Thêm nhà"}</h3>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                {text("code", "Mã nhà *", "NTL")}
                {text("name", "Tên gọi", "Nơ Trang Long")}
              </div>
              {text("address", "Địa chỉ in trên phiếu", "5/45/5 Nơ Trang Long")}
              <div>
                <span style={label}>Ngân hàng</span>
                <select value={edit.bankBin} onChange={(e) => set("bankBin", e.target.value)} style={input}>
                  {BANKS.map((b) => <option key={b.bin} value={b.bin}>{b.name}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {text("bankAccount", "Số tài khoản")}
                {text("accountName", "Tên chủ TK (không dấu)")}
              </div>
              {text("transferNote", "Dòng hướng dẫn chuyển khoản")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <span style={label}>Hạn trả (ngày)</span>
                  <input inputMode="numeric" value={edit.dueDay} onChange={(e) => set("dueDay", Number(e.target.value.replace(/\D/g, "")) || 0)} style={input} />
                </div>
                {text("city", "Nơi lập phiếu")}
                <div>
                  <span style={label}>Thứ tự</span>
                  <input inputMode="numeric" value={edit.order} onChange={(e) => set("order", Number(e.target.value.replace(/\D/g, "")) || 0)} style={input} />
                </div>
              </div>
            </div>
            {err && <div style={{ color: "#f87171", marginTop: 10 }}>{err}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <button disabled={busy} onClick={save} style={btn("#16a34a")}>{busy ? "Đang lưu..." : "Lưu"}</button>
              <button onClick={() => setEdit(null)} style={btn("#333")}>Hủy</button>
              {edit._id && <button onClick={del} style={{ ...btn("transparent", "#f87171"), marginLeft: "auto" }}>Xóa nhà</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
