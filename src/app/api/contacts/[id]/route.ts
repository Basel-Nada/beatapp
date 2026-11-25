import { NextRequest, NextResponse } from "next/server";
import { ContactsService } from "@/services/highlevel/contacts";
import { getActingUser } from "@/lib/server/acting-user";
import { z } from "zod";

export const dynamic = "force-dynamic";

const addNoteSchema = z.object({
  body: z.string().min(1, "نص الملاحظة مطلوب"),
  authorName: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contact = await ContactsService.getContactById(params.id);
    if (!contact) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }
    const me = await getActingUser(req);
    if (me.isStaff && contact.assignedToId !== me.id) {
      return NextResponse.json(
        { error: "هذا العميل غير مسند لك. تواصل مع الإدارة لإسناده إليك." },
        { status: 403 }
      );
    }
    return NextResponse.json({ contact });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر تحميل بيانات العميل", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const json = await req.json();
    const validated = addNoteSchema.parse(json);

    await ContactsService.addNote(params.id, validated.body, validated.authorName || (await getActingUser(req)).name);
    const updatedContact = await ContactsService.getContactById(params.id);
    return NextResponse.json({ success: true, contact: updatedContact });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "بيانات غير صالحة", issues: error.errors }, { status: 400 });
    }
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر إضافة الملاحظة", details: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const json = await req.json();
    const aestheticProfile = json.aestheticProfile;
    if (!aestheticProfile) {
      return NextResponse.json({ error: "البيانات الإكلينيكية مطلوبة" }, { status: 400 });
    }

    const updatedContact = await ContactsService.updateAestheticProfile(params.id, aestheticProfile);
    return NextResponse.json({ success: true, contact: updatedContact });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر تحديث الملف التجميلي للعميل", details: err.message },
      { status: 500 }
    );
  }
}
