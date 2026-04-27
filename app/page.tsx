import connectDB from "@/lib/mongodb";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";

async function getListings() {
  try {
    const conn = await connectDB();
    const db = conn.connection.db;
    if (!db) return [];

    const listings = await db
      .collection("listings")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // SỬA LỖI TẠI ĐÂY: Thêm : any cho biến item
    return listings.map((item: any) => ({
      ...item,
      _id: item._id.toString(),
    }));
  } catch (error) {
    console.error("Lỗi lấy dữ liệu:", error);
    return [];
  }
}

export default async function Home() {
  const listings = await getListings();

  return (
    <main style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={{ fontSize: "24px", color: "#fff" }}>🏠 Hệ Thống Thuê Nhà</h1>
        <Link href="/dang-tin" style={btnDangTin}>
          ➕ Đăng tin mới
        </Link>
      </div>

      <div style={gridStyle}>
        {listings.length === 0 ? (
          <p style={{ color: "#aaa" }}>Chưa có tin đăng nào.</p>
        ) : (
          listings.map((item: any) => (
            <div key={item._id} style={cardStyle}>
              <div style={deletePos}>
                <DeleteButton id={item._id} />
              </div>
              <div style={imageWrapper}>
                <img
                  src={item.imageUrl || "https://via.placeholder.com/400x300?text=No+Image"}
                  alt={item.title}
                  style={imageStyle}
                />
              </div>
              <div style={infoContainer}>
                <h2 style={titleStyle}>{item.title || "Không tiêu đề"}</h2>
                <p style={priceStyle}>
                  {item.price ? Number(item.price).toLocaleString("vi-VN") : "0"} đ
                </p>
                <p style={addressStyle}>
                  📍 {item.address || "Địa chỉ chưa cập nhật"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

// CSS giữ nguyên như bản trước để đảm bảo giao diện đẹp
const containerStyle = { maxWidth: "1200px", margin: "0 auto", padding: "40px 20px", minHeight: "100vh", backgroundColor: "#000" };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid #333", paddingBottom: "20px" };
const btnDangTin = { backgroundColor: "#0070f3", color: "#fff", padding: "10px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" as const };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "25px" };
const cardStyle = { backgroundColor: "#111", borderRadius: "15px", overflow: "hidden", border: "1px solid #222", position: "relative" as const };
const deletePos = { position: "absolute" as const, top: "10px", right: "10px", zIndex: 2 };
const imageWrapper = { width: "100%", height: "200px", overflow: "hidden" };
const imageStyle = { width: "100%", height: "100%", objectFit: "cover" as const };
const infoContainer = { padding: "15px" };
const titleStyle = { fontSize: "18px", fontWeight: "600", color: "#fff", margin: "0 0 10px 0" };
const priceStyle = { fontSize: "20px", fontWeight: "bold", color: "#ff4d4d", margin: "5px 0" };
const addressStyle = { fontSize: "14px", color: "#aaa", margin: "10px 0" };