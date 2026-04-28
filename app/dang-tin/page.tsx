"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";

export default function DangTinPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState("");

  // Hàm tạo/lấy ID máy tính duy nhất (An toàn cho SSR)
  const getDeviceId = () => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("device_id");
      if (!id) {
        id = "device_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
        localStorage.setItem("device_id", id);
      }
      return id;
    }
    return "";
  };

  const handleUpload = () => {
    // @ts-ignore
    const widget = window.cloudinary.createUploadWidget(
      { cloudName: "df717ylr1", uploadPreset: "ml_default", multiple: true },
      (error: any, result: any) => {
        if (!error && result.event === "success") {
          const url = result.info.secure_url;
          setImages((prev) => [...prev, url]);
          if (!coverImage) setCoverImage(url);
        }
      }
    );
    widget.open();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (images.length === 0) return alert("Vui lòng tải ít nhất 1 hình ảnh!");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      title: formData.get("title"),
      price: formData.get("price"),
      address: formData.get("address"),
      description: formData.get("description"),
      images: images,
      coverImage: coverImage || images[0],
      deviceId: getDeviceId(), // Gửi mã định danh máy tính
    };

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("🎉 Đăng tin thành công!");
        router.push("/");
        router.refresh();
      } else {
        alert("Có lỗi xảy ra từ máy chủ.");
      }
    } catch (err) {
      alert("Lỗi kết nối mạng!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: "20px", maxWidth: "700px", margin: "0 auto", color: "#fff", backgroundColor: "#000", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="lazyOnload" />
      <Link href="/" style={{ color: "#888", textDecoration: "none" }}>← Thoát</Link>
      
      <h1 style={{ textAlign: "center", margin: "25px 0" }}>Đăng tin phòng trọ</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <button type="button" onClick={handleUpload} style={{ padding: "25px", border: "2px dashed #333", backgroundColor: "#111", color: "#fff", cursor: "pointer", borderRadius: "12px", fontSize: "16px" }}>
          📸 Tải ảnh lên (Chọn nhiều ảnh)
        </button>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {images.map((img, i) => (
            <div key={i} onClick={() => setCoverImage(img)} style={{ position: "relative", cursor: "pointer", border: coverImage === img ? "3px solid #0070f3" : "2px solid transparent", borderRadius: "8px", overflow: "hidden" }}>
              <img src={img} style={{ width: "100px", height: "100px", objectFit: "cover" }} />
              {coverImage === img && <div style={{ position: "absolute", bottom: 0, width: "100%", background: "#0070f3", fontSize: "10px", textAlign: "center", padding: "2px 0" }}>Đại diện</div>}
            </div>
          ))}
        </div>

        <input name="title" placeholder="Tiêu đề bài đăng" required style={{ padding: "14px", backgroundColor: "#111", color: "#fff", border: "1px solid #222", borderRadius: "8px" }} />
        <input name="price" type="number" placeholder="Giá thuê/tháng (VNĐ)" required style={{ padding: "14px", backgroundColor: "#111", color: "#fff", border: "1px solid #222", borderRadius: "8px" }} />
        <input name="address" placeholder="Địa chỉ chi tiết" required style={{ padding: "14px", backgroundColor: "#111", color: "#fff", border: "1px solid #222", borderRadius: "8px" }} />
        <textarea name="description" rows={5} placeholder="Mô tả chi tiết về phòng..." style={{ padding: "14px", backgroundColor: "#111", color: "#fff", border: "1px solid #222", borderRadius: "8px", resize: "none" }} />

        <button type="submit" disabled={loading} style={{ backgroundColor: "#0070f3", color: "#fff", padding: "16px", borderRadius: "10px", border: "none", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
          {loading ? "Đang xử lý..." : "🚀 Đăng tin ngay"}
        </button>
      </form>
    </main>
  );
}