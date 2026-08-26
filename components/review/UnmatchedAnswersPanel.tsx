"use client";
import { useState } from "react";
import type { AssessmentResult } from "@/types/domain";
import { ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

export function UnmatchedAnswersPanel({ result }: { result: AssessmentResult }) {
  const [open, setOpen] = useState(true);
  const blockById = new Map(result.answerBlocks.map((b) => [b.id, b] as const));

  return (
    <div className="border border-amber-200 bg-amber-50 rounded-xl overflow-hidden mt-2">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-3 py-2.5 text-left">
        <AlertCircle className="w-4 h-4 text-amber-600" />
        <span className="text-sm font-medium text-amber-900">Unmatched content ({result.unmatched.length})</span>
        <span className="ml-auto text-amber-700">{open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 flex flex-col gap-2">
          <div className="text-xs text-amber-700">These handwriting blocks could not be confidently tied to a question — not dropped, shown here for review.</div>
          {result.unmatched.map((u) => {
            const b = blockById.get(u.answerBlockId);
            if (!b) return null;
            return (
              <div key={u.answerBlockId} className="bg-white border border-amber-200 rounded-lg p-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">Page {b.page}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">{u.reason}</span>
                </div>
                <div className="text-xs text-zinc-600 mt-1 line-clamp-3">{b.transcribedText || "(no transcription)"}</div>
                {b.rawLabel && <div className="text-[11px] text-zinc-500 mt-1">Label detected: &quot;{b.rawLabel}&quot;</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
