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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { formatArabicDate, formatArabicTime } from "@/lib/date";
import { Appointment } from "@/types";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<"today" | "week" | "month">("today");
  const [isBookModalOpen, setIsBookModalOpen] = React.useState(false);

  // New appointment form state
  const [formData, setFormData] = React.useState({
    contactName: "",
    contactPhone: "",
    service: "ليزر إزالة شعر الجسم كامل",
    startTime: new Date().toISOString().substring(0, 16),
    staffName: "د. نورة الشمري",
    notes: "",
  });
  const [booking, setBooking] = React.useState(false);

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
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          startTime: new Date(formData.startTime).toISOString(),
          endTime: new Date(new Date(formData.startTime).getTime() + 60 * 60 * 1000).toISOString(),
        }),
      });
      if (res.ok) {
        setIsBookModalOpen(false);
        setFormData({
          contactName: "",
          contactPhone: "",
          service: "ليزر إزالة شعر الجسم كامل",
          startTime: new Date().toISOString().substring(0, 16),
          staffName: "د. نورة الشمري",
          notes: "",
        });
        fetchAppointments();
      }
    } catch (e) {
      console.error(e);
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
            إدارة مواعيد العيادة ومزامنة التقويم لحظياً مع HighLevel Calendar
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
          مزامنة نشطة مع HighLevel Calendar
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
        description="سيتم إدراج الموعد في تقويم HighLevel تلقائياً"
      >
        <form onSubmit={handleBookAppointment} className="space-y-4">
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
              رقم الهاتف *
            </label>
            <Input
              type="tel"
              required
              placeholder="+966 50 123 4567"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              الخدمة التجميلية
            </label>
            <select
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
            >
              <option value="ليزر إزالة شعر الجسم كامل">ليزر إزالة شعر الجسم كامل</option>
              <option value="جلسة هيدرافاشيل بلاتينيوم">جلسة هيدرافاشيل بلاتينيوم</option>
              <option value="حقن بوتوكس وتجاعيد الجبهة">حقن بوتوكس وتجاعيد الجبهة</option>
              <option value="فيلر شفايف روسي">فيلر شفايف روسي</option>
              <option value="جلسة بلازما الشعر PRP">جلسة بلازما الشعر PRP</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              التاريخ والوقت *
            </label>
            <Input
              type="datetime-local"
              required
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              الأخصائي / الطبيب
            </label>
            <select
              value={formData.staffName}
              onChange={(e) => setFormData({ ...formData, staffName: e.target.value })}
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
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
            <Button type="submit" variant="primary" size="sm" isLoading={booking}>
              تثبيت وحجز الموعد
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
