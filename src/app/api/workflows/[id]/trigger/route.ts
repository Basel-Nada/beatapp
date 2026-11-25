import { NextRequest, NextResponse } from "next/server";
import { WorkflowsService } from "@/services/highlevel/workflows";
import { z } from "zod";

const triggerSchema = z.object({
  contactId: z.string().min(1, "معرف العميل مطلوب"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = triggerSchema.parse(body);

    const result = await WorkflowsService.triggerWorkflowForContact(params.id, validated.contactId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", issues: error.errors },
        { status: 400 }
      );
    }
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر تشغيل مسار الأتمتة", details: err.message },
      { status: 500 }
    );
  }
}
