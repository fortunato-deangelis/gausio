import "server-only";
import ExcelJS from "exceljs";

/** Colonna di un export tabellare. */
export type ExportColumn<T> = Readonly<{
  header: string;
  value: (row: T) => string | number | null | undefined;
  width?: number;
}>;

/** Genera un workbook XLSX con intestazione formattata. */
export async function buildXlsx<T>(
  sheetName: string,
  columns: readonly ExportColumn<T>[],
  rows: readonly T[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Gausio";
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = columns.map((c) => ({
    header: c.header,
    width: c.width ?? 22,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF7367F0" },
  };

  for (const row of rows) {
    sheet.addRow(columns.map((c) => c.value(row) ?? ""));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
