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
  RefreshCw,
  GitBranch,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import { formatRelativeArabicTime } from "@/lib/date";
import { Opportunity, PipelineStageId } from "@/types";

interface PipelineStageItem {
  id: string;
  name: string;
  position: number;
  color?: string;
}

interface PipelineItem {
  id: string;
  name: string;
  stages: PipelineStageItem[];
}

export default function OpportunitiesPage() {
  const [pipelines, setPipelines] = React.useState<PipelineItem[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = React.useState<string>("");
  const [stages, setStages] = React.useState<PipelineStageItem[]>([]);
  const [opportunities, setOpportunities] = React.useState<Opportunity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [movingId, setMovingId] = React.useState<string | null>(null);

  const fetchPipelineData = React.useCallback(async (pipelineId?: string, isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);

    try {
      const q = new URLSearchParams();
      if (pipelineId) q.set("pipelineId", pipelineId);

      const res = await fetch(`/api/opportunities?${q.toString()}`);
      const data = await res.json();

      setPipelines(data.pipelines || []);
      setStages(data.stages || []);
      setOpportunities(data.opportunities || []);

      if (!pipelineId && data.activePipeline?.id) {
        setSelectedPipelineId(data.activePipeline.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!isBackground) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch + Auto-refresh every 6 seconds for live updates
  React.useEffect(() => {
    fetchPipelineData(selectedPipelineId, false);
    const interval = setInterval(() => {
      fetchPipelineData(selectedPipelineId, true);
    }, 6000);
    return () => clearInterval(interval);
  }, [selectedPipelineId, fetchPipelineData]);

  const handlePipelineChange = (newPipelineId: string) => {
    setSelectedPipelineId(newPipelineId);
    fetchPipelineData(newPipelineId, false);
  };

  const handleMoveStage = async (oppId: string, newStageId: string) => {
    setMovingId(oppId);
    // Optimistic UI update
    setOpportunities((prev) =>
      prev.map((o) => (o.id === oppId ? { ...o, stageId: newStageId as Opportunity["stageId"] } : o))
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
      fetchPipelineData(selectedPipelineId, true);
    } finally {
      setMovingId(null);
    }
  };

  const totalValue = opportunities.reduce((acc, curr) => acc + (curr.monetaryValue || 0), 0);
  const activePipelineObj = pipelines.find((p) => p.id === selectedPipelineId) || pipelines[0];

  return (
    <div className="space-y-6">
      {/* Header & Pipeline Switcher Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              مسارات المبيعات والصفقات
            </h1>
            <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>مباشر لحظياً</span>
            </span>
          </div>
          <p className="text-xs text-slate-500">
            تحكم كامل في جميع خطوط المبيعات (Pipelines) المسجلة في GoHighLevel ومزامنة المراحل فورياً
          </p>
        </div>

        {/* Pipeline Selector Dropdown & Stats */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <GitBranch className="h-4 w-4 text-brand-700" />
            <span className="text-xs font-semibold text-slate-700">المسار النشط:</span>
            <select
              value={selectedPipelineId}
              onChange={(e) => handlePipelineChange(e.target.value)}
              className="bg-transparent font-bold text-xs text-slate-900 focus:outline-none cursor-pointer pr-1"
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.stages.length} مراحل)
                </option>
              ))}
            </select>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold">
            <span>إجمالي الصفقات: </span>
            <span className="font-mono text-sm font-bold">{opportunities.length}</span>
            <span className="mx-1.5">•</span>
            <span>القيمة: </span>
            <span className="font-mono text-sm font-bold">{formatCurrency(totalValue)}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPipelineData(selectedPipelineId, true)}
            className="h-9 px-3 gap-1.5 bg-white text-xs"
            disabled={refreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
            <span>تحديث</span>
          </Button>
        </div>
      </div>

      {/* Kanban Board with Horizontal Scroll */}
      <div className="overflow-x-auto pb-4 pt-1">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">
            جاري تحميل مسار المبيعات...
          </div>
        ) : stages.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            لم يتم العثور على مراحل مسجلة لهذا المسار
          </div>
        ) : (
          <div className="flex gap-4 min-w-[1200px]">
            {stages.map((stage) => {
              // Opportunities in this stage
              const stageOpps = opportunities.filter((o) => {
                const oppStage = String(o.stageId);
                return oppStage === stage.id || oppStage.toLowerCase() === stage.name.toLowerCase();
              });
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
                  <div className="flex-1 space-y-3 mt-3 overflow-y-auto max-h-[calc(100vh-19rem)] pr-0.5">
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
                            <span className="text-[10px] text-slate-400">نقل إلى:</span>
                            <select
                              value={opp.stageId}
                              onChange={(e) =>
                                handleMoveStage(opp.id, e.target.value)
                              }
                              className="text-[11px] rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 max-w-[170px] truncate"
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
        )}
      </div>
    </div>
  );
}
