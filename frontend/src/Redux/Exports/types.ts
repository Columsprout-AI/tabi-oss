export interface RecordExportResponse {
  success: boolean;
  message: string;
  downloadUrl?: string;
}
export interface RecordExportState {
  data: RecordExportResponse | null;
  loading: boolean;
  error: string | null;
}
