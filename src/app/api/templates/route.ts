import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "@/services/highlevel/mock-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const industry = searchParams.get("industry") || undefined;
    const search = searchParams.get("search") || undefined;

    const templates = mockStore.getWhatsAppTemplates(industry, search);
    return NextResponse.json({ templates });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      const template = mockStore.createWhatsAppTemplate(body.template);
      return NextResponse.json({ success: true, template });
    }

    if (action === "update") {
      const { id, data } = body;
      const template = mockStore.updateWhatsAppTemplate(id, data);
      if (!template) {
        return NextResponse.json({ error: "القالب غير موجود" }, { status: 404 });
      }
      return NextResponse.json({ success: true, template });
    }

    if (action === "delete") {
      const { id } = body;
      const ok = mockStore.deleteWhatsAppTemplate(id);
      return NextResponse.json({ success: ok });
    }

    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
