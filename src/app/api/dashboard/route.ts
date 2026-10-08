import { NextResponse } from "next/server";
import { ContactsService } from "@/services/highlevel/contacts";
import { ConversationsService } from "@/services/highlevel/conversations";
import { OpportunitiesService } from "@/services/highlevel/opportunities";
import { CalendarsService } from "@/services/highlevel/calendars";

export async function GET() {
  try {
    const [contacts, conversations, opportunities, appointments] = await Promise.all([
      ContactsService.getContacts(),
      ConversationsService.getConversations(),
      OpportunitiesService.getOpportunities(),
      CalendarsService.getAppointments(),
    ]);

    const newLeads = contacts.filter(c => c.status === "new");
    const needsFollowup = contacts.filter(
      c => c.tags.some(t => t.includes("متابعة")) || c.status === "interested"
    );
    const activeOpps = opportunities.filter(o => o.stageId !== "won" && o.stageId !== "lost");

    // Filter appointments for today
    const today = new Date().toDateString();
    const todayAppointments = appointments.filter(a => {
      try {
        return new Date(a.startTime).toDateString() === today;
      } catch {
        return true;
      }
    });

    return NextResponse.json({
      metrics: {
        newLeadsCount: newLeads.length,
        needsFollowupCount: needsFollowup.length,
        todayAppointmentsCount: todayAppointments.length > 0 ? todayAppointments.length : appointments.length,
        activeOpportunitiesCount: activeOpps.length,
      },
      recentConversations: conversations.slice(0, 5),
      todayAppointments: todayAppointments.length > 0 ? todayAppointments : appointments.slice(0, 5),
      needsFollowupLeads: needsFollowup.slice(0, 5),
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر تحميل لوحة المعلومات", details: err.message },
      { status: 500 }
    );
  }
}
