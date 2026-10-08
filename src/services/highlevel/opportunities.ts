import { Opportunity, PipelineStage } from "@/types";
import { getHighLevelConfig, highLevelRequest } from "./client";
import { mockStore } from "./mock-store";

export const MEDSPA_PIPELINE_STAGES: PipelineStage[] = [
  { id: "new_lead", name: "عميل جديد", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "contacted", name: "تم التواصل", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "interested", name: "مهتم", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "consultation_booked", name: "حجز استشارة", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { id: "treatment_scheduled", name: "تم الحجز", color: "bg-teal-50 text-teal-700 border-teal-200" },
  { id: "won", name: "تم البيع", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "lost", name: "غير مهتم", color: "bg-slate-50 text-slate-600 border-slate-200" },
];

interface GhlOpportunitySearchResponse {
  opportunities: Array<{
    id: string;
    name: string;
    monetaryValue?: number;
    pipelineStageId?: string;
    contact?: {
      id: string;
      name?: string;
      phone?: string;
    };
    updatedAt?: string;
    createdAt?: string;
  }>;
}

export const OpportunitiesService = {
  getPipelineStages(): PipelineStage[] {
    return MEDSPA_PIPELINE_STAGES;
  },

  async getOpportunities(locationId?: string): Promise<Opportunity[]> {
    const config = getHighLevelConfig(locationId);

    if (config.isDemoMode) {
      return mockStore.getOpportunities();
    }

    try {
      const res = await highLevelRequest<GhlOpportunitySearchResponse>(
        `/opportunities/search?location_id=${config.locationId}`,
        {},
        config.locationId
      );

      return res.opportunities.map((opp) => ({
        id: opp.id,
        contactId: opp.contact?.id || "",
        contactName: opp.contact?.name || opp.name || "عميل غير معروف",
        contactPhone: opp.contact?.phone || "",
        service: opp.name,
        monetaryValue: opp.monetaryValue || 0,
        stageId: "new_lead", // Map to MedSpa stages
        assignedStaff: "فريق المبيعات",
        lastActivityDate: opp.updatedAt || opp.createdAt || new Date().toISOString(),
        createdAt: opp.createdAt || new Date().toISOString(),
      }));
    } catch {
      return mockStore.getOpportunities();
    }
  },

  async updateStage(opportunityId: string, stageId: Opportunity["stageId"], locationId?: string): Promise<Opportunity | null> {
    const config = getHighLevelConfig(locationId);

    if (config.isDemoMode) {
      const updated = mockStore.updateOpportunityStage(opportunityId, stageId);
      return updated || null;
    }

    try {
      // In live GHL, update the opportunity status / stage
      await highLevelRequest(
        `/opportunities/${opportunityId}/status`,
        {
          method: "PUT",
          body: JSON.stringify({
            status: stageId === "won" ? "won" : stageId === "lost" ? "abandoned" : "open",
            pipelineStageId: stageId,
          }),
        },
        config.locationId
      );
      const list = await this.getOpportunities(locationId);
      return list.find(o => o.id === opportunityId) || null;
    } catch {
      return null;
    }
  },
};
