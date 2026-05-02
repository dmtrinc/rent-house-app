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
    if (!listing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
    return NextResponse.json(listing);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function checkOwnership(listing: any, body: any): Promise<{ allowed: boolean; isMod: boolean }> {
  const cookieStore = await cookies();
  const userRole = cookieStore.get("user_role")?.value;
  const userId   = cookieStore.get("user_id")?.value;
  const { deviceId, _adminOverride, _modOverride } = body;

  // Admin
  if (userRole === "admin") return { allowed: true, isMod: false };
  if (_adminOverride && userRole === "admin") return { allowed: true, isMod: false };

  // Mod — chỉ cho sửa/ẩn/hiện, KHÔNG cho xóa (xử lý ở DELETE)
  if (userRole === "mod") return { allowed: true, isMod: true };
  if (_modOverride && userRole === "mod") return { allowed: true, isMod: true };

  // Chủ tin (theo userId hoặc deviceId)
  if (userId && listing.userId && String(listing.userId) === String(userId))
    return { allowed: true, isMod: false };
  if (deviceId && listing.deviceId && listing.deviceId === deviceId)
    return { allowed: true, isMod: false };

  return { allowed: false, isMod: false };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const conn = await connectDB();
    const db = conn.connection.db;

    const listing = await db?.collection("listings").findOne({ _id: new ObjectId(id) });
    if (!listing) return NextResponse.json({ error: "Không tìm thấy tin" }, { status: 404 });

    const { allowed } = await checkOwnership(listing, body);
    if (!allowed) {
      return NextResponse.json({ error: "Không có quyền chỉnh sửa tin này" }, { status: 403 });
    }

    // Loại bỏ các field kiểm soát, không lưu vào DB
    const { action, deviceId, userId, _adminOverride, _modOverride, ...updateData } = body;

    const updateQuery = action
      ? { $set: { status: action, updatedAt: new Date() } }
      : { $set: { ...updateData, updatedAt: new Date() } };

    await db?.collection("listings").updateOne({ _id: new ObjectId(id) }, updateQuery);

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
    if (!listing) return NextResponse.json({ error: "Không tìm thấy tin" }, { status: 404 });

    const { allowed, isMod } = await checkOwnership(listing, body);
    if (!allowed) {
      return NextResponse.json({ error: "Không có quyền xóa tin này" }, { status: 403 });
    }

    // Mod không được xóa tin
    if (isMod) {
      return NextResponse.json({ error: "Mod không có quyền xóa tin đăng" }, { status: 403 });
    }

    await db?.collection("listings").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}