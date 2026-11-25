import { NextRequest, NextResponse } from "next/server";
import { ConversationsService } from "@/services/highlevel/conversations";
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
    const conversations = await ConversationsService.getConversations(locationId, scope);
    return NextResponse.json({ conversations, scope: me.isStaff ? "mine" : "all" });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر تحميل المحادثات", details: err.message },
      { status: 500 }
    );
  }
}
