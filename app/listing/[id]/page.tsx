"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then(res => res.json())
      .then(data => setData(data))
      .catch(() => alert("Không thể tải thông tin!"));
  }, [id]);

  if (!data) return <div style={{ background: "#000", height: "100vh", color: "#fff", padding: "50px" }}>Đang tải...</div>;

  return (
    <main style={{ backgroundColor: "#000", minHeight: "100vh", color: "#fff", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <button onClick={() => router.back()} style={{ background: "#222", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", marginBottom: "20px" }}>← Quay lại</button>
        
        {/* Gallery */}
        <div style={{ borderRadius: "20px", overflow: "hidden", marginBottom: "30px" }}>
          <img src={data.coverImage} style={{ width: "100%", maxHeight: "500px", objectFit: "cover" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px", marginTop: "10px" }}>
            {data.images?.map((img: string, i: number) => (
              <img key={i} src={img} style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "10px" }} />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h1 style={{ fontSize: "32px", margin: 0, color: "#fff" }}>{data.title}</h1>
          <p style={{ fontSize: "28px", fontWeight: "bold", color: "#ff4d4d", margin: 0 }}>{data.price?.toLocaleString()} VNĐ</p>
        </div>

        <div style={{ background: "#111", padding: "30px", borderRadius: "20px", border: "1px solid #222", marginTop: "30px" }}>
          <div style={{ marginBottom: "20px", borderBottom: "1px solid #222", paddingBottom: "15px" }}>
            <h3 style={{ color: "#0070f3", marginBottom: "10px" }}>📍 Địa chỉ</h3>
            <p style={{ fontSize: "18px" }}>{data.address || "Liên hệ trực tiếp để xem vị trí"}</p>
          </div>

          <div>
            <h3 style={{ color: "#0070f3", marginBottom: "10px" }}>📝 Mô tả chi tiết</h3>
            <p style={{ lineHeight: "1.8", color: "#ccc", whiteSpace: "pre-wrap" }}>{data.description}</p>
          </div>
        </div>

        <footer style={{ marginTop: "40px", textAlign: "center", color: "#444", fontSize: "12px" }}>
          Mã tin: {data._id} | Đăng bởi: {data.userId ? "Thành viên" : "Khách vãng lai"}
        </footer>
      </div>
    </main>
  );
}