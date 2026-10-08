export type UserRole = "admin" | "manager" | "sales" | "receptionist";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  locationId: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  locationId: string;
  timezone: string;
  currency: string;
  phone?: string;
  address?: string;
  isHighLevelConnected: boolean;
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
  lastContactDate?: string;
  totalSpent?: number;
  tags: string[];
  notes?: ContactNote[];
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
  contactId: string;
  contactName: string;
  contactPhone: string;
  service: string;
  monetaryValue: number;
  stageId: PipelineStageId;
  assignedStaff?: string;
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
  notes?: string;
  locationId: string;
  calendarId?: string;
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

