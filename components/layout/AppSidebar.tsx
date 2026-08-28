"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, GraduationCap, BookOpen, Library, Settings, FileText, Sparkles } from "lucide-react";

const nav = [
  { label: "Home", icon: LayoutDashboard, href: "/home" },
  { label: "My Classroom", icon: GraduationCap, href: "/classroom" },
  { label: "Assignments", icon: FileText, href: "/assignments" },
  { label: "Exams", icon: BookOpen, href: "/exam" },
  { label: "My Library", icon: Library, href: "/library" },
];

export function AppSidebar({ collapsed }: { collapsed?: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  if (collapsed) {
    return (
      <aside className="hidden lg:flex w-[64px] bg-white border-r border-zinc-200 flex-col items-center py-4 gap-4 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center text-white font-bold text-sm">V</div>
        <nav className="flex flex-col gap-2 mt-4">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "group w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ease-out hover:scale-105 active:scale-90",
                  active ? "bg-zinc-100 text-zinc-900 shadow-sm scale-[1.02]" : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 hover:translate-y-[-1px]"
                )}
                title={item.label}
              >
                <item.icon className="w-5 h-5 transition-transform duration-200 group-hover:rotate-3 group-active:scale-90" />
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col items-center gap-3">
          <Link href="/settings" className={cn("w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-90", isActive("/settings") ? "bg-zinc-100 text-zinc-900 shadow-sm" : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700")}>
            <Settings className="w-5 h-5 transition-transform duration-200" />
          </Link>
          <img src="https://ui-avatars.com/api/?name=Madhur+Rastogi&background=FDE6DA&color=F1633B" alt="Madhur" className="w-8 h-8 rounded-full border border-zinc-200" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[260px] bg-white border-r border-zinc-200 flex-col hidden lg:flex shrink-0">
      <div className="px-5 py-5 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center text-white font-bold text-sm">V</div>
        <span className="font-semibold text-[15px]">VedaAI</span>
        <span className="ml-auto w-6 h-6 rounded border border-zinc-200 flex items-center justify-center text-zinc-400 text-xs">□</span>
      </div>

      <div className="mx-3 mb-4 bg-[#1A1A1A] text-white rounded-xl px-3 py-3 flex items-center gap-3 border border-[#2A2A2A]">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="text-sm leading-tight">
          <div className="font-medium text-white">AI Teacher&apos;s</div>
          <div className="font-medium text-white">Toolkit</div>
        </div>
      </div>

      <nav className="px-3 flex flex-col gap-1">
        {nav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ease-out hover:translate-x-1 active:scale-[0.98]",
                active ? "bg-zinc-100 text-zinc-900 font-medium" : "text-zinc-600 hover:bg-zinc-50 hover:shadow-sm"
              )}
            >
              <item.icon className="w-[18px] h-[18px] transition-transform duration-200 group-hover:scale-110 group-active:scale-90" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-3 border-t border-zinc-100 flex flex-col gap-2">
        <Link href="/settings" className={cn("group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:translate-x-1 active:scale-[0.98]", isActive("/settings") ? "bg-zinc-100 text-zinc-900 font-medium" : "text-zinc-600 hover:bg-zinc-50")}>
          <Settings className="w-[18px] h-[18px] transition-transform duration-200 group-hover:rotate-12 group-active:scale-90" />
          Settings
        </Link>
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center overflow-hidden">
            <img src="https://ui-avatars.com/api/?name=Delhi+Public+School&background=E4E4E7&color=18181B" alt="school" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-zinc-900 leading-tight">Delhi Public School</div>
            <div className="text-[11px] text-zinc-500 leading-tight">Bokaro Steel City</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
