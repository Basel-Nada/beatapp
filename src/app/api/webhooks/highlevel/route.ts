import { NextRequest, NextResponse } from "next/server";
import { WebhooksService } from "@/services/highlevel/webhooks";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const result = await WebhooksService.processEvent(payload);

    return NextResponse.json({
      received: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "Webhook processing failed", details: err.message },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    endpoint: "/api/webhooks/highlevel",
    supportedEvents: [
      "InboundMessage",
      "OutboundMessage",
      "ContactCreate",
      "ContactUpdate",
      "OpportunityStageUpdate",
      "AppointmentCreate",
    ],
  });
}
