import { NextRequest, NextResponse } from "next/server";
import { ContactsService } from "@/services/highlevel/contacts";
import { ConversationsService } from "@/services/highlevel/conversations";
import { OpportunitiesService } from "@/services/highlevel/opportunities";
import { CalendarsService } from "@/services/highlevel/calendars";
import { getActingUser } from "@/lib/server/acting-user";
import { getConversationScope } from "@/lib/server/scope";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const me = await getActingUser(req);
    const scope = await getConversationScope(me);
    const locationId =
      req.headers.get("x-beatapp-location-id") ||
      req.nextUrl.searchParams.get("locationId") ||
      undefined;

    const [contacts, conversations, opportunities, appointments] = await Promise.all([
      ContactsService.getContacts({
        assignedTo: me.isStaff ? me.id : undefined,
        locationId,
      }),
      ConversationsService.getConversations(locationId, scope),
      OpportunitiesService.getOpportunities({
        locationId,
        assignedTo: me.isStaff ? me.id : undefined,
        allowedContactIds: scope?.allowedContactIds,
      }),
      CalendarsService.getAppointments({
        locationId,
        assignedUserId: me.isStaff ? me.id : undefined,
        allowedContactIds: scope?.allowedContactIds,
      }),
    ]);

    const newLeads = contacts.filter((c) => c.status === "new");
    let needsFollowup = contacts.filter(
      (c) => c.tags.some((t) => t.includes("متابعة")) || c.status === "interested"
    );
    if (needsFollowup.length === 0 && contacts.length > 0) {
      needsFollowup = contacts.slice(0, 5);
    }
    const activeOpps = opportunities.filter((o) => o.stageId !== "won" && o.stageId !== "lost");

    // Filter appointments for today
    const today = new Date().toDateString();
    const todayAppointments = appointments.filter((a) => {
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
        todayAppointmentsCount:
          todayAppointments.length > 0 ? todayAppointments.length : appointments.length,
        activeOpportunitiesCount: activeOpps.length,
      },
      recentConversations: conversations.slice(0, 5),
      todayAppointments: todayAppointments.length > 0 ? todayAppointments : appointments.slice(0, 5),
      needsFollowupLeads: needsFollowup.slice(0, 5),
      scope: me.isStaff ? "mine" : "all",
      user: {
        id: me.id,
        name: me.name,
        role: me.role,
        isStaff: me.isStaff,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر تحميل لوحة المعلومات", details: err.message },
      { status: 500 }
    );
  }
}
