import { Opportunity, PipelineStage } from "@/types";
import { getHighLevelConfig, highLevelRequest } from "./client";
import { mockStore } from "./mock-store";

export interface HighLevelPipeline {
  id: string;
  name: string;
  stages: Array<{
    id: string;
    name: string;
    position: number;
    color?: string;
  }>;
}

interface GhlPipelinesResponse {
  pipelines: HighLevelPipeline[];
}

interface GhlOpportunitySearchResponse {
  opportunities: Array<{
    id: string;
    name: string;
    monetaryValue?: number;
    pipelineId?: string;
    pipelineStageId?: string;
    contact?: {
      id: string;
      name?: string;
      phone?: string;
      email?: string;
    };
    assignedTo?: string;
    status?: string;
    updatedAt?: string;
    createdAt?: string;
  }>;
}

export const OpportunitiesService = {
  async getPipelines(locationId?: string): Promise<HighLevelPipeline[]> {
    const config = getHighLevelConfig(locationId);

    if (config.isDemoMode) {
      return [
        {
          id: "pipe-demo-1",
          name: "مسار العيادة التجميلية الافتراضي",
          stages: [
            { id: "new_lead", name: "عميل جديد", position: 0 },
            { id: "contacted", name: "تم التواصل", position: 1 },
            { id: "interested", name: "مهتم", position: 2 },
            { id: "consultation_booked", name: "حجز استشارة", position: 3 },
            { id: "treatment_scheduled", name: "تم الحجز", position: 4 },
            { id: "won", name: "تم البيع", position: 5 },
            { id: "lost", name: "غير مهتم", position: 6 },
          ],
        },
      ];
    }

    try {
      const res = await highLevelRequest<GhlPipelinesResponse>(
        `/opportunities/pipelines?locationId=${config.locationId}`,
        {},
        config.locationId
      );
      return res.pipelines || [];
    } catch {
      return [];
    }
  },

  async getOpportunities(params?: { locationId?: string; pipelineId?: string }): Promise<Opportunity[]> {
    const config = getHighLevelConfig(params?.locationId);

    if (config.isDemoMode) {
      return mockStore.getOpportunities();
    }

    try {
      const q = new URLSearchParams({
        location_id: config.locationId!,
      });
      if (params?.pipelineId) {
        q.set("pipeline_id", params.pipelineId);
      }

      const res = await highLevelRequest<GhlOpportunitySearchResponse>(
        `/opportunities/search?${q.toString()}`,
        {},
        config.locationId
      );

      return (res.opportunities || []).map((opp) => ({
        id: opp.id,
        contactId: opp.contact?.id || "",
        contactName: opp.contact?.name || opp.name || "عميل غير معروف",
        contactPhone: opp.contact?.phone || "",
        service: opp.name,
        monetaryValue: opp.monetaryValue || 0,
        stageId: (opp.pipelineStageId || "new_lead") as Opportunity["stageId"],
        assignedStaff: "فريق المبيعات",
        lastActivityDate: opp.updatedAt || opp.createdAt || new Date().toISOString(),
        createdAt: opp.createdAt || new Date().toISOString(),
      }));
    } catch {
      return mockStore.getOpportunities();
    }
  },

  async updateStage(
    opportunityId: string,
    pipelineStageId: string,
    locationId?: string
  ): Promise<boolean> {
    const config = getHighLevelConfig(locationId);

    if (config.isDemoMode) {
      mockStore.updateOpportunityStage(opportunityId, pipelineStageId as Opportunity["stageId"]);
      return true;
    }

    try {
      // HighLevel update opportunity status/stage
      await highLevelRequest(
        `/opportunities/${opportunityId}/status`,
        {
          method: "PUT",
          body: JSON.stringify({
            pipelineStageId,
            status: "open",
          }),
        },
        config.locationId
      );
      return true;
    } catch {
      try {
        // Fallback to update opportunity general endpoint
        await highLevelRequest(
          `/opportunities/${opportunityId}`,
          {
            method: "PUT",
            body: JSON.stringify({
              pipelineStageId,
            }),
          },
          config.locationId
        );
        return true;
      } catch (e) {
        console.error("Update stage failed", e);
        return false;
      }
    }
  },
};
