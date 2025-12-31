export type Logger = {
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
  debug: (message: string, meta?: Record<string, unknown>) => void;
};

const formatMeta = (meta?: Record<string, unknown>): string => {
  if (!meta || Object.keys(meta).length === 0) return "";
  return ` ${JSON.stringify(meta)}`;
};

export const createLogger = (namespace = "server"): Logger => ({
  info: (message, meta) => {
    console.info(`[${namespace}] ${message}${formatMeta(meta)}`);
  },
  warn: (message, meta) => {
    console.warn(`[${namespace}] ${message}${formatMeta(meta)}`);
  },
  error: (message, meta) => {
    console.error(`[${namespace}] ${message}${formatMeta(meta)}`);
  },
  debug: (message, meta) => {
    if (process.env.LOG_LEVEL === "debug") {
      console.debug(`[${namespace}] ${message}${formatMeta(meta)}`);
    }
  },
});
