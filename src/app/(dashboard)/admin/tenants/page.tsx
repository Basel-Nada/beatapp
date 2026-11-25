"use client";

import * as React from "react";
import {
  Building2,
  Sparkles,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  User,
  Users,
  CreditCard,
  ExternalLink,
  Edit2,
  Trash2,
  DollarSign,
  ChevronLeft,
  ArrowRight,
  Home,
  Check,
  KeyRound,
  Mail,
  Phone,
} from "lucide-react";
import { Tenant, IndustryType, TenantPlan, TenantStatus } from "@/types";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";

export default function TenantsManagementPage() {
  const { tenants, currentTenant, switchTenant, refreshTenants, isSuperAdmin, currentUser } = useApp();
  const [search, setSearch] = React.useState("");
  const [industryFilter, setIndustryFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Create / Edit Tenant Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingTenant, setEditingTenant] = React.useState<Tenant | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    industry: "real_estate" as IndustryType,
    plan: "starter" as TenantPlan,
    adminName: "",
    adminEmail: "",
    phone: "",
    maxUsers: 5,
    address: "الرياض",
    locationId: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filtered Tenants
  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.adminName.toLowerCase().includes(search.toLowerCase()) ||
      t.adminEmail.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase());

    const matchesIndustry = industryFilter === "all" || t.industry === industryFilter;
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;

    return matchesSearch && matchesIndustry && matchesStatus;
  });

  // Calculate Metrics
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t) => t.status === "active").length;
  const realEstateTenants = tenants.filter((t) => t.industry === "real_estate").length;
  const clinicTenants = tenants.filter((t) => t.industry === "clinic").length;

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (editingTenant) {
        const res = await fetch("/api/tenants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            id: editingTenant.id,
            data: form,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setFeedback({ type: "success", text: "تم تحديث بيانات الشركة بنجاح" });
        }
      } else {
        const res = await fetch("/api/tenants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            ...form,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setFeedback({
            type: "success",
            text: `تم إنشاء حساب الشركة وحساب الأدمن (${form.adminName}) بنجاح!`,
          });
        }
      }

      await refreshTenants();
      setTimeout(() => {
        setIsModalOpen(false);
        setEditingTenant(null);
        setFeedback(null);
      }, 1000);
    } catch (e: unknown) {
      const err = e as Error;
      setFeedback({ type: "error", text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTenant = async (tenant: Tenant) => {
    if (!confirm(`هل أنت متأكد من حذف حساب (${tenant.name}) وجميع بياناتها؟`)) return;
    try {
      await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          id: tenant.id,
        }),
      });
      await refreshTenants();
    } catch (e) {
      console.error(e);
    }
  };

  const openCreateModal = () => {
    setEditingTenant(null);
    setForm({
      name: "",
      industry: "real_estate",
      plan: "starter",
      adminName: "",
      adminEmail: "",
      phone: "+966 50 ",
      maxUsers: 5,
      address: "الرياض",
      locationId: "",
    });
    setFeedback(null);
    setIsModalOpen(true);
  };

  const openEditModal = (t: Tenant) => {
    setEditingTenant(t);
    setForm({
      name: t.name,
      industry: t.industry,
      plan: t.plan,
      adminName: t.adminName,
      adminEmail: t.adminEmail,
      phone: t.phone || "",
      maxUsers: t.maxUsers,
      address: t.address || "الرياض",
      locationId: t.locationId && !t.locationId.startsWith("loc_") ? t.locationId : (t.locationId || ""),
    });
    setFeedback(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              إدارة الشركات والاشتراكات (Multi-Tenant SaaS)
            </h1>
            <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />
              <span>لوحة مالك المنصة (Super Admin)</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            بيع وإصدار تراخيص المنصة للشركات والعيادات، عزل بيانات كل عميل بالكامل، وتعيين حساب الأدمن الخاص بكل شركة.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          variant="primary"
          className="gap-2 text-xs h-10 bg-slate-900 hover:bg-black text-white font-bold shadow-md"
        >
          <Plus className="h-4 w-4" />
          <span>إنشاء حساب شركة جديد (بيع ترخيص)</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">إجمالي الشركات المشتركة</span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-slate-900">{totalTenants}</span>
            <Building2 className="h-5 w-5 text-slate-400" />
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
            {activeTenants} شركة نشطة حالياً
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 block">الشركات العقارية (Real Estate)</span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-emerald-800">{realEstateTenants}</span>
            <Home className="h-5 w-5 text-emerald-600" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">نظام عقاري ومخزون وحدات</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-brand-700 block">عيادات ومراكز التجميل (Clinics)</span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-brand-800">{clinicTenants}</span>
            <Sparkles className="h-5 w-5 text-brand-600" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">نظام عيادات ومواعيد طبية</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">الشركة الحالية النشطة</span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-sm font-bold text-slate-900 truncate max-w-[170px]">
              {currentTenant.name}
            </span>
            <Badge variant={currentTenant.industry === "real_estate" ? "success" : "brand"}>
              {currentTenant.industry === "real_estate" ? "عقارات" : "عيادات"}
            </Badge>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            أدمن: {currentTenant.adminName}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3 justify-between">
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم الشركة، الأدمن، البريد..."
            className="pr-9 text-xs h-10"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setIndustryFilter("all")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                industryFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
              }`}
            >
              كافة الأنشطة ({tenants.length})
            </button>
            <button
              onClick={() => setIndustryFilter("real_estate")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all ${
                industryFilter === "real_estate"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600"
              }`}
            >
              <Home className="h-3 w-3" />
              <span>عقارات ({realEstateTenants})</span>
            </button>
            <button
              onClick={() => setIndustryFilter("clinic")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all ${
                industryFilter === "clinic" ? "bg-brand-600 text-white shadow-xs" : "text-slate-600"
              }`}
            >
              <Sparkles className="h-3 w-3" />
              <span>عيادات ({clinicTenants})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Companies List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <th className="py-3.5 px-4">الشركة والنشاط</th>
                <th className="py-3.5 px-3">النشاط المخصص</th>
                <th className="py-3.5 px-3">باقة الاشتراك</th>
                <th className="py-3.5 px-3">أدمن الشركة</th>
                <th className="py-3.5 px-3">عدد الموظفين</th>
                <th className="py-3.5 px-3">الحالة والترخيص</th>
                <th className="py-3.5 px-4 text-left">إجراءات والدخول</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.map((t) => {
                const isCurrentActive = t.id === currentTenant.id;
                const isRealEstate = t.industry === "real_estate";

                return (
                  <tr
                    key={t.id}
                    className={`transition-colors ${
                      isCurrentActive ? "bg-amber-50/40" : "hover:bg-slate-50/80"
                    }`}
                  >
                    {/* Company Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                            isRealEstate
                              ? "bg-gradient-to-br from-emerald-500 to-teal-700"
                              : "bg-gradient-to-br from-brand-500 to-brand-700"
                          }`}
                        >
                          {isRealEstate ? <Home className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <span>{t.name}</span>
                            {isCurrentActive && (
                              <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                                مفتوح حالياً
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-mono">{t.slug}</span>
                            {t.locationId && !t.locationId.startsWith("loc_") ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-mono font-semibold" title={`GoHighLevel Location ID: ${t.locationId}`}>
                                🟢 GHL: {t.locationId.slice(0, 8)}...
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[9px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.2 rounded font-mono" title="سحابي داخلي (بدون ربط خارجي)">
                                🏢 سحابي داخلي
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Dedicated Industry */}
                    <td className="py-3.5 px-3">
                      {isRealEstate ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Home className="h-3 w-3" />
                          <span>شركات عقارية</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                          <Sparkles className="h-3 w-3" />
                          <span>عيادات تجميل</span>
                        </span>
                      )}
                    </td>

                    {/* Subscription Plan */}
                    <td className="py-3.5 px-3">
                      <span className="capitalize font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                        {t.plan}
                      </span>
                    </td>

                    {/* Tenant Admin */}
                    <td className="py-3.5 px-3">
                      <div>
                        <span className="font-semibold text-slate-800 block">{t.adminName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{t.adminEmail}</span>
                      </div>
                    </td>

                    {/* Users Count / Limit */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1 text-slate-700 font-bold">
                        <span>{t.usersCount || 1}</span>
                        <span className="text-slate-400 font-normal">/ {t.maxUsers} موظف</span>
                      </div>
                    </td>

                    {/* Status & Expiry */}
                    <td className="py-3.5 px-3">
                      <div className="space-y-0.5">
                        <Badge variant="success" className="text-[10px]">
                          نشط ساري
                        </Badge>
                        <span className="text-[10px] text-slate-400 block">
                          ينتهي: {new Date(t.expiresAt || "").toLocaleDateString("ar-SA")}
                        </span>
                      </div>
                    </td>

                    {/* Action & Switch to Workspace */}
                    <td className="py-3.5 px-4 text-left">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => switchTenant(t.id)}
                          variant={isCurrentActive ? "outline" : "primary"}
                          className={`text-xs h-8 px-3 gap-1 font-bold ${
                            isCurrentActive
                              ? "border-amber-400 text-amber-900 bg-amber-50"
                              : "bg-slate-900 text-white hover:bg-black"
                          }`}
                        >
                          <KeyRound className="h-3 w-3" />
                          <span>{isCurrentActive ? "أنت بداخلها" : "الدخول كشركة"}</span>
                        </Button>

                        <button
                          onClick={() => openEditModal(t)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                          title="تعديل تفاصيل الترخيص"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteTenant(t)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="حذف الشركة"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Tenant Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTenant ? `تعديل ترخيص (${editingTenant.name})` : "إنشاء وإصدار حساب شركة جديد (بيع ترخيص)"}
        description="حدد نشاط الشركة وبيانات الأدمن الرئيسي ليتم تجهيز بيئة العمل المعزولة فوراً."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTenant} className="space-y-4 pt-2" dir="rtl">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم الشركة أو العيادة *
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="مثال: شركة إعمار نجد العقارية"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                نوع النشاط المخصص (عزل كامل) *
              </label>
              <select
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value as IndustryType })}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-bold"
              >
                <option value="real_estate">شركات واستثمار عقاري 🏢 (مخزون وحدات وقفل)</option>
                <option value="clinic">عيادات ومراكز تجميل ✨ (مواعيد طبية وجلسات)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم أدمن الشركة الرئيسي *
              </label>
              <Input
                value={form.adminName}
                onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                placeholder="مثال: م. فيصل الدوسري"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                البريد الإلكتروني للأدمن (تسجيل الدخول) *
              </label>
              <Input
                type="email"
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                placeholder="admin@company.sa"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                باقة الترخيص
              </label>
              <select
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value as TenantPlan })}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-semibold"
              >
                <option value="starter">Starter (5 موظفين)</option>
                <option value="growth">Growth (10 موظفين)</option>
                <option value="enterprise">Enterprise (غير محدود)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الحد الأقصى للموظفين
              </label>
              <Input
                type="number"
                value={form.maxUsers}
                onChange={(e) => setForm({ ...form, maxUsers: Number(e.target.value) })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم هاتف التواصل
              </label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+966 50 ..."
              />
            </div>
          </div>

          {/* GoHighLevel Location ID Input */}
          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80 space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-emerald-700" />
                <span>معرّف الفرع في GoHighLevel (Location ID)</span>
              </span>
              <span className="text-[10px] font-normal text-slate-500">
                (اختياري - للربط المباشر مع GHL)
              </span>
            </label>
            <Input
              value={form.locationId}
              onChange={(e) => setForm({ ...form, locationId: e.target.value })}
              placeholder="مثال: 9m3VyK57t1Ah7Pmen0gA (أو اتركه فارغاً لنظام BeatApp الداخلي)"
              className="font-mono text-xs bg-white"
            />
            <p className="text-[10px] text-slate-500 leading-relaxed">
              💡 <strong>كيف تحصل عليه؟</strong> انسخ الـ Location ID من رابط المتصفح في GoHighLevel للـ Sub-Account الخاص بهذه الشركة (أو من Settings → Business Profile). يتم عبره جلب جهات الاتصال ومحادثات الواتساب والرسائل الخاصة بهذه الشركة مباشرة وعزلها 100%.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>مزايا عزل بيئة العمل (Data Isolation):</span>
            </div>
            <p>
              بمجرد الحفظ، سيتولى أدمن الشركة إدارة فريقه وإضافة موظفيه بنفسه، ولن تظهر أي بيانات بين الشركات إطلاقاً.
            </p>
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
              {editingTenant ? "حفظ التعديلات" : "إصدار الترخيص وتفعيل الحساب"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
