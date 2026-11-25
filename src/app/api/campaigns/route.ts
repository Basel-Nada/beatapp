import { NextRequest, NextResponse } from "next/server";
import { CampaignsService } from "@/services/highlevel/campaigns";
import { z } from "zod";

const createCampaignSchema = z.object({
  title: z.string().min(1, "عنوان الحملة مطلوب"),
  channel: z.enum(["whatsapp", "sms"]),
  targetAudience: z.string().min(1, "الجمهور المستهدف مطلوب"),
  targetTag: z.string().optional(),
  messageContent: z.string().min(1, "نص الرسالة مطلوب"),
  scheduledFor: z.string().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const campaigns = await CampaignsService.getCampaigns();
    return NextResponse.json({ campaigns });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر جلب الحملات", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createCampaignSchema.parse(body);

    const campaign = await CampaignsService.createCampaign({
      title: validated.title,
      channel: validated.channel,
      targetAudience: validated.targetAudience,
      targetTag: validated.targetTag,
      messageContent: validated.messageContent,
      scheduledFor: validated.scheduledFor,
    });

    return NextResponse.json({ success: true, campaign }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات الحملة غير صالحة", issues: error.errors },
        { status: 400 }
      );
    }
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر إنشاء الحملة", details: err.message },
      { status: 500 }
    );
  }
}
