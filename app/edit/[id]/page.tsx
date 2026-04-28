"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [images, setImages] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tải dữ liệu cũ và kiểm tra quyền sửa của máy tính
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/listings/${id}`);
        if (!res.ok) throw new Error("Không tìm thấy tin đăng");
        
        const data = await res.json();
        
        // Kiểm tra định danh thiết bị (deviceId)
        const myDeviceId = localStorage.getItem("device_id");
        if (data.deviceId !== myDeviceId) {
          alert("Bạn không có quyền chỉnh sửa tin này trên thiết bị này!");
          router.push("/");
          return;
        }

        // Đổ dữ liệu vào state
        setImages(data.images || []);
        setCoverImage(data.coverImage || "");
        
        const form = document.getElementById("edit-form") as HTMLFormElement;
        if (form) {
          (form.elements.namedItem("title") as HTMLInputElement).value = data.title;
          (form.elements.namedItem("price") as HTMLInputElement).value = data.price;
          (form.elements.namedItem("description") as HTMLTextAreaElement).value = data.description;
          (form.elements.namedItem("address") as HTMLInputElement).value = data.address || "";
        }
      } catch (err) {
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  // Mở widget upload ảnh mới
  const handleUploadMore = () => {
    // @ts-ignore
    window.cloudinary.openUploadWidget(
      { cloudName: "df717ylr1", uploadPreset: "ml_default", multiple: true },
      (error: any, result: any) => {
        if (!error && result.event === "success") {
          setImages((prev) => [...prev, result.info.secure_url]);
        }
      }
    ).open();
  };

  const removeImage = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setImages((prev) => prev.filter(img => img !== url));
    if (coverImage === url) setCoverImage("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (images.length === 0) return alert("Vui lòng giữ lại ít nhất 1 hình ảnh!");
    if (!coverImage) return alert("Vui lòng chọn 1 hình làm ảnh đại diện!");

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const payload = {
      title: formData.get("title"),
      price: Number(formData.get("price")),
      address: formData.get("address"),
      description: formData.get("description"),
      images,
      coverImage,
    };

    const res = await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("Cập nhật thành công!");
      router.push("/");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (confirm("Bạn có chắc chắn muốn xóa vĩnh viễn bài đăng này?")) {
      setIsDeleting(true);
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/");
      setIsDeleting(false);
    }
  };

  if (loading) return <div style={{ color: "#fff", textAlign: "center", padding: "50px" }}>Đang tải...</div>;

  return (
    <main style={{ backgroundColor: "#000", minHeight: "100vh", color: "#fff", padding: "20px" }}>
      <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="lazyOnload" />
      
      {/* Nút trở lại trang chủ */}
      <div style={{ maxWidth: "600px", margin: "0 auto", marginBottom: "15px" }}>
        <Link href="/" style={{ color: "#666", textDecoration: "none", fontSize: "14px" }}>← Quay lại Trang Chủ</Link>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", background: "#111", padding: "30px", borderRadius: "20px", border: "1px solid #222" }}>
        <h2 style={{ marginBottom: "25px", textAlign: "center" }}>Chỉnh sửa tin đăng</h2>
        
        <form id="edit-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          
          {/* Khu vực quản lý hình ảnh */}
          <div style={{ background: "#1a1a1a", padding: "15px", borderRadius: "12px", border: "1px solid #333" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <label style={{ fontSize: "14px", color: "#aaa" }}>Hình ảnh (Click để chọn ảnh đại diện)</label>
              <button type="button" onClick={handleUploadMore} style={{ background: "none", border: "none", color: "#0070f3", cursor: "pointer", fontSize: "13px" }}>+ Thêm ảnh</button>
            </div>
            
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {images.map((url, i) => (
                <div key={i} onClick={() => setCoverImage(url)} style={{ position: "relative", cursor: "pointer" }}>
                  <img 
                    src={url} 
                    style={{ 
                      width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px",
                      border: coverImage === url ? "3px solid #0070f3" : "1px solid #444",
                      opacity: coverImage === url ? 1 : 0.6
                    }} 
                  />
                  {coverImage === url && <span style={{ position: "absolute", bottom: "2px", left: "2px", background: "#0070f3", fontSize: "9px", padding: "1px 4px", borderRadius: "3px" }}>Chính</span>}
                  <button onClick={(e) => removeImage(url, e)} style={{ position: "absolute", top: "-5px", right: "-5px", background: "red", border: "none", borderRadius: "50%", width: "18px", height: "18px", color: "#fff", fontSize: "12px", cursor: "pointer" }}>×</button>
                </div>
              ))}
            </div>
          </div>

          <input name="title" placeholder="Tiêu đề tin" required style={inputStyle} />
          <input name="price" type="number" placeholder="Giá bán (VNĐ)" required style={inputStyle} />
          <input name="address" placeholder="Địa chỉ chi tiết" required style={inputStyle} />
          <textarea name="description" placeholder="Mô tả căn nhà" rows={5} required style={inputStyle} />

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: "14px", background: "#0070f3", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
            <button type="button" onClick={handleDelete} disabled={isDeleting} style={{ padding: "14px", background: "#222", color: "red", border: "1px solid #333", borderRadius: "10px", cursor: "pointer" }}>
              Xóa tin
            </button>
          </div>
          
          <Link href="/" style={{ textAlign: "center", color: "#444", fontSize: "13px", textDecoration: "none" }}>Hủy bỏ</Link>
        </form>
      </div>
    </main>
  );
}

const inputStyle = { padding: "12px", background: "#1a1a1a", border: "1px solid #333", color: "#fff", borderRadius: "10px", outline: "none" };