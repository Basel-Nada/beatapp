import { NextResponse } from "next/server";
import { DEFAULT_MOCK_TENANT, DEFAULT_MOCK_USER } from "@/lib/mock-data";
import { getHighLevelConfig } from "@/services/highlevel/client";

export async function GET() {
  const config = getHighLevelConfig();

  const tenant = {
    ...DEFAULT_MOCK_TENANT,
    isHighLevelConnected: !config.isDemoMode,
    locationId: config.locationId || DEFAULT_MOCK_TENANT.locationId,
  };

  return NextResponse.json({
    user: DEFAULT_MOCK_USER,
    tenant,
    isDemoMode: config.isDemoMode,
    config: {
      locationIdConfigured: Boolean(config.locationId),
      tokenConfigured: Boolean(config.token),
    },
  });
}
