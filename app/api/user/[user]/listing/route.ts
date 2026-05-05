// app/api/user/[username]/listings/route.ts

import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import User from "@/models/user";
import Listing from "@/models/listing";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ user: string }> }
) {
  try {
    const { user: username } = await params;

    await connectMongoDB();

    const user = await User.findOne({ username })
      .select("_id username phone role headerText footerText")
      .lean();

    if (!user)
      return NextResponse.json({ error: "Không tìm thấy user" }, { status: 404 });

    const listings = await Listing.find({ userId: (user as any)._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ user, listings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}