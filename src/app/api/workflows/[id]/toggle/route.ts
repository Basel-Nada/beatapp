import { NextRequest, NextResponse } from "next/server";
import { WorkflowsService } from "@/services/highlevel/workflows";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updated = await WorkflowsService.toggleWorkflow(params.id);
    if (!updated) {
      return NextResponse.json({ error: "مسار العمل غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ success: true, workflow: updated });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر تحديث حالة مسار العمل", details: err.message },
      { status: 500 }
    );
  }
}
