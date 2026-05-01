"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* ─── helpers ─────────────────────────────────── */
function getAvailabilityInfo(availableDate: string | null | undefined) {
  const now = new Date(); now.setHours(0,0,0,0);
  if (!availableDate) return { label:"Có thể dọn vào ngay", type:"now", color:"#006633", bg:"#e8f5e9" };
  const avail = new Date(availableDate);
  const diff  = Math.ceil((avail.getTime() - now.getTime()) / 86400000);
  if (diff < 1)  return { label:"Có thể dọn vào ngay", type:"now",  color:"#006633", bg:"#e8f5e9" };
  if (diff < 30) return { label:`Trống từ ${avail.toLocaleDateString("vi-VN")}`, type:"soon", color:"#b08500", bg:"#fff8e1" };
  return        { label:`Trống từ ${avail.toLocaleDateString("vi-VN")}`, type:"late", color:"#888",    bg:"#f5f5f5" };
}

const STAR_REVIEWS = [
  { name:"Nguyễn Văn A", stars:5, date:"12/04/2025", text:"Phòng sạch sẽ, chủ nhà thân thiện, ở rất thoải mái. Sẽ giới thiệu bạn bè!" },
  { name:"Trần Thị B",   stars:5, date:"02/03/2025", text:"Vị trí thuận tiện, gần chợ và siêu thị. Điện nước tính đúng giá niêm yết." },
  { name:"Lê Minh C",   stars:4, date:"10/01/2025", text:"Phòng có đầy đủ tiện nghi, wifi nhanh ổn định. Giá hợp lý với khu vực." },
];

const FURNITURE = [
  { icon:"🛏️", label:"Giường ngủ" },
  { icon:"🛋️", label:"Sofa" },
  { icon:"📺", label:"TV" },
  { icon:"❄️", label:"Máy lạnh" },
  { icon:"🚿", label:"Nước nóng" },
  { icon:"🧺", label:"Máy giặt" },
  { icon:"🍳", label:"Bếp nấu" },
  { icon:"🔒", label:"Khóa cửa" },
  { icon:"📶", label:"Wifi tốc độ cao" },
  { icon:"🚗", label:"Chỗ để xe" },
  { icon:"🏠", label:"Ban công" },
  { icon:"🪟", label:"Cửa sổ lớn" },
];

/* ─── Voucher countdown ───────────────────────── */
function useVoucherCountdown(days = 2) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    const end = Date.now() + days * 76400000;
    const tick = () => {
      const diff = end - Date.now();
      if (diff <= 0) { setRemaining("Đã hết hạn"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}g ${m}p ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [days]);
  return remaining;
}

/* ─── Stars component ─────────────────────────── */
function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span style={{ display:"inline-flex", gap:"2px" }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= value ? "#FFB800" : "#DDD"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </span>
  );
}

/* ─── Interactive star rating ─────────────────── */
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <span style={{ display:"inline-flex", gap:"4px", cursor:"pointer" }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={28} height={28} viewBox="0 0 24 24"
          fill={(hovered || value) >= i ? "#FFB800" : "#DDD"}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i)}
          style={{ transition:"fill 0.15s" }}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </span>
  );
}

/* ─── Similar room card ───────────────────────── */
function SimilarCard({ item }: { item: any }) {
  const [hov, setHov] = useState(false);
  return (
    <Link href={`/listing/${item._id}`} style={{ textDecoration:"none" }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{ borderRadius:"12px", overflow:"hidden", background:"#fff",
          boxShadow: hov ? "0 8px 24px rgba(0,0,0,0.14)" : "0 2px 10px rgba(0,0,0,0.08)",
          transform: hov ? "translateY(-4px)" : "none", transition:"all 0.2s" }}
      >
        <div style={{ paddingBottom:"66%", position:"relative", overflow:"hidden" }}>
          <img src={item.coverImage || "/no-image.jpg"} alt={item.title}
            style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover",
              transform: hov ? "scale(1.04)" : "scale(1)", transition:"transform 0.3s" }} />
        </div>
        <div style={{ padding:"12px" }}>
          <div style={{ fontWeight:700, fontSize:"14px", color:"#111", overflow:"hidden",
            textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:"4px" }}>{item.title}</div>
          <div style={{ fontSize:"12px", color:"#888", marginBottom:"8px", overflow:"hidden",
            textOverflow:"ellipsis", whiteSpace:"nowrap" }}>📍 {item.address || "TPHCM"}</div>
          <div style={{ fontWeight:800, fontSize:"16px", color:"#006633" }}>
            {item.price?.toLocaleString()} đ<span style={{ fontSize:"12px", fontWeight:400, color:"#888" }}>/tháng</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════ */
export default function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData]           = useState<any>(null);
  const [similar, setSimilar]     = useState<any[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIdx, setGalleryIdx]   = useState(0);
  const [ratingVal, setRatingVal]   = useState(0);
  const [comment, setComment]       = useState("");
  const [reviews, setReviews]       = useState(STAR_REVIEWS);
  const [mapExpanded, setMapExpanded] = useState(false);
  const router  = useRouter();
  const voucherTimer = useVoucherCountdown(3);

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        // Fetch similar
        fetch("/api/listings")
          .then(r => r.json())
          .then((all: any[]) => {
            if (!Array.isArray(all)) return;
            const others = all.filter(i => i._id !== d._id && i.status !== "hide");
            // Sort by price proximity then pick 4
            others.sort((a,b) => Math.abs(a.price - d.price) - Math.abs(b.price - d.price));
            setSimilar(others.slice(0,4));
          }).catch(()=>{});
      })
      .catch(() => alert("Không thể tải thông tin!"));
  }, [id]);

  if (!data) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#fff" }}>
      <div style={{ width:40, height:40, border:"4px solid #f3f3f3", borderTop:"4px solid #006633",
        borderRadius:"50%", animation:"spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const allImages = [data.coverImage, ...(data.images || [])].filter(Boolean);
  const avail     = getAvailabilityInfo(data.availableDate);
  const avgStars  = reviews.reduce((s,r)=>s+r.stars,0)/reviews.length;

  /* gallery nav */
  const prevImg = () => setGalleryIdx(i => (i - 1 + allImages.length) % allImages.length);
  const nextImg = () => setGalleryIdx(i => (i + 1) % allImages.length);

  /* submit review (UI only) */
  const submitReview = () => {
    if (!ratingVal) { alert("Vui lòng chọn số sao!"); return; }
    setReviews(prev => [{ name:"Bạn", stars:ratingVal, date:new Date().toLocaleDateString("vi-VN"), text:comment || "👍" }, ...prev]);
    setRatingVal(0); setComment("");
  };

  /* maps embed */
  const mapsQuery = encodeURIComponent(data.address || "Ho Chi Minh City");
  const mapsEmbedUrl  = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  const highlights: string[] = data.highlights?.slice(0,3) || ["An ninh 24/7", "Không gian thoáng mát", "Gần trung tâm"];

  /* ─── colors / styles ───── */
  const GREEN = "#006633";
  const YELLOW = "#FFD966";
  const RED   = "#FF385C";

  return (
    <div style={{ minHeight:"100vh", background:"#f7f7f7", fontFamily:"'Segoe UI', system-ui, -apple-system, sans-serif" }}>

      {/* ── Full-screen Gallery Modal ── */}
      {showGallery && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.95)", zIndex:2000,
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}
          onClick={() => setShowGallery(false)}>
          <button onClick={() => setShowGallery(false)}
            style={{ position:"absolute", top:16, right:20, background:"none", border:"none",
              color:"#fff", fontSize:32, cursor:"pointer", lineHeight:1 }}>×</button>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)", marginBottom:8 }}>
            {galleryIdx + 1} / {allImages.length}
          </div>
          <img src={allImages[galleryIdx]} alt=""
            style={{ maxHeight:"80vh", maxWidth:"90vw", objectFit:"contain", borderRadius:8 }}
            onClick={e => e.stopPropagation()} />
          {allImages.length > 1 && (<>
            <button onClick={e=>{e.stopPropagation();prevImg();}}
              style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
                width:48, height:48, borderRadius:"50%", background:"rgba(255,255,255,0.15)",
                border:"none", color:"#fff", fontSize:24, cursor:"pointer" }}>‹</button>
            <button onClick={e=>{e.stopPropagation();nextImg();}}
              style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                width:48, height:48, borderRadius:"50%", background:"rgba(255,255,255,0.15)",
                border:"none", color:"#fff", fontSize:24, cursor:"pointer" }}>›</button>
          </>)}
          {/* Thumbnails */}
          <div style={{ display:"flex", gap:8, marginTop:16, overflowX:"auto", maxWidth:"90vw", padding:"4px 0" }}>
            {allImages.map((img:string, i:number) => (
              <img key={i} src={img} onClick={e=>{e.stopPropagation();setGalleryIdx(i);}}
                style={{ width:64, height:48, objectFit:"cover", borderRadius:6, cursor:"pointer",
                  opacity: i===galleryIdx ? 1 : 0.5, border: i===galleryIdx ? "2px solid #fff" : "2px solid transparent",
                  flexShrink:0 }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Sticky Header ── */}
      <header style={{ borderBottom:"1px solid #004d26", position:"sticky", top:0,
        background:GREEN, zIndex:100, boxShadow:"0 2px 6px rgba(0,0,0,0.15)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"10px 16px",
          display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button onClick={() => router.back()}
              style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff",
                width:36, height:36, borderRadius:"50%", fontSize:20, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center" }}>←</button>
            <Link href="/" style={{ textDecoration:"none", display:"flex", alignItems:"center", gap:8 }}>
              <img src="https://res.cloudinary.com/df717ylr1/image/upload/v1777485110/logo_an_gia_house_c600o8.png"
                alt="Angiahouse" style={{ height:30, width:"auto" }} />
              <span style={{ fontSize:15, fontWeight:700, color:"#fff", letterSpacing:"-0.4px" }}>ANGIAHOUSE</span>
            </Link>
          </div>
          <a href="tel:0902225314"
            style={{ display:"flex", alignItems:"center", gap:6, color:"#fff",
              textDecoration:"none", fontWeight:700, fontSize:14,
              background:"rgba(255,255,255,0.12)", padding:"7px 14px", borderRadius:20,
              border:"1px solid rgba(255,255,255,0.3)" }}>
            📞 090.222.5314
          </a>
        </div>
      </header>

      {/* ── Page body ── */}
      <main style={{ maxWidth:1120, margin:"0 auto", padding:"20px 16px 80px" }}>

        {/* ── TITLE BAR ── */}
        <div style={{ background:"#fff", borderRadius:14, padding:"20px 24px", marginBottom:16,
          boxShadow:"0 1px 6px rgba(0,0,0,0.07)" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
            <div style={{ flex:1, minWidth:220 }}>
              <h1 style={{ fontSize:"clamp(18px,3vw,24px)", fontWeight:800, color:"#111", margin:"0 0 6px" }}>
                {data.title}
              </h1>
              <a href={mapsSearchUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize:14, color:"#555", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:5 }}>
                📍 {data.address || "TPHCM"}
                <span style={{ fontSize:12, color:GREEN, textDecoration:"underline" }}>Xem bản đồ ↗</span>
              </a>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontSize:"clamp(20px,4vw,28px)", fontWeight:900, color:GREEN, lineHeight:1 }}>
                {data.price?.toLocaleString()}<span style={{ fontSize:14, fontWeight:500, color:"#777" }}> đ</span>
              </div>
              <div style={{ fontSize:13, color:"#777" }}>/tháng</div>
              {/* Availability badge */}
              <div style={{ marginTop:8, display:"inline-flex", alignItems:"center", gap:6,
                padding:"5px 12px", borderRadius:20, background:avail.bg, color:avail.color,
                fontSize:12, fontWeight:700 }}>
                {avail.type==="now" ? "🟢" : avail.type==="soon" ? "🟡" : "⚪"} {avail.label}
              </div>
            </div>
          </div>
        </div>

        {/* ── VOUCHER BANNER ── */}
        <div style={{ background:"linear-gradient(135deg,#FF6B35,#FF385C)", borderRadius:14,
          padding:"16px 20px", marginBottom:16, display:"flex", alignItems:"center",
          gap:12, flexWrap:"wrap", boxShadow:"0 4px 16px rgba(255,56,92,0.3)" }}>
          <div style={{ fontSize:28 }}>🎁</div>
          <div style={{ flex:1, minWidth:180 }}>
            <div style={{ color:"#fff", fontWeight:800, fontSize:15 }}>Voucher khuyến mãi: Giảm 100.000 đ/tháng</div>
            <div style={{ color:"rgba(255,255,255,0.85)", fontSize:13 }}>Áp dụng 3 tháng đầu • Đặt phòng ngay hôm nay!</div>
          </div>
          <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:10, padding:"8px 16px", textAlign:"center" }}>
            <div style={{ color:"#fff", fontSize:11, fontWeight:600 }}>HẾT HẠN TRONG</div>
            <div style={{ color:"#FFD966", fontWeight:800, fontSize:16, fontVariantNumeric:"tabular-nums" }}>{voucherTimer}</div>
          </div>
        </div>

        {/* ── CONTENT GRID ── */}
        <div className="main-grid" style={{ display:"grid", gridTemplateColumns:"1fr", gap:16 }}>

          {/* LEFT: images + details */}
          <div>

            {/* ── PHOTO GALLERY ── */}
            <div style={{ borderRadius:14, overflow:"hidden", marginBottom:16,
              boxShadow:"0 2px 10px rgba(0,0,0,0.1)" }}>
              <div style={{ display:"grid",
                gridTemplateColumns: allImages.length>1 ? "1fr 1fr" : "1fr",
                gridTemplateRows: "auto",
                gap:4, background:"#000", maxHeight:480 }}>
                {/* Main */}
                <div style={{ gridRow: allImages.length > 2 ? "1/3" : "auto",
                  position:"relative", cursor:"pointer", overflow:"hidden" }}
                  onClick={()=>{ setGalleryIdx(0); setShowGallery(true); }}>
                  <img src={allImages[0]} alt={data.title}
                    style={{ width:"100%", height:"100%", objectFit:"cover", minHeight:240,
                      transition:"transform 0.3s" }}
                    onMouseOver={e=>(e.currentTarget.style.transform="scale(1.03)")}
                    onMouseOut={e=>(e.currentTarget.style.transform="scale(1)")} />
                </div>
                {/* Side thumbnails */}
                {allImages.slice(1,5).map((img:string,i:number) => (
                  <div key={i} style={{ position:"relative", cursor:"pointer", overflow:"hidden",
                    height:allImages.length>2?120:240 }}
                    onClick={()=>{ setGalleryIdx(i+1); setShowGallery(true); }}>
                    <img src={img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover",
                      transition:"transform 0.3s" }}
                      onMouseOver={e=>(e.currentTarget.style.transform="scale(1.05)")}
                      onMouseOut={e=>(e.currentTarget.style.transform="scale(1)")} />
                    {i===3 && allImages.length>5 && (
                      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.55)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        color:"#fff", fontSize:20, fontWeight:700 }}>+{allImages.length-5} ảnh</div>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={()=>setShowGallery(true)}
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                  width:"100%", padding:"10px",
                  background:"#f5f5f5", border:"none", borderTop:"1px solid #eee",
                  fontSize:13, fontWeight:600, color:"#333", cursor:"pointer" }}>
                🖼️ Xem tất cả {allImages.length} ảnh
              </button>
            </div>

            {/* ── 3 HIGHLIGHTS ── */}
            <div style={{ background:"#fff", borderRadius:14, padding:"20px 24px",
              marginBottom:16, boxShadow:"0 1px 6px rgba(0,0,0,0.07)" }}>
              <h2 style={{ fontSize:17, fontWeight:800, color:"#111", margin:"0 0 14px" }}>⭐ Đặc điểm nổi bật</h2>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12 }}>
                {highlights.map((h,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10,
                    padding:"14px 16px", borderRadius:10, background:"#f0faf4",
                    border:"1px solid #c8e6c9" }}>
                    <span style={{ fontSize:22 }}>{"🌟✨💡".split("").filter((_,j)=>j===i)[0] || "✓"}</span>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:GREEN }}>{h}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── MÔ TẢ ── */}
            <div style={{ background:"#fff", borderRadius:14, padding:"20px 24px",
              marginBottom:16, boxShadow:"0 1px 6px rgba(0,0,0,0.07)" }}>
              <h2 style={{ fontSize:17, fontWeight:800, color:"#111", margin:"0 0 14px" }}>📝 Mô tả chi tiết</h2>
              <p style={{ fontSize:15, lineHeight:1.7, color:"#333", whiteSpace:"pre-wrap", margin:0 }}>
                {data.description || "Chưa có mô tả chi tiết."}
              </p>
            </div>

            {/* ── NỘI THẤT ── */}
            <div style={{ background:"#fff", borderRadius:14, padding:"20px 24px",
              marginBottom:16, boxShadow:"0 1px 6px rgba(0,0,0,0.07)" }}>
              <h2 style={{ fontSize:17, fontWeight:800, color:"#111", margin:"0 0 14px" }}>🛋️ Nội thất & tiện nghi</h2>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:10 }}>
                {(data.furniture || FURNITURE).map((f:any, i:number) => {
                  const icon  = typeof f === "object" ? f.icon  : FURNITURE[i]?.icon  || "✅";
                  const label = typeof f === "object" ? f.label : f;
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8,
                      padding:"10px 12px", borderRadius:10, background:"#fafafa",
                      border:"1px solid #ebebeb", fontSize:13, fontWeight:600, color:"#333" }}>
                      <span style={{ fontSize:18 }}>{icon}</span> {label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── GOOGLE MAPS ── */}
            <div style={{ background:"#fff", borderRadius:14, overflow:"hidden",
              marginBottom:16, boxShadow:"0 1px 6px rgba(0,0,0,0.07)" }}>
              <div style={{ padding:"16px 24px 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <h2 style={{ fontSize:17, fontWeight:800, color:"#111", margin:0 }}>📍 Vị trí trên bản đồ</h2>
                <a href={mapsSearchUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize:13, color:GREEN, fontWeight:600, textDecoration:"none" }}>
                  Mở Google Maps ↗
                </a>
              </div>
              <div style={{ padding:"12px 24px 20px" }}>
                <div style={{ borderRadius:10, overflow:"hidden", border:"1px solid #ddd",
                  height: mapExpanded ? 400 : 220, transition:"height 0.3s", position:"relative" }}>
                  <iframe
                    src={mapsEmbedUrl}
                    width="100%" height="100%"
                    style={{ border:0 }}
                    allowFullScreen loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Google Maps"
                  />
                  {/* Clickable overlay to open Google Maps */}
                  <a href={mapsSearchUrl} target="_blank" rel="noopener noreferrer"
                    style={{ position:"absolute", inset:0, display:"block" }} title="Mở Google Maps" />
                </div>
                <button onClick={()=>setMapExpanded(e=>!e)}
                  style={{ marginTop:8, background:"none", border:"none", color:GREEN,
                    fontSize:13, fontWeight:600, cursor:"pointer", padding:0 }}>
                  {mapExpanded ? "Thu nhỏ bản đồ ▲" : "Phóng to bản đồ ▼"}
                </button>
              </div>
            </div>

            {/* ── RATINGS & REVIEWS ── */}
            <div style={{ background:"#fff", borderRadius:14, padding:"20px 24px",
              marginBottom:16, boxShadow:"0 1px 6px rgba(0,0,0,0.07)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, flexWrap:"wrap" }}>
                <h2 style={{ fontSize:17, fontWeight:800, color:"#111", margin:0 }}>⭐ Đánh giá & Nhận xét</h2>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <Stars value={Math.round(avgStars)} size={18} />
                  <span style={{ fontWeight:800, fontSize:18, color:"#111" }}>{avgStars.toFixed(1)}</span>
                  <span style={{ fontSize:13, color:"#777" }}>({reviews.length} đánh giá)</span>
                </div>
              </div>

              {/* Write review */}
              <div style={{ background:"#f9f9f9", borderRadius:12, padding:"16px 20px", marginBottom:20,
                border:"1px solid #eee" }}>
                <div style={{ fontWeight:700, fontSize:14, color:"#333", marginBottom:10 }}>Gửi đánh giá của bạn</div>
                <StarRating value={ratingVal} onChange={setRatingVal} />
                <textarea
                  value={comment}
                  onChange={e=>setComment(e.target.value)}
                  placeholder="Nhận xét của bạn về phòng trọ..."
                  rows={3}
                  style={{ display:"block", width:"100%", marginTop:10, padding:"10px 12px",
                    border:"1px solid #ddd", borderRadius:8, fontSize:14, resize:"none",
                    fontFamily:"inherit", boxSizing:"border-box" }}
                />
                <button onClick={submitReview}
                  style={{ marginTop:10, padding:"10px 24px", background:GREEN, color:"#fff",
                    border:"none", borderRadius:8, fontSize:14, fontWeight:700, cursor:"pointer" }}>
                  Gửi đánh giá
                </button>
              </div>

              {/* Review list */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {reviews.map((r,i) => (
                  <div key={i} style={{ padding:"14px 16px", borderRadius:10, background:"#fafafa",
                    border:"1px solid #eee" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                      <div style={{ width:36, height:36, borderRadius:"50%", background:GREEN,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        color:"#fff", fontWeight:700, fontSize:14 }}>
                        {r.name[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14, color:"#111" }}>{r.name}</div>
                        <div style={{ fontSize:11, color:"#999" }}>{r.date}</div>
                      </div>
                      <div style={{ marginLeft:"auto" }}>
                        <Stars value={r.stars} size={14} />
                      </div>
                    </div>
                    <p style={{ margin:0, fontSize:14, color:"#444", lineHeight:1.5 }}>{r.text}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>{/* end LEFT */}

          {/* RIGHT: Sticky contact card */}
          <div className="sidebar">
            <div className="sticky-card" style={{ background:"#fff", borderRadius:14,
              boxShadow:"0 4px 20px rgba(0,0,0,0.12)", overflow:"hidden" }}>

              {/* Price */}
              <div style={{ background:GREEN, padding:"16px 20px" }}>
                <div style={{ color:"rgba(255,255,255,0.75)", fontSize:13 }}>Giá thuê hàng tháng</div>
                <div style={{ color:"#fff", fontSize:28, fontWeight:900 }}>
                  {data.price?.toLocaleString()} đ
                  <span style={{ fontSize:14, fontWeight:400, color:"rgba(255,255,255,0.7)" }}>/tháng</span>
                </div>
                <div style={{ marginTop:8, display:"inline-flex", alignItems:"center", gap:5,
                  background:"rgba(255,255,255,0.15)", padding:"4px 12px",
                  borderRadius:20, fontSize:12, fontWeight:700, color:"#fff" }}>
                  {avail.type==="now"?"🟢":"🟡"} {avail.label}
                </div>
              </div>

              <div style={{ padding:"16px 20px" }}>
                {/* Voucher mini */}
                <div style={{ background:"#fff5f5", border:"1px dashed #FF385C",
                  borderRadius:10, padding:"10px 14px", marginBottom:14,
                  display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:20 }}>🎁</span>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13, color:"#cc2200" }}>Giảm 100K/tháng × 3 tháng</div>
                    <div style={{ fontSize:11, color:"#999" }}>Còn: {voucherTimer}</div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <a href="tel:0902225314"
                  style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                    width:"100%", padding:"14px", background:"linear-gradient(to right,#E61E4D,#D70466)",
                    color:"#fff", border:"none", borderRadius:10, fontSize:15, fontWeight:700,
                    cursor:"pointer", textDecoration:"none", marginBottom:10, boxSizing:"border-box" }}>
                  📞 Gọi ngay: 090.222.5314
                </a>

                <a href="https://zalo.me/0902225314" target="_blank" rel="noopener noreferrer"
                  style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                    width:"100%", padding:"14px", background:"#0068FF",
                    color:"#fff", border:"none", borderRadius:10, fontSize:15, fontWeight:700,
                    cursor:"pointer", textDecoration:"none", marginBottom:14, boxSizing:"border-box" }}>
                  <img src="https://page.widget.zalo.me/static/images/2.0/Logo.svg" alt="Zalo"
                    style={{ height:20, width:"auto", filter:"brightness(0) invert(1)" }} />
                  Chat Zalo: 090.222.5314
                </a>

                {data.contactPhone && (
                  <div style={{ textAlign:"center", fontSize:13, color:"#555", marginBottom:14 }}>
                    Điện thoại chủ nhà: <a href={`tel:${data.contactPhone}`}
                      style={{ color:GREEN, fontWeight:700, textDecoration:"none" }}>{data.contactPhone}</a>
                  </div>
                )}

                <div style={{ textAlign:"center", fontSize:12, color:"#aaa" }}>
                  Liên hệ để xem phòng & đặt cọc
                </div>

                {/* Divider */}
                <hr style={{ border:"none", borderTop:"1px solid #eee", margin:"16px 0" }}/>

                {/* Poster info */}
                <div style={{ fontSize:13, fontWeight:700, color:"#333", marginBottom:10 }}>Thông tin người đăng</div>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ position:"relative" }}>
                    <div style={{ width:48, height:48, borderRadius:"50%", background:GREEN,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color:"#fff", fontWeight:800, fontSize:18 }}>
                      {(data.userId || "A")[0]?.toUpperCase()}
                    </div>
                    <div style={{ position:"absolute", bottom:0, right:0, width:16, height:16,
                      background:GREEN, border:"2px solid #fff", borderRadius:"50%",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:9, color:"#fff", fontWeight:800 }}>✔</div>
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:"#111", display:"flex", alignItems:"center", gap:4 }}>
                      {data.userId ? "Thành viên" : "Angiahouse"}
                      <span style={{ fontSize:11, color:GREEN, fontWeight:600,
                        background:"#e8f5e9", padding:"1px 6px", borderRadius:20 }}>✔ Đã xác thực</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:3 }}>
                      <Stars value={5} size={12} />
                      <span style={{ fontSize:12, color:"#555" }}>5.0 • Phản hồi nhanh</span>
                    </div>
                    <Link href="#" style={{ fontSize:12, color:GREEN, fontWeight:600, textDecoration:"none" }}>
                      Xem trang cá nhân →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Listing meta */}
              <div style={{ background:"#fafafa", borderTop:"1px solid #eee", padding:"12px 20px" }}>
                <div style={{ fontSize:12, color:"#999", lineHeight:1.8 }}>
                  <div>Mã tin: <span style={{ color:"#555" }}>{data._id}</span></div>
                  <div>Địa chỉ: <span style={{ color:"#555" }}>{data.address || "TPHCM"}</span></div>
                </div>
              </div>
            </div>
          </div>

        </div>{/* end main-grid */}

        {/* ── SIMILAR ROOMS ── */}
        {similar.length > 0 && (
          <div style={{ marginTop:32 }}>
            <h2 style={{ fontSize:20, fontWeight:800, color:"#111", marginBottom:16 }}>🏘️ Phòng tương tự gần đây</h2>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))", gap:16 }}>
              {similar.map(item => <SimilarCard key={item._id} item={item} />)}
            </div>
          </div>
        )}

      </main>

      {/* ── Mobile floating CTA ── */}
      <div className="mobile-cta" style={{ display:"none", position:"fixed", bottom:0, left:0, right:0,
        background:"#fff", borderTop:"1px solid #eee", padding:"10px 16px",
        zIndex:200, gap:10 }}>
        <a href="tel:0902225314"
          style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            padding:"13px", background:RED, color:"#fff", borderRadius:10,
            fontSize:15, fontWeight:700, textDecoration:"none" }}>
          📞 Gọi ngay
        </a>
        <a href="https://zalo.me/0902225314" target="_blank" rel="noopener noreferrer"
          style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            padding:"13px", background:"#0068FF", color:"#fff", borderRadius:10,
            fontSize:15, fontWeight:700, textDecoration:"none" }}>
          <img src="https://page.widget.zalo.me/static/images/2.0/Logo.svg" alt="Zalo"
            style={{ height:18, filter:"brightness(0) invert(1)" }} />
          Zalo
        </a>
      </div>

      <style dangerouslySetInnerHTML={{ __html:`
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (min-width: 900px) {
          .main-grid {
            grid-template-columns: 2fr 380px !important;
            gap: 24px !important;
          }
          .sticky-card {
            position: sticky !important;
            top: 80px !important;
          }
        }

        @media (max-width: 600px) {
          .mobile-cta {
            display: flex !important;
          }
          main {
            padding-bottom: 90px !important;
          }
        }

        details summary::-webkit-details-marker { display: none; }
        * { box-sizing: border-box; }
        textarea:focus { outline: 2px solid #006633; }
        button:focus { outline: none; }
        img { max-width: 100%; }
      `}} />
    </div>
  );
}
