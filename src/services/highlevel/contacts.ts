import { Contact } from "@/types";
import { getHighLevelConfig, highLevelRequest } from "./client";
import { mockStore } from "./mock-store";

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
    tags?: string[];
    dateAdded?: string;
    dateUpdated?: string;
    customFields?: Array<{ id: string; value: string }>;
  }>;
  total?: number;
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
    tags?: string[];
    dateAdded?: string;
    dateUpdated?: string;
  };
}

export const ContactsService = {
  async getContacts(params?: { search?: string; filter?: string; locationId?: string }): Promise<Contact[]> {
    const config = getHighLevelConfig(params?.locationId);

    if (config.isDemoMode) {
      return mockStore.getContacts(params?.search, params?.filter);
    }

    const queryParams = new URLSearchParams({
      locationId: config.locationId!,
      limit: "50",
    });
    if (params?.search) {
      queryParams.set("query", params.search);
    }

    const res = await highLevelRequest<GhlContactResponse>(`/contacts/?${queryParams.toString()}`, {}, config.locationId);

    return res.contacts.map((ghl) => {
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
        leadSource: ghl.source || "HighLevel CRM",
        assignedStaff: "فريق العيادة",
        lastContactDate: ghl.dateUpdated || ghl.dateAdded || new Date().toISOString(),
        totalSpent: 0,
        tags,
        notes: [],
        createdAt: ghl.dateAdded || new Date().toISOString(),
        updatedAt: ghl.dateUpdated || new Date().toISOString(),
      };
    });
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
        leadSource: "HighLevel CRM",
        assignedStaff: "فريق العيادة",
        lastContactDate: ghl.dateUpdated || ghl.dateAdded || new Date().toISOString(),
        totalSpent: 0,
        tags: ghl.tags || [],
        notes,
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

    const payload = {
      name: data.name,
      firstName: data.firstName || data.name?.split(" ")[0],
      lastName: data.lastName || data.name?.split(" ").slice(1).join(" "),
      phone: data.phone,
      email: data.email,
      tags: data.tags || ["BeatApp", data.serviceInterest || "استشارة عامة"],
      locationId: config.locationId,
    };

    const res = await highLevelRequest<GhlSingleContactResponse>(
      "/contacts/",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      config.locationId
    );

    const ghl = res.contact;
    return {
      id: ghl.id,
      locationId: ghl.locationId,
      name: ghl.contactName || data.name || "",
      phone: ghl.phone || data.phone || "",
      email: ghl.email || data.email || "",
      serviceInterest: data.serviceInterest || "استشارة عامة",
      status: "new",
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
};
