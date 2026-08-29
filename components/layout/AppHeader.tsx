"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, Bell, Sparkles, Menu, X, LayoutDashboard, GraduationCap, BookOpen, Library, FileText, Settings, Github } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNav = [
  { label: "Home", icon: LayoutDashboard, href: "/home" },
  { label: "My Classroom", icon: GraduationCap, href: "/classroom" },
  { label: "Assignments", icon: FileText, href: "/assignments" },
  { label: "Exams", icon: BookOpen, href: "/exam" },
  { label: "My Library", icon: Library, href: "/library" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export function AppHeader({ onBack }: { onBack?: () => void }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");
  return (
    <>
      <header className="h-[56px] bg-white border-b border-zinc-200 flex items-center px-4 lg:px-6 gap-3 shrink-0">
        <button onClick={() => setMobileOpen(true)} className="lg:hidden w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-800 active:scale-90 transition-all duration-200">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/exam" className="w-7 h-7 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 text-zinc-700">
            <span className="text-sm leading-none">←</span>
          </Link>
          <span>Exams / <span className="text-zinc-900 font-medium">AI Assessment Mapping</span></span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link href="https://github.com/Kaushalendra-Marcus/GradeLens-AI" target="_blank" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200 bg-white text-xs font-medium hover:bg-zinc-50">
            <Github className="w-4 h-4" /> GitHub
          </Link>
          <Link href="https://github.com/Kaushalendra-Marcus/GradeLens-AI" target="_blank" className="sm:hidden w-7 h-7 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50">
            <Github className="w-4 h-4" />
          </Link>
          <button className="w-7 h-7 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50">
            <HelpCircle className="w-4 h-4" />
          </button>
          <button className="w-7 h-7 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 relative">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </button>
          <div className="w-7 h-7 rounded-full bg-[#FDE6DA] flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-[#F1633B]" />
          </div>
          <div className="flex items-center gap-2 pl-1">
            <img src="https://ui-avatars.com/api/?name=Madhur+Rastogi&background=111827&color=fff" alt="Madhur Rastogi" className="w-7 h-7 rounded-full" />
            <span className="hidden sm:block text-sm font-medium">Madhur Rastogi</span>
            <span className="hidden sm:block text-xs text-zinc-400">▾</span>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-fadeIn">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[280px] bg-white border-r border-zinc-200 flex flex-col animate-slideIn shadow-xl">
            <div className="px-5 py-4 flex items-center gap-2 border-b border-zinc-100">
              <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center text-white font-bold text-sm">G</div>
              <span className="font-semibold text-[15px]">GradeLens AI</span>
              <button onClick={() => setMobileOpen(false)} className="ml-auto w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mx-4 mt-4 bg-[#1A1A1A] text-white rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-sm leading-tight">
                <div className="font-medium">AI Teacher&apos;s</div>
                <div className="font-medium">Toolkit</div>
              </div>
            </div>
            <nav className="px-3 mt-4 flex flex-col gap-1">
              {mobileNav.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn("group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 hover:translate-x-1 active:scale-[0.98]", active ? "bg-zinc-900 text-white shadow-md" : "text-zinc-600 hover:bg-zinc-50")}
                  >
                    <item.icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto p-4 border-t border-zinc-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold">DT</div>
              <div>
                <div className="text-sm font-medium">Demo Teacher</div>
                <div className="text-xs text-zinc-500">Greenwood High</div>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-slideIn { animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </>
  );
}
