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

export const ConversationsService = {
  async getConversations(locationId?: string): Promise<Conversation[]> {
    const config = getHighLevelConfig(locationId);

    if (config.isDemoMode) {
      return mockStore.getConversations();
    }

    try {
      const res = await highLevelRequest<GhlConversationsSearchResponse>(
        `/conversations/search?locationId=${config.locationId}&limit=50`,
        {},
        config.locationId
      );

      const list = (res.conversations || []).map((c) => {
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
          opportunityStage: "قيد المتابعة",
        };
      });

      // ALWAYS sort conversations descending by latest activity date so newest is at the top
      return list.sort((a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime());
    } catch {
      return mockStore.getConversations();
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

        let errorMessage = m.error;
        if (errorMessage === "Agency has insufficient funds") {
          errorMessage = "فشل التسليم: نفاد رصيد الرسائل في حساب HighLevel (Agency has insufficient funds)";
        }

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
    } catch {
      return mockStore.getMessages(conversationId);
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
