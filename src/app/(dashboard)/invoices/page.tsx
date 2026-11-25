"use client";

import * as React from "react";
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  DollarSign,
  TrendingUp,
  Receipt,
  FileText,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatArabicDate } from "@/lib/date";
import { formatCurrency } from "@/lib/utils";
import { Invoice, Contact } from "@/types";

export default function InvoicesPage() {
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");

  // Create Invoice Modal State
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    contactId: "",
    contactName: "",
    contactPhone: "",
    serviceDescription: "جلسة هيدرافاشيل ونضارة بلاتينيوم",
    amount: "850",
    dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().substring(0, 10),
    notes: "فاتورة خدمات واستشارات تجميلية",
    sendDirectly: true,
  });

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, cntRes] = await Promise.all([
        fetch(`/api/invoices${filter !== "all" ? `?filter=${filter}` : ""}`).then((r) => r.json()),
        fetch("/api/contacts").then((r) => r.json()),
      ]);
      setInvoices(invRes.invoices || []);
      setContacts(cntRes.contacts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectContact = (contactId: string) => {
    const found = contacts.find((c) => c.id === contactId);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        contactId: found.id,
        contactName: found.name,
        contactPhone: found.phone,
      }));
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contactName || !formData.amount) return;

    setCreating(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: formData.contactId || `cnt-${Date.now()}`,
          contactName: formData.contactName,
          contactPhone: formData.contactPhone,
          amount: parseFloat(formData.amount),
          items: [
            {
              description: formData.serviceDescription,
              quantity: 1,
              unitPrice: parseFloat(formData.amount),
              total: parseFloat(formData.amount),
            },
          ],
          dueDate: formData.dueDate,
          notes: formData.notes,
          sendDirectly: formData.sendDirectly,
        }),
      });

      if (res.ok) {
        setIsCreateOpen(false);
        setActionSuccess("تم إنشاء الفاتورة وإرسال رابط الدفع بنجاح");
        setTimeout(() => setActionSuccess(null), 4000);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleSendPaymentLink = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "whatsapp" }),
      });
      const data = await res.json();
      setActionSuccess(data.message || "تم إرسال رابط الدفع عبر الواتساب");
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });
      if (res.ok) {
        setActionSuccess("تم تحديث حالة الفاتورة كـ 'مدفوعة'");
        setTimeout(() => setActionSuccess(null), 4000);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // KPIs
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.amount, 0);
  const totalPending = invoices.filter((i) => i.status === "pending").reduce((sum, i) => sum + i.amount, 0);
  const totalOverdue = invoices.filter((i) => i.status === "overdue").reduce((sum, i) => sum + i.amount, 0);

  const filteredInvoices = invoices.filter((inv) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.contactName.toLowerCase().includes(q) ||
      inv.contactPhone.includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Message */}
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">الفواتير والمدفوعات</h1>
            <Badge variant="brand" className="text-xs">
              بوابة فواتير BeatApp
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            إصدار فواتير جلسات التجميل، متابعة التحصيل، وإرسال روابط الدفع الإلكتروني عبر الواتساب.
          </p>
        </div>

        <Button
          onClick={() => {
            if (contacts.length > 0 && !formData.contactId) {
              handleSelectContact(contacts[0].id);
            }
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white"
        >
          <Plus className="h-4 w-4" />
          <span>إنشاء فاتورة ورابط دفع</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">إجمالي المبالغ المحصلة</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalPaid)}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">مدفوعات مؤكدة</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">مبالغ بانتظار السداد</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalPending)}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">روابط دفع نشطة</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">فواتير متأخرة</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">{formatCurrency(totalOverdue)}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">تحتاج تذكير للعميل</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">عدد الفواتير الصادرة</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{invoices.length}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">خلال هذا الشهر</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
              <Receipt className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "جميع الفواتير" },
            { id: "paid", label: "مدفوعة" },
            { id: "pending", label: "بانتظار السداد" },
            { id: "overdue", label: "متأخرة" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                filter === tab.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث برقم الفاتورة أو العميل..."
            className="pr-9 text-xs h-9 bg-slate-50 border-slate-200 rounded-xl"
          />
        </div>
      </div>

      {/* Invoices List / Table */}
      <Card className="border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">جاري تحميل الفواتير...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">لا توجد فواتير مطابقة للبحث</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="p-4">رقم الفاتورة</th>
                  <th className="p-4">العميل</th>
                  <th className="p-4">الخدمات / البنود</th>
                  <th className="p-4">المبلغ</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">تاريخ الاستحقاق</th>
                  <th className="p-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono font-medium text-slate-800">
                      {inv.invoiceNumber}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{inv.contactName}</div>
                      <div className="text-[11px] text-slate-400">{inv.contactPhone}</div>
                    </td>
                    <td className="p-4 max-w-xs truncate text-slate-600">
                      {inv.items.map((it) => it.description).join(" + ") || "خدمة تجميلية"}
                    </td>
                    <td className="p-4 font-bold text-slate-900 text-sm">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="p-4">
                      {inv.status === "paid" && (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>مدفوعة</span>
                        </Badge>
                      )}
                      {inv.status === "pending" && (
                        <Badge variant="warning" className="gap-1">
                          <Clock className="h-3 w-3" />
                          <span>بانتظار السداد</span>
                        </Badge>
                      )}
                      {inv.status === "overdue" && (
                        <Badge variant="warning" className="gap-1 bg-rose-50 text-rose-700 border-rose-200">
                          <AlertCircle className="h-3 w-3" />
                          <span>متأخرة</span>
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 text-slate-500">
                      {formatArabicDate(inv.dueDate)}
                    </td>
                    <td className="p-4 text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.status !== "paid" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendPaymentLink(inv.id)}
                            className="h-8 px-2.5 text-xs gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            title="إرسال رابط الدفع عبر الواتساب"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>إرسال واتساب</span>
                          </Button>
                        )}

                        {inv.paymentLink && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(inv.paymentLink!, inv.id)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700"
                            title="نسخ رابط الدفع"
                          >
                            {copiedId === inv.id ? (
                              <Check className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        )}

                        {inv.status !== "paid" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsPaid(inv.id)}
                            className="h-8 px-2 text-xs text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            تم الدفع نقداً
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="إنشاء فاتورة ورابط دفع إلكتروني"
        maxWidth="md"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">العميل</label>
            <select
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800"
              value={formData.contactId}
              onChange={(e) => handleSelectContact(e.target.value)}
            >
              <option value="">-- اختر عميلاً --</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">وصف الخدمة / الباقة التجميلية</label>
            <Input
              required
              value={formData.serviceDescription}
              onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
              placeholder="مثال: جلسة هيدرافاشيل بلاتينيوم + استشارة"
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">المبلغ المطلوب (ر.س)</label>
              <Input
                type="number"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="850"
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">تاريخ الاستحقاق</label>
              <Input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ملاحظات الفاتورة</label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="ملاحظات تظهر للعميل في الإشعار"
              className="text-xs"
            />
          </div>

          <div className="p-3 bg-brand-50/70 rounded-xl border border-brand-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-brand-600" />
              <span className="text-xs text-brand-900 font-medium">إرسال رابط الدفع فوري عبر الواتساب</span>
            </div>
            <input
              type="checkbox"
              checked={formData.sendDirectly}
              onChange={(e) => setFormData({ ...formData, sendDirectly: e.target.checked })}
              className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
            />
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
              {creating ? "جاري الإنشاء..." : "إصدار الفاتورة والرابط"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
