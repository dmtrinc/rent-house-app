import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import connectDB from "../../../../lib/mongodb";
import Bill from "../../../../models/bill";
import Room from "../../../../models/room";
import { billQrSvg, getBuildingSettings, isAdmin } from "../../../../lib/billing-server";
import { isMonthKey, monthLabel, qrNote } from "../../../../lib/billing";
import BillSheet, { billSheetCss } from "../../../components/BillSheet";
import PrintButton from "../../../components/PrintButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "In phiếu thu tiền nhà" };

/* /admin/hoa-don/in?month=2026-12&b=NTL            → in tất cả phiếu của 1 nhà trong tháng
 * /admin/hoa-don/in?month=2026-12&b=NTL&room=101   → in 1 phòng */
export default async function PrintBillsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; b?: string; room?: string }>;
}) {
  if (!(await isAdmin())) redirect("/login");
  const { month, b, room } = await searchParams;
  if (!isMonthKey(month) || !b) redirect("/admin/hoa-don");

  await connectDB();
  const [settings, bills, rooms] = await Promise.all([
    getBuildingSettings(b),
    Bill.find(room ? { month, building: b, roomCode: room } : { month, building: b }).lean(),
    Room.find({ building: b }, { code: 1, order: 1 }).lean(),
  ]);
  const order = new Map(rooms.map((r: any) => [String(r._id), r.order ?? 0]));
  bills.sort((x: any, y: any) => (order.get(x.roomId) ?? 0) - (order.get(y.roomId) ?? 0));

  const sheets = await Promise.all(
    bills.map(async (bill: any) => ({
      bill,
      qr: await billQrSvg(settings, bill.total, qrNote(b, bill.roomCode, bill.month)),
    }))
  );

  return (
    <main style={{ background: "#eee", minHeight: "100vh", padding: "16px 8px" }}>
      <style>{billSheetCss}</style>
      <div className="no-print" style={{ maxWidth: 700, margin: "0 auto 16px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <Link href={`/admin/hoa-don?month=${month}&b=${encodeURIComponent(b)}&tab=pay`} style={{ color: "#333" }}>← Quay lại</Link>
        <b style={{ flex: 1 }}>
          {settings.name || b}: {sheets.length} phiếu thu tháng {monthLabel(month)}
        </b>
        {sheets.length > 0 && <PrintButton />}
      </div>
      {sheets.length === 0 && <p style={{ textAlign: "center" }}>Chưa có hóa đơn nào.</p>}
      {sheets.map(({ bill, qr }) => (
        <BillSheet key={String(bill._id)} bill={bill} settings={settings} qrSvg={qr} />
      ))}
    </main>
  );
}
