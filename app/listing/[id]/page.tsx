"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false); // Trạng thái đóng/mở bộ sưu tập ảnh

  // Lấy dữ liệu từ API
  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        setItem(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div style={{ color: "#fff", textAlign: "center", padding: "50px" }}>Đang tải dữ liệu...</div>;
  if (!item) return notFound();

  // Chuẩn bị danh sách ảnh (ưu tiên mảng images, nếu không có thì dùng coverImage hoặc imageUrl cũ)
  const allPhotos = item.images && item.images.length > 0 ? item.images : [item.coverImage || item.imageUrl];

  return (
    <main style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto", color: "#fff", backgroundColor: "#000", minHeight: "100vh", fontFamily: "sans-serif" }}>
      
      {/* Thanh điều hướng */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <Link href="/" style={{ color: "#aaa", textDecoration: "none", fontSize: "14px" }}>← Quay lại trang chủ</Link>
        <Link href={`/edit/${id}`} style={{ backgroundColor: "#333", color: "#fff", padding: "8px 16px", borderRadius: "8px", textDecoration: "none", fontSize: "14px", border: "1px solid #444" }}>✏️ Chỉnh sửa tin</Link>
      </div>

      <h1 style={{ fontSize: "28px", marginBottom: "20px" }}>{item.title}</h1>

      {/* LƯỚI ẢNH PHONG CÁCH AIRBNB */}
      <div style={{ position: "relative", display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gridTemplateRows: "220px 220px", gap: "10px", borderRadius: "16px", overflow: "hidden", cursor: "pointer" }} onClick={() => setShowAll(true)}>
        
        {/* Ảnh chính (Bên trái) */}
        <div style={{ gridRow: "1 / span 2" }}>
          <img src={item.coverImage || allPhotos[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Main" />
        </div>

        {/* 4 Ảnh phụ (Bên phải) */}
        {allPhotos.slice(1, 5).map((img: string, index: number) => (
          <div key={index} style={{ backgroundColor: "#111" }}>
            <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={`Sub ${index}`} />
          </div>
        ))}

        {/* Nút Hiển thị tất cả ảnh */}
        <button 
          onClick={(e) => { e.stopPropagation(); setShowAll(true); }}
          style={{ position: "absolute", bottom: "20px", right: "20px", backgroundColor: "#fff", color: "#000", border: "1px solid #000", padding: "10px 18px", borderRadius: "10px", fontWeight: "bold", fontSize: "14px", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
        >
          ⣿ Hiển thị tất cả ảnh
        </button>
      </div>

      {/* THÔNG TIN CHI TIẾT */}
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "50px", marginTop: "30px" }}>
        <div>
          <h2 style={{ fontSize: "24px", color: "#ff4d4d" }}>{Number(item.price).toLocaleString("vi-VN")} đ <span style={{ fontSize: "16px", color: "#aaa" }}>/ tháng</span></h2>
          <p style={{ fontSize: "18px", margin: "15px 0" }}>📍 {item.address}</p>
          <hr style={{ border: "0", borderTop: "1px solid #222", margin: "25px 0" }} />
          <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.8", color: "#ccc", fontSize: "16px" }}>{item.description}</p>
        </div>

        <div style={{ backgroundColor: "#111", padding: "25px", borderRadius: "20px", border: "1px solid #222", height: "fit-content", position: "sticky", top: "20px" }}>
          <h3 style={{ marginTop: 0, marginBottom: "20px" }}>Liên hệ chủ phòng</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <a href="tel:0902225314" style={{ display: "block", backgroundColor: "#0070f3", color: "#fff", textAlign: "center", padding: "15px", borderRadius: "12px", textDecoration: "none", fontWeight: "bold" }}>📞 Gọi điện ngay</a>
            <a href="https://zalo.me/0902225314" style={{ display: "block", backgroundColor: "#25d366", color: "#fff", textAlign: "center", padding: "15px", borderRadius: "12px", textDecoration: "none", fontWeight: "bold" }}>💬 Chat qua Zalo</a>
          </div>
        </div>
      </div>

      {/* LỚP PHỦ XEM TẤT CẢ ẢNH (MODAL) */}
      {showAll && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "#000", zIndex: 9999, overflowY: "auto", padding: "20px" }}>
          {/* Nút đóng */}
          <div style={{ position: "sticky", top: "0", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(0,0,0,0.8)", padding: "10px 0", zIndex: 10 }}>
            <button onClick={() => setShowAll(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: "30px", cursor: "pointer", padding: "0 10px" }}>✕</button>
            <span style={{ fontWeight: "bold" }}>Tất cả ảnh ({allPhotos.length})</span>
            <div style={{ width: "40px" }}></div>
          </div>

          {/* Danh sách ảnh cuộn dọc */}
          <div style={{ maxWidth: "750px", margin: "40px auto", display: "flex", flexDirection: "column", gap: "15px" }}>
            {allPhotos.map((img: string, i: number) => (
              <img 
                key={i} 
                src={img} 
                style={{ width: "100%", borderRadius: "8px", border: "1px solid #222" }} 
                alt={`Photo ${i}`} 
              />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}