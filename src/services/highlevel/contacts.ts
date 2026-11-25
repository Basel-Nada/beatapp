import { Contact, AestheticProfile } from "@/types";
import { getHighLevelConfig, highLevelRequest, clearApiCache, HighLevelApiError } from "./client";
import { mockStore } from "./mock-store";
import { UsersService } from "./users";

interface GhlContactResponse {
  contacts: Array<{
    id: string;
    locationId: string;
    contactName?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    source?: string;
    assignedTo?: string;
    tags?: string[];
    dateAdded?: string;
    dateUpdated?: string;
    customFields?: Array<{ id: string; value: string }>;
  }>;
  total?: number;
  meta?: { startAfterId?: string; startAfter?: number; total?: number };
}

interface GhlSingleContactResponse {
  contact: {
    id: string;
    locationId: string;
    contactName?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    source?: string;
    assignedTo?: string;
    tags?: string[];
    dateAdded?: string;
    dateUpdated?: string;
  };
}

export function parseAestheticProfileFromNotes(notes: Array<{ body: string }>): AestheticProfile | undefined {
  if (!notes || notes.length === 0) return undefined;

  // 1. Check for JSON format [BEATAPP_CLINICAL_PROFILE]...[/BEATAPP_CLINICAL_PROFILE]
  for (const n of notes) {
    if (n.body && n.body.includes("[BEATAPP_CLINICAL_PROFILE]")) {
      try {
        const match = n.body.match(/\[BEATAPP_CLINICAL_PROFILE\]([\s\S]*?)\[\/BEATAPP_CLINICAL_PROFILE\]/);
        if (match && match[1]) {
          return JSON.parse(match[1].trim());
        }
      } catch (err) {
        console.error("Failed to parse JSON clinical profile", err);
      }
    }
  }

  // 2. Check for Arabic text format (such as the note currently in HighLevel for 0LVcflz67WDujOnZMoHE)
  for (const n of notes) {
    if (n.body && (n.body.includes("استبيان تقييم البشرة") || n.body.includes("نوع البشرة") || n.body.includes("الملف الإكلينيكي"))) {
      const profile: AestheticProfile = {};

      // Skin type
      const skinMatch = n.body.match(/نوع البشرة:\s*([^\n\r]+)/);
      if (skinMatch) {
        const val = skinMatch[1].toLowerCase();
        if (val.includes("oily") || val.includes("دهنية")) profile.skinType = "oily";
        else if (val.includes("dry") || val.includes("جافة")) profile.skinType = "dry";
        else if (val.includes("combination") || val.includes("مختلطة")) profile.skinType = "combination";
        else if (val.includes("sensitive") || val.includes("حساسة")) profile.skinType = "sensitive";
        else if (val.includes("normal") || val.includes("عادية")) profile.skinType = "normal";
      }

      // Fitzpatrick scale
      const fitzMatch = n.body.match(/مقياس فيتزباتريك:\s*([^\n\r]+)/);
      if (fitzMatch) {
        const val = fitzMatch[1];
        const m = val.match(/(I{1,3}|IV|V|VI)/i);
        if (m) profile.fitzpatrickScale = m[1].toUpperCase() as any;
      }

      // Allergies
      const allergyMatch = n.body.match(/الحساسية:\s*([^\n\r]+)/);
      if (allergyMatch) {
        profile.allergies = allergyMatch[1].split(/[,،]/).map((s) => s.trim()).filter(Boolean);
      }

      // Target Areas
      const areasMatch = n.body.match(/المناطق المستهدفة:\s*([^\n\r]+)/);
      if (areasMatch) {
        profile.targetAreas = areasMatch[1].split(/[,،]/).map((s) => s.trim()).filter(Boolean);
      }

      // Package Name & Remaining Sessions
      const pkgMatch = n.body.match(/الباقة(?:\s*الحالية)?:\s*([^\n\r]+)/);
      if (pkgMatch) profile.currentPackageName = pkgMatch[1].trim();

      const sessionsMatch = n.body.match(/الجلسات المتبقية:\s*(\d+)/);
      if (sessionsMatch) profile.remainingPackageSessions = parseInt(sessionsMatch[1], 10);

      // Notes
      const notesMatch = n.body.match(/(?:ملاحظات[^\n:]*):\s*([^\n\r]+)/);
      if (notesMatch) {
        const val = notesMatch[1].trim();
        if (val && !val.includes("لا توجد") && !val.includes("لا يوجد")) {
          profile.doctorNotes = val;
        }
      }

      if (profile.skinType || profile.fitzpatrickScale || (profile.targetAreas && profile.targetAreas.length > 0)) {
        return profile;
      }
    }
  }

  return undefined;
}

export const ContactsService = {
  /**
   * جلب العملاء الحقيقيين من BeatApp (مع التصفح التلقائي لكل الصفحات).
   * @param assignedTo إذا تم تمريره، يرجع فقط العملاء المسندين لهذا الموظف.
   */
  async getContacts(params?: { search?: string; filter?: string; locationId?: string; assignedTo?: string }): Promise<Contact[]> {
    const config = getHighLevelConfig(params?.locationId);

    if (config.isDemoMode) {
      return mockStore.getContacts(params?.search, params?.filter);
    }

    const all: GhlContactResponse["contacts"] = [];
    let startAfterId: string | undefined;
    let startAfter: number | undefined;
    for (let page = 0; page < 10; page++) {
      const queryParams = new URLSearchParams({
        locationId: config.locationId!,
        limit: "100",
      });
      if (params?.search) queryParams.set("query", params.search);
      if (startAfterId && startAfter) {
        queryParams.set("startAfterId", startAfterId);
        queryParams.set("startAfter", String(startAfter));
      }
      const res = await highLevelRequest<GhlContactResponse>(
        `/contacts/?${queryParams.toString()}`,
        { cacheTtlMs: 15 * 1000 },
        config.locationId
      );
      all.push(...(res.contacts || []));
      if (!res.meta?.startAfterId || (res.contacts || []).length < 100) break;
      startAfterId = res.meta.startAfterId;
      startAfter = res.meta.startAfter;
    }

    const users = await UsersService.getUsers().catch(() => []);
    const nameMap = new Map(users.map((u) => [u.id, u.name]));

    const scoped = params?.assignedTo ? all.filter((c) => c.assignedTo === params.assignedTo) : all;

    return scoped.map((ghl) => {
      const name = ghl.contactName || `${ghl.firstName || ""} ${ghl.lastName || ""}`.trim() || "عميل بدون اسم";
      const tags = ghl.tags || [];

      // Map status from tags or default
      let status: Contact["status"] = "new";
      if (tags.some(t => t.includes("حالي") || t.includes("عميل"))) status = "customer";
      else if (tags.some(t => t.includes("حجز"))) status = "booked";
      else if (tags.some(t => t.includes("مهتم"))) status = "interested";
      else if (tags.some(t => t.includes("تواصل"))) status = "contacted";

      return {
        id: ghl.id,
        locationId: ghl.locationId,
        name,
        firstName: ghl.firstName,
        lastName: ghl.lastName,
        phone: ghl.phone || "",
        email: ghl.email || "",
        serviceInterest: tags.find(t => !["عميل جديد", "مهتم", "متابعة"].includes(t)) || "استشارة عامة",
        status,
        leadSource: ghl.source || "BeatApp",
        assignedToId: ghl.assignedTo || undefined,
        assignedStaff: ghl.assignedTo ? nameMap.get(ghl.assignedTo) || "موظف" : "غير مسند",
        lastContactDate: ghl.dateUpdated || ghl.dateAdded || new Date().toISOString(),
        totalSpent: 0,
        tags,
        notes: [],
        createdAt: ghl.dateAdded || new Date().toISOString(),
        updatedAt: ghl.dateUpdated || new Date().toISOString(),
      };
    });
  },

  /** إسناد عميل لموظف في BeatApp مباشرة (أو إلغاء الإسناد بتمرير null) */
  async assignContact(contactId: string, userId: string | null, locationId?: string): Promise<void> {
    const config = getHighLevelConfig(locationId);
    if (config.isDemoMode) return;
    await highLevelRequest(
      `/contacts/${contactId}`,
      { method: "PUT", body: JSON.stringify({ assignedTo: userId }) },
      config.locationId
    );
    clearApiCache();
  },

  async getContactById(id: string, locationId?: string): Promise<Contact | null> {
    const config = getHighLevelConfig(locationId);

    // If ID starts with mock prefix 'cnt-', immediately check mockStore
    if (id.startsWith("cnt-") || config.isDemoMode) {
      const found = mockStore.getContactById(id);
      if (found) return found;
    }

    try {
      const res = await highLevelRequest<GhlSingleContactResponse>(`/contacts/${id}`, {}, locationId);
      const ghl = res.contact;
      if (!ghl) {
        const found = mockStore.getContactById(id);
        return found || null;
      }
      const name = ghl.contactName || `${ghl.firstName || ""} ${ghl.lastName || ""}`.trim() || "عميل بدون اسم";
      
      // Try to fetch notes for this contact
      let notes: Array<{ id: string; contactId: string; body: string; authorName: string; createdAt: string }> = [];
      try {
        const notesRes = await highLevelRequest<{ notes: Array<{ id: string; body: string; dateAdded?: string }> }>(
          `/contacts/${id}/notes`,
          {},
          locationId
        );
        notes = (notesRes.notes || []).map((n) => ({
          id: n.id,
          contactId: id,
          body: n.body,
          authorName: "فريق العيادة",
          createdAt: n.dateAdded || new Date().toISOString(),
        }));
      } catch {
        // Fallback to local notes in mock store if any
        const local = mockStore.getContactById(id);
        if (local?.notes) notes = local.notes;
      }

      // Check if local notes were added in mockStore
      const localStoreContact = mockStore.getContactById(id);
      if (localStoreContact?.notes && localStoreContact.notes.length > 0) {
        const existingIds = new Set(notes.map((n) => n.id));
        for (const ln of localStoreContact.notes) {
          if (!existingIds.has(ln.id)) {
            notes.unshift(ln);
          }
        }
      }

      const aestheticProfile = parseAestheticProfileFromNotes(notes) || mockStore.getAestheticProfile(ghl.id);
      const users = await UsersService.getUsers().catch(() => []);
      const assigneeName = ghl.assignedTo ? users.find((u) => u.id === ghl.assignedTo)?.name || "موظف" : "غير مسند";

      // Clean notes to completely strip technical JSON tags before returning to client/UI
      const cleanedNotes = notes
        .map((n) => ({
          ...n,
          body: n.body
            .replace(/\[BEATAPP_CLINICAL_PROFILE\][\s\S]*?\[\/BEATAPP_CLINICAL_PROFILE\]\s*/g, "")
            .trim(),
        }))
        .filter((n) => n.body.length > 0);

      return {
        id: ghl.id,
        locationId: ghl.locationId,
        name,
        firstName: ghl.firstName,
        lastName: ghl.lastName,
        phone: ghl.phone || "",
        email: ghl.email || "",
        serviceInterest: (ghl.tags || [])[0] || "استشارة عامة",
        status: "interested",
        leadSource: ghl.source || "BeatApp",
        assignedToId: ghl.assignedTo || undefined,
        assignedStaff: assigneeName,
        lastContactDate: ghl.dateUpdated || ghl.dateAdded || new Date().toISOString(),
        totalSpent: 0,
        tags: ghl.tags || [],
        notes: cleanedNotes,
        aestheticProfile,
        createdAt: ghl.dateAdded || new Date().toISOString(),
        updatedAt: ghl.dateUpdated || new Date().toISOString(),
      };
    } catch {
      const found = mockStore.getContactById(id);
      return found || null;
    }
  },

  async createContact(data: Partial<Contact>, locationId?: string): Promise<Contact> {
    const config = getHighLevelConfig(locationId);

    if (config.isDemoMode) {
      return mockStore.createContact(data);
    }

    const payload: Record<string, unknown> = {
      name: data.name,
      firstName: data.firstName || data.name?.split(" ")[0],
      lastName: data.lastName || data.name?.split(" ").slice(1).join(" "),
      phone: data.phone || undefined,
      email: data.email || undefined,
      source: data.leadSource || "BeatApp Arabic",
      tags: data.tags || ["BeatApp", data.serviceInterest || "استشارة عامة"],
      locationId: config.locationId,
    };
    // الموظف الذي سجّل العميل يصبح هو المسؤول عنه تلقائياً
    if (data.assignedToId) payload.assignedTo = data.assignedToId;

    let res: GhlSingleContactResponse;
    try {
      res = await highLevelRequest<GhlSingleContactResponse>(
        "/contacts/",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        config.locationId
      );
    } catch (e) {
      if (e instanceof HighLevelApiError && /duplicat/i.test(e.message)) {
        throw new HighLevelApiError("هذا العميل مسجل بالفعل في BeatApp بنفس رقم الهاتف أو البريد الإلكتروني", 409, e.details);
      }
      throw e;
    }
    clearApiCache();

    const ghl = res.contact;
    return {
      id: ghl.id,
      locationId: ghl.locationId,
      name: ghl.contactName || data.name || "",
      phone: ghl.phone || data.phone || "",
      email: ghl.email || data.email || "",
      serviceInterest: data.serviceInterest || "استشارة عامة",
      status: "new",
      assignedToId: ghl.assignedTo || data.assignedToId,
      assignedStaff: data.assignedStaff,
      tags: ghl.tags || data.tags || [],
      createdAt: ghl.dateAdded || new Date().toISOString(),
      updatedAt: ghl.dateUpdated || new Date().toISOString(),
    };
  },

  async addNote(contactId: string, noteBody: string, authorName: string = "الموظف", locationId?: string): Promise<void> {
    const config = getHighLevelConfig(locationId);

    // Always record locally in mockStore for fast UI response
    mockStore.addContactNote(contactId, noteBody, authorName);

    if (config.isDemoMode || contactId.startsWith("cnt-")) {
      return;
    }

    // HighLevel notes endpoint
    try {
      await highLevelRequest(
        `/contacts/${contactId}/notes`,
        {
          method: "POST",
          body: JSON.stringify({ body: noteBody }),
        },
        config.locationId
      );
    } catch {
      // Handled via local store
    }
  },

  async updateAestheticProfile(
    contactId: string,
    profile: AestheticProfile,
    locationId?: string
  ): Promise<Contact | null> {
    const config = getHighLevelConfig(locationId);

    // Save in local mockStore map
    mockStore.updateContactAestheticProfile(contactId, profile);

    if (config.isDemoMode || contactId.startsWith("cnt-")) {
      return this.getContactById(contactId, locationId);
    }

    try {
      // In HighLevel, custom fields are updated via PUT /contacts/{id}
      await highLevelRequest(
        `/contacts/${contactId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            customFields: [
              { id: "skin_type", value: profile.skinType },
              { id: "fitzpatrick_scale", value: profile.fitzpatrickScale },
              { id: "allergies", value: profile.allergies?.join(", ") },
              { id: "remaining_package_sessions", value: profile.remainingPackageSessions },
              { id: "current_package_name", value: profile.currentPackageName },
            ],
          }),
        },
        config.locationId
      );
    } catch {
      // Fallback handled via note below
    }

    // Persist as a note in HighLevel so any serverless instance / Vercel lambda reads it persistently:
    const notePayload = `[BEATAPP_CLINICAL_PROFILE]\n${JSON.stringify(profile)}\n[/BEATAPP_CLINICAL_PROFILE]\nتم تحديث الملف الإكلينيكي والتجميلي للعميل بواسطة فريق العيادة.`;
    await this.addNote(contactId, notePayload, "فريق العيادة", locationId).catch(() => {});

    return this.getContactById(contactId, locationId);
  },
};
