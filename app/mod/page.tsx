"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SortField = "title" | "address" | "price" | "status" | "updatedAt";
type SortDir = "asc" | "desc";

export default function ModDashboard() {
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/listings");
      if (res.ok) setListings(await res.json());
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
        body: JSON.stringify({ status: newStatus, _modOverride: true }),
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

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const sortIcon = (field: SortField) => sortField === field ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕";

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

  return (
    <main style={{ backgroundColor: "#000", minHeight: "100vh", color: "#fff", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h1 style={{ color: "#ce93d8", margin: 0 }}>🛠️ Quản lý Mod</h1>
            <span style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "6px", background: "#9c27b022", color: "#ce93d8", border: "1px solid #9c27b033" }}>
              MOD
            </span>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => router.push("/create")}
              style={{ background: "#28a745", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}
            >
              + Tạo tin đăng
            </button>
            <div style={{ display: "flex", gap: "4px", background: "#111", border: "1px solid #333", borderRadius: "8px", padding: "4px" }}>
              <button
                onClick={() => setViewMode("list")}
                style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: viewMode === "list" ? "#333" : "transparent", color: viewMode === "list" ? "#fff" : "#666", cursor: "pointer", fontSize: "16px" }}
                title="Xem dạng list"
              >☰</button>
              <button
                onClick={() => setViewMode("grid")}
                style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: viewMode === "grid" ? "#333" : "transparent", color: viewMode === "grid" ? "#fff" : "#666", cursor: "pointer", fontSize: "16px" }}
                title="Xem dạng grid"
              >⊞</button>
            </div>
            <Link href="/" style={{ color: "#888", textDecoration: "none", border: "1px solid #333", padding: "10px 15px", borderRadius: "8px" }}>
              Về trang chủ
            </Link>
          </div>
        </div>

        {/* Info bar */}
        <div style={{ marginBottom: "20px", padding: "12px 16px", background: "#9c27b011", border: "1px solid #9c27b022", borderRadius: "10px", fontSize: "13px", color: "#ce93d8" }}>
          ℹ️ Bạn có quyền: <b>Sửa / Ẩn / Hiện</b> tất cả tin đăng và <b>Tạo tin đăng mới</b>. Không có quyền xóa tin hoặc quản lý thành viên.
        </div>

        {loading ? (
          <p style={{ color: "#666" }}>Đang tải dữ liệu...</p>
        ) : (
          <>
            {/* Listing count */}
            <div style={{ marginBottom: "12px", color: "#555", fontSize: "13px" }}>
              Tổng cộng: <span style={{ color: "#fff" }}>{listings.length}</span> tin đăng
            </div>

            {/* List view */}
            {viewMode === "list" && (
              <div style={{ background: "#111", borderRadius: "12px", border: "1px solid #222", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
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
                          <button
                            onClick={() => router.push(`/edit/${l._id}`)}
                            style={{ color: "#ce93d8", background: "none", border: "1px solid #9c27b033", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", whiteSpace: "nowrap" }}
                          >
                            ✏️ Sửa
                          </button>
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
                    <button
                      key={f}
                      onClick={() => toggleSort(f)}
                      style={{
                        padding: "4px 12px", borderRadius: "6px", border: "1px solid #333", cursor: "pointer", fontSize: "12px",
                        background: sortField === f ? "#ce93d8" : "#111",
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
                      <div style={{ padding: "12px" }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</div>
                        <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📍 {l.address || "—"}</div>
                        <div style={{ fontSize: "14px", color: "#ff4d4d", fontWeight: 600, marginBottom: "4px" }}>{l.price?.toLocaleString()} đ/tháng</div>
                        <div style={{ fontSize: "11px", color: "#555", marginBottom: "12px" }}>
                          Cập nhật: {new Date(l.updatedAt || l.createdAt).toLocaleDateString("vi-VN")}
                        </div>
                        <button
                          onClick={() => router.push(`/edit/${l._id}`)}
                          style={{ width: "100%", padding: "8px", background: "#9c27b022", color: "#ce93d8", border: "1px solid #9c27b033", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
                        >✏️ Sửa tin</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}