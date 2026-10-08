import { NextRequest, NextResponse } from "next/server";
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

const DEFAULT_LOCATION_ID = "9m3VyK57t1Ah7Pmen0gA";

let storedLocations: StoredLocation[] = [
  {
    id: "loc-1",
    name: "Internal – Beatapp",
    locationId: DEFAULT_LOCATION_ID,
    phone: "+966 57 004 0344",
    address: "الرياض، المملكة العربية السعودية",
    city: "الرياض",
    isDefault: true,
  },
];

export async function GET() {
  const activeLocationId = process.env.HIGHLEVEL_LOCATION_ID || DEFAULT_LOCATION_ID;
  return NextResponse.json({
    locations: storedLocations,
    activeLocationId,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, name, locationId, phone, address, city } = body;

    // Connect an existing Location
    if (action === "connect_existing") {
      if (!locationId || !locationId.trim()) {
        return NextResponse.json(
          { success: false, message: "معرف الفرع (Location ID) مطلوب" },
          { status: 400 }
        );
      }

      const cleanLocId = locationId.trim();
      const existing = storedLocations.find((l) => l.locationId === cleanLocId);

      const clinicName = name?.trim() || `فرع (${cleanLocId.slice(0, 8)})`;
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

    // Switch active location
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
