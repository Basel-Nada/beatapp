"use client";

import * as React from "react";
import {
  Users,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  UserCheck,
  Phone,
  Mail,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
  Home,
  Check,
} from "lucide-react";
import { User, UserRole } from "@/types";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function TeamManagementPage() {
  const { currentTenant, tenantUsers, users, isAdmin, isSuperAdmin } = useApp();
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    role: "sales" as UserRole,
    title: "",
    department: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // We show users of the current company
  const companyUsers = tenantUsers.filter((u) => u.role !== "super_admin");

  const filteredUsers = companyUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.title && u.title.toLowerCase().includes(search.toLowerCase())) ||
      (u.department && u.department.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = roleFilter === "all" || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (editingUser) {
        await fetch("/api/tenants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_user",
            id: editingUser.id,
            data: form,
          }),
        });
      } else {
        await fetch("/api/tenants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create_user",
            tenantId: currentTenant.id,
            ...form,
          }),
        });
      }

      setFeedback({ type: "success", text: "تم حفظ بيانات الموظف بنجاح" });
      setTimeout(() => {
        setIsModalOpen(false);
        setEditingUser(null);
        window.location.reload();
      }, 800);
    } catch (e: unknown) {
      const err = e as Error;
      setFeedback({ type: "error", text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (!confirm(`هل أنت متأكد من حذف الموظف (${u.name}) من الشركة؟`)) return;
    try {
      await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_user",
          id: u.id,
        }),
      });
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setForm({
      name: "",
      email: "",
      phone: "+966 50 ",
      role: "sales",
      title: currentTenant.industry === "real_estate" ? "مستشار مبيعات عقاري" : "أخصائية عناية وبشرة",
      department: currentTenant.industry === "real_estate" ? "المبيعات العقارية" : "القسم الطبي",
    });
    setFeedback(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setForm({
      name: u.name,
      email: u.email,
      phone: u.phone || "",
      role: u.role,
      title: u.title || "",
      department: u.department || "",
    });
    setFeedback(null);
    setIsModalOpen(true);
  };

  const isRealEstate = currentTenant.industry === "real_estate";

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              إدارة فريق العمل والموظفين
            </h1>
            <span className="bg-slate-100 text-slate-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-slate-200">
              {isRealEstate ? <Home className="h-3 w-3 text-emerald-600" /> : <Sparkles className="h-3 w-3 text-brand-600" />}
              <span>{currentTenant.name}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            إضافة وإدارة موظفي شركتك، تحديد الأدوار والصلاحيات، وتتبع أدائهم المباشر.
          </p>
        </div>

        {isAdmin && (
          <Button
            onClick={openCreateModal}
            variant="primary"
            className="gap-2 text-xs h-10 bg-slate-900 hover:bg-black text-white font-bold"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة موظف جديد للفريق</span>
          </Button>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">إجمالي موظفي الشركة</span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-slate-900">{companyUsers.length}</span>
            <Users className="h-5 w-5 text-slate-400" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            السعة المتاحة: {currentTenant.maxUsers} موظف
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 block">فريق المبيعات والاستشارات</span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-emerald-700">
              {companyUsers.filter((u) => u.role === "sales").length}
            </span>
            <UserCheck className="h-5 w-5 text-emerald-500" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">مسؤولو متابعة العملاء والصفقات</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-brand-600 block">فريق الاستقبال والتنسيق</span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-brand-700">
              {companyUsers.filter((u) => u.role === "receptionist").length}
            </span>
            <Phone className="h-5 w-5 text-brand-500" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">استقبال الليدات وحجز المواعيد</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">باقة اشتراك الشركة</span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-lg font-black text-slate-900 capitalize">
              {currentTenant.plan} Plan
            </span>
            <Badge variant="success">نشط</Badge>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            صالح حتى: {new Date(currentTenant.expiresAt || "").toLocaleDateString("ar-SA")}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم الموظف، المسمى، البريد..."
            className="pr-9 text-xs h-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs font-semibold rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800"
          >
            <option value="all">كافة الأدوار والصلاحيات</option>
            <option value="admin">مدير الشركة (Admin)</option>
            <option value="sales">المبيعات والاستشارات (Sales)</option>
            <option value="receptionist">الاستقبال وخدمة العملاء (Reception)</option>
          </select>
        </div>
      </div>

      {/* Team Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <th className="py-3.5 px-4">الموظف</th>
                <th className="py-3.5 px-3">المسمى الوظيفي</th>
                <th className="py-3.5 px-3">القسم</th>
                <th className="py-3.5 px-3">الصلاحية (الدور)</th>
                <th className="py-3.5 px-3">العملاء المسندين</th>
                <th className="py-3.5 px-3">الصفقات المحققة</th>
                <th className="py-3.5 px-4 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const isCompanyAdmin = u.role === "admin";
                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size="sm" />
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isCompanyAdmin && (
                              <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                                أدمن الشركة
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-semibold text-slate-800">
                      {u.title || "عضو فريق"}
                    </td>

                    <td className="py-3.5 px-3 text-slate-600">
                      {u.department || "المبيعات"}
                    </td>

                    <td className="py-3.5 px-3">
                      {u.role === "admin" && (
                        <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                          مدير كامل
                        </span>
                      )}
                      {u.role === "sales" && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                          مبيعات
                        </span>
                      )}
                      {u.role === "receptionist" && (
                        <span className="text-[10px] bg-teal-100 text-teal-900 px-2 py-0.5 rounded-full font-bold">
                          استقبال
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 font-bold text-slate-800">
                      {u.assignedLeadsCount || 0} عميل
                    </td>

                    <td className="py-3.5 px-3 font-bold text-teal-800">
                      {u.closedDealsCount || 0} صفقات
                    </td>

                    <td className="py-3.5 px-4 text-left">
                      {isAdmin && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                            title="تعديل الموظف"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          {!isCompanyAdmin && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="حذف الموظف"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `تعديل بيانات (${editingUser.name})` : "إضافة موظف جديد لفريق العمل"}
        description={`إضافة موظف إلى شركة (${currentTenant.name}) لتخصيص ليدات ومتابعة إنتاجيته.`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveUser} className="space-y-4 pt-2" dir="rtl">
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {feedback.type === "success" ? <Check className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <span>{feedback.text}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              اسم الموظف بالكامل *
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="مثال: تركي بن عبدالرحمن"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                البريد الإلكتروني *
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="turki@company.sa"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم الهاتف (واتساب)
              </label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+966 50 ..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الدور والصلاحية *
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-bold"
              >
                <option value="sales">مستشار مبيعات (Sales)</option>
                <option value="receptionist">استقبال وخدمة عملاء (Reception)</option>
                <option value="admin">مدير فرع / أدمن مشترك (Admin)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                القسم الداخلي
              </label>
              <Input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="مثال: المبيعات العقارية"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              المسمى الوظيفي
            </label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={isRealEstate ? "مستشار استثمار عقاري أول" : "أخصائية عناية بالبشرة"}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="text-xs h-10"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="text-xs h-10 bg-slate-900 hover:bg-black text-white font-bold"
            >
              {editingUser ? "حفظ التعديلات" : "إضافة الموظف فوراً"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
