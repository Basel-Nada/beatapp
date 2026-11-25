import { NextRequest, NextResponse } from "next/server";
import { OpportunitiesService } from "@/services/highlevel/opportunities";
import { getActingUser } from "@/lib/server/acting-user";
import { getConversationScope } from "@/lib/server/scope";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedPipelineId = searchParams.get("pipelineId") || undefined;
    const me = await getActingUser(req);
    const scope = await getConversationScope(me);

    const pipelines = await OpportunitiesService.getPipelines();

    // Choose active pipeline: either requested, or pipeline with active opportunities, or first pipeline
    const activePipeline = requestedPipelineId
      ? pipelines.find((p) => p.id === requestedPipelineId) || pipelines[0]
      : pipelines.find((p) => p.name.toLowerCase().includes("sales")) || pipelines[0];

    const pipelineIdToUse = activePipeline?.id;
    const opportunities = await OpportunitiesService.getOpportunities({
      pipelineId: pipelineIdToUse,
      assignedTo: me.isStaff ? me.id : undefined,
      allowedContactIds: scope?.allowedContactIds,
    });

    return NextResponse.json({
      pipelines,
      activePipeline,
      stages: activePipeline?.stages || [],
      opportunities,
      scope: me.isStaff ? "mine" : "all",
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر تحميل المبيعات", details: err.message },
      { status: 500 }
    );
  }
}
