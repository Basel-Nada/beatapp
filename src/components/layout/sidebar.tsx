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
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/conversations", label: "المحادثات", icon: MessageSquare, badge: "2" },
  { href: "/contacts", label: "العملاء", icon: Users },
  { href: "/opportunities", label: "المبيعات", icon: KanbanSquare },
  { href: "/appointments", label: "المواعيد", icon: Calendar, badge: "اليوم" },
];

const BOTTOM_ITEMS = [
  { href: "/settings", label: "الإعدادات والربط", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-sidebar-bg text-slate-200 border-l border-sidebar-border h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 h-18 border-b border-sidebar-border/60">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white tracking-wide">BeatApp</span>
            <span className="text-[10px] text-brand-300 font-medium tracking-tight">نظام إدارة العيادات والمراكز</span>
          </div>
        </Link>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 tracking-wider">
          القائمة الرئيسية
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
                isActive
                  ? "bg-sidebar-active text-white shadow-sm ring-1 ring-brand-500/30"
                  : "text-slate-300 hover:bg-sidebar-hover hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-brand-300" : "text-slate-400 group-hover:text-slate-200"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    isActive
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
        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all",
                isActive
                  ? "bg-sidebar-active text-white"
                  : "text-slate-400 hover:bg-sidebar-hover hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-2 px-3 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>GoHighLevel v2</span>
          </div>
          <span className="text-[10px] opacity-70">إصدار 1.0</span>
        </div>
      </div>
    </aside>
  );
}
