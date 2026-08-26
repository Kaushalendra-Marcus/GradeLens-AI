import { NextRequest, NextResponse } from "next/server";
import { ExtractQuestionsRequestSchema } from "@/lib/schemas";
import { extractQuestions } from "@/lib/extraction/questionExtraction";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ExtractQuestionsRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { stage: "extract-questions", message: parsed.error.message, retryable: false } }, { status: 400 });
    }

    // Mock fallback when no API key (demo / build without credentials)
    if (!process.env.GROQ_API_KEY) {
      const mock = parsed.data.images.flatMap((img, imgIdx) =>
        [1, 2, 3].map((n) => ({
          id: `q_mock_${img.page}_${n}`,
          displayNumber: `${(img.page - 1) * 3 + n}`,
          parentNumber: undefined,
          subLabel: undefined,
          text: `Sample question ${(img.page - 1) * 3 + n}: This is a mock question generated for demo without GROQ_API_KEY. Replace with real extraction once key is configured.`,
          maxMarks: 5,
          page: img.page,
          bbox: { x: 0.05, y: 0.08 + n * 0.18, width: 0.9, height: 0.12 },
          orderIndex: imgIdx * 3 + (n - 1),
        }))
      );
      // Add sub-part example 11(a)/11(b) if enough pages
      if (mock.length >= 2) {
        (mock as any[]).push(
          {
            id: "q_mock_11_a",
            displayNumber: "11 (a)",
            parentNumber: "11",
            subLabel: "a",
            text: "Sample sub-part 11(a): Explain the process in brief.",
            maxMarks: 3,
            page: parsed.data.images[0].page,
            bbox: { x: 0.05, y: 0.65, width: 0.9, height: 0.1 },
            orderIndex: mock.length,
          },
          {
            id: "q_mock_11_b",
            displayNumber: "11 (b)",
            parentNumber: "11",
            subLabel: "b",
            text: "Sample sub-part 11(b): Give two examples.",
            maxMarks: 2,
            page: parsed.data.images[0].page,
            bbox: { x: 0.05, y: 0.78, width: 0.9, height: 0.1 },
            orderIndex: mock.length + 1,
          }
        );
      }
      return NextResponse.json({ questions: mock });
    }

    const raw = await extractQuestions(parsed.data.images);

    // Transform to domain Question shape with id/orderIndex
    const questions = raw.map((q, idx) => ({
      id: `q_${q.displayNumber.replace(/\W+/g, "_")}_${idx}`,
      displayNumber: q.displayNumber,
      parentNumber: q.parentNumber ?? undefined,
      subLabel: q.subLabel ?? undefined,
      text: q.text,
      maxMarks: q.maxMarks ?? undefined,
      page: q.page,
      bbox: q.bbox,
      orderIndex: idx,
    }));

    return NextResponse.json({ questions });
  } catch (err: any) {
    console.error("extract-questions error", err);
    const message = err?.message ?? "Failed to extract questions";
    const isRateLimit = message.includes("429") || err?.status === 429;
    return NextResponse.json({ error: { stage: "extract-questions", message, retryable: !!isRateLimit } }, { status: 500 });
  }
}
