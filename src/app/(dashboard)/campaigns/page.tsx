"use client";

import * as React from "react";
import {
  Megaphone,
  Plus,
  Send,
  MessageSquare,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Smartphone,
  Eye,
  Calendar,
  Tag,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatArabicDate } from "@/lib/date";
import { Campaign, Contact } from "@/types";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);

  // New Campaign Modal State
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  const [formData, setFormData] = React.useState({
    title: "",
    channel: "whatsapp" as "whatsapp" | "sms",
    targetAudience: "عملاء عروض الصيف والليزر",
    targetTag: "مهتم بليزر",
    messageContent:
      "مرحباً {اسم_العميل} ✨ يسر عياداتنا تقديم خصم حصري 25% على باقات الليزر والعناية بالبشرة لهذا الأسبوع فقط. احجزي جلستك واستمتعي باستشارة مجانية: {رابط_الحجز}",
    isScheduled: false,
    scheduledFor: "",
  });

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [cmpRes, cntRes] = await Promise.all([
        fetch("/api/campaigns").then((r) => r.json()),
        fetch("/api/contacts").then((r) => r.json()),
      ]);
      setCampaigns(cmpRes.campaigns || []);
      setContacts(cntRes.contacts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.messageContent) return;

    setCreating(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          channel: formData.channel,
          targetAudience: formData.targetAudience,
          targetTag: formData.targetTag,
          messageContent: formData.messageContent,
          scheduledFor: formData.isScheduled ? formData.scheduledFor : undefined,
        }),
      });

      if (res.ok) {
        setIsCreateOpen(false);
        setActionSuccess("تم إطلاق الحملة الترويجية بنجاح وجاري إرسال الرسائل للجمهور");
        setTimeout(() => setActionSuccess(null), 4000);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const insertVariable = (varName: string) => {
    setFormData((prev) => ({
      ...prev,
      messageContent: `${prev.messageContent} {${varName}}`,
    }));
  };

  // KPIs
  const totalSentMessages = campaigns.reduce((sum, c) => sum + (c.deliveredCount || 0), 0);
  const totalRecipients = campaigns.reduce((sum, c) => sum + (c.recipientsCount || 0), 0);
  const totalReadMessages = campaigns.reduce((sum, c) => sum + (c.readCount || 0), 0);
  const avgReadRate = totalSentMessages > 0 ? Math.round((totalReadMessages / totalSentMessages) * 100) : 78;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Banner */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{actionSuccess}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">حملات العروض والرسائل الجماعية</h1>
            <Badge variant="brand" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
              Bulk Broadcast & WhatsApp
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            إرسال عروض المناسبات، باقات العيادة الموسمية، والتنبيهات الموجهة لشرائح محددة من العملاء.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white"
        >
          <Plus className="h-4 w-4" />
          <span>إطلاق حملة جديدة</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">إجمالي الحملات</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{campaigns.length}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">حملات تسويقية وتنبيهية</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Megaphone className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">الرسائل المسلمة للعملاء</p>
              <h3 className="text-2xl font-bold text-brand-600 mt-1">{totalSentMessages}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">من أصل {totalRecipients} مستهدف</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
              <Smartphone className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">متوسط معدل القراءة</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{avgReadRate}%</h3>
              <p className="text-[11px] text-emerald-600 mt-0.5">أعلى بـ 35% من البريد</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Eye className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">معدل التحويل للحجوزات</p>
              <h3 className="text-2xl font-bold text-indigo-600 mt-1">24.2%</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">حجز استشارة أو باقة</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">جاري تحميل الحملات...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">لا توجد حملات منشأة بعد</div>
        ) : (
          campaigns.map((cmp) => (
            <Card key={cmp.id} className="border-slate-200/80 shadow-sm hover:border-slate-300 transition-colors">
              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0 ${
                        cmp.channel === "whatsapp" ? "bg-emerald-600" : "bg-slate-800"
                      }`}
                    >
                      {cmp.channel === "whatsapp" ? (
                        <MessageSquare className="h-5 w-5" />
                      ) : (
                        <Smartphone className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">{cmp.title}</h3>
                        <Badge
                          variant={cmp.status === "sent" ? "success" : "warning"}
                          className="text-xs"
                        >
                          {cmp.status === "sent" ? "تم الإرسال" : "مجدولة"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>الجمهور: <strong className="text-slate-600">{cmp.targetAudience}</strong></span>
                        {cmp.targetTag && (
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 text-[10px]">
                            #{cmp.targetTag}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-slate-600 self-end sm:self-center">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400">المستهدفين</p>
                      <p className="font-bold text-slate-900 text-sm">{cmp.recipientsCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400">تم التسليم</p>
                      <p className="font-bold text-emerald-600 text-sm">{cmp.deliveredCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400">تمت القراءة</p>
                      <p className="font-bold text-brand-600 text-sm">{cmp.readCount}</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed font-sans">
                  {cmp.messageContent}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                  <span>
                    {cmp.sentAt ? `تاريخ الإرسال: ${formatArabicDate(cmp.sentAt)}` : `موعد الإرسال: ${formatArabicDate(cmp.scheduledFor || "")}`}
                  </span>
                  <span className="text-slate-500">
                    القناة: {cmp.channel === "whatsapp" ? "واتساب للأعمال" : "رسائل نصية قصيرة SMS"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New Campaign Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="إطلاق حملة عروض ورسائل جماعية"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateCampaign} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">عنوان الحملة (داخلي)</label>
            <Input
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="مثال: عرض نهاية الأسبوع - باقة فيلر العيد"
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">قناة الإرسال</label>
              <select
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800"
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value as any })}
              >
                <option value="whatsapp">واتساب WhatsApp (الأعلى تفاعلاً)</option>
                <option value="sms">رسائل نصية SMS</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الشريحة المستهدفة</label>
              <select
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800"
                value={formData.targetTag}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetTag: e.target.value,
                    targetAudience: e.target.value === "all" ? "جميع العملاء" : `عملاء وسوم #${e.target.value}`,
                  })
                }
              >
                <option value="all">جميع عملاء العيادة ({contacts.length} عميل)</option>
                <option value="مهتم بليزر">عملاء الليزر</option>
                <option value="هيدرافاشيل">عملاء العناية بالبشرة والهيدرافاشيل</option>
                <option value="بوتوكس">عملاء حقن الفيلر والبوتوكس</option>
                <option value="VIP">كبار الشخصيات VIP</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">نص الرسالة</label>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400">إضافة متغير:</span>
                <button
                  type="button"
                  onClick={() => insertVariable("اسم_العميل")}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded text-slate-700"
                >
                  {`{اسم_العميل}`}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable("رابط_الحجز")}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded text-slate-700"
                >
                  {`{رابط_الحجز}`}
                </button>
              </div>
            </div>
            <textarea
              required
              rows={4}
              value={formData.messageContent}
              onChange={(e) => setFormData({ ...formData, messageContent: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed font-sans"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">جدولة الإرسال لاحقاً؟</span>
              <input
                type="checkbox"
                checked={formData.isScheduled}
                onChange={(e) => setFormData({ ...formData, isScheduled: e.target.checked })}
                className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
              />
            </div>
            {formData.isScheduled && (
              <div className="pt-2">
                <label className="block text-[11px] text-slate-500 mb-1">تاريخ ووقت الإرسال</label>
                <Input
                  type="datetime-local"
                  value={formData.scheduledFor}
                  onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                  className="text-xs"
                />
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="text-xs"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={creating}
              className="bg-brand-600 hover:bg-brand-700 text-white text-xs gap-1.5"
            >
              {creating ? "جاري الإطلاق..." : "تأكيد إطلاق الحملة"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
