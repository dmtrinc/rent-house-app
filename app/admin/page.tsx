"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [listings, setListings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"listings" | "users">("listings");
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassCols, setShowPassCols] = useState<Record<string, boolean>>({});

  const [userFormData, setUserFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resListings, resUsers] = await Promise.all([
        fetch("/api/listings"),
        fetch("/api/user"),
      ]);
      if (resListings.ok) setListings(await resListings.json());
      if (resUsers.ok) {
        const dataU = await resUsers.json();
        setUsers(Array.isArray(dataU) ? dataU : dataU.users || []);
      }
    } catch (error) {
      console.error("Lỗi fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async () => {
    const payload = {
      userId: editingUser?._id,
      username: userFormData.username,
      email: userFormData.email,
      password: userFormData.password,
      role: userFormData.role,
    };
    try {
      const res = await fetch("/api/user", {
        method: editingUser ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert(editingUser ? "Cập nhật thành công!" : "Tạo user thành công!");
        setShowUserModal(false);
        setEditingUser(null);
        setUserFormData({ username: "", email: "", password: "", role: "user" });
        setShowPassword(false);
        fetchData();
      } else {
        const errorData = await res.json();
        alert("Lỗi: " + errorData.message);
      }
    } catch (error) {
      alert("Lỗi kết nối API");
    }
  };

  const th: React.CSSProperties = {
    padding: "12px 15px",
    textAlign: "left",
    background: "#1a1a1a",
    color: "#aaa",
    fontSize: "13px",
    fontWeight: 500,
    borderBottom: "1px solid #222",
  };
  const td: React.CSSProperties = {
    padding: "12px 15px",
    verticalAlign: "middle",
    borderBottom: "1px solid #1a1a1a",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    background: "#222",
    color: "#fff",
    border: "1px solid #444",
    borderRadius: "8px",
    boxSizing: "border-box",
  };

  return (
    <main style={{ backgroundColor: "#000", minHeight: "100vh", color: "#fff", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <h1 style={{ color: "#ff9800", margin: 0 }}>🛡️ Quản trị</h1>
          <div style={{ display: "flex", gap: "10px" }}>
            {activeTab === "users" && (
              <button
                onClick={() => {
                  setEditingUser(null);
                  setUserFormData({ username: "", email: "", password: "", role: "user" });
                  setShowPassword(false);
                  setShowUserModal(true);
                }}
                style={{ background: "#28a745", color: "#fff", border: "none", padding: "10px 15px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
              >
                + Thêm thành viên
              </button>
            )}
            <Link href="/" style={{ color: "#888", textDecoration: "none", border: "1px solid #333", padding: "10px 15px", borderRadius: "8px" }}>
              Thoát
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button onClick={() => setActiveTab("listings")} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: activeTab === "listings" ? "#ff9800" : "#111", color: "#fff", cursor: "pointer" }}>
            Tin đăng ({listings.length})
          </button>
          <button onClick={() => setActiveTab("users")} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: activeTab === "users" ? "#0070f3" : "#111", color: "#fff", cursor: "pointer" }}>
            Thành viên ({users.length})
          </button>
        </div>

        {loading ? (
          <p style={{ color: "#666" }}>Đang tải dữ liệu...</p>
        ) : (
          <>
            {/* Tab Thành viên */}
            {activeTab === "users" && (
              <div style={{ background: "#111", borderRadius: "12px", border: "1px solid #222", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                  <thead>
                    <tr>
                      <th style={th}>#</th>
                      <th style={th}>Username</th>
                      <th style={th}>Email</th>
                      <th style={th}>Role</th>
                      <th style={th}>Password</th>
                      <th style={th}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, idx) => (
                      <tr key={u._id}>
                        <td style={{ ...td, color: "#555", fontSize: "13px" }}>{idx + 1}</td>
                        <td style={{ ...td, fontWeight: 500 }}>{u.username}</td>
                        <td style={{ ...td, color: "#aaa", fontSize: "13px" }}>{u.email || "—"}</td>
                        <td style={td}>
                          <span style={{
                            fontSize: "11px", padding: "3px 8px", borderRadius: "4px", fontWeight: "bold",
                            background: u.role === "admin" ? "#ff980022" : "#0070f322",
                            color: u.role === "admin" ? "#ff9800" : "#0070f3",
                          }}>
                            {u.role?.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ ...td, fontSize: "13px" }}>
                          {u.plainPassword ? (
                            showPassCols[u._id] ? (
                              <span style={{ fontFamily: "monospace", color: "#ff9800" }}>
                                {u.plainPassword}
                                <button
                                  onClick={() => setShowPassCols(prev => ({ ...prev, [u._id]: false }))}
                                  style={{ marginLeft: "8px", background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "11px" }}
                                >
                                  ẩn
                                </button>
                              </span>
                            ) : (
                              <button
                                onClick={() => setShowPassCols(prev => ({ ...prev, [u._id]: true }))}
                                style={{ background: "none", border: "1px solid #333", color: "#666", padding: "3px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                              >
                                hiện
                              </button>
                            )
                          ) : (
                            <span style={{ color: "#444", fontSize: "12px" }}>— chưa có</span>
                          )}
                        </td>
                        <td style={td}>
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setUserFormData({ username: u.username, email: u.email || "", password: "", role: u.role });
                              setShowPassword(false);
                              setShowUserModal(true);
                            }}
                            style={{ color: "#0070f3", background: "none", border: "1px solid #333", padding: "5px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}
                          >
                            Sửa / Đổi Pass
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab Tin đăng */}
            {activeTab === "listings" && (
              <div style={{ background: "#111", borderRadius: "12px", border: "1px solid #222", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                  <thead>
                    <tr>
                      <th style={th}>#</th>
                      <th style={th}>Tiêu đề</th>
                      <th style={th}>Địa chỉ</th>
                      <th style={th}>Giá</th>
                      <th style={th}>Trạng thái</th>
                      <th style={th}>Ngày đăng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((l, idx) => (
                      <tr key={l._id}>
                        <td style={{ ...td, color: "#555", fontSize: "13px" }}>{idx + 1}</td>
                        <td style={{ ...td, fontWeight: 500, maxWidth: "250px" }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</div>
                        </td>
                        <td style={{ ...td, color: "#aaa", fontSize: "13px", maxWidth: "200px" }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.address || "—"}</div>
                        </td>
                        <td style={{ ...td, color: "#ff4d4d", fontWeight: 500 }}>
                          {l.price?.toLocaleString()} đ
                        </td>
                        <td style={td}>
                          <span style={{
                            fontSize: "11px", padding: "3px 8px", borderRadius: "4px", fontWeight: "bold",
                            background: l.status === "active" ? "#28a74522" : "#dc354522",
                            color: l.status === "active" ? "#28a745" : "#dc3545",
                          }}>
                            {l.status === "active" ? "HIỆN" : "ẨN"}
                          </span>
                        </td>
                        <td style={{ ...td, color: "#555", fontSize: "12px" }}>
                          {new Date(l.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Modal thêm/sửa user */}
        {showUserModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "#111", padding: "30px", borderRadius: "16px", width: "400px", border: "1px solid #333" }}>
              <h3 style={{ color: "#ff9800", marginTop: 0 }}>
                {editingUser ? "Chỉnh sửa User" : "Tạo User mới"}
              </h3>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Username</label>
                <input
                  type="text"
                  placeholder="Username"
                  value={userFormData.username}
                  onChange={e => setUserFormData({ ...userFormData, username: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Email</label>
                <input
                  type="email"
                  placeholder="Email"
                  value={userFormData.email}
                  onChange={e => setUserFormData({ ...userFormData, email: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>
                  {editingUser ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={editingUser ? "Nhập mật khẩu mới" : "Mật khẩu"}
                    value={userFormData.password}
                    onChange={e => setUserFormData({ ...userFormData, password: e.target.value })}
                    style={{ ...inputStyle, paddingRight: "44px" }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}
                  >
                    {showPassword ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Role</label>
                <select
                  value={userFormData.role}
                  onChange={e => setUserFormData({ ...userFormData, role: e.target.value })}
                  style={inputStyle}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={handleUserSubmit}
                  style={{ flex: 1, padding: "12px", background: "#0070f3", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
                >
                  Lưu lại
                </button>
                <button
                  onClick={() => setShowUserModal(false)}
                  style={{ flex: 1, padding: "12px", background: "#333", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}