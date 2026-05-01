"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const FURNITURE_OPTIONS = [
  { icon: "❄️", label: "Máy lạnh" },
  { icon: "🧊", label: "Tủ lạnh" },
  { icon: "🛏️", label: "Giường" },
  { icon: "🚪", label: "Tủ quần áo" },
  { icon: "🚿", label: "WC riêng" },
  { icon: "🍳", label: "Kệ bếp" },
  { icon: "🏠", label: "Ban công" },
  { icon: "🪟", label: "Cửa sổ" },
  { icon: "🧺", label: "Máy giặt" },
  { icon: "🔑", label: "Không chung chủ" },
  { icon: "🛗", label: "Thang máy" },
  { icon: "🛵", label: "Chỗ đậu xe máy" },
];

const HIGHLIGHT_SUGGESTIONS = [
  "Máy lạnh", "An ninh", "Full nội thất", "Ban công", "Cửa sổ",
  "Yên tĩnh", "Gần chợ", "Gần ĐH", "Không chung chủ", "Thang máy",
  "Giá rẻ", "Mới xây",
];

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [images, setImages] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [priceHistory, setPriceHistory] = useState<string[]>([]);
  const [selectedFurniture, setSelectedFurniture] = useState<string[]>([]);
  const [extraFurniture, setExtraFurniture] = useState("");
  const [formValues, setFormValues] = useState({
    title: "",
    price: "",
    address: "",
    description: "",
    contactPhone: "",
    availableDate: "",
    highlightsText: "",
  });

  useEffect(() => {
    // Load price history
    try {
      const ph = JSON.parse(localStorage.getItem("price_history") || "[]");
      setPriceHistory(Array.isArray(ph) ? ph : []);
    } catch { setPriceHistory([]); }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/listings/${id}`);
        if (!res.ok) throw new Error("Không tìm thấy tin đăng");
        const data = await res.json();

        const myDeviceId = localStorage.getItem("device_id");
        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;

        const isDeviceOwner = data.deviceId && data.deviceId === myDeviceId;
        const isUserOwner = user && data.userId && String(data.userId) === String(user._id);
        const isAdmin = user?.role === "admin";

        if (!isDeviceOwner && !isUserOwner && !isAdmin) {
          alert("Bạn không có quyền chỉnh sửa tin này!");
          router.push("/");
          return;
        }

        setImages(data.images || []);
        setCoverImage(data.coverImage || "");

        // Restore furniture from data
        if (Array.isArray(data.furniture)) {
          const knownLabels = FURNITURE_OPTIONS.map(f => f.label);
          const selected = data.furniture
            .map((f: { label: string }) => f.label)
            .filter((label: string) => knownLabels.includes(label));
          const extra = data.furniture
            .map((f: { label: string }) => f.label)
            .filter((label: string) => !knownLabels.includes(label));
          setSelectedFurniture(selected);
          setExtraFurniture(extra.join(", "));
        }

        let availDateStr = "";
        if (data.availableDate) {
          const d = new Date(data.availableDate);
          if (!isNaN(d.getTime())) availDateStr = d.toISOString().split("T")[0];
        }

        setFormValues({
          title: data.title || "",
          price: data.price?.toString() || "",
          address: data.address || "",
          description: data.description || "",
          contactPhone: data.contactPhone || "",
          availableDate: availDateStr,
          highlightsText: (data.highlights || []).slice(0, 3).join(", "),
        });
      } catch {
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const parseHighlights = (text: string): string[] =>
    text.split(",").map(h => h.trim()).filter(h => h.length > 0).slice(0, 3);

  const toggleFurniture = (label: string) => {
    setSelectedFurniture(prev =>
      prev.includes(label) ? prev.filter(f => f !== label) : [...prev, label]
    );
  };

  const buildFurnitureList = () => {
    const extra = extraFurniture.split(",").map(f => f.trim()).filter(f => f.length > 0);
    const combined = [...selectedFurniture, ...extra];
    return combined.map(label => {
      const found = FURNITURE_OPTIONS.find(f => f.label === label);
      return found ? found : { icon: "✅", label };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    if (images.length + fileArray.length > 10) { alert("Tối đa 10 ảnh!"); return; }
    setUploadingCount(fileArray.length);
    for (const file of fileArray) {
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (images.length === 0) return alert("Vui lòng giữ lại ít nhất 1 hình ảnh!");
    if (!coverImage) return alert("Vui lòng chọn ảnh đại diện!");
    if (formValues.title.trim().length < 10) return alert("Tiêu đề phải có ít nhất 10 ký tự!");
    if (!formValues.price || Number(formValues.price) <= 0) return alert("Vui lòng nhập giá hợp lệ!");
    if (formValues.address.trim().length < 10) return alert("Địa chỉ phải có ít nhất 10 ký tự!");
    if (!formValues.contactPhone || formValues.contactPhone.trim().length < 10) return alert("Vui lòng nhập số điện thoại hợp lệ!");

    setIsSubmitting(true);

    // Lưu price history
    if (formValues.price) {
      const newHistory = [formValues.price, ...priceHistory.filter(p => p !== formValues.price)].slice(0, 10);
      localStorage.setItem("price_history", JSON.stringify(newHistory));
    }

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    const payload = {
      title: formValues.title.trim(),
      price: Number(formValues.price),
      address: formValues.address.trim(),
      description: formValues.description.trim(),
      contactPhone: formValues.contactPhone.trim(),
      availableDate: formValues.availableDate || null,
      highlights: parseHighlights(formValues.highlightsText),
      furniture: buildFurnitureList(),
      images,
      coverImage,
      deviceId: localStorage.getItem("device_id"),
      _adminOverride: user?.role === "admin",
    };

    const res = await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("✅ Cập nhật thành công!");
      router.push("/");
    } else {
      const data = await res.json();
      alert("❌ Lỗi: " + (data.error || "Không thể cập nhật"));
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!confirm("Xác nhận xóa vĩnh viễn bài đăng này?")) return;
    setIsDeleting(true);
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    const res = await fetch(`/api/listings/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: localStorage.getItem("device_id"),
        _adminOverride: user?.role === "admin",
      }),
    });

    if (res.ok) { router.push("/"); }
    else { const data = await res.json(); alert("❌ Lỗi: " + (data.error || "Không thể xóa")); }
    setIsDeleting(false);
  };

  if (loading) return (
    <div style={{ background: "#fff", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "40px", height: "40px", border: "4px solid #f3f3f3", borderTop: "4px solid #006633", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }` }} />
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px", border: "1px solid #DDDDDD",
    borderRadius: "8px", fontSize: "16px", outline: "none",
    boxSizing: "border-box", backgroundColor: "#fff", color: "#222"
  };

  const highlights = parseHighlights(formValues.highlightsText);
  const highlightsTotalChars = formValues.highlightsText.split(",").map(h => h.trim()).join("").length;

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
        <h1 style={{ fontSize: "28px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>Chỉnh sửa tin đăng</h1>
        <p style={{ fontSize: "15px", color: "#717171", marginBottom: "32px" }}>Cập nhật thông tin bên dưới</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

          {/* Images */}
          <div>
            <label style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#222", marginBottom: "10px" }}>
              Hình ảnh * <span style={{ fontSize: "13px", fontWeight: "400", color: "#717171" }}>({images.length}/10)</span>
            </label>
            <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple
              onChange={handleFileUpload} disabled={uploadingCount > 0 || images.length >= 10}
              style={{ display: "none" }} id="file-upload" />
            <label htmlFor="file-upload" style={{
              display: "block", border: "2px dashed #DDDDDD", padding: "36px 20px", textAlign: "center",
              borderRadius: "12px", cursor: (uploadingCount > 0 || images.length >= 10) ? "not-allowed" : "pointer",
              background: "#F7F7F7", opacity: uploadingCount > 0 ? 0.6 : 1
            }}>
              <div style={{ fontSize: "36px", marginBottom: "10px" }}>{uploadingCount > 0 ? "⏳" : "📸"}</div>
              <p style={{ fontSize: "15px", color: "#222", fontWeight: "600", margin: "0 0 4px 0" }}>
                {uploadingCount > 0 ? `Đang tải ${uploadingCount} ảnh...` : "Thêm ảnh mới"}
              </p>
              <p style={{ fontSize: "13px", color: "#717171", margin: 0 }}>Tối đa 10 ảnh, 10MB/ảnh</p>
            </label>

            {images.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <p style={{ fontSize: "13px", color: "#717171", marginBottom: "10px" }}>Click vào ảnh để chọn làm ảnh đại diện</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "8px" }}>
                  {images.map((url, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <div onClick={() => setCoverImage(url)} style={{
                        position: "relative", paddingBottom: "100%", borderRadius: "8px", overflow: "hidden", cursor: "pointer",
                        border: coverImage === url ? "3px solid #006633" : "1px solid #DDDDDD"
                      }}>
                        <img src={url} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} alt={`Ảnh ${i + 1}`} />
                        {coverImage === url && (
                          <div style={{ position: "absolute", top: "4px", left: "4px", background: "#006633", color: "#fff", fontSize: "9px", padding: "2px 5px", borderRadius: "4px", fontWeight: "600" }}>Chính</div>
                        )}
                      </div>
                      <button type="button" onClick={e => removeImage(i, e)} style={{
                        position: "absolute", top: "-7px", right: "-7px", width: "20px", height: "20px",
                        borderRadius: "50%", background: "#000", color: "#fff", border: "2px solid #fff",
                        fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                      }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>
              Tiêu đề * <span style={{ fontSize: "13px", fontWeight: "400", color: "#717171" }}>({formValues.title.length}/100)</span>
            </label>
            <input value={formValues.title} onChange={e => setFormValues({ ...formValues, title: e.target.value })}
              placeholder="VD: Phòng trọ 25m² gần ĐH Bách Khoa, đầy đủ nội thất" required maxLength={100} style={inputStyle} />
          </div>

          {/* Price */}
          <div>
            <label style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>Giá thuê (VNĐ/tháng) *</label>
            <input
              type="number"
              list="price-history-list"
              value={formValues.price}
              onChange={e => setFormValues({ ...formValues, price: e.target.value })}
              placeholder="VD: 3000000"
              required min="100000" max="100000000" step="100000"
              style={inputStyle}
            />
            <datalist id="price-history-list">
              {priceHistory.map((p, i) => (
                <option key={i} value={p}>{Number(p).toLocaleString()} đ/tháng</option>
              ))}
            </datalist>
            {formValues.price && <p style={{ fontSize: "13px", color: "#717171", margin: "6px 0 0 0" }}>≈ {Number(formValues.price).toLocaleString()} đ/tháng</p>}
          </div>

          {/* Address */}
          <div>
            <label style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>Địa chỉ *</label>
            <input value={formValues.address} onChange={e => setFormValues({ ...formValues, address: e.target.value })}
              placeholder="VD: 123 Lý Thường Kiệt, Quận 10, TPHCM" required style={inputStyle} />
          </div>

          {/* Contact Phone */}
          <div>
            <label style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>Số điện thoại liên hệ *</label>
            <input type="tel" value={formValues.contactPhone} onChange={e => setFormValues({ ...formValues, contactPhone: e.target.value })}
              placeholder="VD: 0901234567" required minLength={10} maxLength={11} style={inputStyle} />
            <p style={{ fontSize: "12px", color: "#717171", margin: "5px 0 0 0" }}>Số này sẽ hiển thị cho người xem tin</p>
          </div>

          {/* Available Date */}
          <div>
            <label style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>Ngày trống phòng</label>
            <input type="date" value={formValues.availableDate} onChange={e => setFormValues({ ...formValues, availableDate: e.target.value })} style={inputStyle} />
            <p style={{ fontSize: "12px", color: "#717171", margin: "5px 0 0 0" }}>Để trống nếu phòng đã sẵn sàng ngay bây giờ</p>
          </div>

          {/* Highlights */}
          <div>
            <label style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>
              Đặc điểm nổi bật{" "}
              <span style={{ fontSize: "13px", fontWeight: "400", color: highlightsTotalChars > 35 ? "#dc3545" : "#717171" }}>
                (tối đa 3, tổng 35 ký tự — đã dùng {highlightsTotalChars}/35)
              </span>
            </label>
            <input
              value={formValues.highlightsText}
              onChange={e => {
                const raw = e.target.value;
                const totalChars = raw.split(",").map(h => h.trim()).join("").length;
                if (totalChars > 35) return;
                setFormValues({ ...formValues, highlightsText: raw });
              }}
              placeholder="VD: Nội thất, Ban công, AC"
              style={{ ...inputStyle, borderColor: highlightsTotalChars > 34 ? "#dc3545" : "#DDDDDD" }}
            />

            {/* Quick suggestions */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
              {HIGHLIGHT_SUGGESTIONS.map(h => {
                const already = highlights.includes(h);
                return (
                  <button key={h} type="button"
                    onClick={() => {
                      if (already) {
                        setFormValues(prev => ({ ...prev, highlightsText: highlights.filter(x => x !== h).join(", ") }));
                      } else {
                        if (highlights.length >= 3) { alert("Chỉ được chọn tối đa 3!"); return; }
                        const totalNew = [...highlights, h].join("").length;
                        if (totalNew > 35) { alert("Tổng ký tự vượt quá 35!"); return; }
                        setFormValues(prev => ({ ...prev, highlightsText: [...highlights, h].join(", ") }));
                      }
                    }}
                    style={{
                      padding: "4px 10px", borderRadius: "16px", fontSize: "12px", cursor: "pointer",
                      border: already ? "none" : "1px solid #DDDDDD",
                      background: already ? "#006633" : "#F7F7F7",
                      color: already ? "#fff" : "#555",
                    }}>
                    {already ? "✓ " : ""}{h}
                  </button>
                );
              })}
            </div>

            {highlights.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                {highlights.map((h, i) => (
                  <span key={i} style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "12px", background: "#e8f5e9", color: "#2e7d32", fontWeight: "500" }}>
                    ✓ {h}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Furniture */}
          <div>
            <label style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>
              Nội thất & tiện nghi <span style={{ fontSize: "13px", fontWeight: "400", color: "#717171" }}>(chọn những gì có sẵn)</span>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "8px", marginBottom: "12px" }}>
              {FURNITURE_OPTIONS.map(f => {
                const selected = selectedFurniture.includes(f.label);
                return (
                  <button key={f.label} type="button" onClick={() => toggleFurniture(f.label)}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "13px",
                      border: selected ? "none" : "1px solid #DDDDDD",
                      background: selected ? "#e8f5e9" : "#F7F7F7",
                      color: selected ? "#2e7d32" : "#555",
                      fontWeight: selected ? "600" : "400",
                    }}>
                    <span>{f.icon}</span>
                    <span>{f.label}</span>
                    {selected && <span style={{ marginLeft: "auto", color: "#006633" }}>✓</span>}
                  </button>
                );
              })}
            </div>
            <input
              value={extraFurniture}
              onChange={e => setExtraFurniture(e.target.value)}
              placeholder="Thêm đồ nội thất khác: Bàn làm việc, Tủ giày, ..."
              style={{ ...inputStyle, fontSize: "14px" }}
            />
            <p style={{ fontSize: "12px", color: "#717171", margin: "5px 0 0 0" }}>Nhập thêm nội thất khác, cách nhau bằng dấu phẩy</p>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: "block", fontSize: "15px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>
              Mô tả <span style={{ fontSize: "13px", fontWeight: "400", color: "#717171" }}>({formValues.description.length}/2000)</span>
            </label>
            <textarea value={formValues.description} onChange={e => setFormValues({ ...formValues, description: e.target.value })}
              rows={14} maxLength={2000}
              style={{ ...inputStyle, fontFamily: "system-ui, sans-serif", resize: "vertical", lineHeight: "1.6" }} />
            <p style={{ fontSize: "12px", color: "#717171", margin: "5px 0 0 0" }}>
              Có thể nhúng link YouTube hoặc TikTok vào mô tả để hiển thị video
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button type="submit" disabled={isSubmitting || uploadingCount > 0} style={{
              flex: 1, padding: "14px", borderRadius: "8px", fontSize: "16px", fontWeight: "600",
              border: "none", cursor: "pointer",
              background: (isSubmitting || uploadingCount > 0) ? "#E0E0E0" : "#006633",
              color: "#fff"
            }}>
              {isSubmitting ? "Đang lưu..." : uploadingCount > 0 ? `Đang tải ${uploadingCount} ảnh...` : "💾 Lưu thay đổi"}
            </button>

            <button type="button" onClick={handleDelete} disabled={isDeleting} style={{
              padding: "14px 20px", borderRadius: "8px", fontSize: "15px", fontWeight: "600",
              border: "1px solid #ffcdd2", cursor: "pointer",
              background: isDeleting ? "#E0E0E0" : "#fff",
              color: "#dc3545"
            }}>
              {isDeleting ? "Đang xóa..." : "🗑️ Xóa tin"}
            </button>
          </div>

          <Link href="/" style={{ textAlign: "center", color: "#999", fontSize: "13px", textDecoration: "none" }}>← Hủy bỏ, quay lại trang chủ</Link>
        </form>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }` }} />
    </div>
  );
}