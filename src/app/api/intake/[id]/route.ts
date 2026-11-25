import { NextRequest, NextResponse } from "next/server";
import { ContactsService } from "@/services/highlevel/contacts";
import { mockStore } from "@/services/highlevel/mock-store";
import { AestheticProfile } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contact = await ContactsService.getContactById(params.id);
    if (!contact) {
      return NextResponse.json({ error: "لم يتم العثور على العميل" }, { status: 404 });
    }

    return NextResponse.json({
      contact: {
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        serviceInterest: contact.serviceInterest,
        hasProfile: !!contact.aestheticProfile && Object.keys(contact.aestheticProfile).length > 0,
      },
      clinicName: "عيادات التجميل والليزر المتخصصة",
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر تحميل بيانات الاستبيان", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const profile: AestheticProfile = {
      skinType: body.skinType || undefined,
      fitzpatrickScale: body.fitzpatrickScale || undefined,
      allergies: Array.isArray(body.allergies)
        ? body.allergies.filter((a: string) => a && a.trim())
        : body.allergies
        ? [body.allergies]
        : [],
      contraindications: Array.isArray(body.contraindications)
        ? body.contraindications.filter((c: string) => c && c.trim())
        : body.contraindications
        ? [body.contraindications]
        : [],
      targetAreas: Array.isArray(body.targetAreas)
        ? body.targetAreas.filter((t: string) => t && t.trim())
        : body.targetAreas
        ? [body.targetAreas]
        : [],
      doctorNotes: body.notes ? String(body.notes).trim() : undefined,
      lastTreatmentDate: new Date().toISOString(),
    };

    // Update aesthetic profile on the contact
    const updatedContact = await ContactsService.updateAestheticProfile(params.id, profile);

    // Add note to contact's chart with JSON metadata and readable Arabic text including customer notes
    await ContactsService.addNote(
      params.id,
      `[BEATAPP_CLINICAL_PROFILE]\n${JSON.stringify(profile)}\n[/BEATAPP_CLINICAL_PROFILE]\n\nقام العميل بتعبئة استبيان تقييم البشرة والتاريخ الطبي عبر الرابط الإلكتروني:\n- نوع البشرة: ${profile.skinType || "غير محدد"}\n- مقياس فيتزباتريك: ${profile.fitzpatrickScale || "غير محدد"}\n- الحساسية: ${(profile.allergies || []).join(", ") || "لا يوجد"}\n- المناطق المستهدفة: ${(profile.targetAreas || []).join(", ") || "غير محددة"}\n- ملاحظات إضافية من العميل: ${body.notes && String(body.notes).trim() ? String(body.notes).trim() : "لا توجد"}`,
      "استبيان العميل الإلكتروني"
    );

    // If there is an active conversation, notify in chat
    const convs = mockStore.getConversations();
    const conv = convs.find((c) => c.contactId === params.id);
    if (conv) {
      mockStore.sendMessage(
        conv.id,
        `شكراً لكِ، استلمنا إجاباتكِ على استبيان تقييم البشرة والتاريخ الطبي بنجاح ✨ سيقوم الفريق الطبي بمراجعتها قبل موعدكِ.`
      );
    }

    return NextResponse.json({
      success: true,
      message: "تم حفظ استبيان البشرة وتحديث الملف الطبي بنجاح",
      contact: updatedContact,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر حفظ الاستبيان", details: err.message },
      { status: 500 }
    );
  }
}
