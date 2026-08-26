"use client";
import { ChevronLeft, HelpCircle, Bell, Sparkles, Menu } from "lucide-react";

export function AppHeader({ onBack }: { onBack?: () => void }) {
  return (
    <header className="h-[56px] bg-white border-b border-zinc-200 flex items-center px-4 lg:px-6 gap-3 shrink-0">
      <button onClick={onBack} className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <div className="text-sm text-zinc-500 hidden sm:block">Exams / <span className="text-zinc-900 font-medium">AI Assessment Mapping</span></div>
      <div className="ml-auto flex items-center gap-2">
        <button className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50">
          <HelpCircle className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 relative">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
        </button>
        <div className="w-8 h-8 rounded-full bg-[#FDE6DA] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[#F1633B]" />
        </div>
        <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold">DT</div>
      </div>
    </header>
  );
}
