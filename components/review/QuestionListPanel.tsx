"use client";
import { useState } from "react";
import type { AssessmentResult } from "@/types/domain";
import { QuestionRow } from "./QuestionRow";
import { UnmatchedAnswersPanel } from "./UnmatchedAnswersPanel";
import { GradingSummaryBar } from "./GradingSummaryBar";

export function QuestionListPanel({
  result,
  selectedId,
  onSelect,
}: {
  result: AssessmentResult;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [expandAll, setExpandAll] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleExpandAll = () => {
    if (expandAll) setExpandedIds(new Set());
    else setExpandedIds(new Set(result.questions.map((q) => q.id)));
    setExpandAll(!expandAll);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between shrink-0">
        <div className="text-sm font-semibold">Extracted Questions (from question paper)</div>
        <button onClick={handleExpandAll} className="text-xs text-[#F1633B] font-medium hover:underline">
          {expandAll ? "Collapse All" : "Expand All"}
        </button>
      </div>

      {result.summary && <GradingSummaryBar summary={result.summary} grades={result.grades} />}

      <div className="flex-1 overflow-auto p-3 flex flex-col gap-2">
        {result.questions.map((q) => {
          const mapping = result.mappings.find((m) => m.questionId === q.id);
          const grade = result.grades.find((g) => g.questionId === q.id);
          const expanded = expandedIds.has(q.id);
          return (
            <QuestionRow
              key={q.id}
              question={q}
              mapping={mapping}
              grade={grade}
              selected={selectedId === q.id}
              expanded={expanded}
              onSelect={() => {
                handleSelect(q.id);
                if (!expanded) toggleExpand(q.id);
              }}
            />
          );
        })}

        {result.unmatched.length > 0 && <UnmatchedAnswersPanel result={result} />}
      </div>
    </div>
  );
}
