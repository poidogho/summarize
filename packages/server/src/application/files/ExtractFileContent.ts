import type { Logger } from '../../infrastructure/logging/logger.js';
import {
  extractFileContent,
  validateFile,
  type UploadedFile,
} from '../../domain/files/FileRules.js';
import { summarizeContent } from './SummarizeContent.js';

export type ExtractedContent = {
  filename: string;
  mimetype: string;
  size: number;
  content: string;
  summary: string;
};

export const extractUploadedFile = async (
  file: UploadedFile | undefined,
  logger: Logger
): Promise<ExtractedContent> => {
  try {
    const validFile = validateFile(file);
    logger.info('file_extract_start', {
      filename: validFile.originalname,
      mimetype: validFile.mimetype,
    });

    const content = await extractFileContent(validFile);
    logger.info('file_extract_complete', {
      filename: validFile.originalname,
      bytes: validFile.size,
    });

    // Summarize the extracted content
    const summary = await summarizeContent(content, logger);

    return {
      filename: validFile.originalname,
      mimetype: validFile.mimetype,
      size: validFile.size,
      content,
      summary,
    };
  } catch (error) {
    logger.error('file_extract_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
