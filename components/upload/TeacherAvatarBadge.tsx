"use client";
import { cn } from "@/lib/utils";
import { GraduationCap } from "lucide-react";

export function TeacherAvatarBadge({ ready }: { ready: boolean }) {
  return (
    <div className="flex justify-center my-6">
      <div
        className={cn(
          "w-[88px] h-[88px] rounded-full flex items-center justify-center bg-white border-4 transition-all duration-300",
          ready ? "border-[#EAB308] shadow-[0_0_0_6px_rgba(234,179,8,0.2)]" : "border-zinc-100 shadow-[0_0_20px_rgba(0,0,0,0.06)]"
        )}
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-zinc-100 flex items-center justify-center">
          <GraduationCap className="w-8 h-8 text-zinc-700" />
        </div>
      </div>
    </div>
  );
}
