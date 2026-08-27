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
      const isRateLimit =
        err?.status === 429 ||
        err?.status === 413 ||
        err?.error?.code === "rate_limit_exceeded" ||
        (typeof err?.message === "string" && err.message.includes("rate_limit_exceeded")) ||
        (typeof err?.message === "string" && err.message.includes("Request too large"));
      if (isRateLimit && attempt < maxRetries) {
        const raw = err?.headers?.["retry-after"] ?? err?.headers?.["Retry-After"];
        const retryAfter = raw != null ? Number(raw) : 2 ** attempt;
        // Groq returns 60-62s for TPM reset; cap wait to avoid huge stalls but respect it
        const waitMs = (isNaN(retryAfter) ? 2 ** attempt : retryAfter) * 1000;
        await sleep(waitMs);
        // reset interval timer so next attempt doesn't add extra MIN_INTERVAL wait
        lastCallAt = Date.now();
        continue;
      }
      throw err;
    }
  }
  throw new Error("Groq call failed after retries");
}
