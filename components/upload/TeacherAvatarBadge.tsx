"use client";
import { cn } from "@/lib/utils";

export function TeacherAvatarBadge({ ready }: { ready: boolean }) {
  return (
    <div className="flex justify-center my-6">
      <div
        className={cn(
          "relative w-[140px] h-[140px] flex items-center justify-center transition-all duration-300",
          ready ? "scale-[1.02]" : "scale-100"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/teacher-avatar.png"
          alt="teacher"
          className={cn(
            "w-full h-full object-contain rounded-full border-4 bg-white transition-all duration-300",
            ready ? "border-[#EAB308] shadow-[0_0_0_6px_rgba(234,179,8,0.2)]" : "border-white shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
          )}
        />
      </div>
    </div>
  );
}
