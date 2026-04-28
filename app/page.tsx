"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [items, setItems] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [myDeviceId, setMyDeviceId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Đồng bộ Device ID & User
    const dId = localStorage.getItem("device_id") || "dev_" + Math.random().toString(36).substring(2, 11);
    if (!localStorage.getItem("device_id")) localStorage.setItem("device_id", dId);
    setMyDeviceId(dId);
    setUser(JSON.parse(localStorage.getItem("user") || "null"));

    // 2. Lấy danh sách tin
    fetch("/api/listings").then(res => res.json()).then(data => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  return (
    <main style={{ backgroundColor: "#000", minHeight: "100vh", color: "#fff", padding: "20px", fontFamily: "sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "1200px", margin: "0 auto 40px", borderBottom: "1px solid #222", paddingBottom: "20px" }}>
        <h1 style={{ color: "#0070f3", margin: 0 }}>Angiahouse</h1>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link href="/dang-tin" style={{ background: "#0070f3", color: "#fff", padding: "10px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>+ Đăng tin</Link>
          {user ? (
            <button onClick={() => { localStorage.removeItem("user"); window.location.reload(); }} style={{ background: "#222", color: "#fff", border: "1px solid #444", padding: "10px 15px", borderRadius: "8px", cursor: "pointer" }}>Thoát ({user.username})</button>
          ) : (
            <Link href="/login" style={{ border: "1px solid #fff", color: "#fff", padding: "10px 20px", borderRadius: "8px", textDecoration: "none" }}>Đăng nhập</Link>
          )}
        </div>
      </header>

      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "25px" }}>
        {loading ? <p>Đang tải...</p> : items.map((item) => {
          if (user?.role !== "admin" && item.status === "hide") return null;
          const isOwner = (item.deviceId === myDeviceId) || (user && item.userId === user._id);

          return (
            <div key={item._id} style={{ background: "#111", borderRadius: "16px", border: "1px solid #222", overflow: "hidden", position: "relative", transition: "0.3s" }}>
              {/* CLICK VÀO ĐÂY ĐỂ XEM CHI TIẾT (Công khai hoàn toàn) */}
              <Link href={`/listing/${item._id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <img src={item.coverImage} style={{ width: "100%", height: "220px", objectFit: "cover" }} />
                <div style={{ padding: "15px" }}>
                  <h3 style={{ fontSize: "16px", margin: "0 0 8px", height: "40px", overflow: "hidden" }}>{item.title}</h3>
                  <p style={{ color: "#ff4d4d", fontWeight: "bold", fontSize: "18px", margin: 0 }}>{item.price?.toLocaleString()} đ</p>
                  <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>📍 {item.address || "Liên hệ để xem địa chỉ"}</p>
                </div>
              </Link>

              {/* NÚT QUẢN LÝ (Chỉ hiện cho chủ bài hoặc admin) */}
              <div style={{ padding: "0 15px 15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {isOwner ? (
                  <Link href={`/edit/${item._id}`} style={{ color: "#0070f3", fontSize: "13px", fontWeight: "bold", textDecoration: "none" }}>⚙️ Chỉnh sửa</Link>
                ) : (
                  <span style={{ fontSize: "11px", color: "#333" }}>Khách xem</span>
                )}
                {user?.role === "admin" && (
                  <span style={{ background: "red", color: "#fff", fontSize: "10px", padding: "3px 7px", borderRadius: "4px" }}>ADMIN</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}