"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard() {
  const [tab, setTab] = useState<"listings" | "users">("listings");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDays, setDeleteDays] = useState<{ [key: string]: string }>({});
  
  // --- STATE BỘ LỌC & SẮP XẾP ---
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "hide">("all");
  const [sortBy, setSortBy] = useState<string>("updatedAt");
  const [searchTerm, setSearchTerm] = useState("");

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lRes, uRes] = await Promise.all([
        fetch("/api/listings"),
        fetch("/api/user")
      ]);
      if (lRes.ok) setListings(await lRes.json());
      if (uRes.ok) setUsers(await uRes.json());
    } catch (e) { console.error("Lỗi tải dữ liệu:", e); }
    setLoading(false);
  };

  // --- XỬ LÝ LỌC VÀ SẮP XẾP (FIXED LOGIC) ---
  const filteredListings = listings
    .filter((item: any) => {
      // 1. Lọc theo tìm kiếm (Tiêu đề hoặc địa chỉ)
      const searchStr = `${item.title || ""} ${item.address || ""}`.toLowerCase();
      const matchSearch = searchStr.includes(searchTerm.toLowerCase());

      // 2. Lọc theo trạng thái (Sửa lỗi: Nếu không phải 'hide' thì là 'HIỆN')
      let matchStatus = true;
      if (filterStatus === "active") {
        matchStatus = item.status !== "hide";
      } else if (filterStatus === "hide") {
        matchStatus = item.status === "hide";
      }

      return matchSearch && matchStatus;
    })
    .sort((a: any, b: any) => {
      if (sortBy === "address") return (a.address || "").localeCompare(b.address || "");
      if (sortBy === "price") return (a.price || 0) - (b.price || 0);
      if (sortBy === "updatedAt") return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      if (sortBy === "user") return (a.userName || "").localeCompare(b.userName || "");
      return 0;
    });

  // --- HÀNH ĐỘNG ---
  const toggleHide = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "hide" ? "active" : "hide";
    await fetch("/api/admin/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle-hide", targetId: id, status: newStatus })
    });
    fetchData();
  };

  const scheduleDelete = async (id: string) => {
    const days = parseInt(deleteDays[id] || "30");
    if (!confirm(`Xác nhận ẩn và XÓA VĨNH VIỄN tin này sau ${days} ngày?`)) return;
    await fetch("/api/admin/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "schedule-delete", targetId: id, days })
    });
    fetchData();
  };

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    const res = await fetch("/api/user", {
      method: editingUser ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, userId: editingUser?._id })
    });
    if (res.ok) { setIsUserModalOpen(false); fetchData(); }
  };

  if (loading) return <div style={{ color: "#fff", textAlign: "center", padding: "50px" }}>Đang đồng bộ dữ liệu...</div>;

  return (
    <main style={{ backgroundColor: "#000", minHeight: "100vh", color: "#fff", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "1350px", margin: "0 auto" }}>
        
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h1 style={{ color: "#0070f3", margin: 0, fontSize: "20px" }}>🛡️ Quản trị An Gia House</h1>
          <Link href="/" style={navLink}>Trang chủ</Link>
        </header>

        <nav style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button onClick={() => setTab("listings")} style={tab === "listings" ? activeTab : inactiveTab}>
            Tin đăng ({filteredListings.length}/{listings.length})
          </button>
          <button onClick={() => setTab("users")} style={tab === "users" ? activeTab : inactiveTab}>Người dùng ({users.length})</button>
        </nav>

        {tab === "listings" && (
          <>
            {/* THANH CÔNG CỤ (TOOLBAR) */}
            <div style={toolbarStyle}>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", flex: 1 }}>
                <input 
                  placeholder="Tìm kiếm tiêu đề, địa chỉ..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={searchInputStyle}
                />
                <select value={filterStatus} onChange={(e: any) => setFilterStatus(e.target.value)} style={selectStyle}>
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Chỉ tin đang HIỆN</option>
                  <option value="hide">Chỉ tin đang ẨN</option>
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selectStyle}>
                  <option value="updatedAt">Mới cập nhật</option>
                  <option value="address">Xếp theo Địa chỉ</option>
                  <option value="price">Xếp theo Giá tiền</option>
                  <option value="user">Xếp theo Người đăng</option>
                </select>
              </div>

              <div style={viewToggleGroup}>
                <button onClick={() => setViewMode("grid")} style={viewMode === "grid" ? modeBtnActive : modeBtn}>Lưới</button>
                <button onClick={() => setViewMode("list")} style={viewMode === "list" ? modeBtnActive : modeBtn}>Dòng</button>
              </div>
            </div>

            {/* DANH SÁCH TIN ĐĂNG */}
            {filteredListings.length === 0 ? (
              <div style={emptyState}>Không tìm thấy tin đăng nào khớp với bộ lọc hiện tại.</div>
            ) : viewMode === "grid" ? (
              <div style={gridContainer}>
                {filteredListings.map((item: any) => (
                  <div key={item._id} style={cardStyle}>
                    <img src={item.coverImage} style={{ ...cardImg, opacity: item.status === "hide" ? 0.4 : 1 }} />
                    <div style={{ padding: "15px" }}>
                      <h4 style={titleStyle}>{item.title}</h4>
                      <p style={infoText}>📍 {item.address}</p>
                      <p style={priceText}>💰 {item.price?.toLocaleString()} đ</p>
                      <div style={badgeRow}>
                         {item.status === "hide" ? <span style={{color:'#ff4d4f'}}>🔴 Ẩn</span> : <span style={{color:'#52c41a'}}>🟢 Hiện</span>}
                         <span style={{color:'#666', fontSize:'10px'}}>{item.userName || "Admin"}</span>
                      </div>
                      <div style={actionRow}>
                         <Link href={`/listing/${item._id}`} style={btnAction}>Xem</Link>
                         <Link href={`/edit/${item._id}`} style={btnAction}>Sửa</Link>
                         <button onClick={() => toggleHide(item._id, item.status)} style={btnAction}>{item.status === "hide" ? "Hiện" : "Ẩn"}</button>
                      </div>
                      <div style={deleteBox}>
                         <input type="number" placeholder="30" onChange={(e) => setDeleteDays({...deleteDays, [item._id]: e.target.value})} style={smallInput} />
                         <button onClick={() => scheduleDelete(item._id)} style={btnDelete}>Lên lịch xóa</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {filteredListings.map((item: any) => (
                  <div key={item._id} style={listRowStyle}>
                    <img src={item.coverImage} style={listImg} />
                    <div style={{ flex: 3 }}>
                      <h4 style={{ margin: 0, fontSize: "14px" }}>{item.title}</h4>
                      <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
                        📍 {item.address} | <span style={{color: '#0070f3'}}>💰 {item.price?.toLocaleString()} đ</span>
                      </div>
                    </div>
                    <div style={{ flex: 1, fontSize: "12px", textAlign: "center" }}>
                        <div>{item.status === "hide" ? "🔴 Ẩn" : "🟢 Hiện"}</div>
                        <div style={{fontSize:'10px', color:'#444'}}>{item.userName || "Admin"}</div>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <Link href={`/listing/${item._id}`} style={btnActionSmall}>Xem</Link>
                      <Link href={`/edit/${item._id}`} style={btnActionSmall}>Sửa</Link>
                      <button onClick={() => toggleHide(item._id, item.status)} style={btnActionSmall}>{item.status === "hide" ? "Hiện" : "Ẩn"}</button>
                      <div style={listDeleteBox}>
                        <input type="number" placeholder="30" onChange={(e) => setDeleteDays({...deleteDays, [item._id]: e.target.value})} style={smallInputList} />
                        <button onClick={() => scheduleDelete(item._id)} style={btnDeleteList}>Xóa</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* TAB NGƯỜI DÙNG */}
        {tab === "users" && (
          <div style={tableContainer}>
             <div style={{ display: "flex", justifyContent: "space-between", padding: "20px" }}>
              <h3 style={{ margin: 0 }}>Hệ thống tài khoản</h3>
              <button onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }} style={btnPrimary}>+ Thêm User</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#1a1a1a", textAlign: "left", color: "#666" }}>
                  <th style={thStyle}>Username</th><th style={thStyle}>Email</th><th style={thStyle}>Quyền</th><th style={thStyle}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u._id} style={{ borderBottom: "1px solid #222" }}>
                    <td style={tdStyle}>{u.username}</td><td style={tdStyle}>{u.email}</td>
                    <td style={tdStyle}><span style={u.role === "admin" ? badgeAdmin : badgeUser}>{u.role}</span></td>
                    <td style={tdStyle}><button onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }} style={editBtn}>Chỉnh sửa</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MODAL USER */}
        {isUserModalOpen && (
          <div style={modalOverlay}><div style={modalContent}>
            <h3 style={{marginTop:0}}>{editingUser ? "Cập nhật tài khoản" : "Tạo tài khoản mới"}</h3>
            <form onSubmit={handleSaveUser} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <input name="username" defaultValue={editingUser?.username} placeholder="Username" required style={inputStyle} />
                <input name="email" type="email" defaultValue={editingUser?.email} placeholder="Email" required style={inputStyle} />
                <input name="password" defaultValue={editingUser?.password} placeholder="Mật khẩu" required style={inputStyle} />
                <select name="role" defaultValue={editingUser?.role || "user"} style={inputStyle}>
                    <option value="user">User</option><option value="admin">Admin</option>
                </select>
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                    <button type="submit" style={{ ...btnPrimary, flex: 1 }}>Lưu</button>
                    <button type="button" onClick={() => setIsUserModalOpen(false)} style={{ ...btnSecondary, flex: 1 }}>Hủy</button>
                </div>
            </form>
          </div></div>
        )}
      </div>
    </main>
  );
}

// --- CSS TRỰC TIẾP ---
const activeTab = { background: "#0070f3", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" };
const inactiveTab = { background: "#111", color: "#666", border: "1px solid #333", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" };
const toolbarStyle = { background: "#111", padding: "15px", borderRadius: "12px", border: "1px solid #222", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as "wrap", gap: "15px" };
const selectStyle = { background: "#000", color: "#fff", border: "1px solid #333", padding: "8px", borderRadius: "8px", outline: "none", fontSize: "13px" };
const searchInputStyle = { background: "#000", color: "#fff", border: "1px solid #333", padding: "8px 15px", borderRadius: "8px", outline: "none", fontSize: "13px", minWidth: "280px" };
const modeBtn = { background: "transparent", color: "#666", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" };
const modeBtnActive = { ...modeBtn, background: "#333", color: "#fff" };
const cardStyle = { background: "#111", borderRadius: "15px", border: "1px solid #222", overflow: "hidden" };
const listRowStyle = { background: "#111", border: "1px solid #222", padding: "12px 15px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "15px" };
const titleStyle = { margin: 0, fontSize: "14px", height: "38px", overflow: "hidden", lineHeight: "1.4" };
const infoText = { fontSize: "11px", color: "#888", margin: "5px 0" };
const priceText = { fontSize: "13px", color: "#0070f3", fontWeight: "bold", margin: "5px 0" };
const badgeRow = { fontSize: "11px", margin: "10px 0", display: "flex", justifyContent: "space-between" };
const actionRow = { display: "flex", gap: "5px", marginBottom: "10px" };
const btnAction = { flex: 1, background: "#222", color: "#ccc", textDecoration: "none", textAlign: "center", padding: "8px", borderRadius: "6px", fontSize: "12px", border: "1px solid #333" };
const btnActionSmall = { background: "#222", color: "#ccc", textDecoration: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", border: "1px solid #333" };
const deleteBox = { display: "flex", gap: "5px", background: "#000", padding: "5px", borderRadius: "8px", border: "1px solid #222" };
const smallInput = { width: "45px", background: "#000", border: "none", color: "#fff", padding: "5px", textAlign: "center", fontSize: "12px" };
const btnDelete = { background: "#dc3545", color: "#fff", border: "none", padding: "6px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", flex: 1 };
const tableContainer = { background: "#111", borderRadius: "15px", border: "1px solid #222" };
const thStyle = { padding: "15px", fontSize: "13px", color: "#555" };
const tdStyle = { padding: "15px", fontSize: "14px" };
const badgeAdmin = { background: "#ff9800", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold" };
const badgeUser = { background: "#333", color: "#aaa", padding: "2px 6px", borderRadius: "4px", fontSize: "10px" };
const btnPrimary = { background: "#0070f3", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" };
const btnSecondary = { background: "#333", color: "#fff", border: "none", padding: "10px", borderRadius: "8px", cursor: "pointer" };
const inputStyle = { padding: "12px", background: "#000", border: "1px solid #333", color: "#fff", borderRadius: "8px" };
const modalOverlay = { position: "fixed" as "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalContent = { background: "#111", padding: "25px", borderRadius: "20px", width: "380px", border: "1px solid #333" };
const navLink = { color: "#aaa", textDecoration: "none", border: "1px solid #333", padding: "8px 15px", borderRadius: "8px", fontSize: "12px" };
const viewToggleGroup = { display: "flex", gap: "5px", background: "#111", padding: "4px", borderRadius: "8px" };
const gridContainer = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" };
const cardImg = { width: "100%", height: "150px", objectFit: "cover" as "cover" };
const listImg = { width: "80px", height: "60px", borderRadius: "6px", objectFit: "cover" as "cover" };
const listDeleteBox = { display: "flex", border: "1px solid #333", borderRadius: "6px", overflow: "hidden" };
const smallInputList = { width: "35px", background: "#000", border: "none", color: "#fff", textAlign: "center", fontSize: "12px" };
const btnDeleteList = { background: "#dc3545", color: "#fff", border: "none", padding: "5px 10px", cursor: "pointer", fontSize: "11px" };
const emptyState = { textAlign: "center" as "center", padding: "60px", color: "#444", fontSize: "14px", border: "1px dashed #222", borderRadius: "15px" };
const editBtn = { color: "#0070f3", background: "none", border: "none", cursor: "pointer", fontSize: "13px" };