"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [items, setItems] = useState<any[]>([]);
  const [myId, setMyId] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("device_id") || "";
    setMyId(id);
    fetch("/api/listings").then(res => res.json()).then(data => setItems(data));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa bài đăng này?")) return;
    const res = await fetch(`/api/listings/${id}?deviceId=${myId}`, { method: "DELETE" });
    if (res.ok) setItems(items.filter(i => i._id !== id));
    else alert("Lỗi khi xóa!");
  };

  return (
    <main style={{ padding: "20px", color: "#fff", backgroundColor: "#000", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <h1>Angiahouse</h1>
        <Link href="/dang-tin" style={{ background: "#0070f3", padding: "10px", borderRadius: "5px", textDecoration: "none", color: "#fff" }}>+ Đăng tin</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
        {items.map((item) => (
          <div key={item._id} style={{ background: "#111", borderRadius: "10px", overflow: "hidden", position: "relative", border: "1px solid #222" }}>
            {/* Nút Sửa/Xóa chỉ hiện với chủ sở hữu */}
            {item.deviceId === myId && (
              <div style={{ position: "absolute", top: "10px", right: "10px", zIndex: 10, display: "flex", gap: "5px" }}>
                <Link href={`/edit/${item._id}`} style={{ background: "blue", color: "#fff", padding: "5px 10px", borderRadius: "3px", fontSize: "12px", textDecoration: "none" }}>Sửa</Link>
                <button onClick={() => handleDelete(item._id)} style={{ background: "red", color: "#fff", border: "none", borderRadius: "3px", padding: "5px 10px", cursor: "pointer" }}>X</button>
              </div>
            )}
            
            <Link href={`/listing/${item._id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <img src={item.coverImage || (item.images && item.images[0]) || "https://placehold.co/400"} style={{ width: "100%", height: "200px", objectFit: "cover" }} />
              <div style={{ padding: "15px" }}>
                <h3 style={{ margin: "0 0 10px" }}>{item.title}</h3>
                <p style={{ color: "#ff4d4d", fontWeight: "bold", fontSize: "1.2rem" }}>{item.price?.toLocaleString()} đ</p>
                <p style={{ color: "#aaa", fontSize: "0.9rem" }}>📍 {item.address}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}