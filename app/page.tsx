import connectDB from "@/lib/mongodb";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";

// Đảm bảo dữ liệu luôn mới nhất, không bị lưu cache cũ (Sửa lỗi đăng tin không hiện)
export const dynamic = "force-dynamic";

async function getListings() {
  try {
    const conn = await connectDB();
    const db = conn.connection.db;
    if (!db) return [];

    // Lấy danh sách tin đăng từ database, tin mới nhất hiện lên đầu
    const listings = await db.collection("listings").find({}).sort({ createdAt: -1 }).toArray();
    
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

  // URL Logo: Thay link này bằng link Cloudinary bạn lấy được sau khi up logo.png lên
  const logoUrl = "https://res.cloudinary.com/your-cloud-name/image/upload/v12345678/logo.png";

  return (
    <main style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto", backgroundColor: "#000", minHeight: "100vh", color: "#fff", fontFamily: "sans-serif" }}>
      
      {/* Thanh tiêu đề và Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        marginBottom: "40px", 
        alignItems: "center", 
        borderBottom: "1px solid #333", 
        paddingBottom: "20px" 
      }}>
        
        {/* Phần Logo và Tên thương hiệu mới */}
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <img 
            src={logoUrl} 
            alt="Angiahouse Logo" 
            style={{ width: "50px", height: "50px", borderRadius: "10px", objectFit: "cover" }}
            onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/50?text=AG"; }} // Hiện ảnh tạm nếu link lỗi
          />
          <div>
            <h1 style={{ fontSize: "26px", margin: 0, fontWeight: "bold", color: "#fff" }}>
              Phòng trọ Angiahouse
            </h1>
            <p style={{ margin: 0, color: "#0070f3", fontWeight: "bold", fontSize: "18px" }}>
              📞 090.222.5314
            </p>
          </div>
        </div>

        {/* Nút Đăng tin */}
        <Link href="/dang-tin" style={{ 
          backgroundColor: "#0070f3", 
          color: "#fff", 
          padding: "12px 24px", 
          borderRadius: "10px", 
          textDecoration: "none", 
          fontWeight: "bold",
          transition: "0.3s"
        }}>
          ➕ Đăng tin mới
        </Link>
      </div>

      {/* Danh sách phòng trọ */}
      {listings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px", color: "#666" }}>
          <p>Chưa có tin đăng nào. Hãy nhấn "Đăng tin mới" để bắt đầu.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "30px" }}>
          {listings.map((item: any) => (
            <div key={item._id} style={{ 
              backgroundColor: "#111", 
              borderRadius: "20px", 
              overflow: "hidden", 
              border: "1px solid #222", 
              position: "relative",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
            }}>
              
              {/* Nút Xóa */}
              <div style={{ position: "absolute", top: "15px", right: "15px", zIndex: 10 }}>
                <DeleteButton id={item._id} />
              </div>

              {/* Ảnh bìa */}
              <img 
                src={item.imageUrl || "https://via.placeholder.com/400x300?text=No+Image"} 
                style={{ width: "100%", height: "220px", objectFit: "cover" }} 
                alt={item.title}
              />

              {/* Nội dung tin */}
              <div style={{ padding: "20px" }}>
                <h2 style={{ fontSize: "19px", margin: "0 0 12px 0", color: "#fff", lineHeight: "1.4" }}>
                  {item.title || item.name || "Chưa đặt tiêu đề"} 
                </h2>
                
                <p style={{ color: "#ff4d4d", fontSize: "22px", fontWeight: "bold", margin: "10px 0" }}>
                  {item.price ? Number(item.price).toLocaleString("vi-VN") : "0"} đ
                </p>

                <p style={{ color: "#aaa", fontSize: "14px", margin: "15px 0 0 0", display: "flex", alignItems: "center", gap: "5px" }}>
                  📍 {item.address || "Địa chỉ đang cập nhật..."}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}