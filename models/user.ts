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
  sparse: true, // ← cho phép nhiều user không có email mà không bị lỗi unique
  lowercase: true,
  trim: true,
},
    password: {
      type: String,
      required: [true, "Mật khẩu là bắt buộc"],
    },
    plainPassword: {
      type: String,
      default: "", // ⚠️ Chỉ dùng khi develop — xóa field này khi go live
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["active", "banned"],
      default: "active",
    },
    canPost: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = models.User || mongoose.model("User", userSchema);

export default User;