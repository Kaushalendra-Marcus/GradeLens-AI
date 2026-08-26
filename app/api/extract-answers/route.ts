import { NextRequest, NextResponse } from "next/server";
import { ExtractAnswersRequestSchema } from "@/lib/schemas";
import { extractAnswers } from "@/lib/extraction/answerExtraction";
import { normalizeLabel } from "@/lib/mapping/normalize";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ExtractAnswersRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { stage: "extract-answers", message: parsed.error.message, retryable: false } }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      const mock = parsed.data.images.flatMap((img, imgIdx) =>
        [1, 2].map((n) => ({
          id: `ab_mock_${img.page}_${n}`,
          rawLabel: n === 1 ? `${(img.page - 1) * 2 + n}` : `Q${(img.page - 1) * 2 + n} a)`,
          normalizedKey: n === 1 ? `${(img.page - 1) * 2 + n}` : `${(img.page - 1) * 2 + n}a`,
          transcribedText: `Mock transcribed answer for question ${(img.page - 1) * 2 + n}. This is demo handwriting transcription without GROQ_API_KEY configured.`,
          page: img.page,
          bbox: { x: 0.07, y: 0.1 + n * 0.25, width: 0.86, height: 0.18 },
          confidence: n === 1 ? 0.95 : 0.6,
        }))
      );
      // Add an unmatched example
      mock.push({
        id: `ab_mock_unmatched`,
        rawLabel: "Q99",
        normalizedKey: "99",
        transcribedText: "This note does not correspond to any question in the paper and should appear as unmatched.",
        page: parsed.data.images[0].page,
        bbox: { x: 0.07, y: 0.75, width: 0.86, height: 0.12 },
        confidence: 0.9,
      });
      return NextResponse.json({ answerBlocks: mock });
    }

    const raw = await extractAnswers(parsed.data.images);

    const answerBlocks = raw.map((b, idx) => ({
      id: `ab_${idx}_${b.page}`,
      rawLabel: b.rawLabel,
      normalizedKey: b.rawLabel ? normalizeLabel(b.rawLabel) : null,
      transcribedText: b.transcribedText,
      page: b.page,
      bbox: b.bbox,
      confidence: b.confidence,
    }));

    return NextResponse.json({ answerBlocks });
  } catch (err: any) {
    console.error("extract-answers error", err);
    const message = err?.message ?? "Failed to extract answers";
    const isRateLimit = message.includes("429") || err?.status === 429;
    return NextResponse.json({ error: { stage: "extract-answers", message, retryable: !!isRateLimit } }, { status: 500 });
  }
}
