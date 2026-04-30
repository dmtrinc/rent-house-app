import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const conn = await connectDB();
    const listing = await conn.connection.db?.collection("listings").findOne({
      _id: new ObjectId(id)
    });
    if (!listing) return NextResponse.json({ error: "Khong tim thay" }, { status: 404 });
    return NextResponse.json(listing);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function checkOwnership(listing: any, body: any): Promise<boolean> {
  const cookieStore = await cookies();
  const userRole = cookieStore.get("user_role")?.value;
  const userId = cookieStore.get("user_id")?.value;
  const { deviceId, _adminOverride } = body;

  // Admin override từ admin dashboard
  if (_adminOverride && userRole === "admin") return true;

  if (userRole === "admin") return true;
  if (userId && listing.userId && String(listing.userId) === String(userId)) return true;
  if (deviceId && listing.deviceId && listing.deviceId === deviceId) return true;
  return false;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const conn = await connectDB();
    const db = conn.connection.db;

    const listing = await db?.collection("listings").findOne({ _id: new ObjectId(id) });
    if (!listing) return NextResponse.json({ error: "Khong tim thay tin" }, { status: 404 });

    const hasPermission = await checkOwnership(listing, body);
    if (!hasPermission) {
      return NextResponse.json({ error: "Khong co quyen chinh sua tin nay" }, { status: 403 });
    }

    const { action, deviceId, userId, _adminOverride, ...updateData } = body;

    // Nếu chỉ toggle status (từ admin dashboard)
    const updateQuery = action
      ? { $set: { status: action, updatedAt: new Date() } }
      : { $set: { ...updateData, updatedAt: new Date() } };

    await db?.collection("listings").updateOne(
      { _id: new ObjectId(id) },
      updateQuery
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const conn = await connectDB();
    const db = conn.connection.db;

    const listing = await db?.collection("listings").findOne({ _id: new ObjectId(id) });
    if (!listing) return NextResponse.json({ error: "Khong tim thay tin" }, { status: 404 });

    const hasPermission = await checkOwnership(listing, body);
    if (!hasPermission) {
      return NextResponse.json({ error: "Khong co quyen xoa tin nay" }, { status: 403 });
    }

    await db?.collection("listings").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}