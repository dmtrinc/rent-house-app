"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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
          alignItems: "center",
          gap: "20px"
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
              justifyContent: "center",
              transition: "background 0.2s"
            }}
          >
            ←
          </button>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <img 
                src="https://res.cloudinary.com/df717ylr1/image/upload/v1777306437/logo_ymuon1.png" 
                alt="Angiahouse"
                style={{ height: "40px", width: "auto" }}
              />
              <div style={{ 
                fontSize: "16px", 
                fontWeight: "600", 
                color: "#FF385C",
                fontFamily: "system-ui, -apple-system, sans-serif",
                borderLeft: "2px solid #EBEBEB",
                paddingLeft: "16px"
              }}>
                📞 090.222.5314
              </div>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: "1120px", margin: "0 auto", padding: "24px 40px 80px" }}>
        {/* Title */}
        <h1 style={{ 
          fontSize: "26px", 
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
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          📍 {data.address || "TPHCM"}
        </div>

        {/* Image Gallery */}
        <div style={{ 
          borderRadius: "12px", 
          overflow: "hidden", 
          marginBottom: "48px",
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
                  />
                  {i === 3 && allImages.length > 5 && (
                    <div style={{
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
                      fontWeight: "600"
                    }}>
                      +{allImages.length - 5} ảnh
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content Grid */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "2fr 1fr",
          gap: "80px"
        }}>
          {/* Left Column - Details */}
          <div>
            {/* Price Section */}
            <div style={{ 
              paddingBottom: "32px",
              borderBottom: "1px solid #EBEBEB"
            }}>
              <div style={{ fontSize: "22px", fontWeight: "600", color: "#222", marginBottom: "4px" }}>
                {data.price?.toLocaleString()} đ
                <span style={{ fontSize: "16px", fontWeight: "400", color: "#717171" }}> / tháng</span>
              </div>
            </div>

            {/* Description */}
            <div style={{ paddingTop: "32px", paddingBottom: "32px", borderBottom: "1px solid #EBEBEB" }}>
              <h2 style={{ 
                fontSize: "22px", 
                fontWeight: "600", 
                color: "#222",
                marginBottom: "24px"
              }}>
                Mô tả
              </h2>
              <p style={{ 
                fontSize: "16px",
                lineHeight: "1.75",
                color: "#222",
                whiteSpace: "pre-wrap",
                margin: 0
              }}>
                {data.description || "Chưa có mô tả chi tiết"}
              </p>
            </div>

            {/* Additional Info */}
            <div style={{ paddingTop: "32px" }}>
              <h2 style={{ 
                fontSize: "22px", 
                fontWeight: "600", 
                color: "#222",
                marginBottom: "16px"
              }}>
                Thông tin thêm
              </h2>
              <div style={{ fontSize: "14px", color: "#717171", lineHeight: "1.6" }}>
                <div style={{ marginBottom: "8px" }}>
                  Mã tin: <span style={{ color: "#222", fontWeight: "500" }}>{data._id}</span>
                </div>
                <div>
                  Đăng bởi: <span style={{ color: "#222", fontWeight: "500" }}>
                    {data.userId ? "Thành viên" : "Khách vãng lai"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Contact Card */}
          <div>
            <div style={{ 
              position: "sticky",
              top: "100px",
              border: "1px solid #DDDDDD",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 6px 16px rgba(0,0,0,0.12)"
            }}>
              <div style={{ marginBottom: "24px" }}>
                <div style={{ fontSize: "22px", fontWeight: "600", color: "#222", marginBottom: "4px" }}>
                  {data.price?.toLocaleString()} đ
                  <span style={{ fontSize: "16px", fontWeight: "400", color: "#717171" }}> / tháng</span>
                </div>
              </div>

              <a 
                href="tel:0902225314"
                style={{
                  display: "block",
                  width: "100%",
                  padding: "14px",
                  background: "linear-gradient(to right, #E61E4D 0%, #E31C5F 50%, #D70466 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  textAlign: "center",
                  textDecoration: "none",
                  marginBottom: "16px"
                }}
              >
                📞 Gọi ngay: 090.222.5314
              </a>

              <div style={{ 
                textAlign: "center", 
                fontSize: "14px", 
                color: "#717171",
                marginTop: "16px"
              }}>
                Liên hệ để xem nhà và đặt cọc
              </div>

              {/* Location */}
              <div style={{ 
                marginTop: "24px",
                paddingTop: "24px",
                borderTop: "1px solid #EBEBEB"
              }}>
                <div style={{ fontSize: "16px", fontWeight: "600", color: "#222", marginBottom: "12px" }}>
                  📍 Vị trí
                </div>
                <div style={{ fontSize: "14px", color: "#717171" }}>
                  {data.address || "TPHCM"}
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
      `}} />
    </div>
  );
}