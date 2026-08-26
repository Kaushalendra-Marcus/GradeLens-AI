"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PageNav({
  page,
  total,
  onPrev,
  onNext,
}: {
  page: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={onPrev}
        disabled={page <= 1}
        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-4 h-4 text-white" />
      </button>
      <span className="text-white text-xs">
        Page {page} of {total}
      </span>
      <button
        onClick={onNext}
        disabled={page >= total}
        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}
