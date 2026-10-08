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
    unreadCount?: number;
    contactName?: string;
    fullName?: string;
    phone?: string;
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

      return (res.conversations || []).map((c) => {
        const contactName = c.contactName || c.fullName || "عميل غير معروف";
        const isWhatsapp = (c.lastMessageType || "").toLowerCase().includes("whatsapp");

        return {
          id: c.id,
          contactId: c.contactId,
          contactName,
          contactPhone: c.phone || "",
          lastMessageBody: c.lastMessageBody || "",
          lastMessageDate: c.lastMessageDate ? new Date(c.lastMessageDate).toISOString() : new Date().toISOString(),
          lastMessageDirection: "inbound",
          unreadCount: c.unreadCount || 0,
          channel: (isWhatsapp ? "whatsapp" : "whatsapp") as Conversation["channel"],
          status: "open",
          opportunityStage: "قيد المتابعة",
        };
      });
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
      // Sort chronologically ascending
      const sorted = [...raw].sort((a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime());

      return sorted.map((m) => ({
        id: m.id,
        conversationId,
        body: m.body,
        direction: m.direction === "inbound" ? "inbound" : "outbound",
        channel: "whatsapp",
        status: m.status === "failed" ? "failed" : "delivered",
        createdAt: m.dateAdded || new Date().toISOString(),
      }));
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

    // HighLevel requires contactId. If missing, look it up from conversation search
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
