import type { Logger } from '../../infrastructure/logging/logger.js';
import { getOpenAIClient } from '../../infrastructure/ai/openai-client.js';
import { scrapeUrl } from '../scrape/ScrapeUrl.js';
import {
  extractFileContent,
  validateFile,
  MAX_RESUME_FILE_SIZE_BYTES,
  type UploadedFile,
} from '../../domain/files/FileRules.js';

export type ResumeAnalysisResult = {
  rating: number;
  feedback: string;
  matchPercentage: number;
  strengths: string[];
  weaknesses: string[];
  keyRequirements: string[];
  missingRequirements: string[];
  jobContent: string;
  resumeContent: string;
};

/**
 * Analyzes a resume against a job posting
 * @param jobPostingUrl - URL of the job posting
 * @param resumeFile - The uploaded resume file
 * @param logger - Logger instance for logging
 * @returns Analysis results including rating, feedback, and requirements
 */
export const analyzeResume = async (
  jobPostingUrl: string,
  resumeFile: UploadedFile | undefined,
  logger: Logger
): Promise<ResumeAnalysisResult> => {
  try {
    // Validate file with resume-specific size limit
    const validFile = validateFile(resumeFile, MAX_RESUME_FILE_SIZE_BYTES);
    logger.info('resume_analysis_start', {
      jobPostingUrl,
      filename: validFile.originalname,
    });

    // Scrape the job posting
    const jobPosting = await scrapeUrl(jobPostingUrl, logger);
    const jobContent =
      jobPosting.content || jobPosting.description || jobPosting.title || '';

    // Extract resume content
    const resumeContent = await extractFileContent(validFile);

    // Use OpenAI to analyze
    const client = getOpenAIClient();

    logger.info('resume_analysis_ai_start', {
      jobContentLength: jobContent.length,
      resumeContentLength: resumeContent.length,
    });

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert resume analyzer. Your task is to:
1. Extract key requirements from the job posting
2. Compare the resume against these requirements
3. Rate the resume (0-10 scale)
4. Calculate a match percentage
5. List strengths and weaknesses
6. Identify what's missing from the resume

Return your response as a JSON object with the following structure:
{
  "rating": <number 0-10>,
  "feedback": "<detailed feedback string>",
  "matchPercentage": <number 0-100>,
  "strengths": ["<strength1>", "<strength2>", ...],
  "weaknesses": ["<weakness1>", "<weakness2>", ...],
  "keyRequirements": ["<requirement1>", "<requirement2>", ...],
  "missingRequirements": ["<missing1>", "<missing2>", ...]
}

Be specific, constructive, and focus on actionable insights.`,
        },
        {
          role: 'user',
          content: `Job Posting:\n\n${jobContent}\n\n---\n\nResume:\n\n${resumeContent}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const analysisText = response.choices[0]?.message?.content;
    if (!analysisText) {
      throw new Error('No analysis generated from OpenAI');
    }

    const analysis = JSON.parse(analysisText) as ResumeAnalysisResult;

    // Validate the response structure
    if (
      typeof analysis.rating !== 'number' ||
      typeof analysis.feedback !== 'string' ||
      typeof analysis.matchPercentage !== 'number' ||
      !Array.isArray(analysis.strengths) ||
      !Array.isArray(analysis.weaknesses) ||
      !Array.isArray(analysis.keyRequirements) ||
      !Array.isArray(analysis.missingRequirements)
    ) {
      throw new Error('Invalid analysis response structure from OpenAI');
    }

    logger.info('resume_analysis_complete', {
      rating: analysis.rating,
      matchPercentage: analysis.matchPercentage,
    });

    return {
      ...analysis,
      jobContent,
      resumeContent,
    };
  } catch (error) {
    logger.error('resume_analysis_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
