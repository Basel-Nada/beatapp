"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, ChevronLeft, Settings } from "lucide-react";

interface IntegrationBannerProps {
  isDemoMode: boolean;
  locationId?: string;
}

export function IntegrationBanner({ isDemoMode, locationId }: IntegrationBannerProps) {
  if (!isDemoMode) {
    return null;
  }

  return (
    <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-2 text-xs text-amber-900 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
        <div>
          <span className="font-semibold">وضع التجربة النشط (Demo Sandbox): </span>
          <span>
            يتم تشغيل BeatApp حالياً بالبيانات التجريبية المعزولة للعيادة. لربط الحساب الفعلي مع GoHighLevel مباشرة،
            أدخل مفاتيح الربط في ملف <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px] font-mono">.env.local</code> أو صفحة الإعدادات.
          </span>
        </div>
      </div>

      <Link
        href="/settings"
        className="inline-flex items-center gap-1 font-semibold text-amber-950 hover:underline shrink-0 mr-4"
      >
        <span>إعدادات الربط</span>
        <ChevronLeft className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
