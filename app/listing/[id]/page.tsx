"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [showAllImages, setShowAllImages] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then(res => res.json())
      .then(data => setData(data))
      .catch(() => alert("Không thể tải thông tin!"));
  }, [id]);

  if (!data) {
    return (
      <div style={{ background: "#fff", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ 
          width: "40px", 
          height: "40px", 
          border: "4px solid #f3f3f3", 
          borderTop: "4px solid #FF385C", 
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }} />
      </div>
    );
  }

  const allImages = [data.coverImage, ...(data.images || [])].filter(Boolean);
  const contactPhone = data.contactPhone || "090.222.5314";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fff" }}>
      {/* Image Gallery Modal */}
      {showAllImages && (
        <div 
          onClick={() => setShowAllImages(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.95)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "1200px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              position: "relative"
            }}
          >
            <button
              onClick={() => setShowAllImages(false)}
              style={{
                position: "sticky",
                top: "20px",
                left: "100%",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#fff",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                zIndex: 10,
                marginBottom: "20px"
              }}
            >
              ×
            </button>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
              {allImages.map((img: string, i: number) => (
                <img 
                  key={i}
                  src={img} 
                  style={{ 
                    width: "100%", 
                    borderRadius: "8px"
                  }} 
                  alt={`${data.title} - Ảnh ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

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
          padding: "12px 20px", 
          display: "flex", 
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap"
        }}>
          <button 
            onClick={() => router.back()}
            style={{ 
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "24px",
              padding: "8px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ←
          </button>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <img 
                  src="https://res.cloudinary.com/df717ylr1/image/upload/v1777306437/logo_ymuon1.png" 
                  alt="Angiahouse"
                  style={{ height: "32px", width: "auto" }}
                />
                <span style={{ 
                  fontSize: "16px", 
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
              href={`tel:${contactPhone}`}
              style={{ 
                fontSize: "13px", 
                fontWeight: "600", 
                color: "#222",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                borderLeft: "2px solid #EBEBEB",
                paddingLeft: "12px"
              }}
            >
              📞 {contactPhone}
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: "1120px", margin: "0 auto", padding: "16px 20px 60px" }}>
        {/* Title */}
        <h1 style={{ 
          fontSize: "22px", 
          fontWeight: "600", 
          color: "#222",
          margin: "0 0 8px 0",
          fontFamily: "system-ui, -apple-system, sans-serif"
        }}>
          {data.title}
        </h1>

        <div style={{ 
          fontSize: "14px", 
          color: "#717171",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          📍 {data.address || "TPHCM"}
        </div>

        {/* Image Gallery */}
        <div style={{ position: "relative", marginBottom: "32px" }}>
          <div style={{ 
            borderRadius: "12px", 
            overflow: "hidden", 
            display: "grid",
            gridTemplateColumns: allImages.length > 1 ? "2fr 1fr" : "1fr",
            gap: "8px",
            maxHeight: "600px"
          }}>
            {/* Main Image */}
            <div style={{ position: "relative", height: "100%" }}>
              <img 
                src={allImages[0]} 
                style={{ 
                  width: "100%", 
                  height: "100%", 
                  objectFit: "cover",
                  cursor: "pointer"
                }} 
                alt={data.title}
                onClick={() => setShowAllImages(true)}
              />
            </div>

            {/* Side Images Grid */}
            {allImages.length > 1 && (
              <div style={{ 
                display: "grid", 
                gridTemplateRows: "1fr 1fr",
                gap: "8px",
                height: "100%"
              }}>
                {allImages.slice(1, 5).map((img: string, i: number) => (
                  <div key={i} style={{ position: "relative", overflow: "hidden" }}>
                    <img 
                      src={img} 
                      style={{ 
                        width: "100%", 
                        height: "100%", 
                        objectFit: "cover",
                        cursor: "pointer"
                      }} 
                      alt={`${data.title} - ${i + 2}`}
                      onClick={() => setShowAllImages(true)}
                    />
                    {i === 3 && allImages.length > 5 && (
                      <div 
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: "rgba(0,0,0,0.5)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "18px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                        onClick={() => setShowAllImages(true)}
                      >
                        +{allImages.length - 5} ảnh
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Show All Photos Button */}
          <button
            onClick={() => setShowAllImages(true)}
            style={{
              position: "absolute",
              bottom: "12px",
              right: "12px",
              padding: "8px 14px",
              background: "#fff",
              border: "1px solid #222",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
            }}
          >
            🖼️ Xem {allImages.length} ảnh
          </button>
        </div>

        {/* Content Grid - Responsive */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr",
          gap: "32px"
        }}>
          {/* Contact Card - Mobile First */}
          <div>
            <div style={{ 
              border: "1px solid #DDDDDD",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
            }}>
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "20px", fontWeight: "600", color: "#222", marginBottom: "4px" }}>
                  {data.price?.toLocaleString()} đ
                  <span style={{ fontSize: "15px", fontWeight: "400", color: "#717171" }}> / tháng</span>
                </div>
              </div>

              {/* Call Button */}
              <a 
                href={`tel:${contactPhone}`}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px",
                  background: "linear-gradient(to right, #E61E4D 0%, #E31C5F 50%, #D70466 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  textAlign: "center",
                  textDecoration: "none",
                  marginBottom: "10px",
                  boxSizing: "border-box"
                }}
              >
                📞 Gọi: {contactPhone}
              </a>

              {/* Zalo Button */}
              <a 
                href={`https://zalo.me/${contactPhone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px",
                  background: "#0068FF",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  textAlign: "center",
                  textDecoration: "none",
                  marginBottom: "12px",
                  boxSizing: "border-box"
                }}
              >
                💬 Zalo: {contactPhone}
              </a>

              <div style={{ 
                textAlign: "center", 
                fontSize: "13px", 
                color: "#717171",
                marginTop: "12px"
              }}>
                Liên hệ để xem nhà và đặt cọc
              </div>
            </div>
          </div>

          {/* Details */}
          <div>
            {/* Price Section */}
            <div style={{ 
              paddingBottom: "24px",
              borderBottom: "1px solid #EBEBEB"
            }}>
              <div style={{ fontSize: "20px", fontWeight: "600", color: "#222" }}>
                Giá: {data.price?.toLocaleString()} đ/tháng
              </div>
            </div>

            {/* Description */}
            <div style={{ paddingTop: "24px", paddingBottom: "24px", borderBottom: "1px solid #EBEBEB" }}>
              <h2 style={{ 
                fontSize: "20px", 
                fontWeight: "600", 
                color: "#222",
                marginBottom: "16px"
              }}>
                Mô tả
              </h2>
              <p style={{ 
                fontSize: "15px",
                lineHeight: "1.6",
                color: "#222",
                whiteSpace: "pre-wrap",
                margin: 0
              }}>
                {data.description || "Chưa có mô tả chi tiết"}
              </p>
            </div>

            {/* Additional Info */}
            <div style={{ paddingTop: "24px" }}>
              <h2 style={{ 
                fontSize: "20px", 
                fontWeight: "600", 
                color: "#222",
                marginBottom: "12px"
              }}>
                Thông tin thêm
              </h2>
              <div style={{ fontSize: "14px", color: "#717171", lineHeight: "1.6" }}>
                <div style={{ marginBottom: "8px" }}>
                  Mã tin: <span style={{ color: "#222", fontWeight: "500" }}>{data._id}</span>
                </div>
                <div style={{ marginBottom: "8px" }}>
                  Đăng bởi: <span style={{ color: "#222", fontWeight: "500" }}>
                    {data.userId ? "Thành viên" : "Khách vãng lai"}
                  </span>
                </div>
                <div style={{ marginBottom: "8px" }}>
                  📍 Vị trí: <span style={{ color: "#222", fontWeight: "500" }}>
                    {data.address || "TPHCM"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (min-width: 768px) {
          main > div:last-child {
            grid-template-columns: 2fr 1fr !important;
            gap: 60px !important;
          }
          main > div:last-child > div:first-child {
            order: 2;
          }
          main > div:last-child > div:last-child {
            order: 1;
          }
          main > div:last-child > div:first-child > div {
            position: sticky;
            top: 100px;
          }
        }
      `}} />
    </div>
  );
}