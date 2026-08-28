"use client";
import { cn } from "@/lib/utils";

export function TeacherAvatarBadge({ ready }: { ready: boolean }) {
  return (
    <div className="flex justify-center my-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-[#FDE6DA] scale-[1.4] opacity-60" />
        <div className="absolute inset-0 rounded-full bg-[#FDE6DA] scale-[1.2] opacity-40" />
        <div
          className={cn(
            "relative w-[88px] h-[88px] rounded-full flex items-center justify-center bg-white border-4 overflow-hidden transition-all duration-300",
            ready ? "border-[#EAB308] shadow-[0_0_0_6px_rgba(234,179,8,0.2)]" : "border-white shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
          )}
        >
          <img
            src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80"
            alt="teacher"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#F1633B] border-2 border-white" />
        <div className="absolute top-2 -left-1 w-2 h-2 rounded-full bg-[#F1633B] opacity-60" />
        <div className="absolute bottom-1 -right-2 w-2 h-2 rounded-full bg-[#F1633B] opacity-40" />
        <div className="absolute -bottom-1 left-2 w-1.5 h-1.5 rounded-full bg-[#F1633B] opacity-50" />
      </div>
    </div>
  );
}
