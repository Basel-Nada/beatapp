"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  KanbanSquare,
  Calendar,
  Settings,
  Sparkles,
  CreditCard,
  Megaphone,
  Workflow,
  Star,
  Building2,
  FileText,
  BarChart3,
  Home,
  CheckCircle,
  Users2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/app-context";

export function Sidebar() {
  const pathname = usePathname();
  const { currentIndustry, currentTenant, isSuperAdmin, isAdmin, currentUser } = useApp();

  const isRealEstate = currentIndustry === "real_estate";
  const isSales = currentUser.role === "sales";
  const isReceptionist = currentUser.role === "receptionist";
  const isStaff = isSales || isReceptionist;

  const navItems = [
    { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
    { href: "/conversations", label: isStaff ? "محادثاتي" : "المحادثات", icon: MessageSquare, badge: "2" },
    { href: "/contacts", label: isStaff ? "عملائي والليدات" : "العملاء والليدات", icon: Users },
    {
      href: "/opportunities",
      label: isRealEstate ? "مسار الصفقات (Pipelines)" : "مسار المبيعات",
      icon: KanbanSquare,
    },
    // Conditionally show Properties in Real Estate Mode
    ...(isRealEstate
      ? [
          {
            href: "/properties",
            label: "مخزون الوحدات والعقارات",
            icon: Building2,
            badge: "قفل الحجز",
            highlight: true,
          },
        ]
      : []),
    {
      href: "/appointments",
      label: isRealEstate ? "المعاينات الميدانية" : "حجوزات المواعيد",
      icon: Calendar,
      badge: "اليوم",
    },
    { href: "/templates", label: "قوالب الواتساب", icon: FileText },
    // Team management is strictly for Admins
    ...(!isStaff ? [{ href: "/team", label: "فريق العمل والموظفين", icon: Users2 }] : []),
    {
      href: "/reports",
      label: isStaff ? "تقرير أدائي وإنجازاتي" : "تقارير الموظفين",
      icon: BarChart3,
      badge: isStaff ? "أدائي" : "KPI",
    },
    // Management only modules
    ...(!isStaff
      ? [
          { href: "/invoices", label: isRealEstate ? "دفعات وعقود الحجز" : "الفواتير والمدفوعات", icon: CreditCard },
          { href: "/campaigns", label: isRealEstate ? "حملات المشاريع" : "حملات العروض", icon: Megaphone },
          { href: "/automations", label: "الأتمتة وسير العمل", icon: Workflow },
          { href: "/reviews", label: "التقييمات والسمعة", icon: Star },
        ]
      : []),
  ];

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-sidebar-bg text-slate-200 border-l border-sidebar-border h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 h-18 border-b border-sidebar-border/60">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md transition-transform group-hover:scale-105",
              isRealEstate
                ? "bg-gradient-to-br from-emerald-500 to-teal-700 shadow-emerald-500/20"
                : "bg-gradient-to-br from-brand-400 to-brand-600 shadow-brand-500/20"
            )}
          >
            {isRealEstate ? <Home className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white tracking-wide">BeatApp</span>
            <span
              className={cn(
                "text-[10px] font-semibold tracking-tight",
                isStaff
                  ? "text-sky-300"
                  : isRealEstate
                  ? "text-emerald-300"
                  : "text-brand-300"
              )}
            >
              {isStaff
                ? `بوابة الموظف: ${currentUser.title || "مبيعات"}`
                : isRealEstate
                ? "نظام إدارة الشركات العقارية"
                : "نظام إدارة العيادات والمراكز"}
            </span>
          </div>
        </Link>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 tracking-wider flex items-center justify-between">
          <span>القائمة الرئيسية</span>
          <span
            className={cn(
              "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase",
              isRealEstate ? "bg-emerald-950 text-emerald-300" : "bg-teal-950 text-teal-300"
            )}
          >
            {isRealEstate ? "عقارات" : "عيادات"}
          </span>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all group",
                isActive
                  ? "bg-sidebar-active text-white shadow-sm ring-1 ring-brand-500/30"
                  : "text-slate-300 hover:bg-sidebar-hover hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-4.5 w-4.5 transition-colors",
                    isActive ? "text-brand-300" : "text-slate-400 group-hover:text-slate-200"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    item.highlight
                      ? "bg-amber-400 text-slate-950 animate-pulse"
                      : isActive
                      ? "bg-brand-400 text-slate-900"
                      : "bg-slate-800 text-slate-300 group-hover:bg-slate-700"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Navigation */}
      <div className="p-3 border-t border-sidebar-border/60 space-y-1">
        {isSuperAdmin && (
          <Link
            href="/admin/tenants"
            className={cn(
              "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all",
              pathname.startsWith("/admin/tenants")
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-amber-300/90 hover:bg-slate-800 hover:text-amber-200"
            )}
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              <span>إدارة الشركات والتراخيص</span>
            </div>
            <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.5 rounded font-mono font-bold">
              SaaS
            </span>
          </Link>
        )}

        {isAdmin && (
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all",
              pathname.startsWith("/settings")
                ? "bg-sidebar-active text-white"
                : "text-slate-400 hover:bg-sidebar-hover hover:text-white"
            )}
          >
            <Settings className="h-4 w-4" />
            <span>إعدادات المنصة</span>
          </Link>
        )}

        {isStaff && (
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
              <span>المستخدم النشط:</span>
              <span className="text-sky-400 bg-sky-950/80 px-1.5 py-0.2 rounded border border-sky-800 font-semibold">
                {currentUser.role === "sales" ? "مبيعات" : "استقبال"}
              </span>
            </div>
            <div className="font-bold text-white truncate">{currentUser.name}</div>
            <div className="text-[10px] text-slate-400 truncate">{currentUser.email}</div>
          </div>
        )}

        <div className="pt-2 px-3 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>نظام BeatApp السحابي</span>
          </div>
          <span className="text-[10px] opacity-70 font-mono">v2.0 Native</span>
        </div>
      </div>
    </aside>
  );
}
