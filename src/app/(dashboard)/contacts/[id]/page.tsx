"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Clock,
  Sparkles,
  FileText,
  Plus,
  Send,
  User,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  Star,
  Workflow as WorkflowIcon,
  ShieldAlert,
  Edit3,
  Layers,
  Heart,
  ClipboardList,
  Copy,
  Check,
  ExternalLink,
  ListTodo,
  MinusCircle,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { formatRelativeArabicTime, formatArabicDate, formatArabicTime } from "@/lib/date";
import { formatCurrency } from "@/lib/utils";
import { Contact, Opportunity, Appointment, Workflow, AestheticProfile, ContactTask } from "@/types";

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;

  const [contact, setContact] = React.useState<Contact | null>(null);
  const [opportunities, setOpportunities] = React.useState<Opportunity[]>([]);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [workflows, setWorkflows] = React.useState<Workflow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [newNote, setNewNote] = React.useState("");
  const [submittingNote, setSubmittingNote] = React.useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = React.useState<string | null>(null);

  // Appointment booking modal state
  const [isBookModalOpen, setIsBookModalOpen] = React.useState(false);
  const [bookingLoading, setBookingLoading] = React.useState(false);
  const [bookingError, setBookingError] = React.useState<string | null>(null);
  const [bookFormData, setBookFormData] = React.useState({
    service: "جلسة هيدرافاشيل نضارة بلاتينيوم",
    startTime: new Date(Date.now() + 2 * 3600 * 1000).toISOString().substring(0, 16),
    staffName: "د. نورة الشمري",
    phone: "",
    notes: "",
  });

  // Aesthetic Profile Edit Modal State - clean initial state (NO assumed data!)
  const [isEditProfileOpen, setIsEditProfileOpen] = React.useState(false);
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [profileForm, setProfileForm] = React.useState<AestheticProfile>({
    skinType: undefined,
    fitzpatrickScale: undefined,
    allergies: [],
    contraindications: [],
    targetAreas: [],
    remainingPackageSessions: undefined,
    totalPackageSessions: undefined,
    currentPackageName: "",
    preferredPractitioner: "",
    doctorNotes: "",
  });

  // Send Intake Form Modal State
  const [isSendIntakeOpen, setIsSendIntakeOpen] = React.useState(false);
  const [sendingIntake, setSendingIntake] = React.useState(false);
  const [copiedIntake, setCopiedIntake] = React.useState(false);

  // Invoice Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = React.useState(false);
  const [invoiceLoading, setInvoiceLoading] = React.useState(false);
  const [invoiceForm, setInvoiceForm] = React.useState({
    serviceDescription: "جلسة هيدرافاشيل بلاتينيوم للنضارة",
    amount: "850",
    dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().substring(0, 10),
    sendDirectly: true,
  });

  // Workflow Trigger Modal State
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = React.useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = React.useState("");
  const [workflowTriggering, setWorkflowTriggering] = React.useState(false);

  // Clinical Tasks State
  const [tasks, setTasks] = React.useState<ContactTask[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = React.useState(false);
  const [newTaskForm, setNewTaskForm] = React.useState({
    title: "",
    dueDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString().substring(0, 10),
    description: "",
    assignedTo: "د. نورة الشمري",
  });
  const [submittingTask, setSubmittingTask] = React.useState(false);

  // Deduct Session Modal State
  const [isDeductModalOpen, setIsDeductModalOpen] = React.useState(false);
  const [deductForm, setDeductForm] = React.useState({
    treatmentName: "",
    practitioner: "د. نورة الشمري",
    notes: "",
    notifyWhatsApp: true,
  });
  const [deducting, setDeducting] = React.useState(false);

  // Clinical Quick Templates Modal State
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = React.useState(false);
  const [templateSending, setTemplateSending] = React.useState(false);
  const [templateSuccess, setTemplateSuccess] = React.useState<string | null>(null);

  const fetchContactData = React.useCallback(async () => {
    try {
      const [cRes, oppRes, aptRes, wfRes, tskRes] = await Promise.all([
        fetch(`/api/contacts/${contactId}`).then((r) => r.json()),
        fetch("/api/opportunities").then((r) => r.json()),
        fetch("/api/appointments").then((r) => r.json()),
        fetch("/api/workflows").then((r) => r.json()),
        fetch(`/api/contacts/${contactId}/tasks`).then((r) => r.json()).catch(() => ({ tasks: [] })),
      ]);

      const contactObj = cRes.contact || null;
      setContact(contactObj);
      setTasks(tskRes.tasks || []);
      if (contactObj?.aestheticProfile) {
        setProfileForm(contactObj.aestheticProfile);
      } else {
        setProfileForm({
          skinType: undefined,
          fitzpatrickScale: undefined,
          allergies: [],
          contraindications: [],
          targetAreas: [],
          remainingPackageSessions: undefined,
          totalPackageSessions: undefined,
          currentPackageName: "",
          preferredPractitioner: "",
          doctorNotes: "",
        });
      }

      setWorkflows(wfRes.workflows || []);
      if (wfRes.workflows?.length > 0) {
        setSelectedWorkflowId(wfRes.workflows[0].id);
      }
      setOpportunities(
        (oppRes.opportunities || []).filter(
          (o: Opportunity) =>
            o.contactId === contactId ||
            (contactObj && o.contactName && o.contactName.trim() === contactObj.name?.trim())
        )
      );
      setAppointments(
        (aptRes.appointments || []).filter(
          (a: Appointment) =>
            a.contactId === contactId ||
            (contactObj && a.contactName && a.contactName.trim() === contactObj.name?.trim())
        )
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  React.useEffect(() => {
    fetchContactData();
  }, [fetchContactData]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmittingNote(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newNote, authorName: "أحمد بن عبد العزيز" }),
      });
      if (res.ok) {
        setNewNote("");
        fetchContactData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingNote(false);
    }
  };

  // Clinical Task Handlers
  const handleToggleTask = async (taskId: string, completed: boolean) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed } : t))
    );
    try {
      await fetch(`/api/contacts/${contactId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      window.dispatchEvent(new Event("beatapp:refresh-notifications"));
    } catch (e) {
      console.error(e);
      fetchContactData();
    }
  };

  const handleCreateTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskForm.title.trim()) return;

    setSubmittingTask(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTaskForm),
      });
      const data = await res.json();
      if (data.task) {
        setTasks((prev) => [data.task, ...prev]);
        setIsTaskModalOpen(false);
        setNewTaskForm({
          title: "",
          dueDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString().substring(0, 10),
          description: "",
          assignedTo: contact?.assignedStaff || "فريق التمريض",
        });
        setActionSuccessMsg("تمت إضافة مهمة المتابعة بنجاح");
        setTimeout(() => setActionSuccessMsg(null), 3000);
        window.dispatchEvent(new Event("beatapp:refresh-notifications"));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleQuickPresetTask = async (title: string, daysAhead: number, desc: string) => {
    try {
      const res = await fetch(`/api/contacts/${contactId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          dueDate: new Date(Date.now() + daysAhead * 24 * 3600 * 1000).toISOString(),
          description: desc,
          assignedTo: contact?.assignedStaff || "فريق التمريض",
        }),
      });
      const data = await res.json();
      if (data.task) {
        setTasks((prev) => [data.task, ...prev]);
        setActionSuccessMsg(`تمت جدولة: ${title}`);
        setTimeout(() => setActionSuccessMsg(null), 3000);
        window.dispatchEvent(new Event("beatapp:refresh-notifications"));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await fetch(`/api/contacts/${contactId}/tasks/${taskId}`, { method: "DELETE" });
      window.dispatchEvent(new Event("beatapp:refresh-notifications"));
    } catch (e) {
      console.error(e);
    }
  };

  // Treatment Deduction Handler
  const handleDeductSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) return;

    setDeducting(true);
    try {
      const currentRemaining = contact.aestheticProfile?.remainingPackageSessions ?? 1;
      const newRemaining = Math.max(0, currentRemaining - 1);

      const updatedProfile: AestheticProfile = {
        ...(contact.aestheticProfile || {}),
        remainingPackageSessions: newRemaining,
        lastTreatmentDate: new Date().toISOString(),
      };

      await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aestheticProfile: updatedProfile }),
      });

      const noteBody = `[جلسة علاجية منجزة]
الخدمة: ${deductForm.treatmentName || contact.aestheticProfile?.currentPackageName || "جلسة من الباقة"}
المعالج: ${deductForm.practitioner || contact.assignedStaff || "فريق العيادة"}
رصيد الجلسات بعد الخصم: ${newRemaining} من ${contact.aestheticProfile?.totalPackageSessions || currentRemaining} جلسات
ملاحظات الجلسة: ${deductForm.notes || "لا توجد ملاحظات إضافية"}`;

      await fetch(`/api/contacts/${contactId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: noteBody,
          authorName: deductForm.practitioner || "فريق العيادة",
        }),
      });

      if (deductForm.notifyWhatsApp) {
        const msgText = `عزيزتي ${contact.name}، نأمل أن تكوني قد قضيتِ وقتاً مميزاً خلال جلستكِ اليوم في عياداتنا ✨ تم خصم الجلسة من رصيد باقتكِ بنجاح. رصيدكِ المتبقي الآن هو (${newRemaining}) جلسات. نتطلع لرؤيتكِ في موعدكِ القادم!`;
        await fetch(`/api/conversations/${contactId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: msgText }),
        }).catch(() => {});
      }

      setIsDeductModalOpen(false);
      setActionSuccessMsg(`تم خصم الجلسة بنجاح! الرصيد المتبقي: ${newRemaining} جلسات.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
      fetchContactData();
      window.dispatchEvent(new Event("beatapp:refresh-notifications"));
    } catch (e) {
      console.error(e);
    } finally {
      setDeducting(false);
    }
  };

  // Clinical Template Send Handler
  const handleSendTemplate = async (templateText: string) => {
    setTemplateSending(true);
    setTemplateSuccess(null);
    try {
      await fetch(`/api/conversations/${contactId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: templateText }),
      });
      setTemplateSuccess("تم إرسال الرسالة السريرية بنجاح عبر واتساب ✨");
      setTimeout(() => {
        setTemplateSuccess(null);
        setIsTemplatesModalOpen(false);
      }, 1500);
    } catch (e) {
      console.error(e);
    } finally {
      setTemplateSending(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) return;
    setBookingLoading(true);
    setBookingError(null);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contact.id,
          contactName: contact.name,
          contactPhone: bookFormData.phone || contact.phone || "",
          service: bookFormData.service,
          startTime: new Date(bookFormData.startTime).toISOString(),
          endTime: new Date(new Date(bookFormData.startTime).getTime() + 60 * 60 * 1000).toISOString(),
          staffName: bookFormData.staffName,
          notes: bookFormData.notes,
        }),
      });

      const resData = await res.json().catch(() => ({}));

      if (res.ok) {
        setIsBookModalOpen(false);
        setActionSuccessMsg("تم تأكيد وحجز الموعد بنجاح في تقويم HighLevel!");
        setTimeout(() => setActionSuccessMsg(null), 4500);
        fetchContactData();
        window.dispatchEvent(new Event("beatapp:refresh-notifications"));
      } else {
        setBookingError(resData.error || resData.details || "تعذر إتمام الحجز، يرجى التحقق من صحة البيانات.");
      }
    } catch (e: unknown) {
      const err = e as Error;
      setBookingError(err.message || "حدث خطأ غير متوقع في الاتصال بالسيرفر");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleSaveAestheticProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aestheticProfile: profileForm }),
      });
      if (res.ok) {
        setIsEditProfileOpen(false);
        setActionSuccessMsg("تم تحديث الملف الإكلينيكي والتجميلي للعميل بنجاح");
        setTimeout(() => setActionSuccessMsg(null), 4000);
        fetchContactData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSendIntakeWhatsApp = async () => {
    if (!contact) return;
    setSendingIntake(true);
    try {
      const intakeUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/consultation/${contact.id}`;

      // Fetch conversations to send via active chat
      const convRes = await fetch("/api/conversations").then((r) => r.json()).catch(() => ({ conversations: [] }));
      const conv = (convRes.conversations || []).find((c: any) => c.contactId === contact.id);
      const messageText = `مرحباً ${contact.name} ✨ في عياداتنا. نرجو التكرم بتعبئة استبيان تقييم البشرة والتاريخ الطبي السريع قبل موعدكِ لمساعدتنا في تخصيص أفضل خطة علاجية لكِ:\n${intakeUrl}`;

      if (conv) {
        await fetch(`/api/conversations/${conv.id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: messageText, channel: "whatsapp" }),
        }).catch(() => {});
      }

      // Add note in patient file
      await fetch(`/api/contacts/${contact.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: `تم إرسال رابط استبيان تقييم البشرة للعميل عبر الواتساب: ${intakeUrl}`,
          authorName: "فريق الاستقبال",
        }),
      }).catch(() => {});

      setIsSendIntakeOpen(false);
      setActionSuccessMsg("تم إرسال رابط استبيان البشرة للعميل عبر الواتساب بنجاح!");
      setTimeout(() => setActionSuccessMsg(null), 4500);
      fetchContactData();
    } catch (err) {
      console.error(err);
    } finally {
      setSendingIntake(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) return;
    setInvoiceLoading(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contact.id,
          contactName: contact.name,
          contactPhone: contact.phone,
          amount: parseFloat(invoiceForm.amount),
          items: [
            {
              description: invoiceForm.serviceDescription,
              quantity: 1,
              unitPrice: parseFloat(invoiceForm.amount),
              total: parseFloat(invoiceForm.amount),
            },
          ],
          dueDate: invoiceForm.dueDate,
          sendDirectly: invoiceForm.sendDirectly,
        }),
      });
      if (res.ok) {
        setIsInvoiceModalOpen(false);
        setActionSuccessMsg("تم إصدار الفاتورة وإرسال رابط الدفع الإلكتروني عبر الواتساب للعميل!");
        setTimeout(() => setActionSuccessMsg(null), 4500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleSendReviewRequest = async () => {
    if (!contact) return;
    try {
      const res = await fetch("/api/reviews/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: contact.id, channel: "whatsapp" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccessMsg(data.message || "تم إرسال رابط تقييم Google عبر الواتساب بنجاح!");
      } else {
        setActionSuccessMsg(data.error || data.message || "تعذر إرسال طلب التقييم");
      }
      setTimeout(() => setActionSuccessMsg(null), 4500);
      fetchContactData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact || !selectedWorkflowId) return;
    setWorkflowTriggering(true);
    try {
      const res = await fetch(`/api/workflows/${selectedWorkflowId}/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: contact.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsWorkflowModalOpen(false);
        setActionSuccessMsg(data.message || "تم تشغيل مسار العمل بنجاح");
        setTimeout(() => setActionSuccessMsg(null), 4500);
        fetchContactData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWorkflowTriggering(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        جاري تحميل ملف العميل...
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="py-20 text-center space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">لم يتم العثور على العميل</h3>
        <Link href="/contacts">
          <Button variant="outline" size="sm">العودة إلى قائمة العملاء</Button>
        </Link>
      </div>
    );
  }

  // Purely actual data - NO fake defaults!
  const profile = contact.aestheticProfile;
  const hasAestheticData = !!(
    profile &&
    (profile.skinType ||
      profile.fitzpatrickScale ||
      profile.currentPackageName ||
      (profile.allergies && profile.allergies.length > 0) ||
      (profile.targetAreas && profile.targetAreas.length > 0) ||
      (profile.contraindications && profile.contraindications.length > 0) ||
      profile.doctorNotes)
  );

  const intakeLink = typeof window !== "undefined" ? `${window.location.origin}/consultation/${contact.id}` : "";

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-4 text-right" dir="rtl">
      {/* Back button */}
      <div>
        <Link
          href="/contacts"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowRight className="h-4 w-4" />
          <span>العودة إلى قائمة العملاء</span>
        </Link>
      </div>

      {actionSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{actionSuccessMsg}</span>
        </div>
      )}

      {/* Customer Header Card */}
      <Card className="p-6 border-slate-200/80 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar name={contact.name} size="lg" />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">{contact.name}</h1>
                <Badge variant="brand">عميل نشط</Badge>
                {contact.tags.map((t) => (
                  <Badge key={t} variant="neutral" className="text-[10px]">
                    {t}
                  </Badge>
                ))}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-slate-500 font-mono">
                <span dir="ltr">{contact.phone}</span>
                {contact.email && <span>{contact.email}</span>}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/conversations`}>
              <Button variant="primary" size="sm" className="gap-1.5 text-xs">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>مراسلة واتساب</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-brand-700 border-brand-200 bg-brand-50/50 hover:bg-brand-100"
              onClick={() => setIsSendIntakeOpen(true)}
              title="إرسال استبيان تقييم البشرة للعميل ليجيب عليها بنفسه"
            >
              <ClipboardList className="h-3.5 w-3.5 text-brand-600" />
              <span>إرسال استبيان البشرة</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => {
                setBookFormData({
                  service: contact.serviceInterest || "جلسة هيدرافاشيل نضارة بلاتينيوم",
                  startTime: new Date(Date.now() + 2 * 3600 * 1000).toISOString().substring(0, 16),
                  staffName: contact.assignedStaff || "د. نورة الشمري",
                  phone: contact.phone || "",
                  notes: "",
                });
                setBookingError(null);
                setIsBookModalOpen(true);
              }}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>حجز موعد</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              onClick={() => setIsInvoiceModalOpen(true)}
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>رابط دفع وفاتورة</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
              onClick={handleSendReviewRequest}
            >
              <Star className="h-3.5 w-3.5" />
              <span>طلب تقييم Google</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50"
              onClick={() => setIsWorkflowModalOpen(true)}
            >
              <WorkflowIcon className="h-3.5 w-3.5" />
              <span>تشغيل أتمتة</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-brand-800 border-brand-200 bg-teal-50/50 hover:bg-teal-100/60"
              onClick={() => setIsTemplatesModalOpen(true)}
              title="إرسال تعليمات ما بعد الجلسة أو رسائل سريرية سريعة"
            >
              <Sparkles className="h-3.5 w-3.5 text-brand-600" />
              <span>قوالب سريرية سريعة</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Grid: Details & Side Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Aesthetic Profile & Notes */}
        <div className="lg:col-span-1 space-y-6">
          {/* Aesthetic Clinical Profile Card */}
          <Card className="border-brand-200 bg-gradient-to-b from-brand-50/30 to-white shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-brand-100/60 bg-white/60">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-600" />
                <CardTitle className="text-sm text-brand-950 font-bold">الملف الإكلينيكي والتجميلي</CardTitle>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsSendIntakeOpen(true)}
                  className="h-7 px-2 text-xs text-emerald-700 hover:bg-emerald-50 gap-1 font-semibold"
                  title="إرسال رابط الاستبيان للعميل عبر الواتساب"
                >
                  <Send className="h-3 w-3" />
                  <span>الاستبيان</span>
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (contact.aestheticProfile) setProfileForm(contact.aestheticProfile);
                    setIsEditProfileOpen(true);
                  }}
                  className="h-7 px-2 text-xs text-brand-700 hover:bg-brand-100 gap-1"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>تعديل</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3.5 text-xs">
              {!hasAestheticData ? (
                /* Clear Empty State when NO data has been collected yet */
                <div className="py-6 px-3 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-center space-y-3">
                  <div className="h-11 w-11 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">لم يتم تسجيل بيانات إكلينيكية بعد</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      هذا الملف فارغ حالياً. يمكنك إرسال استبيان البشرة للعميل ليجيب عليه بنفسه من هاتفه وتُسجّل البيانات تلقائياً، أو إدخالها يدوياً.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => setIsSendIntakeOpen(true)}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 w-full justify-center"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>إرسال استبيان البشرة (واتساب)</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditProfileOpen(true)}
                      className="text-xs gap-1.5 w-full justify-center"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>تعبئة البيانات يدوياً</span>
                    </Button>
                  </div>
                </div>
              ) : (
                /* Actual Data Display - Only showing what was truly entered */
                <>
                  <div className="flex justify-between py-1 border-b border-brand-100/60">
                    <span className="text-slate-500">نوع البشرة</span>
                    <span className="font-semibold text-slate-900">
                      {profile?.skinType === "combination" ? "مختلطة (Combination)" :
                       profile?.skinType === "dry" ? "جافة (Dry)" :
                       profile?.skinType === "oily" ? "دهنية (Oily)" :
                       profile?.skinType === "sensitive" ? "حساسة (Sensitive)" :
                       profile?.skinType === "normal" ? "عادية (Normal)" :
                       <span className="text-slate-400 font-normal">غير محدد</span>}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-brand-100/60">
                    <span className="text-slate-500">مقياس فيتزباتريك</span>
                    {profile?.fitzpatrickScale ? (
                      <Badge variant="neutral" className="font-mono text-xs bg-white text-slate-800">
                        Type {profile.fitzpatrickScale}
                      </Badge>
                    ) : (
                      <span className="text-slate-400 font-normal">غير محدد</span>
                    )}
                  </div>

                  <div className="flex justify-between py-1 border-b border-brand-100/60">
                    <span className="text-slate-500">الباقة الحالية</span>
                    <span className="font-semibold text-brand-800 text-left">
                      {profile?.currentPackageName || <span className="text-slate-400 font-normal">لا توجد باقة مسجلة</span>}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-brand-100/60 items-center">
                    <span className="text-slate-500">الجلسات المتبقية</span>
                    {profile?.remainingPackageSessions !== undefined ? (
                      <span className="font-bold text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {profile.remainingPackageSessions} من {profile.totalPackageSessions || profile.remainingPackageSessions} جلسات
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">غير محدد</span>
                    )}
                  </div>

                  <div className="space-y-1 py-1 border-b border-brand-100/60">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                      <span>الحساسية والموانع الطبية:</span>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {profile?.allergies && profile.allergies.length > 0 ? (
                        profile.allergies.map((al, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
                            {al}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[11px]">لا توجد حساسية مسجلة</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 py-1">
                    <span className="text-slate-500 block">مناطق المعالجة المستهدفة:</span>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {profile?.targetAreas && profile.targetAreas.length > 0 ? (
                        profile.targetAreas.map((area, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                            {area}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[11px]">غير محددة</span>
                      )}
                    </div>
                  </div>

                  {profile?.doctorNotes && (
                    <div className="p-2.5 bg-brand-50/50 rounded-xl border border-brand-100 text-[11px] text-slate-700 mt-2">
                      <span className="font-bold text-brand-900 block mb-0.5">ملاحظات العميل في الاستبيان:</span>
                      {profile.doctorNotes.replace(/\[BEATAPP_CLINICAL_PROFILE\][\s\S]*?\[\/BEATAPP_CLINICAL_PROFILE\]\s*/g, "").trim()}
                    </div>
                  )}

                  {/* Deduct Session Action */}
                  {profile?.remainingPackageSessions !== undefined && profile.remainingPackageSessions > 0 ? (
                    <div className="pt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setDeductForm({
                            treatmentName: profile.currentPackageName || "جلسة ليزر كانديلا",
                            practitioner: contact.assignedStaff || "د. نورة الشمري",
                            notes: "",
                            notifyWhatsApp: true,
                          });
                          setIsDeductModalOpen(true);
                        }}
                        className="w-full text-xs bg-brand-700 hover:bg-brand-800 text-white gap-1.5 justify-center h-8 font-semibold shadow-xs"
                      >
                        <MinusCircle className="h-3.5 w-3.5" />
                        <span>خصم جلسة من الباقة ({profile.remainingPackageSessions} متبقية)</span>
                      </Button>
                    </div>
                  ) : profile?.remainingPackageSessions === 0 ? (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs mt-2">
                      <span className="font-bold block mb-0.5">⚠️ اكتملت جلسات الباقة</span>
                      <span className="text-[11px]">لقد استهلكت المريضة جميع الجلسات. يمكنك عرض تجديد الباقة أو إرسال فاتورة جديدة.</span>
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

          {/* Section: معلومات العميل */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">معلومات العميل الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">الاهتمام التجميلي</span>
                <span className="font-semibold text-slate-800">{contact.serviceInterest || "غير محدد"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">مصدر العميل</span>
                <span className="font-semibold text-slate-800">{contact.leadSource || "HighLevel"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">الموظف المعني</span>
                <span className="font-semibold text-slate-800">{contact.assignedStaff || "فريق العيادة"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">تاريخ التسجيل</span>
                <span className="font-semibold text-slate-800">{formatArabicDate(contact.createdAt)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">إجمالي المشتريات</span>
                <span className="font-bold text-teal-800 font-mono">{formatCurrency(contact.totalSpent || 0)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Section: ملاحظات الفريق */}
          {(() => {
            const displayNotes = (contact.notes || [])
              .map((note) => ({
                ...note,
                body: note.body
                  .replace(/\[BEATAPP_CLINICAL_PROFILE\][\s\S]*?\[\/BEATAPP_CLINICAL_PROFILE\]\s*/g, "")
                  .trim(),
              }))
              .filter((note) => note.body.length > 0);

            return (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">ملاحظات العيادة الداخلية</CardTitle>
                  <span className="text-[11px] text-slate-400">
                    {displayNotes.length} ملاحظة
                  </span>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleAddNote} className="space-y-2">
                    <textarea
                      placeholder="أضف ملاحظة جديدة حول تفضيلات العميل أو الجلسة..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 resize-none h-20"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={!newNote.trim() || submittingNote}
                        isLoading={submittingNote}
                      >
                        <span>حفظ الملاحظة</span>
                      </Button>
                    </div>
                  </form>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto">
                    {displayNotes.length > 0 ? (
                      displayNotes.map((note) => (
                        <div key={note.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                          <p className="text-slate-700 leading-relaxed whitespace-pre-line">{note.body}</p>
                          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                            <span>بواسطة: {note.authorName}</span>
                            <span>{formatRelativeArabicTime(note.createdAt)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-3">لا توجد ملاحظات مسجلة بعد</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>

        {/* Right Column: Opportunities & Appointments Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: فرص المبيعات والصفقات */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <CardTitle className="text-sm">المبيعات والصفقات في كانبان</CardTitle>
              </div>
              <Link href="/opportunities">
                <span className="text-xs text-brand-700 hover:underline">عرض في لوحة كانبان</span>
              </Link>
            </CardHeader>
            <CardContent>
              {opportunities.length > 0 ? (
                <div className="space-y-3">
                  {opportunities.map((opp) => (
                    <div
                      key={opp.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{opp.service}</h4>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                          <span>الموظف: {opp.assignedStaff}</span>
                          <span>•</span>
                          <span>{formatRelativeArabicTime(opp.lastActivityDate)}</span>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-teal-800 font-mono">
                          {formatCurrency(opp.monetaryValue)}
                        </div>
                        <Badge variant="brand" className="mt-1 text-[10px]">
                          قيد المتابعة
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">لا توجد صفقات مبيعات مسجلة لهذا العميل</p>
              )}
            </CardContent>
          </Card>

          {/* Section: مهام المتابعة السريرية (Clinical Follow-up Tasks) */}
          <Card className="border-emerald-200/80 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <ListTodo className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm">مهام المتابعة السريرية والتذكيرات (Tasks)</CardTitle>
                  <p className="text-[10px] text-slate-400">تزامن مباشر مع مهام GoHighLevel</p>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 mr-2">
                  {tasks.filter((t) => !t.completed).length} قيد المتابعة
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsTaskModalOpen(true)}
                className="h-7 text-xs text-brand-700 border-brand-200 bg-brand-50/50 hover:bg-brand-100 gap-1 font-semibold"
              >
                <Plus className="h-3 w-3" />
                <span>إضافة مهمة</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pb-2.5 border-b border-slate-100 text-xs">
                <span className="text-[11px] text-slate-400 ml-1">إضافة سريعة:</span>
                <button
                  type="button"
                  onClick={() => handleQuickPresetTask("متابعة ما بعد الفيلر (التورم والكدمات)", 2, "التواصل مع المريضة عبر واتساب بعد 48 ساعة للاطمئنان والتذكير بعدم فرك المنطقة")}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-transparent rounded-lg text-[11px] text-slate-700 transition-colors"
                >
                  💉 بعد الفيلر (48 س)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPresetTask("متابعة تقشير البشرة وتجديد المرطب", 7, "متابعة بدء التقشير وتأكيد استخدام كريم بيبانثين والواقي")}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-transparent rounded-lg text-[11px] text-slate-700 transition-colors"
                >
                  💆 بعد التقشير (7 أيام)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPresetTask("تأكيد حجز جلسة الرتوش للبوتوكس", 14, "الاتصال بالمريضة لحجز موعد الرتوش المجاني")}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-transparent rounded-lg text-[11px] text-slate-700 transition-colors"
                >
                  📅 موعد الرتوش (14 يوم)
                </button>
              </div>

              {/* Tasks List */}
              {tasks.length > 0 ? (
                <div className="space-y-2.5 max-h-72 overflow-y-auto">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                        task.completed
                          ? "bg-slate-50/50 border-slate-200 text-slate-400"
                          : "bg-white border-slate-200/90 shadow-2xs hover:border-brand-300"
                      }`}
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={(e) => handleToggleTask(task.id, e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-xs font-bold ${task.completed ? "text-slate-400 line-through" : "text-slate-900"}`}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-mono">
                            <span>الموعد: {formatArabicDate(task.dueDate)}</span>
                            {task.assignedTo && <span>• المسؤول: {task.assignedTo}</span>}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-slate-300 hover:text-rose-600 p-1 rounded transition-colors"
                        title="حذف المهمة"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">لا توجد مهام متابعة حالياً لهذا العميل</p>
              )}
            </CardContent>
          </Card>

          {/* Section: جدول المواعيد */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-sky-600" />
                <CardTitle className="text-sm">سجل المواعيد والزيارات</CardTitle>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBookFormData({
                    service: contact.serviceInterest || "جلسة هيدرافاشيل نضارة بلاتينيوم",
                    startTime: new Date(Date.now() + 2 * 3600 * 1000).toISOString().substring(0, 16),
                    staffName: contact.assignedStaff || "د. نورة الشمري",
                    phone: contact.phone || "",
                    notes: "",
                  });
                  setBookingError(null);
                  setIsBookModalOpen(true);
                }}
                className="text-xs text-brand-700 hover:underline font-semibold"
              >
                حجز موعد جديد
              </button>
            </CardHeader>
            <CardContent>
              {appointments.length > 0 ? (
                <div className="space-y-3">
                  {appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center h-10 w-10 rounded-xl bg-sky-50 text-sky-800 border border-sky-100 font-bold text-xs">
                          {formatArabicTime(apt.startTime)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{apt.service}</h4>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            مع: {apt.staffName}
                          </div>
                        </div>
                      </div>
                      <Badge variant="success" className="text-[10px]">
                        مؤكد في التقويم
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">لا توجد مواعيد مسجلة حالياً</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal: Send Intake Form Link via WhatsApp */}
      <Modal
        isOpen={isSendIntakeOpen}
        onClose={() => setIsSendIntakeOpen(false)}
        title={`إرسال استبيان تقييم البشرة لـ: ${contact.name}`}
        maxWidth="md"
      >
        <div className="space-y-4 text-right">
          <p className="text-xs text-slate-600 leading-relaxed">
            سيتم إرسال رابط نموذج الاستبيان السريري المخصص للعميلة عبر الواتساب، وبمجرد إرسالها لإجاباتها، سيتم تحديث الملف الإكلينيكي تلقائياً هنا!
          </p>

          <div className="p-3 bg-brand-50/60 rounded-2xl border border-brand-100 text-xs space-y-2">
            <span className="font-bold text-brand-950 block">رابط الاستبيان المخصص للعميل:</span>
            <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200" dir="ltr">
              <input
                type="text"
                readOnly
                value={intakeLink}
                className="w-full text-xs text-slate-600 bg-transparent focus:outline-none font-mono"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(intakeLink);
                  setCopiedIntake(true);
                  setTimeout(() => setCopiedIntake(false), 2000);
                }}
                className="h-7 px-2 text-xs shrink-0"
              >
                {copiedIntake ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
            <span className="font-semibold text-slate-700 block">معاينة الرسالة للعميل:</span>
            <p className="leading-relaxed">
              &quot;مرحباً {contact.name} ✨ في عياداتنا. نرجو التكرم بتعبئة استبيان تقييم البشرة والتاريخ الطبي السريع قبل موعدكِ لمساعدتنا في تخصيص أفضل خطة علاجية لكِ...&quot;
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2 border-t border-slate-100">
            <a
              href={intakeLink}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                type="button"
                variant="outline"
                className="w-full text-xs gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>فتح الاستبيان للمعاينة</span>
              </Button>
            </a>

            <Button
              type="button"
              disabled={sendingIntake}
              onClick={handleSendIntakeWhatsApp}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{sendingIntake ? "جاري الإرسال..." : "إرسال الرابط عبر الواتساب الآن"}</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Aesthetic Profile Modal */}
      <Modal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title="تعديل الملف الإكلينيكي والتجميلي للعميل"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveAestheticProfile} className="space-y-4 text-right">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">نوع البشرة</label>
              <select
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800"
                value={profileForm.skinType || ""}
                onChange={(e) => setProfileForm({ ...profileForm, skinType: (e.target.value || undefined) as any })}
              >
                <option value="">-- اختر نوع البشرة --</option>
                <option value="combination">مختلطة (Combination)</option>
                <option value="dry">جافة (Dry)</option>
                <option value="oily">دهنية (Oily)</option>
                <option value="sensitive">حساسة (Sensitive)</option>
                <option value="normal">عادية (Normal)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">مقياس فيتزباتريك</label>
              <select
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800"
                value={profileForm.fitzpatrickScale || ""}
                onChange={(e) => setProfileForm({ ...profileForm, fitzpatrickScale: (e.target.value || undefined) as any })}
              >
                <option value="">-- اختر المقياس --</option>
                <option value="I">Type I (بشرة شاحبة جداً)</option>
                <option value="II">Type II (فاتحة)</option>
                <option value="III">Type III (حنطية فاتحة)</option>
                <option value="IV">Type IV (حنطية معتدلة)</option>
                <option value="V">Type V (سمراء)</option>
                <option value="VI">Type VI (داكنة جداً)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الباقة الحالية</label>
              <Input
                value={profileForm.currentPackageName || ""}
                onChange={(e) => setProfileForm({ ...profileForm, currentPackageName: e.target.value })}
                placeholder="مثال: باقة 4 جلسات ليزر"
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الجلسات المتبقية</label>
              <Input
                type="number"
                value={profileForm.remainingPackageSessions ?? ""}
                onChange={(e) => setProfileForm({ ...profileForm, remainingPackageSessions: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                placeholder="عدد الجلسات"
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">الحساسية والموانع الطبية</label>
            <Input
              value={(profileForm.allergies || []).join(", ")}
              onChange={(e) => setProfileForm({ ...profileForm, allergies: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
              placeholder="مثال: حساسية لاتكس، حساسية تخدير ليدوكائين"
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">مناطق المعالجة المستهدفة</label>
            <Input
              value={(profileForm.targetAreas || []).join(", ")}
              onChange={(e) => setProfileForm({ ...profileForm, targetAreas: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
              placeholder="مثال: الوجه والرقبة، الذراعين، الشفايف"
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ملاحظات الطبيب / الأخصائي</label>
            <textarea
              rows={2}
              value={profileForm.doctorNotes || ""}
              onChange={(e) => setProfileForm({ ...profileForm, doctorNotes: e.target.value })}
              placeholder="ملاحظات طبية حول درجات الحرارة أو كميات الحقن..."
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditProfileOpen(false)}
              className="text-xs"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={savingProfile}
              className="bg-brand-600 hover:bg-brand-700 text-white text-xs gap-1.5"
            >
              {savingProfile ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Quick Invoice Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title={`إصدار فاتورة ورابط دفع لـ: ${contact.name}`}
        maxWidth="md"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">الخدمة التجميلية</label>
            <Input
              required
              value={invoiceForm.serviceDescription}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, serviceDescription: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">المبلغ (ر.س)</label>
              <Input
                type="number"
                required
                value={invoiceForm.amount}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">تاريخ الاستحقاق</label>
              <Input
                type="date"
                required
                value={invoiceForm.dueDate}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
            <span>إرسال رابط الدفع الإلكتروني فورياً للعميل عبر الواتساب</span>
            <input
              type="checkbox"
              checked={invoiceForm.sendDirectly}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, sendDirectly: e.target.checked })}
              className="h-4 w-4 rounded text-emerald-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsInvoiceModalOpen(false)}
              className="text-xs"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={invoiceLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
            >
              {invoiceLoading ? "جاري الإصدار..." : "إصدار الفاتورة وإرسال الرابط"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Trigger Workflow Modal */}
      <Modal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
        title={`تشغيل أتمتة لـ: ${contact.name}`}
        maxWidth="md"
      >
        <form onSubmit={handleTriggerWorkflow} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">اختر مسار العمل</label>
            <select
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800"
              value={selectedWorkflowId}
              onChange={(e) => setSelectedWorkflowId(e.target.value)}
            >
              {workflows.map((wf) => (
                <option key={wf.id} value={wf.id}>
                  {wf.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsWorkflowModalOpen(false)}
              className="text-xs"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={workflowTriggering}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
            >
              {workflowTriggering ? "جاري التشغيل..." : "تأكيد التشغيل"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Book Appointment Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title={`حجز موعد جديد لـ: ${contact.name}`}
        description="سيتم إدراج الموعد في تقويم HighLevel وتحديث جدول العيادة تلقائياً"
      >
        <form onSubmit={handleBookAppointment} className="space-y-4">
          {bookingError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{bookingError}</span>
            </div>
          )}

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">العميل المحدد:</span>
              <span className="font-bold text-slate-900">{contact.name}</span>
            </div>
            <div className="text-left font-mono" dir="ltr">
              <span className="text-slate-600">{bookFormData.phone || contact.phone || "بدون هاتف مسجل"}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              رقم الهاتف للتواصل وتأكيد الحجز (اختياري)
            </label>
            <Input
              type="tel"
              placeholder="+9665xxxxxxxx"
              value={bookFormData.phone}
              onChange={(e) => setBookFormData({ ...bookFormData, phone: e.target.value })}
              dir="ltr"
              className="text-left font-mono text-xs bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              الخدمة التجميلية *
            </label>
            <select
              value={bookFormData.service}
              onChange={(e) => setBookFormData({ ...bookFormData, service: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
            >
              <option value="جلسة هيدرافاشيل نضارة بلاتينيوم">جلسة هيدرافاشيل نضارة بلاتينيوم</option>
              <option value="ليزر إزالة شعر الجسم كامل">ليزر إزالة شعر الجسم كامل</option>
              <option value="حقن بوتوكس وتجاعيد الجبهة">حقن بوتوكس وتجاعيد الجبهة</option>
              <option value="فيلر شفايف روسي">فيلر شفايف روسي</option>
              <option value="جلسة بلازما الشعر PRP">جلسة بلازما الشعر PRP</option>
              <option value="جلسة ليزر كربوني للوجه">جلسة ليزر كربوني للوجه</option>
              <option value="استشارة تجميلية عامة">استشارة تجميلية عامة</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              التاريخ والوقت *
            </label>
            <Input
              type="datetime-local"
              required
              value={bookFormData.startTime}
              onChange={(e) => setBookFormData({ ...bookFormData, startTime: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              الأخصائي / الطبيب
            </label>
            <select
              value={bookFormData.staffName}
              onChange={(e) => setBookFormData({ ...bookFormData, staffName: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
            >
              <option value="د. نورة الشمري">د. نورة الشمري</option>
              <option value="د. هدى السلمان">د. هدى السلمان</option>
              <option value="أخصائية رغد">أخصائية رغد</option>
              <option value="أخصائية ندى">أخصائية ندى</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ملاحظات الموعد
            </label>
            <Input
              type="text"
              placeholder="مثال: الجلسة الثانية في الباقة، تفضل الانتظار في الجناح الخاص"
              value={bookFormData.notes}
              onChange={(e) => setBookFormData({ ...bookFormData, notes: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBookModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={bookingLoading}>
              تأكيد وتثبيت الموعد
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Clinical Follow-up Task */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="إضافة مهمة متابعة سريرية جديدة"
        description="تُربط المهمة مباشرة بسجل العميل في GoHighLevel وتظهر في لوحة التنبيهات"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              عنوان المهمة السريرية *
            </label>
            <Input
              type="text"
              required
              placeholder="مثال: الاتصال بعد حقن الفيلر بـ 48 ساعة للتأكد من التورم"
              value={newTaskForm.title}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                تاريخ الاستحقاق *
              </label>
              <Input
                type="date"
                required
                value={newTaskForm.dueDate}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                المسؤول عن التنفيذ
              </label>
              <select
                value={newTaskForm.assignedTo}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, assignedTo: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="د. نورة الشمري">د. نورة الشمري</option>
                <option value="د. هدى السلمان">د. هدى السلمان</option>
                <option value="فريق التمريض">فريق التمريض</option>
                <option value="فريق الاستقبال">فريق الاستقبال</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              تفاصيل وتوجيهات إضافية
            </label>
            <textarea
              rows={2}
              placeholder="أي ملاحظات أو أسئلة محددة يجب طرحها على المريضة..."
              value={newTaskForm.description}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsTaskModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submittingTask || !newTaskForm.title.trim()}
              isLoading={submittingTask}
            >
              حفظ المهمة وتعيينها
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Deduct Treatment Package Session */}
      <Modal
        isOpen={isDeductModalOpen}
        onClose={() => setIsDeductModalOpen(false)}
        title="خصم جلسة علاجية من الباقة"
        description="تحديث رصيد جلسات المريضة تلقائياً وتوثيق الجلسة في الملف الطبي"
      >
        <form onSubmit={handleDeductSession} className="space-y-4">
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-950 flex items-center justify-between">
            <div>
              <span className="text-emerald-700 block text-[11px]">الباقة المشتركة:</span>
              <span className="font-bold text-sm">{contact.aestheticProfile?.currentPackageName || "باقة علاجية"}</span>
            </div>
            <div className="text-left">
              <span className="text-emerald-700 block text-[11px]">الرصيد المتبقي:</span>
              <span className="font-bold text-base font-mono">
                {contact.aestheticProfile?.remainingPackageSessions ?? 1} جلسات
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              اسم الجلسة / الخدمة المنفذة *
            </label>
            <Input
              type="text"
              required
              value={deductForm.treatmentName}
              onChange={(e) => setDeductForm({ ...deductForm, treatmentName: e.target.value })}
              placeholder="مثال: جلسة ليزر كانديلا الجسم كامل"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              المعالج / الأخصائي المنفذ للجلسة *
            </label>
            <Input
              type="text"
              required
              value={deductForm.practitioner}
              onChange={(e) => setDeductForm({ ...deductForm, practitioner: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ملاحظات الجلسة (إعدادات الجهاز، استجابة الجلد...)
            </label>
            <textarea
              rows={2}
              value={deductForm.notes}
              onChange={(e) => setDeductForm({ ...deductForm, notes: e.target.value })}
              placeholder="مثال: تمت الجلسة بسلام، درجة الطاقة 14 جول، تجاوب ممتاز للبشرة بدون احمرار مفرط."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <input
              type="checkbox"
              id="notifyWhatsApp"
              checked={deductForm.notifyWhatsApp}
              onChange={(e) => setDeductForm({ ...deductForm, notifyWhatsApp: e.target.checked })}
              className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="notifyWhatsApp" className="text-slate-700 font-medium cursor-pointer">
              إرسال إشعار فوري للمريضة عبر واتساب بتأكيد الجلسة والرصيد المتبقي
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeductModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={deducting}
              className="bg-brand-700 hover:bg-brand-800"
            >
              تأكيد خصم الجلسة وتوثيقها
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Quick Clinical WhatsApp Message Templates */}
      <Modal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        title={`قوالب رسائل سريرية سريعة لـ: ${contact.name}`}
        description="إرسال إرشادات ما بعد الجلسات والمواعيد عبر واتساب بضغطة زر واحدة"
        maxWidth="lg"
      >
        <div className="space-y-4">
          {templateSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{templateSuccess}</span>
            </div>
          )}

          <div className="space-y-3">
            {[
              {
                id: "post_laser",
                title: "تعليمات ما بعد جلسة الليزر",
                badge: "عناية بالبشرة",
                badgeColor: "bg-emerald-100 text-emerald-800",
                icon: "🌿",
                body: `عزيزتي ${contact.name}، لسلامتكِ وضمان أفضل نتائج لجلستكِ اليوم في عياداتنا:\n1. تجنبي الاستحمام بالماء الحار والساونا لمدة 24 ساعة.\n2. استخدمي كريم مرطب مهدئ (مثل بيبانثين) 3 مرات يومياً.\n3. تجنبي التعرض المباشر للشمس واستخدمي واقي شمس SPF 50+.\nفريقنا دائماً في خدمتكِ لأي استفسار 🌸`,
              },
              {
                id: "post_inject",
                title: "تعليمات ما بعد البوتوكس والفيلر",
                badge: "حقن تجميلي",
                badgeColor: "bg-purple-100 text-purple-800",
                icon: "💉",
                body: `عزيزتي ${contact.name}، نتمنى لكِ إطلالة نضرة ومشرقة ✨ نرجو اتباع الإرشادات التالية بعد حقن اليوم:\n1. تجنبي الانحناء أو الاستلقاء التام لمدة 4 ساعات.\n2. تجنبي فرك أو تدليك منطقة الحقن تماماً لمدة 48 ساعة.\n3. تجنبي التمارين الرياضية الشاقة والمشروبات الساخنة جداً اليوم.\nفي حال وجود أي تورم خفيف فهو طبيعي ويزول تدريجياً. فريق العيادة يرحب بكِ دائماً!`,
              },
              {
                id: "location_confirm",
                title: "تأكيد الموعد ورابط الموقع (Google Maps)",
                badge: "مواعيد وزيارات",
                badgeColor: "bg-sky-100 text-sky-800",
                icon: "📍",
                body: `عزيزتي ${contact.name}، نؤكد موعدكِ في عياداتنا للتجميل والليزر 🌸\nموقعنا: الرياض، طريق الملك فهد (https://maps.google.com/?q=beatapp-clinic).\nيُرجى الحضور قبل الموعد بـ 10 دقائق لتسجيل بياناتكِ بكل راحة. نسعد بلقائك!`,
              },
              {
                id: "review_coupon",
                title: "طلب تقييم Google مع كود خصم 10%",
                badge: "سمعة وتقييمات",
                badgeColor: "bg-amber-100 text-amber-800",
                icon: "⭐",
                body: `عزيزتي ${contact.name}، رأيكِ يهمنا ويسعدنا دائماً! نرجو التكرم بمشاركتنا تجربتكِ وتقييمكِ السريع عبر Google: https://g.page/r/beatapp-review/review واحصلي على كود خصم 10% لجلستكِ القادمة ✨`,
              },
            ].map((tmpl) => (
              <div
                key={tmpl.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-brand-300 transition-all space-y-2 text-right"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{tmpl.icon}</span>
                    <h4 className="text-xs font-bold text-slate-900">{tmpl.title}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tmpl.badgeColor}`}>
                      {tmpl.badge}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    disabled={templateSending}
                    onClick={() => handleSendTemplate(tmpl.body)}
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                  >
                    <Send className="h-3 w-3" />
                    <span>إرسال فوري للواتساب</span>
                  </Button>
                </div>
                <p className="text-[11px] text-slate-600 whitespace-pre-line leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-sans">
                  {tmpl.body}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsTemplatesModalOpen(false)}
            >
              إغلاق
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
