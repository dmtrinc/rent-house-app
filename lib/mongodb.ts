import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Vui lòng định nghĩa biến MONGODB_URI trong file .env.local");
}

/** * Sử dụng biến global để duy trì kết nối trong môi trường Development của Next.js
 * giúp tránh việc tạo quá nhiều kết nối gây treo database.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // Nếu đã có kết nối trước đó, sử dụng lại
  if (cached.conn) {
    return cached.conn;
  }

  // Nếu chưa có kết nối, tạo mới
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      /**
       * family: 4 - CỰC KỲ QUAN TRỌNG
       * Ép Mongoose sử dụng IPv4 (giống file test-db.js bạn đã chạy thành công).
       * Điều này giúp vượt qua lỗi DNS ECONNREFUSED của nhà mạng.
       */
      family: 4, 
      serverSelectionTimeoutMS: 10000, // Chờ tối đa 10 giây để chọn server
    };

    console.log("⏳ Đang khởi tạo kết nối MongoDB (IPv4)...");

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log("✅ KẾT NỐI MONGODB THÀNH CÔNG (Standard Driver)");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e: any) {
    cached.promise = null;
    console.error("❌ Lỗi kết nối MongoDB:", e.message);
    throw e;
  }

  return cached.conn;
}

export default connectDB;