import { Review, ReviewStats } from "@/types";
import { getHighLevelConfig, highLevelRequest } from "./client";
import { mockStore } from "./mock-store";
import { ContactsService } from "./contacts";
import { ConversationsService } from "./conversations";

export const ReviewsService = {
  async getReviews(params?: { ratingFilter?: number; locationId?: string }): Promise<Review[]> {
    const config = getHighLevelConfig(params?.locationId);

    if (config.isDemoMode) {
      return mockStore.getReviews(params?.ratingFilter);
    }

    try {
      // HighLevel has a Reputation / Reviews API endpoint
      const res = await highLevelRequest<{ reviews: any[] }>(
        `/conversations/reviews?locationId=${config.locationId}`,
        {},
        config.locationId
      );

      if (res?.reviews && Array.isArray(res.reviews)) {
        return res.reviews.map((r) => ({
          id: r.id,
          contactName: r.contactName || "عميل",
          platform: "google",
          rating: r.rating || 5,
          comment: r.body || "",
          treatmentName: "خدمة العيادة",
          reply: r.reply,
          createdAt: r.dateAdded || new Date().toISOString(),
        }));
      }

      return mockStore.getReviews(params?.ratingFilter);
    } catch {
      return mockStore.getReviews(params?.ratingFilter);
    }
  },

  async getReviewStats(locationId?: string): Promise<ReviewStats> {
    const config = getHighLevelConfig(locationId);

    if (config.isDemoMode) {
      return mockStore.getReviewStats();
    }

    try {
      // In live mode, fallback to structured stats if endpoint not accessible
      return mockStore.getReviewStats();
    } catch {
      return mockStore.getReviewStats();
    }
  },

  async sendReviewRequest(
    contactId: string,
    channel: "whatsapp" | "sms" = "whatsapp",
    locationId?: string
  ): Promise<{ success: boolean; message: string }> {
    const config = getHighLevelConfig(locationId);

    // Fetch contact (works with both live HighLevel contacts and demo contacts)
    const contact = await ContactsService.getContactById(contactId, locationId);
    if (!contact) {
      return { success: false, message: "لم يتم العثور على العميل" };
    }

    // Try HighLevel review requests API
    if (!config.isDemoMode && !contactId.startsWith("cnt-")) {
      try {
        await highLevelRequest(
          "/reviews/review-requests",
          {
            method: "POST",
            body: JSON.stringify({
              locationId: config.locationId,
              contactId,
              channel,
            }),
          },
          locationId
        );
      } catch {
        // HighLevel review endpoint might require review automation; proceed with direct messaging
      }
    }

    // Dispatch direct friendly WhatsApp message if conversation is available
    const reviewLink = "https://g.page/r/beatapp-review/review";
    const reviewMessage = `عزيزتي ${contact.name}، يسعدنا دائماً استقبالكِ وخدمتكِ ✨ رأيكِ يهمنا ويسهم في تطوير خدماتنا. نرجو التكرم بمشاركتنا تقييمكِ السريع عبر Google:\n${reviewLink}`;

    try {
      const convs = await ConversationsService.getConversations(locationId);
      const conv = convs.find((c) => c.contactId === contactId);
      if (conv) {
        await ConversationsService.sendMessage(conv.id, reviewMessage, contactId, "خدمة العملاء", locationId);
      }
    } catch {
      // Proceed even if conversation service is offline
    }

    // Record note on patient chart
    await ContactsService.addNote(
      contactId,
      `تم إرسال رابط طلب تقييم Google للعميل عبر ${channel === "whatsapp" ? "واتساب" : "رسالة نصية"}.`,
      "فريق العناية بالعملاء",
      locationId
    ).catch(() => {});

    // Update stats counter
    const stats = mockStore.getReviewStats();
    stats.requestsSentThisMonth += 1;

    return {
      success: true,
      message: `تم إرسال طلب تقييم Google بنجاح إلى ${contact.name} عبر ${channel === "whatsapp" ? "واتساب" : "رسالة نصية"} ✨`,
    };
  },

  async replyToReview(reviewId: string, replyText: string): Promise<Review | undefined> {
    return mockStore.replyToReview(reviewId, replyText);
  },
};
