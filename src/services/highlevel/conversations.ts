import { Conversation, Message } from "@/types";
import { getHighLevelConfig, highLevelRequest } from "./client";
import { mockStore } from "./mock-store";

interface GhlConversationsSearchResponse {
  conversations: Array<{
    id: string;
    contactId: string;
    locationId: string;
    lastMessageBody?: string;
    lastMessageDate?: number;
    lastMessageType?: string;
    lastMessageDirection?: string;
    unreadCount?: number;
    contactName?: string;
    fullName?: string;
    phone?: string;
    assignedTo?: string;
    dateAdded?: number;
    dateUpdated?: number;
  }>;
  total?: number;
}

interface GhlMessagesResponse {
  messages: {
    messages: Array<{
      id: string;
      body: string;
      direction: string;
      dateAdded: string;
      messageType: string;
      status: string;
      error?: string;
    }>;
  };
}

export interface ConversationScope {
  /** معرّف الموظف: يرجع فقط المحادثات المسندة له أو لعملائه */
  userId?: string;
  /** معرّفات العملاء المسندين للموظف */
  allowedContactIds?: Set<string>;
}

/** ترجمة أخطاء التسليم الشائعة القادمة من BeatApp / واتساب إلى عربي واضح */
export function translateDeliveryError(err?: string): string | undefined {
  if (!err) return undefined;
  if (/insufficient funds/i.test(err)) return "فشل التسليم: رصيد الرسائل في حساب BeatApp غير كافٍ";
  if (/24 hours/i.test(err))
    return "فشل التسليم: مرّ أكثر من 24 ساعة على آخر رسالة من العميل. واتساب يسمح فقط بإرسال «قالب معتمد» في هذه الحالة.";
  if (/not a valid whatsapp|not on whatsapp|invalid.*number/i.test(err)) return "فشل التسليم: الرقم غير مسجل على واتساب";
  if (/opt.?out|unsubscribed|DND/i.test(err)) return "فشل التسليم: العميل أوقف استقبال الرسائل";
  return `فشل التسليم: ${err}`;
}

export const ConversationsService = {
  async getConversations(locationId?: string, scope?: ConversationScope): Promise<Conversation[]> {
    const config = getHighLevelConfig(locationId);

    if (config.isDemoMode) {
      return mockStore.getConversations();
    }

    try {
      const res = await highLevelRequest<GhlConversationsSearchResponse>(
        `/conversations/search?locationId=${config.locationId}&limit=100`,
        { cacheTtlMs: 10 * 1000 },
        config.locationId
      );

      let raw = res.conversations || [];
      if (scope?.userId) {
        raw = raw.filter(
          (c) => c.assignedTo === scope.userId || scope.allowedContactIds?.has(c.contactId)
        );
      }

      const list = raw.map((c) => {
        const contactName = c.contactName || c.fullName || "عميل غير معروف";
        const isWhatsapp = (c.lastMessageType || "").toLowerCase().includes("whatsapp");

        // Format body for snippet (strip markdown links if huge email tracking)
        let snippet = c.lastMessageBody || "";
        if (snippet.startsWith("[http") || snippet.includes("email-tracking")) {
          snippet = "رسالة بريد إلكتروني آلية";
        }

        const rawDate = c.lastMessageDate || c.dateUpdated || c.dateAdded;
        const lastMessageDate = rawDate ? new Date(rawDate).toISOString() : new Date().toISOString();

        return {
          id: c.id,
          contactId: c.contactId,
          contactName,
          contactPhone: c.phone || "",
          lastMessageBody: snippet,
          lastMessageDate,
          lastMessageDirection: (c.lastMessageDirection === "outbound" ? "outbound" : "inbound") as "inbound" | "outbound",
          unreadCount: c.unreadCount || 0,
          channel: (isWhatsapp ? "whatsapp" : "whatsapp") as Conversation["channel"],
          status: "open" as const,
          assignedTo: c.assignedTo,
          opportunityStage: "قيد المتابعة",
        };
      });

      // ALWAYS sort conversations descending by latest activity date so newest is at the top
      return list.sort((a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime());
    } catch (e) {
      console.error("Failed to load conversations from BeatApp", e);
      return [];
    }
  },

  async getMessages(conversationId: string, locationId?: string): Promise<Message[]> {
    const config = getHighLevelConfig(locationId);

    if (config.isDemoMode) {
      return mockStore.getMessages(conversationId);
    }

    try {
      const res = await highLevelRequest<GhlMessagesResponse>(
        `/conversations/${conversationId}/messages`,
        {},
        config.locationId
      );

      const raw = res.messages?.messages || [];
      // Sort chronologically ascending for the chat thread
      const sorted = [...raw].sort((a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime());

      return sorted.map((m) => {
        let cleanBody = m.body || "";
        if (cleanBody.includes("email-tracking") && cleanBody.includes("unsubscribe")) {
          cleanBody = "📧 رسالة تسويقية آلية مسجلة في سجل العميل";
        }

        const errorMessage = translateDeliveryError(m.error);

        return {
          id: m.id,
          conversationId,
          body: cleanBody,
          direction: m.direction === "inbound" ? "inbound" : "outbound",
          channel: "whatsapp",
          status: (m.status === "failed" ? "failed" : m.status === "delivered" ? "delivered" : "sent") as Message["status"],
          errorMessage,
          createdAt: m.dateAdded || new Date().toISOString(),
        };
      });
    } catch (e) {
      console.error("Failed to load messages from BeatApp", e);
      return [];
    }
  },

  async sendMessage(
    conversationId: string,
    body: string,
    contactId?: string,
    senderName: string = "بيتاب",
    locationId?: string
  ): Promise<Message> {
    const config = getHighLevelConfig(locationId);

    if (config.isDemoMode) {
      return mockStore.sendMessage(conversationId, body, senderName);
    }

    let targetContactId = contactId;
    if (!targetContactId) {
      try {
        const convs = await this.getConversations(locationId);
        const match = convs.find(c => c.id === conversationId);
        if (match) targetContactId = match.contactId;
      } catch (e) {
        console.error("Could not find contactId for conversation", e);
      }
    }

    if (!targetContactId) {
      throw new Error("تعذر تحديد معرف العميل (contactId) لإرسال الرسالة");
    }

    // Send via HighLevel Post message endpoint
    const res = await highLevelRequest<{ conversationId: string; messageId: string }>(
      "/conversations/messages",
      {
        method: "POST",
        body: JSON.stringify({
          type: "WhatsApp",
          contactId: targetContactId,
          message: body,
        }),
      },
      config.locationId
    );

    return {
      id: res.messageId || `msg-${Date.now()}`,
      conversationId,
      body,
      direction: "outbound",
      channel: "whatsapp",
      status: "sent",
      createdAt: new Date().toISOString(),
      senderName,
    };
  },
};
