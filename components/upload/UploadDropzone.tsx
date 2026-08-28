"use client";
import { useCallback, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";

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
      onFile(files[0]);
    },
    [onFile]
  );

  // Split label: "Upload Question Paper" -> "Upload" + orange "Question Paper"
  const labelParts = label.replace("Upload ", "");
  return (
    <div className="flex flex-col">
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
        onClick={() => document.getElementById(`file-${label}`)?.click()}
        className={cn(
          "border border-dashed rounded-xl bg-white p-5 flex flex-col items-center justify-center text-center transition-colors min-h-[150px] cursor-pointer",
          dragOver ? "border-[#F1633B] bg-orange-50" : "border-zinc-300 hover:border-zinc-400",
          error && "border-red-300 bg-red-50"
        )}
      >
        {!file ? (
          <>
            <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center mb-2.5">
              <Upload className="w-4 h-4 text-zinc-600" />
            </div>
            <div className="text-sm font-medium">
              Upload <span className="text-[#F1633B]">{labelParts}</span>
            </div>
            <div className="text-xs text-zinc-500 mt-1">Max 10MB</div>
          </>
        ) : (
          <div className="w-full flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-3 text-left">
            <div className="w-8 h-8 rounded bg-[#FF4D4F] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium truncate text-zinc-900">{file.name}</div>
              <div className="text-[11px] text-zinc-500">
                {formatFileSize(file.size)} - {pages ?? "?"} Pages
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center hover:bg-black shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      <input id={`file-${label}`} type="file" accept=".pdf,.jpg,.jpeg,.png,image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      {error && <div className="text-xs text-red-600 mt-2 text-center">{error}</div>}
    </div>
  );
}
