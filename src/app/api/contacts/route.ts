import { NextRequest, NextResponse } from "next/server";
import { ContactsService } from "@/services/highlevel/contacts";
import { z } from "zod";

const createContactSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().min(8, "رقم الهاتف غير صحيح"),
  email: z.string().email("البريد الإلكتروني غير صالح").optional().or(z.literal("")),
  serviceInterest: z.string().optional(),
  assignedStaff: z.string().optional(),
  leadSource: z.string().optional(),
  status: z.enum(["new", "contacted", "interested", "booked", "customer", "inactive"]).optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const filter = searchParams.get("filter") || undefined;

    const contacts = await ContactsService.getContacts({ search, filter });
    return NextResponse.json({ contacts });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر تحميل العملاء", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createContactSchema.parse(body);

    const newContact = await ContactsService.createContact(validated);
    return NextResponse.json({ contact: newContact }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", issues: error.errors },
        { status: 400 }
      );
    }
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر إنشاء العميل", details: err.message },
      { status: 500 }
    );
  }
}
