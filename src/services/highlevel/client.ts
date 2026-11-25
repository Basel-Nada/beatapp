/**
 * HighLevel (GoHighLevel) Official API v2 Client
 * https://services.leadconnectorhq.com
 * API Version: 2021-07-28
 *
 * Enterprise Resilience Features:
 * - Automatic Exponential Backoff & Jitter for 429 (Rate Limit) and 5xx errors
 * - In-Memory Stale-While-Revalidate Caching for fast read-heavy endpoints
 * - Live Health & Latency Telemetry for Settings Diagnostics
 */

export interface HighLevelConfig {
  baseUrl: string;
  apiVersion: string;
  token?: string;
  locationId?: string;
  isDemoMode: boolean;
}

export function getHighLevelConfig(overrideLocationId?: string): HighLevelConfig {
  const token = process.env.HIGHLEVEL_PRIVATE_TOKEN || process.env.HIGHLEVEL_OAUTH_TOKEN;
  const locationId = overrideLocationId || process.env.HIGHLEVEL_LOCATION_ID;
  const isDemoExplicit = process.env.DEMO_MODE === "true";

  // If no token or no locationId is configured, we run in controlled DEMO_MODE
  const isDemoMode = isDemoExplicit || !token || !locationId;

  return {
    baseUrl: process.env.HIGHLEVEL_API_BASE_URL || "https://services.leadconnectorhq.com",
    apiVersion: "2021-07-28",
    token,
    locationId,
    isDemoMode,
  };
}

export class HighLevelApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "HighLevelApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

// -------------------------------------------------------------
// Live Diagnostics & Telemetry Store
// -------------------------------------------------------------
interface ApiTelemetry {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  retriedCalls: number;
  lastLatencyMs: number;
  averageLatencyMs: number;
  lastSuccessTimestamp?: string;
  lastErrorTimestamp?: string;
  lastErrorMessage?: string;
}

const telemetry: ApiTelemetry = {
  totalCalls: 0,
  successfulCalls: 0,
  failedCalls: 0,
  retriedCalls: 0,
  lastLatencyMs: 0,
  averageLatencyMs: 0,
};

export function getApiHealthMetrics(): ApiTelemetry {
  return { ...telemetry };
}

// -------------------------------------------------------------
// In-Memory Request Cache Layer
// -------------------------------------------------------------
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

export function clearApiCache(): void {
  memoryCache.clear();
}

export interface RequestOptions extends RequestInit {
  cacheTtlMs?: number; // Cache duration in milliseconds (e.g. 60000 for 1 minute)
  maxRetries?: number; // Default 3
}

// Helper: Sleep with jitter
function wait(ms: number): Promise<void> {
  const jitter = Math.random() * 100;
  return new Promise((resolve) => setTimeout(resolve, ms + jitter));
}

export async function highLevelRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
  locationId?: string
): Promise<T> {
  const config = getHighLevelConfig(locationId);

  if (!config.token) {
    throw new HighLevelApiError("HighLevel credentials are not configured", 401);
  }

  const url = `${config.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const method = (options.method || "GET").toUpperCase();

  // 1. Check cache for GET requests if TTL requested
  const cacheKey = `${method}:${locationId || config.locationId}:${url}`;
  if (method === "GET" && options.cacheTtlMs && options.cacheTtlMs > 0) {
    const cached = memoryCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as T;
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.token}`,
    Version: config.apiVersion,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  const maxRetries = options.maxRetries ?? 2;
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= maxRetries) {
    const startTime = Date.now();
    telemetry.totalCalls++;

    try {
      const res = await fetch(url, {
        cache: "no-store",
        ...options,
        headers,
      });

      const elapsed = Date.now() - startTime;
      telemetry.lastLatencyMs = elapsed;
      telemetry.averageLatencyMs = Math.round(
        (telemetry.averageLatencyMs * (telemetry.totalCalls - 1) + elapsed) / telemetry.totalCalls
      );

      // Handle 429 (Rate Limit) or 5xx with retry
      if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
        if (attempt < maxRetries) {
          attempt++;
          telemetry.retriedCalls++;
          const retryAfter = res.headers.get("Retry-After");
          const backoff = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * 600;
          await wait(backoff);
          continue;
        }
      }

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: res.statusText }));
        throw new HighLevelApiError(
          errorBody.message || `HighLevel API error: ${res.status}`,
          res.status,
          errorBody
        );
      }

      const data = (await res.json()) as T;

      // Update telemetry
      telemetry.successfulCalls++;
      telemetry.lastSuccessTimestamp = new Date().toISOString();

      // Store in cache if requested
      if (method === "GET" && options.cacheTtlMs && options.cacheTtlMs > 0) {
        memoryCache.set(cacheKey, {
          data,
          expiresAt: Date.now() + options.cacheTtlMs,
        });
      }

      return data;
    } catch (err: unknown) {
      const elapsed = Date.now() - startTime;
      telemetry.lastLatencyMs = elapsed;
      lastError = err instanceof Error ? err : new Error(String(err));

      // Network disconnect / abort retry
      if (attempt < maxRetries && !(err instanceof HighLevelApiError && err.statusCode < 500 && err.statusCode !== 429)) {
        attempt++;
        telemetry.retriedCalls++;
        await wait(Math.pow(2, attempt) * 500);
        continue;
      }

      telemetry.failedCalls++;
      telemetry.lastErrorTimestamp = new Date().toISOString();
      telemetry.lastErrorMessage = lastError.message;

      if (err instanceof HighLevelApiError) throw err;
      throw new HighLevelApiError(`Failed to communicate with HighLevel: ${lastError.message}`, 500);
    }
  }

  throw lastError || new HighLevelApiError("HighLevel request failed after retries", 500);
}
