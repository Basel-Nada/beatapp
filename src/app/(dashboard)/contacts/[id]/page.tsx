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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { formatRelativeArabicTime, formatArabicDate, formatArabicTime } from "@/lib/date";
import { formatCurrency } from "@/lib/utils";
import { Contact, Opportunity, Appointment } from "@/types";

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;

  const [contact, setContact] = React.useState<Contact | null>(null);
  const [opportunities, setOpportunities] = React.useState<Opportunity[]>([]);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [newNote, setNewNote] = React.useState("");
  const [submittingNote, setSubmittingNote] = React.useState(false);

  // Appointment booking modal state
  const [isBookModalOpen, setIsBookModalOpen] = React.useState(false);
  const [bookingLoading, setBookingLoading] = React.useState(false);
  const [bookSuccessMsg, setBookSuccessMsg] = React.useState<string | null>(null);
  const [bookFormData, setBookFormData] = React.useState({
    service: "جلسة هيدرافاشيل نضارة بلاتينيوم",
    startTime: new Date(Date.now() + 2 * 3600 * 1000).toISOString().substring(0, 16),
    staffName: "د. نورة الشمري",
    notes: "",
  });

  const fetchContactData = React.useCallback(async () => {
    try {
      const [cRes, oppRes, aptRes] = await Promise.all([
        fetch(`/api/contacts/${contactId}`).then((r) => r.json()),
        fetch("/api/opportunities").then((r) => r.json()),
        fetch("/api/appointments").then((r) => r.json()),
      ]);

      const contactObj = cRes.contact || null;
      setContact(contactObj);
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

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) return;
    setBookingLoading(true);
    setBookSuccessMsg(null);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contact.id,
          contactName: contact.name,
          contactPhone: contact.phone,
          service: bookFormData.service,
          startTime: new Date(bookFormData.startTime).toISOString(),
          endTime: new Date(new Date(bookFormData.startTime).getTime() + 60 * 60 * 1000).toISOString(),
          staffName: bookFormData.staffName,
          notes: bookFormData.notes,
        }),
      });
      if (res.ok) {
        setIsBookModalOpen(false);
        setBookSuccessMsg("تم تأكيد وحجز الموعد بنجاح في تقويم HighLevel!");
        setTimeout(() => setBookSuccessMsg(null), 4500);
        fetchContactData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBookingLoading(false);
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

  return (
    <div className="space-y-6">
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

      {bookSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{bookSuccessMsg}</span>
        </div>
      )}

      {/* Customer Header Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar name={contact.name} size="lg" />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">{contact.name}</h1>
                <Badge variant="brand">عميل نشط</Badge>
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
              <Button variant="primary" size="sm" className="gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 ml-1" />
                <span>مراسلة واتساب</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setBookFormData({
                  service: contact.serviceInterest || "جلسة هيدرافاشيل نضارة بلاتينيوم",
                  startTime: new Date(Date.now() + 2 * 3600 * 1000).toISOString().substring(0, 16),
                  staffName: contact.assignedStaff || "د. نورة الشمري",
                  notes: "",
                });
                setIsBookModalOpen(true);
              }}
            >
              <Calendar className="h-3.5 w-3.5 ml-1" />
              <span>حجز موعد</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Grid: Details & Side Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Information & Notes */}
        <div className="lg:col-span-1 space-y-6">
          {/* Section: معلومات العميل */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">معلومات العميل</CardTitle>
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">ملاحظات العيادة الداخلية</CardTitle>
              <span className="text-[11px] text-slate-400">
                {(contact.notes || []).length} ملاحظة
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
                {contact.notes && contact.notes.length > 0 ? (
                  contact.notes.map((note) => (
                    <div key={note.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <p className="text-slate-700 leading-relaxed">{note.body}</p>
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
        </div>

        {/* Right Column: Opportunities & Appointments Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: فرص المبيعات والصفقات */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <CardTitle className="text-sm">المبيعات والصفقات</CardTitle>
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
                    notes: "",
                  });
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

      {/* Book Appointment Modal for this Contact */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title={`حجز موعد جديد لـ: ${contact.name}`}
        description="سيتم إدراج الموعد في تقويم HighLevel وتحديث جدول العيادة تلقائياً"
      >
        <form onSubmit={handleBookAppointment} className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">العميل المحدد:</span>
              <span className="font-bold text-slate-900">{contact.name}</span>
            </div>
            <div className="text-left font-mono" dir="ltr">
              <span className="text-slate-600">{contact.phone}</span>
            </div>
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
    </div>
  );
}
