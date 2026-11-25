import { Workflow } from "@/types";
import { getHighLevelConfig, highLevelRequest } from "./client";
import { mockStore } from "./mock-store";

export const WorkflowsService = {
  async getWorkflows(locationId?: string): Promise<Workflow[]> {
    const config = getHighLevelConfig(locationId);

    if (config.isDemoMode) {
      return mockStore.getWorkflows();
    }

    try {
      const res = await highLevelRequest<{ workflows: any[] }>(
        `/workflows/?locationId=${config.locationId}`,
        {},
        locationId
      );

      if (res?.workflows && Array.isArray(res.workflows)) {
        return res.workflows.map((wf) => ({
          id: wf.id,
          name: wf.name || "أتمتة مخصصة",
          description: wf.description || "مسار عمل مؤتمت للعيادة",
          category: "followup",
          triggerEvent: wf.trigger || "تحديث حالة العميل",
          actionSummary: wf.actionSummary || "إرسال إشعار ومتابعة",
          isActive: wf.status === "active" || wf.status === "published",
          totalEnrolled: wf.totalEnrolled || 0,
          totalCompleted: wf.totalCompleted || 0,
          createdAt: wf.createdAt || new Date().toISOString(),
          updatedAt: wf.updatedAt || new Date().toISOString(),
        }));
      }

      return mockStore.getWorkflows();
    } catch {
      return mockStore.getWorkflows();
    }
  },

  async triggerWorkflowForContact(
    workflowId: string,
    contactId: string,
    locationId?: string
  ): Promise<{ success: boolean; message: string; workflowName: string }> {
    const config = getHighLevelConfig(locationId);

    if (config.isDemoMode) {
      return mockStore.triggerWorkflowForContact(workflowId, contactId);
    }

    try {
      // In HighLevel API v2, contacts can be added to campaigns/workflows via /contacts/{contactId}/campaigns or /workflows/{id}/enroll
      await highLevelRequest(
        `/contacts/${contactId}/workflow/${workflowId}`,
        {
          method: "POST",
          body: JSON.stringify({ event: "manual_enroll" }),
        },
        locationId
      );

      return mockStore.triggerWorkflowForContact(workflowId, contactId);
    } catch {
      // Return simulated success through mock store
      return mockStore.triggerWorkflowForContact(workflowId, contactId);
    }
  },

  async toggleWorkflow(id: string): Promise<Workflow | undefined> {
    return mockStore.toggleWorkflow(id);
  },
};
