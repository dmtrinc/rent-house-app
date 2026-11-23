import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import connectDB from "../../../../lib/mongodb";
import Bill from "../../../../models/bill";
import Room from "../../../../models/room";
import { billQrSvg, getBillingSettings, isAdmin } from "../../../../lib/billing-server";
import { isMonthKey, monthLabel } from "../../../../lib/billing";
import BillSheet, { billSheetCss } from "../../../components/BillSheet";
import PrintButton from "../../../components/PrintButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "In phiếu thu tiền nhà" };

/* /admin/hoa-don/in?month=2026-12            → in tất cả phiếu của tháng
 * /admin/hoa-don/in?month=2026-12&room=101   → in 1 phòng */
export default async function PrintBillsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; room?: string }>;
}) {
  if (!(await isAdmin())) redirect("/login");
  const { month, room } = await searchParams;
  if (!isMonthKey(month)) redirect("/admin/hoa-don");

  await connectDB();
  const [settings, bills, rooms] = await Promise.all([
    getBillingSettings(),
    Bill.find(room ? { month, roomCode: room } : { month }).lean(),
    Room.find({}, { code: 1, order: 1 }).lean(),
  ]);
  const order = new Map(rooms.map((r: any) => [String(r._id), r.order ?? 0]));
  bills.sort((a: any, b: any) => (order.get(a.roomId) ?? 0) - (order.get(b.roomId) ?? 0));

  const sheets = await Promise.all(
    bills.map(async (b: any) => ({
      bill: b,
      qr: await billQrSvg(settings, b.total, `Phong ${b.roomCode} T${monthLabel(b.month).replace("/", " ")}`),
    }))
  );

  return (
    <main style={{ background: "#eee", minHeight: "100vh", padding: "16px 8px" }}>
      <style>{billSheetCss}</style>
      <div className="no-print" style={{ maxWidth: 700, margin: "0 auto 16px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <Link href={`/admin/hoa-don?month=${month}`} style={{ color: "#333" }}>← Quay lại</Link>
        <b style={{ flex: 1 }}>
          {sheets.length} phiếu thu tháng {monthLabel(month)}
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
