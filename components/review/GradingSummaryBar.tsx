"use client";
import type { GradeResult } from "@/types/domain";

export function GradingSummaryBar({
  summary,
  grades,
}: {
  summary: { totalScore: number; totalMax: number; answeredCount: number; unansweredCount: number; overallFeedback?: string };
  grades: GradeResult[];
}) {
  const pct = summary.totalMax ? Math.round((summary.totalScore / summary.totalMax) * 100) : 0;
  let badgeClass = "bg-zinc-100 text-zinc-600";
  if (pct >= 80) badgeClass = "bg-[#DCFCE7] text-[#16A34A]";
  else if (pct >= 40) badgeClass = "bg-[#FEF3C7] text-[#D97706]";
  else badgeClass = "bg-[#FEE2E2] text-[#DC2626]";

  return (
    <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex flex-col gap-2">
      <div className="flex items-center gap-3 flex-wrap">
        <div className={`text-sm font-bold px-3 py-1 rounded-full ${badgeClass}`}>
          {summary.totalScore}/{summary.totalMax} ({pct}%)
        </div>
        <div className="text-xs text-zinc-600">
          Answered: <span className="font-medium text-zinc-900">{summary.answeredCount}</span> • Unanswered:{" "}
          <span className="font-medium text-zinc-900">{summary.unansweredCount}</span> • Needs review: {summary.unansweredCount}
        </div>
      </div>
      {summary.overallFeedback && <div className="text-xs text-zinc-600 italic">{summary.overallFeedback}</div>}
    </div>
  );
}
