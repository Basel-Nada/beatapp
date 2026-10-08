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
  ExternalLink,
  Sparkles,
  Server,
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

  React.useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setSession(d))
      .catch((e) => console.error(e));
  }, []);

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/highlevel`
    : "https://app.beatapp.io/api/webhooks/highlevel";

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              <CardTitle className="text-base">حالة الربط مع GoHighLevel (v2)</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                محرك CRM والأتمتة وقنوات التواصل الأساسية
              </p>
            </div>
          </div>

          {session.isDemoMode ? (
            <Badge variant="warning" className="text-xs py-1 px-3">
              <AlertCircle className="h-3.5 w-3.5 ml-1" />
              <span>وضع تجريبي (Sandbox)</span>
            </Badge>
          ) : (
            <Badge variant="success" className="text-xs py-1 px-3">
              <CheckCircle2 className="h-3.5 w-3.5 ml-1" />
              <span>متصل ونشط</span>
            </Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {session.isDemoMode && (
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-2">
              <div className="font-semibold flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-700" />
                <span>كيفية تفعيل الربط المباشر مع موقعك في HighLevel:</span>
              </div>
              <p className="leading-relaxed text-amber-800">
                لربط حساب العيادة المباشر، قم بإضافة المتغيرات التالية داخل ملف <code className="bg-amber-100 font-mono px-1 py-0.5 rounded font-bold">.env.local</code> في مسار المشروع:
              </p>
              <pre className="bg-slate-900 text-teal-300 p-3 rounded-xl font-mono text-[11px] overflow-x-auto text-left" dir="ltr">
{`HIGHLEVEL_LOCATION_ID="your_ghl_location_id"
HIGHLEVEL_PRIVATE_TOKEN="pit-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"`}
              </pre>
              <p className="text-[11px] text-amber-700">
                سيتعرف BeatApp تلقائياً على بيانات العيادة ويبدأ بمزامنة العملاء والمحادثات والتقويم فورياً بدون أي تعديل إضافي.
              </p>
            </div>
          )}

          {/* Webhook Configuration */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">رابط Webhook لتلقي الأحداث اللحظية</h4>
                <p className="text-[11px] text-slate-500">
                  انسخ هذا الرابط وضعه داخل HighLevel Automations / Workhooks لتحديث الرسائل والعملاء فورياً
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
              <CardTitle className="text-base">بيانات المركز / العيادة</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                المعلومات المعروضة لموظفي الاستقبال وفي ترويسة النظام
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">اسم العيادة</label>
              <Input defaultValue={session.tenant?.name || "عيادات لومينا ديرما للتجميل والليزر"} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">رقم الهاتف الرئيسي</label>
              <Input defaultValue={session.tenant?.phone || "+966 11 234 5678"} dir="ltr" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">العنوان والفرع</label>
              <Input defaultValue={session.tenant?.address || "طريق الملك فهد، حي العليا، الرياض"} />
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
