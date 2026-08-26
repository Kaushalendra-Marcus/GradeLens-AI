import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function scoreColorClass(percent: number | null): string {
  if (percent === null) return "bg-zinc-100 text-zinc-600 border-zinc-200";
  if (percent >= 80) return "bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]";
  if (percent >= 40) return "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]";
  return "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]";
}

export function highlightColorClass(
  verdict?: string
): "success" | "warning" | "danger" | "neutral" {
  if (verdict === "correct") return "success";
  if (verdict === "partial") return "warning";
  if (verdict === "incorrect") return "danger";
  return "neutral";
}
