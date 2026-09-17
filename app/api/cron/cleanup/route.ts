import { NextResponse, after } from "next/server";
import { notifyIndexNow } from "@/lib/indexnow";
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

    const filter = { status: "hide", hiddenAt: { $lte: thirtyDaysAgo } };
    const col = conn.connection.db?.collection("listings");

    // Lấy id trước khi xóa để báo IndexNow gỡ các URL này
    const toDelete = (await col?.find(filter, { projection: { _id: 1 } }).toArray()) ?? [];
    const result = await col?.deleteMany(filter);

    if (toDelete.length > 0) {
      after(() => notifyIndexNow(toDelete.map((d: { _id: unknown }) => `/listing/${d._id}`)));
    }

    return NextResponse.json({
      message: "Cleanup successful",
      deletedCount: result?.deletedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}