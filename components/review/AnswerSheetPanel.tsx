"use client";
import { useEffect, useRef, useState } from "react";
import type { AnswerBlock, Question, Mapping, GradeResult } from "@/types/domain";
import { HighlightBox } from "./HighlightOverlay";
import { PageNav } from "./PageNav";
import { ZoomIn, ZoomOut } from "lucide-react";

export function AnswerSheetPanel({
  pages,
  blocks,
  mappings,
  grades,
  selectedQuestionId,
  questions,
}: {
  pages: { page: number; imageUrl: string; width: number; height: number }[];
  blocks: AnswerBlock[];
  mappings: Mapping[];
  grades: GradeResult[];
  selectedQuestionId: string | null;
  questions: Question[];
}) {
  const mapping = mappings.find((m) => m.questionId === selectedQuestionId);
  const selectedQ = questions.find((q) => q.id === selectedQuestionId);
  const grade = grades.find((g) => g.questionId === selectedQuestionId);

  const blockIds = mapping?.answerBlockIds ?? [];
  const selectedBlocks = blocks.filter((b) => blockIds.includes(b.id));

  // Determine color
  let color: "success" | "warning" | "danger" | "neutral" = "neutral";
  if (grade) {
    if (grade.verdict === "correct") color = "success";
    else if (grade.verdict === "partial") color = "warning";
    else if (grade.verdict === "incorrect") color = "danger";
  }

  // Current page: default to 1, but auto-navigate to first block's page when selection changes
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedBlocks.length > 0) {
      const firstPage = Math.min(...selectedBlocks.map((b) => b.page));
      setCurrentPage(firstPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuestionId]);

  // scroll highlight into view
  useEffect(() => {
    if (containerRef.current && selectedBlocks.length > 0) {
      const el = containerRef.current.querySelector("[data-highlight]");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuestionId, currentPage]);

  const currentPageData = pages.find((p) => p.page === currentPage) ?? pages[0];
  const blocksOnPage = selectedBlocks.filter((b) => b.page === currentPage);
  const noAnswer = mapping && mapping.status === "unanswered";

  if (!currentPageData) {
    return <div className="flex-1 bg-zinc-100 flex items-center justify-center text-sm text-zinc-500">No answer sheet pages</div>;
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="h-11 bg-[#1A1A1A] flex items-center px-3 justify-between shrink-0">
        <span className="text-white text-sm font-medium">Answer Sheet</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button onClick={() => setZoom((z) => Math.max(50, z - 10))} className="w-7 h-7 rounded bg-white/10 flex items-center justify-center hover:bg-white/20">
              <ZoomOut className="w-4 h-4 text-white" />
            </button>
            <span className="text-white text-xs w-10 text-center">{zoom}%</span>
            <button onClick={() => setZoom((z) => Math.min(200, z + 10))} className="w-7 h-7 rounded bg-white/10 flex items-center justify-center hover:bg-white/20">
              <ZoomIn className="w-4 h-4 text-white" />
            </button>
          </div>
          <PageNav page={currentPage} total={pages.length} onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))} onNext={() => setCurrentPage((p) => Math.min(pages.length, p + 1))} />
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto bg-zinc-100 p-4 flex justify-center">
        <div className="relative shrink-0" style={{ width: `${zoom}%`, maxWidth: "900px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentPageData.imageUrl} alt={`Page ${currentPage}`} className="w-full h-auto rounded shadow bg-white" />

          <div className="absolute inset-0">
            {blocksOnPage.map((b) => (
              <div key={b.id} data-highlight>
                <HighlightBox box={b.bbox} color={color} label={selectedQ?.displayNumber ?? ""} />
              </div>
            ))}
            {noAnswer && (
              <div className="absolute inset-0 flex items-start justify-center pt-8">
                <div className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-600 shadow">
                  No matching answer found on the answer sheet
                </div>
              </div>
            )}
          </div>

          {selectedBlocks.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#1A1A1A] text-white text-xs rounded-full px-3 py-1">
              {blocksOnPage.length > 0 ? `Part ${blocksOnPage.length} of ${selectedBlocks.length} • Page ${currentPage}` : ""}
              {selectedBlocks.some((b) => b.page !== currentPage) ? " • Continues on other pages" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail strip */}
      {pages.length > 1 && (
        <div className="h-16 border-t bg-white flex items-center gap-2 px-3 overflow-x-auto shrink-0">
          {pages.map((p) => (
            <button
              key={p.page}
              onClick={() => setCurrentPage(p.page)}
              className={`w-12 h-12 rounded border-2 overflow-hidden shrink-0 ${p.page === currentPage ? "border-[#F1633B]" : "border-zinc-200"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imageUrl} alt={`thumb ${p.page}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
