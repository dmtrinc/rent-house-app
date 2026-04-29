import mongoose, { Schema, models } from "mongoose";

// Định nghĩa cấu trúc Schema cho Tin đăng cho thuê nhà
const listingSchema = new Schema(
  {
    title: { 
      type: String, 
      required: [true, "Vui lòng nhập tiêu đề tin đăng"],
      trim: true 
    },
    address: { 
      type: String, 
      required: [true, "Vui lòng nhập địa chỉ"],
      trim: true 
    },
    price: { 
      type: Number, 
      required: [true, "Vui lòng nhập giá cho thuê"],
      default: 0 
    },
    description: { 
      type: String, 
      default: "" 
    },
    coverImage: { 
      type: String, 
      default: "" // URL hình đại diện của căn nhà [cite: 2026-04-24]
    },
    images: { 
      type: [String], 
      default: [] // Mảng chứa danh sách các hình ảnh chi tiết [cite: 2026-04-24]
    },
    status: { 
      type: String, 
      enum: ["active", "hide"], 
      default: "active" // Mặc định là 'active' (Hiện) [cite: 2026-04-29]
    },
    category: { 
      type: String, 
      default: "Phòng trọ" 
    },
    amenities: { 
      type: [String], 
      default: [] // Các tiện ích như Wifi, Máy lạnh, Chỗ để xe...
    },
    contactPhone: { 
      type: String, 
      default: "" 
    }
  },
  { 
    // Tự động tạo trường createdAt và updatedAt để sắp xếp "Mới cập nhật nhất"
    timestamps: true 
  }
);

// Ngăn chặn lỗi tạo lại Model khi Next.js khởi động lại (Hot Reload) [cite: 2026-04-29]
const Listing = models.Listing || mongoose.model("Listing", listingSchema);

// Quan trọng: Phải có Export Default để khớp với lệnh Import trong API route [cite: 2026-04-29]
export default Listing;