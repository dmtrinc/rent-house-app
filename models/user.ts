import mongoose, { Schema, models } from "mongoose";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Tên đăng nhập là bắt buộc"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Mật khẩu là bắt buộc"],
    },
    plainPassword: {
      type: String,
      default: "", // ⚠️ Dev only — xóa trước khi go live
    },
    phone:    { type: String, default: "", trim: true },
    role:     { type: String, enum: ["user", "mod", "admin", "guest"], default: "user" },
    status:   { type: String, enum: ["active", "banned"], default: "active" },
    suspended: { type: Boolean, default: false },  // admin đình chỉ tạm thời
    canPost:  { type: Boolean, default: true },
    isGuestAccount: { type: Boolean, default: false },
    lastLogin: { type: Date, default: null },

    savedListings: { type: [String], default: [] },
    viewHistory:   { type: [String], default: [] }, // tối đa 50, mới nhất trước

    headerText: { type: String, default: "" },
    footerText: { type: String, default: "" },
  },
  { timestamps: true }
);

const User = models.User || mongoose.model("User", userSchema);
export default User;