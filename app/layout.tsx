import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "GradeLens AI - Assessment Extraction & Mapping",
  description: "Upload question paper & answer sheets, extract, map, and highlight answers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#F4F4F5] text-[#18181B] min-h-screen">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
