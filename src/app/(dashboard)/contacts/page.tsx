"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  ChevronLeft,
  Filter,
  ArrowUpDown,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { formatRelativeArabicTime, formatArabicDate } from "@/lib/date";
import { Contact, ContactFilter } from "@/types";
import { useApp } from "@/context/app-context";
import { MessageSquare, UserCheck, Shield } from "lucide-react";

export default function ContactsPage() {
  const { currentUser, users, isAdmin, currentIndustry } = useApp();
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<ContactFilter>("all");
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  const isStaff = currentUser.role === "sales" || currentUser.role === "receptionist";
  const [scopeFilter, setScopeFilter] = React.useState<"all" | "mine">(isStaff ? "mine" : "all");

  // Keep scope in sync when user switches
  React.useEffect(() => {
    if (currentUser.role === "sales" || currentUser.role === "receptionist") {
      setScopeFilter("mine");
    } else {
      setScopeFilter("all");
    }
  }, [currentUser]);

  const myContactsCount = React.useMemo(() => {
    return contacts.filter(
      (c) =>
        c.assignedStaff === currentUser.name ||
        c.assignedStaff?.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        (currentUser.email && c.assignedStaff?.includes(currentUser.email.split("@")[0]))
    ).length;
  }, [contacts, currentUser]);

  const displayedContacts = React.useMemo(() => {
    if (scopeFilter === "mine") {
      const mine = contacts.filter(
        (c) =>
          c.assignedStaff === currentUser.name ||
          c.assignedStaff?.toLowerCase().includes(currentUser.name.toLowerCase()) ||
          (currentUser.email && c.assignedStaff?.includes(currentUser.email.split("@")[0]))
      );
      return mine.length > 0 ? mine : contacts.slice(0, 15);
    }
    return contacts;
  }, [contacts, scopeFilter, currentUser]);

  // New Contact Form State (Auto-assigned to currentUser by default!)
  const [formData, setFormData] = React.useState({
    name: "",
    phone: "",
    email: "",
    serviceInterest: currentIndustry === "real_estate" ? "شقة سكنية 3 غرف" : "ليزر إزالة شعر الجسم كامل",
    assignedStaff: currentUser.name,
  });
  const [creating, setCreating] = React.useState(false);

  // Update default assigned staff when current user changes
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      assignedStaff: currentUser.name,
      serviceInterest: currentIndustry === "real_estate" ? "شقة سكنية 3 غرف" : "ليزر إزالة شعر الجسم كامل",
    }));
  }, [currentUser, currentIndustry]);

  const fetchContacts = React.useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      if (activeFilter !== "all") q.set("filter", activeFilter);

      const res = await fetch(`/api/contacts?${q.toString()}`);
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, activeFilter]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchContacts]);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setFormData({
          name: "",
          phone: "",
          email: "",
          serviceInterest: "ليزر إزالة شعر الجسم كامل",
          assignedStaff: "د. نورة الشمري",
        });
        fetchContacts();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleReassign = async (contactId: string, newStaffName: string) => {
    try {
      await fetch("/api/reports/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reassign",
          contactId,
          newStaffName,
          managerName: currentUser.name,
        }),
      });
      fetchContacts();
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status: Contact["status"]) => {
    switch (status) {
      case "new":
        return <Badge variant="brand">عميل جديد</Badge>;
      case "interested":
        return <Badge variant="warning">مهتم</Badge>;
      case "booked":
        return <Badge variant="info">حجز موعد</Badge>;
      case "customer":
        return <Badge variant="success">عميل حالي</Badge>;
      default:
        return <Badge variant="neutral">تم التواصل</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">العملاء</h1>
          <p className="mt-1 text-xs text-slate-500">
            إدارة ومتابعة سجلات العملاء والليدات وتوزيعهم على موظفي الشركة في BeatApp
          </p>
        </div>

        <Button onClick={() => setIsAddModalOpen(true)} variant="primary" size="md">
          <Plus className="h-4 w-4 ml-1.5" />
          <span>إضافة عميل جديد</span>
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث باسم العميل أو رقم الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "الكل" },
              { id: "new", label: "عملاء جدد" },
              { id: "needs_followup", label: "يحتاج متابعة" },
              { id: "interested", label: "مهتم" },
              { id: "current_customer", label: "عميل حالي" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as ContactFilter)}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
                  activeFilter === f.id
                    ? "bg-brand-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scope Selector: My Leads vs All Leads */}
        <div className="flex flex-wrap items-center justify-between pt-2.5 border-t border-slate-100 text-xs gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px] font-semibold">نطاق الاستعراض:</span>
            <div className="bg-slate-100 p-0.5 rounded-lg flex items-center border border-slate-200">
              <button
                type="button"
                onClick={() => setScopeFilter("mine")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  scopeFilter === "mine"
                    ? "bg-white text-brand-800 shadow-xs ring-1 ring-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                ⭐ عملائي فقط ({myContactsCount || Math.min(contacts.length, 12)})
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter("all")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  scopeFilter === "all"
                    ? "bg-white text-slate-900 shadow-xs ring-1 ring-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                👥 جميع العملاء ({contacts.length})
              </button>
            </div>
          </div>

          {isStaff && (
            <div className="flex items-center gap-1.5 text-[11px] text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
              <span className="font-bold">👤 وضع الموظف:</span>
              <span>أنت تتصفح كـ {currentUser.name} — يتم إسناد العملاء الجدد إليك تلقائياً</span>
            </div>
          )}
        </div>
      </div>

      {/* Contacts Table / List */}
      <Card className="p-0 overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">اسم العميل</th>
                <th className="py-3.5 px-4">رقم الهاتف</th>
                <th className="py-3.5 px-4">الخدمة المطلوبة</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4">آخر تواصل</th>
                <th className="py-3.5 px-4">الموظف المعني</th>
                <th className="py-3.5 px-4 sm:px-6 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    جاري تحميل سجلات العملاء...
                  </td>
                </tr>
              ) : displayedContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="text-slate-700 font-medium mb-1">لا يوجد عملاء يطابقون البحث أو التصفية الحالية</div>
                    <div className="text-slate-400 text-[11px]">يمكنك إضافة عميل جديد بنقرة زر أعلاه</div>
                  </td>
                </tr>
              ) : (
                displayedContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                  >
                    <td className="py-4 px-4 sm:px-6">
                      <Link href={`/contacts/${contact.id}`} className="flex items-center gap-3">
                        <Avatar name={contact.name} size="sm" />
                        <div>
                          <span className="font-bold text-slate-900 group-hover:text-brand-700 transition-colors block">
                            {contact.name}
                          </span>
                          {contact.email && (
                            <span className="text-[10px] text-slate-400 font-normal">{contact.email}</span>
                          )}
                        </div>
                      </Link>
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-700" dir="ltr">
                      {contact.phone}
                    </td>

                    <td className="py-4 px-4 text-slate-700 font-medium">
                      {contact.serviceInterest || "استشارة عامة"}
                    </td>

                    <td className="py-4 px-4">
                      {getStatusBadge(contact.status)}
                    </td>

                    <td className="py-4 px-4 text-slate-500 text-[11px]">
                      {formatRelativeArabicTime(contact.lastContactDate || contact.createdAt)}
                    </td>

                    <td className="py-4 px-4 text-slate-600">
                      {isAdmin ? (
                        <select
                          value={contact.assignedStaff || currentUser.name}
                          onChange={(e) => handleReassign(contact.id, e.target.value)}
                          className="text-xs rounded-lg border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-brand-500"
                          title="إعادة إسناد العميل لموظف آخر"
                        >
                          {users.map((u) => (
                            <option key={u.id} value={u.name}>
                              {u.name} ({u.role === "admin" ? "أدمن" : "مبيعات"})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800">
                            {contact.assignedStaff || "فريق العمل"}
                          </span>
                          {contact.assignedStaff === currentUser.name && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                              مسند إليك
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href="/templates" title="إرسال قالب واتساب سريع">
                          <button className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200/80 transition-colors">
                            <MessageSquare className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                        <Link href={`/contacts/${contact.id}`}>
                          <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs text-slate-700">
                            <span>عرض الملف</span>
                            <ChevronLeft className="h-3 w-3 mr-1" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="إضافة عميل جديد"
        description="سيتم تسجيل العميل وإسناده لمسؤول المتابعة تلقائياً"
      >
        <form onSubmit={handleCreateContact} className="space-y-4">
          {/* Automatic Assignment Notice */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
            <Shield className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>
              نظام الإسناد الفوري: سيتم تسجيل هذا العميل باسم (<strong>{formData.assignedStaff || currentUser.name}</strong>) لضمان حفظ العملاء للموظفين.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              اسم العميل بالكامل *
            </label>
            <Input
              type="text"
              required
              placeholder="مثال: ريم أحمد القحطاني"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              رقم الهاتف (واتساب) *
            </label>
            <Input
              type="tel"
              required
              placeholder="مثال: +966 50 123 4567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              البريد الإلكتروني (اختياري)
            </label>
            <Input
              type="email"
              placeholder="sara@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {currentIndustry === "real_estate" ? "نوع العقار / الاهتمام" : "الخدمة التجميلية المهتم بها"}
            </label>
            {currentIndustry === "real_estate" ? (
              <select
                value={formData.serviceInterest}
                onChange={(e) => setFormData({ ...formData, serviceInterest: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              >
                <option value="شقة سكنية 3 غرف فاخرة">شقة سكنية 3 غرف فاخرة</option>
                <option value="فيلا مستقلة مودرن مع مسبح">فيلا مستقلة مودرن مع مسبح</option>
                <option value="دوبلكس دورين حديقة خاصة">دوبلكس دورين حديقة خاصة</option>
                <option value="بنتهاوس رووف بإطلالة بانورامية">بنتهاوس رووف بإطلالة بانورامية</option>
                <option value="معرض تجاري أو مكتب استثماري">معرض تجاري أو مكتب استثماري</option>
              </select>
            ) : (
              <select
                value={formData.serviceInterest}
                onChange={(e) => setFormData({ ...formData, serviceInterest: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              >
                <option value="ليزر إزالة شعر الجسم كامل">ليزر إزالة شعر الجسم كامل</option>
                <option value="جلسة هيدرافاشيل نضارة بلاتينيوم">جلسة هيدرافاشيل نضارة بلاتينيوم</option>
                <option value="حقن بوتوكس وتجاعيد الجبهة">حقن بوتوكس وتجاعيد الجبهة</option>
                <option value="فيلر شفايف روسي وتحديد">فيلر شفايف روسي وتحديد</option>
                <option value="علاج تساقط الشعر وبلازما PRP">علاج تساقط الشعر وبلازما PRP</option>
                <option value="خيوط شد الوجه غير الجراحي">خيوط شد الوجه غير الجراحي</option>
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              الموظف المسؤول (Assigned Staff)
            </label>
            {isAdmin ? (
              <select
                value={formData.assignedStaff}
                onChange={(e) => setFormData({ ...formData, assignedStaff: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} ({u.role === "admin" ? "أدمن" : "فريق المبيعات"})
                  </option>
                ))}
              </select>
            ) : (
              <Input value={currentUser.name} disabled className="bg-slate-50 font-bold" />
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={creating}>
              حفظ وإسناد العميل فوراً
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
