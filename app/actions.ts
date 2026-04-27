"use server";

import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";

// Cấu hình Cloudinary (để xóa ảnh trên cloud khi xóa tin)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function deleteListing(id: string, imageUrl?: string) {
  await connectDB();
  const db = mongoose.connection.db;

  // 1. Xóa ảnh trên Cloudinary (nếu có)
  if (imageUrl) {
    try {
      // Lấy public_id từ URL (đoạn mã sau folder rent-house/)
      const publicId = imageUrl.split('/').pop()?.split('.')[0];
      if (publicId) {
        await cloudinary.uploader.destroy(`rent-house/${publicId}`);
      }
    } catch (error) {
      console.error("Lỗi khi xóa ảnh trên Cloudinary:", error);
    }
  }

  // 2. Xóa dữ liệu trong MongoDB
  await db?.collection("listings").deleteOne({
    _id: new mongoose.Types.ObjectId(id)
  });

  // 3. Làm tươi lại trang chủ để cập nhật danh sách
  revalidatePath("/");
}