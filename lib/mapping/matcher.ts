import { normalizeLabel } from "./normalize";
import type { Question, AnswerBlock, Mapping, UnmatchedAnswer } from "@/types/domain";

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

// OCR confusable: normalize l->1 etc before distance? We'll try map variant.
function confusableNormalize(s: string): string {
  return s
    .replace(/l/g, "1")
    .replace(/o/g, "0")
    .replace(/i/g, "1")
    .replace(/s/g, "5");
}

export function runMapping(
  questions: Question[],
  answerBlocks: AnswerBlock[]
): { mappings: Mapping[]; unmatched: UnmatchedAnswer[] } {
  // Build question key map
  const qKeyToId = new Map<string, string>();
  const qKeys: string[] = [];
  const qIdToKey = new Map<string, string>();

  for (const q of questions) {
    const k = normalizeLabel(q.displayNumber);
    qKeyToId.set(k, q.id);
    qKeys.push(k);
    qIdToKey.set(q.id, k);
  }

  // For each answer block, attempt to map
  const blockToQuestion = new Map<string, string>(); // answerBlockId -> questionId
  const unmatched: UnmatchedAnswer[] = [];

  for (const block of answerBlocks) {
    const raw = block.rawLabel;
    const norm = block.normalizedKey ?? (raw ? normalizeLabel(raw) : null);

    if (!norm) {
      unmatched.push({ answerBlockId: block.id, reason: "no_label_detected" });
      continue;
    }

    // Exact match
    if (qKeyToId.has(norm)) {
      blockToQuestion.set(block.id, qKeyToId.get(norm)!);
      continue;
    }

    // Try confusable exact
    const confNorm = confusableNormalize(norm);
    if (qKeyToId.has(confNorm)) {
      blockToQuestion.set(block.id, qKeyToId.get(confNorm)!);
      continue;
    }

    // Levenshtein distance ≤1 and unique
    let bestDist = Infinity;
    let bestKey: string | null = null;
    let secondBestDist = Infinity;
    for (const k of qKeys) {
      const d = levenshtein(norm, k);
      const dConf = levenshtein(confusableNormalize(norm), confusableNormalize(k));
      const dEff = Math.min(d, dConf);
      if (dEff < bestDist) {
        secondBestDist = bestDist;
        bestDist = dEff;
        bestKey = k;
      } else if (dEff < secondBestDist) {
        secondBestDist = dEff;
      }
    }

    if (bestKey !== null && bestDist <= 1 && secondBestDist > bestDist) {
      blockToQuestion.set(block.id, qKeyToId.get(bestKey)!);
      continue;
    }

    // Low confidence case vs not in paper
    if (block.confidence < 0.4) {
      unmatched.push({ answerBlockId: block.id, reason: "low_confidence" });
    } else {
      unmatched.push({ answerBlockId: block.id, reason: "label_not_in_question_paper" });
    }
  }

  // Group by question: multiple blocks per question, sorted by page then y
  const qToBlocks = new Map<string, string[]>();
  for (const q of questions) qToBlocks.set(q.id, []);

  // Need block lookup for sorting
  const blockById = new Map(answerBlocks.map((b) => [b.id, b] as const));

  // Collect matched blocks per question unsorted then sort
  for (const [blockId, qId] of blockToQuestion.entries()) {
    qToBlocks.get(qId)!.push(blockId);
  }

  for (const [qId, ids] of qToBlocks.entries()) {
    ids.sort((a, b) => {
      const ba = blockById.get(a)!;
      const bb = blockById.get(b)!;
      if (ba.page !== bb.page) return ba.page - bb.page;
      return ba.bbox.y - bb.bbox.y;
    });
  }

  const mappings: Mapping[] = questions.map((q) => {
    const ids = qToBlocks.get(q.id) ?? [];
    return {
      questionId: q.id,
      status: ids.length > 0 ? "answered" : "unanswered",
      answerBlockIds: ids,
    };
  });

  // All unmatched already collected. Ensure blocks that were not matched but not pushed? Already handled.

  return { mappings, unmatched };
}
