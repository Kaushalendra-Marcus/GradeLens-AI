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
        <Link href="/exam" className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center text-white font-bold text-sm">G</Link>
        <nav className="flex flex-col gap-2 mt-4">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                  active ? "bg-zinc-900 text-white" : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                )}
                title={item.label}
              >
                <item.icon className="w-5 h-5" />
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col items-center gap-3">
          <Link href="/settings" className={cn("w-10 h-10 rounded-lg flex items-center justify-center", isActive("/settings") ? "bg-zinc-900 text-white" : "bg-zinc-900 text-white/80 hover:bg-zinc-800")}>
            <Settings className="w-5 h-5" />
          </Link>
          <div className="w-8 h-8 rounded-full bg-amber-300 flex items-center justify-center text-xs font-bold">DT</div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[260px] bg-white border-r border-zinc-200 flex-col hidden lg:flex shrink-0">
      <div className="px-5 py-6 flex items-center gap-2">
        <Link href="/exam" className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center text-white font-bold text-sm">G</Link>
        <span className="font-semibold text-[15px]">GradeLens AI</span>
        <span className="ml-auto text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded">VedaAI</span>
      </div>

      <div className="mx-4 mb-4 bg-[#1A1A1A] text-white rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
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
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-50"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-zinc-100 flex flex-col gap-3">
        <Link href="/settings" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm", isActive("/settings") ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-50")}>
          <Settings className="w-5 h-5" />
          Settings
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold">DT</div>
          <div>
            <div className="text-sm font-medium">Demo Teacher</div>
            <div className="text-xs text-zinc-500">Greenwood High</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
