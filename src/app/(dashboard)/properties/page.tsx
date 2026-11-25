"use client";

import * as React from "react";
import {
  Building2,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  DollarSign,
  User,
  Phone,
  Calendar,
  Layers,
  Home,
  Check,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { PropertyUnit, UnitStatus, UnitType, Contact } from "@/types";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";

export default function PropertiesPage() {
  const { currentUser, isAdmin, currentIndustry, setIndustry } = useApp();
  const [units, setUnits] = React.useState<PropertyUnit[]>([]);
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");

  // Reservation Modal State
  const [selectedUnit, setSelectedUnit] = React.useState<PropertyUnit | null>(null);
  const [isReserveModalOpen, setIsReserveModalOpen] = React.useState(false);
  const [clientId, setClientId] = React.useState("");
  const [clientName, setClientName] = React.useState("");
  const [clientPhone, setClientPhone] = React.useState("");
  const [reservationNotes, setReservationNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Admin: Add/Edit Unit Modal State
  const [isUnitModalOpen, setIsUnitModalOpen] = React.useState(false);
  const [editingUnit, setEditingUnit] = React.useState<PropertyUnit | null>(null);
  const [unitForm, setUnitForm] = React.useState({
    unitCode: "",
    projectName: "",
    type: "apartment" as UnitType,
    area: 150,
    bedrooms: 3,
    bathrooms: 2,
    floor: "الدور الأول",
    price: 1200000,
    downPayment: 120000,
    installmentYears: 5,
    location: "الرياض",
    features: "تشطيب سوبر ديلوكس، موقف سيارة خاص",
  });

  const fetchUnits = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/properties");
      const data = await res.json();
      if (data.units) {
        setUnits(data.units);
      }
    } catch (e) {
      console.error("Error loading units", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchContacts = React.useCallback(async () => {
    try {
      const res = await fetch("/api/contacts");
      const data = await res.json();
      if (data.contacts) {
        setContacts(data.contacts);
      }
    } catch (e) {
      console.error("Error loading contacts", e);
    }
  }, []);

  React.useEffect(() => {
    fetchUnits();
    fetchContacts();
  }, [fetchUnits, fetchContacts]);

  // Handle Client Selection in Reserve Modal
  const handleClientSelect = (id: string) => {
    setClientId(id);
    const found = contacts.find((c) => c.id === id);
    if (found) {
      setClientName(found.name);
      setClientPhone(found.phone);
    }
  };

  // Submit Reservation Lock
  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reserve",
          unitId: selectedUnit.id,
          agentId: currentUser.id,
          agentName: currentUser.name,
          clientId: clientId || `cnt-${Date.now()}`,
          clientName: clientName || "عميل",
          clientPhone,
          notes: reservationNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "فشل حجز الوحدة" });
      } else {
        setFeedback({
          type: "success",
          text: `تم قفل حجز الوحدة (${selectedUnit.unitCode}) باسمك بنجاح ولمدة 48 ساعة!`,
        });
        setTimeout(() => {
          setIsReserveModalOpen(false);
          setSelectedUnit(null);
          setFeedback(null);
          fetchUnits();
        }, 1200);
      }
    } catch (e: unknown) {
      const err = e as Error;
      setFeedback({ type: "error", text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin: Release Unit Lock
  const handleReleaseLock = async (unit: PropertyUnit) => {
    if (!confirm(`هل أنت متأكد من فك حجز الوحدة (${unit.unitCode}) وإتاحتها مجدداً؟`)) return;

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "release",
          unitId: unit.id,
          releasedByName: currentUser.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUnits();
      }
    } catch (e) {
      console.error("Error releasing unit", e);
    }
  };

  // Admin: Mark Unit Sold
  const handleMarkSold = async (unit: PropertyUnit) => {
    if (!confirm(`هل تود اعتماد بيع الوحدة (${unit.unitCode}) وتوثيق الصفقة نهائياً؟`)) return;

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sell",
          unitId: unit.id,
          confirmedByName: currentUser.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUnits();
      }
    } catch (e) {
      console.error("Error marking unit sold", e);
    }
  };

  // Admin: Save Unit (Create or Update)
  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const featuresArray = unitForm.features
        .split("،")
        .join(",")
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);

      const payload = {
        ...unitForm,
        features: featuresArray,
      };

      if (editingUnit) {
        await fetch("/api/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            id: editingUnit.id,
            data: payload,
          }),
        });
      } else {
        await fetch("/api/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            unit: payload,
          }),
        });
      }

      setIsUnitModalOpen(false);
      setEditingUnit(null);
      fetchUnits();
    } catch (e) {
      console.error("Error saving unit", e);
    }
  };

  // Open Edit Modal
  const openEditModal = (unit: PropertyUnit) => {
    setEditingUnit(unit);
    setUnitForm({
      unitCode: unit.unitCode,
      projectName: unit.projectName,
      type: unit.type,
      area: unit.area,
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      floor: unit.floor,
      price: unit.price,
      downPayment: unit.downPayment,
      installmentYears: unit.installmentYears || 5,
      location: unit.location,
      features: unit.features.join("، "),
    });
    setIsUnitModalOpen(true);
  };

  // Filtered Units
  const filteredUnits = units.filter((u) => {
    const matchesSearch =
      u.unitCode.toLowerCase().includes(search.toLowerCase()) ||
      u.projectName.toLowerCase().includes(search.toLowerCase()) ||
      u.location.toLowerCase().includes(search.toLowerCase()) ||
      (u.reservedForClientName && u.reservedForClientName.toLowerCase().includes(search.toLowerCase())) ||
      (u.reservedByAgentName && u.reservedByAgentName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    const matchesType = typeFilter === "all" || u.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate Metrics
  const totalUnitsCount = units.length;
  const availableCount = units.filter((u) => u.status === "available").length;
  const reservedCount = units.filter((u) => u.status === "reserved").length;
  const soldCount = units.filter((u) => u.status === "sold").length;
  const totalValue = units.reduce((acc, u) => acc + (u.price || 0), 0);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              مخزون العقارات والوحدات السكنية
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              <span>نظام الحجز الحصري وقفل الوحدات</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            إدارة المخزون العقاري، قفل الوحدات فور حجزها لمنع التعارض، وإشراف الإدارة الكامل على المبيعات.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              onClick={() => {
                setEditingUnit(null);
                setUnitForm({
                  unitCode: `APT-${Math.floor(100 + Math.random() * 900)}`,
                  projectName: "مشروع النخبة السكني",
                  type: "apartment",
                  area: 160,
                  bedrooms: 3,
                  bathrooms: 3,
                  floor: "الدور الثالث",
                  price: 1300000,
                  downPayment: 130000,
                  installmentYears: 7,
                  location: "الرياض - الملقا",
                  features: "تشطيب فاخر، غرفة خادمة، بلكونة خاصة",
                });
                setIsUnitModalOpen(true);
              }}
              variant="primary"
              className="gap-2 text-xs h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة وحدة جديدة</span>
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">إجمالي الوحدات</span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-slate-900">{totalUnitsCount}</span>
            <Building2 className="h-5 w-5 text-slate-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 block">متاحة للحجز فوراً</span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-emerald-700">{availableCount}</span>
            <Unlock className="h-5 w-5 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-600 block">محجوزة ومقفولة حصرياً</span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-amber-700">{reservedCount}</span>
            <Lock className="h-5 w-5 text-amber-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-700 block">تم البيع والإفراغ</span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-bold text-slate-900">{soldCount}</span>
            <CheckCircle2 className="h-5 w-5 text-teal-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-[11px] font-semibold text-slate-500 block">إجمالي قيمة المخزون</span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-lg font-bold text-slate-900 truncate">
              {(totalValue / 1000000).toFixed(1)} مليون ر.س
            </span>
            <DollarSign className="h-5 w-5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3 justify-between">
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث برقم الوحدة، المشروع، الحي، العميل..."
            className="pr-9 text-xs h-10"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                statusFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
              }`}
            >
              الكل ({units.length})
            </button>
            <button
              onClick={() => setStatusFilter("available")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                statusFilter === "available" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600"
              }`}
            >
              المتاحة ({availableCount})
            </button>
            <button
              onClick={() => setStatusFilter("reserved")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                statusFilter === "reserved" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-600"
              }`}
            >
              المحجوزة ({reservedCount})
            </button>
            <button
              onClick={() => setStatusFilter("sold")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                statusFilter === "sold" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600"
              }`}
            >
              المباعة ({soldCount})
            </button>
          </div>
        </div>
      </div>

      {/* Units Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm">جاري تحميل مخزون الوحدات...</div>
      ) : filteredUnits.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">لا توجد وحدات مطابقة للبحث</h3>
          <p className="text-xs text-slate-500 mt-1">جرّب تغيير خيارات التصفية أو البحث</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUnits.map((unit) => {
            const isReserved = unit.status === "reserved";
            const isSold = unit.status === "sold";
            const isBlocked = unit.status === "blocked";
            const isAvailable = unit.status === "available";
            const isReservedByMe = isReserved && unit.reservedByAgentId === currentUser.id;

            return (
              <div
                key={unit.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                  isReserved
                    ? "border-amber-300 shadow-md ring-1 ring-amber-300/40 bg-gradient-to-b from-amber-50/20 to-white"
                    : isSold
                    ? "border-slate-200 opacity-80"
                    : isBlocked
                    ? "border-rose-200 bg-rose-50/10"
                    : "border-slate-200/90 hover:border-emerald-500/60 shadow-xs hover:shadow-md"
                }`}
              >
                {/* Card Header */}
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                        {unit.unitCode}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{unit.projectName}</span>
                    </div>

                    {/* Status Pill */}
                    {isAvailable && (
                      <Badge variant="success" className="gap-1 font-bold">
                        <Unlock className="h-3 w-3" />
                        <span>متاحة للبيع</span>
                      </Badge>
                    )}
                    {isReserved && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                        <Lock className="h-3 w-3 text-amber-700" />
                        <span>محجوزة ومقفولة</span>
                      </span>
                    )}
                    {isSold && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>تم البيع</span>
                      </span>
                    )}
                    {isBlocked && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        <span>معلقة إدارياً</span>
                      </span>
                    )}
                  </div>

                  {/* Pricing and specs */}
                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-lg font-black text-slate-900">
                        {unit.price.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 mr-1">ر.س</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      مقدم: <strong className="text-slate-800">{unit.downPayment.toLocaleString()} ر.س</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-600 mt-2">
                    <span>{unit.location}</span>
                    <span>•</span>
                    <span>{unit.floor}</span>
                    <span>•</span>
                    <span>{unit.area} م²</span>
                  </div>
                </div>

                {/* Specs Badges */}
                <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs text-slate-700">
                  <div className="flex items-center gap-1">
                    <Home className="h-3.5 w-3.5 text-slate-400" />
                    <span>{unit.bedrooms} غرف نوم</span>
                  </div>
                  <div>•</div>
                  <div>{unit.bathrooms} دورات مياه</div>
                  <div>•</div>
                  <div>تقسيط {unit.installmentYears || 5} سنوات</div>
                </div>

                {/* Reservation Details Notice (When Reserved) */}
                {isReserved && (
                  <div className="p-3 bg-amber-50/80 border-b border-amber-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-amber-950">
                      <div className="flex items-center gap-1">
                        <Lock className="h-3.5 w-3.5 text-amber-700" />
                        <span>محجوزة لصالح: {unit.reservedForClientName || "عميل"}</span>
                      </div>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                        قفل 48 ساعة
                      </span>
                    </div>
                    <div className="text-[11px] text-amber-900 flex items-center justify-between">
                      <span>المستشار الحاجز: <strong>{unit.reservedByAgentName}</strong></span>
                      {unit.reservedForClientPhone && (
                        <span className="font-mono text-[10px]">{unit.reservedForClientPhone}</span>
                      )}
                    </div>
                    {unit.reservationNotes && (
                      <p className="text-[10px] text-amber-800 italic pt-0.5">
                        "{unit.reservationNotes}"
                      </p>
                    )}
                  </div>
                )}

                {/* Features Pill */}
                <div className="p-4 flex flex-wrap gap-1">
                  {unit.features.slice(0, 3).map((f, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                    >
                      {f}
                    </span>
                  ))}
                  {unit.features.length > 3 && (
                    <span className="text-[10px] text-slate-400 px-1">
                      +{unit.features.length - 3} مزايا أخرى
                    </span>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  {isAvailable && (
                    <Button
                      onClick={() => {
                        setSelectedUnit(unit);
                        setClientId("");
                        setClientName("");
                        setClientPhone("");
                        setReservationNotes("");
                        setFeedback(null);
                        setIsReserveModalOpen(true);
                      }}
                      className="w-full text-xs font-bold h-9 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>قفل وحجز الوحدة حصرياً</span>
                    </Button>
                  )}

                  {isReserved && (
                    <div className="flex items-center gap-1.5 w-full">
                      <div className="flex-1 text-[11px] text-amber-800 font-semibold flex items-center gap-1">
                        <Lock className="h-3 w-3 text-amber-700 shrink-0" />
                        <span className="truncate">
                          {isReservedByMe
                            ? "محجوزة باسمك"
                            : `محجوزة لـ ${unit.reservedByAgentName}`}
                        </span>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleReleaseLock(unit)}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                            title="فك الحجز وإتاحة الوحدة في السوق"
                          >
                            فك الحجز
                          </button>
                          <button
                            onClick={() => handleMarkSold(unit)}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                            title="اعتماد البيع النهائي والإفراغ"
                          >
                            إتمام البيع
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {isSold && (
                    <div className="w-full text-center text-xs text-slate-500 font-semibold py-1">
                      الوحدة مباعة وموثقة نهائياً
                    </div>
                  )}

                  {/* Admin Edit Trigger */}
                  {isAdmin && (
                    <button
                      onClick={() => openEditModal(unit)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                      title="تعديل بيانات الوحدة"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reservation Lock Modal */}
      <Modal
        isOpen={isReserveModalOpen}
        onClose={() => {
          setIsReserveModalOpen(false);
          setSelectedUnit(null);
        }}
        title={`قفل وحجز الوحدة (${selectedUnit?.unitCode}) حصرياً`}
        description="بمجرد تأكيد الحجز، سيتم قفل الوحدة فوراً باسمك ومنع أي مستشار آخر من حجزها."
        maxWidth="md"
      >
        {selectedUnit && (
          <form onSubmit={handleReserveSubmit} className="space-y-4 pt-2" dir="rtl">
            {feedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  feedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {feedback.type === "success" ? (
                  <Check className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>المشروع: {selectedUnit.projectName}</span>
                <span>السعر: {selectedUnit.price.toLocaleString()} ر.س</span>
              </div>
              <div className="text-slate-500 text-[11px]">
                المستشار المنفذ: <strong className="text-slate-700">{currentUser.name}</strong>
              </div>
            </div>

            {/* Select from existing contacts or enter new */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اختر عميلاً مسجلاً في السيستم
              </label>
              <select
                value={clientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- أو أدخل بيانات عميل جديد أدناه --</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم العميل *
                </label>
                <Input
                  type="text"
                  placeholder="مثال: خالد بن سلطان"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم هاتف العميل
                </label>
                <Input
                  type="tel"
                  placeholder="+966 50 ..."
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ملاحظات الحجز أو العربون المدفوع
              </label>
              <textarea
                value={reservationNotes}
                onChange={(e) => setReservationNotes(e.target.value)}
                placeholder="مثال: تم تحويل عربون 25,000 ر.س وموعد توقيع العقد بعد غد"
                rows={2}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
              <Lock className="h-4 w-4 shrink-0 text-amber-700" />
              <span>
                سيتم قفل هذه الوحدة حصرياً لك لمدة <strong>48 ساعة</strong> ولن يتمكن أي زميل آخر من حجزها.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReserveModalOpen(false)}
                className="text-xs h-10"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                className="text-xs h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Lock className="h-3.5 w-3.5 ml-1.5" />
                <span>تأكيد القفل والحجز الحصري</span>
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Admin: Create / Edit Unit Modal */}
      <Modal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        title={editingUnit ? `تعديل الوحدة (${editingUnit.unitCode})` : "إضافة وحدة عقارية جديدة"}
        description="أدخل تفاصيل ومواصفات الوحدة والسعر ومقدم الحجز لإضافتها بالمخزون."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveUnit} className="space-y-4 pt-2" dir="rtl">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم أو كود الوحدة *
              </label>
              <Input
                value={unitForm.unitCode}
                onChange={(e) => setUnitForm({ ...unitForm, unitCode: e.target.value })}
                placeholder="مثال: APT-A102"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم المشروع / البرج *
              </label>
              <Input
                value={unitForm.projectName}
                onChange={(e) => setUnitForm({ ...unitForm, projectName: e.target.value })}
                placeholder="مثال: أبراج التحلية"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نوع الوحدة</label>
              <select
                value={unitForm.type}
                onChange={(e) => setUnitForm({ ...unitForm, type: e.target.value as UnitType })}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
              >
                <option value="apartment">شقة سكنية</option>
                <option value="villa">فيلا مستقلة</option>
                <option value="duplex">دوبلكس</option>
                <option value="penthouse">بنتهاوس</option>
                <option value="townhouse">تاون هاوس</option>
                <option value="commercial">تجاري / معرض</option>
                <option value="office">مكتب إداري</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المساحة (م²)</label>
              <Input
                type="number"
                value={unitForm.area}
                onChange={(e) => setUnitForm({ ...unitForm, area: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الدور / الطابق</label>
              <Input
                value={unitForm.floor}
                onChange={(e) => setUnitForm({ ...unitForm, floor: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">السعر الإجمالي (ر.س) *</label>
              <Input
                type="number"
                value={unitForm.price}
                onChange={(e) => setUnitForm({ ...unitForm, price: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">مقدم الحجز (ر.س)</label>
              <Input
                type="number"
                value={unitForm.downPayment}
                onChange={(e) => setUnitForm({ ...unitForm, downPayment: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">سنوات التقسيط</label>
              <Input
                type="number"
                value={unitForm.installmentYears}
                onChange={(e) => setUnitForm({ ...unitForm, installmentYears: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">عدد الغرف</label>
              <Input
                type="number"
                value={unitForm.bedrooms}
                onChange={(e) => setUnitForm({ ...unitForm, bedrooms: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">دورات المياه</label>
              <Input
                type="number"
                value={unitForm.bathrooms}
                onChange={(e) => setUnitForm({ ...unitForm, bathrooms: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المدينة / الحي</label>
              <Input
                value={unitForm.location}
                onChange={(e) => setUnitForm({ ...unitForm, location: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              المزايا الإضافية (افصل بينها بفاصلة)
            </label>
            <Input
              value={unitForm.features}
              onChange={(e) => setUnitForm({ ...unitForm, features: e.target.value })}
              placeholder="مثال: مسبح خاص، غرفة سائق، تكييف مركزي"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUnitModalOpen(false)}
              className="text-xs h-10"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="text-xs h-10 bg-slate-900 hover:bg-black text-white"
            >
              {editingUnit ? "حفظ التعديلات" : "إضافة الوحدة للمخزون"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
