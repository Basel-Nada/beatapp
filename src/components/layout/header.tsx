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
  Zap,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
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
  tenantName = "عيادات لومينا ديرما للتجميل",
  isHighLevelConnected = false,
}: HeaderProps) {
  const [locations, setLocations] = React.useState<LocationItem[]>([]);
  const [activeLocId, setActiveLocId] = React.useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"existing" | "new">("existing");

  // Form states
  const [existingForm, setExistingForm] = React.useState({ name: "", locationId: "" });
  const [newForm, setNewForm] = React.useState({ name: "", phone: "", city: "الرياض", address: "" });
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

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    setActionFeedback(null);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_new",
          name: newForm.name,
          phone: newForm.phone,
          city: newForm.city,
          address: newForm.address,
        }),
      });
      const data = await res.json();
      setActionFeedback(data);
      if (data.success) {
        setTimeout(() => {
          setIsAddModalOpen(false);
          window.location.reload();
        }, 1200);
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
                  الفروع والعيادات المسجلة
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
                    <span>إضافة أو ربط فرع جديد...</span>
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

      {/* Add / Provision Location Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="إدارة فروع العيادة في GoHighLevel"
        description="يمكنك ربط فرع موجود بالفعل أو إنشاء فرع جديد تلقائياً"
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => {
                setActiveTab("existing");
                setActionFeedback(null);
              }}
              className={`pb-2.5 text-xs font-bold px-4 border-b-2 transition-colors ${
                activeTab === "existing"
                  ? "border-brand-700 text-brand-800"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              1. ربط فرع موجود بالفعل (Existing Location)
            </button>
            <button
              onClick={() => {
                setActiveTab("new");
                setActionFeedback(null);
              }}
              className={`pb-2.5 text-xs font-bold px-4 border-b-2 transition-colors ${
                activeTab === "new"
                  ? "border-brand-700 text-brand-800"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              2. إنشاء فرع جديد آلياً (Create New)
            </button>
          </div>

          {/* Tab 1: Connect Existing */}
          {activeTab === "existing" && (
            <form onSubmit={handleConnectExisting} className="space-y-3.5 pt-1">
              <p className="text-xs text-slate-500 leading-relaxed">
                إذا كان لديك فرع/عيادة تم إنشاؤها مسبقاً داخل GoHighLevel، كل ما عليك هو إدخال اسمها ومعرف الـ <strong>Location ID</strong> الخاص بها.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم الفرع أو العيادة
                </label>
                <Input
                  type="text"
                  placeholder="مثال: عيادات لومينا - فرع التحلية"
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
                  placeholder="مثال: ve9EPMNuKaEn00WdSmxD"
                  value={existingForm.locationId}
                  onChange={(e) => setExistingForm({ ...existingForm, locationId: e.target.value })}
                  className="font-mono text-xs text-left"
                  dir="ltr"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  يمكن نسخه من شريط الرابط: <code>app.gohighlevel.com/v2/location/[LocationID]/...</code>
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
                  تأكيد وربط الفرع فورياً
                </Button>
              </div>
            </form>
          )}

          {/* Tab 2: Create New Location */}
          {activeTab === "new" && (
            <form onSubmit={handleCreateNew} className="space-y-3.5 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                  <span>كيف تعمل ميزة إنشاء الفرع تلقائياً؟</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  يقوم BeatApp بإرسال أمر لسيرفر GoHighLevel (عبر <code>POST /locations/</code>) لإنشاء حساب فرعي جديد ومستقل للعيادة وإرجاع معرف الفرع الجديد فوراً.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم العيادة / الفرع الجديد *
                </label>
                <Input
                  type="text"
                  placeholder="مثال: مركز ديرما جلو للتجميل"
                  value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    رقم الهاتف
                  </label>
                  <Input
                    type="tel"
                    placeholder="+966501234567"
                    value={newForm.phone}
                    onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    المدينة
                  </label>
                  <Input
                    type="text"
                    value={newForm.city}
                    onChange={(e) => setNewForm({ ...newForm, city: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  العنوان
                </label>
                <Input
                  type="text"
                  placeholder="طريق الملك فهد، الرياض"
                  value={newForm.address}
                  onChange={(e) => setNewForm({ ...newForm, address: e.target.value })}
                />
              </div>

              {actionFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    actionFeedback.success
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-amber-50 border-amber-200 text-amber-900"
                  }`}
                >
                  {actionFeedback.success ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />}
                  <span className="leading-relaxed">{actionFeedback.message}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={loadingAction}>
                  إنشاء الفرع في HighLevel
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </>
  );
}
