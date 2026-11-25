import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "@/services/highlevel/mock-store";
import { UsersService } from "@/services/highlevel/users";
import { Tenant } from "@/types";

export const dynamic = "force-dynamic";

const LIVE_TENANT: Tenant = {
  id: "tenant-beatapp-live",
  name: "حساب بيتاب المباشر (Internal - Beatapp)",
  slug: "beatapp-live",
  industry: "clinic",
  locationId: process.env.HIGHLEVEL_LOCATION_ID || "9m3VyK57t1Ah7Pmen0gA",
  timezone: "Asia/Riyadh",
  currency: "ر.س",
  phone: "+966 57 004 0344",
  address: "طريق الملك فهد، العليا، الرياض",
  status: "active",
  plan: "enterprise",
  adminName: "باسم مصباح",
  adminEmail: "info@adwave.co",
  maxUsers: 25,
  usersCount: 10,
  createdAt: "2025-08-31T10:58:21.507Z",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("id");

    if (tenantId) {
      if (tenantId === "tenant-beatapp-live") {
        const users = mockStore.getUsersByTenant(tenantId);
        return NextResponse.json({ tenant: LIVE_TENANT, users });
      }
      const tenant = mockStore.getTenantById(tenantId);
      if (!tenant) {
        return NextResponse.json({ error: "الشركة غير موجودة" }, { status: 404 });
      }
      const users = mockStore.getUsersByTenant(tenantId);
      return NextResponse.json({ tenant, users });
    }

    const allTenants = mockStore
      .getTenants()
      .filter(
        (t) =>
          t.id !== "tenant-beatapp-live" &&
          t.id !== "tenant-sorouh-re" &&
          t.id !== "tenant-lumina-medspa" &&
          t.id !== "tenant-alfursan-re"
      );
    const tenants = [LIVE_TENANT, ...allTenants];
    return NextResponse.json({ tenants });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. Create a New Tenant (Selling SaaS subscription to a client)
    if (action === "create") {
      const { name, industry, plan, adminName, adminEmail, phone, maxUsers, address, locationId } = body;
      if (!name || !adminEmail || !adminName) {
        return NextResponse.json(
          { error: "بيانات إنشاء الشركة غير مكتملة (name, adminEmail, adminName مطلوبة)" },
          { status: 400 }
        );
      }

      const result = mockStore.createTenant({
        name,
        industry: industry || "real_estate",
        plan: plan || "starter",
        adminName,
        adminEmail,
        phone,
        maxUsers: Number(maxUsers) || 5,
        address,
        locationId: locationId?.trim() || undefined,
      });

      return NextResponse.json(result);
    }

    // 2. Update Tenant Info or Subscription Status
    if (action === "update") {
      const { id, data } = body;
      const updated = mockStore.updateTenant(id, data);
      if (!updated) {
        return NextResponse.json({ error: "الشركة غير موجودة" }, { status: 404 });
      }
      return NextResponse.json({ success: true, tenant: updated });
    }

    // 3. Delete Tenant
    if (action === "delete") {
      const { id } = body;
      const ok = mockStore.deleteTenant(id);
      return NextResponse.json({ success: ok });
    }

    // 4. Create an Employee for a Tenant
    if (action === "create_user") {
      const { tenantId, name, email, role, title, phone, department } = body;
      if (!name || !email || !tenantId) {
        return NextResponse.json(
          { error: "بيانات الموظف غير مكتملة (tenantId, name, email مطلوبة)" },
          { status: 400 }
        );
      }

      const tenant = mockStore.getTenantById(tenantId);
      const user = await UsersService.createUser(
        {
          tenantId,
          name,
          email,
          role: role || "sales",
          title: title || "مستشار مبيعات",
          phone,
          department,
        },
        tenant?.locationId
      );

      return NextResponse.json({ success: true, user });
    }

    // 5. Update Employee
    if (action === "update_user") {
      const { id, data, locationId } = body;
      const user = await UsersService.updateUser(id, data, locationId);
      return NextResponse.json({ success: true, user });
    }

    // 6. Delete Employee
    if (action === "delete_user") {
      const { id, locationId } = body;
      const ok = await UsersService.deleteUser(id, locationId);
      return NextResponse.json({ success: ok });
    }

    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
