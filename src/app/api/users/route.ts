import { NextRequest, NextResponse } from "next/server";
import { UsersService } from "@/services/highlevel/users";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId =
      req.headers.get("x-beatapp-location-id") ||
      searchParams.get("locationId") ||
      undefined;
    const users = await UsersService.getUsers(locationId);
    return NextResponse.json({ users });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
