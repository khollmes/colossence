import { NextResponse } from "next/server";

// NOTE: ce rate limiter in-memory est efficace en développement et sur des
// serveurs long-running. Sur Vercel (serverless), chaque instance de fonction
// a sa propre Map — la limite s'applique par instance, pas globalement.
// Pour une protection robuste en production, migrer vers Upstash Redis
// avec @upstash/ratelimit (https://github.com/upstash/ratelimit).

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Cleanup stale entries on-demand
function cleanupExpired() {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60_000, // 1 minute
};

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { success: boolean; remaining: number } {
  // Clean up expired entries on-demand (serverless-friendly)
  if (rateLimitMap.size > 1000) {
    cleanupExpired();
  }

  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + config.windowMs });
    return { success: true, remaining: config.maxRequests - 1 };
  }

  if (entry.count >= config.maxRequests) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: config.maxRequests - entry.count };
}

export function rateLimitResponse() {
  return NextResponse.json(
    { error: "Trop de requêtes. Veuillez réessayer dans quelques instants." },
    { status: 429 }
  );
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}
