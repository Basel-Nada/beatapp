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
  // Task fields
  task_title?: string;
  completed?: boolean;
}

export interface WebhookEventLog {
  id: string;
  type: string;
  timestamp: string;
  summary: string;
  success: boolean;
}

const recentWebhookEvents: WebhookEventLog[] = [];

export const WebhooksService = {
  getRecentEvents(): WebhookEventLog[] {
    return [...recentWebhookEvents];
  },

  async processEvent(payload: GhlWebhookPayload): Promise<{ success: boolean; event: string }> {
    const rawType = payload.type || "unknown";
    const eventType = rawType.toLowerCase();
    const eventId = `wh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    let summary = `تم استقبال حدث ${rawType}`;
    let success = true;

    try {
      // 1. Inbound or Outbound message
      if (eventType.includes("message") || eventType.includes("inbound")) {
        const sender = `${payload.first_name || ""} ${payload.last_name || ""}`.trim() || "العميل";
        if (payload.conversation_id && payload.body) {
          mockStore.sendMessage(payload.conversation_id, payload.body, sender);
        }
        summary = `رسالة جديدة من ${sender}: "${(payload.body || "").substring(0, 35)}..."`;
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
        summary = `تزامن عميل جديد أو تحديث ملف: ${name || payload.phone || "عميل"}`;
        return { success: true, event: "contact.synced" };
      }

      // 3. Opportunity updated
      if (eventType.includes("opportunity")) {
        summary = `تحديث مسار المبيعات والصفقات (Pipeline)`;
        return { success: true, event: "opportunity.synced" };
      }

      // 4. Appointment created / updated
      if (eventType.includes("appointment")) {
        summary = `تحديث موعد في التقويم: ${payload.title || "جلسة عيادة"}`;
        return { success: true, event: "appointment.synced" };
      }

      // 5. Tasks created / completed
      if (eventType.includes("task")) {
        summary = `تحديث مهمة متابعة سريرية: ${payload.task_title || "مهمة"}`;
        return { success: true, event: "task.synced" };
      }

      // 6. Invoices / Payments
      if (eventType.includes("invoice") || eventType.includes("payment")) {
        summary = `تأكيد عملية دفع أو تحديث فاتورة`;
        return { success: true, event: "invoice.synced" };
      }

      return { success: true, event: "unknown.logged" };
    } catch {
      success = false;
      return { success: false, event: "error.logged" };
    } finally {
      recentWebhookEvents.unshift({
        id: eventId,
        type: rawType,
        timestamp: new Date().toISOString(),
        summary,
        success,
      });
      if (recentWebhookEvents.length > 20) {
        recentWebhookEvents.pop();
      }
    }
  },
};
