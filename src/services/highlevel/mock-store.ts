import {
  Contact,
  Conversation,
  Opportunity,
  Appointment,
  Message,
  Invoice,
  Workflow,
  Review,
  ReviewStats,
  Campaign,
  AestheticProfile,
  ContactTask,
  PropertyUnit,
  WhatsAppTemplate,
  EmployeeActivity,
  StaffPerformanceSummary,
  User,
  Tenant,
} from "@/types";
import {
  MOCK_CONTACTS,
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
  MOCK_OPPORTUNITIES,
  MOCK_APPOINTMENTS,
  MOCK_INVOICES,
  MOCK_WORKFLOWS,
  MOCK_REVIEWS,
  MOCK_REVIEW_STATS,
  MOCK_CAMPAIGNS,
  MOCK_PROPERTY_UNITS,
  MOCK_WHATSAPP_TEMPLATES,
  MOCK_EMPLOYEE_ACTIVITIES,
  MOCK_STAFF_PERFORMANCE,
  MOCK_USERS,
  MOCK_TENANTS,
} from "@/lib/mock-data";

// In-memory store for controlled demo mode
class MockStore {
  private tenants: Tenant[] = [...MOCK_TENANTS];
  private contacts: Contact[] = [...MOCK_CONTACTS];
  private conversations: Conversation[] = [...MOCK_CONVERSATIONS];
  private messages: Record<string, Message[]> = JSON.parse(JSON.stringify(MOCK_MESSAGES));
  private opportunities: Opportunity[] = [...MOCK_OPPORTUNITIES];
  private appointments: Appointment[] = [...MOCK_APPOINTMENTS];
  private invoices: Invoice[] = [...MOCK_INVOICES];
  private workflows: Workflow[] = [...MOCK_WORKFLOWS];
  private reviews: Review[] = [...MOCK_REVIEWS];
  private reviewStats: ReviewStats = { ...MOCK_REVIEW_STATS };
  private campaigns: Campaign[] = [...MOCK_CAMPAIGNS];
  private propertyUnits: PropertyUnit[] = [...MOCK_PROPERTY_UNITS];
  private whatsappTemplates: WhatsAppTemplate[] = [...MOCK_WHATSAPP_TEMPLATES];
  private employeeActivities: EmployeeActivity[] = [...MOCK_EMPLOYEE_ACTIVITIES];
  private staffPerformance: StaffPerformanceSummary[] = [...MOCK_STAFF_PERFORMANCE];
  private users: User[] = [...MOCK_USERS];
  private aestheticProfiles: Record<string, AestheticProfile> = {};

  constructor() {
    this.loadFromDisk();
  }

  private saveToDisk() {
    try {
      const fs = require("fs");
      const path = require("path");
      const dir = path.join(process.cwd(), ".data");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const filePath = path.join(dir, "tenants.json");
      const data = {
        tenants: this.tenants.filter(t => t.id !== "tenant-beatapp-live"),
        users: this.users.filter(u => u.tenantId !== "tenant-beatapp-live"),
      };
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    } catch (e) {
      console.warn("Failed to persist tenants to disk", e);
    }
  }

  private loadFromDisk() {
    try {
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(process.cwd(), ".data", "tenants.json");
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf8");
        const data = JSON.parse(raw);
        if (data.tenants && Array.isArray(data.tenants)) {
          for (const t of data.tenants) {
            const idx = this.tenants.findIndex(existing => existing.id === t.id);
            if (idx === -1) this.tenants.push(t);
            else this.tenants[idx] = t;
          }
        }
        if (data.users && Array.isArray(data.users)) {
          for (const u of data.users) {
            const idx = this.users.findIndex(existing => existing.id === u.id);
            if (idx === -1) this.users.push(u);
            else this.users[idx] = u;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to load tenants from disk", e);
    }
  }
  private tasks: ContactTask[] = [
    {
      id: "tsk-1",
      contactId: "cnt-1",
      title: "متابعة تواصل مع العميل وتأكيد الموعد",
      dueDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      completed: false,
      assignedTo: "abeer fawzi",
      description: "التواصل مع العميل عبر واتساب للاطمئنان وتأكيد موعد الزيارة القادمة.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "tsk-2",
      contactId: "cnt-2",
      title: "تأكيد موعد المتابعة والاستشارة",
      dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
      completed: false,
      assignedTo: "Maryam Osama",
      description: "تأكيد جلسة الاستشارة ومراجعة المتطلبات.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "tsk-3",
      contactId: "0LVcflz67WDujOnZMoHE",
      title: "متابعة نتيجة استبيان العميل واقتراح الخطة المناسبة",
      dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      completed: false,
      assignedTo: "Radwa Hafez",
      description: "مراجعة إجابات الاستبيان ومناقشة التفاصيل مع العميل.",
      createdAt: new Date().toISOString(),
    },
  ];

  // Contacts
  getContacts(search?: string, filter?: string, locationId?: string): Contact[] {
    let result = [...this.contacts];
    if (locationId) {
      const isRe = locationId.includes("eamar") || locationId.includes("re");
      if (isRe) {
        result = result.filter(
          c => c.locationId === locationId || c.tags.some(t => t.includes("عقار") || t.includes("فلل") || t.includes("أبراج") || t.includes("حجز"))
        );
      } else {
        result = result.filter(
          c => c.locationId !== "loc_eamar_aloma" && !c.tags.some(t => t.includes("عقار") || t.includes("فلل") || t.includes("أبراج"))
        );
      }
    }
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

    // تسجيل نشاط إضافة العميل وإسناده تلقائياً
    this.logActivity({
      userId: "user-current",
      userName: newContact.assignedStaff || "الموظف",
      userRole: "sales",
      type: "lead_created",
      title: "تسجيل عميل جديد وإسناده تلقائياً",
      description: `تمت إضافة العميل (${newContact.name}) وإسناد المتابعة تلقائياً إلى (${newContact.assignedStaff}).`,
      contactId: newContact.id,
      contactName: newContact.name,
    });

    // Also automatically create an opportunity for this new lead
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
  getConversations(locationId?: string): Conversation[] {
    let result = [...this.conversations];
    if (locationId) {
      const isRe = locationId.includes("eamar") || locationId.includes("re");
      if (isRe) {
        result = result.filter(
          c => c.id.startsWith("conv-re") || c.opportunityStage?.includes("عقار") || c.opportunityStage?.includes("حجز") || c.opportunityStage?.includes("معاينة")
        );
      } else {
        result = result.filter(c => !c.id.startsWith("conv-re"));
      }
    }
    return result;
  }

  getConversationById(id: string): Conversation | undefined {
    return this.conversations.find(c => c.id === id);
  }

  getMessages(conversationId: string): Message[] {
    return this.messages[conversationId] || [];
  }

  sendMessage(conversationId: string, body: string, senderName: string = "خدمة العملاء"): Message {
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

  // Aesthetic Profile (Custom Fields)
  getAestheticProfile(contactId: string): AestheticProfile | undefined {
    return this.aestheticProfiles[contactId] || this.getContactById(contactId)?.aestheticProfile;
  }

  updateContactAestheticProfile(contactId: string, profile: AestheticProfile): Contact | undefined {
    const existing = this.aestheticProfiles[contactId] || {};
    this.aestheticProfiles[contactId] = { ...existing, ...profile };
    const contact = this.getContactById(contactId);
    if (contact) {
      contact.aestheticProfile = this.aestheticProfiles[contactId];
      contact.updatedAt = new Date().toISOString();
    }
    return contact;
  }

  // Invoices & Payments
  getInvoices(filter?: string): Invoice[] {
    if (!filter || filter === "all") return [...this.invoices];
    return this.invoices.filter(i => i.status === filter);
  }

  getInvoiceById(id: string): Invoice | undefined {
    return this.invoices.find(i => i.id === id);
  }

  createInvoice(data: Partial<Invoice>): Invoice {
    const id = `inv-${Date.now()}`;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(this.invoices.length + 46).padStart(4, "0")}`;
    const newInvoice: Invoice = {
      id,
      invoiceNumber,
      contactId: data.contactId || "",
      contactName: data.contactName || "عميل غير معروف",
      contactPhone: data.contactPhone || "",
      amount: data.amount || 0,
      currency: "ر.س",
      status: data.status || "pending",
      items: data.items || [],
      paymentLink: `https://pay.beatapp.med/${id}`,
      dueDate: data.dueDate || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      notes: data.notes || "فاتورة خدمات واستشارات تجميلية",
    };
    this.invoices.unshift(newInvoice);

    // If customer has a conversation, also notify via conversation message
    const conv = this.conversations.find(c => c.contactId === data.contactId);
    if (conv) {
      this.sendMessage(
        conv.id,
        `فاتورة جديدة صادرة برقم ${invoiceNumber} بمبلغ ${newInvoice.amount} ر.س. يمكنك السداد مباشرة عبر الرابط: ${newInvoice.paymentLink}`
      );
    }

    return newInvoice;
  }

  updateInvoiceStatus(id: string, status: Invoice["status"]): Invoice | undefined {
    const inv = this.invoices.find(i => i.id === id);
    if (inv) {
      inv.status = status;
      if (status === "paid") {
        inv.paidAt = new Date().toISOString();
        // Update contact total spent if exists
        const contact = this.getContactById(inv.contactId);
        if (contact) {
          contact.totalSpent = (contact.totalSpent || 0) + inv.amount;
        }
      }
    }
    return inv;
  }

  sendInvoicePaymentLink(id: string, channel: "whatsapp" | "sms" = "whatsapp"): { success: boolean; message: string } {
    const inv = this.getInvoiceById(id);
    if (!inv) return { success: false, message: "الفاتورة غير موجودة" };

    const conv = this.conversations.find(c => c.contactId === inv.contactId);
    if (conv) {
      this.sendMessage(
        conv.id,
        `تذكير برابط الدفع الإلكتروني لفاتورتك رقم ${inv.invoiceNumber} بمبلغ ${inv.amount} ر.س:\n${inv.paymentLink}`
      );
    }
    return { success: true, message: `تم إرسال رابط الدفع بنجاح عبر ${channel === "whatsapp" ? "واتساب" : "رسالة نصية"}` };
  }

  // Workflows & Automations
  getWorkflows(): Workflow[] {
    return [...this.workflows];
  }

  toggleWorkflow(id: string): Workflow | undefined {
    const wf = this.workflows.find(w => w.id === id);
    if (wf) {
      wf.isActive = !wf.isActive;
      wf.updatedAt = new Date().toISOString();
    }
    return wf;
  }

  triggerWorkflowForContact(workflowId: string, contactId: string): { success: boolean; message: string; workflowName: string } {
    const wf = this.workflows.find(w => w.id === workflowId);
    const contact = this.getContactById(contactId);
    if (!wf) return { success: false, message: "سير العمل غير موجود", workflowName: "" };
    if (!contact) return { success: false, message: "العميل غير موجود", workflowName: wf.name };

    wf.totalEnrolled += 1;
    wf.updatedAt = new Date().toISOString();

    // Add note to contact indicating workflow execution
    this.addContactNote(
      contactId,
      `تم إدخال العميل في مسار الأتمتة: "${wf.name}". الحدث المشغل: ${wf.triggerEvent}`,
      "نظام الأتمتة التلقائي"
    );

    return {
      success: true,
      message: `تم تفعيل سير العمل "${wf.name}" للعميل ${contact.name} بنجاح.`,
      workflowName: wf.name,
    };
  }

  // Reviews & Reputation Management
  getReviews(ratingFilter?: number): Review[] {
    if (!ratingFilter) return [...this.reviews];
    return this.reviews.filter(r => r.rating === ratingFilter);
  }

  getReviewStats(): ReviewStats {
    return { ...this.reviewStats };
  }

  sendReviewRequest(contactId: string, channel: "whatsapp" | "sms" = "whatsapp"): { success: boolean; message: string } {
    const contact = this.getContactById(contactId);
    if (!contact) return { success: false, message: "العميل غير موجود" };

    this.reviewStats.requestsSentThisMonth += 1;

    const conv = this.conversations.find(c => c.contactId === contactId);
    const text = `عزيزتي ${contact.name}، يسعدنا دائماً استقبالكِ وخدمتكِ ✨ رأيكِ يهمنا ويسهم في تطوير خدماتنا. نرجو التكرم بمشاركتنا تقييمكِ السريع عبر Google: https://g.page/r/beatapp-review/review`;

    if (conv) {
      this.sendMessage(conv.id, text);
    }

    this.addContactNote(contactId, `تم إرسال طلب تقييم Google عبر ${channel === "whatsapp" ? "واتساب" : "SMS"}.`, "فريق العناية بالعملاء");

    return {
      success: true,
      message: `تم إرسال طلب التقييم بنجاح إلى ${contact.name} عبر ${channel === "whatsapp" ? "واتساب" : "رسالة نصية"}`,
    };
  }

  replyToReview(reviewId: string, replyText: string): Review | undefined {
    const rev = this.reviews.find(r => r.id === reviewId);
    if (rev) {
      rev.reply = replyText;
      rev.replyDate = new Date().toISOString();
    }
    return rev;
  }

  // Campaigns & Broadcasts
  getCampaigns(): Campaign[] {
    return [...this.campaigns];
  }

  createCampaign(data: Partial<Campaign>): Campaign {
    const id = `cmp-${Date.now()}`;
    const recipientsCount = data.recipientsCount || Math.floor(Math.random() * 200) + 50;
    const isScheduled = !!data.scheduledFor;

    const newCampaign: Campaign = {
      id,
      title: data.title || "حملة عروض جديدة",
      channel: data.channel || "whatsapp",
      targetAudience: data.targetAudience || "جميع العملاء",
      targetTag: data.targetTag,
      messageContent: data.messageContent || "",
      status: isScheduled ? "scheduled" : "sent",
      recipientsCount,
      deliveredCount: isScheduled ? 0 : Math.floor(recipientsCount * 0.98),
      readCount: isScheduled ? 0 : Math.floor(recipientsCount * 0.76),
      sentAt: isScheduled ? undefined : new Date().toISOString(),
      scheduledFor: data.scheduledFor,
      createdAt: new Date().toISOString(),
    };

    this.campaigns.unshift(newCampaign);
    return newCampaign;
  }

  // Tasks & Clinical Follow-ups
  getTasks(contactId?: string): ContactTask[] {
    if (contactId) {
      return this.tasks.filter((t) => t.contactId === contactId);
    }
    return [...this.tasks];
  }

  createTask(data: Partial<ContactTask> & { contactId: string }): ContactTask {
    const newTask: ContactTask = {
      id: `tsk-${Date.now()}`,
      contactId: data.contactId,
      title: data.title || "مهمة متابعة سريرية",
      dueDate: data.dueDate || new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      completed: !!data.completed,
      assignedTo: data.assignedTo || "فريق التمريض",
      description: data.description || "",
      createdAt: new Date().toISOString(),
    };
    this.tasks.unshift(newTask);
    return newTask;
  }

  toggleTask(taskId: string, completed?: boolean): ContactTask | undefined {
    const task = this.tasks.find((t) => t.id === taskId);
    if (task) {
      task.completed = completed !== undefined ? completed : !task.completed;
    }
    return task;
  }

  deleteTask(taskId: string): boolean {
    const idx = this.tasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      this.tasks.splice(idx, 1);
      return true;
    }
    return false;
  }

  // -----------------------------------------------------------
  // Real Estate Units & Concurrency-Safe Reservation Lock
  // -----------------------------------------------------------
  getPropertyUnits(filter?: string, search?: string): PropertyUnit[] {
    let result = this.propertyUnits.filter(
      (u) =>
        u.id !== "unit-101" &&
        u.id !== "unit-102" &&
        u.id !== "unit-103" &&
        u.id !== "unit-104" &&
        u.id !== "unit-105" &&
        u.id !== "unit-106"
    );
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.unitCode.toLowerCase().includes(q) ||
          u.projectName.toLowerCase().includes(q) ||
          u.location.toLowerCase().includes(q) ||
          (u.reservedForClientName && u.reservedForClientName.toLowerCase().includes(q))
      );
    }
    if (filter && filter !== "all") {
      result = result.filter((u) => u.status === filter);
    }
    return result;
  }

  getPropertyUnitById(id: string): PropertyUnit | undefined {
    return this.propertyUnits.find((u) => u.id === id);
  }

  createPropertyUnit(data: Partial<PropertyUnit>): PropertyUnit {
    const newUnit: PropertyUnit = {
      id: `unit-${Date.now()}`,
      unitCode: data.unitCode || `UNIT-${Math.floor(100 + Math.random() * 900)}`,
      projectName: data.projectName || "مشروع النخبة العقاري",
      type: data.type || "apartment",
      area: Number(data.area) || 150,
      bedrooms: Number(data.bedrooms) || 3,
      bathrooms: Number(data.bathrooms) || 2,
      floor: data.floor || "الدور الأول",
      price: Number(data.price) || 1200000,
      downPayment: Number(data.downPayment) || 120000,
      installmentYears: Number(data.installmentYears) || 5,
      location: data.location || "الرياض",
      status: "available",
      features: data.features || ["تشطيب سوبر ديلوكس", "موقف سيارة"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.propertyUnits.unshift(newUnit);
    return newUnit;
  }

  updatePropertyUnit(id: string, data: Partial<PropertyUnit>): PropertyUnit | undefined {
    const idx = this.propertyUnits.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.propertyUnits[idx] = {
      ...this.propertyUnits[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return this.propertyUnits[idx];
  }

  deletePropertyUnit(id: string): boolean {
    const idx = this.propertyUnits.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.propertyUnits.splice(idx, 1);
      return true;
    }
    return false;
  }

  /**
   * Atomic Concurrency-Safe Reservation Lock:
   * Prevents another agent from reserving a unit that is already reserved, sold, or blocked.
   */
  reservePropertyUnit(params: {
    unitId: string;
    agentId: string;
    agentName: string;
    clientId: string;
    clientName: string;
    clientPhone?: string;
    notes?: string;
  }): { success: boolean; message: string; unit?: PropertyUnit } {
    const unit = this.propertyUnits.find((u) => u.id === params.unitId);
    if (!unit) {
      return { success: false, message: "الوحدة العقارية غير موجودة" };
    }

    // فحص القفل: إذا كانت محجوزة أو مباعة أو معلقة يمنع أي موظف ثانٍ من أخذها
    if (unit.status === "reserved") {
      const isSameAgent = unit.reservedByAgentId === params.agentId;
      return {
        success: false,
        message: isSameAgent
          ? `أنت قمت بحجز هذه الوحدة بالفعل للعميل (${unit.reservedForClientName})`
          : `عفواً، هذه الوحدة محجوزة حصرياً بواسطة الزميل (${unit.reservedByAgentName || "موظف مبيعات آخر"}) للعميل (${unit.reservedForClientName || "عميل آخر"}). لا يمكن حجزها إلا بعد فك الحجز من قبل الإدارة.`,
      };
    }

    if (unit.status === "sold") {
      return {
        success: false,
        message: "هذه الوحدة مباعة بالفعل ومسجلة صكوكها نهائياً.",
      };
    }

    if (unit.status === "blocked") {
      return {
        success: false,
        message: "هذه الوحدة معلقة إدارياً ولا يمكن حجزها حالياً.",
      };
    }

    // إتمام الحجز والقفل الحصري لمدة 48 ساعة
    unit.status = "reserved";
    unit.reservedByAgentId = params.agentId;
    unit.reservedByAgentName = params.agentName;
    unit.reservedForClientId = params.clientId;
    unit.reservedForClientName = params.clientName;
    unit.reservedForClientPhone = params.clientPhone || "";
    unit.reservedAt = new Date().toISOString();
    unit.reservationExpiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
    unit.reservationNotes = params.notes || "حجز مبدئي عبر النظام";
    unit.updatedAt = new Date().toISOString();

    // تسجيل النشاط في سجل الموظف
    this.logActivity({
      userId: params.agentId,
      userName: params.agentName,
      userRole: "sales",
      type: "unit_reserved",
      title: "قفل حجز وحدة عقارية حصرياً",
      description: `تم قفل حجز الوحدة (${unit.unitCode}) في (${unit.projectName}) للعميل (${params.clientName}).`,
      contactId: params.clientId,
      contactName: params.clientName,
      unitId: unit.id,
      unitCode: unit.unitCode,
    });

    return {
      success: true,
      message: `تم حجز الوحدة (${unit.unitCode}) بنجاح وقفلها حصرياً باسمك لمدة 48 ساعة.`,
      unit,
    };
  }

  releasePropertyUnit(unitId: string, releasedByName: string): { success: boolean; message: string; unit?: PropertyUnit } {
    const unit = this.propertyUnits.find((u) => u.id === unitId);
    if (!unit) {
      return { success: false, message: "الوحدة العقارية غير موجودة" };
    }

    const prevAgent = unit.reservedByAgentName;
    const prevClient = unit.reservedForClientName;

    unit.status = "available";
    unit.reservedByAgentId = undefined;
    unit.reservedByAgentName = undefined;
    unit.reservedForClientId = undefined;
    unit.reservedForClientName = undefined;
    unit.reservedForClientPhone = undefined;
    unit.reservedAt = undefined;
    unit.reservationExpiresAt = undefined;
    unit.reservationNotes = undefined;
    unit.updatedAt = new Date().toISOString();

    this.logActivity({
      userId: "manager",
      userName: releasedByName,
      userRole: "admin",
      type: "unit_released",
      title: "فك حجز وحدة عقارية",
      description: `قام ${releasedByName} بفك حجز الوحدة (${unit.unitCode}) التي كانت محجوزة لصالح (${prevClient}) عبر (${prevAgent}) وإعادتها كمتاحة للجميع.`,
      unitId: unit.id,
      unitCode: unit.unitCode,
    });

    return {
      success: true,
      message: `تم فك حجز الوحدة (${unit.unitCode}) وإتاحتها لجميع المستشارين.`,
      unit,
    };
  }

  markUnitSold(unitId: string, confirmedByName: string): { success: boolean; message: string; unit?: PropertyUnit } {
    const unit = this.propertyUnits.find((u) => u.id === unitId);
    if (!unit) {
      return { success: false, message: "الوحدة العقارية غير موجودة" };
    }

    unit.status = "sold";
    unit.updatedAt = new Date().toISOString();

    this.logActivity({
      userId: unit.reservedByAgentId || "user-1",
      userName: unit.reservedByAgentName || confirmedByName,
      userRole: "sales",
      type: "deal_won",
      title: "إتمام بيع وحدة عقارية بنجاح",
      description: `تم اعتماد بيع الوحدة (${unit.unitCode}) بقيمة (${unit.price.toLocaleString()} ر.س) للعميل (${unit.reservedForClientName || "عميل"}).`,
      contactId: unit.reservedForClientId,
      contactName: unit.reservedForClientName,
      unitId: unit.id,
      unitCode: unit.unitCode,
    });

    return {
      success: true,
      message: `تم اعتماد بيع الوحدة (${unit.unitCode}) بنجاح.`,
      unit,
    };
  }

  // -----------------------------------------------------------
  // WhatsApp Templates Engine
  // -----------------------------------------------------------
  getWhatsAppTemplates(industry?: string, search?: string): WhatsAppTemplate[] {
    let result = [...this.whatsappTemplates];
    if (industry && industry !== "all") {
      result = result.filter((t) => t.industry === "all" || t.industry === industry);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.content.toLowerCase().includes(q) ||
          (t.shortcutCode && t.shortcutCode.toLowerCase().includes(q))
      );
    }
    return result;
  }

  getWhatsAppTemplateById(id: string): WhatsAppTemplate | undefined {
    return this.whatsappTemplates.find((t) => t.id === id);
  }

  createWhatsAppTemplate(data: Partial<WhatsAppTemplate>): WhatsAppTemplate {
    const newTpl: WhatsAppTemplate = {
      id: `tpl-${Date.now()}`,
      title: data.title || "قالب رسالة جديد",
      category: data.category || "followup",
      industry: data.industry || "all",
      content: data.content || "",
      variables: data.variables || ["{اسم_العميل}", "{اسم_الموظف}"],
      shortcutCode: data.shortcutCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.whatsappTemplates.unshift(newTpl);
    return newTpl;
  }

  updateWhatsAppTemplate(id: string, data: Partial<WhatsAppTemplate>): WhatsAppTemplate | undefined {
    const idx = this.whatsappTemplates.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;
    this.whatsappTemplates[idx] = {
      ...this.whatsappTemplates[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return this.whatsappTemplates[idx];
  }

  deleteWhatsAppTemplate(id: string): boolean {
    const idx = this.whatsappTemplates.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.whatsappTemplates.splice(idx, 1);
      return true;
    }
    return false;
  }

  // -----------------------------------------------------------
  // Employee Activity & Audit Trail
  // -----------------------------------------------------------
  getActivities(userId?: string, limit = 50): EmployeeActivity[] {
    let result = [...this.employeeActivities];
    if (userId && userId !== "all") {
      result = result.filter((a) => a.userId === userId);
    }
    return result.slice(0, limit);
  }

  logActivity(data: Omit<EmployeeActivity, "id" | "timestamp">): EmployeeActivity {
    const activity: EmployeeActivity = {
      ...data,
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.employeeActivities.unshift(activity);

    // Update staff performance stats
    const perf = this.staffPerformance.find((p) => p.userId === data.userId);
    if (perf) {
      perf.activitiesCount += 1;
      if (data.type === "deal_won") {
        perf.dealsWon += 1;
      }
      if (data.type === "unit_reserved") {
        perf.activeReservationsCount += 1;
      }
      if (data.type === "whatsapp_sent" || data.type === "call_logged") {
        perf.contactedLeads += 1;
      }
    }

    return activity;
  }

  // -----------------------------------------------------------
  // Users & Staff Performance
  // -----------------------------------------------------------
  getUsers(): User[] {
    return [...this.users];
  }

  getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  getStaffPerformance(): StaffPerformanceSummary[] {
    return [...this.staffPerformance];
  }

  reassignContact(contactId: string, newStaffName: string, managerName = "المدير"): Contact | undefined {
    const contact = this.contacts.find((c) => c.id === contactId);
    if (contact) {
      const prev = contact.assignedStaff || "غير معين";
      contact.assignedStaff = newStaffName;
      contact.updatedAt = new Date().toISOString();

      this.logActivity({
        userId: "user-1",
        userName: managerName,
        userRole: "admin",
        type: "lead_assigned",
        title: "إعادة إسناد عميل لموظف",
        description: `تمت إعادة إسناد العميل (${contact.name}) من (${prev}) إلى (${newStaffName}).`,
        contactId: contact.id,
        contactName: contact.name,
      });
    }
    return contact;
  }

  // -----------------------------------------------------------
  // Multi-Tenant SaaS Management
  // -----------------------------------------------------------
  getTenants(): Tenant[] {
    return this.tenants.filter(
      (t) =>
        t.id !== "tenant-sorouh-re" &&
        t.id !== "tenant-lumina-medspa" &&
        t.id !== "tenant-alfursan-re"
    );
  }

  getTenantById(id: string): Tenant | undefined {
    if (
      id === "tenant-sorouh-re" ||
      id === "tenant-lumina-medspa" ||
      id === "tenant-alfursan-re"
    ) {
      return undefined;
    }
    return this.tenants.find((t) => t.id === id);
  }

  getTenantByLocationId(locationId: string): Tenant | undefined {
    return this.tenants.find((t) => t.locationId === locationId);
  }

  createTenant(data: Partial<Tenant>): { success: boolean; tenant: Tenant; adminUser: User } {
    const id = `tenant-${Date.now()}`;
    const slug = data.slug || data.name?.toLowerCase().replace(/\s+/g, "-") || `tenant-${Date.now()}`;
    const cleanLocId = data.locationId?.trim() || `loc_${Date.now()}`;
    const isGhl = Boolean(cleanLocId && !cleanLocId.startsWith("loc_"));

    const newTenant: Tenant = {
      id,
      name: data.name || "شركة جديدة",
      slug,
      industry: data.industry || "real_estate",
      locationId: cleanLocId,
      timezone: data.timezone || "Asia/Riyadh",
      currency: data.currency || "ر.س",
      phone: data.phone || "+966 11 000 0000",
      address: data.address || "الرياض",
      isHighLevelConnected: isGhl,
      status: data.status || "active",
      plan: data.plan || "starter",
      adminName: data.adminName || "مدير الشركة",
      adminEmail: data.adminEmail || `admin@${slug}.com`,
      maxUsers: data.maxUsers || 5,
      usersCount: 1,
      createdAt: new Date().toISOString(),
      expiresAt: data.expiresAt || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
    };

    this.tenants.unshift(newTenant);

    // Create the Admin User for this new tenant
    const adminUser: User = {
      id: `user-${Date.now()}`,
      tenantId: newTenant.id,
      name: newTenant.adminName,
      email: newTenant.adminEmail,
      role: "admin",
      locationId: newTenant.locationId,
      phone: newTenant.phone,
      title: `مدير عام (${newTenant.name})`,
      department: "الإدارة العامة",
      assignedLeadsCount: 0,
      contactedCount: 0,
      closedDealsCount: 0,
      totalSalesValue: 0,
      status: "active",
    };
    this.users.push(adminUser);
    this.saveToDisk();

    return { success: true, tenant: newTenant, adminUser };
  }

  updateTenant(id: string, data: Partial<Tenant>): Tenant | undefined {
    const idx = this.tenants.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;
    const isGhl = data.locationId ? !data.locationId.startsWith("loc_") : this.tenants[idx].isHighLevelConnected;
    this.tenants[idx] = { ...this.tenants[idx], ...data, isHighLevelConnected: isGhl };
    this.saveToDisk();
    return this.tenants[idx];
  }

  deleteTenant(id: string): boolean {
    const idx = this.tenants.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.tenants.splice(idx, 1);
      // Remove users of this tenant
      this.users = this.users.filter((u) => u.tenantId !== id);
      this.saveToDisk();
      return true;
    }
    return false;
  }

  createUser(data: Partial<User>): User {
    const id = `user-${Date.now()}`;
    const newUser: User = {
      id,
      tenantId: data.tenantId || "tenant-sorouh-re",
      name: data.name || "موظف جديد",
      email: data.email || `employee-${Date.now()}@company.com`,
      role: data.role || "sales",
      locationId: data.locationId || "loc_default",
      phone: data.phone || "+966 50 000 0000",
      title: data.title || "مستشار مبيعات",
      department: data.department || "المبيعات",
      assignedLeadsCount: 0,
      contactedCount: 0,
      closedDealsCount: 0,
      totalSalesValue: 0,
      status: "active",
    };
    this.users.push(newUser);

    // Update tenant usersCount
    const tenant = this.tenants.find((t) => t.id === newUser.tenantId);
    if (tenant) {
      tenant.usersCount = (tenant.usersCount || 0) + 1;
    }
    this.saveToDisk();

    return newUser;
  }

  updateUser(id: string, data: Partial<User>): User | undefined {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.users[idx] = { ...this.users[idx], ...data };
    this.saveToDisk();
    return this.users[idx];
  }

  deleteUser(id: string): boolean {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      const tenantId = this.users[idx].tenantId;
      this.users.splice(idx, 1);
      const tenant = this.tenants.find((t) => t.id === tenantId);
      if (tenant && tenant.usersCount && tenant.usersCount > 0) {
        tenant.usersCount -= 1;
      }
      this.saveToDisk();
      return true;
    }
    return false;
  }

  getUsersByTenant(tenantId?: string): User[] {
    if (!tenantId || tenantId === "all") return [...this.users];
    return this.users.filter((u) => u.tenantId === tenantId || u.role === "super_admin");
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
