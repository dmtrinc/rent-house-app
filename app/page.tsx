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
    const dId = localStorage.getItem("device_id") || "dev_" + Math.random().toString(36).substring(2, 11);
    if (!localStorage.getItem("device_id")) localStorage.setItem("device_id", dId);
    setMyDeviceId(dId);
    
    try {
      setUser(JSON.parse(localStorage.getItem("user") || "null"));
    } catch (e) {
      setUser(null);
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [resListings, resConfig] = await Promise.all([
          fetch("/api/listings"),
          fetch("/api/admin/config").catch(() => null)
        ]);

        if (resListings && resListings.ok) {
          const data = await resListings.json();
          setItems(Array.isArray(data) ? data : []);
        } else {
          setItems([]);
        }

        if (resConfig && resConfig.ok) {
          const configData = await resConfig.json();
          setSystemConfig(configData);
        }
      } catch (error) {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("user");
    window.location.reload();
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fff" }}>
      {/* Header */}
      <header style={{ 
        borderBottom: "1px solid #EBEBEB", 
        position: "sticky", 
        top: 0, 
        backgroundColor: "#fff", 
        zIndex: 100,
        boxShadow: "0 1px 0 rgba(0,0,0,0.08)"
      }}>
        <div style={{ 
          maxWidth: "1760px", 
          margin: "0 auto", 
          padding: "16px 40px", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center" 
        }}>
          {/* Logo + Brand + Phone */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <img 
                  src="https://res.cloudinary.com/df717ylr1/image/upload/v1777306437/logo_ymuon1.png" 
                  alt="Angiahouse"
                  style={{ height: "40px", width: "auto" }}
                />
                <span style={{ 
                  fontSize: "18px", 
                  fontWeight: "700", 
                  color: "#FF385C",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  letterSpacing: "-0.5px"
                }}>
                  ANGIAHOUSE
                </span>
              </div>
            </Link>
            
            <a 
              href="tel:0902225314"
              style={{ 
                fontSize: "14px", 
                fontWeight: "600", 
                color: "#222",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                borderLeft: "2px solid #EBEBEB",
                paddingLeft: "16px"
              }}
            >
              📞 090.222.5314
            </a>
          </div>

          {/* Right menu */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {!systemConfig.globalPostEnabled && (
              <span style={{ 
                fontSize: "13px", 
                color: "#717171", 
                padding: "8px 12px", 
                background: "#F7F7F7", 
                borderRadius: "22px" 
              }}>
                Đang bảo trì
              </span>
            )}

            {user?.role === "admin" && (
              <Link href="/admin" style={{ 
                padding: "8px 16px", 
                borderRadius: "22px", 
                background: "#FF385C", 
                color: "#fff", 
                textDecoration: "none", 
                fontSize: "14px", 
                fontWeight: "600",
                transition: "transform 0.1s",
              }}>
                Quản trị
              </Link>
            )}

            <Link 
              href={(systemConfig.globalPostEnabled && user?.canPost !== false) ? "/dang-tin" : "#"}
              onClick={(e) => {
                if (!systemConfig.globalPostEnabled || user?.canPost === false) {
                  e.preventDefault();
                  alert("Chức năng đăng tin tạm khóa");
                }
              }}
              style={{ 
                padding: "8px 16px", 
                borderRadius: "22px", 
                background: (systemConfig.globalPostEnabled && user?.canPost !== false) ? "#FF385C" : "#E0E0E0",
                color: "#fff", 
                textDecoration: "none", 
                fontSize: "14px", 
                fontWeight: "600",
                transition: "transform 0.1s",
              }}
            >
              Đăng tin
            </Link>

            {user ? (
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "12px", 
                padding: "6px 6px 6px 12px", 
                border: "1px solid #DDDDDD", 
                borderRadius: "21px",
                cursor: "pointer"
              }}>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#222" }}>{user.username}</div>
                  <div style={{ fontSize: "12px", color: "#717171" }}>{user.role}</div>
                </div>
                <button 
                  onClick={handleLogout}
                  style={{ 
                    width: "32px", 
                    height: "32px", 
                    borderRadius: "50%", 
                    background: "#717171", 
                    color: "#fff", 
                    border: "none", 
                    fontSize: "16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  ⎋
                </button>
              </div>
            ) : (
              <Link href="/login" style={{ 
                padding: "8px 16px", 
                borderRadius: "22px", 
                border: "1px solid #DDDDDD", 
                color: "#222", 
                textDecoration: "none", 
                fontSize: "14px", 
                fontWeight: "600",
                background: "#fff"
              }}>
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ maxWidth: "1760px", margin: "0 auto", padding: "40px 40px 80px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "100px 20px" }}>
            <div style={{ 
              width: "40px", 
              height: "40px", 
              border: "4px solid #f3f3f3", 
              borderTop: "4px solid #FF385C", 
              borderRadius: "50%", 
              margin: "0 auto 20px",
              animation: "spin 1s linear infinite"
            }} />
            <p style={{ color: "#717171", fontSize: "16px" }}>Đang tải...</p>
          </div>
        ) : items.length > 0 ? (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
            gap: "40px 24px"
          }}>
            {items.map((item) => {
              if (user?.role !== "admin" && item.status === "hide") return null;
              const isOwner = (item.deviceId === myDeviceId) || (user && item.userId === user._id);

              return (
                <div key={item._id} style={{ position: "relative" }}>
                  <Link href={`/listing/${item._id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ 
                      position: "relative", 
                      width: "100%", 
                      paddingBottom: "100%",
                      borderRadius: "12px",
                      overflow: "hidden",
                      marginBottom: "12px"
                    }}>
                      <img 
                        src={item.coverImage || "/no-image.jpg"} 
                        style={{ 
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%", 
                          height: "100%", 
                          objectFit: "cover"
                        }} 
                        alt={item.title} 
                      />
                      {item.status === "hide" && (
                        <div style={{ 
                          position: "absolute", 
                          top: "12px", 
                          left: "12px", 
                          background: "rgba(0,0,0,0.6)", 
                          color: "#fff", 
                          fontSize: "12px", 
                          padding: "6px 10px", 
                          borderRadius: "6px",
                          fontWeight: "600",
                          backdropFilter: "blur(4px)"
                        }}>
                          ĐÃ ẨN
                        </div>
                      )}
                    </div>

                    <div>
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "flex-start",
                        marginBottom: "4px"
                      }}>
                        <h3 style={{ 
                          fontSize: "15px", 
                          fontWeight: "400", 
                          color: "#222",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1
                        }}>
                          {item.address || "TPHCM"}
                        </h3>
                      </div>
                      
                      <p style={{ 
                        fontSize: "14px", 
                        color: "#717171", 
                        margin: "4px 0",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {item.title}
                      </p>
                      
                      <div style={{ marginTop: "8px" }}>
                        <span style={{ 
                          fontSize: "16px", 
                          fontWeight: "600", 
                          color: "#222"
                        }}>
                          {item.price?.toLocaleString()} đ
                        </span>
                        <span style={{ 
                          fontSize: "14px", 
                          fontWeight: "400", 
                          color: "#717171"
                        }}>
                          {" "}/ tháng
                        </span>
                      </div>
                    </div>
                  </Link>

                  {(isOwner || user?.role === "admin") && (
                    <div style={{ marginTop: "12px", display: "flex", gap: "8px", alignItems: "center" }}>
                      {isOwner && (
                        <Link href={`/edit/${item._id}`} style={{ 
                          fontSize: "13px", 
                          color: "#222", 
                          textDecoration: "underline",
                          fontWeight: "600"
                        }}>
                          Chỉnh sửa
                        </Link>
                      )}
                      {user?.role === "admin" && (
                        <span style={{ 
                          fontSize: "11px", 
                          background: "#F7F7F7", 
                          padding: "4px 8px", 
                          borderRadius: "4px",
                          color: "#717171",
                          fontWeight: "600"
                        }}>
                          ADMIN
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ 
            textAlign: "center", 
            padding: "120px 40px",
            maxWidth: "600px",
            margin: "0 auto"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "24px" }}>🏘️</div>
            <h2 style={{ fontSize: "22px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>
              Chưa có tin đăng nào
            </h2>
            <p style={{ fontSize: "16px", color: "#717171", marginBottom: "32px" }}>
              Hãy là người đầu tiên đăng tin cho thuê nhà
            </p>
            <Link href="/dang-tin" style={{ 
              display: "inline-block",
              padding: "14px 24px", 
              borderRadius: "8px", 
              background: "#FF385C", 
              color: "#fff", 
              textDecoration: "none", 
              fontSize: "16px", 
              fontWeight: "600"
            }}>
              Đăng tin ngay
            </Link>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}