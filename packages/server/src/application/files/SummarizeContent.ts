import type { Logger } from '../../infrastructure/logging/logger.js';
import { getOpenAIClient } from '../../infrastructure/ai/openai-client.js';

type Tone = 'professional' | 'casual';

export type SummaryResult = {
  summary: string;
  keyAreas: string[];
};

/**
 * Strips markdown formatting from text
 */
const stripMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold **text**
    .replace(/\*(.+?)\*/g, '$1') // Remove italic *text*
    .replace(/#{1,6}\s+/g, '') // Remove headings
    .replace(/`(.+?)`/g, '$1') // Remove code `text`
    .trim();
};

/**
 * Summarizes the given content using OpenAI
 * @param content - The text content to summarize
 * @param logger - Logger instance for logging
 * @param tone - The tone for the summary: 'professional' or 'casual'
 * @returns A summarized version of the content as bullet points and key areas of interest
 * @throws Error if summarization fails
 */
export const summarizeContent = async (
  content: string,
  logger: Logger,
  tone: Tone = 'professional'
): Promise<SummaryResult> => {
  try {
    const client = getOpenAIClient();

    logger.info('summarize_start', {
      contentLength: content.length,
      tone,
    });

    const toneDescription =
      tone === 'professional'
        ? 'Use a formal, professional tone suitable for business or academic contexts.'
        : 'Use a casual, conversational tone that is easy to understand for non-professional audiences.';

    // Generate summary
    const summaryResponse = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that summarizes documents concisely and accurately. ${toneDescription} Format your summary as bullet points using dashes (-) or bullets (•). Do NOT use markdown formatting like **bold** or *italic*. Use plain text only.`,
        },
        {
          role: 'user',
          content: `Please provide a clear and concise summary of the following content as bullet points. ${toneDescription} Use plain text only - no markdown formatting.\n\nContent:\n${content}`,
        },
      ],
      temperature: 0.3,
    });

    let summary = summaryResponse.choices[0]?.message?.content;
    if (!summary) {
      throw new Error('No summary generated from OpenAI');
    }

    // Strip any markdown that might have been included
    summary = stripMarkdown(summary);

    // Extract key areas of interest/concern
    const keyAreasResponse = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that identifies key areas of interest or concern in documents. You must return a JSON object with a "keyAreas" field containing an array of strings.`,
        },
        {
          role: 'user',
          content: `Identify key areas of interest or concern in the following document. These should be important topics, sections, or points that require attention. 

Return a JSON object in this exact format:
{
  "keyAreas": ["area 1", "area 2", "area 3"]
}

Include 5-7 key areas. Each area should be a brief, clear description.

Document:\n${content}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const keyAreasText = keyAreasResponse.choices[0]?.message?.content;
    let keyAreas: string[] = [];

    if (keyAreasText) {
      try {
        const parsed = JSON.parse(keyAreasText);
        // Handle different possible JSON structures
        if (parsed.keyAreas && Array.isArray(parsed.keyAreas)) {
          keyAreas = parsed.keyAreas.filter(
            (item: unknown): item is string =>
              typeof item === 'string' && item.trim().length > 0
          );
        } else if (parsed.areas && Array.isArray(parsed.areas)) {
          keyAreas = parsed.areas.filter(
            (item: unknown): item is string =>
              typeof item === 'string' && item.trim().length > 0
          );
        } else if (Array.isArray(parsed)) {
          keyAreas = parsed.filter(
            (item: unknown): item is string =>
              typeof item === 'string' && item.trim().length > 0
          );
        } else if (typeof parsed === 'object') {
          // If it's an object with string values, convert to array
          keyAreas = Object.values(parsed)
            .filter(
              (v): v is string => typeof v === 'string' && v.trim().length > 0
            )
            .slice(0, 7);
        }
      } catch (error) {
        logger.warn('key_areas_parse_failed', {
          error: error instanceof Error ? error.message : String(error),
          keyAreasText,
        });
        // Fallback: try to extract as a simple list
        keyAreas = keyAreasText
          .split('\n')
          .map((line) => line.trim().replace(/^[-•*]\s*/, ''))
          .filter((line) => line.length > 0)
          .slice(0, 7);
      }
    }

    // Log if key areas are empty for debugging
    if (keyAreas.length === 0) {
      logger.warn('key_areas_empty', { keyAreasText });
    }

    logger.info('summarize_complete', {
      summaryLength: summary.length,
      keyAreasCount: keyAreas.length,
      tone,
    });

    return { summary, keyAreas };
  } catch (error) {
    logger.error('summarize_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
