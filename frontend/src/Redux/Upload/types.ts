export interface UploadState {
  data: UploadResponse | null;
  loading: boolean;
  error: string | null;
}

export interface UploadResponse {
  uploadUrl: string;
  //   inputFilePath: string;
  //   fileId: string;
}

export interface UploadPayload {
  sessionId: string;
  //   inputFilePath: string;
  //   file: File;
}
