import { NextRequest, NextResponse } from "next/server";
import { InvoicesService } from "@/services/highlevel/invoices";
import { z } from "zod";

const createInvoiceSchema = z.object({
  contactId: z.string().min(1, "معرف العميل مطلوب"),
  contactName: z.string().min(1, "اسم العميل مطلوب"),
  contactPhone: z.string().optional(),
  amount: z.number().min(0, "المبلغ يجب أن يكون أكبر من أو يساوي 0"),
  items: z.array(
    z.object({
      id: z.string().optional(),
      description: z.string().min(1, "وصف الخدمة مطلوب"),
      quantity: z.number().min(1),
      unitPrice: z.number().min(0),
      total: z.number().min(0),
    })
  ).optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  sendDirectly: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || undefined;
    const invoices = await InvoicesService.getInvoices({ filter });
    return NextResponse.json({ invoices });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر جلب الفواتير", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createInvoiceSchema.parse(body);

    const invoice = await InvoicesService.createInvoice({
      contactId: validated.contactId,
      contactName: validated.contactName,
      contactPhone: validated.contactPhone || "",
      amount: validated.amount,
      items: validated.items?.map((it, idx) => ({
        id: it.id || `item-${Date.now()}-${idx}`,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.total,
      })) || [
        {
          id: `item-${Date.now()}`,
          description: "خدمات تجميلية واستشارة",
          quantity: 1,
          unitPrice: validated.amount,
          total: validated.amount,
        },
      ],
      dueDate: validated.dueDate,
      notes: validated.notes,
    });

    if (validated.sendDirectly) {
      await InvoicesService.sendInvoicePaymentLink(invoice.id, "whatsapp");
    }

    return NextResponse.json({ invoice, success: true }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات الفاتورة غير صالحة", issues: error.errors },
        { status: 400 }
      );
    }
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر إنشاء الفاتورة", details: err.message },
      { status: 500 }
    );
  }
}
