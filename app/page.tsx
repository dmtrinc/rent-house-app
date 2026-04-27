import connectDB from "@/lib/mongodb";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

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
  const logoUrl = "https://res.cloudinary.com/df717ylr1/image/upload/v1777294578/logo_ifm9zc.png";

  return (
    <main style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto", backgroundColor: "#000", minHeight: "100vh", color: "#fff", fontFamily: "sans-serif" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px", alignItems: "center", borderBottom: "1px solid #333", paddingBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <img src={logoUrl} alt="Logo" style={{ width: "50px", height: "50px", borderRadius: "10px", objectFit: "cover" }} />
          <div>
            <h1 style={{ fontSize: "26px", margin: 0, fontWeight: "bold" }}>Phòng trọ Angiahouse</h1>
            <p style={{ margin: 0, color: "#0070f3", fontWeight: "bold", fontSize: "18px" }}>📞 090.222.5314</p>
          </div>
        </div>
        <Link href="/dang-tin" style={{ backgroundColor: "#0070f3", color: "#fff", padding: "12px 24px", borderRadius: "10px", textDecoration: "none", fontWeight: "bold" }}>➕ Đăng tin mới</Link>
      </div>

      {/* Danh sách tin */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "30px" }}>
        {listings.map((item: any) => (
          <div key={item._id} style={{ backgroundColor: "#111", borderRadius: "20px", overflow: "hidden", border: "1px solid #222", position: "relative" }}>
            <div style={{ position: "absolute", top: "15px", right: "15px", zIndex: 10 }}>
              <DeleteButton id={item._id} />
            </div>

            {/* Bọc Link quanh ảnh và nội dung để nhấn vào là xem chi tiết */}
            <Link href={`/listing/${item._id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <img src={item.imageUrl || "https://via.placeholder.com/400x300"} style={{ width: "100%", height: "220px", objectFit: "cover" }} />
              <div style={{ padding: "20px" }}>
                <h2 style={{ fontSize: "19px", margin: "0 0 12px 0", color: "#fff" }}>{item.title || "Chưa đặt tiêu đề"}</h2>
                <p style={{ color: "#ff4d4d", fontSize: "22px", fontWeight: "bold", margin: "10px 0" }}>{item.price ? Number(item.price).toLocaleString("vi-VN") : "0"} đ</p>
                <p style={{ color: "#aaa", fontSize: "14px", margin: 0 }}>📍 {item.address || "Địa chỉ..."}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}