import Link from "next/link";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { LayoutDashboard, FileText, BookOpen, GraduationCap, Sparkles, ArrowRight, Clock, ShieldCheck, Zap, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <AppHeader />
        <main className="flex-1 bg-[#F4F4F5] overflow-hidden flex flex-col min-h-0">
          {/* Hero */}
          <div className="max-w-6xl mx-auto p-3 lg:p-4 flex flex-col gap-3 flex-1 min-h-0 overflow-hidden w-full">
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shrink-0">
              <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-0">
                <div className="p-5 lg:p-6 flex flex-col gap-3">
                  <div className="inline-flex items-center gap-2 bg-[#FDE6DA] text-[#F1633B] text-xs font-medium px-3 py-1 rounded-full w-fit">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Teacher&apos;s Toolkit
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold leading-tight">
                    Every answer, <span className="bg-[#FDE6DA] text-[#F1633B] px-1.5 rounded-lg">mapped</span> and highlighted
                  </h1>
                  <p className="text-xs lg:text-sm text-zinc-500 leading-relaxed max-w-xl">
                    Upload your question paper and handwritten answer sheets. GradeLens AI extracts questions, transcribes handwriting, maps each answer to its question and highlights the exact region - with optional AI grading.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <Link href="/exam" className="inline-flex items-center gap-2 rounded-full bg-[#1A1A1A] text-white px-6 py-3 text-sm font-medium hover:bg-zinc-800">
                      Start Assessment <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link href="/library" className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-6 py-3 text-sm font-medium hover:bg-zinc-50">
                      Explore Library
                    </Link>
                  </div>
                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-zinc-100">
                    <div className="flex items-center gap-2 text-xs text-zinc-600">
                      <Clock className="w-4 h-4 text-zinc-400" /> 2 min avg. per sheet
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-600">
                      <ShieldCheck className="w-4 h-4 text-zinc-400" /> No data stored
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-600">
                      <Zap className="w-4 h-4 text-zinc-400" /> Groq fast inference
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#1A1A1A] to-zinc-800 p-6 lg:p-8 flex flex-col justify-center gap-4 text-white relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#F1633B]/20 rounded-full blur-3xl" />
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="text-xs uppercase tracking-widest text-white/60 mb-2">Live demo</div>
                    <div className="bg-white text-zinc-900 rounded-xl p-4 shadow-xl">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-zinc-500">Extracted Questions</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">3/3 done</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-xs border border-zinc-200 rounded-lg p-2">
                          <span className="w-6 h-6 rounded-full bg-[#FDE6DA] flex items-center justify-center text-[#F1633B] font-bold text-xs">1</span>
                          <span className="truncate">What is the entry point in Java?</span>
                          <span className="ml-auto bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px]">5/5</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs border border-zinc-200 rounded-lg p-2">
                          <span className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-xs">2</span>
                          <span className="truncate">What is an object?</span>
                          <span className="ml-auto bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px]">0/5</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs border-l-4 border-l-[#F1633B] bg-zinc-50 rounded-lg p-2">
                          <span className="w-6 h-6 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-xs">3</span>
                          <span className="truncate">What is a class?</span>
                          <span className="ml-auto bg-[#1A1A1A] text-white px-2 py-0.5 rounded-full text-[10px]">Answered</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
              {[
                { label: "Assessments mapped", value: "1,248", icon: FileText, sub: "+12% this month" },
                { label: "Avg. grading time", value: "38s", icon: Clock, sub: "per 4-page sheet" },
                { label: "Accuracy", value: "94%", icon: ShieldCheck, sub: "label matching" },
                { label: "Teachers", value: "320+", icon: Users, sub: "Greenwood & more" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl border border-zinc-200 p-3 flex flex-col gap-1">
                  <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center">
                    <s.icon className="w-3.5 h-3.5 text-zinc-700" />
                  </div>
                  <div className="text-lg font-bold mt-0.5">{s.value}</div>
                  <div className="text-[11px] font-medium text-zinc-700">{s.label}</div>
                  <div className="text-[10px] text-zinc-500">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-3 shrink-0">
              {[
                { title: "Upload anything", desc: "PDF, JPG, PNG up to 10MB, multi-page. Client-side rasterization keeps it fast.", icon: FileText },
                { title: "AI Extraction", desc: "Groq vision qwen/qwen3.6-27b reads print and handwriting, returns tight bounding boxes.", icon: Sparkles },
                { title: "Smart Mapping", desc: "Exact + fuzzy + LLM escalation maps out-of-order, multi-page, unlabeled answers.", icon: BookOpen },
              ].map((f) => (
                <div key={f.title} className="bg-white rounded-xl border border-zinc-200 p-4 flex flex-col gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#FDE6DA] flex items-center justify-center">
                    <f.icon className="w-5 h-5 text-[#F1633B]" />
                  </div>
                  <div className="font-semibold">{f.title}</div>
                  <div className="text-sm text-zinc-500 leading-relaxed">{f.desc}</div>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="bg-white rounded-xl border border-zinc-200 p-4 shrink-0">
              <h2 className="font-semibold mb-3 text-sm">How it works</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { step: "1", title: "Upload", desc: "Question paper + answer sheet in one go. We detect pages automatically." },
                  { step: "2", title: "Extract & Map", desc: "AI reads both, maps every answer to its question, highlights regions page by page." },
                  { step: "3", title: "Review & Grade", desc: "Click any question to jump to its highlight. Optional AI grading with feedback." },
                ].map((h) => (
                  <div key={h.step} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-sm font-bold shrink-0">{h.step}</div>
                    <div>
                      <div className="font-medium text-sm">{h.title}</div>
                      <div className="text-xs text-zinc-500 mt-1 leading-relaxed">{h.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-[#1A1A1A] rounded-2xl p-4 lg:p-5 flex flex-col lg:flex-row items-center justify-between gap-3 text-white shrink-0">
              <div>
                <div className="font-semibold text-lg">Ready to map your next assessment?</div>
                <div className="text-sm text-white/60 mt-1">No setup, no database - just upload and review.</div>
              </div>
              <Link href="/exam" className="shrink-0 inline-flex items-center gap-2 rounded-full bg-white text-zinc-900 px-6 py-3 text-sm font-medium hover:bg-zinc-100">
                Go to Exams <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <LayoutDashboard className="w-4 h-4" /> GradeLens AI • AI Teacher&apos;s Toolkit
              </div>
              <div className="flex gap-4 text-xs text-zinc-500">
                <Link href="/assignments" className="hover:text-zinc-700">Assignments</Link>
                <Link href="/library" className="hover:text-zinc-700">Library</Link>
                <Link href="/settings" className="hover:text-zinc-700">Settings</Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
