export type NormalizedBox = { x: number; y: number; width: number; height: number };

export type Question = {
  id: string;
  displayNumber: string;
  parentNumber?: string;
  subLabel?: string;
  text: string;
  maxMarks?: number;
  page: number;
  bbox: NormalizedBox;
  orderIndex: number;
};

export type AnswerBlock = {
  id: string;
  rawLabel: string | null;
  normalizedKey: string | null;
  transcribedText: string;
  page: number;
  bbox: NormalizedBox;
  confidence: number;
};

export type Mapping = {
  questionId: string;
  status: "answered" | "unanswered";
  answerBlockIds: string[];
};

export type UnmatchedAnswer = {
  answerBlockId: string;
  reason: "no_label_detected" | "label_not_in_question_paper" | "low_confidence";
};

export type GradeResult = {
  questionId: string;
  verdict: "correct" | "partial" | "incorrect" | "ungraded";
  score?: number;
  maxMarks?: number;
  feedback?: string;
};

export type AssessmentResult = {
  questions: Question[];
  answerBlocks: AnswerBlock[];
  mappings: Mapping[];
  unmatched: UnmatchedAnswer[];
  grades: GradeResult[];
  answerSheetPages: { page: number; imageUrl: string; width: number; height: number }[];
  summary?: { totalScore: number; totalMax: number; answeredCount: number; unansweredCount: number; overallFeedback?: string };
};

export type ApiError = { error: { stage: string; message: string; retryable: boolean } };

export type PageImage = { page: number; dataUrl: string; width: number; height: number };
export type Stage = "upload" | "processing" | "review";
