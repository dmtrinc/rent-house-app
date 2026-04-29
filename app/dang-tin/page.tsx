"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";

export default function DangTinPage() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("device_id")) {
      localStorage.setItem("device_id", "dev_" + Math.random().toString(36).substring(2, 12));
    }
  }, []);

  useEffect(() => {
    if (images.length > 0 && !coverImage) {
      setCoverImage(images[0]);
    }
  }, [images, coverImage]);

  const handleUploadWidget = () => {
    // @ts-ignore
    window.cloudinary.openUploadWidget(
      {
        cloudName: "df717ylr1",
        uploadPreset: "ml_default",
        sources: ["local", "url", "camera"],
        multiple: true,
        styles: {
          palette: { window: "#000000", sourceBg: "#000000", windowBorder: "#8E9EAB" }
        }
      },
      (error: any, result: any) => {
        if (!error && result.event === "success") {
          setImages((prev) => [...prev, result.info.secure_url]);
        }
      }
    ).open();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (images.length === 0) return alert("Vui lòng thêm ít nhất 1 hình ảnh!");
    if (!coverImage) return alert("Vui lòng chọn 1 hình làm ảnh đại diện!");

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    // Lấy userId từ localStorage nếu đã đăng nhập
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    const payload = {
      title: formData.get("title"),
      price: formData.get("price"),
      address: formData.get("address"),
      description: formData.get("description"),
      images,
      coverImage,
      deviceId: localStorage.getItem("device_id"),
      userId: user?._id || null, // ← lưu userId nếu đã đăng nhập
    };

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      alert("Đăng tin thất bại, vui lòng thử lại!");
    }
    setIsSubmitting(false);
  };

  const inputStyle = {
    padding: "12px 15px",
    background: "#1a1a1a",
    border: "1px solid #333",
    color: "#fff",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
  };

  return (
    <main style={{ backgroundColor: "#000", minHeight: "100vh", color: "#fff", padding: "20px" }}>
      <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="lazyOnload" />

      <div style={{ maxWidth: "800px", margin: "0 auto", marginBottom: "20px" }}>
        <Link href="/" style={{ color: "#aaa", textDecoration: "none", fontSize: "14px" }}>
          ← Quay lại Trang Chủ
        </Link>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", background: "#111", padding: "30px", borderRadius: "15px", border: "1px solid #222" }}>
        <h1 style={{ textAlign: "center", marginBottom: "30px" }}>Đăng Tin Mới</h1>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Upload ảnh */}
          <div
            onClick={handleUploadWidget}
            style={{
              border: "2px dashed #444",
              padding: "40px",
              textAlign: "center",
              borderRadius: "10px",
              cursor: "pointer",
              background: "rgba(255,255,255,0.02)"
            }}
          >
            <div style={{ fontSize: "40px" }}>📸</div>
            <p style={{ margin: "10px 0 5px" }}>Tải ảnh lên</p>
            <p style={{ color: "#666", fontSize: "13px" }}>Kéo thả hoặc chọn nhiều hình ảnh từ thiết bị</p>
          </div>

          {/* Chọn ảnh đại diện */}
          {images.length > 0 && (
            <div style={{ background: "#1a1a1a", padding: "15px", borderRadius: "10px" }}>
              <p style={{ fontSize: "13px", marginBottom: "10px", color: "#0070f3" }}>
                * Click vào ảnh để chọn làm hình đại diện:
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {images.map((url, i) => (
                  <div key={i} style={{ position: "relative", cursor: "pointer" }} onClick={() => setCoverImage(url)}>
                    <img
                      src={url}
                      style={{
                        width: "70px", height: "70px", objectFit: "cover", borderRadius: "6px",
                        border: coverImage === url ? "3px solid #0070f3" : "1px solid #333",
                      }}
                    />
                    {coverImage === url && (
                      <div style={{ position: "absolute", top: "-5px", right: "-5px", background: "#0070f3", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>
                        ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <input name="title" placeholder="Nhập tiêu đề bài đăng..." required style={inputStyle} />
          <input name="price" type="number" placeholder="Nhập giá (VNĐ)..." required style={inputStyle} />
          <input name="address" placeholder="Nhập địa chỉ chi tiết..." required style={inputStyle} />
          <textarea name="description" placeholder="Mô tả chi tiết về căn nhà..." rows={5} style={inputStyle} />

          <button
            type="submit"
            disabled={isSubmitting || images.length === 0}
            style={{
              padding: "15px",
              backgroundColor: images.length === 0 ? "#333" : "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: (isSubmitting || images.length === 0) ? "not-allowed" : "pointer"
            }}
          >
            {isSubmitting ? "Đang xử lý..." : "Đăng ngay"}
          </button>
        </form>
      </div>
    </main>
  );
}