import { NextResponse } from "next/server";
import { getApiHealthMetrics, clearApiCache, getHighLevelConfig, highLevelRequest } from "@/services/highlevel/client";
import { WebhooksService } from "@/services/highlevel/webhooks";

export async function GET() {
  const config = getHighLevelConfig();
  const startTime = Date.now();
  let pingMs = 0;
  let connectionStatus = "offline";
  let locationInfo: unknown = null;

  if (!config.isDemoMode && config.token && config.locationId) {
    try {
      const res = await highLevelRequest<{ location?: unknown }>(
        `/locations/${config.locationId}`,
        { cacheTtlMs: 0, maxRetries: 1 },
        config.locationId
      );
      pingMs = Date.now() - startTime;
      connectionStatus = "healthy";
      locationInfo = res.location || null;
    } catch {
      pingMs = Date.now() - startTime;
      connectionStatus = "error";
    }
  } else {
    pingMs = 12;
    connectionStatus = "demo_mode";
  }

  const telemetry = getApiHealthMetrics();

  return NextResponse.json({
    status: connectionStatus,
    pingMs,
    config: {
      baseUrl: config.baseUrl,
      apiVersion: config.apiVersion,
      locationId: config.locationId,
      tokenMasked: config.token ? `${config.token.substring(0, 8)}...${config.token.slice(-4)}` : "غير متوفر",
      isDemoMode: config.isDemoMode,
    },
    telemetry,
    locationInfo,
    recentWebhookEvents: WebhooksService.getRecentEvents(),
    timestamp: new Date().toISOString(),
  });
}

export async function POST() {
  clearApiCache();
  return NextResponse.json({
    success: true,
    message: "تم تفريغ ذاكرة التخزين المؤقت للـ API بنجاح (Cache Cleared)",
    timestamp: new Date().toISOString(),
  });
}
