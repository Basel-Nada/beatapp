"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { QuickSearchModal } from "@/components/shared/quick-search-modal";
import { AppProvider, useApp } from "@/context/app-context";
import { UserCheck, ArrowRight, ShieldAlert } from "lucide-react";

function ImpersonationBanner() {
  const { isImpersonating, currentUser, currentTenant, returnToAdmin } = useApp();

  if (!isImpersonating) return null;

  const isStaff = currentUser.role === "sales" || currentUser.role === "receptionist";

  return (
    <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-950 px-4 py-2.5 text-xs font-semibold flex flex-wrap items-center justify-between border-b border-amber-500 shadow-sm gap-2" dir="rtl">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 shrink-0 text-slate-900" />
        <span>
          أنت الآن تتصفح بصلاحيات: <strong className="bg-slate-950 text-amber-300 px-2 py-0.5 rounded font-bold">{currentUser.name}</strong>{" "}
          <span className="opacity-90">({currentUser.role === "admin" ? "أدمن إدارة" : "مستشار مبيعات"})</span>
          {isStaff && (
            <span className="mr-2 text-slate-800 bg-amber-200/80 px-2 py-0.5 rounded border border-amber-400/60 font-normal">
              🔒 واجهة الموظف مفعلة: تم قفل وحجب صفحات الإعدادات وإدارة التراخيص تلقائياً
            </span>
          )}
        </span>
      </div>
      <button
        onClick={() => {
          returnToAdmin();
          window.location.reload();
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 text-amber-300 hover:bg-black rounded-lg text-xs font-bold transition-all shadow-md shrink-0"
      >
        <span>العودة كـ Super Admin (المدير العام)</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function DashboardInnerLayout({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [session, setSession] = React.useState<{
    tenant?: { name: string; locationId: string };
    isDemoMode?: boolean;
  }>({});

  React.useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => setSession(data))
      .catch((e) => console.error("Session load error", e));

    // Shortcut ⌘K / Ctrl+K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 pb-16 lg:pb-0">
        <ImpersonationBanner />

        <Header
          onOpenSearch={() => setIsSearchOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Quick Search Modal */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      <DashboardInnerLayout>{children}</DashboardInnerLayout>
    </AppProvider>
  );
}

