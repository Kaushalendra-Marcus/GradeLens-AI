"use client";
import { useState, useCallback } from "react";
import { cn, formatFileSize } from "@/lib/utils";
import { FileText, X, Image as ImageIcon } from "lucide-react";

type Props = {
  label: string;
  file: File | null;
  pages?: number;
  onFile: (f: File) => void;
  onRemove: () => void;
  error?: string | null;
};

export function DoodleUpload({ label, file, pages, onFile, onRemove, error }: Props) {
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      onFile(files[0]);
    },
    [onFile]
  );

  if (file) {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    return (
      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium text-zinc-700">{label}</div>
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
          <button onClick={onRemove} className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center shrink-0" aria-label="Remove file">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium text-zinc-700 text-center">{label}</div>
      <label
        className={cn("doodle-upload-container", dragOver && "drag-active")}
        tabIndex={0}
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
      >
        <input className="hidden-file-input" type="file" accept=".pdf,.jpg,.jpeg,.png,image/*" onChange={(e) => handleFiles(e.target.files)} />

        <div className="doodle-folder">
          <div className="folder-back">
            <div className="folder-tab" />
          </div>
          <div className="doodle-papers">
            <div className="paper file-1">
              <div className="scribble-line" />
              <div className="scribble-line short" />
              <div className="scribble-line" />
            </div>
            <div className="paper file-2">
              <svg viewBox="0 0 24 24" className="doodle-image-icon">
                <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                <path d="M21 15l-5-5L5 21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="folder-front">
            <svg className="folder-smile" viewBox="0 0 24 24">
              <path d="M 7 14 Q 12 19 17 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div className="doodle-btn">
          <span className="btn-text">Choose a file</span>
        </div>

        <svg className="doodle-decor sparkle-1" viewBox="0 0 24 24">
          <path d="M12 0C12 6.6 17.4 12 24 12C17.4 12 12 17.4 12 24C12 17.4 6.6 12 0 12C6.6 12 12 6.6 12 0Z" fill="var(--btn-hover)" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <svg className="doodle-decor star-1" viewBox="0 0 24 24">
          <path d="M12 2L15 9L22 10L17 15L18.5 22L12 18.5L5.5 22L7 15L2 10L9 9L12 2Z" fill="var(--accent-blue)" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <svg className="doodle-paperclip" viewBox="0 0 24 24">
          <path d="M 12 4 L 12 18 C 12 20 9 20 9 18 L 9 6 C 9 3 15 3 15 6 L 15 16 C 15 18 13 18 13 16 L 13 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </label>
      <div className="text-center">
        <div className="text-[11px] text-zinc-500">PDF, JPG, PNG - Max 10MB</div>
        <div className="text-[11px] text-zinc-400">or drag and drop here</div>
      </div>
      {error && <div className="text-xs text-red-600 text-center">{error}</div>}
      <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
        <defs>
          <filter id="doodle-jitter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves={3} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <style>{`
        .doodle-upload-container {
          --ink-color: #1e1e24;
          --zone-bg: #fffdf9;
          --paper-line: #bde0fe;
          --folder-back: #F1633B;
          --folder-front: #FDE6DA;
          --btn-default: #1A1A1A;
          --btn-hover: #F1633B;
          --accent-blue: #118ab2;
          --paper-file: #ffffff;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 220px;
          padding: 20px;
          cursor: pointer;
          background:
            linear-gradient(var(--zone-bg) 20px, transparent 20px) 0 0 / 100% 24px,
            linear-gradient(var(--paper-line) 2px, transparent 2px) 0 20px / 100% 24px
              var(--zone-bg);
          border: 3px dashed var(--ink-color);
          border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
          box-shadow: 8px 8px 0 rgba(30, 30, 36, 0.15);
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease;
          filter: url(#doodle-jitter);
        }
        .hidden-file-input { display: none; }
        .doodle-folder {
          position: relative;
          width: 110px;
          height: 85px;
          margin-bottom: 18px;
          animation: doodleFloat 3.5s infinite ease-in-out;
          z-index: 2;
        }
        .folder-back {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 72px;
          background: var(--folder-back);
          border: 3px solid var(--ink-color);
          border-radius: 10px 255px 15px 225px / 255px 10px 225px 15px;
          box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.15);
          z-index: 1;
        }
        .folder-tab {
          position: absolute;
          top: -12px;
          left: 10px;
          width: 38px;
          height: 16px;
          background: var(--folder-back);
          border: 3px solid var(--ink-color);
          border-bottom: none;
          border-radius: 10px 15px 0 0 / 255px 255px 0 0;
        }
        .folder-front {
          position: absolute;
          bottom: -2px;
          left: -4px;
          width: calc(100% + 8px);
          height: 58px;
          background: var(--folder-front);
          border: 3px solid var(--ink-color);
          border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
          box-shadow: 4px 4px 0 rgba(30, 30, 36, 0.15);
          z-index: 3;
          transform-origin: bottom center;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s ease;
        }
        .folder-smile {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          width: 26px;
          height: 26px;
        }
        .doodle-papers {
          position: absolute;
          bottom: 10px;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 2;
        }
        .paper {
          position: absolute;
          bottom: 8px;
          width: 46px;
          height: 58px;
          background: var(--paper-file);
          border: 2px solid var(--ink-color);
          border-radius: 4px;
          transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          padding: 6px;
          box-shadow: 2px 2px 0 rgba(30, 30, 36, 0.1);
        }
        .file-1 { left: 12px; transform: rotate(-5deg) translateY(0); }
        .file-2 { right: 12px; transform: rotate(5deg) translateY(0); }
        .scribble-line { height: 3px; background: var(--ink-color); margin-bottom: 5px; border-radius: 2px; width: 100%; opacity: 0.8; }
        .scribble-line.short { width: 60%; }
        .doodle-image-icon { width: 100%; height: 100%; opacity: 0.8; }
        .doodle-btn {
          background: var(--btn-default);
          border: 3px solid var(--ink-color);
          padding: 8px 22px;
          border-radius: 15px 255px 15px 225px / 255px 15px 225px 15px;
          box-shadow: 4px 4px 0 var(--ink-color);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 3;
        }
        .btn-text {
          font-family: Inter, sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: white;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .doodle-decor {
          position: absolute;
          z-index: 5;
          pointer-events: none;
          opacity: 0;
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
        }
        .sparkle-1 { width: 20px; top: 22px; right: 28px; transform: scale(0) rotate(0deg); }
        .star-1 { width: 24px; top: 38px; left: 22px; transform: scale(0) rotate(0deg); }
        .doodle-paperclip {
          position: absolute;
          top: -12px;
          left: 16px;
          width: 32px;
          height: 32px;
          z-index: 10;
          transform: rotate(-15deg);
        }
        @keyframes doodleFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(1deg); }
        }
        @keyframes paperWiggle {
          0%, 100% { transform: rotate(-12deg) translateY(-30px); }
          50% { transform: rotate(-8deg) translateY(-34px); }
        }
        @keyframes paperWiggle2 {
          0%, 100% { transform: rotate(14deg) translateY(-28px); }
          50% { transform: rotate(18deg) translateY(-24px); }
        }
        .doodle-upload-container:hover, .doodle-upload-container.drag-active {
          transform: translateY(-3px);
          box-shadow: 10px 10px 0 var(--ink-color);
          border-radius: 15px 225px 15px 255px / 255px 15px 225px 15px;
        }
        .doodle-upload-container:hover .folder-front, .doodle-upload-container.drag-active .folder-front {
          transform: scaleY(0.85) skewX(-5deg);
        }
        .doodle-upload-container:hover .file-1, .doodle-upload-container.drag-active .file-1 { animation: paperWiggle 1.2s infinite ease-in-out; }
        .doodle-upload-container:hover .file-2, .doodle-upload-container.drag-active .file-2 { animation: paperWiggle2 1.2s infinite ease-in-out 0.2s; }
        .doodle-upload-container:hover .doodle-btn, .doodle-upload-container.drag-active .doodle-btn {
          background: var(--btn-hover);
          transform: scale(1.05) rotate(-2deg) translateY(-2px);
          box-shadow: 6px 6px 0 var(--ink-color);
        }
        .doodle-upload-container:hover .doodle-decor, .doodle-upload-container.drag-active .doodle-decor { opacity: 1; }
        .doodle-upload-container:hover .sparkle-1, .doodle-upload-container.drag-active .sparkle-1 { transform: scale(1.1) rotate(15deg); }
        .doodle-upload-container:hover .star-1, .doodle-upload-container.drag-active .star-1 { transform: scale(1.2) rotate(-18deg); }
        .doodle-upload-container:active { transform: translate(4px, 4px); box-shadow: 2px 2px 0 var(--ink-color); }
      `}</style>
    </div>
  );
}
