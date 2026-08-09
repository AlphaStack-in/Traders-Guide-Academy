import * as XLSX from "xlsx";

export interface MemberExportRow {
  "Registered Date": string;
  Name: string;
  Phone: string;
  Email: string;
  Plan: string;
  Batch: string;
  "Current Broker"?: string;
  "Referral Status": string;
}

export function exportMembersToExcel(rows: MemberExportRow[], filename = "Registered_Members.xlsx") {
  if (rows.length === 0) return;
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Members");

  const headers = Object.keys(rows[0]) as (keyof MemberExportRow)[];
  const cols = headers.map((header) => {
    let maxLen = header.length;
    for (const row of rows) {
      const val = String(row[header] ?? "");
      if (val.length > maxLen) maxLen = val.length;
    }
    return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
  });
  worksheet["!cols"] = cols;

  XLSX.writeFile(workbook, filename);
}
