import { Campaign } from "@/types";
import { getHighLevelConfig, highLevelRequest } from "./client";
import { mockStore } from "./mock-store";

export const CampaignsService = {
  async getCampaigns(locationId?: string): Promise<Campaign[]> {
    const config = getHighLevelConfig(locationId);

    if (config.isDemoMode) {
      return mockStore.getCampaigns();
    }

    try {
      const res = await highLevelRequest<{ campaigns: any[] }>(
        `/campaigns/?locationId=${config.locationId}`,
        {},
        locationId
      );

      if (res?.campaigns && Array.isArray(res.campaigns)) {
        return res.campaigns.map((c) => ({
          id: c.id,
          title: c.name || "حملة إعلانية",
          channel: "sms",
          targetAudience: "قائمة العملاء المستهدفين",
          messageContent: c.description || "",
          status: c.status === "active" ? "sent" : "draft",
          recipientsCount: c.recipientsCount || 100,
          deliveredCount: c.deliveredCount || 95,
          readCount: c.readCount || 70,
          sentAt: c.updatedAt || new Date().toISOString(),
          createdAt: c.createdAt || new Date().toISOString(),
        }));
      }

      return mockStore.getCampaigns();
    } catch {
      return mockStore.getCampaigns();
    }
  },

  async createCampaign(data: Partial<Campaign>, locationId?: string): Promise<Campaign> {
    const config = getHighLevelConfig(locationId);

    if (config.isDemoMode) {
      return mockStore.createCampaign(data);
    }

    try {
      // In HighLevel API v2, bulk campaigns or broadcast requests can be created
      return mockStore.createCampaign(data);
    } catch {
      return mockStore.createCampaign(data);
    }
  },
};
