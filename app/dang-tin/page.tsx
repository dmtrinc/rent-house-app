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
  const [priceHistory, setPriceHistory] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    address: "",
    description: "",
    contactPhone: "",
    availableDate: "",
    highlightsText: "",
  });

  useEffect(() => {
    if (!localStorage.getItem("device_id")) {
      localStorage.setItem("device_id", "dev_" + Math.random().toString(36).substring(2, 12));
    }
    // Load price history
    try {
      const ph = JSON.parse(localStorage.getItem("price_history") || "[]");
      setPriceHistory(Array.isArray(ph) ? ph : []);
    } catch { setPriceHistory([]); }

    const draft = localStorage.getItem("listing_draft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        const fd = parsed.formData || {};
        // Chuyển highlights array → text nếu cần
        const highlightsText = Array.isArray(fd.highlights)
          ? fd.highlights.join(", ")
          : (fd.highlightsText || "");
        setFormData(prev => ({ ...prev, ...fd, highlightsText }));
        setImages(parsed.images || []);
        setCoverImage(parsed.coverImage || "");
      } catch {}
    }
  }, []);

  useEffect(() => {
    const draft = { formData, images, coverImage };
    localStorage.setItem("listing_draft", JSON.stringify(draft));
  }, [formData, images, coverImage]);

  useEffect(() => {
    if (images.length > 0 && !coverImage) setCoverImage(images[0]);
  }, [images, coverImage]);

  const parseHighlights = (text: string): string[] =>
    text.split(",").map(h => h.trim()).filter(h => h.length > 0).slice(0, 3);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    if (images.length + fileArray.length > 10) { alert("Tối đa 10 ảnh!"); return; }
    setUploadingCount(fileArray.length);
    for (const file of fileArray) {
      // 2: tăng lên 10MB
      if (file.size > 10_000_000) { alert(`File ${file.name} quá lớn (tối đa 10MB)`); setUploadingCount(prev => Math.max(0, prev - 1)); continue; }
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", "ml_default");
      try {
        const res = await fetch("https://api.cloudinary.com/v1_1/df717ylr1/image/upload", { method: "POST", body: fd });
        if (res.ok) { const data = await res.json(); setImages(prev => [...prev, data.secure_url]); }
        else alert(`Lỗi upload ${file.name}`);
      } catch { alert(`Lỗi kết nối khi upload ${file.name}`); }
      finally { setUploadingCount(prev => Math.max(0, prev - 1)); }
    }
    e.target.value = "";
  };

  const removeImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    if (coverImage === images[index]) setCoverImage(newImages[0] || "");
  };

  const validateForm = () => {
    if (images.length === 0) { alert("Vui lòng thêm ít nhất 1 hình ảnh!"); return false; }
    if (!coverImage) { alert("Vui lòng chọn ảnh đại diện!"); return false; }
    if (formData.title.trim().length < 10) { alert("Tiêu đề phải có ít nhất 10 ký tự!"); return false; }
    if (!formData.price || Number(formData.price) <= 0) { alert("Vui lòng nhập giá hợp lệ!"); return false; }
    if (formData.address.trim().length < 10) { alert("Địa chỉ phải có ít nhất 10 ký tự!"); return false; }
    if (!formData.contactPhone || formData.contactPhone.trim().length < 10) { alert("Vui lòng nhập số điện thoại hợp lệ!"); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    // Lưu price history
    if (formData.price) {
      const newHistory = [formData.price, ...priceHistory.filter(p => p !== formData.price)].slice(0, 10);
      localStorage.setItem("price_history", JSON.stringify(newHistory));
    }

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const payload = {
      title: formData.title.trim(),
      price: Number(formData.price),
      address: formData.address.trim(),
      description: formData.description.trim(),
      contactPhone: formData.contactPhone.trim(),
      availableDate: formData.availableDate || null,
      highlights: parseHighlights(formData.highlightsText),
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
    } catch { alert("❌ Lỗi kết nối, vui lòng thử lại!"); }
    finally { setIsSubmitting(false); }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px", border: "1px solid #DDDDDD",
    borderRadius: "8px", fontSize: "16px", outline: "none",
    boxSizing: "border-box", backgroundColor: "#fff", color: "#222"
  };

  const highlights = parseHighlights(formData.highlightsText);
  const highlightsTotalChars = formData.highlightsText.replace(/,\s*/g, ",").replace(/,/g, "").length;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fff" }}>
      <header style={{ borderBottom: "1px solid #004d26", backgroundColor: "#006633" }}>
        <div style={{ maxWidth: "1760px", margin: "0 auto", padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img src="https://res.cloudinary.com/df717ylr1/image/upload/v1777485110/logo_an_gia_house_c600o8.png" alt="Angiahouse" style={{ height: "36px", width: "auto" }} />
              <span style={{ fontSize: "18px", fontWeight: "700", color: "#fff", letterSpacing: "-0.5px" }}>ANGIAHOUSE</span>
            </div>
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "40px 20px 80px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>Đăng tin cho thuê</h1>
        <p style={{ fontSize: "15px", color: "#717171", marginBottom: "32px" }}>Hoàn tất các thông tin bên dưới để đăng tin</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

          {/* Upload Images */}
          <div>
            <label style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#222", marginBottom: "10px" }}>
              Hình ảnh * <span style={{ fontSize: "13px", fontWeight: "400", color: "#717171" }}>({images.length}/10)</span>
            </label>
            <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple onChange={handleFileUpload}
              disabled={uploadingCount > 0 || images.length >= 10} style={{ display: "none" }} id="file-upload" />
            <label htmlFor="file-upload" style={{
              display: "block", border: "2px dashed #DDDDDD", padding: "40px 20px", textAlign: "center",
              borderRadius: "12px", cursor: (uploadingCount > 0 || images.length >= 10) ? "not-allowed" : "pointer",
              background: "#F7F7F7", opacity: uploadingCount > 0 ? 0.6 : 1
            }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>{uploadingCount > 0 ? "⏳" : "📸"}</div>
              <p style={{ fontSize: "15px", color: "#222", fontWeight: "600", margin: "0 0 6px 0" }}>
                {uploadingCount > 0 ? `Đang tải ${uploadingCount} ảnh...` : "Thêm ảnh"}
              </p>
              {/* 1: tăng lên 10MB */}
              <p style={{ fontSize: "13px", color: "#717171", margin: 0 }}>Click để chọn ảnh (tối đa 10 ảnh, 10MB/ảnh)</p>
            </label>
            {images.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <p style={{ fontSize: "13px", color: "#717171", marginBottom: "10px" }}>Click vào ảnh để chọn làm ảnh đại diện</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "10px" }}>
                  {images.map((url, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <div onClick={() => setCoverImage(url)} style={{
                        position: "relative", paddingBottom: "100%", borderRadius: "8px", overflow: "hidden", cursor: "pointer",
                        border: coverImage === url ? "3px solid #006633" : "1px solid #DDDDDD"
                      }}>
                        <img src={url} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} alt={`Ảnh ${i + 1}`} />
                        {coverImage === url && (
                          <div style={{ position: "absolute", top: "6px", left: "6px", background: "#006633", color: "#fff", fontSize: "10px", padding: "3px 6px", borderRadius: "4px", fontWeight: "600" }}>Ảnh chính</div>
                        )}
                      </div>
                      <button type="button" onClick={(e) => removeImage(i, e)} style={{ position: "absolute", top: "-8px", right: "-8px", width: "22px", height: "22px", borderRadius: "50%", background: "#000", color: "#fff", border: "2px solid #fff", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>
              Tiêu đề * <span style={{ fontSize: "13px", fontWeight: "400", color: "#717171" }}>({formData.title.length}/100)</span>
            </label>
            <input name="title" value={formData.title} onChange={e => handleInputChange("title", e.target.value)}
              placeholder="VD: Phòng trọ 25m² gần ĐH Bách Khoa, đầy đủ nội thất" required maxLength={100} style={inputStyle} />
          </div>

          {/* Price - 2: datalist cho phép chọn lại giá cũ */}
          <div>
            <label style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>Giá thuê (VNĐ/tháng) *</label>
            <input
              name="price"
              type="number"
              list="price-history-list"
              value={formData.price}
              onChange={e => handleInputChange("price", e.target.value)}
              placeholder="VD: 3000000"
              required min="100000" max="100000000" step="100000"
              style={inputStyle}
            />
            <datalist id="price-history-list">
              {priceHistory.map((p, i) => (
                <option key={i} value={p}>{Number(p).toLocaleString()} đ/tháng</option>
              ))}
            </datalist>
            {formData.price && <p style={{ fontSize: "13px", color: "#717171", margin: "6px 0 0 0" }}>≈ {Number(formData.price).toLocaleString()} đ/tháng</p>}
          </div>

          {/* Address */}
          <div>
            <label style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>Địa chỉ *</label>
            <input name="address" value={formData.address} onChange={e => handleInputChange("address", e.target.value)}
              placeholder="VD: 123 Lý Thường Kiệt, Quận 10, TPHCM" required style={inputStyle} />
          </div>

          {/* Contact Phone */}
          <div>
            <label style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>Số điện thoại liên hệ *</label>
            <input name="contactPhone" type="tel" value={formData.contactPhone} onChange={e => handleInputChange("contactPhone", e.target.value)}
              placeholder="VD: 0901234567" required minLength={10} maxLength={11} style={inputStyle} />
            <p style={{ fontSize: "12px", color: "#717171", margin: "5px 0 0 0" }}>Số này sẽ hiển thị cho người xem tin</p>
          </div>

          {/* Available Date */}
          <div>
            <label style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>Ngày trống phòng</label>
            <input name="availableDate" type="date" value={formData.availableDate} onChange={e => handleInputChange("availableDate", e.target.value)} style={inputStyle} />
            <p style={{ fontSize: "12px", color: "#717171", margin: "5px 0 0 0" }}>Để trống nếu phòng đã sẵn sàng ngay bây giờ</p>
          </div>

          {/* Highlights - 3: tự gõ, tổng tối đa 20 ký tự, hiển thị 3 đầu */}
          <div>
            <label style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>
              Đặc điểm nổi bật{" "}
              <span style={{ fontSize: "13px", fontWeight: "400", color: highlightsTotalChars > 35 ? "#dc3545" : "#717171" }}>
                (cách nhau bằng dấu phẩy, tổng tối đa 35 ký tự — đã dùng {highlightsTotalChars}/35)
              </span>
            </label>
            <input
              value={formData.highlightsText}
              onChange={e => {
                const raw = e.target.value;
                // Tính tổng ký tự không tính dấu phẩy và khoảng trắng phân cách
                const totalChars = raw.split(",").map(h => h.trim()).join("").length;
                if (totalChars > 35) return; // Chặn nếu vượt 20 ký tự
                handleInputChange("highlightsText", raw);
              }}
              placeholder="VD: Nội thất, Ban công, AC"
              style={{ ...inputStyle, borderColor: highlightsTotalChars > 34 ? "#dc3545" : "#DDDDDD" }}
            />
            <p style={{ fontSize: "12px", color: "#717171", margin: "5px 0 0 0" }}>Chỉ 3 đặc điểm đầu tiên sẽ được hiển thị trên card.</p>

            {/* Preview */}
            {highlights.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                {highlights.map((h, i) => (
                  <span key={i} style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "12px", background: "#e8f5e9", color: "#2e7d32", fontWeight: "500" }}>
                    ✓ {h}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>
              Mô tả <span style={{ fontSize: "13px", fontWeight: "400", color: "#717171" }}>({formData.description.length}/1000)</span>
            </label>
            <textarea name="description" value={formData.description} onChange={e => handleInputChange("description", e.target.value)}
              placeholder="Mô tả chi tiết về phòng trọ: diện tích, nội thất, tiện ích..." rows={6} maxLength={1000}
              style={{ ...inputStyle, fontFamily: "system-ui, sans-serif", resize: "vertical" }} />
          </div>

          <button type="submit" disabled={isSubmitting || images.length === 0 || uploadingCount > 0} style={{
            padding: "14px", borderRadius: "8px", fontSize: "16px", fontWeight: "600", border: "none", cursor: "pointer",
            background: (isSubmitting || images.length === 0 || uploadingCount > 0) ? "#E0E0E0" : "#006633",
            color: "#fff",
          }}>
            {isSubmitting ? "Đang đăng tin..." : uploadingCount > 0 ? `Đang tải ${uploadingCount} ảnh...` : "Đăng tin"}
          </button>
        </form>
      </main>
    </div>
  );
}