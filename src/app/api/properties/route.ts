import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "@/services/highlevel/mock-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || undefined;
    const search = searchParams.get("search") || undefined;

    const units = mockStore.getPropertyUnits(filter, search);
    return NextResponse.json({ units });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "reserve") {
      const { unitId, agentId, agentName, clientId, clientName, clientPhone, notes } = body;
      if (!unitId || !agentId || !clientId) {
        return NextResponse.json(
          { error: "بيانات الحجز غير مكتملة (unitId, agentId, clientId مطلوبة)" },
          { status: 400 }
        );
      }

      const result = mockStore.reservePropertyUnit({
        unitId,
        agentId,
        agentName: agentName || "المستشار العقاري",
        clientId,
        clientName: clientName || "عميل",
        clientPhone,
        notes,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 409 });
      }

      return NextResponse.json(result);
    }

    if (action === "release") {
      const { unitId, releasedByName } = body;
      if (!unitId) {
        return NextResponse.json({ error: "معرف الوحدة مطلوب" }, { status: 400 });
      }

      const result = mockStore.releasePropertyUnit(unitId, releasedByName || "مدير النظام");
      return NextResponse.json(result);
    }

    if (action === "sell") {
      const { unitId, confirmedByName } = body;
      if (!unitId) {
        return NextResponse.json({ error: "معرف الوحدة مطلوب" }, { status: 400 });
      }

      const result = mockStore.markUnitSold(unitId, confirmedByName || "مدير النظام");
      return NextResponse.json(result);
    }

    if (action === "create") {
      const unit = mockStore.createPropertyUnit(body.unit);
      return NextResponse.json({ success: true, unit });
    }

    if (action === "update") {
      const { id, data } = body;
      const unit = mockStore.updatePropertyUnit(id, data);
      if (!unit) {
        return NextResponse.json({ error: "الوحدة غير موجودة" }, { status: 404 });
      }
      return NextResponse.json({ success: true, unit });
    }

    if (action === "delete") {
      const { id } = body;
      const ok = mockStore.deletePropertyUnit(id);
      return NextResponse.json({ success: ok });
    }

    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
