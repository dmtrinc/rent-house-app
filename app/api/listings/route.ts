import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";

export async function GET() {
  try {
    const conn = await connectDB();
    const db = conn.connection.db;
    const listings = await db?.collection("listings").find().sort({ createdAt: -1 }).toArray();
    return NextResponse.json(listings);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const conn = await connectDB();
    const db = conn.connection.db;

    const result = await db?.collection("listings").insertOne({
      title: body.title,
      price: Number(body.price),
      address: body.address,
      description: body.description,
      images: body.images || [],
      coverImage: body.images?.[0] || "", 
      deviceId: body.deviceId, // Lưu định danh máy tính
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: result?.insertedId });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}