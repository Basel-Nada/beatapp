import { Contact, Conversation, Opportunity, Appointment, Message } from "@/types";
import { MOCK_CONTACTS, MOCK_CONVERSATIONS, MOCK_MESSAGES, MOCK_OPPORTUNITIES, MOCK_APPOINTMENTS } from "@/lib/mock-data";

// In-memory store for controlled demo mode
class MockStore {
  private contacts: Contact[] = [...MOCK_CONTACTS];
  private conversations: Conversation[] = [...MOCK_CONVERSATIONS];
  private messages: Record<string, Message[]> = JSON.parse(JSON.stringify(MOCK_MESSAGES));
  private opportunities: Opportunity[] = [...MOCK_OPPORTUNITIES];
  private appointments: Appointment[] = [...MOCK_APPOINTMENTS];

  // Contacts
  getContacts(search?: string, filter?: string): Contact[] {
    let result = [...this.contacts];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        c => c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email && c.email.toLowerCase().includes(q))
      );
    }
    if (filter && filter !== "all") {
      if (filter === "new") result = result.filter(c => c.status === "new");
      else if (filter === "needs_followup") result = result.filter(c => c.tags.some(t => t.includes("متابعة")) || c.status === "interested");
      else if (filter === "interested") result = result.filter(c => c.status === "interested");
      else if (filter === "current_customer") result = result.filter(c => c.status === "customer" || c.status === "booked");
    }
    return result;
  }

  getContactById(id: string): Contact | undefined {
    return this.contacts.find(c => c.id === id);
  }

  createContact(data: Partial<Contact>): Contact {
    const id = `cnt-${Date.now()}`;
    const newContact: Contact = {
      id,
      locationId: data.locationId || "loc_demo_lumina_riyadh",
      name: data.name || "عميل جديد",
      firstName: data.firstName || data.name?.split(" ")[0] || "عميل",
      lastName: data.lastName || data.name?.split(" ").slice(1).join(" ") || "",
      phone: data.phone || "",
      email: data.email || "",
      serviceInterest: data.serviceInterest || "استشارة عامة",
      status: data.status || "new",
      leadSource: data.leadSource || "لوحة بيتاب",
      assignedStaff: data.assignedStaff || "د. نورة الشمري",
      lastContactDate: new Date().toISOString(),
      totalSpent: 0,
      tags: data.tags || ["عميل جديد"],
      notes: data.notes || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.contacts.unshift(newContact);

    // Also automatically create an opportunity for this new MedSpa lead
    this.createOpportunity({
      contactId: newContact.id,
      contactName: newContact.name,
      contactPhone: newContact.phone,
      service: newContact.serviceInterest,
      monetaryValue: 1200,
      stageId: "new_lead",
      assignedStaff: newContact.assignedStaff,
    });

    return newContact;
  }

  addContactNote(contactId: string, noteBody: string, authorName: string = "الموظف"): Contact | undefined {
    const contact = this.getContactById(contactId);
    if (!contact) return undefined;
    if (!contact.notes) contact.notes = [];
    contact.notes.unshift({
      id: `note-${Date.now()}`,
      contactId,
      body: noteBody,
      authorName,
      createdAt: new Date().toISOString(),
    });
    return contact;
  }

  // Conversations
  getConversations(): Conversation[] {
    return [...this.conversations];
  }

  getConversationById(id: string): Conversation | undefined {
    return this.conversations.find(c => c.id === id);
  }

  getMessages(conversationId: string): Message[] {
    return this.messages[conversationId] || [];
  }

  sendMessage(conversationId: string, body: string, senderName: string = "عيادات لومينا"): Message {
    const msg: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      body,
      direction: "outbound",
      channel: "whatsapp",
      status: "sent",
      createdAt: new Date().toISOString(),
      senderName,
    };
    if (!this.messages[conversationId]) {
      this.messages[conversationId] = [];
    }
    this.messages[conversationId].push(msg);

    // Update conversation last message
    const conv = this.getConversationById(conversationId);
    if (conv) {
      conv.lastMessageBody = body;
      conv.lastMessageDate = msg.createdAt;
      conv.lastMessageDirection = "outbound";
    }

    return msg;
  }

  // Opportunities
  getOpportunities(): Opportunity[] {
    return [...this.opportunities];
  }

  createOpportunity(data: Partial<Opportunity>): Opportunity {
    const opp: Opportunity = {
      id: `opp-${Date.now()}`,
      contactId: data.contactId || "",
      contactName: data.contactName || "عميل غير معروف",
      contactPhone: data.contactPhone || "",
      service: data.service || "استشارة تجميلية",
      monetaryValue: data.monetaryValue || 1000,
      stageId: data.stageId || "new_lead",
      assignedStaff: data.assignedStaff || "فريق الاستقبال",
      lastActivityDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.opportunities.unshift(opp);
    return opp;
  }

  updateOpportunityStage(id: string, stageId: Opportunity["stageId"]): Opportunity | undefined {
    const opp = this.opportunities.find(o => o.id === id);
    if (opp) {
      opp.stageId = stageId;
      opp.lastActivityDate = new Date().toISOString();
    }
    return opp;
  }

  // Appointments
  getAppointments(): Appointment[] {
    return [...this.appointments];
  }

  createAppointment(data: Partial<Appointment>): Appointment {
    const apt: Appointment = {
      id: `apt-${Date.now()}`,
      contactId: data.contactId || "",
      contactName: data.contactName || "عميل غير معروف",
      contactPhone: data.contactPhone || "",
      service: data.service || "استشارة عامة",
      startTime: data.startTime || new Date().toISOString(),
      endTime: data.endTime || new Date(Date.now() + 3600 * 1000).toISOString(),
      status: data.status || "confirmed",
      staffName: data.staffName || "د. نورة الشمري",
      notes: data.notes || "",
      locationId: "loc_demo_lumina_riyadh",
    };
    this.appointments.unshift(apt);
    return apt;
  }
}

// Global singleton for Next.js dev server persistence across API requests
declare global {
  // eslint-disable-next-line no-var
  var __beatAppMockStore: MockStore | undefined;
}

export const mockStore = global.__beatAppMockStore || new MockStore();
if (process.env.NODE_ENV !== "production") {
  global.__beatAppMockStore = mockStore;
}
