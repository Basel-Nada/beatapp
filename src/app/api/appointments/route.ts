import { NextRequest, NextResponse } from "next/server";
import { CalendarsService } from "@/services/highlevel/calendars";
import { z } from "zod";

const createAppointmentSchema = z.object({
  contactId: z.string().optional(),
  contactName: z.string().min(2, "اسم العميل مطلوب"),
  contactPhone: z.string().min(8, "رقم الهاتف مطلوب"),
  service: z.string().min(2, "الخدمة مطلوبة"),
  startTime: z.string().min(1, "وقت البداية مطلوب"),
  endTime: z.string().optional(),
  staffName: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const appointments = await CalendarsService.getAppointments({ startDate, endDate });
    return NextResponse.json({ appointments });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر تحميل المواعيد", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createAppointmentSchema.parse(body);

    const newAppointment = await CalendarsService.createAppointment(validated);
    return NextResponse.json({ appointment: newAppointment }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "بيانات غير صالحة", issues: error.errors }, { status: 400 });
    }
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر حجز الموعد", details: err.message },
      { status: 500 }
    );
  }
}
