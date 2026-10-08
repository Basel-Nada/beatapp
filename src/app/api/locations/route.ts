import { NextRequest, NextResponse } from "next/server";
import { getHighLevelConfig } from "@/services/highlevel/client";
import fs from "fs";
import path from "path";

export interface StoredLocation {
  id: string;
  name: string;
  locationId: string;
  phone?: string;
  address?: string;
  city?: string;
  isDefault?: boolean;
}

// In-memory / persistent locations list
let storedLocations: StoredLocation[] = [
  {
    id: "loc-1",
    name: "عيادات لومينا ديرما للتجميل (فرع العليا)",
    locationId: process.env.HIGHLEVEL_LOCATION_ID || "loc_demo_lumina_riyadh",
    phone: "+966 11 234 5678",
    address: "طريق الملك فهد، العليا، الرياض",
    city: "الرياض",
    isDefault: true,
  },
];

export async function GET() {
  const activeLocationId = process.env.HIGHLEVEL_LOCATION_ID || storedLocations[0].locationId;
  return NextResponse.json({
    locations: storedLocations,
    activeLocationId,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, name, locationId, phone, address, city, agencyToken } = body;

    // Action 1: Connect an existing Location
    if (action === "connect_existing") {
      if (!locationId || !locationId.trim()) {
        return NextResponse.json(
          { success: false, message: "معرف الفرع (Location ID) مطلوب" },
          { status: 400 }
        );
      }

      const cleanLocId = locationId.trim();
      const existing = storedLocations.find((l) => l.locationId === cleanLocId);

      const clinicName = name?.trim() || `عيادة (${cleanLocId.slice(0, 8)})`;
      const newLoc: StoredLocation = {
        id: `loc-${Date.now()}`,
        name: clinicName,
        locationId: cleanLocId,
        phone: phone || "",
        address: address || "",
        city: city || "الرياض",
        isDefault: true,
      };

      if (!existing) {
        storedLocations.push(newLoc);
      }

      // Update current active location in process.env and .env.local
      process.env.HIGHLEVEL_LOCATION_ID = cleanLocId;
      process.env.DEMO_MODE = "false";

      try {
        const envPath = path.join(process.cwd(), ".env.local");
        let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
        if (content.includes("HIGHLEVEL_LOCATION_ID=")) {
          content = content.replace(/HIGHLEVEL_LOCATION_ID=.*/, `HIGHLEVEL_LOCATION_ID=${cleanLocId}`);
        } else {
          content += `\nHIGHLEVEL_LOCATION_ID=${cleanLocId}`;
        }
        content = content.replace(/DEMO_MODE=.*/, `DEMO_MODE=false`);
        fs.writeFileSync(envPath, content, "utf8");
      } catch (e) {
        console.error("Env update error", e);
      }

      return NextResponse.json({
        success: true,
        message: "تم ربط الفرع بنجاح وتعيينه كفرع نشط!",
        location: newLoc,
      });
    }

    // Action 2: Create a brand new Location via HighLevel Agency API
    if (action === "create_new") {
      const tokenToUse = agencyToken || process.env.HIGHLEVEL_PRIVATE_TOKEN;

      // Attempt to provision on HighLevel v2 API: POST /locations/
      try {
        const ghlRes = await fetch("https://services.leadconnectorhq.com/locations/", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenToUse}`,
            Version: "2021-07-28",
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name: name || "عيادة تجميل جديدة",
            phone: phone || "+966500000000",
            address: address || "المقر الرئيسي",
            city: city || "الرياض",
            country: "SA",
            timezone: "Asia/Riyadh",
          }),
        });

        const ghlData = await ghlRes.json().catch(() => ({}));

        if (ghlRes.ok && ghlData.id) {
          const generatedLocationId = ghlData.id;
          const createdLoc: StoredLocation = {
            id: `loc-${Date.now()}`,
            name: name || "العيادة الجديدة",
            locationId: generatedLocationId,
            phone,
            address,
            city,
            isDefault: true,
          };
          storedLocations.push(createdLoc);

          process.env.HIGHLEVEL_LOCATION_ID = generatedLocationId;
          process.env.DEMO_MODE = "false";

          return NextResponse.json({
            success: true,
            message: "تم إنشاء حساب العيادة الجديد بنجاح على GoHighLevel وربطه فورياً!",
            location: createdLoc,
            highLevelResponse: ghlData,
          });
        } else {
          // If the token lacks Agency-level locations.write scope, explain clearly
          const isUnauthorized = ghlRes.status === 401 || ghlRes.status === 403;
          return NextResponse.json({
            success: false,
            needsAgencyToken: isUnauthorized,
            message: isUnauthorized
              ? "مفتاح الربط الحالي هو مفتاح فرعي (Sub-Account Token) ولا يملك صلاحية إنشاء فروع جديدة من الصفر. لإنشاء فرع تلقائياً، يلزم مفتاح من حساب الوكالة الرئيسي (Agency Token) مع صلاحية locations.write. بدلاً من ذلك، يمكنك إنشاء الفرع في HighLevel ونسخ الـ Location ID وربطه هنا في ثانية واحدة."
              : ghlData.message || "تعذر إنشاء الفرع في HighLevel",
            details: ghlData,
          });
        }
      } catch (err: unknown) {
        const error = err as Error;
        return NextResponse.json({
          success: false,
          message: `فشل الاتصال بـ HighLevel: ${error.message}`,
        });
      }
    }

    // Action 3: Switch active location
    if (action === "switch") {
      const target = storedLocations.find((l) => l.locationId === locationId);
      if (target) {
        process.env.HIGHLEVEL_LOCATION_ID = target.locationId;
        return NextResponse.json({
          success: true,
          message: `تم التبديل إلى ${target.name}`,
          activeLocationId: target.locationId,
        });
      }
    }

    return NextResponse.json({ success: false, message: "إجراء غير معروف" }, { status: 400 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
