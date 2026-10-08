import { NextRequest, NextResponse } from "next/server";
import { OpportunitiesService } from "@/services/highlevel/opportunities";
import { PipelineStageId } from "@/types";
import { z } from "zod";

const updateStageSchema = z.object({
  stageId: z.enum([
    "new_lead",
    "contacted",
    "interested",
    "consultation_booked",
    "treatment_scheduled",
    "won",
    "lost",
  ]),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = updateStageSchema.parse(body);

    const updated = await OpportunitiesService.updateStage(
      params.id,
      validated.stageId as PipelineStageId
    );

    if (!updated) {
      return NextResponse.json({ error: "تعذر تحديث مرحلة الصفقة" }, { status: 400 });
    }

    return NextResponse.json({ opportunity: updated });
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
