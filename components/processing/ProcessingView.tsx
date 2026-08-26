"use client";
import { Sparkles, AlertTriangle, RotateCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export function ProcessingView({
  step,
  progress,
  error,
  errorStage,
  onRetry,
}: {
  step: string;
  progress: number;
  error?: string | null;
  errorStage?: string | null;
  onRetry?: () => void;
}) {
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 p-8 flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="font-semibold">Something went wrong</div>
          <div className="text-sm text-zinc-500">{errorStage ? `Failed at: ${errorStage}` : ""}</div>
          <div className="text-sm text-zinc-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 w-full">{error}</div>
          {onRetry && (
            <Button onClick={onRetry} className="gap-2">
              <RotateCcw className="w-4 h-4" /> Try again
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4 max-w-md w-full">
        <div className="w-14 h-14 rounded-2xl bg-[#FDE6DA] flex items-center justify-center animate-pulse">
          <Sparkles className="w-7 h-7 text-[#F1633B]" />
        </div>
        <div className="font-semibold text-lg">Extracting…</div>
        <div className="text-sm text-zinc-500">This may take a while</div>
        <div className="text-xs text-zinc-600 bg-white border rounded-full px-3 py-1">{step || "Preparing…"}</div>
        <div className="w-full max-w-sm">
          <Progress value={progress} />
        </div>
        <div className="text-[11px] text-zinc-400">{progress}% complete</div>
      </div>
    </div>
  );
}
