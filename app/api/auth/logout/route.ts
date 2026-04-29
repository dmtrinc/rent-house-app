import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });
  
  // Xóa cả 2 cookie đã set khi login
  res.cookies.set("user_role", "", { maxAge: 0, path: "/" });
  res.cookies.set("user_id", "", { maxAge: 0, path: "/" });
  
  return res;
}