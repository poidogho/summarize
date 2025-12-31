export const parseUrl = (value: string): URL => {
  if (!value || typeof value !== "string") {
    throw new Error("url_required");
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("url_invalid");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("url_invalid_protocol");
  }

  return parsed;
};
