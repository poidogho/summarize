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
  keyAreas: string[];
};

type Tone = 'professional' | 'casual';

export const extractUploadedFile = async (
  file: UploadedFile | undefined,
  logger: Logger,
  tone: Tone = 'professional'
): Promise<ExtractedContent> => {
  try {
    const validFile = validateFile(file);
    logger.info('file_extract_start', {
      filename: validFile.originalname,
      mimetype: validFile.mimetype,
      tone,
    });

    const content = await extractFileContent(validFile);
    logger.info('file_extract_complete', {
      filename: validFile.originalname,
      bytes: validFile.size,
    });

    // Summarize the extracted content
    const { summary, keyAreas } = await summarizeContent(content, logger, tone);

    return {
      filename: validFile.originalname,
      mimetype: validFile.mimetype,
      size: validFile.size,
      content,
      summary,
      keyAreas,
    };
  } catch (error) {
    logger.error('file_extract_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
