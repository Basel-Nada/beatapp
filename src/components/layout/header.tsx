"use client";

import * as React from "react";
import { Search, Bell, Sparkles, Building2, ExternalLink } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface HeaderProps {
  onOpenSearch?: () => void;
  tenantName?: string;
  isHighLevelConnected?: boolean;
}

export function Header({
  onOpenSearch,
  tenantName = "عيادات لومينا ديرما للتجميل",
  isHighLevelConnected = false,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-surface-border bg-white/95 px-4 sm:px-6 backdrop-blur">
      {/* Right side: Clinic Brand selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-800">
          <Building2 className="h-4 w-4 text-brand-700" />
          <span className="text-xs sm:text-sm font-semibold">{tenantName}</span>
        </div>

        {/* HighLevel Connection Status Pill */}
        <Link href="/settings" className="hidden sm:inline-flex items-center">
          {isHighLevelConnected ? (
            <Badge variant="success" className="cursor-pointer hover:opacity-90">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>متصل بـ HighLevel</span>
            </Badge>
          ) : (
            <Badge variant="warning" className="cursor-pointer hover:opacity-90">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span>وضع تجريبي (Sandbox)</span>
            </Badge>
          )}
        </Link>
      </div>

      {/* Center: Global Search trigger */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={onOpenSearch}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-xs text-slate-400 hover:border-slate-300 hover:bg-white transition-all shadow-soft"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <span>ابحث عن عميل، محادثة، أو موعد...</span>
          </div>
          <kbd className="rounded bg-white px-1.5 py-0.5 text-[10px] text-slate-500 border border-slate-200 shadow-xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Left side: Quick actions & User Profile */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSearch}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
          title="بحث"
        >
          <Search className="h-5 w-5" />
        </button>

        <button
          className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          title="الإشعارات"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        <div className="h-5 w-[1px] bg-slate-200 mx-1" />

        <div className="flex items-center gap-2.5">
          <Avatar name="أحمد بن عبد العزيز" size="sm" />
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-900 leading-tight">أحمد بن عبد العزيز</span>
            <span className="text-[10px] text-slate-500">مدير العيادة</span>
          </div>
        </div>
      </div>
    </header>
  );
}
