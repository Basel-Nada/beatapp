import { NextRequest, NextResponse } from "next/server";
import { CalendarsService } from "@/services/highlevel/calendars";
import { getActingUser } from "@/lib/server/acting-user";
import { getConversationScope } from "@/lib/server/scope";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createAppointmentSchema = z.object({
  contactId: z.string().nullish().transform((val) => val || undefined),
  contactName: z.string().min(1, "اسم العميل مطلوب"),
  contactPhone: z.string().nullish().transform((val) => val || ""),
  service: z.string().min(1, "الخدمة مطلوبة"),
  startTime: z.string().min(1, "وقت البداية مطلوب"),
  endTime: z.string().nullish().transform((val) => val || undefined),
  staffName: z.string().nullish().transform((val) => val || undefined),
  assignedUserId: z.string().nullish().transform((val) => val || undefined),
  notes: z.string().nullish().transform((val) => val || ""),
  calendarId: z.string().nullish().transform((val) => val || undefined),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const calendarId = searchParams.get("calendarId") || undefined;

    // طلب الفترات الشاغرة (Free Slots)
    if (action === "slots") {
      const startMs = Number(searchParams.get("startDateMs")) || Date.now();
      const endMs = Number(searchParams.get("endDateMs")) || startMs + 7 * 24 * 3600 * 1000;
      const timezone = searchParams.get("timezone") || "Asia/Riyadh";
      const slots = await CalendarsService.getFreeSlots({
        calendarId,
        startDateMs: startMs,
        endDateMs: endMs,
        timezone,
      });
      return NextResponse.json({ slots });
    }

    // جلب قائمة التقاويم
    if (action === "calendars") {
      const calendars = await CalendarsService.getCalendars();
      return NextResponse.json({ calendars });
    }

    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const me = await getActingUser(req);
    const scope = await getConversationScope(me);

    const appointments = await CalendarsService.getAppointments({
      startDate,
      endDate,
      calendarId,
      assignedUserId: me.isStaff ? me.id : undefined,
      allowedContactIds: scope?.allowedContactIds,
    });

    return NextResponse.json({
      appointments,
      scope: me.isStaff ? "mine" : "all",
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر تحميل المواعيد من BeatApp", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createAppointmentSchema.parse(body);
    const me = await getActingUser(req);

    // الموظف المسؤول عن الموعد
    const assignedUserId = me.isStaff ? me.id : validated.assignedUserId || me.beatappUserId;
    const staffName = me.isStaff ? me.name : validated.staffName || me.name;

    const newAppointment = await CalendarsService.createAppointment({
      ...validated,
      assignedUserId,
      staffName,
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم تثبيت الموعد بنجاح في تقويم BeatApp الحقيقي",
        appointment: newAppointment,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const errorMsg = error.errors.map((e) => e.message).join("، ");
      return NextResponse.json({ error: `بيانات غير صالحة: ${errorMsg}`, issues: error.errors }, { status: 400 });
    }
    const err = error as Error & { statusCode?: number };
    return NextResponse.json(
      {
        error: err.message || "تعذر حجز الموعد في BeatApp",
        hint: "يرجى التأكد من اختيار موعد يقع ضمن ساعات العمل الرسمية للعيادة / المركز في BeatApp.",
      },
      { status: err.statusCode && err.statusCode < 500 ? err.statusCode : 400 }
    );
  }
}
