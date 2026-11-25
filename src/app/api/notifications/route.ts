import { NextRequest, NextResponse } from "next/server";
import { ConversationsService } from "@/services/highlevel/conversations";
import { CalendarsService } from "@/services/highlevel/calendars";
import { ContactsService } from "@/services/highlevel/contacts";
import { OpportunitiesService } from "@/services/highlevel/opportunities";
import { InvoicesService } from "@/services/highlevel/invoices";
import { TasksService } from "@/services/highlevel/tasks";

export interface ApiNotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  rawDate: string;
  isRead: boolean;
  type: "lead" | "appointment" | "message" | "alert";
  linkUrl: string;
}

function formatRelativeArabicTime(isoDate?: string): string {
  if (!isoDate) return "الآن";
  try {
    const time = new Date(isoDate).getTime();
    if (isNaN(time)) return "مؤخراً";
    const diff = Date.now() - time;
    if (diff < 0) {
      // Future date
      const futureHours = Math.floor(Math.abs(diff) / (1000 * 3600));
      if (futureHours < 24) return `خلال ${futureHours} ساعة`;
      const futureDays = Math.floor(futureHours / 24);
      return `خلال ${futureDays} يوم`;
    }
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "الآن";
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "أمس";
    if (days < 7) return `منذ ${days} أيام`;
    return new Date(isoDate).toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
  } catch {
    return "مؤخراً";
  }
}

function formatArabicTime(isoDate?: string): string {
  if (!isoDate) return "";
  try {
    const d = new Date(isoDate);
    return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function isToday(isoDate?: string): boolean {
  if (!isoDate) return false;
  try {
    const d = new Date(isoDate);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId") || undefined;

    // Fetch real data from all core services in parallel
    const [convRes, aptRes, oppRes, invRes, cntRes, tskRes] = await Promise.allSettled([
      ConversationsService.getConversations(locationId),
      CalendarsService.getAppointments({ locationId }),
      OpportunitiesService.getOpportunities({ locationId }),
      InvoicesService.getInvoices({ locationId }),
      ContactsService.getContacts({ locationId }),
      TasksService.getTasks(undefined, locationId),
    ]);

    const notifications: ApiNotificationItem[] = [];

    // 1. Conversations (Unread or recent inbound WhatsApp messages)
    if (convRes.status === "fulfilled" && Array.isArray(convRes.value)) {
      for (const conv of convRes.value) {
        const isUnread = (conv.unreadCount || 0) > 0;
        const isInbound = conv.lastMessageDirection === "inbound";
        const messageDate = conv.lastMessageDate || new Date().toISOString();
        const diffHours = (Date.now() - new Date(messageDate).getTime()) / (1000 * 3600);

        if (isUnread || (isInbound && diffHours < 72)) {
          let preview = conv.lastMessageBody || "رسالة واردة عبر واتساب";
          if (preview.length > 80) preview = preview.substring(0, 77) + "...";

          notifications.push({
            id: `notif-msg-${conv.id}`,
            title: isUnread
              ? `رسالة غير مقروءة: ${conv.contactName}`
              : `رسالة جديدة من ${conv.contactName}`,
            description: preview,
            timestamp: formatRelativeArabicTime(messageDate),
            rawDate: messageDate,
            isRead: false,
            type: "message",
            linkUrl: `/conversations`,
          });
        }
      }
    }

    // 2. Appointments (Today's clinic appointments or upcoming next 24h)
    if (aptRes.status === "fulfilled" && Array.isArray(aptRes.value)) {
      for (const apt of aptRes.value) {
        const aptDate = apt.startTime;
        const diffHours = (new Date(aptDate).getTime() - Date.now()) / (1000 * 3600);

        // Include today's appointments or upcoming in next 48 hours
        if (isToday(aptDate) || (diffHours >= -2 && diffHours <= 48)) {
          const timeStr = formatArabicTime(aptDate);
          const isTodayApt = isToday(aptDate);

          notifications.push({
            id: `notif-apt-${apt.id}`,
            title: isTodayApt ? `موعد اليوم: ${apt.contactName}` : `موعد قادم: ${apt.contactName}`,
            description: `${apt.service}${timeStr ? ` الساعة ${timeStr}` : ""}${apt.staffName ? ` مع ${apt.staffName}` : ""}`,
            timestamp: isTodayApt ? `اليوم ${timeStr}` : formatRelativeArabicTime(aptDate),
            rawDate: aptDate,
            isRead: false,
            type: "appointment",
            linkUrl: `/appointments`,
          });
        }
      }
    }

    // 3. Clinical Profile / Intake Forms Completed
    if (cntRes.status === "fulfilled" && Array.isArray(cntRes.value)) {
      for (const cnt of cntRes.value) {
        if (cnt.aestheticProfile && Object.keys(cnt.aestheticProfile).length > 0) {
          const profileDate = cnt.updatedAt || cnt.createdAt || new Date().toISOString();
          const diffHours = (Date.now() - new Date(profileDate).getTime()) / (1000 * 3600);

          if (diffHours < 168) { // within past 7 days
            const skinType = cnt.aestheticProfile.skinType ? `نوع البشرة (${cnt.aestheticProfile.skinType})` : "";
            notifications.push({
              id: `notif-intake-${cnt.id}`,
              title: `استبيان طبي مكتمل: ${cnt.name}`,
              description: `تمت تعبئة استبيان تقييم البشرة والتاريخ الطبي الإلكتروني ${skinType}`,
              timestamp: formatRelativeArabicTime(profileDate),
              rawDate: profileDate,
              isRead: false,
              type: "lead",
              linkUrl: `/contacts/${cnt.id}`,
            });
          }
        }
      }
    }

    // 4. Opportunities (New leads in pipeline)
    if (oppRes.status === "fulfilled" && Array.isArray(oppRes.value)) {
      for (const opp of oppRes.value) {
        const oppDate = opp.createdAt || opp.lastActivityDate || new Date().toISOString();
        const diffHours = (Date.now() - new Date(oppDate).getTime()) / (1000 * 3600);

        if (opp.stageId === "new_lead" && diffHours < 96) {
          notifications.push({
            id: `notif-opp-${opp.id}`,
            title: `عميل محتمل جديد: ${opp.contactName}`,
            description: `مهتم بخدمة ${opp.service || "استشارة تجميلية"} (القيمة: ${opp.monetaryValue} ر.س)`,
            timestamp: formatRelativeArabicTime(oppDate),
            rawDate: oppDate,
            isRead: false,
            type: "lead",
            linkUrl: `/opportunities`,
          });
        }
      }
    }

    // 5. Invoices (Pending payment)
    if (invRes.status === "fulfilled" && Array.isArray(invRes.value)) {
      for (const inv of invRes.value) {
        if (inv.status === "pending") {
          notifications.push({
            id: `notif-inv-${inv.id}`,
            title: `فاتورة بانتظار التحصيل: ${inv.contactName}`,
            description: `المبلغ المطلوب: ${inv.amount} ${inv.currency || "ر.س"} (${inv.invoiceNumber})`,
            timestamp: formatRelativeArabicTime(inv.createdAt),
            rawDate: inv.createdAt,
            isRead: false,
            type: "alert",
            linkUrl: `/invoices`,
          });
        }
      }
    }

    // 6. Clinical Tasks (Due soon or overdue follow-ups)
    if (tskRes.status === "fulfilled" && Array.isArray(tskRes.value)) {
      for (const tsk of tskRes.value) {
        if (!tsk.completed) {
          const dueTime = new Date(tsk.dueDate).getTime();
          const diffHours = (dueTime - Date.now()) / (1000 * 3600);

          // Overdue or due within 48 hours
          if (diffHours <= 48) {
            notifications.push({
              id: `notif-tsk-${tsk.id}`,
              title: diffHours < 0 ? `مهمة متابعة متأخرة!` : `مهمة متابعة سريرية مستحقة`,
              description: `${tsk.title} (المسؤول: ${tsk.assignedTo || "العيادة"})`,
              timestamp: formatRelativeArabicTime(tsk.dueDate),
              rawDate: tsk.dueDate,
              isRead: false,
              type: "alert",
              linkUrl: `/contacts/${tsk.contactId}`,
            });
          }
        }
      }
    }

    // Deduplicate by ID
    const seenIds = new Set<string>();
    const uniqueNotifications = notifications.filter((item) => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });

    // Sort by rawDate descending (newest first)
    uniqueNotifications.sort((a, b) => {
      const timeA = new Date(a.rawDate).getTime() || 0;
      const timeB = new Date(b.rawDate).getTime() || 0;
      return timeB - timeA;
    });

    // Cap at top 20 notifications for clean and fast rendering
    const results = uniqueNotifications.slice(0, 20);

    return NextResponse.json({
      notifications: results,
      total: results.length,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر تحميل التنبيهات المباشرة", details: err.message, notifications: [] },
      { status: 500 }
    );
  }
}
