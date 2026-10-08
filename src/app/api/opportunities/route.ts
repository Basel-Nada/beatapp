import { NextRequest, NextResponse } from "next/server";
import { OpportunitiesService } from "@/services/highlevel/opportunities";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedPipelineId = searchParams.get("pipelineId") || undefined;

    const pipelines = await OpportunitiesService.getPipelines();
    
    // Choose active pipeline: either requested, or first pipeline
    const activePipeline = requestedPipelineId
      ? pipelines.find((p) => p.id === requestedPipelineId) || pipelines[0]
      : pipelines[0];

    const pipelineIdToUse = activePipeline?.id;
    const opportunities = await OpportunitiesService.getOpportunities({
      pipelineId: pipelineIdToUse,
    });

    return NextResponse.json({
      pipelines,
      activePipeline,
      stages: activePipeline?.stages || [],
      opportunities,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر تحميل المبيعات", details: err.message },
      { status: 500 }
    );
  }
}
