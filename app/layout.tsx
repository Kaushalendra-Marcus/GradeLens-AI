import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GradeLens AI - Assessment Extraction & Mapping",
  description: "Upload question paper & answer sheets, extract, map, and highlight answers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#F4F4F5] text-[#18181B] min-h-screen">
        {children}
      </body>
    </html>
  );
}
