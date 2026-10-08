import { NextRequest, NextResponse } from "next/server";
import { getHighLevelConfig, highLevelRequest } from "@/services/highlevel/client";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = body.token || process.env.HIGHLEVEL_PRIVATE_TOKEN;
    const locationId = body.locationId || process.env.HIGHLEVEL_LOCATION_ID;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "مفتاح الربط (Token) غير موجود" },
        { status: 400 }
      );
    }

    if (!locationId) {
      return NextResponse.json(
        { success: false, message: "معرف الفرع (Location ID) مطلوب لتأكيد الربط" },
        { status: 400 }
      );
    }

    // Test live call to HighLevel contacts endpoint
    const url = `https://services.leadconnectorhq.com/contacts/?locationId=${encodeURIComponent(locationId)}&limit=1`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Version: "2021-07-28",
        Accept: "application/json",
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        statusCode: response.status,
        message: data.message || "فشل الاتصال بـ HighLevel. تحقق من صحة Location ID أو الصلاحيات.",
        details: data,
      });
    }

    // If body contains save: true, update .env.local
    if (body.save) {
      try {
        const envPath = path.join(process.cwd(), ".env.local");
        let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
        
        if (content.includes("HIGHLEVEL_LOCATION_ID=")) {
          content = content.replace(/HIGHLEVEL_LOCATION_ID=.*/, `HIGHLEVEL_LOCATION_ID=${locationId}`);
        } else {
          content += `\nHIGHLEVEL_LOCATION_ID=${locationId}`;
        }

        if (content.includes("HIGHLEVEL_PRIVATE_TOKEN=")) {
          content = content.replace(/HIGHLEVEL_PRIVATE_TOKEN=.*/, `HIGHLEVEL_PRIVATE_TOKEN=${token}`);
        } else {
          content += `\nHIGHLEVEL_PRIVATE_TOKEN=${token}`;
        }

        content = content.replace(/DEMO_MODE=.*/, `DEMO_MODE=false`);
        fs.writeFileSync(envPath, content, "utf8");

        // Update process.env in current process
        process.env.HIGHLEVEL_LOCATION_ID = locationId;
        process.env.HIGHLEVEL_PRIVATE_TOKEN = token;
        process.env.DEMO_MODE = "false";
      } catch (err) {
        console.error("Could not write .env.local", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "تم الاتصال بنجاح مع GoHighLevel! الحساب متصل ونشط.",
      contactsCount: Array.isArray(data.contacts) ? data.contacts.length : 0,
      total: data.total || 0,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, message: `خطأ في الاتصال: ${err.message}` },
      { status: 500 }
    );
  }
}
