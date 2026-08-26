import { z } from "zod";

export const NormalizedBoxSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
});

export const QuestionSchema = z.object({
  id: z.string(),
  displayNumber: z.string(),
  parentNumber: z.string().optional(),
  subLabel: z.string().optional(),
  text: z.string(),
  maxMarks: z.number().optional(),
  page: z.number().int().min(1),
  bbox: NormalizedBoxSchema,
  orderIndex: z.number().int().min(0),
});

export const AnswerBlockSchema = z.object({
  id: z.string(),
  rawLabel: z.string().nullable(),
  normalizedKey: z.string().nullable(),
  transcribedText: z.string(),
  page: z.number().int().min(1),
  bbox: NormalizedBoxSchema,
  confidence: z.number().min(0).max(1),
});

export const MappingSchema = z.object({
  questionId: z.string(),
  status: z.enum(["answered", "unanswered"]),
  answerBlockIds: z.array(z.string()),
});

export const UnmatchedAnswerSchema = z.object({
  answerBlockId: z.string(),
  reason: z.enum(["no_label_detected", "label_not_in_question_paper", "low_confidence"]),
});

export const GradeResultSchema = z.object({
  questionId: z.string(),
  verdict: z.enum(["correct", "partial", "incorrect", "ungraded"]),
  score: z.number().optional(),
  maxMarks: z.number().optional(),
  feedback: z.string().optional(),
});

export const PageImageSchema = z.object({
  page: z.number().int().min(1),
  dataUrl: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const ExtractQuestionsRequestSchema = z.object({
  images: z.array(z.object({ page: z.number(), dataUrl: z.string() })).min(1),
});

export const ExtractAnswersRequestSchema = z.object({
  images: z.array(z.object({ page: z.number(), dataUrl: z.string() })).min(1),
});

export const MapRequestSchema = z.object({
  questions: z.array(QuestionSchema),
  answerBlocks: z.array(AnswerBlockSchema),
});

export const GradeRequestSchema = z.object({
  questions: z.array(QuestionSchema),
  answerBlocks: z.array(AnswerBlockSchema),
  mappings: z.array(MappingSchema),
});
