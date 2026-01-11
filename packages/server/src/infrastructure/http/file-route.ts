import type { Router } from "express";
import multer from "multer";
import type { Logger } from "../logging/logger.js";
import { extractUploadedFile } from "../../application/files/ExtractFileContent.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

const mapErrorToStatus = (message: string): number => {
  if (message.startsWith("file_")) return 400;
  if (message === "LIMIT_FILE_SIZE") return 413;
  return 500;
};

export const registerFileRoute = (router: Router, logger: Logger): void => {
  router.post("/files/extract", upload.single("file"), async (req, res) => {
    try {
      const tone =
        req.body?.tone === 'casual' || req.body?.tone === 'professional'
          ? req.body.tone
          : 'professional';

      const result = await extractUploadedFile(req.file, logger, tone);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown_error";
      logger.warn("file_extract_request_failed", { message });
      res.status(mapErrorToStatus(message)).json({ error: message });
    }
  });
};
