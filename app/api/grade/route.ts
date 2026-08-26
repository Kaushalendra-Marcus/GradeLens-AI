import { NextRequest, NextResponse } from "next/server";
import { GradeRequestSchema } from "@/lib/schemas";
import { gradeBatch } from "@/lib/grading/grader";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = GradeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { stage: "grade", message: parsed.error.message, retryable: false } }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      const grades = parsed.data.mappings.map((m, idx) => {
        const q = parsed.data.questions.find((qq) => qq.id === m.questionId);
        const max = q?.maxMarks ?? 5;
        if (m.status === "unanswered") return { questionId: m.questionId, verdict: "ungraded" as const, maxMarks: max };
        // mock score cycling
        const scores = [max, Math.floor(max / 2), 0];
        const verdicts: ("correct" | "partial" | "incorrect")[] = ["correct", "partial", "incorrect"];
        const i = idx % 3;
        return {
          questionId: m.questionId,
          verdict: verdicts[i],
          score: scores[i],
          maxMarks: max,
          feedback: i === 0 ? "Well answered, clear explanation." : i === 1 ? "Partially correct, missing key points." : "Incorrect, needs review.",
        };
      });
      const totalScore = grades.reduce((s, g) => s + (g.score ?? 0), 0);
      const totalMax = grades.reduce((s, g) => s + (g.maxMarks ?? 5), 0);
      const answeredCount = parsed.data.mappings.filter((m) => m.status === "answered").length;
      const unansweredCount = parsed.data.mappings.filter((m) => m.status === "unanswered").length;
      return NextResponse.json({
        grades,
        summary: { totalScore, totalMax, answeredCount, unansweredCount, overallFeedback: "Mock grading (no GROQ_API_KEY). Configure GROQ_API_KEY for real AI grading." },
      });
    }

    const { grades, summary } = await gradeBatch(parsed.data.questions, parsed.data.answerBlocks, parsed.data.mappings);

    return NextResponse.json({ grades, summary });
  } catch (err: any) {
    console.error("grade error", err);
    const message = err?.message ?? "Grading failed";
    // Graceful degradation: return empty grades rather than 500 if possible? But spec says degrade gracefully client-side.
    // Here we still return 500 so client can decide to continue without grades.
    const isRateLimit = message.includes("429") || err?.status === 429;
    return NextResponse.json({ error: { stage: "grade", message, retryable: !!isRateLimit } }, { status: 500 });
  }
}
