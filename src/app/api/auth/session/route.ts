import { NextResponse } from "next/server";
import { DEFAULT_MOCK_USER } from "@/lib/mock-data";
import { getHighLevelConfig } from "@/services/highlevel/client";

export async function GET() {
  const config = getHighLevelConfig();

  const isLive = Boolean(config.token && config.locationId && !config.isDemoMode);

  const tenant = {
    id: "tenant-beatapp-live",
    name: "حساب بيتاب المباشر (Internal - Beatapp)",
    slug: "beatapp-live",
    locationId: config.locationId || "9m3VyK57t1Ah7Pmen0gA",
    timezone: "Asia/Riyadh",
    currency: "ر.س",
    phone: "+966 57 004 0344",
    address: "طريق الملك فهد، العليا، الرياض",
    isHighLevelConnected: true,
  };

  const user = {
    ...DEFAULT_MOCK_USER,
    name: "باسم مصباح",
    email: "info@adwave.co",
    locationId: tenant.locationId,
  };

  return NextResponse.json({
    user,
    tenant,
    isDemoMode: config.isDemoMode,
    config: {
      locationIdConfigured: Boolean(config.locationId),
      tokenConfigured: Boolean(config.token),
    },
  });
}
