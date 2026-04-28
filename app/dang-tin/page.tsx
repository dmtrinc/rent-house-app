"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";

export default function DangTinPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState("");

  // Hàm lấy hoặc tạo ID máy tính duy nhất
  const getDeviceId = () => {
    let id = localStorage.getItem("device_id");
    if (!id) {
      id = "dev_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem("device_id", id);
    }
    return id;
  };

  const handleUpload = () => {
    // @ts-ignore
    const widget = window.cloudinary.createUploadWidget(
      { cloudName: "df717ylr1", uploadPreset: "ml_default", multiple: true },
      (error: any, result: any) => {
        if (!error && result.event === "success") {
          const url = result.info.secure_url;
          setImages(prev => [...prev, url]);
          if (!coverImage) setCoverImage(url);
        }
      }
    );
    widget.open();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (images.length === 0) return alert("Vui lòng tải ảnh!");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title"),
      price: formData.get("price"),
      address: formData.get("address"),
      description: formData.get("description"),
      images: images,
      coverImage: coverImage || images[0],
      deviceId: getDeviceId(), // Gắn dấu vân tay máy tính vào đây
    };

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
    setLoading(false);
  };

  return (
    <main style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", backgroundColor: "#000", color: "#fff", minHeight: "100vh" }}>
      <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="lazyOnload" />
      <Link href="/" style={{ color: "#aaa", textDecoration: "none" }}>← Quay lại</Link>
      <h1 style={{ textAlign: "center" }}>Đăng tin mới</h1>
      
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <button type="button" onClick={handleUpload} style={{ padding: "20px", border: "2px dashed #444", backgroundColor: "#111", color: "#fff", cursor: "pointer", borderRadius: "10px" }}>📸 Tải nhiều ảnh lên</button>
        
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {images.map((img, i) => (
            <div key={i} onClick={() => setCoverImage(img)} style={{ position: "relative", cursor: "pointer", border: coverImage === img ? "3px solid #0070f3" : "2px solid transparent", borderRadius: "8px", overflow: "hidden" }}>
              <img src={img} style={{ width: "100px", height: "100px", objectFit: "cover" }} />
              {coverImage === img && <div style={{ position: "absolute", bottom: 0, width: "100%", background: "#0070f3", fontSize: "10px", textAlign: "center" }}>Đại diện</div>}
            </div>
          ))}
        </div>

        <input name="title" placeholder="Tiêu đề" required style={{ padding: "15px", backgroundColor: "#111", color: "#fff", border: "1px solid #333", borderRadius: "8px" }} />
        <input name="price" type="number" placeholder="Giá (VNĐ)" required style={{ padding: "15px", backgroundColor: "#111", color: "#fff", border: "1px solid #333", borderRadius: "8px" }} />
        <input name="address" placeholder="Địa chỉ" required style={{ padding: "15px", backgroundColor: "#111", color: "#fff", border: "1px solid #333", borderRadius: "8px" }} />
        <textarea name="description" rows={5} placeholder="Mô tả chi tiết" style={{ padding: "15px", backgroundColor: "#111", color: "#fff", border: "1px solid #333", borderRadius: "8px" }} />

        <button type="submit" disabled={loading} style={{ backgroundColor: "#0070f3", color: "#fff", padding: "15px", borderRadius: "10px", border: "none", fontWeight: "bold", cursor: "pointer" }}>
          {loading ? "Đang xử lý..." : "Đăng tin ngay"}
        </button>
      </form>
    </main>
  );
}