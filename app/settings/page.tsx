import Link from "next/link";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center p-8 bg-[#F4F4F5]">
          <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 p-8 flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#FDE6DA] flex items-center justify-center">
              <Settings className="w-6 h-6 text-[#F1633B]" />
            </div>
            <h1 className="text-xl font-semibold">Settings</h1>
            <p className="text-sm text-zinc-500">Settings are coming soon. Configure your assessment workflow in Exams for now.</p>
            <Link href="/exam" className="mt-2 inline-flex items-center justify-center rounded-full bg-[#1A1A1A] text-white px-5 py-2 text-sm font-medium hover:bg-zinc-800">
              Go to Exams
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
