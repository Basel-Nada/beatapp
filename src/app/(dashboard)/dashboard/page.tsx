"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  Clock,
  Calendar,
  TrendingUp,
  MessageSquare,
  ArrowLeft,
  ChevronLeft,
  Sparkles,
  Phone,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeArabicTime, formatArabicTime } from "@/lib/date";
import { DashboardMetrics } from "@/types";

export default function DashboardPage() {
  const [data, setData] = React.useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const metrics = data?.metrics || {
    newLeadsCount: 0,
    needsFollowupCount: 0,
    todayAppointmentsCount: 0,
    activeOpportunitiesCount: 0,
  };

  return (
    <div className="space-y-8">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>صباح الخير، أحمد</span>
            <span className="inline-block animate-wave">👋</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            إليك ملخص نشاط العيادة اليوم وفرص التواصل السريعة
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/appointments">
            <Button variant="outline" size="sm" className="bg-white">
              <Calendar className="h-4 w-4 ml-1.5 text-brand-700" />
              <span>جدول المواعيد</span>
            </Button>
          </Link>
          <Link href="/contacts">
            <Button variant="primary" size="sm">
              <Plus className="h-4 w-4 ml-1" />
              <span>إضافة عميل جديد</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* New Leads */}
        <Link href="/contacts?filter=new" className="group">
          <Card className="hover:border-brand-300 hover:shadow-card transition-all relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">عملاء جدد</span>
              <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-bold text-slate-900">
                {loading ? "..." : metrics.newLeadsCount}
              </div>
              <div className="mt-1 flex items-center text-[11px] text-teal-700 font-medium">
                <span>تواصل سريع متاح</span>
              </div>
            </div>
          </Card>
        </Link>

        {/* Needs Follow-up */}
        <Link href="/contacts?filter=needs_followup" className="group">
          <Card className="hover:border-amber-300 hover:shadow-card transition-all relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">يحتاجون متابعة</span>
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-bold text-amber-900">
                {loading ? "..." : metrics.needsFollowupCount}
              </div>
              <div className="mt-1 flex items-center text-[11px] text-amber-700 font-medium">
                <span>مهتمون بانتظار الرد</span>
              </div>
            </div>
          </Card>
        </Link>

        {/* Today's Appointments */}
        <Link href="/appointments" className="group">
          <Card className="hover:border-sky-300 hover:shadow-card transition-all relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">مواعيد اليوم</span>
              <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-bold text-slate-900">
                {loading ? "..." : metrics.todayAppointmentsCount}
              </div>
              <div className="mt-1 flex items-center text-[11px] text-sky-700 font-medium">
                <span>في جدول العيادة اليوم</span>
              </div>
            </div>
          </Card>
        </Link>

        {/* Active Opportunities */}
        <Link href="/opportunities" className="group">
          <Card className="hover:border-purple-300 hover:shadow-card transition-all relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">فرص مبيعات نشطة</span>
              <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-bold text-slate-900">
                {loading ? "..." : metrics.activeOpportunitiesCount}
              </div>
              <div className="mt-1 flex items-center text-[11px] text-purple-700 font-medium">
                <span>باقات قيد الحجز والتأكيد</span>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Main Grid: 3 Distinct Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 1: Recent Conversations */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-brand-700" />
              <h2 className="text-base font-bold text-slate-900">المحادثات الأخيرة</h2>
            </div>
            <Link
              href="/conversations"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-0.5"
            >
              <span>عرض الكل</span>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Link>
          </div>

          <Card className="divide-y divide-slate-100 p-0 overflow-hidden">
            {data?.recentConversations && data.recentConversations.length > 0 ? (
              data.recentConversations.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/conversations?id=${conv.id}`}
                  className="flex items-start gap-3 p-4 hover:bg-slate-50/80 transition-colors block"
                >
                  <Avatar name={conv.contactName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {conv.contactName}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatRelativeArabicTime(conv.lastMessageDate)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {conv.lastMessageBody}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="brand" className="text-[10px] py-0 px-1.5">
                        {conv.channel === "whatsapp" ? "واتساب" : "إنستغرام"}
                      </Badge>
                      {conv.unreadCount > 0 && (
                        <span className="h-2 w-2 rounded-full bg-brand-600" />
                      )}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                لا توجد محادثات حديثة
              </div>
            )}
          </Card>
        </div>

        {/* Section 2: Today's Appointments Timeline */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-sky-700" />
              <h2 className="text-base font-bold text-slate-900">مواعيد اليوم</h2>
            </div>
            <Link
              href="/appointments"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-0.5"
            >
              <span>عرض الكل</span>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Link>
          </div>

          <Card className="divide-y divide-slate-100 p-0 overflow-hidden">
            {data?.todayAppointments && data.todayAppointments.length > 0 ? (
              data.todayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex items-start justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center justify-center h-11 w-11 rounded-xl bg-sky-50 text-sky-800 border border-sky-100 shrink-0">
                      <span className="text-xs font-bold">{formatArabicTime(apt.startTime)}</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900">{apt.contactName}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{apt.service}</p>
                      <div className="mt-1 text-[10px] text-slate-400">
                        مع: <span className="text-slate-600 font-medium">{apt.staffName}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="success" className="text-[10px]">
                    مؤكد
                  </Badge>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                لا توجد مواعيد اليوم
              </div>
            )}
          </Card>
        </div>

        {/* Section 3: Needs Follow-up (يحتاج متابعة) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">يحتاج متابعة</h2>
            </div>
            <Link
              href="/contacts?filter=needs_followup"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-0.5"
            >
              <span>عرض الكل</span>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Link>
          </div>

          <Card className="divide-y divide-slate-100 p-0 overflow-hidden">
            {data?.needsFollowupLeads && data.needsFollowupLeads.length > 0 ? (
              data.needsFollowupLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={lead.name} size="sm" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-slate-900 truncate">{lead.name}</h4>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{lead.serviceInterest}</p>
                      <span className="text-[10px] text-amber-700 font-medium">
                        آخر تواصل: {formatRelativeArabicTime(lead.lastContactDate || lead.createdAt)}
                      </span>
                    </div>
                  </div>

                  <Link href={`/contacts/${lead.id}`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      <span>متابعة</span>
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                لا توجد مهام متابعة معلقة حالياً 🎉
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
