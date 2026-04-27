import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conn = await connectDB();
  const item = await conn.connection.db?.collection("listings").findOne({ _id: new ObjectId(id) });
  return NextResponse.json(item);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const conn = await connectDB();
  await conn.connection.db?.collection("listings").updateOne(
    { _id: new ObjectId(id) },
    { $set: { 
        title: data.title, 
        price: data.price, 
        address: data.address, 
        description: data.description, 
        images: data.images, // Mảng nhiều ảnh
        coverImage: data.coverImage, // Ảnh đại diện
        updatedAt: new Date() 
    } }
  );
  return NextResponse.json({ message: "Updated" });
}