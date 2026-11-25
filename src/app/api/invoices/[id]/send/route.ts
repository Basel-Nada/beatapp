import { NextRequest, NextResponse } from "next/server";
import { InvoicesService } from "@/services/highlevel/invoices";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const channel = body.channel === "sms" ? "sms" : "whatsapp";
    const result = await InvoicesService.sendInvoicePaymentLink(params.id, channel);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر إرسال رابط الدفع", details: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const status = body.status;
    if (!["paid", "pending", "overdue", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "حالة الفاتورة غير صالحة" }, { status: 400 });
    }

    const updated = await InvoicesService.updateInvoiceStatus(params.id, status);
    return NextResponse.json({ success: true, invoice: updated });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر تحديث الفاتورة", details: err.message },
      { status: 500 }
    );
  }
}
