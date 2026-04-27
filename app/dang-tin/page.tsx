"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";

export default function DangTinPage() {
  const [formData, setFormData] = useState({ title: "", price: "", address: "", description: "", imageUrl: "" });
  const router = useRouter();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.imageUrl) return alert("Vui lòng tải ảnh lên trước!");

    const res = await fetch("/api/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      alert("Đăng tin thành công!");
      router.push("/");
      router.refresh();
    } else {
      alert("Lỗi server, hãy kiểm tra MongoDB IP Whitelist");
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "50px auto", padding: "20px", backgroundColor: "#111", borderRadius: "10px", color: "#fff" }}>
      <h2 style={{ marginBottom: "20px" }}>Đăng tin mới</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Tiêu đề" style={inputS} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
        <input placeholder="Giá (VNĐ)" type="number" style={inputS} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
        <input placeholder="Địa chỉ" style={inputS} onChange={(e) => setFormData({...formData, address: e.target.value})} />
        
        <CldUploadWidget uploadPreset="ml_default" onSuccess={(res: any) => setFormData({...formData, imageUrl: res.info.secure_url})}>
          {({ open }) => (
            <button type="button" onClick={() => open()} style={{ width: "100%", padding: "10px", marginBottom: "15px", backgroundColor: "#333", color: "#fff", border: "1px dashed #555", borderRadius: "5px", cursor: "pointer" }}>
              {formData.imageUrl ? "✅ Đã có ảnh" : "📷 Tải ảnh lên Cloudinary"}
            </button>
          )}
        </CldUploadWidget>

        <textarea placeholder="Mô tả" style={{ ...inputS, height: "100px" }} onChange={(e) => setFormData({...formData, description: e.target.value})} />
        <button type="submit" style={{ width: "100%", padding: "12px", backgroundColor: "#0070f3", color: "#fff", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: "pointer" }}>Đăng tin ngay</button>
      </form>
    </div>
  );
}
const inputS = { width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "5px", border: "1px solid #333", backgroundColor: "#222", color: "#fff" };