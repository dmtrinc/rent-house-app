"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ title: "", price: "", address: "", description: "" });
  const [images, setImages] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState("");

  useEffect(() => {
    fetch(`/api/listings/${id}`).then(res => res.json()).then(data => {
      const myId = localStorage.getItem("device_id");
      if (data.deviceId !== myId) {
        alert("Bạn không có quyền sửa tin này!");
        router.push(`/listing/${id}`);
        return;
      }
      setFormData({ title: data.title, price: data.price, address: data.address, description: data.description });
      setImages(data.images || []);
      setCoverImage(data.coverImage || "");
    });
  }, [id]);

  const handleUpload = () => {
    // @ts-ignore
    const widget = window.cloudinary.createUploadWidget(
      { cloudName: "df717ylr1", uploadPreset: "ml_default", multiple: true },
      (error: any, result: any) => {
        if (!error && result.event === "success") {
          setImages(prev => [...prev, result.info.secure_url]);
        }
      }
    );
    widget.open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const myId = localStorage.getItem("device_id");

    const res = await fetch(`/api/listings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, images, coverImage, deviceId: myId }),
    });

    if (res.ok) {
      alert("Cập nhật thành công!");
      router.push(`/listing/${id}`);
      router.refresh();
    } else {
      const err = await res.json();
      alert(err.error);
    }
    setLoading(false);
  };

  const handleDeleteTin = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa tin này vĩnh viễn không?")) return;
    const myId = localStorage.getItem("device_id");
    const res = await fetch(`/api/listings/${id}?deviceId=${myId}`, { method: "DELETE" });
    if (res.ok) {
      alert("Đã xóa tin!");
      router.push("/");
      router.refresh();
    }
  };

  return (
    <main style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", backgroundColor: "#000", color: "#fff", minHeight: "100vh" }}>
      <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="lazyOnload" />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Link href={`/listing/${id}`} style={{ color: "#aaa" }}>← Hủy</Link>
        <button onClick={handleDeleteTin} style={{ background: "none", border: "none", color: "red", cursor: "pointer" }}>🗑️ Xóa tin này</button>
      </div>

      <h1 style={{ textAlign: "center" }}>Chỉnh sửa tin</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "20px" }}>
        <button type="button" onClick={handleUpload} style={{ padding: "20px", border: "2px dashed #444", backgroundColor: "#111", color: "#fff", borderRadius: "10px" }}>📸 Tải thêm ảnh</button>
        
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {images.map((img, i) => (
            <div key={i} onClick={() => setCoverImage(img)} style={{ position: "relative", cursor: "pointer", border: coverImage === img ? "3px solid #f39c12" : "2px solid transparent", borderRadius: "8px" }}>
              <img src={img} style={{ width: "100px", height: "100px", objectFit: "cover" }} />
              <button type="button" onClick={(e) => { e.stopPropagation(); setImages(images.filter(a => a !== img)) }} style={{ position: "absolute", top: 0, right: 0, background: "red", border: "none", color: "#fff" }}>✕</button>
            </div>
          ))}
        </div>

        <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ padding: "15px", backgroundColor: "#111", color: "#fff", border: "1px solid #333", borderRadius: "8px" }} />
        <input value={formData.price} type="number" onChange={e => setFormData({...formData, price: e.target.value})} style={{ padding: "15px", backgroundColor: "#111", color: "#fff", border: "1px solid #333", borderRadius: "8px" }} />
        <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} style={{ padding: "15px", backgroundColor: "#111", color: "#fff", border: "1px solid #333", borderRadius: "8px" }} />
        <textarea value={formData.description} rows={5} onChange={e => setFormData({...formData, description: e.target.value})} style={{ padding: "15px", backgroundColor: "#111", color: "#fff", border: "1px solid #333", borderRadius: "8px" }} />

        <button type="submit" disabled={loading} style={{ backgroundColor: "#f39c12", color: "#fff", padding: "15px", borderRadius: "10px", border: "none", fontWeight: "bold" }}>
          {loading ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </form>
    </main>
  );
}