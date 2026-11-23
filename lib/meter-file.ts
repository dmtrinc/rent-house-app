/* Nhập số điện (và số nước) nhiều phòng từ file Excel (.xlsx) hoặc .csv — chạy trên trình duyệt.
 * Nhận diện cột theo tiêu đề nên đọc được cả file mẫu lẫn file doanh thu cũ (sheet DOANH THU). */
import { parseNumber } from "./billing";

export type MeterFileRow = {
  code: string;
  newMeter: number | null;
  waterNew: number | null;
  otherAmount: number | null;
  otherNote: string | null;
};

type Cell = unknown;

function norm(v: Cell): string {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isEmpty(v: Cell): boolean {
  return v === null || v === undefined || String(v).trim() === "";
}

function cellCode(v: Cell): string {
  if (typeof v === "number") return String(Math.round(v));
  return String(v ?? "").trim();
}

/** Tìm cột theo tiêu đề trong 15 dòng đầu. null nếu không thấy cột Phòng + Điện mới. */
export function parseMeterSheet(data: Cell[][]): MeterFileRow[] | null {
  let room = -1, meter = -1, water = -1, other = -1, note = -1, headerEnd = -1;
  for (let r = 0; r < Math.min(15, data.length); r++) {
    (data[r] ?? []).forEach((v, c) => {
      const t = norm(v);
      if (!t) return;
      let hit = true;
      if (room < 0 && ["phong", "so phong", "phong so", "ma phong"].includes(t)) room = c;
      else if (water < 0 && /\bmoi\b/.test(t) && t.includes("nuoc") && !t.includes("tien")) water = c;
      else if (meter < 0 && /\bmoi\b/.test(t) && !t.includes("tien") && !t.includes("nuoc")) meter = c;
      else if (note < 0 && t.includes("noi dung")) note = c;
      else if (other < 0 && /^khac\b/.test(t)) other = c;
      else hit = false;
      if (hit) headerEnd = Math.max(headerEnd, r);
    });
  }
  if (room < 0 || meter < 0) return null;

  const out: MeterFileRow[] = [];
  for (let r = headerEnd + 1; r < data.length; r++) {
    const row = data[r] ?? [];
    const code = cellCode(row[room]);
    if (!code) continue;
    out.push({
      code,
      newMeter: isEmpty(row[meter]) ? null : parseNumber(row[meter]),
      waterNew: water >= 0 && !isEmpty(row[water]) ? parseNumber(row[water]) : null,
      otherAmount: other >= 0 && !isEmpty(row[other]) ? parseNumber(row[other]) : null,
      otherNote: note >= 0 && !isEmpty(row[note]) ? String(row[note]).trim() : null,
    });
  }
  return out;
}

function parseCsv(text: string): string[][] {
  const first = text.split("\n")[0];
  const sep = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === sep) { row.push(cur); cur = ""; }
    else if (ch === "\n") { row.push(cur.replace(/\r$/, "")); rows.push(row); row = []; cur = ""; }
    else cur += ch;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

export async function readMeterFile(file: File): Promise<MeterFileRow[]> {
  if (/\.csv$/i.test(file.name)) {
    const rows = parseMeterSheet(parseCsv((await file.text()).replace(/^﻿/, "")));
    if (!rows) throw new Error("Không tìm thấy cột “Phòng” và “Điện mới” trong file.");
    return rows;
  }
  if (!/\.xlsx$/i.test(file.name)) throw new Error("Chỉ nhận file .xlsx hoặc .csv (file .xls cũ hãy Lưu thành .xlsx).");
  const { default: readXlsxFile } = await import("read-excel-file/browser");
  const sheets = await readXlsxFile(file);
  // Ưu tiên sheet DOANH THU nếu là file doanh thu, sau đó các sheet khác
  sheets.sort((a, b) => Number(norm(b.sheet) === "doanh thu") - Number(norm(a.sheet) === "doanh thu"));
  for (const s of sheets) {
    const rows = parseMeterSheet(s.data as Cell[][]);
    if (rows && rows.length) return rows;
  }
  throw new Error("Không tìm thấy cột “Phòng” và “Điện mới” trong file. Hãy dùng file mẫu.");
}

export type TemplateRoom = {
  code: string;
  tenantName: string;
  oldMeter: number;
  newMeter: number | null;
  waterMeter: boolean;
  waterOld: number;
  waterNew: number | null;
};

/** Dữ liệu file mẫu (dùng chung cho trình duyệt và script tạo file sẵn). */
export function meterTemplateData(title: string, rooms: TemplateRoom[]) {
  const withWater = rooms.some((r) => r.waterMeter);
  const head = { fontWeight: "bold" as const, backgroundColor: "#FBE5D6", borderStyle: "thin" as const, align: "center" as const };
  const border = { borderStyle: "thin" as const };
  const input = { ...border, backgroundColor: "#FFF2CC" };
  const grey = { ...border, textColor: "#808080" };
  const headers = ["Phòng", "Khách", "Điện cũ", "Điện mới", ...(withWater ? ["Nước cũ", "Nước mới"] : []), "Khác (đ)", "Nội dung khác"];
  const num = (v: number | null, style: object) => (v === null ? { value: undefined, ...style } : { value: v, type: Number, ...style });
  const data = [
    [{ value: title, fontWeight: "bold" as const, columnSpan: headers.length }, ...headers.slice(1).map(() => null)],
    headers.map((value) => ({ value, ...head })),
    ...rooms.map((r) => [
      { value: r.code, ...border, fontWeight: "bold" as const },
      { value: r.tenantName || undefined, ...border },
      num(r.oldMeter, grey),
      num(r.newMeter, input),
      ...(withWater
        ? r.waterMeter
          ? [num(r.waterOld, grey), num(r.waterNew, { ...input, backgroundColor: "#DDEBF7" })]
          : [{ value: undefined, ...border }, { value: undefined, ...border }]
        : []),
      { value: undefined, ...border },
      { value: undefined, ...border },
    ]),
  ];
  const columns = [10, 22, 11, 13, ...(withWater ? [11, 13] : []), 13, 26].map((width) => ({ width }));
  return { data, columns };
}

/** Tải file mẫu: danh sách phòng + số cũ của tháng đang chọn, để trống cột số mới. */
export async function downloadMeterTemplate(fileName: string, title: string, rooms: TemplateRoom[]) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const { data, columns } = meterTemplateData(title, rooms);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await writeXlsxFile(data as any, { sheet: "So dien", columns, stickyRowsCount: 2 }).toFile(fileName);
}
