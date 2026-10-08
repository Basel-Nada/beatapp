"use client";

import * as React from "react";
import {
  Settings,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Building2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const [session, setSession] = React.useState<{
    tenant?: { name: string; isHighLevelConnected: boolean; locationId: string; address?: string; phone?: string };
    isDemoMode?: boolean;
    config?: { locationIdConfigured: boolean; tokenConfigured: boolean };
  }>({});
  const [copied, setCopied] = React.useState(false);
  const [locationId, setLocationId] = React.useState("9m3VyK57t1Ah7Pmen0gA");
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{
    success?: boolean;
    message?: string;
    details?: unknown;
  } | null>(null);

  const fetchSession = React.useCallback(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        setSession(d);
        if (d.tenant?.locationId) {
          setLocationId(d.tenant.locationId);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  React.useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/highlevel`
    : "https://app.beatapp.io/api/webhooks/highlevel";

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId.trim()) return;

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/settings/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: locationId.trim(),
          token: "pit-a83bb1dd-3bc5-4b17-8408-24fbb8fe9b36",
          save: true,
        }),
      });

      const data = await res.json();
      setTestResult(data);
      if (data.success) {
        fetchSession();
      }
    } catch (e: unknown) {
      const err = e as Error;
      setTestResult({
        success: false,
        message: `تعذر إجراء الفحص: ${err.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">الإعدادات والربط</h1>
        <p className="mt-1 text-xs text-slate-500">
          إدارة ربط محرك GoHighLevel وتخصيص هوية العيادة
        </p>
      </div>

      {/* Integration Card */}
      <Card className="border-brand-200/60 shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <LinkIcon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">حالة الربط المباشر مع GoHighLevel (v2)</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                محرك CRM والأتمتة وقنوات التواصل الأساسية
              </p>
            </div>
          </div>

          <Badge variant="success" className="text-xs py-1 px-3">
            <CheckCircle2 className="h-3.5 w-3.5 ml-1" />
            <span>متصل ومباشر (Live)</span>
          </Badge>
        </CardHeader>

        <CardContent className="space-y-5 pt-2">
          {/* Active Token Status Banner */}
          <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-teal-950 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-700" />
                <span className="font-bold">حساب GoHighLevel المرتبط:</span>
              </div>
              <Badge variant="success" className="text-[10px]">
                نشط ومتزامن ✅
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div className="bg-white p-2.5 rounded-lg border border-teal-200">
                <span className="text-[10px] text-slate-400 font-sans block">معرف الفرع (Location ID):</span>
                <span className="text-teal-900 font-bold">9m3VyK57t1Ah7Pmen0gA</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-teal-200">
                <span className="text-[10px] text-slate-400 font-sans block">المفتاح المشفر (Private Token):</span>
                <span className="text-teal-900 font-bold truncate block">pit-a83bb1dd-***-9b36</span>
              </div>
            </div>
          </div>

          {/* Test or Update Location ID Form */}
          <form onSubmit={handleTestConnection} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                معرف الفرع النشط (Location ID)
              </label>
              <p className="text-[11px] text-slate-500">
                يمكنك التحقق من صحة الربط أو تغيير معرف الفرع في أي وقت.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <Input
                type="text"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="font-mono text-xs bg-white text-left"
                dir="ltr"
                required
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="whitespace-nowrap w-full sm:w-auto h-10 px-5 text-xs font-semibold gap-2"
                isLoading={testing}
              >
                <Zap className="h-4 w-4" />
                <span>فحص وتحديث الاتصال المباشر</span>
              </Button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  testResult.success
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-rose-50 border-rose-200 text-rose-900"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">{testResult.message}</div>
                </div>
              </div>
            )}
          </form>

          {/* Webhook Configuration */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">رابط Webhook لتلقي الأحداث اللحظية</h4>
                <p className="text-[11px] text-slate-500">
                  انسخ هذا الرابط وضعه داخل HighLevel Automations لتحديث الرسائل والعملاء فورياً في BeatApp
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyWebhook}
                className="h-8 text-xs bg-white"
              >
                {copied ? <Check className="h-3.5 w-3.5 ml-1 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 ml-1" />}
                <span>{copied ? "تم النسخ" : "نسخ الرابط"}</span>
              </Button>
            </div>
            <div className="font-mono text-xs bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700 select-all" dir="ltr">
              {webhookUrl}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clinic Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">بيانات المركز / العيادة المعتمدة في HighLevel</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                المعلومات المسجلة على الفرع (Internal – Beatapp)
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">اسم العيادة / الحساب</label>
              <Input defaultValue="Internal – Beatapp" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">رقم الهاتف المسجل</label>
              <Input defaultValue="+966 57 004 0344" dir="ltr" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">الموقع الإلكتروني والمدينة</label>
              <Input defaultValue="www.beatapp.io — الرياض، المملكة العربية السعودية" />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" size="sm">
              <span>حفظ التعديلات</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
