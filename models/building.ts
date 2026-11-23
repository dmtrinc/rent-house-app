import mongoose, { Schema, models } from "mongoose";

/* Nhà / cơ sở cho thuê. Mỗi nhà có địa chỉ và tài khoản nhận tiền riêng in trên phiếu thu. */
const buildingSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, trim: true }, // "NTL"
    name: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    dueDay: { type: Number, default: 5 },
    bankBin: { type: String, default: "970436" },
    bankAccount: { type: String, default: "", trim: true },
    accountName: { type: String, default: "", trim: true },
    transferNote: { type: String, default: "Ghi nội dung chuyển tiền: Tên phòng. (Vui lòng chụp lại hình)" },
    city: { type: String, default: "Tp.Hồ Chí Minh" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Building = models.Building || mongoose.model("Building", buildingSchema);
export default Building;
