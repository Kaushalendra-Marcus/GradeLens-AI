"use client";
import { FileText, X, Image as ImageIcon } from "lucide-react";
import { formatFileSize } from "@/lib/utils";

export function FileCard({
  file,
  pages,
  onRemove,
}: {
  file: File;
  pages?: number;
  onRemove: () => void;
}) {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  return (
    <div className="flex items-center gap-3 p-3 pr-2 bg-white border border-zinc-200 rounded-xl">
      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
        {isPdf ? <FileText className="w-5 h-5 text-red-600" /> : <ImageIcon className="w-5 h-5 text-blue-600" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{file.name}</div>
        <div className="text-xs text-zinc-500">
          {formatFileSize(file.size)} {pages ? `• ${pages} ${pages === 1 ? "Page" : "Pages"}` : ""}
        </div>
      </div>
      <button
        onClick={onRemove}
        className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center shrink-0"
        aria-label="Remove file"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
