"use client";

import * as React from "react";
import {
  Settings,
  Building2,
  ShieldCheck,
  Zap,
  Activity,
  Database,
  Radio,
  CheckCircle2,
  User,
  Phone,
  Mail,
  Home,
  Sparkles,
  Lock,
  Layers,
  KeyRound,
  Users2,
  Check,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/context/app-context";
import Link from "next/link";

export default function SettingsPage() {
  const { currentTenant, currentUser, isSuperAdmin, isAdmin } = useApp();
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  const [companyForm, setCompanyForm] = React.useState({
    name: currentTenant.name,
    phone: currentTenant.phone || "+966 11 000 0000",
    address: currentTenant.address || "طريق الملك فهد، الرياض",
  });

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const isRealEstate = currentTenant.industry === "real_estate";

  return (
    <div className="space-y-6 max-w-4xl" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">إعدادات المنصة والشركة</h1>
          <p className="mt-1 text-xs text-slate-500">
            تخصيص هوية الشركة المشتركة، مراجعة محركات BeatApp النشطة، وإدارة الترخيص.
          </p>
        </div>

        <Badge variant="success" className="gap-1.5 py-1.5 px-3 text-xs font-bold w-fit">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>سيرفر BeatApp السحابي (نشط 100%)</span>
        </Badge>
      </div>

      {/* Card 1: Active Company Workspace */}
      <Card className="border-slate-200/90 shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <div
              className={`h-11 w-11 rounded-2xl flex items-center justify-center text-white shadow-xs ${
                isRealEstate
                  ? "bg-gradient-to-br from-emerald-500 to-teal-700"
                  : "bg-gradient-to-br from-brand-500 to-brand-700"
              }`}
            >
              {isRealEstate ? <Home className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                {currentTenant.name}
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRealEstate ? "نظام إدارة الشركات والاستثمار العقاري" : "نظام إدارة المراكز والعيادات التجميلية"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold uppercase">
              باقة {currentTenant.plan}
            </span>
            <Badge variant="success">نشط وساري</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          <form onSubmit={handleSaveCompany} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم الشركة / المنشأة
                </label>
                <Input
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  disabled={!isAdmin}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نوع النشاط المخصص
                </label>
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 flex items-center gap-2">
                  {isRealEstate ? <Home className="h-4 w-4 text-emerald-600" /> : <Sparkles className="h-4 w-4 text-brand-600" />}
                  <span>{isRealEstate ? "شركات عقارية (مخزون وحدات وقفل)" : "عيادات تجميل (جلسات ومواعيد طبية)"}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم الهاتف الرسمي
                </label>
                <Input
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  disabled={!isAdmin}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  العنوان والمقر الرئيسي
                </label>
                <Input
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  disabled={!isAdmin}
                />
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center justify-between pt-2">
                {saveSuccess ? (
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    <span>تم حفظ التعديلات بنجاح</span>
                  </span>
                ) : (
                  <span />
                )}
                <Button type="submit" variant="primary" className="text-xs h-9 bg-slate-900 hover:bg-black text-white font-bold">
                  حفظ تعديلات الشركة
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Card 2: Native BeatApp Engine Services */}
      <Card className="border-slate-200 shadow-soft">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">محركات BeatApp المدمجة (Native Services)</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                تعمل جميع العمليات محلياً ومباشرة داخل خوادم بيتاب مع عزل كامل للبيانات
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-amber-600" />
                  <span>محرك القفل الحصري للعقارات</span>
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                  نشط 100%
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                يمنع نهائياً حجز أي وحدة من قِبل موظف آخر في نفس اللحظة.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-brand-600" />
                  <span>محرك الإسناد التلقائي للموظفين</span>
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                  نشط 100%
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                تسجيل العميل ينسبه فوراً للموظف مع حفظ تاريخ من تواصل ومن أضاف.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-teal-600" />
                  <span>محرك سجل التدقيق والإنتاجية (KPI)</span>
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                  نشط 100%
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                متابعة مكالمات ورسائل وصفقات كل موظف وإعداد التقارير للإدارة.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-purple-600" />
                  <span>عزل الشركات والمستأجرين (Multi-Tenancy)</span>
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                  نشط 100%
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                بيانات كل شركة منفصلة تماماً ومحمية من الوصول غير المصرح به.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Quick Navigation for Admins */}
      <Card className="border-slate-200 bg-slate-50/70 shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-900 block">إدارة التراخيص وفريق العمل</span>
            <span className="text-[11px] text-slate-500">
              يمكنك إضافة موظفين جدد لشركتك أو بيع اشتراكات جديدة من خلال البوابات السريعة.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/team">
              <Button variant="outline" size="sm" className="bg-white gap-1 text-xs">
                <Users2 className="h-3.5 w-3.5" />
                <span>إدارة فريق العمل</span>
              </Button>
            </Link>

            {isSuperAdmin && (
              <Link href="/admin/tenants">
                <Button variant="primary" size="sm" className="bg-slate-900 text-white hover:bg-black gap-1 text-xs">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                  <span>بوابة بيع التراخيص (SaaS)</span>
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
