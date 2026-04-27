import connectDB from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getListing(id: string) {
  try {
    const conn = await connectDB();
    const db = conn.connection.db;
    if (!db) return null;
    return await db.collection("listings").findOne({ _id: new ObjectId(id) });
  } catch (error) {
    return null;
  }
}

export default async function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getListing(id);

  if (!item) return notFound();

  return (
    <main style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", color: "#fff", backgroundColor: "#000", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <Link href="/" style={{ color: "#aaa", textDecoration: "none", marginBottom: "20px", display: "inline-block" }}>← Quay lại trang chủ</Link>
      
      <div style={{ borderRadius: "15px", overflow: "hidden", border: "1px solid #333", marginBottom: "25px" }}>
        <img src={item.imageUrl} style={{ width: "100%", height: "auto", display: "block" }} alt={item.title} />
      </div>
      
      <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>{item.title}</h1>
      <p style={{ color: "#ff4d4d", fontSize: "28px", fontWeight: "bold", marginBottom: "20px" }}>
        {Number(item.price).toLocaleString("vi-VN")} đ / tháng
      </p>

      <div style={{ backgroundColor: "#111", padding: "20px", borderRadius: "15px", border: "1px solid #222", lineHeight: "1.6" }}>
        <p>📍 <strong>Địa chỉ:</strong> {item.address}</p>
        <p style={{ color: "#ccc", whiteSpace: "pre-wrap" }}><strong>Mô tả:</strong><br/>{item.description}</p>
      </div>

      <div style={{ marginTop: "40px", display: "flex", gap: "15px", justifyContent: "center" }}>
        <Link href={`/edit/${id}`} style={{ backgroundColor: "#f39c12", padding: "15px 30px", borderRadius: "50px", textDecoration: "none", color: "#fff", fontWeight: "bold" }}>
          ✏️ Chỉnh sửa tin
        </Link>
        <a href="tel:0902225314" style={{ backgroundColor: "#25d366", padding: "15px 30px", borderRadius: "50px", textDecoration: "none", color: "#fff", fontWeight: "bold" }}>
          📞 Gọi điện ngay
        </a>
      </div>
    </main>
  );
}