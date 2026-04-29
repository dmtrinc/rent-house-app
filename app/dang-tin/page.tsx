"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DangTinPage() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    address: "",
    description: ""
  });

  useEffect(() => {
    if (!localStorage.getItem("device_id")) {
      localStorage.setItem("device_id", "dev_" + Math.random().toString(36).substring(2, 12));
    }

    const draft = localStorage.getItem("listing_draft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData(parsed.formData || {});
        setImages(parsed.images || []);
        setCoverImage(parsed.coverImage || "");
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (images.length > 0 || formData.title || formData.price || formData.address || formData.description) {
      const draft = { formData, images, coverImage };
      localStorage.setItem("listing_draft", JSON.stringify(draft));
    }
  }, [formData, images, coverImage]);

  useEffect(() => {
    if (images.length > 0 && !coverImage) {
      setCoverImage(images[0]);
    }
  }, [images, coverImage]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    if (images.length + fileArray.length > 10) {
      alert("Tối đa 10 ảnh!");
      return;
    }

    setUploadingCount(fileArray.length);

    for (const file of fileArray) {
      if (file.size > 5000000) {
        alert(`File ${file.name} quá lớn (tối đa 5MB)`);
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "ml_default");

      try {
        const res = await fetch("https://api.cloudinary.com/v1_1/df717ylr1/image/upload", {
          method: "POST",
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          setImages(prev => [...prev, data.secure_url]);
        } else {
          alert(`Lỗi upload ${file.name}`);
        }
      } catch (error) {
        alert(`Lỗi kết nối khi upload ${file.name}`);
      } finally {
        setUploadingCount(prev => Math.max(0, prev - 1));
      }
    }

    e.target.value = "";
  };

  const removeImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    if (coverImage === images[index]) {
      setCoverImage(newImages[0] || "");
    }
  };

  const validateForm = () => {
    if (images.length === 0) {
      alert("Vui lòng thêm ít nhất 1 hình ảnh!");
      return false;
    }
    if (!coverImage) {
      alert("Vui lòng chọn 1 hình làm ảnh đại diện!");
      return false;
    }
    if (formData.title.trim().length < 10) {
      alert("Tiêu đề phải có ít nhất 10 ký tự!");
      return false;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      alert("Vui lòng nhập giá hợp lệ!");
      return false;
    }
    if (formData.address.trim().length < 10) {
      alert("Địa chỉ phải có ít nhất 10 ký tự!");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    const payload = {
      title: formData.title.trim(),
      price: Number(formData.price),
      address: formData.address.trim(),
      description: formData.description.trim(),
      images,
      coverImage,
      deviceId: localStorage.getItem("device_id"),
      userId: user?._id || null,
    };

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        localStorage.removeItem("listing_draft");
        alert("✅ Đăng tin thành công!");
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        alert("❌ Lỗi: " + (data.message || "Không thể đăng tin"));
      }
    } catch (error) {
      alert("❌ Lỗi kết nối, vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fff" }}>
      <header style={{ borderBottom: "1px solid #EBEBEB", backgroundColor: "#fff" }}>
        <div style={{ maxWidth: "1760px", margin: "0 auto", padding: "16px 40px", display: "flex", alignItems: "center", gap: "20px" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <img 
                src="https://res.cloudinary.com/df717ylr1/image/upload/v1777306437/logo_ymuon1.png" 
                alt="Angiahouse"
                style={{ height: "40px", width: "auto" }}
              />
              <div style={{ fontSize: "16px", fontWeight: "600", color: "#FF385C", borderLeft: "2px solid #EBEBEB", paddingLeft: "16px" }}>
                📞 090.222.5314
              </div>
            </div>
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "600", color: "#222", marginBottom: "8px", fontFamily: "system-ui, sans-serif" }}>
          Đăng tin cho thuê
        </h1>
        <p style={{ fontSize: "16px", color: "#717171", marginBottom: "40px" }}>
          Hoàn tất các thông tin bên dưới để đăng tin
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          
          {/* Upload Images */}
          <div>
            <label style={{ display: "block", fontSize: "16px", fontWeight: "600", color: "#222", marginBottom: "12px" }}>
              Hình ảnh * <span style={{ fontSize: "14px", fontWeight: "400", color: "#717171" }}>({images.length}/10)</span>
            </label>
            
            <input 
              type="file" 
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              onChange={handleFileUpload}
              disabled={uploadingCount > 0 || images.length >= 10}
              style={{ display: "none" }}
              id="file-upload"
            />

            <label 
              htmlFor="file-upload"
              style={{
                display: "block",
                border: "2px dashed #DDDDDD",
                padding: "48px 24px",
                textAlign: "center",
                borderRadius: "12px",
                cursor: (uploadingCount > 0 || images.length >= 10) ? "not-allowed" : "pointer",
                background: "#F7F7F7",
                transition: "all 0.2s",
                opacity: uploadingCount > 0 ? 0.6 : 1
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                {uploadingCount > 0 ? "⏳" : "📸"}
              </div>
              <p style={{ fontSize: "16px", color: "#222", fontWeight: "600", margin: "0 0 8px 0" }}>
                {uploadingCount > 0 ? `Đang tải ${uploadingCount} ảnh...` : "Thêm ảnh"}
              </p>
              <p style={{ fontSize: "14px", color: "#717171", margin: 0 }}>
                Click để chọn ảnh (tối đa 10 ảnh, 5MB/ảnh)
              </p>
            </label>

            {/* Preview Images */}
            {images.length > 0 && (
              <div style={{ marginTop: "24px" }}>
                <p style={{ fontSize: "14px", color: "#717171", marginBottom: "12px" }}>
                  Click vào ảnh để chọn làm ảnh đại diện
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "12px" }}>
                  {images.map((url, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <div 
                        onClick={() => setCoverImage(url)}
                        style={{ 
                          position: "relative",
                          paddingBottom: "100%",
                          borderRadius: "8px",
                          overflow: "hidden",
                          cursor: "pointer",
                          border: coverImage === url ? "3px solid #FF385C" : "1px solid #DDDDDD"
                        }}
                      >
                        <img src={url} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} alt={`Ảnh ${i + 1}`} />
                        {coverImage === url && (
                          <div style={{ position: "absolute", top: "8px", left: "8px", background: "#FF385C", color: "#fff", fontSize: "11px", padding: "4px 8px", borderRadius: "4px", fontWeight: "600" }}>
                            Ảnh chính
                          </div>
                        )}
                      </div>
                      <button type="button" onClick={(e) => removeImage(i, e)} style={{ position: "absolute", top: "-8px", right: "-8px", width: "24px", height: "24px", borderRadius: "50%", background: "#000", color: "#fff", border: "2px solid #fff", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: "block", fontSize: "16px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>
              Tiêu đề * <span style={{ fontSize: "14px", fontWeight: "400", color: "#717171" }}>({formData.title.length}/100)</span>
            </label>
            <input name="title" value={formData.title} onChange={(e) => handleInputChange("title", e.target.value)} placeholder="VD: Phòng trọ 25m² gần ĐH Bách Khoa, đầy đủ nội thất" required maxLength={100} style={{ width: "100%", padding: "12px 16px", border: "1px solid #DDDDDD", borderRadius: "8px", fontSize: "16px", outline: "none", boxSizing: "border-box" }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "16px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>
              Giá thuê (VNĐ/tháng) *
            </label>
            <input name="price" type="number" value={formData.price} onChange={(e) => handleInputChange("price", e.target.value)} placeholder="VD: 3000000" required min="100000" max="100000000" step="100000" style={{ width: "100%", padding: "12px 16px", border: "1px solid #DDDDDD", borderRadius: "8px", fontSize: "16px", outline: "none", boxSizing: "border-box" }} />
            {formData.price && (
              <p style={{ fontSize: "14px", color: "#717171", marginTop: "8px", margin: "8px 0 0 0" }}>
                ≈ {Number(formData.price).toLocaleString()} đ/tháng
              </p>
            )}
          </div>

          <div>
            <label style={{ display: "block", fontSize: "16px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>Địa chỉ *</label>
            <input name="address" value={formData.address} onChange={(e) => handleInputChange("address", e.target.value)} placeholder="VD: 123 Lý Thường Kiệt, Quận 10, TPHCM" required style={{ width: "100%", padding: "12px 16px", border: "1px solid #DDDDDD", borderRadius: "8px", fontSize: "16px", outline: "none", boxSizing: "border-box" }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "16px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>
              Mô tả <span style={{ fontSize: "14px", fontWeight: "400", color: "#717171" }}>({formData.description.length}/1000)</span>
            </label>
            <textarea name="description" value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} placeholder="Mô tả chi tiết về phòng trọ..." rows={6} maxLength={1000} style={{ width: "100%", padding: "12px 16px", border: "1px solid #DDDDDD", borderRadius: "8px", fontSize: "16px", outline: "none", boxSizing: "border-box", fontFamily: "system-ui, sans-serif", resize: "vertical" }} />
          </div>

          <button type="submit" disabled={isSubmitting || images.length === 0 || uploadingCount > 0} style={{ padding: "14px", background: (isSubmitting || images.length === 0 || uploadingCount > 0) ? "#E0E0E0" : "linear-gradient(to right, #E61E4D 0%, #E31C5F 50%, #D70466 100%)", color: "#fff", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: (isSubmitting || images.length === 0 || uploadingCount > 0) ? "not-allowed" : "pointer" }}>
            {isSubmitting ? "Đang đăng tin..." : uploadingCount > 0 ? `Đang tải ${uploadingCount} ảnh...` : "Đăng tin"}
          </button>
        </form>
      </main>
    </div>
  );
}