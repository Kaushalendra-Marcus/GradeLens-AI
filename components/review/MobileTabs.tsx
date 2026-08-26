"use client";
import { useState } from "react";
import type { AssessmentResult } from "@/types/domain";
import { QuestionListPanel } from "./QuestionListPanel";
import { AnswerSheetPanel } from "./AnswerSheetPanel";

export function MobileTabs({
  result,
  selectedId,
  onSelect,
}: {
  result: AssessmentResult;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [tab, setTab] = useState<"questions" | "answer">("questions");

  return (
    <div className="flex flex-col h-full lg:hidden">
      <div className="flex bg-white rounded-full p-1 border border-zinc-200 w-fit mx-auto mb-3">
        <button
          onClick={() => setTab("questions")}
          className={`px-6 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === "questions" ? "bg-[#1A1A1A] text-white" : "text-zinc-600"}`}
        >
          Questions
        </button>
        <button
          onClick={() => setTab("answer")}
          className={`px-6 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === "answer" ? "bg-[#1A1A1A] text-white" : "text-zinc-600"}`}
        >
          Answer Sheet
        </button>
      </div>
      <div className="flex-1 min-h-0">
        {tab === "questions" ? (
          <QuestionListPanel result={result} selectedId={selectedId} onSelect={(id) => { onSelect(id); }} />
        ) : (
          <AnswerSheetPanel
            pages={result.answerSheetPages}
            blocks={result.answerBlocks}
            mappings={result.mappings}
            grades={result.grades}
            selectedQuestionId={selectedId}
            questions={result.questions}
          />
        )}
      </div>
    </div>
  );
}
