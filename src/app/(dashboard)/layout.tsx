"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { IntegrationBanner } from "@/components/layout/integration-banner";
import { QuickSearchModal } from "@/components/shared/quick-search-modal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [session, setSession] = React.useState<{
    tenant?: { name: string; isHighLevelConnected: boolean; locationId: string };
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
        <Header
          onOpenSearch={() => setIsSearchOpen(true)}
          tenantName={session.tenant?.name}
          isHighLevelConnected={session.tenant?.isHighLevelConnected}
        />

        <IntegrationBanner
          isDemoMode={Boolean(session.isDemoMode)}
          locationId={session.tenant?.locationId}
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
