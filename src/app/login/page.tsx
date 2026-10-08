"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowLeft, Lock, Mail, Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("ahmed@luminamedspa.com");
  const [password, setPassword] = React.useState("••••••••••");
  const [clinic, setClinic] = React.useState("عيادات لومينا ديرما للتجميل");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo */}
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-lg shadow-brand-700/20 mb-4">
          <Sparkles className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          تسجيل الدخول إلى بيتاب
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          نظام تشغيل العيادات والمراكز التجميلية الذكي
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-floating sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                المركز / العيادة
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={clinic}
                  onChange={(e) => setClinic(e.target.value)}
                  icon={<Building2 className="h-4 w-4" />}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                البريد الإلكتروني
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="h-4 w-4" />}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                كلمة المرور
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="h-4 w-4" />}
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span>تذكرني على هذا الجهاز</span>
              </label>
              <a href="#" className="font-semibold text-brand-700 hover:text-brand-800">
                نسيت كلمة المرور؟
              </a>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" className="w-full h-11" isLoading={isLoading}>
                <span>الدخول إلى لوحة التحكم</span>
                <ArrowLeft className="h-4 w-4 mr-2" />
              </Button>
            </div>
          </form>

          {/* MedSpa Info Callout */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-xs text-slate-500 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              نظام محمي ومتزامن مع محرك GoHighLevel بدون الحاجة للتعامل مع الإعدادات المعقدة.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
