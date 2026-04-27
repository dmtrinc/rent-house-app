import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const conn = await connectDB();
    const db = conn.connection.db;

    const result = await db.collection("listings").insertOne({
      title: body.title,
      price: Number(body.price),
      address: body.address,
      imageUrl: body.imageUrl,
      description: body.description,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}