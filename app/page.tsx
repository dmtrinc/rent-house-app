import connectDB from "@/lib/mongodb";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";

async function getListings() {
  try {
    const conn = await connectDB();
    const db = conn.connection.db;
    if (!db) return [];

    const listings = await db.collection("listings").find({}).sort({ createdAt: -1 }).toArray();
    
    return listings.map((item: any) => ({
      ...item,
      _id: item._id.toString(),
    }));
  } catch (error) {
    return [];
  }
}

export default async function Home() {
  const listings = await getListings();

  return (
    <main style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto", backgroundColor: "#000", minHeight: "100vh", color: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px", alignItems: "center" }}>
        <h1>🏠 Hệ Thống Thuê Nhà</h1>
        <Link href="/dang-tin" style={{ backgroundColor: "#0070f3", color: "#fff", padding: "10px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
          ➕ Đăng tin mới
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "25px" }}>
        {listings.map((item: any) => (
          <div key={item._id} style={{ backgroundColor: "#111", borderRadius: "15px", overflow: "hidden", border: "1px solid #222", position: "relative" }}>
            <div style={{ position: "absolute", top: "10px", right: "10px", zIndex: 10 }}>
              <DeleteButton id={item._id} />
            </div>

            <img src={item.imageUrl || "https://via.placeholder.com/400"} style={{ width: "100%", height: "200px", objectFit: "cover" }} />

            <div style={{ padding: "15px" }}>
              {/* Thử đọc cả title hoặc name để tránh lỗi 0đ */}
              <h2 style={{ fontSize: "18px", margin: "0 0 10px 0" }}>
                {item.title || item.name || "Chưa đặt tiêu đề"} 
              </h2>
              
              <p style={{ color: "#ff4d4d", fontSize: "20px", fontWeight: "bold", margin: "5px 0" }}>
                {item.price ? Number(item.price).toLocaleString("vi-VN") : "0"} đ
              </p>

              <p style={{ color: "#aaa", fontSize: "14px", margin: "10px 0" }}>
                📍 {item.address || "Địa chỉ chưa cập nhật"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}