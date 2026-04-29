"use server";

import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function getCloudinaryPublicId(url: string): string | null {
  try {
    // URL dạng: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/subfolder/filename.jpg
    // Public ID là toàn bộ path sau /upload/vXXXXXX/ và bỏ đuôi file
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function deleteListing(id: string, imageUrl?: string) {
  await connectDB();
  const db = mongoose.connection.db;

  // 1. Xóa ảnh trên Cloudinary (nếu có)
  if (imageUrl) {
    try {
      const publicId = getCloudinaryPublicId(imageUrl);
      if (publicId) {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Cloudinary xóa ảnh:", publicId, "→", result.result);
      }
    } catch (error) {
      console.error("Lỗi khi xóa ảnh trên Cloudinary:", error);
    }
  }

  // 2. Xóa dữ liệu trong MongoDB
  await db?.collection("listings").deleteOne({
    _id: new mongoose.Types.ObjectId(id),
  });

  // 3. Làm tươi lại trang chủ
  revalidatePath("/");
}