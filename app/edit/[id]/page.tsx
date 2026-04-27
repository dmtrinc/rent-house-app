"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ title: "", price: "", address: "", description: "", imageUrl: "" });

  // Lấy dữ liệu cũ từ API listings (có s)
  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then(res => res.json())
      .then(data => setFormData(data))
      .catch(err => console.error("Lỗi lấy dữ liệu:", err));
  }, [id]);

  const handleUpload = () => {
    // @ts-ignore
    const widget = window.cloudinary.createUploadWidget(
      { cloudName: "df717ylr1", uploadPreset: "my_uploads" },
      (error: any, result: any) => {
        if (!error && result.event === "success") {
          setFormData({ ...formData, imageUrl: result.info.secure_url });
        }
      }
    );
    widget.open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        alert("Cập nhật thành công!");
        router.push(`/listing/${id}`); // Quay lại trang chi tiết (không có s)
        router.refresh();
      }
    } catch (error) {
      alert("Lỗi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", backgroundColor: "#000", minHeight: "100vh", color: "#fff", fontFamily: "sans-serif" }}>
      <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="lazyOnload" />
      <Link href={`/listing/${id}`} style={{ color: "#aaa", textDecoration: "none" }}>← Hủy bỏ</Link>
      <h1 style={{ textAlign: "center", margin: "20px 0" }}>Chỉnh sửa tin</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <div style={{ border: "1px dashed #444", padding: "10px", textAlign: "center", borderRadius: "10px" }}>
          {formData.imageUrl && <img src={formData.imageUrl} style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "8px" }} />}
          <button type="button" onClick={handleUpload} style={{ marginTop: "10px", color: "#0070f3", background: "none", border: "none", cursor: "pointer" }}>📸 Thay ảnh mới</button>
        </div>

        <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Tiêu đề" required style={{ padding: "12px", borderRadius: "8px", backgroundColor: "#111", color: "#fff", border: "1px solid #333" }} />
        <input value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} type="number" placeholder="Giá" required style={{ padding: "12px", borderRadius: "8px", backgroundColor: "#111", color: "#fff", border: "1px solid #333" }} />
        <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Địa chỉ" required style={{ padding: "12px", borderRadius: "8px", backgroundColor: "#111", color: "#fff", border: "1px solid #333" }} />
        <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={5} placeholder="Mô tả" style={{ padding: "12px", borderRadius: "8px", backgroundColor: "#111", color: "#fff", border: "1px solid #333", resize: "none" }} />

        <button type="submit" disabled={loading} style={{ backgroundColor: "#f39c12", color: "#fff", padding: "15px", borderRadius: "10px", border: "none", fontWeight: "bold", cursor: "pointer" }}>
          {loading ? "Đang lưu..." : "💾 Lưu thay đổi"}
        </button>
      </form>
    </main>
  );
}