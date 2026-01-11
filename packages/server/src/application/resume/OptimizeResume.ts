import type { Logger } from '../../infrastructure/logging/logger.js';
import { getOpenAIClient } from '../../infrastructure/ai/openai-client.js';

export type ResumeOptimizationResult = {
  optimizedResume: string;
  summary: string;
};

/**
 * Optimizes a resume for a given job posting using already extracted content.
 */
export const optimizeResume = async (
  jobContent: string,
  resumeContent: string,
  logger: Logger
): Promise<ResumeOptimizationResult> => {
  if (!jobContent.trim()) {
    throw new Error('jobContent_required');
  }
  if (!resumeContent.trim()) {
    throw new Error('resumeContent_required');
  }

  const client = getOpenAIClient();

  logger.info('resume_optimization_ai_start', {
    jobContentLength: jobContent.length,
    resumeContentLength: resumeContent.length,
  });

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an expert resume editor. Optimize the resume to better match the job posting.

Rules:
- Keep the resume truthful; do not invent facts.
- Make concise additions or rewrites that improve alignment.
- Preserve the resume structure where possible.
- Return a JSON object with keys: "optimizedResume" and "summary".
- "optimizedResume" must be a single string containing the full resume (not a nested object).
- "summary" should be 2-5 bullets explaining what changed.`,
      },
      {
        role: 'user',
        content: `Job Posting:\n\n${jobContent}\n\n---\n\nResume:\n\n${resumeContent}`,
      },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  const responseText = response.choices[0]?.message?.content?.trim();
  if (!responseText) {
    throw new Error('resume_optimization_failed');
  }

  let parsed: ResumeOptimizationResult;
  try {
    parsed = JSON.parse(responseText) as ResumeOptimizationResult;
  } catch (error) {
    logger.warn('resume_optimization_parse_failed', {
      error: error instanceof Error ? error.message : String(error),
      snippet: responseText.slice(0, 200),
    });
    throw new Error('resume_optimization_invalid_response');
  }
  if (typeof parsed.summary !== 'string') {
    parsed.summary = 'Optimized resume content for stronger alignment.';
  }

  if (typeof parsed.optimizedResume !== 'string') {
    if (parsed.optimizedResume && typeof parsed.optimizedResume === 'object') {
      parsed.optimizedResume = JSON.stringify(parsed.optimizedResume, null, 2);
    } else {
      logger.warn('resume_optimization_invalid_shape', {
        snippet: responseText.slice(0, 200),
      });
      throw new Error('resume_optimization_failed');
    }
  }

  logger.info('resume_optimization_complete', {
    optimizedLength: parsed.optimizedResume.length,
  });

  return parsed;
};
