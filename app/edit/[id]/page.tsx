"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ title: "", price: "", address: "", description: "" });
  const [images, setImages] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState("");

  // Lấy dữ liệu cũ từ API listings
  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then(res => res.json())
      .then(data => {
        setFormData({ title: data.title, price: data.price, address: data.address, description: data.description });
        setImages(data.images || (data.imageUrl ? [data.imageUrl] : []));
        setCoverImage(data.coverImage || data.imageUrl || "");
      })
      .catch(err => console.error("Lỗi lấy dữ liệu:", err));
  }, [id]);

  const handleUpload = () => {
    // @ts-ignore
    const widget = window.cloudinary.createUploadWidget(
      { 
        cloudName: "df717ylr1", 
        uploadPreset: "ml_default", // Sử dụng preset ml_default
        multiple: true 
      },
      (error: any, result: any) => {
        if (!error && result.event === "success") {
          setImages((prev) => [...prev, result.info.secure_url]);
        }
      }
    );
    widget.open();
  };

  const handleDeleteImage = (urlToDelete: string) => {
    const newImages = images.filter(img => img !== urlToDelete);
    setImages(newImages);
    if (coverImage === urlToDelete) {
      setCoverImage(newImages.length > 0 ? newImages[0] : "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) return alert("Phải có ít nhất 1 hình ảnh!");
    setLoading(true);

    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, images, coverImage }),
      });
      if (res.ok) {
        alert("Đã cập nhật thành công!");
        router.push(`/listing/${id}`);
        router.refresh();
      }
    } catch (error) {
      alert("Lỗi khi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", backgroundColor: "#000", minHeight: "100vh", color: "#fff", fontFamily: "sans-serif" }}>
      <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="lazyOnload" />
      <Link href={`/listing/${id}`} style={{ color: "#aaa", textDecoration: "none" }}>← Hủy chỉnh sửa</Link>
      
      <h1 style={{ textAlign: "center", margin: "30px 0" }}>Chỉnh sửa thông tin</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ border: "2px dashed #444", padding: "20px", textAlign: "center", borderRadius: "15px", backgroundColor: "#111" }}>
          <button type="button" onClick={handleUpload} style={{ padding: "10px 20px", cursor: "pointer", backgroundColor: "#333", color: "#fff", border: "1px solid #444", borderRadius: "8px" }}>
            📸 Tải thêm ảnh mới
          </button>
        </div>

        {/* Quản lý danh sách ảnh */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {images.map((img, i) => (
            <div 
              key={i} 
              style={{ 
                position: "relative", 
                border: coverImage === img ? "3px solid #f39c12" : "2px solid transparent",
                borderRadius: "10px",
                overflow: "hidden"
              }}
            >
              <img 
                src={img} 
                onClick={() => setCoverImage(img)}
                style={{ width: "110px", height: "110px", objectFit: "cover", cursor: "pointer" }} 
                alt="edit-preview" 
              />
              <button 
                type="button" 
                onClick={() => handleDeleteImage(img)}
                style={{ position: "absolute", top: "5px", right: "5px", background: "rgba(255,0,0,0.8)", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", fontSize: "12px", cursor: "pointer" }}
              >
                ✕
              </button>
              {coverImage === img && (
                <div style={{ position: "absolute", bottom: 0, width: "100%", background: "#f39c12", color: "#fff", fontSize: "10px", textAlign: "center" }}>
                  Đại diện
                </div>
              )}
            </div>
          ))}
        </div>

        <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Tiêu đề" required style={{ padding: "15px", borderRadius: "10px", backgroundColor: "#111", color: "#fff", border: "1px solid #333" }} />
        <input value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} type="number" placeholder="Giá thuê" required style={{ padding: "15px", borderRadius: "10px", backgroundColor: "#111", color: "#fff", border: "1px solid #333" }} />
        <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Địa chỉ" required style={{ padding: "15px", borderRadius: "10px", backgroundColor: "#111", color: "#fff", border: "1px solid #333" }} />
        <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={6} placeholder="Mô tả..." style={{ padding: "15px", borderRadius: "10px", backgroundColor: "#111", color: "#fff", border: "1px solid #333", resize: "none" }} />

        <button type="submit" disabled={loading} style={{ backgroundColor: "#f39c12", color: "#fff", padding: "18px", borderRadius: "12px", border: "none", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
          {loading ? "Đang cập nhật..." : "💾 Lưu các thay đổi"}
        </button>
      </form>
    </main>
  );
}