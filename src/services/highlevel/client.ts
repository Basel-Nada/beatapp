/**
 * HighLevel (GoHighLevel) Official API v2 Client
 * https://services.leadconnectorhq.com
 * API Version: 2021-07-28
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

export async function highLevelRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  locationId?: string
): Promise<T> {
  const config = getHighLevelConfig(locationId);

  if (!config.token) {
    throw new HighLevelApiError("HighLevel credentials are not configured", 401);
  }

  const url = `${config.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    "Authorization": `Bearer ${config.token}`,
    "Version": config.apiVersion,
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  try {
    const res = await fetch(url, {
      cache: "no-store",
      ...options,
      headers,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ message: res.statusText }));
      throw new HighLevelApiError(
        errorBody.message || `HighLevel API error: ${res.status}`,
        res.status,
        errorBody
      );
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    if (err instanceof HighLevelApiError) throw err;
    const msg = err instanceof Error ? err.message : "Unknown network error";
    throw new HighLevelApiError(`Failed to communicate with HighLevel: ${msg}`, 500);
  }
}
