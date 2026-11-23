import { bankName, billLines, billTotal, money, monthLabel, type BillInput, type BillingSettings } from "../../lib/billing";

export type BillSheetData = BillInput & {
  month: string;
  roomCode: string;
  readingDate?: string | Date | null;
};

/* Phiếu thu tiền nhà — bố cục giống phiếu Excel cũ. In được (mỗi phiếu 1 trang). */
export default function BillSheet({
  bill,
  settings,
  qrSvg,
}: {
  bill: BillSheetData;
  settings: BillingSettings;
  qrSvg: string | null;
}) {
  const lines = billLines(bill);
  const total = billTotal(bill);
  const d = bill.readingDate ? new Date(bill.readingDate) : null;
  const vn = d ? new Date(d.getTime() + 7 * 3600_000) : null;
  const bank = bankName(settings.bankBin);
  const cell: React.CSSProperties = { border: "1px solid #555", padding: "3px 8px" };
  const num: React.CSSProperties = { ...cell, textAlign: "right", whiteSpace: "nowrap" };

  return (
    <div className="bill-sheet">
      <div className="bill-title" style={{ textAlign: "center", fontWeight: 700, fontSize: 22 }}>
        PHIẾU THU TIỀN NHÀ - THÁNG {monthLabel(bill.month)}
      </div>
      {settings.address && (
        <div style={{ textAlign: "center", fontWeight: 700, fontStyle: "italic", fontSize: 18, marginTop: 4 }}>
          ĐỊA CHỈ CĂN HỘ: {settings.address}
        </div>
      )}
      <div style={{ fontWeight: 700, fontStyle: "italic", fontSize: 19, margin: "6px 0 18px 48px" }}>
        PHÒNG SỐ: <span style={{ color: "#e00000", marginLeft: 16 }}>{bill.roomCode}</span>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 16 }}>
        <thead>
          <tr>
            <th style={{ ...cell, fontWeight: 400, width: 48 }}>STT</th>
            <th style={{ ...cell, fontWeight: 400 }}>Dịch Vụ</th>
            <th style={{ ...cell, fontWeight: 400 }}>Đơn Giá</th>
            <th style={{ ...cell, fontWeight: 400, width: 50 }}>SL</th>
            <th style={{ ...cell, fontWeight: 400 }}>Thành Tiền</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i}>
              <td style={{ ...cell, textAlign: "center" }}>{i + 1}</td>
              <td style={cell}>{l.label}</td>
              <td style={num}>{l.price === null ? "" : `${money(l.price)} đ`}</td>
              <td style={{ ...cell, textAlign: "center" }}>{l.qty === null ? "" : l.qty}</td>
              <td style={num}>{money(l.amount)} đ</td>
            </tr>
          ))}
          <tr>
            <td colSpan={4} style={{ ...cell, textAlign: "center", fontWeight: 700, fontSize: 18 }}>TỔNG CỘNG</td>
            <td style={{ ...num, fontWeight: 700, fontSize: 18 }}>{money(total)} đ</td>
          </tr>
        </tbody>
      </table>

      <table className="bill-meter" style={{ borderCollapse: "collapse", fontSize: 16, margin: "22px 0 18px 64px" }}>
        <tbody>
          <tr>
            <td style={{ ...cell, minWidth: 190 }}>Số điện tháng trước:</td>
            <td style={{ ...num, color: "#e00000", minWidth: 110 }}>{bill.oldMeter}</td>
          </tr>
          <tr>
            <td style={cell}>Số điện tháng này:</td>
            <td style={{ ...num, color: "#e00000" }}>{bill.newMeter}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ fontSize: 17, lineHeight: 1.6 }}>
        <div>•&nbsp; Quý khách vui lòng thanh toán trước ngày {String(settings.dueDay).padStart(2, "0")} hàng tháng</div>
        {settings.bankAccount && (
          <>
            <div>•&nbsp; Chuyển khoản đến tài khoản ngân hàng sau:</div>
            <div style={{ fontSize: 16 }}>
              Số TK: {settings.bankAccount} - Tên: {settings.accountName}
              {bank && ` - NH: ${bank}`}
            </div>
          </>
        )}
        {settings.transferNote && <div style={{ fontSize: 13 }}>{settings.transferNote}</div>}
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 24, marginTop: 6 }}>
        {qrSvg && (
          <div style={{ width: 150, textAlign: "center", flexShrink: 0 }}>
            {bank && <div style={{ color: "#006b3c", fontWeight: 700, fontSize: 13 }}>{bank}</div>}
            <div style={{ width: 150, height: 150, background: "#fff" }} dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <div style={{ fontSize: 9 }}>
              {settings.accountName} {settings.bankAccount}
            </div>
          </div>
        )}
        <div style={{ fontStyle: "italic", fontSize: 17, paddingTop: 12 }}>
          {settings.city}, Ngày {vn ? String(vn.getUTCDate()).padStart(2, "0") : "....."} tháng{" "}
          {vn ? String(vn.getUTCMonth() + 1).padStart(2, "0") : "....."} năm {vn ? vn.getUTCFullYear() : "....."}
        </div>
      </div>
    </div>
  );
}

/** CSS dùng chung cho trang in & trang khách xem. */
export const billSheetCss = `
.bill-sheet{background:#fbe5d6;color:#000;max-width:700px;margin:0 auto 24px;padding:20px 24px 24px;
  box-sizing:border-box;font-family:Calibri,"Segoe UI",Arial,sans-serif;border:1px solid #ccc}
.bill-sheet svg{width:100%;height:100%;display:block}
@media (max-width:600px){.bill-sheet{padding:14px 10px;font-size:14px}.bill-sheet table{font-size:14px!important}
  .bill-sheet .bill-meter{margin-left:0!important}.bill-sheet .bill-title{font-size:18px!important}}
@media print{
  @page{size:A4 portrait;margin:8mm}
  body{background:#fff!important}
  .no-print{display:none!important}
  .bill-sheet{margin:0;border:none;break-after:page;page-break-after:always;max-width:none;
    -webkit-print-color-adjust:exact;print-color-adjust:exact}
  .bill-sheet:last-child{break-after:auto;page-break-after:auto}
}`;
