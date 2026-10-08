"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare, Users, KanbanSquare, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/conversations", label: "المحادثات", icon: MessageSquare, badge: "2" },
  { href: "/contacts", label: "العملاء", icon: Users },
  { href: "/opportunities", label: "المبيعات", icon: KanbanSquare },
  { href: "/appointments", label: "المواعيد", icon: Calendar },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-slate-200 z-30 px-2 py-1.5 flex items-center justify-around shadow-lg">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors relative min-w-[56px]",
              isActive ? "text-brand-700 font-semibold" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />
              {item.badge && (
                <span className="absolute -top-1 -right-2 h-4 w-4 rounded-full bg-brand-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
