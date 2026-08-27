import { NextRequest, NextResponse } from "next/server";
import { MapRequestSchema } from "@/lib/schemas";
import { runMapping } from "@/lib/mapping/matcher";
import { shouldEscalate, getClosestCandidates, escalateBlock } from "@/lib/mapping/llmEscalation";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = MapRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { stage: "map", message: parsed.error.message, retryable: false } }, { status: 400 });
    }

    const { mappings: initialMappings, unmatched: initialUnmatched } = runMapping(
      parsed.data.questions,
      parsed.data.answerBlocks
    );

    // If no API key, no LLM escalation (keep deterministic result)
    if (!process.env.GROQ_API_KEY || initialUnmatched.length === 0) {
      return NextResponse.json({ mappings: initialMappings, unmatched: initialUnmatched });
    }

    const blockById = new Map(parsed.data.answerBlocks.map((b) => [b.id, b] as const));
    const questionById = new Map(parsed.data.questions.map((q) => [q.id, q] as const));

    // Build mutable mapping: questionId -> ordered block ids
    const qToBlocks = new Map<string, string[]>();
    for (const m of initialMappings) qToBlocks.set(m.questionId, [...m.answerBlockIds]);

    const remainingUnmatched: typeof initialUnmatched = [];
    const escalatedPairs: { blockId: string; questionId: string }[] = [];

    for (const u of initialUnmatched) {
      const block = blockById.get(u.answerBlockId);
      if (!block) {
        remainingUnmatched.push(u);
        continue;
      }
      const normalizedKey = block.normalizedKey ?? (block.rawLabel ? block.rawLabel : null);
      // Normalize again if needed (block.normalizedKey already normalized)
      const norm = block.normalizedKey;
      if (!shouldEscalate(block, norm, parsed.data.questions)) {
        remainingUnmatched.push(u);
        continue;
      }

      const candidatesWithDist = getClosestCandidates(norm, parsed.data.questions, 3);
      const candidates = candidatesWithDist.map((c) => c.question);

      // Only escalate if we have 2-3 candidates; for no-label Infinity case we still have 3
      const matchedId = await escalateBlock(block, candidates);
      if (matchedId && questionById.has(matchedId)) {
        escalatedPairs.push({ blockId: block.id, questionId: matchedId });
        const arr = qToBlocks.get(matchedId) ?? [];
        arr.push(block.id);
        qToBlocks.set(matchedId, arr);
      } else {
        remainingUnmatched.push(u);
      }
    }

    // Re-sort each question's blocks by page then y
    for (const [qId, ids] of qToBlocks.entries()) {
      ids.sort((a, b) => {
        const ba = blockById.get(a)!;
        const bb = blockById.get(b)!;
        if (ba.page !== bb.page) return ba.page - bb.page;
        return ba.bbox.y - bb.bbox.y;
      });
    }

    const mappings = parsed.data.questions.map((q) => {
      const ids = qToBlocks.get(q.id) ?? [];
      return {
        questionId: q.id,
        status: ids.length > 0 ? ("answered" as const) : ("unanswered" as const),
        answerBlockIds: ids,
      };
    });

    return NextResponse.json({ mappings, unmatched: remainingUnmatched });
  } catch (err: any) {
    console.error("map error", err);
    return NextResponse.json({ error: { stage: "map", message: err?.message ?? "Mapping failed", retryable: false } }, { status: 500 });
  }
}
