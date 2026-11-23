import mongoose, { Schema, models } from "mongoose";

/* Hóa đơn tiền nhà của 1 phòng trong 1 tháng.
 * Giá được chụp lại (snapshot) lúc lập để sửa giá phòng sau này không làm đổi hóa đơn cũ. */
const billSchema = new Schema(
  {
    month: { type: String, required: true },   // "2026-12" = hóa đơn tháng 12/2026
    roomId: { type: String, required: true },
    roomCode: { type: String, required: true },

    rent: { type: Number, default: 0 },
    electricPrice: { type: Number, default: 0 },
    oldMeter: { type: Number, default: 0 },
    newMeter: { type: Number, default: 0 },
    waterPrice: { type: Number, default: 0 },
    people: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    parkingPrice: { type: Number, default: 0 },
    vehicles: { type: Number, default: 0 },
    otherAmount: { type: Number, default: 0 },
    otherNote: { type: String, default: "" },
    total: { type: Number, default: 0 },

    readingDate: { type: Date, default: null }, // ngày chốt số điện
    paidAmount: { type: Number, default: 0 },   // thực thu
    paidAt: { type: Date, default: null },
    token: { type: String, required: true, unique: true }, // link gửi khách
  },
  { timestamps: true }
);

billSchema.index({ month: 1, roomId: 1 }, { unique: true });
billSchema.index({ roomId: 1, month: -1 });

const Bill = models.Bill || mongoose.model("Bill", billSchema);
export default Bill;
