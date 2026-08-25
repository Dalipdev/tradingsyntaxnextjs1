/**
 * fetchWithTimeout
 * Wraps fetch with an abort-based timeout and safe fallback handling.
 *
 * CHANGED FROM ORIGINAL:
 * - Default timeout dropped 15000ms -> 6000ms
 * - Default retries dropped 2 -> 0 (retrying a cold server just adds
 *   wait time, it does not make the server wake up faster)
 * - Default retryDelay dropped 1500ms -> 800ms (only used if you
 *   explicitly opt into retries for a specific call)
 *
 * Worst case wait for a normal interactive click is now ~6s instead
 * of ~48s. If you have calls that genuinely need retries (e.g. a
 * background sync job, not something a user is staring at), pass
 * `{ retries: 2 }` explicitly for that call only.
 */
export async function fetchWithTimeout(
  url,
  options = {},
  { timeout = 6000, fallback = null, retries = 0, retryDelay = 800 } = {}
) {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;

      const isTimeout = error.name === 'AbortError';
      const causeCode = error.cause?.code || error.cause?.message || null;

      if (isTimeout) {
        console.warn(
          `[fetchWithTimeout] Request timed out after ${timeout}ms: ${url}`
        );
        break; // don't retry timeouts
      } else {
        console.error(
          `[fetchWithTimeout] Fetch failed (attempt ${attempt + 1}/${
            retries + 1
          }): ${url}`,
          '\n  message:', error.message,
          '\n  cause:', causeCode ?? error.cause ?? '(none)'
        );

        const isLastAttempt = attempt === retries;
        if (!isLastAttempt) {
          await new Promise((r) => setTimeout(r, retryDelay));
          continue;
        }
      }
    }
  }

  const isTimeout = lastError?.name === 'AbortError';
  const causeCode = lastError?.cause?.code || lastError?.cause?.message || null;

  return {
    ok: false,
    status: isTimeout ? 408 : 502,
    statusText: isTimeout ? 'Request Timeout' : 'Bad Gateway',
    error: isTimeout ? 'timeout' : causeCode || lastError?.message || 'fetch failed',
    json: async () => fallback,
    text: async () => JSON.stringify(fallback),
  };
}