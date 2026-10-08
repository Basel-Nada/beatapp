import { NextRequest, NextResponse } from "next/server";
import { ConversationsService } from "@/services/highlevel/conversations";
import { z } from "zod";

const sendMessageSchema = z.object({
  body: z.string().min(1, "نص الرسالة مطلوب"),
  senderName: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    const body = await req.json();
    const validated = sendMessageSchema.parse(body);

    const message = await ConversationsService.sendMessage(
      params.id,
      validated.body,
      validated.senderName || "الاستقبال"
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
      { error: "تعذر إرسال الرسالة", details: err.message },
      { status: 500 }
    );
  }
}
