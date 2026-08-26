import { create } from "zustand";
import type { AssessmentResult, PageImage, Stage } from "@/types/domain";

type Store = {
  stage: Stage;
  processingStep: string;
  progress: number;
  error: string | null;
  errorStage: string | null;
  gradingEnabled: boolean;
  questionFile: File | null;
  answerFile: File | null;
  questionPages: PageImage[];
  answerPages: PageImage[];
  result: AssessmentResult | null;
  selectedQuestionId: string | null;
  setStage: (s: Stage) => void;
  setProcessingStep: (s: string, prog?: number) => void;
  setError: (msg: string | null, stage?: string | null) => void;
  setFiles: (q: File | null, a: File | null) => void;
  setPages: (qp: PageImage[], ap: PageImage[]) => void;
  setResult: (r: AssessmentResult | null) => void;
  setSelected: (id: string | null) => void;
  setGradingEnabled: (v: boolean) => void;
  reset: () => void;
};

export const useAssessmentStore = create<Store>((set) => ({
  stage: "upload",
  processingStep: "",
  progress: 0,
  error: null,
  errorStage: null,
  gradingEnabled: true,
  questionFile: null,
  answerFile: null,
  questionPages: [],
  answerPages: [],
  result: null,
  selectedQuestionId: null,
  setStage: (stage) => set({ stage }),
  setProcessingStep: (processingStep, progress) => set((s) => ({ processingStep, progress: progress ?? s.progress })),
  setError: (error, errorStage) => set({ error, errorStage: errorStage ?? null }),
  setFiles: (questionFile, answerFile) => set({ questionFile, answerFile }),
  setPages: (questionPages, answerPages) => set({ questionPages, answerPages }),
  setResult: (result) => set({ result }),
  setSelected: (selectedQuestionId) => set({ selectedQuestionId }),
  setGradingEnabled: (gradingEnabled) => set({ gradingEnabled }),
  reset: () => set({ stage: "upload", processingStep: "", progress: 0, error: null, errorStage: null, result: null, selectedQuestionId: null, questionPages: [], answerPages: [] }),
}));
