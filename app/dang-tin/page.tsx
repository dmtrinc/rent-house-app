"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";

export default function DangTinPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const handleUpload = () => {
    // @ts-ignore
    const widget = window.cloudinary.createUploadWidget(
      { cloudName: "df717ylr1", uploadPreset: "my_uploads" },
      (error: any, result: any) => {
        if (!error && result.event === "success") {
          setImageUrl(result.info.secure_url);
        }
      }
    );
    widget.open();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!imageUrl) return alert("Vui lòng tải ảnh lên!");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title"),
      price: formData.get("price"),
      address: formData.get("address"),
      description: formData.get("description"),
      imageUrl: imageUrl,
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
      alert("Lỗi đăng tin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", backgroundColor: "#000", minHeight: "100vh", color: "#fff", fontFamily: "sans-serif" }}>
      <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="lazyOnload" />
      
      <Link href="/" style={{ color: "#aaa", textDecoration: "none", display: "block", marginBottom: "20px" }}>← Quay lại trang chủ</Link>
      
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>Đăng tin phòng mới</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ border: "2px dashed #333", padding: "20px", textAlign: "center", borderRadius: "10px" }}>
          {imageUrl ? (
            <img src={imageUrl} style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "8px" }} />
          ) : (
            <button type="button" onClick={handleUpload} style={{ padding: "15px", cursor: "pointer" }}>📸 Tải ảnh lên</button>
          )}
        </div>

        <input name="title" placeholder="Tiêu đề" required style={{ padding: "12px", borderRadius: "8px", backgroundColor: "#111", color: "#fff", border: "1px solid #333" }} />
        <input name="price" type="number" placeholder="Giá thuê" required style={{ padding: "12px", borderRadius: "8px", backgroundColor: "#111", color: "#fff", border: "1px solid #333" }} />
        <input name="address" placeholder="Địa chỉ" required style={{ padding: "12px", borderRadius: "8px", backgroundColor: "#111", color: "#fff", border: "1px solid #333" }} />
        <textarea name="description" placeholder="Mô tả" rows={4} style={{ padding: "12px", borderRadius: "8px", backgroundColor: "#111", color: "#fff", border: "1px solid #333" }} />

        <button type="submit" disabled={loading} style={{ backgroundColor: "#0070f3", color: "#fff", padding: "15px", borderRadius: "10px", border: "none", fontWeight: "bold", cursor: "pointer" }}>
          {loading ? "Đang xử lý..." : "🚀 Đăng tin ngay"}
        </button>
      </form>
    </main>
  );
}