"use client";
import { useState, useCallback } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { TeacherAvatarBadge } from "@/components/upload/TeacherAvatarBadge";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { ProcessingView } from "@/components/processing/ProcessingView";
import { QuestionListPanel } from "@/components/review/QuestionListPanel";
import { AnswerSheetPanel } from "@/components/review/AnswerSheetPanel";
import { MobileTabs } from "@/components/review/MobileTabs";
import { Button } from "@/components/ui/button";
import { useAssessmentStore } from "@/store/useAssessmentStore";
import { fileToPageImages } from "@/lib/pdf/rasterize";
import type { Question, AnswerBlock } from "@/types/domain";
import { normalizeLabel } from "@/lib/mapping/normalize";

const MAX_SIZE = 10 * 1024 * 1024;

export default function ExamPage() {
  const {
    stage,
    processingStep,
    progress,
    error,
    errorStage,
    gradingEnabled,
    questionFile,
    answerFile,
    result,
    selectedQuestionId,
    setStage,
    setProcessingStep,
    setError,
    setFiles,
    setPages,
    setResult,
    setSelected,
    setGradingEnabled,
  } = useAssessmentStore();

  const [qError, setQError] = useState<string | null>(null);
  const [aError, setAError] = useState<string | null>(null);
  const [questionPagesCount, setQuestionPagesCount] = useState<number | undefined>(undefined);
  const [answerPagesCount, setAnswerPagesCount] = useState<number | undefined>(undefined);
  const [isStarting, setIsStarting] = useState(false);

  const validateFile = (f: File): string | null => {
    if (f.size > MAX_SIZE) return "File exceeds 10MB limit";
    const ok = ["application/pdf", "image/jpeg", "image/png", "image/jpg"].includes(f.type) || f.name.toLowerCase().endsWith(".pdf") || f.name.toLowerCase().match(/\.(jpe?g|png)$/);
    if (!ok) return "Only PDF, JPG, PNG allowed";
    return null;
  };

  const handleQFile = (f: File) => {
    const err = validateFile(f);
    if (err) { setQError(err); return; }
    setQError(null);
    setFiles(f, answerFile);
  };
  const handleAFile = (f: File) => {
    const err = validateFile(f);
    if (err) { setAError(err); return; }
    setAError(null);
    setFiles(questionFile, f);
  };

  const bothReady = !!questionFile && !!answerFile;

  const runPipeline = useCallback(async () => {
    if (!questionFile || !answerFile) return;
    setIsStarting(true);
    setError(null, null);
    setStage("processing");
    setProcessingStep("Rasterizing files…", 5);

    try {
      // Rasterize client-side
      const [qPages, aPages] = await Promise.all([fileToPageImages(questionFile), fileToPageImages(answerFile)]);
      setQuestionPagesCount(qPages.length);
      setAnswerPagesCount(aPages.length);
      setPages(qPages, aPages);
      setProcessingStep(`Reading question paper (${qPages.length} pages)`, 15);

      // Extract questions
      const qRes = await fetch("/api/extract-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: qPages.map((p) => ({ page: p.page, dataUrl: p.dataUrl })) }),
      });
      if (!qRes.ok) {
        const j = await qRes.json().catch(() => ({}));
        throw new Error(j?.error?.message || `Question extraction failed (${qRes.status})`);
      }
      const qJson = await qRes.json();
      let questions: Question[] = (qJson.questions ?? []).map((q: any, idx: number) => ({
        id: q.id ?? `q_${idx}_${(q.displayNumber ?? "").replace(/\W+/g, "_")}`,
        displayNumber: q.displayNumber ?? `${idx + 1}`,
        parentNumber: q.parentNumber ?? undefined,
        subLabel: q.subLabel ?? undefined,
        text: q.text ?? "",
        maxMarks: typeof q.maxMarks === "number" ? q.maxMarks : undefined,
        page: q.page ?? 1,
        bbox: q.bbox ?? { x: 0.05, y: 0.1, width: 0.9, height: 0.08 },
        orderIndex: typeof q.orderIndex === "number" ? q.orderIndex : idx,
      }));
      // Ensure order by orderIndex then page
      questions = questions.sort((a, b) => a.orderIndex - b.orderIndex);
      // Inject normalized ids if duplicate
      const seen = new Set<string>();
      questions = questions.map((q, i) => {
        let id = q.id;
        let n = 1;
        while (seen.has(id)) { id = `${q.id}_${n++}`; }
        seen.add(id);
        return { ...q, id, orderIndex: i };
      });

      setProcessingStep(`Reading answer sheet (${aPages.length} pages)`, 45);

      // Extract answers
      const aRes = await fetch("/api/extract-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: aPages.map((p) => ({ page: p.page, dataUrl: p.dataUrl })) }),
      });
      if (!aRes.ok) {
        const j = await aRes.json().catch(() => ({}));
        throw new Error(j?.error?.message || `Answer extraction failed (${aRes.status})`);
      }
      const aJson = await aRes.json();
      let answerBlocks: AnswerBlock[] = (aJson.answerBlocks ?? []).map((b: any, idx: number) => ({
        id: b.id ?? `a_${idx}`,
        rawLabel: b.rawLabel ?? null,
        normalizedKey: b.rawLabel ? normalizeLabel(b.rawLabel) : b.normalizedKey ?? null,
        transcribedText: b.transcribedText ?? b.text ?? "",
        page: b.page ?? 1,
        bbox: b.bbox ?? { x: 0.05, y: 0.1, width: 0.9, height: 0.15 },
        confidence: typeof b.confidence === "number" ? b.confidence : b.rawLabel ? 0.7 : 0.3,
      }));

      setProcessingStep("Mapping answers to questions", 70);

      const mapRes = await fetch("/api/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions, answerBlocks }),
      });
      if (!mapRes.ok) {
        const j = await mapRes.json().catch(() => ({}));
        throw new Error(j?.error?.message || `Mapping failed (${mapRes.status})`);
      }
      const mapJson = await mapRes.json();

      let grades: any[] = [];
      let summary: any = undefined;

      if (gradingEnabled) {
        setProcessingStep("Grading responses", 85);
        try {
          const gradeRes = await fetch("/api/grade", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questions, answerBlocks, mappings: mapJson.mappings }),
          });
          if (gradeRes.ok) {
            const gradeJson = await gradeRes.json();
            grades = gradeJson.grades ?? [];
            summary = gradeJson.summary;
          } else {
            console.warn("Grading failed, continuing without grades");
          }
        } catch (e) {
          console.warn("Grading error", e);
        }
      }

      setProcessingStep("Finishing up", 95);

      const finalResult = {
        questions,
        answerBlocks,
        mappings: mapJson.mappings ?? [],
        unmatched: mapJson.unmatched ?? [],
        grades: grades ?? [],
        answerSheetPages: aPages.map((p) => ({ page: p.page, imageUrl: p.dataUrl, width: p.width, height: p.height })),
        summary,
      };

      // If grading disabled and no summary, compute simple summary
      if (!summary) {
        const answeredCount = finalResult.mappings.filter((m: any) => m.status === "answered").length;
        const unansweredCount = finalResult.mappings.filter((m: any) => m.status === "unanswered").length;
        finalResult.summary = {
          totalScore: 0,
          totalMax: questions.reduce((s, q) => s + (q.maxMarks ?? 5), 0),
          answeredCount,
          unansweredCount,
        };
      }

      setResult(finalResult);
      setStage("review");
      if (questions.length > 0) setSelected(questions[0].id);
      setProcessingStep("", 100);
    } catch (err: any) {
      setError(err.message ?? "Unknown error", processingStep || "pipeline");
    } finally {
      setIsStarting(false);
    }
  }, [questionFile, answerFile, gradingEnabled, processingStep, setError, setPages, setProcessingStep, setResult, setSelected, setStage]);

  const handleRetry = () => {
    setError(null, null);
    runPipeline();
  };

  const handleReset = () => {
    setFiles(null, null);
    setResult(null);
    setStage("upload");
    setError(null, null);
    setQError(null);
    setAError(null);
    setQuestionPagesCount(undefined);
    setAnswerPagesCount(undefined);
  };

  return (
    <div className={`flex ${stage === "review" ? "h-screen overflow-hidden" : "min-h-screen"}`}>
      <AppSidebar collapsed={stage !== "upload"} />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <AppHeader onBack={stage === "review" ? handleReset : undefined} />

        {stage === "upload" && (
          <main className="flex-1 flex flex-col items-center px-4 py-8 lg:py-10 overflow-auto">
            <div className="max-w-3xl w-full">
              <h1 className="text-2xl lg:text-3xl font-bold text-center">
                Upload <span className="bg-[#FDE6DA] text-[#F1633B] px-2 py-0.5 rounded-lg">Question Paper & Answer Sheets</span>
              </h1>
              <p className="text-center text-sm text-zinc-500 mt-2">Upload both files to get started</p>

              <TeacherAvatarBadge ready={bothReady} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <UploadDropzone label="Upload Question Paper" file={questionFile} pages={questionPagesCount} onFile={handleQFile} onRemove={() => setFiles(null, answerFile)} error={qError} />
                <UploadDropzone label="Upload Answer Sheet" file={answerFile} pages={answerPagesCount} onFile={handleAFile} onRemove={() => setFiles(questionFile, null)} error={aError} />
              </div>

              <div className="flex items-center justify-center gap-2 mt-6">
                <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer">
                  <input type="checkbox" checked={gradingEnabled} onChange={(e) => setGradingEnabled(e.target.checked)} className="rounded" />
                  Enable AI grading & feedback
                </label>
              </div>

              <div className="flex justify-center mt-4">
                <Button disabled={!bothReady || isStarting} onClick={runPipeline} className={bothReady ? "bg-[#1A1A1A] text-white" : "bg-zinc-200 text-zinc-500"}>
                  Start Mapping →
                </Button>
              </div>
              <p className="text-center text-xs text-zinc-500 mt-3">Once both files are uploaded, you&apos;ll be able to map answers with questions.</p>
            </div>
          </main>
        )}

        {stage === "processing" && <ProcessingView step={processingStep} progress={progress} error={error} errorStage={errorStage} onRetry={handleRetry} />}

        {stage === "review" && result && (
          <main className="flex-1 p-3 lg:p-4 bg-[#F4F4F5] overflow-hidden flex flex-col min-h-0">
            {/* Desktop split */}
            <div className="hidden lg:grid grid-cols-[420px_1fr] gap-4 flex-1 min-h-0 overflow-hidden">
              <div className="min-h-0 overflow-hidden">
                <QuestionListPanel result={result} selectedId={selectedQuestionId} onSelect={setSelected} />
              </div>
              <div className="min-h-0 overflow-hidden">
                <AnswerSheetPanel
                  pages={result.answerSheetPages}
                  blocks={result.answerBlocks}
                  mappings={result.mappings}
                  grades={result.grades}
                  selectedQuestionId={selectedQuestionId}
                  questions={result.questions}
                />
              </div>
            </div>
            {/* Mobile tabs */}
            <div className="lg:hidden flex-1 min-h-0 overflow-hidden">
              <MobileTabs result={result} selectedId={selectedQuestionId} onSelect={setSelected} />
            </div>

            <div className="hidden lg:flex justify-center mt-3 shrink-0">
              <Button variant="outline" onClick={handleReset} className="rounded-full">
                Start new mapping
              </Button>
            </div>
            <div className="lg:hidden flex justify-center mt-3 shrink-0">
              <Button variant="outline" onClick={handleReset} className="rounded-full" size="sm">
                New mapping
              </Button>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
