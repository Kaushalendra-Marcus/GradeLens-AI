"use client";
import { AlertTriangle, RotateCcw } from "lucide-react";
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
      <div className="flex flex-col items-center gap-5 max-w-md w-full">
        {/* Circular loader - Uiverse.io by andrew-manzyk themed */}
        <div className="loader">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <defs>
              <mask id="gradelens-clipping">
                <polygon points="0,0 100,0 100,100 0,100" fill="black" />
                <polygon points="25,25 75,25 50,75" fill="white" />
                <polygon points="50,25 75,75 25,75" fill="white" />
                <polygon points="35,35 65,35 50,65" fill="white" />
                <polygon points="35,35 65,35 50,65" fill="white" />
                <polygon points="35,35 65,35 50,65" fill="white" />
                <polygon points="35,35 65,35 50,65" fill="white" />
              </mask>
            </defs>
          </svg>
          <div className="box" />
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          <div className="font-semibold text-lg">Analysing</div>
          <div className="text-sm text-zinc-500">This may take a while. We are working page by page</div>
        </div>

        {/* Word spinner - Uiverse.io by kennyotsu themed, no em dash */}
        <div className="word-card">
          <div className="word-loader">
            <p>analysing</p>
            <div className="words">
              <span className="word">pages</span>
              <span className="word">handwriting</span>
              <span className="word">mapping</span>
              <span className="word">grading</span>
              <span className="word">pages</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 w-full">
          <div className="text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-full px-4 py-1.5 shadow-sm min-h-[28px] flex items-center text-center max-w-full">
            {step || "Preparing"}
          </div>
          <div className="text-[11px] text-zinc-500 text-center">Taking more time. Please be patient. We believe in good responses. Reasoning happening.</div>
        </div>

        <div className="w-full max-w-sm space-y-2">
          <Progress value={progress} />
          <div className="flex justify-between text-[11px] text-zinc-400">
            <span>{progress}% complete</span>
            <span className="animate-pulse">Processing</span>
          </div>
        </div>

        <div className="text-[11px] text-zinc-400 text-center max-w-xs">
          Tip: Large answer sheets are processed in batches. Each batch takes about 10s plus TPM wait.
        </div>
      </div>

      <style>{`
        .loader {
          --color-one: #F1633B;
          --color-two: #1A1A1A;
          --color-three: #F1633B80;
          --color-four: #1A1A1A80;
          --color-five: #F1633B40;
          --time-animation: 2s;
          --size: 0.9;
          position: relative;
          border-radius: 50%;
          transform: scale(var(--size));
          box-shadow:
            0 0 25px 0 var(--color-three),
            0 20px 50px 0 var(--color-four);
          animation: colorize calc(var(--time-animation) * 3) ease-in-out infinite;
          width: 100px;
          height: 100px;
        }
        .loader::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          border-top: solid 1px var(--color-one);
          border-bottom: solid 1px var(--color-two);
          background: linear-gradient(180deg, var(--color-five), var(--color-four));
          box-shadow:
            inset 0 10px 10px 0 var(--color-three),
            inset 0 -10px 10px 0 var(--color-four);
        }
        .loader .box {
          width: 100px;
          height: 100px;
          background: linear-gradient(
            180deg,
            var(--color-one) 30%,
            var(--color-two) 70%
          );
          mask: url(#gradelens-clipping);
          -webkit-mask: url(#gradelens-clipping);
        }
        .loader svg {
          position: absolute;
        }
        .loader svg #gradelens-clipping {
          filter: contrast(15);
          animation: roundness calc(var(--time-animation) / 2) linear infinite;
        }
        .loader svg #gradelens-clipping polygon {
          filter: blur(7px);
        }
        .loader svg #gradelens-clipping polygon:nth-child(1) {
          transform-origin: 75% 25%;
          transform: rotate(90deg);
        }
        .loader svg #gradelens-clipping polygon:nth-child(2) {
          transform-origin: 50% 50%;
          animation: rotation var(--time-animation) linear infinite reverse;
        }
        .loader svg #gradelens-clipping polygon:nth-child(3) {
          transform-origin: 50% 60%;
          animation: rotation var(--time-animation) linear infinite;
          animation-delay: calc(var(--time-animation) / -3);
        }
        .loader svg #gradelens-clipping polygon:nth-child(4) {
          transform-origin: 40% 40%;
          animation: rotation var(--time-animation) linear infinite reverse;
        }
        .loader svg #gradelens-clipping polygon:nth-child(5) {
          transform-origin: 40% 40%;
          animation: rotation var(--time-animation) linear infinite reverse;
          animation-delay: calc(var(--time-animation) / -2);
        }
        .loader svg #gradelens-clipping polygon:nth-child(6) {
          transform-origin: 60% 40%;
          animation: rotation var(--time-animation) linear infinite;
        }
        .loader svg #gradelens-clipping polygon:nth-child(7) {
          transform-origin: 60% 40%;
          animation: rotation var(--time-animation) linear infinite;
          animation-delay: calc(var(--time-animation) / -1.5);
        }
        @keyframes rotation {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes roundness {
          0% { filter: contrast(15); }
          20% { filter: contrast(3); }
          40% { filter: contrast(3); }
          60% { filter: contrast(15); }
          100% { filter: contrast(15); }
        }
        @keyframes colorize {
          0% { filter: hue-rotate(0deg); }
          20% { filter: hue-rotate(-10deg); }
          40% { filter: hue-rotate(-20deg); }
          60% { filter: hue-rotate(-30deg); }
          80% { filter: hue-rotate(-15deg); }
          100% { filter: hue-rotate(0deg); }
        }

        /* Word spinner - kennyotsu themed */
        .word-card {
          --bg-color: #FFFFFF;
          background-color: var(--bg-color);
          padding: 0.5rem 1.2rem;
          border-radius: 1.25rem;
          border: 1px solid #E4E4E7;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .word-loader {
          color: #71717A;
          font-family: Inter, sans-serif;
          font-weight: 500;
          font-size: 18px;
          -webkit-box-sizing: content-box;
          box-sizing: content-box;
          height: 28px;
          padding: 6px 10px;
          display: flex;
          align-items: center;
          border-radius: 8px;
          gap: 6px;
        }
        .words {
          overflow: hidden;
          position: relative;
          height: 28px;
        }
        .words::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            var(--bg-color) 10%,
            transparent 30%,
            transparent 70%,
            var(--bg-color) 90%
          );
          z-index: 20;
        }
        .word {
          display: block;
          height: 100%;
          padding-left: 6px;
          color: #F1633B;
          animation: spin_4991 4s infinite;
          line-height: 28px;
          white-space: nowrap;
        }
        @keyframes spin_4991 {
          10% { transform: translateY(-102%); }
          25% { transform: translateY(-100%); }
          35% { transform: translateY(-202%); }
          50% { transform: translateY(-200%); }
          60% { transform: translateY(-302%); }
          75% { transform: translateY(-300%); }
          85% { transform: translateY(-402%); }
          100% { transform: translateY(-400%); }
        }
      `}</style>
    </div>
  );
}
