"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

export default function DangTinPage() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("device_id")) {
      localStorage.setItem("device_id", "dev_" + Math.random().toString(36).substring(2, 11));
    }
  }, []);

  const handleUpload = () => {
    // @ts-ignore
    window.cloudinary.createUploadWidget(
      { cloudName: "df717ylr1", uploadPreset: "ml_default" },
      (error: any, result: any) => {
        if (!error && result.event === "success") {
          setImages((prev) => [...prev, result.info.secure_url]);
        }
      }
    ).open();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const payload = {
      title: formData.get("title"),
      price: formData.get("price"),
      address: formData.get("address"),
      description: formData.get("description"),
      images,
      deviceId: localStorage.getItem("device_id"),
    };

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) router.push("/");
    setIsSubmitting(false);
  };

  return (
    <main style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", color: "#fff" }}>
      <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="lazyOnload" />
      <h1>Đăng Tin Mới</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <button type="button" onClick={handleUpload}>📸 Tải ảnh</button>
        <div style={{ display: "flex", gap: "5px" }}>
          {images.map((url, i) => <img key={i} src={url} width="50" height="50" style={{ objectFit: "cover" }} />)}
        </div>
        <input name="title" placeholder="Tiêu đề" required style={{ padding: "10px", background: "#222", color: "#fff" }} />
        <input name="price" type="number" placeholder="Giá" required style={{ padding: "10px", background: "#222", color: "#fff" }} />
        <input name="address" placeholder="Địa chỉ" required style={{ padding: "10px", background: "#222", color: "#fff" }} />
        <textarea name="description" placeholder="Mô tả" rows={4} style={{ padding: "10px", background: "#222", color: "#fff" }} />
        <button type="submit" disabled={isSubmitting} style={{ padding: "15px", background: "#0070f3", border: "none", color: "#fff" }}>
          {isSubmitting ? "Đang lưu..." : "Đăng ngay"}
        </button>
      </form>
    </main>
  );
}