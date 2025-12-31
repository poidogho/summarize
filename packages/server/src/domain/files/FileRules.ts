export type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

const ALLOWED_MIME_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'application/xml',
  'text/xml',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]);

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

export const validateFile = (file?: UploadedFile): UploadedFile => {
  if (!file) {
    throw new Error('file_required');
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new Error('file_type_not_allowed');
  }

  if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('file_size_invalid');
  }

  return file;
};

// Type definitions for dynamic imports
type PdfParseModule = {
  PDFParse: new (options: { data: Buffer }) => {
    getText: () => Promise<{ text: string }>;
    destroy: () => Promise<void>;
  };
};

type WordExtractorModule = {
  default: new () => {
    extract: (buffer: Buffer) => Promise<{
      getBody: () => string;
    }>;
  };
};

type MammothModule = {
  extractRawText: (options: { buffer: Buffer }) => Promise<{
    value: string;
  }>;
};

export const extractFileContent = async (
  file: UploadedFile
): Promise<string> => {
  if (file.mimetype === 'application/pdf') {
    try {
      // pdf-parse v2.4.5 uses a class-based API
      const pdfModule = (await import(
        'pdf-parse'
      )) as unknown as PdfParseModule;
      const parser = new pdfModule.PDFParse({ data: file.buffer });
      try {
        const result = await parser.getText();
        return result.text.trim();
      } finally {
        await parser.destroy();
      }
    } catch (error) {
      throw new Error(
        `Failed to parse PDF: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  if (
    file.mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.mimetype === 'application/msword'
  ) {
    if (file.mimetype === 'application/msword') {
      try {
        const wordExtractorModule = (await import(
          'word-extractor'
        )) as WordExtractorModule;
        const WordExtractor = wordExtractorModule.default;
        const extractor = new WordExtractor();
        const extracted = await extractor.extract(file.buffer);
        return extracted.getBody().trim();
      } catch (error) {
        throw new Error(
          `Failed to parse Word document: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }

    try {
      const mammoth = (await import('mammoth')) as MammothModule;
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value.trim();
    } catch (error) {
      throw new Error(
        `Failed to parse Word document: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  return file.buffer.toString('utf-8');
};
