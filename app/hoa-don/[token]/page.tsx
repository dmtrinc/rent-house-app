import type { Metadata } from "next";
import { notFound } from "next/navigation";
import connectDB from "../../../lib/mongodb";
import Bill from "../../../models/bill";
import { billQrSvg, getBuildingSettings } from "../../../lib/billing-server";
import { money, qrNote } from "../../../lib/billing";
import BillSheet, { billSheetCss } from "../../components/BillSheet";
import PrintButton from "../../components/PrintButton";

/* Link phiếu thu gửi cho khách thuê (qua Zalo...). Token ngẫu nhiên, không index. */
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Phiếu thu tiền nhà",
  robots: { index: false, follow: false },
};

export default async function TenantBillPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[\w-]{10,40}$/.test(token)) notFound();
  await connectDB();
  const bill: any = await Bill.findOne({ token }).lean();
  if (!bill) notFound();

  const settings = await getBuildingSettings(bill.building);
  const qr = await billQrSvg(settings, bill.total, qrNote(bill.building, bill.roomCode, bill.month));
  const paid = bill.paidAmount >= bill.total && bill.total > 0;

  return (
    <main style={{ background: "#eee", minHeight: "100vh", padding: "16px 8px" }}>
      <style>{billSheetCss}</style>
      <div className="no-print" style={{ maxWidth: 700, margin: "0 auto 12px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ flex: 1, fontWeight: 600, color: paid ? "#16a34a" : "#b45309" }}>
          {paid
            ? "✅ Đã thanh toán"
            : bill.paidAmount > 0
              ? `Đã thu ${money(bill.paidAmount)} đ — còn ${money(bill.total - bill.paidAmount)} đ`
              : "Chưa thanh toán — quét mã QR bên dưới để chuyển khoản"}
        </span>
        <PrintButton label="🖨️ Lưu / In" />
      </div>
      <BillSheet bill={bill} settings={settings} qrSvg={qr} />
    </main>
  );
}
