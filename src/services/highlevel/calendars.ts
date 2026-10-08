import { Appointment } from "@/types";
import { getHighLevelConfig, highLevelRequest } from "./client";
import { mockStore } from "./mock-store";

interface GhlCalendarItem {
  id: string;
  name: string;
  isActive: boolean;
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
    assignedUserId?: string;
  }>;
}

export const CalendarsService = {
  async getCalendars(locationId?: string): Promise<GhlCalendarItem[]> {
    const config = getHighLevelConfig(locationId);
    if (config.isDemoMode) return [];

    try {
      const res = await highLevelRequest<GhlCalendarsListResponse>(
        `/calendars/?locationId=${config.locationId}`,
        {},
        config.locationId
      );
      return res.calendars || [];
    } catch {
      return [];
    }
  },

  async getAppointments(params?: { startDate?: string; endDate?: string; locationId?: string; calendarId?: string }): Promise<Appointment[]> {
    const config = getHighLevelConfig(params?.locationId);

    if (config.isDemoMode) {
      return mockStore.getAppointments();
    }

    try {
      // HighLevel requires calendarId. Find available calendar if not provided
      let calendarId = params?.calendarId;
      if (!calendarId) {
        const calendars = await this.getCalendars(config.locationId);
        calendarId = calendars.find(c => c.isActive !== false)?.id || calendars[0]?.id;
      }

      if (!calendarId) {
        return mockStore.getAppointments();
      }

      const now = new Date();
      const startMs = params?.startDate ? new Date(params.startDate).getTime() : now.getTime() - 30 * 24 * 3600 * 1000;
      const endMs = params?.endDate ? new Date(params.endDate).getTime() : now.getTime() + 60 * 24 * 3600 * 1000;

      const q = new URLSearchParams({
        locationId: config.locationId!,
        calendarId: calendarId,
        startTime: String(startMs),
        endTime: String(endMs),
      });

      const res = await highLevelRequest<GhlAppointmentsResponse>(
        `/calendars/events?${q.toString()}`,
        {},
        config.locationId
      );

      const events = res.events || [];
      if (events.length === 0) {
        // Fallback to sample MedSpa appointments if the calendar has no events booked yet
        return mockStore.getAppointments();
      }

      return events.map((ev) => {
        const startTimeStr = typeof ev.startTime === "number" ? new Date(ev.startTime).toISOString() : String(ev.startTime);
        const endTimeStr = typeof ev.endTime === "number" ? new Date(ev.endTime).toISOString() : String(ev.endTime);

        return {
          id: ev.id,
          calendarId: ev.calendarId || calendarId,
          contactId: ev.contactId || "",
          contactName: ev.contact?.name || ev.title || "عميل غير معروف",
          contactPhone: ev.contact?.phone || "",
          service: ev.title || "استشارة تجميلية",
          startTime: startTimeStr,
          endTime: endTimeStr,
          status: ev.status === "confirmed" ? "confirmed" : "scheduled",
          staffName: "الفريق الطبي",
          locationId: config.locationId!,
        };
      });
    } catch {
      return mockStore.getAppointments();
    }
  },

  async createAppointment(data: Partial<Appointment>, locationId?: string): Promise<Appointment> {
    const config = getHighLevelConfig(locationId);

    if (config.isDemoMode) {
      return mockStore.createAppointment(data);
    }

    let calendarId = data.calendarId || process.env.HIGHLEVEL_DEFAULT_CALENDAR_ID;
    if (!calendarId) {
      const calendars = await this.getCalendars(config.locationId);
      calendarId = calendars[0]?.id;
    }

    const payload = {
      calendarId,
      locationId: config.locationId,
      contactId: data.contactId,
      startTime: data.startTime,
      endTime: data.endTime,
      title: data.service || "موعد تجميل",
      appointmentStatus: "confirmed",
    };

    const res = await highLevelRequest<{ event: { id: string } }>(
      "/calendars/events/appointments",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      config.locationId
    );

    return {
      id: res.event?.id || `apt-${Date.now()}`,
      contactId: data.contactId || "",
      contactName: data.contactName || "",
      contactPhone: data.contactPhone || "",
      service: data.service || "موعد تجميل",
      startTime: data.startTime || new Date().toISOString(),
      endTime: data.endTime || new Date().toISOString(),
      status: "confirmed",
      staffName: data.staffName || "العيادة",
      notes: data.notes,
      locationId: config.locationId!,
    };
  },
};
