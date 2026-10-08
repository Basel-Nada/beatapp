import { Appointment } from "@/types";
import { getHighLevelConfig, highLevelRequest } from "./client";
import { mockStore } from "./mock-store";

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
    startTime: string;
    endTime: string;
    status: string;
    assignedUserId?: string;
  }>;
}

export const CalendarsService = {
  async getAppointments(params?: { startDate?: string; endDate?: string; locationId?: string }): Promise<Appointment[]> {
    const config = getHighLevelConfig(params?.locationId);

    if (config.isDemoMode) {
      return mockStore.getAppointments();
    }

    try {
      const q = new URLSearchParams({
        locationId: config.locationId!,
      });
      if (params?.startDate) q.set("startTime", params.startDate);
      if (params?.endDate) q.set("endTime", params.endDate);

      const res = await highLevelRequest<GhlAppointmentsResponse>(
        `/calendars/events?${q.toString()}`,
        {},
        config.locationId
      );

      return (res.events || []).map((ev) => ({
        id: ev.id,
        calendarId: ev.calendarId,
        contactId: ev.contactId || "",
        contactName: ev.contact?.name || ev.title || "عميل غير معروف",
        contactPhone: ev.contact?.phone || "",
        service: ev.title || "استشارة تجميلية",
        startTime: ev.startTime,
        endTime: ev.endTime,
        status: ev.status === "confirmed" ? "confirmed" : "scheduled",
        staffName: "الفريق الطبي",
        locationId: config.locationId!,
      }));
    } catch {
      return mockStore.getAppointments();
    }
  },

  async createAppointment(data: Partial<Appointment>, locationId?: string): Promise<Appointment> {
    const config = getHighLevelConfig(locationId);

    if (config.isDemoMode) {
      return mockStore.createAppointment(data);
    }

    const payload = {
      calendarId: data.calendarId || process.env.HIGHLEVEL_DEFAULT_CALENDAR_ID,
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
      id: res.event.id,
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
