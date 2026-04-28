"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard() {
  const [tab, setTab] = useState<"listings" | "users">("listings");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list"); 
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDays, setDeleteDays] = useState<{ [key: string]: string }>({});
  
  // Modal quản lý User
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

  // --- LOGIC TIN ĐĂNG ---
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
    if (!confirm(`Xác nhận ẩn ngay và XÓA VĨNH VIỄN tin này sau ${days} ngày?`)) return;
    await fetch("/api/admin/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "schedule-delete", targetId: id, days })
    });
    fetchData();
  };

  // --- LOGIC USER ---
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
    else { alert("Lỗi khi lưu dữ liệu người dùng"); }
  };

  if (loading) return <div style={{ color: "#fff", textAlign: "center", padding: "50px" }}>Đang tải dữ liệu...</div>;

  return (
    <main style={{ backgroundColor: "#000", minHeight: "100vh", color: "#fff", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
        
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <h1 style={{ color: "#0070f3", margin: 0, fontSize: "22px" }}>🛡️ Quản trị An Gia House</h1>
          <Link href="/" style={{ color: "#aaa", textDecoration: "none", border: "1px solid #333", padding: "8px 15px", borderRadius: "8px", fontSize: "13px" }}>Trang chủ</Link>
        </header>

        {/* Tab Navigation */}
        <nav style={{ display: "flex", gap: "10px", marginBottom: "25px" }}>
          <button onClick={() => setTab("listings")} style={tab === "listings" ? activeTab : inactiveTab}>Tin đăng ({listings.length})</button>
          <button onClick={() => setTab("users")} style={tab === "users" ? activeTab : inactiveTab}>Người dùng ({users.length})</button>
        </nav>

        {/* NỘI DUNG TAB TIN ĐĂNG */}
        {tab === "listings" && (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginBottom: "20px" }}>
              <button onClick={() => setViewMode("grid")} style={viewMode === "grid" ? modeBtnActive : modeBtn}>🔳 Chế độ Lưới</button>
              <button onClick={() => setViewMode("list")} style={viewMode === "list" ? modeBtnActive : modeBtn}>📝 Chế độ Danh sách</button>
            </div>

            {viewMode === "grid" ? (
              /* GRID VIEW */
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                {listings.map((item: any) => (
                  <div key={item._id} style={cardStyle}>
                    <img src={item.coverImage} style={{ width: "100%", height: "140px", objectFit: "cover", opacity: item.status === "hide" ? 0.4 : 1 }} />
                    <div style={{ padding: "15px" }}>
                      <h4 style={titleStyle}>{item.title}</h4>
                      <div style={statusBox}>
                         {item.status === "hide" ? <span style={{color:'#ff4d4f'}}>🔴 Đang Ẩn</span> : <span style={{color:'#52c41a'}}>🟢 Đang Hiện</span>}
                         {item.scheduledDelete && <div style={{color:'#ffa940', fontSize:'11px'}}>Xóa vào: {new Date(item.scheduledDelete).toLocaleDateString()}</div>}
                      </div>
                      <div style={actionRow}>
                         <Link href={`/listing/${item._id}`} style={btnAction}>Xem</Link>
                         <Link href={`/edit/${item._id}`} style={btnAction}>Sửa</Link>
                         <button onClick={() => toggleHide(item._id, item.status)} style={btnAction}>{item.status === "hide" ? "Hiện" : "Ẩn"}</button>
                      </div>
                      <div style={deleteContainer}>
                         <input type="number" placeholder="30" onChange={(e) => setDeleteDays({...deleteDays, [item._id]: e.target.value})} style={smallInput} />
                         <button onClick={() => scheduleDelete(item._id)} style={btnDelete}>Đặt lịch xóa</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* LIST VIEW (HÀNG DỌC) */
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {listings.map((item: any) => (
                  <div key={item._id} style={listRowStyle}>
                    <img src={item.coverImage} style={{ width: "70px", height: "50px", borderRadius: "6px", objectFit: "cover" }} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: "14px" }}>{item.title}</h4>
                      <div style={{ fontSize: "11px", color: "#666" }}>Trạng thái: {item.status === "hide" ? "Ẩn" : "Hiện"}</div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <Link href={`/listing/${item._id}`} style={btnAction}>Xem</Link>
                      <Link href={`/edit/${item._id}`} style={btnAction}>Sửa</Link>
                      <button onClick={() => toggleHide(item._id, item.status)} style={btnAction}>{item.status === "hide" ? "Hiện" : "Ẩn"}</button>
                      <div style={{ display: "flex", border: "1px solid #333", borderRadius: "6px", overflow: "hidden", marginLeft: "10px" }}>
                        <input type="number" placeholder="30" onChange={(e) => setDeleteDays({...deleteDays, [item._id]: e.target.value})} style={{ ...smallInput, border: "none", borderRadius: 0, width: "35px" }} />
                        <button onClick={() => scheduleDelete(item._id)} style={{ ...btnDelete, borderRadius: 0 }}>Xóa</button>
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
              <h3 style={{ margin: 0 }}>Quản lý người dùng</h3>
              <button onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }} style={btnPrimary}>+ Thêm User mới</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#1a1a1a", textAlign: "left", color: "#666" }}>
                  <th style={thStyle}>Username</th><th style={thStyle}>Email</th><th style={thStyle}>Mật khẩu</th><th style={thStyle}>Quyền</th><th style={thStyle}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u._id} style={{ borderBottom: "1px solid #222" }}>
                    <td style={tdStyle}>{u.username}</td><td style={tdStyle}>{u.email}</td><td style={tdStyle}>{u.password}</td>
                    <td style={tdStyle}><span style={u.role === "admin" ? badgeAdmin : badgeUser}>{u.role}</span></td>
                    <td style={tdStyle}><button onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }} style={{ color: "#0070f3", background: "none", border: "none", cursor: "pointer" }}>Chỉnh sửa</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MODAL USER */}
        {isUserModalOpen && (
          <div style={modalOverlay}><div style={modalContent}>
            <h3 style={{marginTop:0}}>{editingUser ? "Cập nhật User" : "Tạo User mới"}</h3>
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

// CSS TRỰC TIẾP
const activeTab = { background: "#0070f3", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" };
const inactiveTab = { background: "#111", color: "#666", border: "1px solid #333", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" };
const modeBtn = { background: "#111", color: "#666", border: "1px solid #333", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" };
const modeBtnActive = { ...modeBtn, background: "#333", color: "#fff" };
const cardStyle = { background: "#111", borderRadius: "12px", border: "1px solid #222", overflow: "hidden" };
const titleStyle = { margin: "0 0 10px", fontSize: "14px", height: "36px", overflow: "hidden" };
const statusBox = { fontSize: "11px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" };
const actionRow = { display: "flex", gap: "5px", marginBottom: "10px" };
const btnAction = { flex: 1, background: "#222", color: "#ccc", textDecoration: "none", textAlign: "center", padding: "6px", borderRadius: "6px", fontSize: "11px", border: "1px solid #333" };
const deleteContainer = { display: "flex", gap: "5px", background: "#000", padding: "5px", borderRadius: "8px" };
const smallInput = { width: "40px", background: "#000", border: "1px solid #333", color: "#fff", padding: "5px", borderRadius: "6px", textAlign: "center", outline: "none", fontSize: "12px" };
const btnDelete = { background: "#dc3545", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", flex: 1 };
const listRowStyle = { background: "#111", border: "1px solid #222", padding: "10px 15px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "15px" };
const tableContainer = { background: "#111", borderRadius: "15px", border: "1px solid #222" };
const thStyle = { padding: "15px", fontSize: "13px" };
const tdStyle = { padding: "15px", fontSize: "14px" };
const badgeAdmin = { background: "#ff9800", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold" };
const badgeUser = { background: "#333", color: "#aaa", padding: "2px 6px", borderRadius: "4px", fontSize: "10px" };
const btnPrimary = { background: "#0070f3", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" };
const btnSecondary = { background: "#333", color: "#fff", border: "none", padding: "10px", borderRadius: "8px", cursor: "pointer" };
const inputStyle = { padding: "10px", background: "#000", border: "1px solid #333", color: "#fff", borderRadius: "6px" };
const modalOverlay = { position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalContent = { background: "#111", padding: "25px", borderRadius: "15px", width: "350px", border: "1px solid #333" };