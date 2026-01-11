import type { Router } from 'express';
import multer from 'multer';
import type { Logger } from '../logging/logger.js';
import { analyzeResume } from '../../application/resume/AnalyzeResume.js';
import { optimizeResume } from '../../application/resume/OptimizeResume.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit for resumes
});

const mapErrorToStatus = (message: string): number => {
  if (message.startsWith('file_') || message.startsWith('url_')) return 400;
  if (message.endsWith('_required')) return 400;
  if (message === 'LIMIT_FILE_SIZE') return 413;
  if (message === 'fetch_failed') return 502;
  return 500;
};

export const registerResumeRoute = (router: Router, logger: Logger): void => {
  router.post('/resume/analyze', upload.single('resume'), async (req, res) => {
    console.log('Received request body:', req.body);
    try {
      const jobPostingUrl =
        typeof req.body?.jobPostingUrl === 'string'
          ? req.body.jobPostingUrl
          : '';

      if (!jobPostingUrl.trim()) {
        res.status(400).json({ error: 'jobPostingUrl_required' });
        return;
      }

      const result = await analyzeResume(jobPostingUrl, req.file, logger);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown_error';
      logger.warn('resume_analysis_request_failed', { message });
      res.status(mapErrorToStatus(message)).json({ error: message });
    }
  });

  router.post('/resume/optimize', async (req, res) => {
    try {
      const jobContent =
        typeof req.body?.jobContent === 'string' ? req.body.jobContent : '';
      const resumeContent =
        typeof req.body?.resumeContent === 'string'
          ? req.body.resumeContent
          : '';

      const result = await optimizeResume(jobContent, resumeContent, logger);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown_error';
      logger.warn('resume_optimization_request_failed', { message });
      res.status(mapErrorToStatus(message)).json({ error: message });
    }
  });
};
