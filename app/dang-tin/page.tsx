"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";

export default function DangTinPage() {
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    address: "",
    description: "",
    imageUrl: ""
  });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      alert("Có lỗi xảy ra");
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "50px auto", padding: "20px", border: "1px solid #333", borderRadius: "10px", backgroundColor: "#111", color: "#fff" }}>
      <h2>Đăng tin cho thuê mới</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Tiêu đề" style={inputStyle} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
        <input placeholder="Giá (VNĐ)" type="number" style={inputStyle} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
        <input placeholder="Địa chỉ" style={inputStyle} onChange={(e) => setFormData({...formData, address: e.target.value})} />
        
        <CldUploadWidget 
          uploadPreset="ml_default" 
          onSuccess={(results: any) => {
            setFormData({...formData, imageUrl: results.info.secure_url});
          }}
        >
          {({ open }) => (
            <button type="button" onClick={() => open()} style={btnUploadStyle}>
              {formData.imageUrl ? "✅ Đã có ảnh" : "📷 Tải ảnh lên"}
            </button>
          )}
        </CldUploadWidget>

        <textarea placeholder="Mô tả" style={{...inputStyle, height: "100px"}} onChange={(e) => setFormData({...formData, description: e.target.value})} />
        <button type="submit" style={btnSubmitStyle}>Đăng tin ngay</button>
      </form>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "5px", border: "1px solid #333", backgroundColor: "#222", color: "#fff" };
const btnUploadStyle = { width: "100%", padding: "10px", marginBottom: "15px", backgroundColor: "#444", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" };
const btnSubmitStyle = { width: "100%", padding: "12px", backgroundColor: "#0070f3", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" as const };