declare module 'pdf-parse' {
  export class PDFParse {
    constructor(options: {
      data: Buffer | Uint8Array | ArrayBuffer | string | number[];
    });
    getText(): Promise<{
      text: string;
      pages: Array<{ num: number; text: string }>;
      total: number;
    }>;
    destroy(): Promise<void>;
  }
}
