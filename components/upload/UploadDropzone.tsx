"use client";
import { useCallback, useState } from "react";
import { Upload, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileCard } from "./FileCard";

const MAX_MB = 10;
const ACCEPT = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];

export function UploadDropzone({
  label,
  file,
  pages,
  onFile,
  onRemove,
  error,
}: {
  label: string;
  file: File | null;
  pages?: number;
  onFile: (f: File) => void;
  onRemove: () => void;
  error?: string | null;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const f = files[0];
      if (!ACCEPT.includes(f.type) && !f.name.toLowerCase().endsWith(".pdf")) {
        // still allow via extension fallback handled by parent validation
      }
      onFile(f);
    },
    [onFile]
  );

  if (file) {
    return <FileCard file={file} pages={pages} onRemove={onRemove} />;
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 bg-white min-h-[160px] transition-colors",
          dragOver ? "border-[#F1633B] bg-orange-50" : "border-zinc-200 hover:border-zinc-300",
          error && "border-red-300 bg-red-50"
        )}
      >
        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
          <Upload className="w-5 h-5 text-zinc-600" />
        </div>
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-zinc-500 mt-1">PDF, JPG, PNG — Max 10MB</div>
        </div>
        <label className="text-xs font-medium text-[#F1633B] cursor-pointer hover:underline">
          Browse file
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
        <div className="text-[11px] text-zinc-400">or drag & drop here</div>
      </div>
      {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
    </div>
  );
}
