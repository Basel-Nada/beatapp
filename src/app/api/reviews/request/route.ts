import { NextRequest, NextResponse } from "next/server";
import { ReviewsService } from "@/services/highlevel/reviews";
import { z } from "zod";

const requestReviewSchema = z.object({
  contactId: z.string().min(1, "معرف العميل مطلوب"),
  channel: z.enum(["whatsapp", "sms"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = requestReviewSchema.parse(body);

    const result = await ReviewsService.sendReviewRequest(
      validated.contactId,
      validated.channel || "whatsapp"
    );
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
      { error: "تعذر إرسال طلب التقييم", details: err.message },
      { status: 500 }
    );
  }
}
