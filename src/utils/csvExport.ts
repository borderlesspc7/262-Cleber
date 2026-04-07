/** Célula CSV com escape para Excel (pt-BR usa `;`) */
export function escapeCsvCell(value: string | number | undefined | null): string {
  const s = value == null ? "" : String(value);
  if (/[;\n\r"]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function downloadCsv(filename: string, rows: (string | number)[][]): void {
  const BOM = "\uFEFF";
  const csv = rows
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(";"))
    .join("\r\n");
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
