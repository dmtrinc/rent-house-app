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
      default: "", // ⚠️ Chỉ dùng khi develop — xóa field này khi go live
    },
    role: {
      type: String,
      enum: ["user", "mod", "admin", "guest"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["active", "banned"],
      default: "active",
    },
    // suspended: đình chỉ quyền đăng/sửa tin (vẫn đăng nhập được)
    suspended: {
      type: Boolean,
      default: false,
    },
    canPost: {
      type: Boolean,
      default: true,
    },
    // isGuestAccount: đánh dấu đây là tài khoản vãng lai đặc biệt, không xóa được
    isGuestAccount: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const User = models.User || mongoose.model("User", userSchema);

export default User;