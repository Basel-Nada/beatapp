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

export default function ContactsPage() {
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<ContactFilter>("all");
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  // New Contact Form State
  const [formData, setFormData] = React.useState({
    name: "",
    phone: "",
    email: "",
    serviceInterest: "ليزر إزالة شعر الجسم كامل",
    assignedStaff: "د. نورة الشمري",
  });
  const [creating, setCreating] = React.useState(false);

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
            إدارة ومتابعة سجلات عملاء العيادة المتزامنة مع GoHighLevel
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
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="text-slate-700 font-medium mb-1">لا يوجد عملاء يطابقون البحث</div>
                    <div className="text-slate-400 text-[11px]">يمكنك إضافة عميل جديد بنقرة زر أعلاه</div>
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
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
                      {contact.assignedStaff || "فريق العيادة"}
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-left">
                      <Link href={`/contacts/${contact.id}`}>
                        <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs text-slate-700">
                          <span>عرض الملف</span>
                          <ChevronLeft className="h-3 w-3 mr-1" />
                        </Button>
                      </Link>
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
        description="سيتم مزامنة بيانات العميل تلقائياً مع نظام GoHighLevel"
      >
        <form onSubmit={handleCreateContact} className="space-y-4">
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
              الخدمة التجميلية المهتم بها
            </label>
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              الموظف المعني
            </label>
            <select
              value={formData.assignedStaff}
              onChange={(e) => setFormData({ ...formData, assignedStaff: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
            >
              <option value="د. نورة الشمري">د. نورة الشمري (جلدية وتجميل)</option>
              <option value="د. هدى السلمان">د. هدى السلمان (استشارية جراحة وتجميل)</option>
              <option value="أخصائية رغد">أخصائية رغد (عناية بالبشرة وليزر)</option>
              <option value="أحمد بن عبد العزيز">أحمد بن عبد العزيز (استقبال ومبيعات)</option>
            </select>
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
              حفظ وتأكيد العميل
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
