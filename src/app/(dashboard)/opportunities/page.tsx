"use client";

import * as React from "react";
import Link from "next/link";
import {
  KanbanSquare,
  DollarSign,
  TrendingUp,
  Clock,
  User,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ArrowRightLeft,
  Plus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import { formatRelativeArabicTime } from "@/lib/date";
import { Opportunity, PipelineStage, PipelineStageId } from "@/types";

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = React.useState<Opportunity[]>([]);
  const [stages, setStages] = React.useState<PipelineStage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [movingId, setMovingId] = React.useState<string | null>(null);

  const fetchOpportunities = async () => {
    try {
      const res = await fetch("/api/opportunities");
      const data = await res.json();
      setOpportunities(data.opportunities || []);
      setStages(data.stages || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleMoveStage = async (oppId: string, newStageId: PipelineStageId) => {
    setMovingId(oppId);
    // Optimistic UI update
    setOpportunities((prev) =>
      prev.map((o) => (o.id === oppId ? { ...o, stageId: newStageId } : o))
    );

    try {
      await fetch(`/api/opportunities/${oppId}/stage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: newStageId }),
      });
    } catch (e) {
      console.error(e);
      // Revert if error
      fetchOpportunities();
    } finally {
      setMovingId(null);
    }
  };

  const totalValue = opportunities.reduce((acc, curr) => acc + (curr.monetaryValue || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">المبيعات والصفقات</h1>
          <p className="mt-1 text-xs text-slate-500">
            مسار مبيعات واستشارات العيادة المتزامن مع HighLevel Opportunities
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold">
            <span>إجمالي قيمة الفرص: </span>
            <span className="font-mono text-sm">{formatCurrency(totalValue)}</span>
          </div>
        </div>
      </div>

      {/* Kanban Board with Horizontal Scroll */}
      <div className="overflow-x-auto pb-4 pt-1">
        <div className="flex gap-4 min-w-[1200px]">
          {stages.map((stage) => {
            const stageOpps = opportunities.filter((o) => o.stageId === stage.id);
            const stageTotal = stageOpps.reduce((acc, curr) => acc + (curr.monetaryValue || 0), 0);

            return (
              <div
                key={stage.id}
                className="w-80 flex-shrink-0 flex flex-col rounded-2xl bg-slate-100/70 border border-slate-200/80 p-3.5"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{stage.name}</span>
                    <span className="h-5 w-5 rounded-full bg-white text-slate-700 text-[11px] font-bold flex items-center justify-center border border-slate-200">
                      {stageOpps.length}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 font-medium">
                    {stageTotal > 0 ? formatCurrency(stageTotal) : "0 ر.س"}
                  </span>
                </div>

                {/* Cards List */}
                <div className="flex-1 space-y-3 mt-3 overflow-y-auto max-h-[calc(100vh-18rem)] pr-0.5">
                  {stageOpps.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white/40">
                      لا توجد صفقات هنا
                    </div>
                  ) : (
                    stageOpps.map((opp) => (
                      <div
                        key={opp.id}
                        className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-soft hover:shadow-card transition-all space-y-2.5 group"
                      >
                        <div className="flex items-start justify-between">
                          <Link
                            href={`/contacts/${opp.contactId}`}
                            className="font-bold text-xs text-slate-900 group-hover:text-brand-700 transition-colors"
                          >
                            {opp.contactName}
                          </Link>
                          <span className="font-mono text-xs font-bold text-teal-800">
                            {formatCurrency(opp.monetaryValue)}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 font-medium line-clamp-1">
                          {opp.service}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                          <span>{opp.assignedStaff || "فريق العيادة"}</span>
                          <span>{formatRelativeArabicTime(opp.lastActivityDate)}</span>
                        </div>

                        {/* Interactive Move Stage Switcher */}
                        <div className="pt-1 flex items-center justify-between border-t border-slate-50">
                          <span className="text-[10px] text-slate-400">نقل المرحلة:</span>
                          <select
                            value={opp.stageId}
                            onChange={(e) =>
                              handleMoveStage(opp.id, e.target.value as PipelineStageId)
                            }
                            className="text-[11px] rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          >
                            {stages.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
