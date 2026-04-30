"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SortField = "title" | "address" | "price" | "status" | "updatedAt";
type SortDir = "asc" | "desc";
type UserSortField = "username" | "role" | "lastLogin";

export default function AdminDashboard() {
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"listings" | "users">("listings");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassCols, setShowPassCols] = useState<Record<string, boolean>>({});
  const [autoDeleteDays, setAutoDeleteDays] = useState<number>(30);
  const [savingDays, setSavingDays] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [userSortField, setUserSortField] = useState<UserSortField>("username");
  const [userSortDir, setUserSortDir] = useState<SortDir>("asc");

  const [userFormData, setUserFormData] = useState({
    username: "", email: "", password: "", role: "user",
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resListings, resUsers, resConfig] = await Promise.all([
        fetch("/api/listings"),
        fetch("/api/user"),
        fetch("/api/admin/config").catch(() => null),
      ]);
      if (resListings.ok) setListings(await resListings.json());
      if (resUsers.ok) {
        const dataU = await resUsers.json();
        setUsers(Array.isArray(dataU) ? dataU : dataU.users || []);
      }
      if (resConfig && resConfig.ok) {
        const cfg = await resConfig.json();
        setAutoDeleteDays(cfg.autoDeleteDays ?? 30);
      }
    } catch (error) {
      console.error("Lỗi fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (listing: any) => {
    const newStatus = listing.status === "active" ? "hide" : "active";
    try {
      const res = await fetch(`/api/listings/${listing._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, _adminOverride: true }),
      });
      if (res.ok) {
        setListings(prev => prev.map(l => l._id === listing._id ? { ...l, status: newStatus } : l));
      } else {
        alert("Lỗi cập nhật trạng thái");
      }
    } catch {
      alert("Lỗi kết nối");
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!confirm("Xác nhận xóa tin đăng này?")) return;
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _adminOverride: true }),
      });
      if (res.ok) {
        setListings(prev => prev.filter(l => l._id !== id));
      } else {
        alert("Lỗi xóa tin");
      }
    } catch {
      alert("Lỗi kết nối");
    }
  };

  const handleSaveAutoDelete = async () => {
    setSavingDays(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoDeleteDays }),
      });
      if (res.ok) {
        alert("✅ Đã lưu cấu hình!");
      } else {
        alert("Lỗi lưu cấu hình");
      }
    } catch {
      alert("Lỗi kết nối");
    } finally {
      setSavingDays(false);
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
    } catch {
      alert("Lỗi kết nối API");
    }
  };

  // Sort listings
  const sortedListings = [...listings].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (sortField === "price") {
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
    } else if (sortField === "updatedAt") {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    } else {
      valA = (valA || "").toString().toLowerCase();
      valB = (valB || "").toString().toLowerCase();
    }
    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  // Sort users
  const sortedUsers = [...users].sort((a, b) => {
    let valA = a[userSortField];
    let valB = b[userSortField];
    if (userSortField === "lastLogin") {
      valA = valA ? new Date(valA).getTime() : 0;
      valB = valB ? new Date(valB).getTime() : 0;
    } else {
      valA = (valA || "").toString().toLowerCase();
      valB = (valB || "").toString().toLowerCase();
    }
    if (valA < valB) return userSortDir === "asc" ? -1 : 1;
    if (valA > valB) return userSortDir === "asc" ? 1 : -1;
    return 0;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const toggleUserSort = (field: UserSortField) => {
    if (userSortField === field) setUserSortDir(d => d === "asc" ? "desc" : "asc");
    else { setUserSortField(field); setUserSortDir("asc"); }
  };

  const sortIcon = (field: SortField) => sortField === field ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕";
  const userSortIcon = (field: UserSortField) => userSortField === field ? (userSortDir === "asc" ? " ↑" : " ↓") : " ↕";

  const th: React.CSSProperties = {
    padding: "12px 15px",
    textAlign: "left",
    background: "#1a1a1a",
    color: "#aaa",
    fontSize: "13px",
    fontWeight: 500,
    borderBottom: "1px solid #222",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <h1 style={{ color: "#ff9800", margin: 0 }}>🛡️ Quản trị</h1>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>

            {/* Auto delete config */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#111", border: "1px solid #333", padding: "6px 12px", borderRadius: "8px" }}>
              <span style={{ fontSize: "13px", color: "#aaa", whiteSpace: "nowrap" }}>🗑️ Tự xóa sau</span>
              <input
                type="number"
                min={1}
                max={365}
                value={autoDeleteDays}
                onChange={e => setAutoDeleteDays(Number(e.target.value))}
                style={{ width: "56px", padding: "4px 8px", background: "#222", color: "#fff", border: "1px solid #444", borderRadius: "6px", fontSize: "13px", textAlign: "center" }}
              />
              <span style={{ fontSize: "13px", color: "#aaa" }}>ngày</span>
              <button
                onClick={handleSaveAutoDelete}
                disabled={savingDays}
                style={{ background: "#ff9800", color: "#000", border: "none", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}
              >
                {savingDays ? "..." : "Lưu"}
              </button>
            </div>

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

            {activeTab === "listings" && (
              <div style={{ display: "flex", gap: "4px", background: "#111", border: "1px solid #333", borderRadius: "8px", padding: "4px" }}>
                <button
                  onClick={() => setViewMode("list")}
                  style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: viewMode === "list" ? "#333" : "transparent", color: viewMode === "list" ? "#fff" : "#666", cursor: "pointer", fontSize: "16px" }}
                  title="Xem dạng list"
                >
                  ☰
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: viewMode === "grid" ? "#333" : "transparent", color: viewMode === "grid" ? "#fff" : "#666", cursor: "pointer", fontSize: "16px" }}
                  title="Xem dạng grid"
                >
                  ⊞
                </button>
              </div>
            )}

            <Link href="/" style={{ color: "#888", textDecoration: "none", border: "1px solid #333", padding: "10px 15px", borderRadius: "8px" }}>
              Về trang chủ
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
                      <th style={th} onClick={() => toggleUserSort("username")}>Username{userSortIcon("username")}</th>
                      <th style={th}>Email</th>
                      <th style={th} onClick={() => toggleUserSort("role")}>Role{userSortIcon("role")}</th>
                      <th style={th}>Password</th>
                      <th style={th} onClick={() => toggleUserSort("lastLogin")}>Đăng nhập cuối{userSortIcon("lastLogin")}</th>
                      <th style={th}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map((u, idx) => (
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
                                >ẩn</button>
                              </span>
                            ) : (
                              <button
                                onClick={() => setShowPassCols(prev => ({ ...prev, [u._id]: true }))}
                                style={{ background: "none", border: "1px solid #333", color: "#666", padding: "3px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                              >hiện</button>
                            )
                          ) : (
                            <span style={{ color: "#444", fontSize: "12px" }}>— chưa có</span>
                          )}
                        </td>
                        <td style={{ ...td, color: "#555", fontSize: "12px" }}>
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleString("vi-VN") : "—"}
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
              <>
                {/* List view */}
                {viewMode === "list" && (
                  <div style={{ background: "#111", borderRadius: "12px", border: "1px solid #222", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                      <thead>
                        <tr>
                          <th style={th}>#</th>
                          <th style={th} onClick={() => toggleSort("title")}>Tiêu đề{sortIcon("title")}</th>
                          <th style={th} onClick={() => toggleSort("address")}>Địa chỉ{sortIcon("address")}</th>
                          <th style={th} onClick={() => toggleSort("price")}>Giá{sortIcon("price")}</th>
                          <th style={th} onClick={() => toggleSort("status")}>Trạng thái{sortIcon("status")}</th>
                          <th style={th} onClick={() => toggleSort("updatedAt")}>Cập nhật{sortIcon("updatedAt")}</th>
                          <th style={th}>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedListings.map((l, idx) => (
                          <tr key={l._id} style={{ background: l.status === "hide" ? "#0a0a0a" : "transparent" }}>
                            <td style={{ ...td, color: "#555", fontSize: "13px" }}>{idx + 1}</td>
                            <td style={{ ...td, fontWeight: 500, maxWidth: "220px" }}>
                              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                <Link href={`/listing/${l._id}`} target="_blank" style={{ color: "#fff", textDecoration: "none" }}>
                                  {l.title}
                                </Link>
                              </div>
                            </td>
                            <td style={{ ...td, color: "#aaa", fontSize: "13px", maxWidth: "180px" }}>
                              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.address || "—"}</div>
                            </td>
                            <td style={{ ...td, color: "#ff4d4d", fontWeight: 500, whiteSpace: "nowrap" }}>
                              {l.price?.toLocaleString()} đ
                            </td>
                            <td style={td}>
                              <button
                                onClick={() => handleToggleStatus(l)}
                                style={{
                                  fontSize: "11px", padding: "4px 10px", borderRadius: "4px", fontWeight: "bold", border: "none", cursor: "pointer",
                                  background: l.status === "active" ? "#28a74522" : "#dc354522",
                                  color: l.status === "active" ? "#28a745" : "#dc3545",
                                }}
                              >
                                {l.status === "active" ? "HIỆN" : "ẨN"}
                              </button>
                            </td>
                            <td style={{ ...td, color: "#555", fontSize: "12px", whiteSpace: "nowrap" }}>
                              {new Date(l.updatedAt || l.createdAt).toLocaleDateString("vi-VN")}
                            </td>
                            <td style={td}>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button
                                  onClick={() => router.push(`/edit/${l._id}`)}
                                  style={{ color: "#0070f3", background: "none", border: "1px solid #333", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", whiteSpace: "nowrap" }}
                                >
                                  ✏️ Sửa
                                </button>
                                <button
                                  onClick={() => handleDeleteListing(l._id)}
                                  style={{ color: "#dc3545", background: "none", border: "1px solid #333", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", whiteSpace: "nowrap" }}
                                >
                                  🗑️ Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Grid view */}
                {viewMode === "grid" && (
                  <>
                    {/* Sort bar for grid */}
                    <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", color: "#666" }}>Sắp xếp:</span>
                      {(["title", "address", "price", "status", "updatedAt"] as SortField[]).map(f => (
                        <button
                          key={f}
                          onClick={() => toggleSort(f)}
                          style={{
                            padding: "4px 12px", borderRadius: "6px", border: "1px solid #333", cursor: "pointer", fontSize: "12px",
                            background: sortField === f ? "#ff9800" : "#111",
                            color: sortField === f ? "#000" : "#aaa",
                            fontWeight: sortField === f ? "bold" : "normal"
                          }}
                        >
                          {{ title: "Tiêu đề", address: "Địa chỉ", price: "Giá", status: "Trạng thái", updatedAt: "Cập nhật" }[f]}
                          {sortIcon(f)}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                      {sortedListings.map((l) => (
                        <div key={l._id} style={{
                          background: "#111",
                          borderRadius: "12px",
                          border: `1px solid ${l.status === "hide" ? "#333" : "#222"}`,
                          overflow: "hidden",
                          opacity: l.status === "hide" ? 0.6 : 1
                        }}>
                          {/* Image */}
                          <div style={{ position: "relative", paddingBottom: "65%", background: "#1a1a1a" }}>
                            {l.coverImage ? (
                              <img src={l.coverImage} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} alt={l.title} />
                            ) : (
                              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#333", fontSize: "32px" }}>🏘️</div>
                            )}
                            <div style={{ position: "absolute", top: "8px", left: "8px" }}>
                              <button
                                onClick={() => handleToggleStatus(l)}
                                style={{
                                  fontSize: "11px", padding: "3px 8px", borderRadius: "4px", fontWeight: "bold", border: "none", cursor: "pointer",
                                  background: l.status === "active" ? "#28a745" : "#dc3545",
                                  color: "#fff"
                                }}
                              >
                                {l.status === "active" ? "HIỆN" : "ẨN"}
                              </button>
                            </div>
                          </div>

                          {/* Info */}
                          <div style={{ padding: "12px" }}>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {l.title}
                            </div>
                            <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              📍 {l.address || "—"}
                            </div>
                            <div style={{ fontSize: "14px", color: "#ff4d4d", fontWeight: 600, marginBottom: "8px" }}>
                              {l.price?.toLocaleString()} đ/tháng
                            </div>
                            <div style={{ fontSize: "11px", color: "#555", marginBottom: "12px" }}>
                              Cập nhật: {new Date(l.updatedAt || l.createdAt).toLocaleDateString("vi-VN")}
                            </div>

                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                onClick={() => router.push(`/edit/${l._id}`)}
                                style={{ flex: 1, padding: "6px", background: "#0070f322", color: "#0070f3", border: "1px solid #0070f333", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
                              >
                                ✏️ Sửa
                              </button>
                              <button
                                onClick={() => handleDeleteListing(l._id)}
                                style={{ flex: 1, padding: "6px", background: "#dc354522", color: "#dc3545", border: "1px solid #dc354533", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
                              >
                                🗑️ Xóa
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* Modal thêm/sửa user */}
        {showUserModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "#111", padding: "30px", borderRadius: "16px", width: "400px", border: "1px solid #333", maxHeight: "90vh", overflowY: "auto" }}>
              <h3 style={{ color: "#ff9800", marginTop: 0 }}>
                {editingUser ? "Chỉnh sửa User" : "Tạo User mới"}
              </h3>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Username</label>
                <input type="text" placeholder="Username" value={userFormData.username} onChange={e => setUserFormData({ ...userFormData, username: e.target.value })} style={inputStyle} />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Email</label>
                <input type="email" placeholder="Email" value={userFormData.email} onChange={e => setUserFormData({ ...userFormData, email: e.target.value })} style={inputStyle} />
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
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}>
                    {showPassword ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Role</label>
                <select value={userFormData.role} onChange={e => setUserFormData({ ...userFormData, role: e.target.value })} style={inputStyle}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={handleUserSubmit} style={{ flex: 1, padding: "12px", background: "#0070f3", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
                  Lưu lại
                </button>
                <button onClick={() => setShowUserModal(false)} style={{ flex: 1, padding: "12px", background: "#333", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>
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