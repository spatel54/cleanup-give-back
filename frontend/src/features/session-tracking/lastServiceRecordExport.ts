export type ServiceRecordExportFormat = 'pdf' | 'csv';

export type LastServiceRecordExport = {
  uri: string;
  filename: string;
  format: ServiceRecordExportFormat;
};

let lastExport: LastServiceRecordExport | null = null;

export function setLastServiceRecordExport(next: LastServiceRecordExport): void {
  lastExport = next;
}

export function getLastServiceRecordExport(): LastServiceRecordExport | null {
  return lastExport;
}
