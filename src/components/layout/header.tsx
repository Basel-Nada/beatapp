"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
  Calendar,
  UserCheck,
  MessageSquare,
  AlertTriangle,
  CheckCheck,
  Home,
  UserCircle,
  Briefcase,
  Users2,
  Layers,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useApp } from "@/context/app-context";

interface LocationItem {
  id: string;
  name: string;
  locationId: string;
  city?: string;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  rawDate?: string;
  isRead: boolean;
  type: "lead" | "appointment" | "message" | "alert";
  linkUrl: string;
}

interface HeaderProps {
  onOpenSearch?: () => void;
}

export function Header({
  onOpenSearch,
}: HeaderProps) {
  const router = useRouter();
  const {
    currentIndustry,
    setIndustry,
    currentTenant,
    tenants,
    switchTenant,
    currentUser,
    users,
    tenantUsers,
    switchUser,
    returnToAdmin,
    isImpersonating,
    isAdmin,
    isSuperAdmin,
  } = useApp();
  const [locations, setLocations] = React.useState<LocationItem[]>([]);
  const [activeLocId, setActiveLocId] = React.useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

  // Dynamic live notification state
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [isNotifLoading, setIsNotifLoading] = React.useState(true);
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);

  // Helper to retrieve read notification IDs from localStorage safely
  const getStoredReadIds = React.useCallback((): Set<string> => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem("beatapp_read_notifications");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  }, []);

  // Fetch real notifications from /api/notifications
  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      const items: NotificationItem[] = data.notifications || [];
      const readSet = getStoredReadIds();

      setNotifications(
        items.map((n) => ({
          ...n,
          isRead: n.isRead || readSet.has(n.id),
        }))
      );
    } catch (e) {
      console.error("Error fetching live notifications:", e);
    } finally {
      setIsNotifLoading(false);
    }
  }, [getStoredReadIds]);

  // Initial load, real-time polling every 20 seconds, and window events
  React.useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 20000);

    const handleFocus = () => fetchNotifications();
    const handleCustomRefresh = () => fetchNotifications();

    window.addEventListener("focus", handleFocus);
    window.addEventListener("beatapp:refresh-notifications", handleCustomRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("beatapp:refresh-notifications", handleCustomRefresh);
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const readSet = getStoredReadIds();
    notifications.forEach((n) => readSet.add(n.id));
    try {
      localStorage.setItem("beatapp_read_notifications", JSON.stringify(Array.from(readSet)));
    } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markSingleAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const readSet = getStoredReadIds();
    readSet.add(id);
    try {
      localStorage.setItem("beatapp_read_notifications", JSON.stringify(Array.from(readSet)));
    } catch {}
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    markSingleAsRead(notif.id);
    setIsNotifOpen(false);
    router.push(notif.linkUrl);
  };

  // Close notifications on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        {/* Right side: Multi-Tenant Company Workspace Switcher */}
        <div className="flex items-center gap-3 relative">
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-800 hover:bg-slate-100 transition-colors shadow-2xs"
              title="تبديل الشركة المشتركة"
            >
              {currentTenant.industry === "real_estate" ? (
                <Home className="h-4 w-4 text-emerald-600" />
              ) : (
                <Sparkles className="h-4 w-4 text-brand-600" />
              )}
              <span className="text-xs sm:text-sm font-bold max-w-[170px] sm:max-w-[240px] truncate">
                {currentTenant.name}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 p-2 space-y-1 animate-in fade-in"
                dir="rtl"
              >
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 flex items-center justify-between">
                  <span>الشركات والمؤسسات المشتركة</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                    {tenants.length} حسابات
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1 py-1">
                  {tenants.map((t) => {
                    const isCurrent = t.id === currentTenant.id;
                    const isRE = t.industry === "real_estate";
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          switchTenant(t.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-right text-xs transition-colors ${
                          isCurrent
                            ? isRE
                              ? "bg-emerald-50 text-emerald-950 font-bold border border-emerald-200"
                              : "bg-teal-50 text-teal-950 font-bold border border-teal-200"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="truncate flex items-center gap-2">
                          <div
                            className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-white shrink-0 ${
                              isRE ? "bg-emerald-600" : "bg-teal-600"
                            }`}
                          >
                            {isRE ? <Home className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                          </div>
                          <div className="truncate">
                            <div className="truncate font-bold">{t.name}</div>
                            <div className="text-[10px] text-slate-400">
                              {isRE ? "شركات عقارية 🏢" : "عيادات تجميل ✨"} • أدمن: {t.adminName}
                            </div>
                          </div>
                        </div>
                        {isCurrent && <Check className="h-4 w-4 text-emerald-600 shrink-0 mr-2" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <Link
                    href="/admin/tenants"
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <Plus className="h-4 w-4" />
                      <span>إصدار حساب شركة جديد (بيع)...</span>
                    </div>
                    <span className="text-[10px] bg-amber-200 px-1.5 py-0.5 rounded font-mono">SaaS</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* BeatApp Core Status Badge */}
          <div className="hidden xl:inline-flex items-center">
            <Badge variant="success" className="gap-1.5 font-bold shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>نظام BeatApp (سحابي مباشر 100%)</span>
            </Badge>
          </div>

          {/* Dual-Industry Selector (عيادات تجميل vs شركات عقارية) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/90 shadow-xs">
            <button
              onClick={() => setIndustry("clinic")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                currentIndustry === "clinic"
                  ? "bg-white text-brand-800 shadow-sm ring-1 ring-slate-200/80"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="التحويل إلى وضع عيادات التجميل والليزر"
            >
              <Sparkles className="h-3.5 w-3.5 text-brand-600" />
              <span className="hidden sm:inline">عيادات تجميل</span>
            </button>
            <button
              onClick={() => setIndustry("real_estate")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                currentIndustry === "real_estate"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="التحويل إلى وضع الشركات العقارية ومخزون الوحدات"
            >
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">شركات عقارية</span>
            </button>
          </div>
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

          {/* Notifications Popover Container */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`relative p-2 rounded-xl transition-colors ${
                isNotifOpen ? "bg-slate-100 text-brand-800" : "text-slate-600 hover:bg-slate-100"
              }`}
              title="الإشعارات والتنبيهات"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white ring-2 ring-white animate-in zoom-in">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Menu */}
            {isNotifOpen && (
              <div
                className="absolute left-0 top-full mt-2 w-[340px] sm:w-[390px] max-w-[calc(100vw-32px)] rounded-2xl bg-white border border-slate-200/90 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95"
                dir="rtl"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">تنبيهات العيادة المباشرة</span>
                    {unreadCount > 0 ? (
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                        {unreadCount} غير مقروء
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>الكل مقروء</span>
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-1 transition-colors"
                      title="تعليم جميع التنبيهات كمقروءة وتصفير العداد"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      <span>تعيين الكل كمقروء</span>
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100/80">
                  {notifications.length === 0 ? (
                    <div className="py-10 px-4 text-center">
                      <div className="h-10 w-10 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Bell className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">لا توجد إشعارات حالياً</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] mx-auto">
                        ستظهر هنا التنبيهات اللحظية للمواعيد والرسائل واستبيانات المرضى.
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const getIcon = () => {
                        switch (notif.type) {
                          case "appointment":
                            return (
                              <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center shrink-0">
                                <Calendar className="h-4 w-4" />
                              </div>
                            );
                          case "lead":
                            return (
                              <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-800 border border-teal-100 flex items-center justify-center shrink-0">
                                <UserCheck className="h-4 w-4" />
                              </div>
                            );
                          case "alert":
                            return (
                              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
                                <AlertTriangle className="h-4 w-4" />
                              </div>
                            );
                          case "message":
                            return (
                              <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0">
                                <MessageSquare className="h-4 w-4" />
                              </div>
                            );
                        }
                      };

                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`group w-full text-right p-3 flex items-start gap-3 transition-colors cursor-pointer ${
                            notif.isRead
                              ? "bg-white hover:bg-slate-50/80 text-slate-600 opacity-75 hover:opacity-100"
                              : "bg-teal-50/25 hover:bg-teal-50/50 text-slate-900"
                          }`}
                        >
                          {getIcon()}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs ${notif.isRead ? "font-semibold text-slate-700" : "font-bold text-slate-900"}`}>
                                {notif.title}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {!notif.isRead && (
                                  <button
                                    onClick={(e) => markSingleAsRead(notif.id, e)}
                                    className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 hover:bg-teal-100 rounded text-teal-800 transition-all text-[10px] flex items-center gap-1 font-semibold"
                                    title="تحديد كمقروء وإزالة من العداد فوراً"
                                  >
                                    <Check className="h-3 w-3" />
                                    <span>مقروء</span>
                                  </button>
                                )}
                                {!notif.isRead && (
                                  <span className="h-2 w-2 rounded-full bg-teal-600 shrink-0" />
                                )}
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                              {notif.description}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                              {notif.timestamp}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="px-3 py-2 bg-slate-50/90 border-t border-slate-100 text-center flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>نظام التنبيهات المباشرة — BeatApp</span>
                </div>
              </div>
            )}
          </div>

          <div className="h-5 w-[1px] bg-slate-200 mx-1" />

          {/* User Switcher Dropdown (Admin & Employees) */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all ${
                isImpersonating
                  ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/30"
                  : "border-slate-200/80 hover:bg-slate-50"
              }`}
              title="تبديل المستخدم أو الصلاحية"
            >
              <Avatar name={currentUser.name} size="sm" />
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {currentUser.role === "super_admin"
                    ? "سوبر أدمن (تحكم كامل)"
                    : currentUser.role === "admin"
                    ? "مدير الشركة (أدمن)"
                    : currentUser.role === "sales"
                    ? "مستشار مبيعات (موظف)"
                    : "موظف استقبال"}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 mr-0.5" />
            </button>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <div
                className="absolute left-0 top-full mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 p-2 space-y-1 animate-in fade-in"
                dir="rtl"
              >
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      المستخدمين والصلاحيات
                    </span>
                    <span className="text-[10px] text-slate-400">
                      اختر أي مستخدم للمعاينة بصلاحياته
                    </span>
                  </div>
                  {isImpersonating && (
                    <button
                      onClick={() => {
                        returnToAdmin();
                        setIsUserMenuOpen(false);
                        window.location.reload();
                      }}
                      className="text-[10px] bg-slate-900 text-amber-300 px-2 py-0.5 rounded font-bold hover:bg-black"
                    >
                      استعادة الأدمن
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 py-1">
                  {/* Super admin option */}
                  {users.some((u) => u.role === "super_admin") && (
                    <div className="pb-1.5 border-b border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold px-2 block mb-1">
                        مالك المنصة
                      </span>
                      {users
                        .filter((u) => u.role === "super_admin")
                        .map((u) => {
                          const isSelected = u.id === currentUser.id;
                          return (
                            <button
                              key={u.id}
                              onClick={() => {
                                switchUser(u.id);
                                setIsUserMenuOpen(false);
                                window.location.reload();
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-xl text-right text-xs transition-colors ${
                                isSelected
                                  ? "bg-slate-900 text-white font-bold shadow-xs"
                                  : "hover:bg-slate-100 text-slate-800"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <Avatar name={u.name} size="sm" />
                                <div className="truncate">
                                  <div className="font-semibold">{u.name}</div>
                                  <div
                                    className={`text-[10px] ${
                                      isSelected ? "text-slate-300" : "text-slate-500"
                                    }`}
                                  >
                                    {u.email || "سوبر أدمن (تحكم كامل)"}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] px-1.5 py-0.5 rounded border shrink-0 bg-amber-100 text-amber-900 border-amber-300 font-bold">
                                سوبر أدمن
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  )}

                  {/* Current Tenant Team */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold px-2 block mb-1">
                      فريق عمل ({currentTenant.name})
                    </span>
                    {tenantUsers.map((u) => {
                      const isSelected = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            switchUser(u.id);
                            setIsUserMenuOpen(false);
                            window.location.reload();
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-right text-xs transition-colors ${
                            isSelected
                              ? "bg-slate-900 text-white font-bold shadow-xs"
                              : "hover:bg-slate-100 text-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Avatar name={u.name} size="sm" />
                            <div className="truncate">
                              <div className="font-semibold">{u.name}</div>
                              <div
                                className={`text-[10px] ${
                                  isSelected ? "text-slate-300" : "text-slate-500"
                                }`}
                              >
                                {u.email || (u.role === "admin" ? "مدير الشركة" : "فريق المبيعات")}
                              </div>
                            </div>
                          </div>

                          {isSelected ? (
                            <div className="flex items-center gap-1 shrink-0 mr-2">
                              <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-bold">
                                نشط
                              </span>
                              <Check className="h-4 w-4 text-emerald-400" />
                            </div>
                          ) : (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${
                                u.role === "admin"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold"
                                  : "bg-sky-50 text-sky-800 border-sky-200"
                              }`}
                            >
                              {u.role === "admin" ? "أدمن" : "مبيعات"}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 px-2 text-[11px] text-slate-600">
                  <Link
                    href="/team"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="text-slate-700 hover:text-slate-900 font-bold flex items-center justify-between p-1 rounded hover:bg-slate-50"
                  >
                    <span>👥 إدارة فريق عمل الشركة</span>
                    <span className="text-[10px] text-slate-400 font-normal">إضافة موظفين</span>
                  </Link>
                  <Link
                    href="/reports"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="text-brand-700 hover:underline font-semibold flex items-center gap-1 p-1"
                  >
                    <span>📊 تقارير وإنتاجية الموظفين</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Connect Location Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="إضافة فرع جديد للشركة في BeatApp"
        description="تسجيل فرع جديد وربطه بالشركة الحالية"
        maxWidth="md"
      >
        <form onSubmit={handleConnectExisting} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              اسم الفرع
            </label>
            <Input
              type="text"
              placeholder="مثال: فرع الرياض - التحلية"
              value={existingForm.name}
              onChange={(e) => setExistingForm({ ...existingForm, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              كود الفرع (Branch Code) *
            </label>
            <Input
              type="text"
              placeholder="مثال: BRANCH-02"
              value={existingForm.locationId}
              onChange={(e) => setExistingForm({ ...existingForm, locationId: e.target.value })}
              className="font-mono text-xs text-left"
              dir="ltr"
              required
            />
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
