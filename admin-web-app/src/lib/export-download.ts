/**
 * Client-side export helpers for admin list tabs.
 * CSV downloads as a file; PDF opens a printable HTML table (browser Print → Save as PDF).
 */

export type ExportColumn = { key: string; label: string };

function escapeCsvCell(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function downloadCsv(
  filenameBase: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
): void {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escapeCsvCell(row[c.key])).join(","))
    .join("\n");
  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenameBase}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function openPrintablePdf(
  title: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
): void {
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) {
    window.alert("Allow pop-ups to export as PDF.");
    return;
  }
  win.document.title = title;
  const style = win.document.createElement("style");
  style.textContent = `
    body { font-family: system-ui, sans-serif; margin: 24px; color: #1c1b1b; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    p.meta { font-size: 12px; color: #6e7a6c; margin: 0 0 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #c6c6c0; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f4f4ef; font-weight: 600; }
    @media print { body { margin: 12px; } }
  `;
  win.document.head.appendChild(style);

  const h1 = win.document.createElement("h1");
  h1.textContent = title;
  win.document.body.appendChild(h1);

  const meta = win.document.createElement("p");
  meta.className = "meta";
  meta.textContent = `Exported ${new Date().toLocaleString()} · ${rows.length} row(s)`;
  win.document.body.appendChild(meta);

  const table = win.document.createElement("table");
  const thead = win.document.createElement("thead");
  const headRow = win.document.createElement("tr");
  for (const col of columns) {
    const th = win.document.createElement("th");
    th.textContent = col.label;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = win.document.createElement("tbody");
  if (rows.length === 0) {
    const empty = win.document.createElement("tr");
    const td = win.document.createElement("td");
    td.colSpan = columns.length;
    td.textContent = "No rows";
    empty.appendChild(td);
    tbody.appendChild(empty);
  } else {
    for (const row of rows) {
      const tr = win.document.createElement("tr");
      for (const col of columns) {
        const td = win.document.createElement("td");
        td.textContent = String(row[col.key] ?? "");
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  }
  table.appendChild(tbody);
  win.document.body.appendChild(table);

  win.focus();
  win.print();
}
