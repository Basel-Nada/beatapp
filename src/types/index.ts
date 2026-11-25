export type UserRole = "super_admin" | "admin" | "manager" | "sales" | "receptionist";

export type IndustryType = "clinic" | "real_estate";

export interface User {
  id: string;
  tenantId?: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  locationId: string;
  phone?: string;
  title?: string;
  department?: string;
  assignedLeadsCount?: number;
  contactedCount?: number;
  closedDealsCount?: number;
  totalSalesValue?: number;
  status?: "active" | "inactive";
}

export type TenantPlan = "starter" | "growth" | "enterprise";
export type TenantStatus = "active" | "trial" | "suspended";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  industry: IndustryType;
  logoUrl?: string;
  locationId: string;
  timezone: string;
  currency: string;
  phone?: string;
  address?: string;
  isHighLevelConnected?: boolean;
  status: TenantStatus;
  plan: TenantPlan;
  adminEmail: string;
  adminName: string;
  maxUsers: number;
  usersCount?: number;
  expiresAt?: string;
  createdAt: string;
}

export type ChannelType = "whatsapp" | "sms" | "instagram" | "facebook" | "email";

export interface Message {
  id: string;
  conversationId: string;
  body: string;
  direction: "inbound" | "outbound";
  channel: ChannelType;
  status: "sent" | "delivered" | "read" | "failed";
  errorMessage?: string;
  createdAt: string;
  senderName?: string;
}

export interface Conversation {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone?: string;
  contactAvatar?: string;
  lastMessageBody: string;
  lastMessageDate: string;
  lastMessageDirection: "inbound" | "outbound";
  unreadCount: number;
  channel: ChannelType;
  status: "open" | "closed" | "snoozed";
  assignedTo?: string;
  opportunityStage?: string;
  nextAppointmentDate?: string;
}

export type ContactFilter = "all" | "new" | "needs_followup" | "interested" | "current_customer";

export interface Contact {
  id: string;
  tenantId?: string;
  locationId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone: string;
  serviceInterest?: string;
  status: "new" | "contacted" | "interested" | "booked" | "customer" | "inactive";
  leadSource?: string;
  assignedStaff?: string;
  /** معرّف الموظف المسؤول في BeatApp */
  assignedToId?: string;
  lastContactDate?: string;
  totalSpent?: number;
  tags: string[];
  notes?: ContactNote[];
  tasks?: ContactTask[];
  aestheticProfile?: AestheticProfile;
  createdAt: string;
  updatedAt: string;
}

export interface ContactNote {
  id: string;
  contactId: string;
  body: string;
  authorName: string;
  createdAt: string;
}

export interface ContactTask {
  id: string;
  contactId: string;
  title: string;
  dueDate: string;
  completed: boolean;
  assignedTo?: string;
  description?: string;
  createdAt: string;
}

export type PipelineStageId = 
  | "new_lead"          // عميل جديد
  | "contacted"         // تم التواصل
  | "interested"        // مهتم
  | "consultation_booked" // حجز استشارة
  | "treatment_scheduled" // تم الحجز
  | "won"               // تم البيع
  | "lost";             // غير مهتم

export interface PipelineStage {
  id: PipelineStageId;
  name: string;
  color: string;
}

export interface Opportunity {
  id: string;
  tenantId?: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  service: string;
  monetaryValue: number;
  stageId: PipelineStageId;
  assignedStaff?: string;
  assignedToId?: string;
  /** حالة الصفقة في BeatApp: open | won | lost | abandoned */
  status?: string;
  lastActivityDate: string;
  createdAt: string;
}

export type AppointmentStatus = "confirmed" | "scheduled" | "showed" | "cancelled" | "noshow";

export interface Appointment {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  service: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  staffName: string;
  assignedUserId?: string;
  notes?: string;
  locationId: string;
  calendarId?: string;
  calendarName?: string;
}

export interface DashboardMetrics {
  metrics: {
    newLeadsCount: number;
    needsFollowupCount: number;
    todayAppointmentsCount: number;
    activeOpportunitiesCount: number;
  };
  recentConversations: Conversation[];
  todayAppointments: Appointment[];
  needsFollowupLeads: Contact[];
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  type: "lead" | "appointment" | "message" | "alert";
  linkUrl?: string;
}

// -------------------------------------------------------------
// MedSpa Aesthetic Profile & Custom Fields
// -------------------------------------------------------------
export interface AestheticProfile {
  skinType?: "normal" | "dry" | "oily" | "combination" | "sensitive";
  fitzpatrickScale?: "I" | "II" | "III" | "IV" | "V" | "VI";
  allergies?: string[];
  contraindications?: string[];
  targetAreas?: string[];
  remainingPackageSessions?: number;
  totalPackageSessions?: number;
  currentPackageName?: string;
  preferredPractitioner?: string;
  lastTreatmentDate?: string;
  doctorNotes?: string;
}

// -------------------------------------------------------------
// Payments & Invoicing
// -------------------------------------------------------------
export type InvoiceStatus = "paid" | "pending" | "overdue" | "cancelled";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  paymentLink?: string;
  paidAt?: string;
  dueDate: string;
  createdAt: string;
  notes?: string;
}

// -------------------------------------------------------------
// Workflows & Automations
// -------------------------------------------------------------
export type WorkflowCategory = "followup" | "booking_reminder" | "re_engagement" | "vip_nurture";

export interface Workflow {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  triggerEvent: string;
  actionSummary: string;
  isActive: boolean;
  totalEnrolled: number;
  totalCompleted: number;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// Reviews & Reputation Management
// -------------------------------------------------------------
export interface Review {
  id: string;
  contactName: string;
  contactAvatar?: string;
  platform: "google" | "internal" | "whatsapp";
  rating: number; // 1 to 5
  comment: string;
  treatmentName?: string;
  reply?: string;
  replyDate?: string;
  createdAt: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
  requestsSentThisMonth: number;
  conversionRate: number;
}

// -------------------------------------------------------------
// Bulk Campaigns & Broadcast
// -------------------------------------------------------------
export type CampaignStatus = "sent" | "scheduled" | "draft";

export interface Campaign {
  id: string;
  title: string;
  channel: "whatsapp" | "sms";
  targetAudience: string;
  targetTag?: string;
  messageContent: string;
  status: CampaignStatus;
  recipientsCount: number;
  deliveredCount: number;
  readCount: number;
  sentAt?: string;
  scheduledFor?: string;
  createdAt: string;
}

// -------------------------------------------------------------
// WhatsApp Templates
// -------------------------------------------------------------
export type WhatsAppTemplateCategory = 
  | "welcome"
  | "followup"
  | "appointment"
  | "property_brochure"
  | "property_reservation"
  | "offer"
  | "payment";

export interface WhatsAppTemplate {
  id: string;
  title: string;
  category: WhatsAppTemplateCategory;
  industry: "all" | "clinic" | "real_estate";
  content: string;
  variables: string[];
  shortcutCode?: string;
  createdAt: string;
  updatedAt?: string;
}

// -------------------------------------------------------------
// Real Estate: Property Units & Exclusive Reservation Lock
// -------------------------------------------------------------
export type UnitStatus = "available" | "reserved" | "sold" | "blocked";

export type UnitType = 
  | "apartment" 
  | "villa" 
  | "duplex" 
  | "penthouse" 
  | "townhouse" 
  | "commercial" 
  | "office";

export interface PropertyUnit {
  id: string;
  tenantId?: string;
  unitCode: string; // e.g. "APT-A102"
  projectName: string; // e.g. "كمبوند النرجس ريزيدنس"
  type: UnitType;
  area: number; // بالمتر المربع
  bedrooms: number;
  bathrooms: number;
  floor: string;
  price: number; // السعر الإجمالي
  downPayment: number; // مقدم الحجز
  installmentYears?: number;
  location: string; // e.g. "الرياض - النرجس"
  status: UnitStatus;
  
  // الحجز الحصري ومنع التضارب
  reservedByAgentId?: string;
  reservedByAgentName?: string;
  reservedForClientId?: string;
  reservedForClientName?: string;
  reservedForClientPhone?: string;
  reservedAt?: string;
  reservationExpiresAt?: string;
  reservationNotes?: string;

  features: string[];
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// Employee Productivity & Activity Audit Trail
// -------------------------------------------------------------
export type ActivityType = 
  | "lead_created"
  | "lead_assigned"
  | "whatsapp_sent"
  | "call_logged"
  | "appointment_booked"
  | "site_visit_scheduled"
  | "unit_reserved"
  | "unit_released"
  | "stage_changed"
  | "deal_won"
  | "note_added";

export interface EmployeeActivity {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userAvatar?: string;
  type: ActivityType;
  title: string;
  description: string;
  contactId?: string;
  contactName?: string;
  unitId?: string;
  unitCode?: string;
  timestamp: string;
}

export interface StaffPerformanceSummary {
  userId: string;
  userName: string;
  userRole: UserRole;
  userAvatar?: string;
  assignedLeads: number;
  contactedLeads: number;
  contactRatePercent: number;
  bookedAppointments: number;
  dealsWon: number;
  totalSalesValue: number;
  activeReservationsCount: number;
  activitiesCount: number;
  conversionRatePercent: number;
}



