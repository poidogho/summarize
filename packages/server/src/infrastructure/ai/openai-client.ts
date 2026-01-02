import OpenAI from 'openai';

let client: OpenAI | null = null;

/**
 * Creates and returns a singleton OpenAI client instance
 * @throws Error if OPENAI_API_KEY is not set
 */
export const getOpenAIClient = (): OpenAI => {
  if (client) {
    return client;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  client = new OpenAI({
    apiKey,
  });

  return client;
};
