import { NextRequest } from "next/server";
import { User } from "@/types";
import { UsersService } from "@/services/highlevel/users";

/**
 * المستخدم الذي يعمل حالياً على النظام (الأدمن أو الموظف).
 * يتم إرسال معرّفه من الواجهة في الهيدر `x-beatapp-user-id`
 * ويتم التحقق منه مقابل قائمة المستخدمين الحقيقية في حساب BeatApp.
 */
export interface ActingUser {
  id: string;
  name: string;
  email: string;
  role: User["role"];
  /** موظف مبيعات/استقبال: يرى فقط العملاء والمحادثات والمواعيد المسندة له */
  isStaff: boolean;
  /** مدير أو سوبر أدمن: يرى كل بيانات الحساب */
  isAdmin: boolean;
  /** معرّف المستخدم الحقيقي في BeatApp (undefined للسوبر أدمن المحلي) */
  beatappUserId?: string;
}

export const SUPER_ADMIN_ID = "user-super-admin";

const SUPER_ADMIN: ActingUser = {
  id: SUPER_ADMIN_ID,
  name: "المدير العام",
  email: "",
  role: "super_admin",
  isStaff: false,
  isAdmin: true,
};

export async function getActingUser(req: NextRequest | Request): Promise<ActingUser> {
  const headerId = req.headers.get("x-beatapp-user-id");
  if (!headerId || headerId === SUPER_ADMIN_ID) return SUPER_ADMIN;

  const users = await UsersService.getUsers();
  const user = users.find((u) => u.id === headerId);
  // معرّف غير معروف => نتعامل معه بأقل صلاحية (لا يرى أي بيانات)
  if (!user) {
    return {
      id: headerId,
      name: "مستخدم غير معروف",
      email: "",
      role: "sales",
      isStaff: true,
      isAdmin: false,
      beatappUserId: headerId,
    };
  }

  const isStaff = user.role === "sales" || user.role === "receptionist";
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isStaff,
    isAdmin: !isStaff,
    beatappUserId: user.id,
  };
}

/** خريطة: معرّف المستخدم => الاسم، لعرض اسم الموظف المسؤول بدلاً من الـ ID */
export async function getUserNameMap(): Promise<Map<string, string>> {
  const users = await UsersService.getUsers();
  return new Map(users.map((u) => [u.id, u.name]));
}
