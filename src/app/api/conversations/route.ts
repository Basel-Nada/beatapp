import { NextResponse } from "next/server";
import { ConversationsService } from "@/services/highlevel/conversations";

export async function GET() {
  try {
    const conversations = await ConversationsService.getConversations();
    return NextResponse.json({ conversations });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر تحميل المحادثات", details: err.message },
      { status: 500 }
    );
  }
}
