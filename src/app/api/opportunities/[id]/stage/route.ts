import { NextRequest, NextResponse } from "next/server";
import { OpportunitiesService } from "@/services/highlevel/opportunities";
import { z } from "zod";

const updateStageSchema = z.object({
  stageId: z.string().min(1, "معرف المرحلة مطلوب"),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = updateStageSchema.parse(body);

    const success = await OpportunitiesService.updateStage(
      params.id,
      validated.stageId
    );

    if (!success) {
      return NextResponse.json({ error: "تعذر تحديث مرحلة الصفقة" }, { status: 400 });
    }

    return NextResponse.json({ success: true, stageId: validated.stageId });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "مرحلة غير صالحة", issues: error.errors }, { status: 400 });
    }
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر تحديث المرحلة", details: err.message },
      { status: 500 }
    );
  }
}
