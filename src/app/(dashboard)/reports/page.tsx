"use client";

import * as React from "react";
import {
  BarChart3,
  Users,
  PhoneCall,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Clock,
  Filter,
  Lock,
  MessageSquare,
  Calendar,
  Building2,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Search,
  UserCheck,
} from "lucide-react";
import { StaffPerformanceSummary, EmployeeActivity, User } from "@/types";
import { useApp } from "@/context/app-context";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function StaffReportsPage() {
  const { currentUser, isAdmin, currentIndustry } = useApp();
  const isStaff = currentUser.role === "sales" || currentUser.role === "receptionist";

  const [performance, setPerformance] = React.useState<StaffPerformanceSummary[]>([]);
  const [activities, setActivities] = React.useState<EmployeeActivity[]>([]);
  const [users, setUsers] = React.useState<User[]>([]);
  const [selectedUserFilter, setSelectedUserFilter] = React.useState<string>("all");
  const [isLoading, setIsLoading] = React.useState(true);

  // Set filter automatically if employee
  React.useEffect(() => {
    if (isStaff && currentUser.id) {
      setSelectedUserFilter(currentUser.id);
    }
  }, [isStaff, currentUser.id]);

  const fetchReportsData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const url =
        selectedUserFilter === "all"
          ? "/api/reports/staff"
          : `/api/reports/staff?userId=${selectedUserFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.performance) setPerformance(data.performance);
      if (data.activities) setActivities(data.activities);
      if (data.users) setUsers(data.users);
    } catch (e) {
      console.error("Error loading reports data", e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedUserFilter]);

  React.useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  // Aggregate stats (or single employee stats when in staff mode)
  const myPerformance = performance.find(
    (p) => p.userId === currentUser.id || p.userName.toLowerCase() === currentUser.name.toLowerCase()
  );

  const totalAssignedLeads = isStaff && myPerformance
    ? myPerformance.assignedLeads
    : performance.reduce((acc, p) => acc + p.assignedLeads, 0);

  const totalContactedLeads = isStaff && myPerformance
    ? myPerformance.contactedLeads
    : performance.reduce((acc, p) => acc + p.contactedLeads, 0);

  const totalDealsWon = isStaff && myPerformance
    ? myPerformance.dealsWon
    : performance.reduce((acc, p) => acc + p.dealsWon, 0);

  const totalRevenue = isStaff && myPerformance
    ? myPerformance.totalSalesValue
    : performance.reduce((acc, p) => acc + p.totalSalesValue, 0);

  const avgConversionRate = isStaff && myPerformance
    ? myPerformance.conversionRatePercent.toFixed(1)
    : performance.length > 0
    ? (performance.reduce((acc, p) => acc + p.conversionRatePercent, 0) / performance.length).toFixed(1)
    : "0";

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {isStaff ? "تقرير أدائي وإنجازاتي الشخصية" : "تقارير أداء وإنتاجية الموظفين"}
            </h1>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                isStaff
                  ? "bg-sky-100 text-sky-900 border border-sky-200"
                  : "bg-brand-100 text-brand-800"
              }`}
            >
              <BarChart3 className="h-3 w-3" />
              <span>{isStaff ? `حساب الموظف: ${currentUser.name}` : "متابعة تفصيلية للإدارة"}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isStaff
              ? `مرحباً ${currentUser.name}، إليك ملخص إنجازك اليومي: عدد العملاء المسندين لك، تواصلك معهم، والصفقات المحققة.`
              : "إحصائيات شاملة لكل موظف: عدد الأشخاص الذين تواصل معهم، الصفقات المحققة، وسجل العمليات الزمني الحي."}
          </p>
        </div>

        {/* User Filter Dropdown */}
        {!isStaff && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="text-xs font-semibold rounded-xl border border-slate-300 p-2 bg-white text-slate-800 shadow-xs focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">عرض أداء جميع الموظفين</option>
              {users
                .filter((u) => u.role !== "super_admin")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.title || "فريق المبيعات"})
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">
            {isStaff ? "عملائي المسندين لي" : "إجمالي العملاء المسندين"}
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-slate-900">{totalAssignedLeads}</span>
            <Users className="h-5 w-5 text-slate-400" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {isStaff ? "ليدات تحت متابعتك المباشرة" : "ليد موزعين على الفريق"}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 block">
            {isStaff ? "تواصلت معهم فعلياً" : "تم التواصل معهم فعلياً"}
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-emerald-700">{totalContactedLeads}</span>
            <PhoneCall className="h-5 w-5 text-emerald-500" />
          </div>
          <span className="text-[10px] text-emerald-600 mt-1 block font-bold">
            {((totalContactedLeads / (totalAssignedLeads || 1)) * 100).toFixed(1)}% نسبة الاستجابة
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-teal-600 block">
            {isStaff ? "صفقاتي المغلقة الناجحة" : "الصفقات الناجحة المغلقة"}
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-teal-800">{totalDealsWon}</span>
            <CheckCircle2 className="h-5 w-5 text-teal-600" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {currentIndustry === "real_estate" ? "عقد ووحدة مباعة" : "جلسات وعقود مكتملة"}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-brand-600 block">
            {isStaff ? "معدل تحويلي الشخصي" : "متوسط معدل التحويل"}
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-brand-700">{avgConversionRate}%</span>
            <TrendingUp className="h-5 w-5 text-brand-500" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">معدل الإغلاق</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-[11px] font-semibold text-slate-500 block">
            {isStaff ? "إجمالي مبيعاتي المحققة" : "إجمالي الإيرادات المحققة"}
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-lg font-bold text-slate-900 truncate">
              {totalRevenue > 1000000
                ? `${(totalRevenue / 1000000).toFixed(2)} مليون`
                : `${totalRevenue.toLocaleString()}`}
            </span>
            <DollarSign className="h-5 w-5 text-slate-400" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">ر.س مبيعات مغلقة</span>
        </div>
      </div>

      {/* Employee Performance Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">جدول إنتاجية وأداء الموظفين</h2>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
              محدث مباشرة
            </span>
          </div>
          <span className="text-xs text-slate-400">مرتب حسب إجمالي الإنجاز</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <th className="py-3 px-4">الموظف</th>
                <th className="py-3 px-3">العملاء المسندين</th>
                <th className="py-3 px-3">العملاء المتواصل معهم</th>
                <th className="py-3 px-3">نسبة التواصل</th>
                <th className="py-3 px-3">المواعيد / المعاينات</th>
                <th className="py-3 px-3">الصفقات المغلقة</th>
                <th className="py-3 px-3">معدل التحويل</th>
                <th className="py-3 px-4">إجمالي المبيعات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {performance.map((staff, index) => {
                const userObj = users.find((u) => u.id === staff.userId);
                const isMe =
                  staff.userId === currentUser.id ||
                  staff.userName.toLowerCase() === currentUser.name.toLowerCase();

                return (
                  <tr
                    key={staff.userId}
                    className={`transition-colors ${
                      isMe
                        ? "bg-amber-50/70 border-y-2 border-amber-300 font-medium"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    {/* User Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-slate-400 w-4">#{index + 1}</span>
                        <Avatar name={staff.userName} size="sm" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{staff.userName}</span>
                            {isMe && (
                              <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full border border-amber-500 shadow-2xs">
                                ⭐ أنت
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {userObj?.title || (staff.userRole === "sales" ? "مستشار مبيعات" : "استقبال")}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Assigned Leads */}
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800">{staff.assignedLeads}</span>
                      <span className="text-[10px] text-slate-400 mr-1">عميل</span>
                    </td>

                    {/* Contacted */}
                    <td className="py-3 px-3">
                      <span className="font-bold text-emerald-700">{staff.contactedLeads}</span>
                      <span className="text-[10px] text-slate-400 mr-1">كلمهم</span>
                    </td>

                    {/* Contact Rate */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${Math.min(staff.contactRatePercent, 100)}%` }}
                          />
                        </div>
                        <span className="font-semibold text-slate-700 text-[11px]">
                          {staff.contactRatePercent}%
                        </span>
                      </div>
                    </td>

                    {/* Booked Appointments / Visits */}
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800">
                        {staff.bookedAppointments} موعد
                      </span>
                    </td>

                    {/* Deals Won */}
                    <td className="py-3 px-3">
                      <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        {staff.dealsWon} صفقات
                      </span>
                    </td>

                    {/* Conversion Rate */}
                    <td className="py-3 px-3">
                      <span className="font-bold text-brand-700">
                        {staff.conversionRatePercent}%
                      </span>
                    </td>

                    {/* Total Sales Value */}
                    <td className="py-3 px-4 font-black text-slate-900">
                      {staff.totalSalesValue > 0
                        ? `${staff.totalSalesValue.toLocaleString()} ر.س`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Activity & Audit Trail Feed */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-700" />
            <h2 className="text-sm font-bold text-slate-900">
              سجل العمليات والنشاط الحي (Audit Trail)
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            يسجل تلقائياً: المكالمات، رسائل الواتساب، حجز الوحدات، وتغييرات الصفقات
          </span>
        </div>

        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">لا يوجد نشاط مسجل حتى الآن</div>
          ) : (
            activities.map((act) => {
              const isReservedAct = act.type === "unit_reserved";
              const isWonAct = act.type === "deal_won";
              const isWhatsAppAct = act.type === "whatsapp_sent";
              const isLeadCreated = act.type === "lead_created";

              return (
                <div
                  key={act.id}
                  className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors bg-slate-50/50"
                >
                  <Avatar name={act.userName} size="sm" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{act.userName}</span>
                        <span className="text-[10px] bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded font-semibold">
                          {act.title}
                        </span>
                        {isReservedAct && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                            <Lock className="h-2.5 w-2.5" />
                            <span>حجز وحدة</span>
                          </span>
                        )}
                        {isWonAct && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                            إغلاق صفقة ✨
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(act.timestamp).toLocaleTimeString("ar-SA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {act.description}
                    </p>

                    {act.contactName && (
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-0.5">
                        <span>العميل: <strong>{act.contactName}</strong></span>
                        {act.unitCode && (
                          <>
                            <span>•</span>
                            <span>الوحدة: <strong className="font-mono">{act.unitCode}</strong></span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
