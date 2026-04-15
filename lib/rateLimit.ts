import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Upstash Redis-backed rate limiter.
 * Works correctly on Vercel serverless — persists across function instances
 * unlike the in-memory Map approach which resets on every cold start.
 *
 * If Redis env vars are missing or Upstash errors at runtime, we **fail open**
 * (allow the request) so the site does not return 500. Rate limiting is then
 * effectively disabled until credentials work again.
 *
 * Limits:
 *   send-quote:    5 requests per IP per 60 seconds
 *   generate-pdf: 10 requests per IP per 60 seconds
 *
 * To adjust limits, change the values passed to checkRateLimit() in each route.
 */

/** Same resolution order as `Redis.fromEnv()` (Vercel KV naming). */
function getRedisCredentials(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    process.env.KV_REST_API_URL?.trim();
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    process.env.KV_REST_API_TOKEN?.trim();
  if (!url || !token) return null;
  return { url, token };
}

type LimiterBucket = "default" | "pdf";

let limiters: Record<LimiterBucket, Ratelimit> | null = null;
let warnedMissingRedis = false;

function getLimiters(): Record<LimiterBucket, Ratelimit> | null {
  const creds = getRedisCredentials();
  if (!creds) {
    if (process.env.NODE_ENV === "development" && !warnedMissingRedis) {
      warnedMissingRedis = true;
      console.warn(
        "[rateLimit] Upstash Redis env not set; rate limiting is disabled.",
      );
    }
    return null;
  }

  if (!limiters) {
    const redis = new Redis({ url: creds.url, token: creds.token });
    limiters = {
      default: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "60 s"),
        analytics: true,
        prefix: "trs:rl",
      }),
      pdf: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "60 s"),
        analytics: true,
        prefix: "trs:rl:pdf",
      }),
    };
  }

  return limiters;
}

/**
 * Returns true if the request is allowed, false if it should be blocked.
 *
 * @param ip      - The requester's IP address
 * @param type    - "default" (5/min) for send-quote, "pdf" (10/min) for generate-pdf
 */
export async function checkRateLimit(
  ip: string,
  type: LimiterBucket = "default",
): Promise<boolean> {
  const l = getLimiters();
  if (!l) return true;

  try {
    const { success } = await l[type].limit(ip);
    return success;
  } catch (e) {
    console.error("[rateLimit] Upstash request failed:", e);
    return true;
  }
}
