import { NextRequest, NextResponse } from "next/server";
import { OpportunitiesService } from "@/services/highlevel/opportunities";

export async function GET() {
  try {
    const opportunities = await OpportunitiesService.getOpportunities();
    const stages = OpportunitiesService.getPipelineStages();

    return NextResponse.json({ opportunities, stages });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر تحميل المبيعات", details: err.message },
      { status: 500 }
    );
  }
}
