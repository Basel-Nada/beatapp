import { NextRequest, NextResponse } from "next/server";
import { ContactsService } from "@/services/highlevel/contacts";
import { UsersService } from "@/services/highlevel/users";
import { getActingUser } from "@/lib/server/acting-user";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createContactSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().min(8, "رقم الهاتف غير صحيح"),
  email: z.string().email("البريد الإلكتروني غير صالح").optional().or(z.literal("")),
  serviceInterest: z.string().optional(),
  assignedStaff: z.string().optional(),
  assignedToId: z.string().optional(),
  leadSource: z.string().optional(),
  status: z.enum(["new", "contacted", "interested", "booked", "customer", "inactive"]).optional(),
  tags: z.array(z.string()).optional(),
});

const assignSchema = z.object({
  contactIds: z.array(z.string()).min(1),
  userId: z.string().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const filter = searchParams.get("filter") || undefined;
    const locationId =
      req.headers.get("x-beatapp-location-id") ||
      searchParams.get("locationId") ||
      undefined;
    const me = await getActingUser(req);

    // الموظف يرى فقط العملاء المسندين له في BeatApp
    const contacts = await ContactsService.getContacts({
      search,
      filter,
      locationId,
      assignedTo: me.isStaff ? me.id : undefined,
    });
    return NextResponse.json({ contacts, scope: me.isStaff ? "mine" : "all" });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر تحميل العملاء من BeatApp", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createContactSchema.parse(body);
    const me = await getActingUser(req);

    // تحديد الموظف المسؤول:
    // - الموظف: يُسند العميل له تلقائياً ولا يستطيع تغييره
    // - الأدمن: يختار أي موظف (بالمعرّف أو بالاسم)
    let assignedToId: string | undefined;
    if (me.isStaff) {
      assignedToId = me.id;
    } else if (validated.assignedToId) {
      assignedToId = validated.assignedToId;
    } else if (validated.assignedStaff) {
      const users = await UsersService.getUsers();
      assignedToId = users.find((u) => u.name === validated.assignedStaff)?.id;
    } else if (me.beatappUserId) {
      assignedToId = me.beatappUserId;
    }

    const newContact = await ContactsService.createContact({ ...validated, assignedToId });
    return NextResponse.json({ contact: newContact }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة: " + error.errors.map((e) => e.message).join("، "), issues: error.errors },
        { status: 400 }
      );
    }
    const err = error as Error & { statusCode?: number };
    return NextResponse.json(
      { error: err.message || "تعذر إنشاء العميل في BeatApp" },
      { status: err.statusCode && err.statusCode < 500 ? err.statusCode : 500 }
    );
  }
}

/** إسناد عميل أو أكثر لموظف (للأدمن فقط) */
export async function PATCH(req: NextRequest) {
  try {
    const me = await getActingUser(req);
    if (!me.isAdmin) {
      return NextResponse.json({ error: "إسناد العملاء متاح للإدارة فقط" }, { status: 403 });
    }
    const { contactIds, userId } = assignSchema.parse(await req.json());
    const results = await Promise.allSettled(
      contactIds.map((id) => ContactsService.assignContact(id, userId))
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    return NextResponse.json({
      success: failed === 0,
      updated: contactIds.length - failed,
      failed,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
