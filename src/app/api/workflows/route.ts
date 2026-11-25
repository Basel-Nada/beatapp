import { NextRequest, NextResponse } from "next/server";
import { WorkflowsService } from "@/services/highlevel/workflows";

export async function GET(_req: NextRequest) {
  try {
    const workflows = await WorkflowsService.getWorkflows();
    return NextResponse.json({ workflows });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر جلب مسارات الأتمتة", details: err.message },
      { status: 500 }
    );
  }
}
