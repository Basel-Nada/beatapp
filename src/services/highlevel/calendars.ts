import { Appointment } from "@/types";
import { getHighLevelConfig, highLevelRequest, clearApiCache } from "./client";
import { mockStore } from "./mock-store";
import { ContactsService } from "./contacts";
import { UsersService } from "./users";

export interface GhlCalendarItem {
  id: string;
  name: string;
  isActive: boolean;
  teamMembers?: Array<{ userId: string }>;
}

interface GhlCalendarsListResponse {
  calendars: GhlCalendarItem[];
}

interface GhlAppointmentsResponse {
  events: Array<{
    id: string;
    calendarId?: string;
    contactId?: string;
    contact?: {
      name?: string;
      phone?: string;
    };
    title?: string;
    startTime: string | number;
    endTime: string | number;
    status: string;
    appointmentStatus?: string;
    assignedUserId?: string;
    address?: string;
    notes?: string;
  }>;
}

export const CalendarsService = {
  async getCalendars(locationId?: string): Promise<GhlCalendarItem[]> {
    const config = getHighLevelConfig(locationId);
    if (config.isDemoMode) return [];

    try {
      const res = await highLevelRequest<GhlCalendarsListResponse>(
        `/calendars/?locationId=${config.locationId}`,
        { cacheTtlMs: 5 * 60 * 1000 },
        config.locationId
      );
      return res.calendars || [];
    } catch (e) {
      console.error("Failed to load calendars", e);
      return [];
    }
  },

  /** جلب الفترات والمواعيد الشاغرة (Free Slots) المتاحة للحجز في BeatApp */
  async getFreeSlots(params: {
    calendarId?: string;
    startDateMs: number;
    endDateMs: number;
    timezone?: string;
    locationId?: string;
  }): Promise<Record<string, { slots: string[] }>> {
    const config = getHighLevelConfig(params.locationId);
    if (config.isDemoMode) return {};

    const calendars = await this.getCalendars(config.locationId);
    const calendarId =
      params.calendarId ||
      calendars.find((c) => c.name.toLowerCase().includes("team") || c.name.toLowerCase().includes("beatapp"))?.id ||
      calendars.find((c) => c.isActive !== false)?.id ||
      "dahCW5WYQrER7B2Effmq";

    try {
      const q = new URLSearchParams({
        startDate: String(params.startDateMs),
        endDate: String(params.endDateMs),
      });
      if (params.timezone) q.set("timezone", params.timezone);

      const res = await highLevelRequest<Record<string, { slots: string[] }>>(
        `/calendars/${calendarId}/free-slots?${q.toString()}`,
        { cacheTtlMs: 30 * 1000 },
        config.locationId
      );
      return res || {};
    } catch (e) {
      console.warn("Failed to get free slots", e);
      return {};
    }
  },

  async getAppointments(params?: {
    startDate?: string;
    endDate?: string;
    locationId?: string;
    calendarId?: string;
    assignedUserId?: string;
    allowedContactIds?: Set<string>;
  }): Promise<Appointment[]> {
    const config = getHighLevelConfig(params?.locationId);

    if (config.isDemoMode) {
      return mockStore.getAppointments();
    }

    try {
      const calendars = await this.getCalendars(config.locationId);
      // استخدام تقويم الفريق الرئيسي أو التقويم المحدد
      const defaultTeamCalendar =
        calendars.find((c) => c.name.toLowerCase().includes("team") || c.name.toLowerCase().includes("beatapp"))?.id ||
        "dahCW5WYQrER7B2Effmq";

      const targetCalendarId = params?.calendarId || defaultTeamCalendar;

      const now = new Date();
      const startMs = params?.startDate
        ? new Date(params.startDate).getTime()
        : now.getTime() - 30 * 24 * 3600 * 1000;
      const endMs = params?.endDate
        ? new Date(params.endDate).getTime()
        : now.getTime() + 60 * 24 * 3600 * 1000;

      const q = new URLSearchParams({
        locationId: config.locationId!,
        calendarId: targetCalendarId,
        startTime: String(startMs),
        endTime: String(endMs),
      });

      const res = await highLevelRequest<GhlAppointmentsResponse>(
        `/calendars/events?${q.toString()}`,
        { cacheTtlMs: 10 * 1000 },
        config.locationId
      );

      const users = await UsersService.getUsers().catch(() => []);
      const userNameMap = new Map(users.map((u) => [u.id, u.name]));
      const calNameMap = new Map(calendars.map((c) => [c.id, c.name]));

      let raw = res.events || [];

      // إذا كان موظف مبيعات/استقبال، يرى المواعيد المسندة له أو لعملائه
      if (params?.assignedUserId) {
        raw = raw.filter(
          (ev) =>
            ev.assignedUserId === params.assignedUserId ||
            (ev.contactId && params.allowedContactIds?.has(ev.contactId))
        );
      }

      return raw.map((ev) => {
        const startTimeStr =
          typeof ev.startTime === "number" ? new Date(ev.startTime).toISOString() : String(ev.startTime);
        const endTimeStr =
          typeof ev.endTime === "number" ? new Date(ev.endTime).toISOString() : String(ev.endTime);

        const statusLower = (ev.appointmentStatus || ev.status || "").toLowerCase();
        const status: Appointment["status"] =
          statusLower.includes("confirm") || statusLower.includes("book")
            ? "confirmed"
            : statusLower.includes("cancel")
            ? "cancelled"
            : statusLower.includes("show")
            ? "showed"
            : "scheduled";

        return {
          id: ev.id,
          calendarId: ev.calendarId || targetCalendarId,
          calendarName: (ev.calendarId && calNameMap.get(ev.calendarId)) || "تقويم الفريق",
          contactId: ev.contactId || "",
          contactName: ev.contact?.name || ev.title || "عميل BeatApp",
          contactPhone: ev.contact?.phone || "",
          service: ev.title || "استشارة تجميلية / معاينة",
          startTime: startTimeStr,
          endTime: endTimeStr,
          status,
          assignedUserId: ev.assignedUserId,
          staffName: (ev.assignedUserId && userNameMap.get(ev.assignedUserId)) || "فريق العمل",
          notes: ev.notes,
          locationId: config.locationId!,
        };
      });
    } catch (e) {
      console.error("Failed to load appointments from BeatApp", e);
      return [];
    }
  },

  /**
   * إنشاء موعد جديد في تقويم BeatApp الحقيقي وتوثيقه في سجل العميل
   */
  async createAppointment(
    data: {
      contactId?: string;
      contactName?: string;
      contactPhone?: string;
      service: string;
      startTime: string;
      endTime?: string;
      calendarId?: string;
      assignedUserId?: string;
      staffName?: string;
      notes?: string;
    },
    locationId?: string
  ): Promise<Appointment> {
    const config = getHighLevelConfig(locationId);

    // 1. التأكد من وجود العميل في BeatApp أو إنشائه فوراً
    let targetContactId = data.contactId;

    if (!targetContactId || targetContactId.startsWith("cnt-")) {
      // بحث بالهاتف أو الاسم
      if (data.contactPhone || data.contactName) {
        const query = data.contactPhone || data.contactName;
        const found = await ContactsService.getContacts({ search: query, locationId }).catch(() => []);
        if (found.length > 0) {
          targetContactId = found[0].id;
        } else if (data.contactName) {
          // إنشاء عميل جديد في BeatApp
          const createdContact = await ContactsService.createContact(
            {
              name: data.contactName,
              phone: data.contactPhone || "",
              serviceInterest: data.service,
              assignedToId: data.assignedUserId,
              assignedStaff: data.staffName,
              tags: ["BeatApp", "حجز موعد", data.service],
            },
            locationId
          );
          targetContactId = createdContact.id;
        }
      }
    }

    if (!targetContactId) {
      throw new Error("يرجى تحديد أو تسجيل العميل أولاً لربط الموعد به في BeatApp");
    }

    // 2. اختيار التقويم المناسب في BeatApp
    const calendars = await this.getCalendars(config.locationId);
    let chosenCalendarId = data.calendarId;

    if (!chosenCalendarId) {
      // تفضيل تقويم الفريق المشترك أولاً
      const teamCal = calendars.find(
        (c) => c.name.toLowerCase().includes("team") || c.name.toLowerCase().includes("beatapp")
      );
      chosenCalendarId = teamCal?.id || calendars.find((c) => c.isActive !== false)?.id || "dahCW5WYQrER7B2Effmq";
    }

    const startIso = new Date(data.startTime).toISOString();
    const endIso = data.endTime
      ? new Date(data.endTime).toISOString()
      : new Date(new Date(data.startTime).getTime() + 30 * 60 * 1000).toISOString();

    const payload: Record<string, unknown> = {
      calendarId: chosenCalendarId,
      locationId: config.locationId,
      contactId: targetContactId,
      startTime: startIso,
      endTime: endIso,
      title: data.service,
      appointmentStatus: "confirmed",
    };

    if (data.assignedUserId) {
      payload.assignedUserId = data.assignedUserId;
    }

    const res = await highLevelRequest<{
      id?: string;
      event?: { id: string };
      appointmentStatus?: string;
      address?: string;
    }>(
      "/calendars/events/appointments",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      config.locationId
    );

    clearApiCache();

    const appointmentId = res.id || res.event?.id || `apt-${Date.now()}`;

    // إضافة ملاحظة في سجل العميل لتوثيق الموعد
    const noteText = `🗓️ تم تأكيد موعد جديد في تقويم BeatApp: ${data.service}\nالتاريخ: ${new Date(startIso).toLocaleString("ar-SA")}${data.notes ? `\nملاحظات: ${data.notes}` : ""}`;
    ContactsService.addNote(targetContactId, noteText, data.staffName || "نظام المواعيد", locationId).catch(() => {});

    return {
      id: appointmentId,
      calendarId: chosenCalendarId,
      contactId: targetContactId,
      contactName: data.contactName || "عميل BeatApp",
      contactPhone: data.contactPhone || "",
      service: data.service,
      startTime: startIso,
      endTime: endIso,
      status: "confirmed",
      assignedUserId: data.assignedUserId,
      staffName: data.staffName || "فريق العمل",
      notes: data.notes,
      locationId: config.locationId!,
    };
  },
};
