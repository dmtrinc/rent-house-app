"use client";
import { useEffect, useState } from "react";

export default function Page2() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/listings")
      .then(r => r.json())
      .then(data => { setItems(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <div style={{ padding: 20 }}>⏳ Đang tải...</div>;
  if (error) return <div style={{ padding: 20, color: "red" }}>❌ Lỗi: {error}</div>;

  return (
    <div style={{ padding: 20, fontFamily: "monospace", fontSize: 13 }}>
      <h2>🧪 Page2 - Debug ({items.length} tin)</h2>
      <table border={1} cellPadding={6} style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr style={{ background: "#eee" }}>
            <th>#</th><th>Title</th><th>Price</th><th>Status</th><th>Phone</th><th>Available</th><th>Highlights</th><th>deviceId</th><th>createdAt</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item._id} style={{ background: item.status === "hide" ? "#fff3f3" : "white" }}>
              <td>{i + 1}</td>
              <td><a href={`/listing/${item._id}`} target="_blank">{item.title?.slice(0, 40)}</a></td>
              <td>{item.price?.toLocaleString()}</td>
              <td style={{ color: item.status === "active" ? "green" : "red" }}>{item.status}</td>
              <td>{item.contactPhone || "—"}</td>
              <td>{item.availableDate ? new Date(item.availableDate).toLocaleDateString("vi-VN") : "—"}</td>
              <td>{(item.highlights || []).join(", ") || "—"}</td>
              <td style={{ fontSize: 10, color: "#999" }}>{item.deviceId?.slice(0, 12)}...</td>
              <td>{new Date(item.createdAt).toLocaleDateString("vi-VN")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}