"use client";

import * as React from "react";
import {
  FileText,
  Plus,
  Search,
  MessageSquare,
  Sparkles,
  Building2,
  Copy,
  ExternalLink,
  Edit2,
  Trash2,
  Send,
  Check,
  Phone,
  User,
  Hash,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { WhatsAppTemplate, WhatsAppTemplateCategory, Contact } from "@/types";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";

export default function WhatsAppTemplatesPage() {
  const { currentUser, isAdmin, currentIndustry } = useApp();
  const [templates, setTemplates] = React.useState<WhatsAppTemplate[]>([]);
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [industryFilter, setIndustryFilter] = React.useState<string>("all");

  // Selected template for live preview & dispatch
  const [selectedTemplate, setSelectedTemplate] = React.useState<WhatsAppTemplate | null>(null);

  // Dispatch interactive state
  const [targetPhone, setTargetPhone] = React.useState("+966 50 123 4567");
  const [clientName, setClientName] = React.useState("سارة محمد");
  const [projectName, setProjectName] = React.useState("أبراج التحلية");
  const [unitCode, setUnitCode] = React.useState("APT-A102");
  const [serviceName, setServiceName] = React.useState("جلسة ليزر كانديلا");
  const [appointmentDate, setAppointmentDate] = React.useState("غداً الساعة 5:00 عصراً");
  const [isCopied, setIsCopied] = React.useState(false);

  // Admin Modal: Create / Edit Template
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<WhatsAppTemplate | null>(null);
  const [formTitle, setFormTitle] = React.useState("");
  const [formCategory, setFormCategory] = React.useState<WhatsAppTemplateCategory>("followup");
  const [formIndustry, setFormIndustry] = React.useState<"all" | "clinic" | "real_estate">("all");
  const [formShortcut, setFormShortcut] = React.useState("");
  const [formContent, setFormContent] = React.useState("");

  const fetchTemplates = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/templates");
      const data = await res.json();
      if (data.templates) {
        setTemplates(data.templates);
        if (!selectedTemplate && data.templates.length > 0) {
          setSelectedTemplate(data.templates[0]);
        }
      }
    } catch (e) {
      console.error("Error loading templates", e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTemplate]);

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
    fetchTemplates();
    fetchContacts();
  }, [fetchTemplates, fetchContacts]);

  // Set default industry filter based on active app industry
  React.useEffect(() => {
    if (currentIndustry === "real_estate") {
      setIndustryFilter("real_estate");
    } else {
      setIndustryFilter("clinic");
    }
  }, [currentIndustry]);

  // Filter templates
  const filteredTemplates = templates.filter((tpl) => {
    const matchesSearch =
      tpl.title.toLowerCase().includes(search.toLowerCase()) ||
      tpl.content.toLowerCase().includes(search.toLowerCase()) ||
      (tpl.shortcutCode && tpl.shortcutCode.toLowerCase().includes(search.toLowerCase()));

    const matchesIndustry = industryFilter === "all" || tpl.industry === "all" || tpl.industry === industryFilter;
    return matchesSearch && matchesIndustry;
  });

  // Calculate live preview text by replacing variables
  const getRenderedContent = (rawText: string) => {
    if (!rawText) return "";
    return rawText
      .replace(/{اسم_العميل}/g, clientName || "العميل")
      .replace(/{اسم_الموظف}/g, currentUser.name || "المستشار")
      .replace(/{اسم_المشروع}/g, projectName || "المشروع")
      .replace(/{رقم_الوحدة}/g, unitCode || "A-101")
      .replace(/{نوع_الوحدة}/g, "شقة فاخرة")
      .replace(/{المساحة}/g, "165")
      .replace(/{مقدم_الحجز}/g, "135,000")
      .replace(/{سنوات_التقسيط}/g, "7")
      .replace(/{تاريخ_المعاينة}/g, appointmentDate)
      .replace(/{وقت_المعاينة}/g, "5:30 عصراً")
      .replace(/{موقع_المشروع}/g, "الرياض - التحلية")
      .replace(/{السعر_الإجمالي}/g, "1,350,000")
      .replace(/{مبلغ_العربون}/g, "50,000")
      .replace(/{تاريخ_الانتهاء}/g, "بعد 48 ساعة")
      .replace(/{نوع_الخدمة}/g, serviceName)
      .replace(/{اسم_الطبيب}/g, "د. نورة الشمري")
      .replace(/{تاريخ_الموعد}/g, appointmentDate)
      .replace(/{وقت_الموعد}/g, "4:00 عصراً")
      .replace(/{اسم_الباقة}/g, "باقة النضارة الشاملة")
      .replace(/{عدد_الجلسات}/g, "4")
      .replace(/{معرف_العميل}/g, "cnt-1");
  };

  // Dispatch via WhatsApp Web
  const handleDirectWhatsAppSend = () => {
    if (!selectedTemplate) return;
    const finalBody = getRenderedContent(selectedTemplate.content);
    const cleanPhone = targetPhone.replace(/[^0-9]/g, "");
    const encoded = encodeURIComponent(finalBody);
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, "_blank");

    // Log activity
    fetch("/api/reports/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "log_activity",
        activity: {
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          type: "whatsapp_sent",
          title: `إرسال قالب واتساب (${selectedTemplate.title})`,
          description: `أرسل قالب (${selectedTemplate.title}) للعميل (${clientName}) برقم (${targetPhone}).`,
          contactName: clientName,
        },
      }),
    }).catch(console.error);
  };

  // Copy text to clipboard
  const handleCopyText = () => {
    if (!selectedTemplate) return;
    const finalBody = getRenderedContent(selectedTemplate.content);
    navigator.clipboard.writeText(finalBody);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Insert Variable in Modal Textarea
  const handleInsertVariable = (variable: string) => {
    setFormContent((prev) => `${prev} ${variable} `);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormTitle("");
    setFormCategory("followup");
    setFormIndustry(currentIndustry === "real_estate" ? "real_estate" : "clinic");
    setFormShortcut("/msg");
    setFormContent(
      "أهلاً بك أستاذ {اسم_العميل}، يسعدنا التواصل معك بخصوص {اسم_المشروع}... مستشارك: {اسم_الموظف}"
    );
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (tpl: WhatsAppTemplate) => {
    setEditingTemplate(tpl);
    setFormTitle(tpl.title);
    setFormCategory(tpl.category);
    setFormIndustry(tpl.industry);
    setFormShortcut(tpl.shortcutCode || "");
    setFormContent(tpl.content);
    setIsModalOpen(true);
  };

  // Save Template (Create or Update)
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const vars = formContent.match(/{[^{}]+}/g) || [];
      const payload = {
        title: formTitle,
        category: formCategory,
        industry: formIndustry,
        shortcutCode: formShortcut,
        content: formContent,
        variables: Array.from(new Set(vars)),
      };

      if (editingTemplate) {
        await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            id: editingTemplate.id,
            data: payload,
          }),
        });
      } else {
        await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            template: payload,
          }),
        });
      }

      setIsModalOpen(false);
      fetchTemplates();
    } catch (e) {
      console.error("Error saving template", e);
    }
  };

  // Delete Template
  const handleDeleteTemplate = async (tpl: WhatsAppTemplate) => {
    if (!confirm(`هل أنت متأكد من حذف القالب "${tpl.title}"؟`)) return;
    try {
      await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          id: tpl.id,
        }),
      });
      fetchTemplates();
    } catch (e) {
      console.error("Error deleting template", e);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              قوالب رسائل الواتساب الذكية
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>إرسال فوري بنقرة واحدة</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            إدارة وتخصيص قوالب الردود السريعة، إرفاق المتغيرات التلقائية، وإرسالها مباشرة للعملاء عبر واتساب.
          </p>
        </div>

        {isAdmin && (
          <Button
            onClick={openCreateModal}
            variant="primary"
            className="gap-2 text-xs h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>إنشاء قالب جديد</span>
          </Button>
        )}
      </div>

      {/* Main Grid: Templates List (Right) & Live WhatsApp Preview (Left) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Templates List Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3 justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالقالب أو الاختصار..."
                className="pr-9 text-xs h-9"
              />
            </div>

            {/* Industry Filter Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs w-full sm:w-auto">
              <button
                onClick={() => setIndustryFilter("all")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  industryFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setIndustryFilter("real_estate")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  industryFilter === "real_estate" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600"
                }`}
              >
                <Building2 className="h-3 w-3" />
                <span>عقارات</span>
              </button>
              <button
                onClick={() => setIndustryFilter("clinic")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  industryFilter === "clinic" ? "bg-brand-600 text-white shadow-xs" : "text-slate-600"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>عيادات</span>
              </button>
            </div>
          </div>

          {/* Templates Cards List */}
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-sm">جاري تحميل القوالب...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">لا توجد قوالب مطابقة</h3>
              <p className="text-xs text-slate-500 mt-1">جرّب تغيير التصفية أو إنشاء قالب جديد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map((tpl) => {
                const isSelected = selectedTemplate?.id === tpl.id;
                const isRealEstateTpl = tpl.industry === "real_estate";
                const isClinicTpl = tpl.industry === "clinic";

                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
                      isSelected
                        ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                        : "border-slate-200/90 hover:border-slate-300 shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{tpl.title}</h3>
                          {tpl.shortcutCode && (
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold border border-slate-200">
                              {tpl.shortcutCode}
                            </span>
                          )}
                          {isRealEstateTpl && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold border border-emerald-200">
                              عقارات
                            </span>
                          )}
                          {isClinicTpl && (
                            <span className="text-[10px] bg-teal-50 text-teal-800 px-2 py-0.5 rounded font-bold border border-teal-200">
                              عيادات
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed whitespace-pre-line">
                          {tpl.content}
                        </p>
                      </div>

                      {/* Admin Actions */}
                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openEditModal(tpl)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="تعديل القالب"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(tpl)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="حذف القالب"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Variables Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-400">المتغيرات:</span>
                      {tpl.variables.map((v, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200/60 font-mono"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live WhatsApp Mobile Mockup Preview Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20">
            <div className="bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-800 text-white">
              {/* Phone Header Mockup */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-white shadow">
                    WA
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{clientName || "العميل"}</span>
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{targetPhone}</div>
                  </div>
                </div>

                <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-800">
                  معاينة مباشرة
                </span>
              </div>

              {/* Dynamic Values Form for Live Preview */}
              <div className="py-3 border-b border-slate-800/80 space-y-2 text-xs">
                <span className="text-[11px] font-bold text-slate-300 block">
                  بيانات العميل والمتغيرات للاختبار:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">اسم العميل</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">رقم الواتساب</label>
                    <input
                      type="text"
                      value={targetPhone}
                      onChange={(e) => setTargetPhone(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                {selectedTemplate?.industry === "real_estate" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">المشروع</label>
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">رقم الوحدة</label>
                      <input
                        type="text"
                        value={unitCode}
                        onChange={(e) => setUnitCode(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">الخدمة / الجلسة</label>
                      <input
                        type="text"
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">الموعد</label>
                      <input
                        type="text"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Bubble Area */}
              <div className="py-4 min-h-[220px] max-h-[340px] overflow-y-auto space-y-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 my-3">
                <div className="text-center">
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full">
                    اليوم 12:45 م
                  </span>
                </div>

                {selectedTemplate ? (
                  <div className="flex justify-end">
                    <div className="bg-emerald-900/80 text-emerald-50 border border-emerald-700/60 rounded-2xl rounded-tl-xs p-3.5 max-w-[90%] shadow-md">
                      <p className="text-xs leading-relaxed whitespace-pre-line font-normal">
                        {getRenderedContent(selectedTemplate.content)}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-1.5 text-[9px] text-emerald-300">
                        <span>الآن</span>
                        <span>✓✓</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 text-xs py-8">
                    اختر قالباً من القائمة لعرض المعاينة الحية
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  onClick={handleCopyText}
                  variant="outline"
                  className="w-full text-xs h-10 border-slate-700 text-slate-200 hover:bg-slate-800 gap-1.5"
                >
                  {isCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  <span>{isCopied ? "تم النسخ!" : "نسخ الرسالة"}</span>
                </Button>

                <Button
                  onClick={handleDirectWhatsAppSend}
                  className="w-full text-xs h-10 bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1.5 shadow-lg shadow-emerald-600/30"
                >
                  <Send className="h-4 w-4" />
                  <span>فتح في واتساب</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin: Create / Edit Template Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTemplate ? "تعديل قالب الواتساب" : "إنشاء قالب واتساب جديد"}
        description="أدخل نص القالب مع استخدام المتغيرات التلقائية لتجهيز الرسالة بضغطة زر."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveTemplate} className="space-y-4 pt-2" dir="rtl">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              عنوان القالب *
            </label>
            <Input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="مثال: تأكيد موعد معاينة ميدانية"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">النشاط المستهدف</label>
              <select
                value={formIndustry}
                onChange={(e) => setFormIndustry(e.target.value as "all" | "clinic" | "real_estate")}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-semibold"
              >
                <option value="all">عام لكلا النشاطين</option>
                <option value="real_estate">شركات عقارية فقط</option>
                <option value="clinic">عيادات تجميل فقط</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as WhatsAppTemplateCategory)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-semibold"
              >
                <option value="appointment">حجوزات ومواعيد</option>
                <option value="followup">متابعة عميل (Follow-up)</option>
                <option value="property_brochure">كتالوج ومخطط عقار</option>
                <option value="property_reservation">تأكيد قفل حجز</option>
                <option value="welcome">رسالة ترحيبية</option>
                <option value="offer">عروض وباقات</option>
                <option value="payment">فواتير ومدفوعات</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الاختصار السريع</label>
              <Input
                value={formShortcut}
                onChange={(e) => setFormShortcut(e.target.value)}
                placeholder="/brochure"
                className="font-mono text-xs"
              />
            </div>
          </div>

          {/* Quick Variables Toolbar */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              انقر لإدراج متغير ديناميكي داخل الرسالة:
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
              {[
                "{اسم_العميل}",
                "{اسم_الموظف}",
                "{اسم_المشروع}",
                "{رقم_الوحدة}",
                "{نوع_الوحدة}",
                "{المساحة}",
                "{مقدم_الحجز}",
                "{السعر_الإجمالي}",
                "{تاريخ_المعاينة}",
                "{نوع_الخدمة}",
                "{تاريخ_الموعد}",
                "{اسم_الطبيب}",
              ].map((v) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => handleInsertVariable(v)}
                  className="text-[11px] bg-white text-slate-800 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 px-2 py-1 rounded-lg font-mono transition-colors shadow-2xs"
                >
                  +{v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              محتوى نص القالب *
            </label>
            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              rows={6}
              className="w-full text-xs rounded-xl border border-slate-300 p-3 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-normal"
              placeholder="اكتب نص الرسالة هنا مع المتغيرات..."
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="text-xs h-10"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="text-xs h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {editingTemplate ? "حفظ تعديلات القالب" : "إنشاء القالب فوراً"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
