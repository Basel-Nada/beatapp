"use client";

import * as React from "react";
import {
  Search,
  Bell,
  Sparkles,
  Building2,
  ChevronDown,
  Plus,
  Check,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface LocationItem {
  id: string;
  name: string;
  locationId: string;
  city?: string;
}

interface HeaderProps {
  onOpenSearch?: () => void;
  tenantName?: string;
  isHighLevelConnected?: boolean;
}

export function Header({
  onOpenSearch,
  tenantName = "Internal – Beatapp",
  isHighLevelConnected = true,
}: HeaderProps) {
  const [locations, setLocations] = React.useState<LocationItem[]>([]);
  const [activeLocId, setActiveLocId] = React.useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  // Form state for connecting existing location
  const [existingForm, setExistingForm] = React.useState({ name: "", locationId: "" });
  const [loadingAction, setLoadingAction] = React.useState(false);
  const [actionFeedback, setActionFeedback] = React.useState<{ success?: boolean; message?: string } | null>(null);

  const fetchLocations = React.useCallback(async () => {
    try {
      const res = await fetch("/api/locations");
      const data = await res.json();
      setLocations(data.locations || []);
      setActiveLocId(data.activeLocationId || "");
    } catch (e) {
      console.error(e);
    }
  }, []);

  React.useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleSwitchLocation = async (locId: string) => {
    try {
      await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "switch", locationId: locId }),
      });
      setIsDropdownOpen(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const handleConnectExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    setActionFeedback(null);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "connect_existing",
          name: existingForm.name,
          locationId: existingForm.locationId,
        }),
      });
      const data = await res.json();
      setActionFeedback(data);
      if (data.success) {
        setTimeout(() => {
          setIsAddModalOpen(false);
          window.location.reload();
        }, 800);
      }
    } catch (e: unknown) {
      const err = e as Error;
      setActionFeedback({ success: false, message: err.message });
    } finally {
      setLoadingAction(false);
    }
  };

  const activeLoc = locations.find((l) => l.locationId === activeLocId) || locations[0];

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-surface-border bg-white/95 px-4 sm:px-6 backdrop-blur">
        {/* Right side: Clinic / Location Switcher Dropdown */}
        <div className="flex items-center gap-3 relative">
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <Building2 className="h-4 w-4 text-brand-700" />
              <span className="text-xs sm:text-sm font-semibold max-w-[170px] sm:max-w-[240px] truncate">
                {activeLoc ? activeLoc.name : tenantName}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-72 rounded-2xl bg-white border border-slate-200 shadow-floating z-50 p-2 space-y-1 animate-in fade-in"
                dir="rtl"
              >
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400">
                  الفروع المسجلة في HighLevel
                </div>
                {locations.map((loc) => {
                  const isCurrent = loc.locationId === activeLocId;
                  return (
                    <button
                      key={loc.id}
                      onClick={() => handleSwitchLocation(loc.locationId)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-right text-xs transition-colors ${
                        isCurrent
                          ? "bg-teal-50 text-brand-800 font-bold"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="truncate">
                        <div>{loc.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {loc.locationId}
                        </div>
                      </div>
                      {isCurrent && <Check className="h-4 w-4 text-brand-700 shrink-0 mr-2" />}
                    </button>
                  );
                })}

                <div className="pt-1.5 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsAddModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-brand-700 hover:bg-teal-50 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>ربط فرع آخر (Location ID)...</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* HighLevel Connection Status Pill */}
          <Link href="/settings" className="hidden sm:inline-flex items-center">
            {isHighLevelConnected ? (
              <Badge variant="success" className="cursor-pointer hover:opacity-90">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>متصل بـ HighLevel (مباشر)</span>
              </Badge>
            ) : (
              <Badge variant="warning" className="cursor-pointer hover:opacity-90">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span>وضع تجريبي</span>
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
            <Avatar name="باسم مصباح" size="sm" />
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-900 leading-tight">باسم مصباح</span>
              <span className="text-[10px] text-slate-500">مدير النظام</span>
            </div>
          </div>
        </div>
      </header>

      {/* Connect Location Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="ربط فرع جديد من GoHighLevel"
        description="أدخل معرف الفرع (Location ID) لتوصيله بحساب بيتاب فوراً"
        maxWidth="md"
      >
        <form onSubmit={handleConnectExisting} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              اسم الفرع أو العيادة
            </label>
            <Input
              type="text"
              placeholder="مثال: عيادة الرياض - فرع التحلية"
              value={existingForm.name}
              onChange={(e) => setExistingForm({ ...existingForm, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              معرف الفرع (Location ID) *
            </label>
            <Input
              type="text"
              placeholder="مثال: 9m3VyK57t1Ah7Pmen0gA"
              value={existingForm.locationId}
              onChange={(e) => setExistingForm({ ...existingForm, locationId: e.target.value })}
              className="font-mono text-xs text-left"
              dir="ltr"
              required
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              يمكن نسخه من شريط الرابط داخل HighLevel: <code>app.gohighlevel.com/v2/location/[LocationID]/...</code>
            </span>
          </div>

          {actionFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                actionFeedback.success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              {actionFeedback.success ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
              <span>{actionFeedback.message}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={loadingAction}>
              تأكيد وربط الفرع
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
