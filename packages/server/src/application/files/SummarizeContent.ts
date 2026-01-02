import type { Logger } from '../../infrastructure/logging/logger.js';
import { getOpenAIClient } from '../../infrastructure/ai/openai-client.js';

/**
 * Summarizes the given content using OpenAI
 * @param content - The text content to summarize
 * @param logger - Logger instance for logging
 * @returns A summarized version of the content
 * @throws Error if summarization fails
 */
export const summarizeContent = async (
  content: string,
  logger: Logger
): Promise<string> => {
  try {
    const client = getOpenAIClient();

    logger.info('summarize_start', {
      contentLength: content.length,
    });

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that summarizes documents concisely and accurately.',
        },
        {
          role: 'user',
          content: `Please provide a clear and concise summary of the following content:\n\n${content}`,
        },
      ],
      temperature: 0.3,
      max_completion_tokens: 1000,
    });

    const summary = response.choices[0]?.message?.content;
    if (!summary) {
      throw new Error('No summary generated from OpenAI');
    }

    logger.info('summarize_complete', {
      summaryLength: summary.length,
    });

    return summary;
  } catch (error) {
    logger.error('summarize_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
