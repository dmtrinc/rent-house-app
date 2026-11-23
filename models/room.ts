import mongoose, { Schema, models } from "mongoose";

/* Phòng cho thuê của chủ nhà (dùng để lập hóa đơn hàng tháng) —
 * khác với "listing" là tin đăng quảng cáo trên web. */
const roomSchema = new Schema(
  {
    building: { type: String, required: true, trim: true }, // mã nhà: "NTL"
    code: { type: String, required: true, trim: true },     // "101", "T2" (trùng được giữa các nhà)
    tenantName: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    people: { type: Number, default: 1 },     // số người → tính tiền nước
    vehicles: { type: Number, default: 0 },   // số xe → tính tiền xe
    rent: { type: Number, default: 0 },
    deposit: { type: Number, default: 0 },
    electricPrice: { type: Number, default: 4000 },
    waterPrice: { type: Number, default: 100000 }, // đ/người, hoặc đ/m³ nếu waterMeter
    waterMeter: { type: Boolean, default: false }, // tính nước theo đồng hồ
    waterMeterStart: { type: Number, default: 0 }, // chỉ số nước gốc
    parkingPrice: { type: Number, default: 100000 },
    serviceFee: { type: Number, default: 200000 },
    contractStart: { type: Date, default: null },
    contractEnd: { type: Date, default: null },
    // Chỉ số điện gốc — dùng khi phòng chưa có hóa đơn nào trước đó
    meterStart: { type: Number, default: 0 },
    note: { type: String, default: "" },
    active: { type: Boolean, default: true }, // false = phòng trống, không lập hóa đơn
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

roomSchema.index({ building: 1, code: 1 }, { unique: true });

const Room = models.Room || mongoose.model("Room", roomSchema);
export default Room;
