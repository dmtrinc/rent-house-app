import mongoose, { Schema, models } from "mongoose";

const listingSchema = new Schema(
  {
    title: { type: String, required: [true, "Vui long nhap tieu de"], trim: true },
    address: { type: String, required: [true, "Vui long nhap dia chi"], trim: true },
    price: { type: Number, required: [true, "Vui long nhap gia"], default: 0 },
    description: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    images: { type: [String], default: [] },
    status: { type: String, enum: ["active", "hide"], default: "active" },
    category: { type: String, default: "Phong tro" },
    amenities: { type: [String], default: [] },
    contactPhone: { type: String, required: [true, "Vui long nhap so dien thoai"], trim: true },
    deviceId: { type: String, default: null },
    userId: { type: String, default: null },
    availableDate: { type: Date, default: null },
    highlights: { type: [String], default: [] },
    // Tự ẩn sau N ngày kể từ ngày tạo (null = không áp dụng)
    autoHideDays: { type: Number, default: null },
    // Tự xóa sau N ngày kể từ ngày tạo (null = không áp dụng)
    autoDeleteDays: { type: Number, default: null },
  },
  { timestamps: true }
);

const Listing = models.Listing || mongoose.model("Listing", listingSchema);
export default Listing;