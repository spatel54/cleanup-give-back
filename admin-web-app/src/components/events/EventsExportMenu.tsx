"use client";

import { ExportMenu } from "@/components/ui/ExportMenu";
import { downloadCsv, openPrintablePdf, type ExportColumn } from "@/lib/export-download";

/**
 * Client-only export controls for the Events list (server `EventsPage` host).
 */
export function EventsExportMenu({
  columns,
  rows,
}: {
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
}) {
  return (
    <ExportMenu
      onExportCsv={() => downloadCsv("events-export", columns, rows)}
      onExportPdf={() => openPrintablePdf("Events export", columns, rows)}
    />
  );
}
