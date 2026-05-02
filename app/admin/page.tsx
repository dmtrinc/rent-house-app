"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SortField = "title" | "address" | "price" | "status" | "updatedAt";
type SortDir = "asc" | "desc";
type UserSortField = "role" | "username" | "email" | "suspended" | "lastLogin";

const ROLE_ORDER: Record<string, number> = { admin: 0, mod: 1, guest: 2, user: 3 };

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

  // Per-listing auto config modal
  const [showListingConfigModal, setShowListingConfigModal] = useState(false);
  const [configListing, setConfigListing] = useState<any>(null);
  const [listingAutoDelete, setListingAutoDelete] = useState<number | "">("");
  const [listingAutoHide, setListingAutoHide] = useState<number | "">("");
  const [savingListingConfig, setSavingListingConfig] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [userSortField, setUserSortField] = useState<UserSortField>("role");
  const [userSortDir, setUserSortDir] = useState<SortDir>("asc");

  const [userFormData, setUserFormData] = useState({
    username: "", email: "", password: "", role: "user",
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

  const openListingConfig = (listing: any) => {
    setConfigListing(listing);
    setListingAutoDelete(listing.autoDeleteDays ?? "");
    setListingAutoHide(listing.autoHideDays ?? "");
    setShowListingConfigModal(true);
  };

  const handleSaveListingConfig = async () => {
    if (!configListing) return;
    setSavingListingConfig(true);
    try {
      const body: any = { _adminOverride: true };
      body.autoDeleteDays = listingAutoDelete !== "" ? Number(listingAutoDelete) : null;
      body.autoHideDays   = listingAutoHide   !== "" ? Number(listingAutoHide)   : null;

      const res = await fetch(`/api/listings/${configListing._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setListings(prev => prev.map(l =>
          l._id === configListing._id
            ? { ...l, autoDeleteDays: body.autoDeleteDays, autoHideDays: body.autoHideDays }
            : l
        ));
        setShowListingConfigModal(false);
        setConfigListing(null);
      } else {
        alert("Lỗi lưu cấu hình tin đăng");
      }
    } catch {
      alert("Lỗi kết nối");
    } finally {
      setSavingListingConfig(false);
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

  const handleToggleSuspend = async (user: any) => {
    const newSuspended = !user.suspended;
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, suspended: newSuspended }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u._id === user._id ? { ...u, suspended: newSuspended } : u));
      } else {
        alert("Lỗi cập nhật trạng thái user");
      }
    } catch {
      alert("Lỗi kết nối");
    }
  };

  // ─── Sort listings ────────────────────────────────────────────────────────
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

  // ─── Sort users: mặc định theo role order ─────────────────────────────────
  const sortedUsers = [...users].sort((a, b) => {
    if (userSortField === "role") {
      const orderA = ROLE_ORDER[a.role] ?? 9;
      const orderB = ROLE_ORDER[b.role] ?? 9;
      if (orderA !== orderB) return userSortDir === "asc" ? orderA - orderB : orderB - orderA;
      return a.username.localeCompare(b.username);
    }

    let valA: any = a[userSortField];
    let valB: any = b[userSortField];

    if (userSortField === "lastLogin") {
      valA = valA ? new Date(valA).getTime() : 0;
      valB = valB ? new Date(valB).getTime() : 0;
    } else if (userSortField === "suspended") {
      valA = a.suspended ? 1 : 0;
      valB = b.suspended ? 1 : 0;
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

  const sortIcon  = (field: SortField)     => sortField     === field ? (sortDir     === "asc" ? " ↑" : " ↓") : " ↕";
  const uSortIcon = (field: UserSortField) => userSortField === field ? (userSortDir === "asc" ? " ↑" : " ↓") : " ↕";

  // ─── Format last login ────────────────────────────────────────────────────
  const formatLastLogin = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now   = new Date();
    const diffMs    = now.getTime() - date.getTime();
    const diffMins  = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays  = Math.floor(diffHours / 24);

    const absolute = date.toLocaleString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    let relative = "";
    if (diffMins < 1)        relative = "vừa xong";
    else if (diffMins < 60)  relative = `${diffMins} phút trước`;
    else if (diffHours < 24) relative = `${diffHours} giờ trước`;
    else if (diffDays < 30)  relative = `${diffDays} ngày trước`;

    return { absolute, relative };
  };

  // ─── Role badge ───────────────────────────────────────────────────────────
  const getRoleBadge = (role: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      admin: { bg: "#ff980022", color: "#ff9800",  label: "ADMIN" },
      mod:   { bg: "#9c27b022", color: "#ce93d8",  label: "MOD" },
      guest: { bg: "#33333344", color: "#888888",  label: "VÃNG LAI" },
      user:  { bg: "#0070f322", color: "#0070f3",  label: "USER" },
    };
    const s = map[role] || map.user;
    return (
      <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "4px", fontWeight: "bold", background: s.bg, color: s.color }}>
        {s.label}
      </span>
    );
  };

  const th: React.CSSProperties = {
    padding: "12px 15px", textAlign: "left", background: "#1a1a1a",
    color: "#aaa", fontSize: "13px", fontWeight: 500,
    borderBottom: "1px solid #222", cursor: "pointer",
    userSelect: "none", whiteSpace: "nowrap",
  };
  const td: React.CSSProperties = {
    padding: "12px 15px", verticalAlign: "middle",
    borderBottom: "1px solid #1a1a1a",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px", background: "#222",
    color: "#fff", border: "1px solid #444", borderRadius: "8px",
    boxSizing: "border-box",
  };

  return (
    <main style={{ backgroundColor: "#000", minHeight: "100vh", color: "#fff", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <h1 style={{ color: "#ff9800", margin: 0 }}>🛡️ Quản trị</h1>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>

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
                <button onClick={() => setViewMode("list")} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: viewMode === "list" ? "#333" : "transparent", color: viewMode === "list" ? "#fff" : "#666", cursor: "pointer", fontSize: "16px" }} title="Xem dạng list">☰</button>
                <button onClick={() => setViewMode("grid")} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: viewMode === "grid" ? "#333" : "transparent", color: viewMode === "grid" ? "#fff" : "#666", cursor: "pointer", fontSize: "16px" }} title="Xem dạng grid">⊞</button>
              </div>
            )}

            <Link href="/" style={{ color: "#888", textDecoration: "none", border: "1px solid #333", padding: "10px 15px", borderRadius: "8px" }}>
              Về trang chủ
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button onClick={() => setActiveTab("listings")} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: activeTab === "listings" ? "#ff9800" : "#111", color: activeTab === "listings" ? "#000" : "#fff", cursor: "pointer", fontWeight: "bold" }}>
            Tin đăng ({listings.length})
          </button>
          <button onClick={() => setActiveTab("users")} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: activeTab === "users" ? "#0070f3" : "#111", color: "#fff", cursor: "pointer", fontWeight: "bold" }}>
            Thành viên ({users.length})
          </button>
        </div>

        {loading ? (
          <p style={{ color: "#666" }}>Đang tải dữ liệu...</p>
        ) : (
          <>
            {/* ═══════════ TAB THÀNH VIÊN ═══════════ */}
            {activeTab === "users" && (
              <div style={{ background: "#111", borderRadius: "12px", border: "1px solid #222", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "960px" }}>
                  <thead>
                    <tr>
                      <th style={th}>#</th>
                      <th style={th} onClick={() => toggleUserSort("username")}>Username{uSortIcon("username")}</th>
                      <th style={th} onClick={() => toggleUserSort("email")}>Email{uSortIcon("email")}</th>
                      <th style={th} onClick={() => toggleUserSort("role")}>Role{uSortIcon("role")}</th>
                      <th style={th}>Password</th>
                      <th style={th} onClick={() => toggleUserSort("lastLogin")}>Đăng nhập cuối{uSortIcon("lastLogin")}</th>
                      <th style={th} onClick={() => toggleUserSort("suspended")}>Trạng thái{uSortIcon("suspended")}</th>
                      <th style={th}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map((u, idx) => {
                      const loginInfo  = formatLastLogin(u.lastLogin);
                      const isSuspended = !!u.suspended;
                      const isGuest    = !!u.isGuestAccount;

                      return (
                        <tr key={u._id} style={{ opacity: isSuspended ? 0.65 : 1 }}>
                          <td style={{ ...td, color: "#555", fontSize: "13px" }}>{idx + 1}</td>

                          {/* Username */}
                          <td style={{ ...td, fontWeight: 500 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              {isGuest && <span style={{ fontSize: "14px" }}>👤</span>}
                              {u.username}
                            </div>
                          </td>

                          {/* Email */}
                          <td style={{ ...td, color: "#aaa", fontSize: "13px" }}>{u.email || "—"}</td>

                          {/* Role */}
                          <td style={td}>{getRoleBadge(u.role)}</td>

                          {/* Password */}
                          <td style={{ ...td, fontSize: "13px" }}>
                            {isGuest ? (
                              <span style={{ color: "#333", fontSize: "12px" }}>—</span>
                            ) : u.plainPassword ? (
                              showPassCols[u._id] ? (
                                <span style={{ fontFamily: "monospace", color: "#ff9800" }}>
                                  {u.plainPassword}
                                  <button onClick={() => setShowPassCols(prev => ({ ...prev, [u._id]: false }))} style={{ marginLeft: "8px", background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "11px" }}>ẩn</button>
                                </span>
                              ) : (
                                <button onClick={() => setShowPassCols(prev => ({ ...prev, [u._id]: true }))} style={{ background: "none", border: "1px solid #333", color: "#666", padding: "3px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>hiện</button>
                              )
                            ) : (
                              <span style={{ color: "#444", fontSize: "12px" }}>— chưa có</span>
                            )}
                          </td>

                          {/* Last login */}
                          <td style={{ ...td, fontSize: "12px" }}>
                            {isGuest ? (
                              <span style={{ color: "#333" }}>—</span>
                            ) : loginInfo ? (
                              <div>
                                <div style={{ color: "#ccc" }}>{loginInfo.absolute}</div>
                                {loginInfo.relative && <div style={{ color: "#555", fontSize: "11px", marginTop: "2px" }}>{loginInfo.relative}</div>}
                              </div>
                            ) : (
                              <span style={{ color: "#555" }}>—</span>
                            )}
                          </td>

                          {/* Trạng thái — click để toggle */}
                          <td style={td}>
                            {u.role === "admin" ? (
                              <span style={{ color: "#555", fontSize: "12px" }}>—</span>
                            ) : (
                              <button
                                onClick={() => handleToggleSuspend(u)}
                                title={isSuspended ? "Nhấn để khôi phục hoạt động" : "Nhấn để đình chỉ"}
                                style={{
                                  fontSize: "12px", padding: "5px 14px", borderRadius: "6px",
                                  fontWeight: "bold", border: "none", cursor: "pointer",
                                  background: isSuspended ? "#dc354522" : "#28a74522",
                                  color: isSuspended ? "#dc3545" : "#28a745",
                                  whiteSpace: "nowrap",
                                  transition: "all 0.15s",
                                }}
                              >
                                {isSuspended ? "🚫 Đình chỉ" : "✅ Hoạt động"}
                              </button>
                            )}
                          </td>

                          {/* Hành động */}
                          <td style={td}>
                            {isGuest ? (
                              <span style={{ color: "#2a2a2a", fontSize: "12px", fontStyle: "italic" }}>Tài khoản hệ thống</span>
                            ) : (
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
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ═══════════ TAB TIN ĐĂNG ═══════════ */}
            {activeTab === "listings" && (
              <>
                {/* List view */}
                {viewMode === "list" && (
                  <div style={{ background: "#111", borderRadius: "12px", border: "1px solid #222", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
                      <thead>
                        <tr>
                          <th style={th}>#</th>
                          <th style={th} onClick={() => toggleSort("title")}>Tiêu đề{sortIcon("title")}</th>
                          <th style={th} onClick={() => toggleSort("address")}>Địa chỉ{sortIcon("address")}</th>
                          <th style={th} onClick={() => toggleSort("price")}>Giá{sortIcon("price")}</th>
                          <th style={th} onClick={() => toggleSort("status")}>Trạng thái{sortIcon("status")}</th>
                          <th style={th} onClick={() => toggleSort("updatedAt")}>Cập nhật{sortIcon("updatedAt")}</th>
                          <th style={th}>Tự động</th>
                          <th style={th}>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedListings.map((l, idx) => (
                          <tr key={l._id} style={{ background: l.status === "hide" ? "#0a0a0a" : "transparent" }}>
                            <td style={{ ...td, color: "#555", fontSize: "13px" }}>{idx + 1}</td>
                            <td style={{ ...td, fontWeight: 500, maxWidth: "220px" }}>
                              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                <Link href={`/listing/${l._id}`} target="_blank" style={{ color: "#fff", textDecoration: "none" }}>{l.title}</Link>
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
                            <td style={{ ...td, fontSize: "11px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                                {l.autoHideDays   != null && <span style={{ color: "#ff9800", background: "#ff980015", padding: "2px 6px", borderRadius: "4px", whiteSpace: "nowrap" }}>👁️ {l.autoHideDays}ng</span>}
                                {l.autoDeleteDays != null && <span style={{ color: "#dc3545", background: "#dc354515", padding: "2px 6px", borderRadius: "4px", whiteSpace: "nowrap" }}>🗑️ {l.autoDeleteDays}ng</span>}
                                {l.autoDeleteDays == null && l.autoHideDays == null && <span style={{ color: "#333" }}>—</span>}
                              </div>
                            </td>
                            <td style={td}>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button onClick={() => router.push(`/edit/${l._id}`)} style={{ color: "#0070f3", background: "none", border: "1px solid #333", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", whiteSpace: "nowrap" }}>✏️ Sửa</button>
                                <button onClick={() => openListingConfig(l)} style={{ color: "#ff9800", background: "none", border: "1px solid #333", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", whiteSpace: "nowrap" }}>⏱️ Tự động</button>
                                <button onClick={() => handleDeleteListing(l._id)} style={{ color: "#dc3545", background: "none", border: "1px solid #333", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", whiteSpace: "nowrap" }}>🗑️ Xóa</button>
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
                    <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", color: "#666" }}>Sắp xếp:</span>
                      {(["title", "address", "price", "status", "updatedAt"] as SortField[]).map(f => (
                        <button key={f} onClick={() => toggleSort(f)} style={{ padding: "4px 12px", borderRadius: "6px", border: "1px solid #333", cursor: "pointer", fontSize: "12px", background: sortField === f ? "#ff9800" : "#111", color: sortField === f ? "#000" : "#aaa", fontWeight: sortField === f ? "bold" : "normal" }}>
                          {{ title: "Tiêu đề", address: "Địa chỉ", price: "Giá", status: "Trạng thái", updatedAt: "Cập nhật" }[f]}{sortIcon(f)}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                      {sortedListings.map((l) => (
                        <div key={l._id} style={{ background: "#111", borderRadius: "12px", border: `1px solid ${l.status === "hide" ? "#333" : "#222"}`, overflow: "hidden", opacity: l.status === "hide" ? 0.6 : 1 }}>
                          <div style={{ position: "relative", paddingBottom: "65%", background: "#1a1a1a" }}>
                            {l.coverImage
                              ? <img src={l.coverImage} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} alt={l.title} />
                              : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#333", fontSize: "32px" }}>🏘️</div>
                            }
                            <div style={{ position: "absolute", top: "8px", left: "8px" }}>
                              <button onClick={() => handleToggleStatus(l)} style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "4px", fontWeight: "bold", border: "none", cursor: "pointer", background: l.status === "active" ? "#28a745" : "#dc3545", color: "#fff" }}>
                                {l.status === "active" ? "HIỆN" : "ẨN"}
                              </button>
                            </div>
                            <div style={{ position: "absolute", top: "8px", right: "8px", display: "flex", flexDirection: "column", gap: "3px", alignItems: "flex-end" }}>
                              {l.autoHideDays   != null && <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "#ff980099", color: "#fff" }}>👁️ {l.autoHideDays}ng</span>}
                              {l.autoDeleteDays != null && <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "#dc354599", color: "#fff" }}>🗑️ {l.autoDeleteDays}ng</span>}
                            </div>
                          </div>
                          <div style={{ padding: "12px" }}>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</div>
                            <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📍 {l.address || "—"}</div>
                            <div style={{ fontSize: "14px", color: "#ff4d4d", fontWeight: 600, marginBottom: "4px" }}>{l.price?.toLocaleString()} đ/tháng</div>
                            <div style={{ fontSize: "11px", color: "#555", marginBottom: "12px" }}>Cập nhật: {new Date(l.updatedAt || l.createdAt).toLocaleDateString("vi-VN")}</div>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button onClick={() => router.push(`/edit/${l._id}`)} style={{ flex: 1, padding: "6px", background: "#0070f322", color: "#0070f3", border: "1px solid #0070f333", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>✏️ Sửa</button>
                              <button onClick={() => openListingConfig(l)} style={{ padding: "6px 10px", background: "#ff980022", color: "#ff9800", border: "1px solid #ff980033", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>⏱️</button>
                              <button onClick={() => handleDeleteListing(l._id)} style={{ flex: 1, padding: "6px", background: "#dc354522", color: "#dc3545", border: "1px solid #dc354533", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>🗑️ Xóa</button>
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

        {/* ═══ MODAL CẤU HÌNH TỰ ĐỘNG ═══ */}
        {showListingConfigModal && configListing && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "#111", padding: "30px", borderRadius: "16px", width: "420px", border: "1px solid #333" }}>
              <h3 style={{ color: "#ff9800", marginTop: 0 }}>⏱️ Cấu hình tự động</h3>
              <p style={{ color: "#888", fontSize: "13px", marginTop: "-8px", marginBottom: "20px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{configListing.title}</p>

              <div style={{ marginBottom: "16px", background: "#1a1a1a", padding: "16px", borderRadius: "10px", border: "1px solid #2a2a2a" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <span style={{ fontSize: "18px" }}>👁️</span>
                  <div>
                    <div style={{ fontSize: "14px", color: "#fff", fontWeight: 600 }}>Tự ẩn sau</div>
                    <div style={{ fontSize: "11px", color: "#555" }}>Tin chuyển sang trạng thái ẩn</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="number" min={1} max={365} placeholder="Không giới hạn" value={listingAutoHide} onChange={e => setListingAutoHide(e.target.value === "" ? "" : Number(e.target.value))} style={{ width: "120px", padding: "10px", background: "#222", color: "#fff", border: "1px solid #444", borderRadius: "8px", textAlign: "center" }} />
                  <span style={{ color: "#aaa" }}>ngày</span>
                  {listingAutoHide !== "" && <button onClick={() => setListingAutoHide("")} style={{ background: "none", border: "1px solid #333", color: "#555", padding: "8px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>Xóa</button>}
                </div>
              </div>

              <div style={{ marginBottom: "24px", background: "#1a1a1a", padding: "16px", borderRadius: "10px", border: "1px solid #2a2a2a" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <span style={{ fontSize: "18px" }}>🗑️</span>
                  <div>
                    <div style={{ fontSize: "14px", color: "#fff", fontWeight: 600 }}>Tự xóa sau</div>
                    <div style={{ fontSize: "11px", color: "#555" }}>Tin bị xóa vĩnh viễn</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="number" min={1} max={365} placeholder="Không giới hạn" value={listingAutoDelete} onChange={e => setListingAutoDelete(e.target.value === "" ? "" : Number(e.target.value))} style={{ width: "120px", padding: "10px", background: "#222", color: "#fff", border: "1px solid #444", borderRadius: "8px", textAlign: "center" }} />
                  <span style={{ color: "#aaa" }}>ngày</span>
                  {listingAutoDelete !== "" && <button onClick={() => setListingAutoDelete("")} style={{ background: "none", border: "1px solid #333", color: "#555", padding: "8px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>Xóa</button>}
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={handleSaveListingConfig} disabled={savingListingConfig} style={{ flex: 1, padding: "12px", background: "#ff9800", color: "#000", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
                  {savingListingConfig ? "Đang lưu..." : "Lưu lại"}
                </button>
                <button onClick={() => { setShowListingConfigModal(false); setConfigListing(null); }} style={{ flex: 1, padding: "12px", background: "#333", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>Hủy</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ MODAL THÊM/SỬA USER ═══ */}
        {showUserModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "#111", padding: "30px", borderRadius: "16px", width: "400px", border: "1px solid #333", maxHeight: "90vh", overflowY: "auto" }}>
              <h3 style={{ color: "#ff9800", marginTop: 0 }}>{editingUser ? "Chỉnh sửa User" : "Tạo User mới"}</h3>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Username</label>
                <input type="text" placeholder="Username" value={userFormData.username} onChange={e => setUserFormData({ ...userFormData, username: e.target.value })} style={inputStyle} />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Email (không bắt buộc)</label>
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
                  <option value="mod">Mod</option>
                  <option value="admin">Admin</option>
                </select>
                {userFormData.role === "mod" && (
                  <div style={{ marginTop: "8px", padding: "10px 12px", background: "#9c27b011", border: "1px solid #9c27b033", borderRadius: "8px", fontSize: "12px", color: "#ce93d8", lineHeight: "1.6" }}>
                    <b>Quyền Mod:</b> Sửa tất cả tin đăng · Ẩn/hiện tin · Tạo tin đăng mới
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={handleUserSubmit} style={{ flex: 1, padding: "12px", background: "#0070f3", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Lưu lại</button>
                <button onClick={() => setShowUserModal(false)} style={{ flex: 1, padding: "12px", background: "#333", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>Hủy</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}