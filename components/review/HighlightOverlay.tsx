"use client";
import type { NormalizedBox } from "@/types/domain";
import { cn } from "@/lib/utils";

const colorMap: Record<string, string> = {
  success: "border-[#16A34A] bg-[#16A34A]/10",
  warning: "border-[#D97706] bg-[#D97706]/10",
  danger: "border-[#DC2626] bg-[#DC2626]/10",
  neutral: "border-zinc-400 bg-zinc-400/10",
};

const tagMap: Record<string, string> = {
  success: "bg-[#16A34A] text-white",
  warning: "bg-[#D97706] text-white",
  danger: "bg-[#DC2626] text-white",
  neutral: "bg-zinc-700 text-white",
};

export function HighlightBox({
  box,
  color,
  label,
}: {
  box: NormalizedBox;
  color: "success" | "warning" | "danger" | "neutral";
  label: string;
}) {
  return (
    <div
      className={cn("absolute rounded-md border-2 pointer-events-none", colorMap[color])}
      style={{
        left: `${box.x * 100}%`,
        top: `${box.y * 100}%`,
        width: `${box.width * 100}%`,
        height: `${box.height * 100}%`,
      }}
    >
      <span className={cn("absolute -top-5 left-0 text-[11px] font-medium rounded px-1.5 py-0.5", tagMap[color])}>{label}</span>
    </div>
  );
}
