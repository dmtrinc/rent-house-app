import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";

export async function GET(req: Request) {
  // Kiểm tra secret key
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const conn = await connectDB();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await conn.connection.db?.collection("listings").deleteMany({
      status: "hide",
      hiddenAt: { $lte: thirtyDaysAgo },
    });

    return NextResponse.json({
      message: "Cleanup successful",
      deletedCount: result?.deletedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}