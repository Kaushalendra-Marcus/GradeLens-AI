export const MIN_INTERVAL_MS = 2100;
let lastCallAt = 0;

export function _resetRateLimiter() {
  lastCallAt = 0;
}
export function _setLastCallAt(v: number) {
  lastCallAt = v;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callWithRateLimit<T>(
  fn: () => Promise<T>,
  maxRetries = 4
): Promise<T> {
  const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastCallAt));
  if (wait > 0) await sleep(wait);
  lastCallAt = Date.now();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      if (err?.status === 429 && attempt < maxRetries) {
        const retryAfter = Number(err?.headers?.["retry-after"] ?? 2 ** attempt);
        await sleep(retryAfter * 1000);
        continue;
      }
      throw err;
    }
  }
  throw new Error("Groq call failed after retries");
}
