import { mockStore } from "./mock-store";

export interface GhlWebhookPayload {
  type: string;
  locationId: string;
  contact_id?: string;
  id?: string;
  // Contact fields
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  tags?: string;
  // Message fields
  message_type?: string;
  body?: string;
  direction?: string;
  conversation_id?: string;
  // Opportunity fields
  monetary_value?: number;
  pipeline_stage_id?: string;
  status?: string;
  // Appointment fields
  start_time?: string;
  end_time?: string;
  title?: string;
}

export const WebhooksService = {
  async processEvent(payload: GhlWebhookPayload): Promise<{ success: boolean; event: string }> {
    const eventType = payload.type?.toLowerCase() || "";

    // 1. Inbound message
    if (eventType.includes("message") || eventType.includes("inbound")) {
      if (payload.conversation_id && payload.body) {
        mockStore.sendMessage(
          payload.conversation_id,
          payload.body,
          `${payload.first_name || ""} ${payload.last_name || ""}`.trim() || "العميل"
        );
      }
      return { success: true, event: "message.received" };
    }

    // 2. Contact created or updated
    if (eventType.includes("contact")) {
      const name = `${payload.first_name || ""} ${payload.last_name || ""}`.trim();
      if (payload.phone || name) {
        mockStore.createContact({
          name: name || "عميل HighLevel",
          phone: payload.phone || "",
          email: payload.email || "",
          serviceInterest: payload.tags ? payload.tags.split(",")[0] : "استفسار جديد",
          locationId: payload.locationId,
        });
      }
      return { success: true, event: "contact.synced" };
    }

    // 3. Opportunity updated
    if (eventType.includes("opportunity")) {
      return { success: true, event: "opportunity.synced" };
    }

    // 4. Appointment created / updated
    if (eventType.includes("appointment")) {
      return { success: true, event: "appointment.synced" };
    }

    return { success: true, event: "unknown.logged" };
  },
};
