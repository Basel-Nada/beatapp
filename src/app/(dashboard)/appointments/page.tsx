"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Plus,
  CheckCircle2,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { formatArabicDate, formatArabicTime } from "@/lib/date";
import { Appointment } from "@/types";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/context/app-context";

function AppointmentsContent() {
  const { currentUser, users, isAdmin, currentIndustry } = useApp();
  const searchParams = useSearchParams();
  const qContactId = searchParams.get("contactId");
  const qName = searchParams.get("name");
  const qPhone = searchParams.get("phone");
  const qService = searchParams.get("service");

  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<"today" | "week" | "month">("today");
  const [isBookModalOpen, setIsBookModalOpen] = React.useState(false);
  const [bookingError, setBookingError] = React.useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = React.useState<string | null>(null);

  const defaultService =
    currentIndustry === "real_estate"
      ? "معاينة ميدانية لوحدة عقارية"
      : "استشارة وجلسة نضارة للوجه";

  // New appointment form state
  const [formData, setFormData] = React.useState({
    contactId: "",
    contactName: "",
    contactPhone: "",
    service: defaultService,
    startTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString().substring(0, 16),
    staffName: currentUser.name || "فريق العمل",
    assignedUserId: currentUser.id !== "user-super-admin" ? currentUser.id : "",
    notes: "",
  });
  const [booking, setBooking] = React.useState(false);

  // Available slots state
  const [availableSlots, setAvailableSlots] = React.useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = React.useState(false);

  // Fetch free slots from BeatApp for the chosen date
  const loadFreeSlots = React.useCallback(async (targetDateIso: string) => {
    try {
      setLoadingSlots(true);
      const chosen = new Date(targetDateIso);
      const startOfDay = new Date(chosen.getFullYear(), chosen.getMonth(), chosen.getDate(), 0, 0, 0).getTime();
      const endOfDay = startOfDay + 24 * 3600 * 1000;

      const res = await fetch(`/api/appointments?action=slots&startDateMs=${startOfDay}&endDateMs=${endOfDay}`);
      const data = await res.json();
      if (data.slots) {
        // Collect slots array from dates
        const allSlots: string[] = [];
        Object.values(data.slots).forEach((val: unknown) => {
          const entry = val as { slots?: string[] };
          if (Array.isArray(entry?.slots)) {
            allSlots.push(...entry.slots);
          }
        });
        setAvailableSlots(allSlots);
      }
    } catch (e) {
      console.warn("Could not load free slots", e);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  React.useEffect(() => {
    if (isBookModalOpen) {
      loadFreeSlots(formData.startTime);
    }
  }, [isBookModalOpen, formData.startTime, loadFreeSlots]);

  // Sync staffName with active user
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      staffName: currentUser.name || prev.staffName,
      assignedUserId: currentUser.id !== "user-super-admin" ? currentUser.id : prev.assignedUserId,
      service: currentIndustry === "real_estate" ? "معاينة ميدانية لوحدة عقارية" : "استشارة وجلسة نضارة للوجه",
    }));
  }, [currentUser, currentIndustry]);

  // Auto-handle query params to prefill and open booking modal
  React.useEffect(() => {
    if (qName || qPhone || qContactId) {
      if (qName || qPhone) {
        setFormData((prev) => ({
          ...prev,
          contactId: qContactId || "",
          contactName: qName || prev.contactName,
          contactPhone: qPhone || prev.contactPhone,
          service: qService || prev.service,
        }));
        setBookingError(null);
        setIsBookModalOpen(true);
      } else if (qContactId) {
        fetch(`/api/contacts/${qContactId}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.contact) {
              setFormData((prev) => ({
                ...prev,
                contactId: data.contact.id,
                contactName: data.contact.name || prev.contactName,
                contactPhone: data.contact.phone || prev.contactPhone,
                service: data.contact.serviceInterest || prev.service,
              }));
              setBookingError(null);
              setIsBookModalOpen(true);
            }
          })
          .catch(() => {});
      }
    }
  }, [qContactId, qName, qPhone, qService]);

  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAppointments();
  }, []);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBooking(true);
    setBookingError(null);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          contactPhone: formData.contactPhone || "",
          startTime: new Date(formData.startTime).toISOString(),
          endTime: new Date(new Date(formData.startTime).getTime() + 60 * 60 * 1000).toISOString(),
        }),
      });

      const resData = await res.json().catch(() => ({}));

      if (res.ok) {
        setBookingSuccess("تم تثبيت الموعد بنجاح في تقويم BeatApp السحابي!");
        setTimeout(() => {
          setIsBookModalOpen(false);
          setBookingSuccess(null);
          setFormData({
            contactId: "",
            contactName: "",
            contactPhone: "",
            service: defaultService,
            startTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString().substring(0, 16),
            staffName: currentUser.name || "فريق العمل",
            assignedUserId: currentUser.id !== "user-super-admin" ? currentUser.id : "",
            notes: "",
          });
          fetchAppointments();
          window.dispatchEvent(new Event("beatapp:refresh-notifications"));
        }, 1200);
      } else {
        const fullErr = [resData.error, resData.hint].filter(Boolean).join(" — ");
        setBookingError(fullErr || "تعذر حجز الموعد في BeatApp، يرجى التأكد من البيانات.");
      }
    } catch (e: unknown) {
      const err = e as Error;
      setBookingError(err.message || "حدث خطأ في الاتصال");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">جدول المواعيد</h1>
          <p className="mt-1 text-xs text-slate-500">
            إدارة مواعيد العيادة ومزامنة التقويم لحظياً عبر تقويم BeatApp الذكي
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View switcher */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-soft">
            <button
              onClick={() => setViewMode("today")}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === "today" ? "bg-brand-700 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === "week" ? "bg-brand-700 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              الأسبوع
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === "month" ? "bg-brand-700 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              الشهر
            </button>
          </div>

          <Button onClick={() => setIsBookModalOpen(true)} variant="primary" size="md">
            <Plus className="h-4 w-4 ml-1.5" />
            <span>حجز موعد جديد</span>
          </Button>
        </div>
      </div>

      {/* Date Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <CalendarCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {formatArabicDate(new Date().toISOString())}
            </h3>
            <span className="text-[11px] text-slate-500">
              إجمالي {appointments.length} مواعيد مسجلة
            </span>
          </div>
        </div>

        <Badge variant="brand" className="text-xs py-1 px-3">
          تقويم BeatApp السحابي (مباشر)
        </Badge>
      </div>

      {/* Timeline Appointments List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">جاري تحميل جدول المواعيد...</div>
        ) : appointments.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            لا توجد مواعيد مسجلة في هذا اليوم
          </div>
        ) : (
          appointments.map((apt) => (
            <Card
              key={apt.id}
              className="p-4 hover:shadow-card hover:border-brand-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start sm:items-center gap-4">
                {/* Time Badge */}
                <div className="flex flex-col items-center justify-center h-14 w-14 rounded-2xl bg-teal-50 text-teal-800 border border-teal-100 shrink-0">
                  <Clock className="h-4 w-4 mb-0.5 text-teal-600" />
                  <span className="text-xs font-bold font-mono">
                    {formatArabicTime(apt.startTime)}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{apt.contactName}</h3>
                    <Badge variant="success" className="text-[10px]">
                      مؤكد
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    {apt.service}
                  </p>
                  <div className="mt-1 flex items-center gap-4 text-[11px] text-slate-400">
                    <span>الهاتف: <span className="font-mono text-slate-600" dir="ltr">{apt.contactPhone}</span></span>
                    <span>•</span>
                    <span>مع: <span className="text-slate-600 font-medium">{apt.staffName}</span></span>
                    {apt.notes && (
                      <>
                        <span>•</span>
                        <span className="text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded font-medium">{apt.notes}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <Link href={`/contacts/${apt.contactId}`}>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <span>ملف العميل</span>
                  </Button>
                </Link>
                <Link href={`/conversations`}>
                  <Button variant="secondary" size="sm" className="h-8 text-xs">
                    <span>تذكير واتساب</span>
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Book Appointment Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="حجز موعد جديد في العيادة"
        description="سيتم إدراج الموعد في جدول المواعيد وسجل العميل تلقائياً"
      >
        <form onSubmit={handleBookAppointment} className="space-y-4">
          {bookingError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{bookingError}</span>
            </div>
          )}

          {bookingSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{bookingSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              اسم العميل *
            </label>
            <Input
              type="text"
              required
              placeholder="مثال: سارة محمد العتيبي"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              رقم الهاتف (اختياري)
            </label>
            <Input
              type="tel"
              placeholder="+966 50 123 4567"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {currentIndustry === "real_estate" ? "نوع المعاينة / الخدمة" : "الخدمة / الاستشارة المطلوبة"}
            </label>
            {currentIndustry === "real_estate" ? (
              <select
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              >
                <option value="معاينة ميدانية لوحدة عقارية">معاينة ميدانية لوحدة عقارية</option>
                <option value="جلسة تفاوض ودراسة ميزانية">جلسة تفاوض ودراسة ميزانية</option>
                <option value="توقيع عقد وسداد دفعة حجز">توقيع عقد وسداد دفعة حجز</option>
                <option value="استشارة استثمارية عقارية">استشارة استثمارية عقارية</option>
              </select>
            ) : (
              <select
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              >
                <option value="جلسة هيدرافاشيل بلاتينيوم">جلسة هيدرافاشيل بلاتينيوم</option>
                <option value="ليزر إزالة شعر الجسم كامل">ليزر إزالة شعر الجسم كامل</option>
                <option value="حقن بوتوكس وتجاعيد الجبهة">حقن بوتوكس وتجاعيد الجبهة</option>
                <option value="فيلر شفايف وتحديد">فيلر شفايف وتحديد</option>
                <option value="جلسة بلازما الشعر PRP">جلسة بلازما الشعر PRP</option>
                <option value="استشارة جلدية وتجميل عامة">استشارة جلدية وتجميل عامة</option>
              </select>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                التاريخ والوقت *
              </label>
              <span className="text-[10px] text-slate-400">تقويم الرياض (+03:00)</span>
            </div>
            <Input
              type="datetime-local"
              required
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />

            {/* Quick Available Slots from BeatApp Calendar */}
            {availableSlots.length > 0 && (
              <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-[10px] font-bold text-slate-600 mb-1 flex items-center justify-between">
                  <span>✨ الفترات الشاغرة المتاحة في تقويم BeatApp:</span>
                  <span className="text-emerald-700 font-normal">اختر للتعبئة التلقائية</span>
                </div>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {availableSlots.slice(0, 12).map((slot, idx) => {
                    const timeStr = new Date(slot).toLocaleTimeString("ar-SA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => {
                          // Format to YYYY-MM-DDTHH:mm for datetime-local input
                          const d = new Date(slot);
                          const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                            .toISOString()
                            .substring(0, 16);
                          setFormData({ ...formData, startTime: localIso });
                        }}
                        className="text-[10px] bg-white hover:bg-brand-50 hover:border-brand-300 border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono transition-colors"
                      >
                        {timeStr}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              الموظف / المستشار المسؤول
            </label>
            {isAdmin ? (
              <select
                value={formData.staffName}
                onChange={(e) => {
                  const selectedUser = users.find((u) => u.name === e.target.value);
                  setFormData({
                    ...formData,
                    staffName: e.target.value,
                    assignedUserId: selectedUser?.id || "",
                  });
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} ({u.role === "admin" || u.role === "super_admin" ? "إدارة" : "مبيعات"})
                  </option>
                ))}
              </select>
            ) : (
              <Input
                value={currentUser.name}
                disabled
                className="bg-slate-50 font-bold text-slate-700"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ملاحظات الموعد
            </label>
            <Input
              type="text"
              placeholder="مثال: يفضل التواصل عبر واتساب لتأكيد الحضور"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="p-2.5 rounded-xl bg-teal-50/80 border border-teal-200/80 text-[11px] text-teal-900 leading-relaxed">
            💡 <strong>التخزين المباشر:</strong> يتم حفظ وتوثيق الموعد فوراً داخل <strong>تقويم حساب BeatApp السحابي</strong>، ويظهر في الخط الزمني لنشاط العميل مع إصدار رابط Google Meet تلقائياً.
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
            <Button type="submit" variant="primary" size="sm" isLoading={booking}>
              تثبيت وحجز الموعد
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <React.Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">جاري تحميل المواعيد...</div>}>
      <AppointmentsContent />
    </React.Suspense>
  );
}
