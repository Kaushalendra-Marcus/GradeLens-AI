import { groqChatCompletion, configuredModel } from "@/lib/groq/client";
import { normalizeLabel } from "./normalize";
import type { Question, AnswerBlock } from "@/types/domain";

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

function confusableNormalize(s: string): string {
  return s.replace(/l/g, "1").replace(/o/g, "0").replace(/i/g, "1").replace(/s/g, "5");
}

export const MIN_TRANSCRIBED_LENGTH = 20;
export const MAX_CANDIDATES = 3;
export const ESCALATION_DISTANCE_THRESHOLD = 1;

export const LLM_ESCALATION_SYSTEM = `You are a question-answer matcher. Given a student's transcribed answer text and a small set of candidate questions, determine which question the answer is most likely addressing based on the content and any label hint.

Rules:
- Consider the transcribed text semantics vs each candidate question's text.
- If the answer clearly addresses one of the candidates, return its id.
- If none fit well or the answer is generic/unrelated, return null.
- Be conservative: only return a match if confident.

Return ONLY JSON: { "matchedQuestionId": string | null, "confidence": number }
No prose, no markdown fences.`;

export type CandidateWithDist = { question: Question; key: string; distance: number };

export function getClosestCandidates(
  normalizedKey: string | null,
  questions: Question[],
  limit = MAX_CANDIDATES
): CandidateWithDist[] {
  if (!normalizedKey) {
    // No label — can't rank by label distance; return first N questions as candidates
    // Caller should use shouldEscalate to decide if content is non-trivial
    return questions.slice(0, limit).map((q) => ({
      question: q,
      key: normalizeLabel(q.displayNumber),
      distance: Infinity,
    }));
  }

  const scored: CandidateWithDist[] = questions.map((q) => {
    const k = normalizeLabel(q.displayNumber);
    const d = levenshtein(normalizedKey, k);
    const dConf = levenshtein(confusableNormalize(normalizedKey), confusableNormalize(k));
    return { question: q, key: k, distance: Math.min(d, dConf) };
  });

  scored.sort((a, b) => a.distance - b.distance);
  return scored.slice(0, limit);
}

export function shouldEscalate(
  block: AnswerBlock,
  normalizedKey: string | null,
  questions: Question[]
): boolean {
  // Case 1: no label but non-trivial content
  if (!normalizedKey) {
    const text = (block.transcribedText ?? "").trim();
    return text.length >= MIN_TRANSCRIBED_LENGTH;
  }

  // Case 2: label close to more than one question (ambiguous)
  const candidates = getClosestCandidates(normalizedKey, questions, questions.length);
  // Count how many within threshold
  const close = candidates.filter((c) => c.distance <= ESCALATION_DISTANCE_THRESHOLD);
  if (close.length >= 2) return true;
  // Also escalate if best distance is >1 but <=threshold (failed deterministic Levenshtein-1 unique)
  // That is ambiguous/borderline that deterministic would have left unmatched
  if (candidates[0] && candidates[0].distance > 1 && candidates[0].distance <= ESCALATION_DISTANCE_THRESHOLD) {
    // If second best is close behind, it's ambiguous; else it's still borderline but worth one LLM check
    // Only escalate if not clearly unique far away. Keep it narrow: if exactly 1 close candidate, still escalate once
    // to allow semantic confirmation. But spec says "only the handful of ambiguous cases"
    // So require at least 2 close OR distance==2 with single candidate? We'll allow single distance==2 as escalatable.
    return true;
  }
  // Deterministic left it unmatched due to tie at distance <=1: that will have >=2 with distance <=1, already covered
  return false;
}

/**
 * Text-only Groq call: given answer transcribed text + candidate questions, ask model to pick best.
 * Returns matched questionId or null.
 */
export async function escalateBlock(
  block: AnswerBlock,
  candidates: Question[]
): Promise<string | null> {
  if (candidates.length === 0) return null;

  const candidateList = candidates
    .map((q) => `- id="${q.id}" displayNumber="${q.displayNumber}" text="${q.text.slice(0, 300)}"`)
    .join("\n");

  const userContent = [
    {
      type: "text",
      text: `Candidate questions:\n${candidateList}\n\nStudent answer block:\nrawLabel=${block.rawLabel ?? "null"}\ntranscribedText="${(block.transcribedText ?? "").slice(0, 800)}"\n\nPick the best matching candidate id or null if none fit. Return JSON only.`,
    },
  ];

  try {
    const content = await groqChatCompletion({
      model: configuredModel(),
      systemPrompt: LLM_ESCALATION_SYSTEM,
      userContent: userContent as any[],
      temperature: 0,
    });

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          parsed = JSON.parse(m[0]);
        } catch {
          return null;
        }
      } else return null;
    }

    const matchedId = parsed?.matchedQuestionId ?? parsed?.questionId ?? null;
    if (typeof matchedId === "string" && candidates.some((c) => c.id === matchedId)) {
      // Optional confidence gate
      if (typeof parsed.confidence === "number" && parsed.confidence < 0.5) return null;
      return matchedId;
    }
    return null;
  } catch {
    // On Groq failure, fall through to unmatched rather than throwing
    return null;
  }
}
