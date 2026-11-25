import { ActingUser } from "./acting-user";
import { ContactsService } from "@/services/highlevel/contacts";
import { ConversationScope } from "@/services/highlevel/conversations";

/** نطاق بيانات المستخدم الحالي: الأدمن => كل شيء، الموظف => عملاؤه فقط */
export async function getConversationScope(me: ActingUser): Promise<ConversationScope | undefined> {
  if (!me.isStaff) return undefined;
  const mine = await ContactsService.getContacts({ assignedTo: me.id });
  return { userId: me.id, allowedContactIds: new Set(mine.map((c) => c.id)) };
}
