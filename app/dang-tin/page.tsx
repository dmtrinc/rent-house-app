"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";

export default function DangTinPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState("");

  const handleUpload = () => {
    // @ts-ignore
    const widget = window.cloudinary.createUploadWidget(
      { 
        cloudName: "df717ylr1", 
        uploadPreset: "ml_default", // Sử dụng preset ml_default của bạn
        multiple: true 
      },
      (error: any, result: any) => {
        if (!error && result.event === "success") {
          const newUrl = result.info.secure_url;
          setImages((prev) => [...prev, newUrl]);
          // Tự động chọn ảnh đầu tiên làm ảnh đại diện nếu chưa có
          if (!coverImage) setCoverImage(newUrl);
        }
      }
    );
    widget.open();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (images.length === 0) return alert("Vui lòng tải ít nhất 1 ảnh!");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title"),
      price: formData.get("price"),
      address: formData.get("address"),
      description: formData.get("description"),
      images: images,
      coverImage: coverImage || images[0]
    };

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        alert("Đăng tin thành công!");
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      alert("Lỗi khi đăng tin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", backgroundColor: "#000", minHeight: "100vh", color: "#fff", fontFamily: "sans-serif" }}>
      <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="lazyOnload" />
      <Link href="/" style={{ color: "#aaa", textDecoration: "none", display: "block", marginBottom: "20px" }}>← Hủy và quay lại</Link>
      
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>Đăng tin phòng mới</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ border: "2px dashed #333", padding: "30px", textAlign: "center", borderRadius: "15px", backgroundColor: "#111" }}>
          <button type="button" onClick={handleUpload} style={{ padding: "10px 20px", cursor: "pointer", backgroundColor: "#333", color: "#fff", border: "1px solid #444", borderRadius: "8px" }}>
            📸 Tải nhiều ảnh lên
          </button>
          <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>Nhấp vào ảnh để chọn làm ảnh đại diện</p>
        </div>

        {/* Hiển thị danh sách ảnh đã tải lên */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {images.map((img, i) => (
            <div 
              key={i} 
              onClick={() => setCoverImage(img)} 
              style={{ 
                position: "relative", 
                cursor: "pointer", 
                border: coverImage === img ? "3px solid #0070f3" : "2px solid transparent",
                borderRadius: "10px",
                overflow: "hidden"
              }}
            >
              <img src={img} style={{ width: "120px", height: "120px", objectFit: "cover" }} alt="upload-preview" />
              {coverImage === img && (
                <span style={{ position: "absolute", bottom: 0, width: "100%", background: "#0070f3", color: "#fff", fontSize: "10px", textAlign: "center", padding: "2px 0" }}>
                  Ảnh đại diện
                </span>
              )}
            </div>
          ))}
        </div>

        <input name="title" placeholder="Tiêu đề bài đăng" required style={{ padding: "15px", borderRadius: "10px", backgroundColor: "#111", color: "#fff", border: "1px solid #333" }} />
        <input name="price" type="number" placeholder="Giá thuê (VNĐ)" required style={{ padding: "15px", borderRadius: "10px", backgroundColor: "#111", color: "#fff", border: "1px solid #333" }} />
        <input name="address" placeholder="Địa chỉ chính xác" required style={{ padding: "15px", borderRadius: "10px", backgroundColor: "#111", color: "#fff", border: "1px solid #333" }} />
        <textarea name="description" placeholder="Mô tả chi tiết phòng..." rows={5} style={{ padding: "15px", borderRadius: "10px", backgroundColor: "#111", color: "#fff", border: "1px solid #333", resize: "none" }} />

        <button type="submit" disabled={loading} style={{ backgroundColor: "#0070f3", color: "#fff", padding: "18px", borderRadius: "12px", border: "none", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
          {loading ? "Đang xử lý..." : "🚀 Đăng tin ngay"}
        </button>
      </form>
    </main>
  );
}