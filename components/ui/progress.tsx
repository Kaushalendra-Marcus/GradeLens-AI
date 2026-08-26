import * as React from "react";
import { cn } from "@/lib/utils";

export function Progress({ value = 0, className }: { value?: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden", className)}>
      <div className="h-full bg-[#F1633B] transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
