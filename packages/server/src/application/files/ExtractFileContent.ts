import type { Logger } from "../../infrastructure/logging/logger.js";
import {
  extractFileContent,
  validateFile,
  type UploadedFile,
} from "../../domain/files/FileRules.js";

export type ExtractedContent = {
  filename: string;
  mimetype: string;
  size: number;
  content: string;
};

export const extractUploadedFile = (
  file: UploadedFile | undefined,
  logger: Logger
): ExtractedContent => {
  try {
    const validFile = validateFile(file);
    logger.info("file_extract_start", {
      filename: validFile.originalname,
      mimetype: validFile.mimetype,
    });

    const content = extractFileContent(validFile);
    logger.info("file_extract_complete", {
      filename: validFile.originalname,
      bytes: validFile.size,
    });

    return {
      filename: validFile.originalname,
      mimetype: validFile.mimetype,
      size: validFile.size,
      content,
    };
  } catch (error) {
    logger.error("file_extract_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
