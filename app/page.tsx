"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [items, setItems] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [myDeviceId, setMyDeviceId] = useState("");
  const [systemConfig, setSystemConfig] = useState({ globalPostEnabled: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Khởi tạo định danh máy tính và lấy User từ LocalStorage
    const dId = localStorage.getItem("device_id") || "dev_" + Math.random().toString(36).substring(2, 11);
    if (!localStorage.getItem("device_id")) localStorage.setItem("device_id", dId);
    setMyDeviceId(dId);
    setUser(JSON.parse(localStorage.getItem("user") || "null"));

    // 2. Lấy dữ liệu tin đăng và cấu hình hệ thống
    const fetchData = async () => {
      try {
        const [resListings, resConfig] = await Promise.all([
          fetch("/api/listings"),
          fetch("/api/admin/config") // Giả định bạn có API trả về globalPostEnabled
        ]);
        
        setItems(await resListings.json());
        if (resConfig.ok) setSystemConfig(await resConfig.json());
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.reload();
  };

  return (
    <main style={{ backgroundColor: "#000", minHeight: "100vh", color: "#fff", padding: "20px", fontFamily: "sans-serif" }}>
      {/* Header Điều hướng */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "1200px", margin: "0 auto 40px", borderBottom: "1px solid #222", paddingBottom: "20px" }}>
        <div>
          <h1 style={{ color: "#0070f3", margin: 0, fontSize: "28px" }}>Angiahouse</h1>
          {!systemConfig.globalPostEnabled && (
            <span style={{ fontSize: "12px", color: "#dc3545" }}>● Hệ thống đang bảo trì đăng tin</span>
          )}
        </div>
        
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {/* Nút Dashboard chỉ dành cho Admin */}
          {user?.role === "admin" && (
            <Link href="/admin" style={{ background: "#ff9800", color: "#fff", padding: "10px 18px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "14px" }}>
              🛡️ Quản trị
            </Link>
          )}

          {/* Nút Đăng tin - Kiểm tra quyền hệ thống hoặc quyền cá nhân */}
          <Link 
            href={(systemConfig.globalPostEnabled && user?.canPost !== false) ? "/dang-tin" : "#"} 
            onClick={(e) => {
              if (!systemConfig.globalPostEnabled || user?.canPost === false) {
                e.preventDefault();
                alert("Chức năng đăng tin đang tạm khóa bởi Admin.");
              }
            }}
            style={{ 
              background: (systemConfig.globalPostEnabled && user?.canPost !== false) ? "#0070f3" : "#333", 
              color: "#fff", padding: "10px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" 
            }}
          >
            + Đăng tin
          </Link>

          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "14px" }}>{user.username}</div>
                <div style={{ fontSize: "10px", color: "#0070f3" }}>{user.role.toUpperCase()}</div>
              </div>
              <button onClick={handleLogout} style={{ background: "#222", color: "#fff", border: "1px solid #444", padding: "8px 12px", borderRadius: "8px", cursor: "pointer" }}>Thoát</button>
            </div>
          ) : (
            <Link href="/login" style={{ border: "1px solid #fff", color: "#fff", padding: "9px 20px", borderRadius: "8px", textDecoration: "none" }}>Đăng nhập</Link>
          )}
        </div>
      </header>

      {/* Danh sách Tin đăng */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "25px" }}>
        {loading ? (
          <p style={{ textAlign: "center", gridColumn: "1/-1" }}>Đang tải danh sách nhà trống...</p>
        ) : (
          items.map((item) => {
            // Admin thấy tất cả bài, User thường chỉ thấy bài 'active'
            if (user?.role !== "admin" && item.status === "hide") return null;

            const isOwner = (item.deviceId === myDeviceId) || (user && item.userId === user._id);

            return (
              <div key={item._id} style={{ 
                background: "#111", borderRadius: "16px", border: "1px solid #222", overflow: "hidden", 
                position: "relative", opacity: item.status === "hide" ? 0.6 : 1 
              }}>
                {/* Click vào vùng này để xem chi tiết (Khách/User đều xem được) */}
                <Link href={`/listing/${item._id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ position: "relative" }}>
                    <img src={item.coverImage} style={{ width: "100%", height: "220px", objectFit: "cover" }} alt={item.title} />
                    {item.status === "hide" && (
                      <div style={{ position: "absolute", top: "10px", left: "10px", background: "red", color: "#fff", fontSize: "10px", padding: "3px 8px", borderRadius: "4px" }}>ĐÃ ẨN</div>
                    )}
                  </div>

                  <div style={{ padding: "20px" }}>
                    <h3 style={{ fontSize: "17px", marginBottom: "10px", height: "45px", overflow: "hidden" }}>{item.title}</h3>
                    <p style={{ color: "#ff4d4d", fontWeight: "bold", fontSize: "20px", margin: 0 }}>{item.price?.toLocaleString()} đ</p>
                    <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>📍 {item.address || "Liên hệ xem địa chỉ"}</p>
                  </div>
                </Link>

                {/* Phần dành cho Chủ tin hoặc Admin */}
                <div style={{ padding: "0 20px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {isOwner ? (
                    <Link href={`/edit/${item._id}`} style={{ color: "#0070f3", fontSize: "14px", textDecoration: "none", fontWeight: "bold" }}>⚙️ Chỉnh sửa</Link>
                  ) : (
                    <span style={{ color: "#333", fontSize: "12px" }}>Chế độ xem</span>
                  )}
                  
                  {user?.role === "admin" && (
                    <span style={{ fontSize: "10px", background: "#333", padding: "2px 6px", borderRadius: "4px" }}>ADMIN VIEW</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {items.length === 0 && !loading && (
        <div style={{ textAlign: "center", marginTop: "100px", color: "#666" }}>
          <p>Chưa có tin đăng nào được hiển thị.</p>
        </div>
      )}
    </main>
  );
}