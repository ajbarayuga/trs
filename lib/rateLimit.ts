import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Upstash Redis-backed rate limiter.
 * Works correctly on Vercel serverless — persists across function instances
 * unlike the in-memory Map approach which resets on every cold start.
 *
 * Limits:
 *   send-quote:    5 requests per IP per 60 seconds
 *   generate-pdf: 10 requests per IP per 60 seconds
 *
 * To adjust limits, change the values passed to checkRateLimit() in each route.
 */

const redis = Redis.fromEnv();

const limiters = {
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

/**
 * Returns true if the request is allowed, false if it should be blocked.
 *
 * @param ip      - The requester's IP address
 * @param type    - "default" (5/min) for send-quote, "pdf" (10/min) for generate-pdf
 */
export async function checkRateLimit(
  ip: string,
  type: "default" | "pdf" = "default",
): Promise<boolean> {
  const { success } = await limiters[type].limit(ip);
  return success;
}
