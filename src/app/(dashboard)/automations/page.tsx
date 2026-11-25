"use client";

import * as React from "react";
import {
  Workflow as WorkflowIcon,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  Activity,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatArabicDate } from "@/lib/date";
import { Workflow, Contact } from "@/types";

export default function AutomationsPage() {
  const [workflows, setWorkflows] = React.useState<Workflow[]>([]);
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);

  // Trigger Modal State
  const [isTriggerModalOpen, setIsTriggerModalOpen] = React.useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = React.useState<Workflow | null>(null);
  const [selectedContactId, setSelectedContactId] = React.useState<string>("");
  const [triggering, setTriggering] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [wfRes, cntRes] = await Promise.all([
        fetch("/api/workflows").then((r) => r.json()),
        fetch("/api/contacts").then((r) => r.json()),
      ]);
      setWorkflows(wfRes.workflows || []);
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

  const handleToggleWorkflow = async (workflowId: string) => {
    try {
      const res = await fetch(`/api/workflows/${workflowId}/toggle`, {
        method: "PATCH",
      });
      if (res.ok) {
        setWorkflows((prev) =>
          prev.map((w) => (w.id === workflowId ? { ...w, isActive: !w.isActive } : w))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerForContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkflow || !selectedContactId) return;

    setTriggering(true);
    try {
      const res = await fetch(`/api/workflows/${selectedWorkflow.id}/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: selectedContactId }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsTriggerModalOpen(false);
        setActionSuccess(data.message || "تم تشغيل مسار العمل بنجاح");
        setTimeout(() => setActionSuccess(null), 4000);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTriggering(false);
    }
  };

  const activeCount = workflows.filter((w) => w.isActive).length;
  const totalEnrolled = workflows.reduce((sum, w) => sum + w.totalEnrolled, 0);
  const totalCompleted = workflows.reduce((sum, w) => sum + w.totalCompleted, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Action Notification */}
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">سير العمل والأتمتة</h1>
            <Badge variant="brand" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
              محرك أتمتة BeatApp السحابي
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            إدارة مسارات المتابعة الذكية، تذكيرات إعادة حقن البوتوكس، ورعاية عملاء عيادات التجميل.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">مسارات العمل النشطة</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {activeCount} <span className="text-xs font-normal text-slate-400">من {workflows.length}</span>
              </h3>
              <p className="text-[11px] text-emerald-600 mt-0.5">جاهزة للاستجابة اللحظية</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <WorkflowIcon className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">العملاء المشتركون بالأتمتة</p>
              <h3 className="text-2xl font-bold text-brand-600 mt-1">{totalEnrolled}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">عميل خضع للمتابعة التلقائية</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">إجراءات مكتملة بنجاح</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{totalCompleted}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">معدل الإنجاز 92%</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">جاري تحميل مسارات الأتمتة...</div>
        ) : (
          workflows.map((wf) => (
            <Card
              key={wf.id}
              className={`border transition-all ${
                wf.isActive
                  ? "border-slate-200/90 shadow-sm hover:border-brand-300"
                  : "border-slate-200/50 bg-slate-50/50 opacity-80"
              }`}
            >
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center text-white ${
                          wf.isActive ? "bg-brand-600 shadow-sm" : "bg-slate-400"
                        }`}
                      >
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{wf.name}</h3>
                        <p className="text-xs text-slate-500">{wf.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700">المشغّل:</span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md text-slate-800">
                          {wf.triggerEvent}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700">الإجراء:</span>
                        <span className="text-slate-700">{wf.actionSummary}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 text-[11px] mr-auto">
                        <span>المشتركين: <strong className="text-slate-700">{wf.totalEnrolled}</strong></span>
                        <span>المكتمل: <strong className="text-emerald-600">{wf.totalCompleted}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedWorkflow(wf);
                        if (contacts.length > 0 && !selectedContactId) {
                          setSelectedContactId(contacts[0].id);
                        }
                        setIsTriggerModalOpen(true);
                      }}
                      className="text-xs gap-1.5 border-brand-200 text-brand-700 hover:bg-brand-50"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>تشغيل لعميل الآن</span>
                    </Button>

                    <button
                      onClick={() => handleToggleWorkflow(wf.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        wf.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-300"
                      }`}
                      title={wf.isActive ? "تعطيل الأتمتة" : "تفعيل الأتمتة"}
                    >
                      {wf.isActive ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>نشط</span>
                        </>
                      ) : (
                        <>
                          <span className="h-2 w-2 rounded-full bg-slate-400" />
                          <span>معطل</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Enroll Contact Modal */}
      <Modal
        isOpen={isTriggerModalOpen}
        onClose={() => setIsTriggerModalOpen(false)}
        title={`تشغيل مسار الأتمتة: ${selectedWorkflow?.name || ""}`}
        maxWidth="md"
      >
        <form onSubmit={handleTriggerForContact} className="space-y-4 text-right">
          <p className="text-xs text-slate-600">
            سيتم إدخال العميل المختار مباشرة في هذا المسار التلقائي وإرسال الرسائل والمتابعات المبرمجة له.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">اختر العميل</label>
            <select
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800"
              value={selectedContactId}
              onChange={(e) => setSelectedContactId(e.target.value)}
            >
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) - {c.serviceInterest || "استشارة"}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <p><strong>الحدث المشغل:</strong> {selectedWorkflow?.triggerEvent}</p>
            <p><strong>الإجراء التالي:</strong> {selectedWorkflow?.actionSummary}</p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTriggerModalOpen(false)}
              className="text-xs"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={triggering}
              className="bg-brand-600 hover:bg-brand-700 text-white text-xs gap-1.5"
            >
              {triggering ? "جاري التشغيل..." : "تأكيد وتشغيل الأتمتة"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
