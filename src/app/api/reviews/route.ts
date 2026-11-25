import { NextRequest, NextResponse } from "next/server";
import { ReviewsService } from "@/services/highlevel/reviews";
import { z } from "zod";

const replySchema = z.object({
  reviewId: z.string().min(1, "معرف التقييم مطلوب"),
  replyText: z.string().min(1, "نص الرد مطلوب"),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rating = searchParams.get("rating") ? parseInt(searchParams.get("rating")!, 10) : undefined;

    const [reviews, stats] = await Promise.all([
      ReviewsService.getReviews({ ratingFilter: rating }),
      ReviewsService.getReviewStats(),
    ]);

    return NextResponse.json({ reviews, stats });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر جلب التقييمات", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = replySchema.parse(body);

    const updated = await ReviewsService.replyToReview(validated.reviewId, validated.replyText);
    return NextResponse.json({ success: true, review: updated });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", issues: error.errors },
        { status: 400 }
      );
    }
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر إرسال الرد", details: err.message },
      { status: 500 }
    );
  }
}
