export type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

const ALLOWED_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/xml",
  "text/xml",
]);

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

export const validateFile = (file?: UploadedFile): UploadedFile => {
  if (!file) {
    throw new Error("file_required");
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new Error("file_type_not_allowed");
  }

  if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("file_size_invalid");
  }

  return file;
};

export const extractFileContent = (file: UploadedFile): string => {
  return file.buffer.toString("utf-8");
};
