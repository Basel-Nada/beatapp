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

      return res.conversations.map((c) => ({
        id: c.id,
        contactId: c.contactId,
        contactName: c.contactName || "عميل بدون اسم",
        contactPhone: c.phone || "",
        lastMessageBody: c.lastMessageBody || "",
        lastMessageDate: c.lastMessageDate ? new Date(c.lastMessageDate).toISOString() : new Date().toISOString(),
        lastMessageDirection: "inbound",
        unreadCount: c.unreadCount || 0,
        channel: (c.lastMessageType?.toLowerCase().includes("whatsapp") ? "whatsapp" : "sms") as Conversation["channel"],
        status: "open",
        opportunityStage: "قيد المتابعة",
      }));
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

      return (res.messages?.messages || []).map((m) => ({
        id: m.id,
        conversationId,
        body: m.body,
        direction: m.direction === "inbound" ? "inbound" : "outbound",
        channel: m.messageType?.toLowerCase().includes("whatsapp") ? "whatsapp" : "sms",
        status: "delivered",
        createdAt: m.dateAdded || new Date().toISOString(),
      }));
    } catch {
      return mockStore.getMessages(conversationId);
    }
  },

  async sendMessage(
    conversationId: string,
    body: string,
    senderName: string = "عيادات لومينا",
    locationId?: string
  ): Promise<Message> {
    const config = getHighLevelConfig(locationId);

    if (config.isDemoMode) {
      return mockStore.sendMessage(conversationId, body, senderName);
    }

    // HighLevel Post message endpoint
    await highLevelRequest(
      "/conversations/messages",
      {
        method: "POST",
        body: JSON.stringify({
          conversationId,
          type: "WhatsApp",
          message: body,
        }),
      },
      config.locationId
    );

    return {
      id: `ghl-msg-${Date.now()}`,
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
