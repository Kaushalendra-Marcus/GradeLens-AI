"use client";
import type { Question, GradeResult, Mapping } from "@/types/domain";
import { cn, scoreColorClass } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

export function QuestionRow({
  question,
  mapping,
  grade,
  selected,
  expanded,
  onSelect,
  onToggle,
}: {
  question: Question;
  mapping?: Mapping;
  grade?: GradeResult;
  selected: boolean;
  expanded: boolean;
  onSelect: () => void;
  onToggle?: () => void;
}) {
  const isAnswered = mapping?.status === "answered";
  let pillLabel = "Not Answered";
  let pillClass = "bg-zinc-100 text-zinc-600 border-zinc-200";

  if (grade && grade.verdict !== "ungraded" && isAnswered) {
    const max = grade.maxMarks ?? question.maxMarks ?? 5;
    const score = grade.score ?? 0;
    pillLabel = `${score}/${max}`;
    const pct = max ? (score / max) * 100 : null;
    pillClass = scoreColorClass(pct);
  } else if (isAnswered) {
    pillLabel = "Answered";
    pillClass = "bg-zinc-900 text-white border-zinc-900";
  } else if (!isAnswered) {
    pillLabel = "Not Answered";
    pillClass = "bg-zinc-100 text-zinc-500 border-zinc-200";
  }

  // Badge display: handle subLabel
  const badgeMain = (question.parentNumber ?? question.displayNumber.replace(/\s*\(.*\)/, "").trim()) || question.displayNumber;
  const sub = question.subLabel;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "border rounded-xl bg-white cursor-pointer transition-all",
        selected ? "border-l-4 border-l-[#F1633B] border-y-zinc-200 border-r-zinc-200" : "border-zinc-200 hover:border-zinc-300"
      )}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold shrink-0">
          {question.parentNumber ? question.parentNumber : question.displayNumber.match(/\d+/)?.[0] ?? "?"}
        </div>
        {sub && <span className="text-xs font-medium text-zinc-600 -ml-2">{sub}.</span>}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-zinc-500">Q{question.displayNumber}</div>
          <div className="text-sm font-medium truncate">{question.text.slice(0, 120)}</div>
        </div>
        <div className={cn("text-xs font-medium px-2.5 py-1 rounded-full border shrink-0", pillClass)}>{pillLabel}</div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            (onToggle ?? onSelect)();
          }}
          aria-label={expanded ? "Collapse" : "Expand"}
          className="shrink-0 text-zinc-400 hover:text-zinc-600 p-1 -m-1"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-3 pt-0">
          <div className="text-sm text-zinc-700 whitespace-pre-wrap">{question.text}</div>
          {question.maxMarks !== undefined && <div className="text-xs text-zinc-500 mt-2">Max marks: {question.maxMarks}</div>}
          {grade?.feedback && (
            <div className="mt-3 bg-zinc-50 border border-zinc-200 rounded-lg p-3">
              <div className="text-xs font-semibold text-zinc-700 mb-1">AI Feedback</div>
              <div className="text-xs text-zinc-600">{grade.feedback}</div>
            </div>
          )}
          {!isAnswered && <div className="mt-3 text-xs text-zinc-500 italic">No matching answer found on the answer sheet.</div>}
        </div>
      )}
    </div>
  );
}
