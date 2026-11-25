import { NextRequest, NextResponse } from "next/server";
import { ConversationsService } from "@/services/highlevel/conversations";
import { getActingUser, ActingUser } from "@/lib/server/acting-user";
import { getConversationScope } from "@/lib/server/scope";
import { z } from "zod";

export const dynamic = "force-dynamic";

const sendMessageSchema = z.object({
  body: z.string().min(1, "نص الرسالة مطلوب"),
  contactId: z.string().optional(),
  senderName: z.string().optional(),
});

/** الموظف لا يستطيع فتح أو الرد على محادثة عميل غير مسند له */
async function canAccess(me: ActingUser, id: string): Promise<boolean> {
  if (!me.isStaff) return true;
  const scope = await getConversationScope(me);
  if (scope?.allowedContactIds?.has(id)) return true;
  const mine = await ConversationsService.getConversations(undefined, scope);
  return mine.some((c) => c.id === id);
}

const FORBIDDEN = NextResponse.json(
  { error: "هذه المحادثة غير مسندة لك. تواصل مع الإدارة لإسناد العميل إليك." },
  { status: 403 }
);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const me = await getActingUser(req);
    if (!(await canAccess(me, params.id))) return FORBIDDEN;
    const messages = await ConversationsService.getMessages(params.id);
    return NextResponse.json({ messages });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر تحميل الرسائل", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const me = await getActingUser(req);
    if (!(await canAccess(me, params.id))) return FORBIDDEN;

    const body = await req.json();
    const validated = sendMessageSchema.parse(body);

    const message = await ConversationsService.sendMessage(
      params.id,
      validated.body,
      validated.contactId,
      validated.senderName || me.name
    );

    return NextResponse.json({ message }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", issues: error.errors },
        { status: 400 }
      );
    }
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر إرسال الرسالة عبر BeatApp", details: err.message },
      { status: 500 }
    );
  }
}
