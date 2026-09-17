import { getIndexNowKey } from "@/lib/indexnow";

// Trả về file key để IndexNow xác minh quyền sở hữu host: GET /indexnow/<key>.txt
export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const expected = getIndexNowKey();
  if (!expected || key !== `${expected}.txt`) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(expected, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" },
  });
}
