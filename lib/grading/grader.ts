import { groqChatCompletion, configuredModel } from "@/lib/groq/client";
import { GRADING_SYSTEM } from "@/lib/extraction/prompts";
import type { Question, AnswerBlock, Mapping, GradeResult } from "@/types/domain";

type BatchItem = { q: Question; transcript: string; maxMarks: number };

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function gradeBatch(
  questions: Question[],
  answerBlocks: AnswerBlock[],
  mappings: Mapping[]
): Promise<{ grades: GradeResult[]; summary: { totalScore: number; totalMax: number; answeredCount: number; unansweredCount: number; overallFeedback?: string } }> {
  const blockById = new Map(answerBlocks.map((b) => [b.id, b] as const));
  const items: BatchItem[] = [];

  for (const m of mappings) {
    const q = questions.find((qq) => qq.id === m.questionId);
    if (!q) continue;
    // skip unanswered
    if (m.status === "unanswered" || m.answerBlockIds.length === 0) continue;
    const transcript = m.answerBlockIds.map((id) => blockById.get(id)?.transcribedText ?? "").join("\n---\n");
    const maxMarks = q.maxMarks ?? 5;
    items.push({ q, transcript, maxMarks });
  }

  // if no items, return empty
  if (items.length === 0) {
    const grades: GradeResult[] = mappings.map((m) => {
      const q = questions.find((qq) => qq.id === m.questionId);
      return { questionId: m.questionId, verdict: "ungraded" as const, maxMarks: q?.maxMarks };
    });
    return { grades, summary: { totalScore: 0, totalMax: questions.reduce((s, q) => s + (q.maxMarks ?? 5), 0), answeredCount: 0, unansweredCount: mappings.length } };
  }

  const batches = chunk(items, 3);
  const allGrades: GradeResult[] = [];
  let overallFeedback: string | undefined;

  for (const batch of batches) {
    const userText = batch
      .map(
        (it) =>
          `Question ${it.q.displayNumber} (id=${it.q.id}, maxMarks=${it.maxMarks ?? 5}): ${it.q.text}\nStudent Answer: ${it.transcript || "(no answer)"}`
      )
      .join("\n\n---\n\n");

    const userContent: any[] = [{ type: "text", text: userText }];

    const content = await groqChatCompletion({
      model: configuredModel(),
      systemPrompt: GRADING_SYSTEM,
      userContent,
    });

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (m) {
        try { parsed = JSON.parse(m[0]); } catch { parsed = null; }
      }
    }

    if (parsed?.grades && Array.isArray(parsed.grades)) {
      for (const g of parsed.grades) {
        allGrades.push({
          questionId: g.questionId,
          verdict: ["correct", "partial", "incorrect"].includes(g.verdict) ? g.verdict : "partial",
          score: typeof g.score === "number" ? g.score : undefined,
          maxMarks: typeof g.maxMarks === "number" ? g.maxMarks : batch.find((b) => b.q.id === g.questionId)?.maxMarks ?? 5,
          feedback: g.feedback,
        });
      }
      if (parsed.overallFeedback && !overallFeedback) overallFeedback = parsed.overallFeedback;
    } else {
      // fallback: mark as partial
      for (const it of batch) {
        allGrades.push({
          questionId: it.q.id,
          verdict: "partial",
          score: Math.round(it.maxMarks / 2),
          maxMarks: it.maxMarks,
          feedback: "Auto-graded: unable to parse detailed feedback.",
        });
      }
    }
  }

  // Fill ungraded for unanswered
  const gradedIds = new Set(allGrades.map((g) => g.questionId));
  for (const m of mappings) {
    if (!gradedIds.has(m.questionId)) {
      const q = questions.find((qq) => qq.id === m.questionId);
      allGrades.push({ questionId: m.questionId, verdict: "ungraded", maxMarks: q?.maxMarks });
    }
  }

  const totalScore = allGrades.reduce((s, g) => s + (g.score ?? 0), 0);
  const totalMax = allGrades.reduce((s, g) => s + (g.maxMarks ?? 5), 0);
  const answeredCount = mappings.filter((m) => m.status === "answered").length;
  const unansweredCount = mappings.filter((m) => m.status === "unanswered").length;

  return { grades: allGrades, summary: { totalScore, totalMax, answeredCount, unansweredCount, overallFeedback } };
}
