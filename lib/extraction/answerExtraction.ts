import { groqChatCompletion, configuredModel } from "@/lib/groq/client";
import { ANSWER_EXTRACTION_SYSTEM } from "./prompts";

type PageInput = { page: number; dataUrl: string };

type RawAnswerBlock = {
  rawLabel: string | null;
  transcribedText: string;
  page: number;
  bbox: { x: number; y: number; width: number; height: number };
  confidence: number;
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function safeParse(content: string): RawAnswerBlock[] {
  try {
    const json = JSON.parse(content);
    if (Array.isArray(json.answerBlocks)) return json.answerBlocks;
    if (Array.isArray(json)) return json;
    return [];
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const j = JSON.parse(match[0]);
        if (Array.isArray(j.answerBlocks)) return j.answerBlocks;
      } catch {}
    }
    return [];
  }
}

export async function extractAnswers(pages: PageInput[]): Promise<RawAnswerBlock[]> {
  const batches = chunk(pages, 1);
  const all: RawAnswerBlock[] = [];

  for (const batch of batches) {
    const pageNums = batch.map((p) => p.page).join(", ");
    const userContent: any[] = [
      { type: "text", text: `These are answer sheet pages: ${pageNums}. Transcribe per instructions. Ensure "page" matches actual page numbers (${pageNums}).` },
    ];
    for (const p of batch) {
      userContent.push({ type: "image_url", image_url: { url: p.dataUrl } });
    }

    const content = await groqChatCompletion({
      model: configuredModel(),
      systemPrompt: ANSWER_EXTRACTION_SYSTEM,
      userContent,
    });

    const parsed = safeParse(content);
    for (const a of parsed) {
      if (!a.bbox) a.bbox = { x: 0.05, y: 0.1, width: 0.9, height: 0.2 };
      a.bbox.x = Math.max(0, Math.min(1, a.bbox.x));
      a.bbox.y = Math.max(0, Math.min(1, a.bbox.y));
      a.bbox.width = Math.max(0, Math.min(1 - a.bbox.x, a.bbox.width));
      a.bbox.height = Math.max(0, Math.min(1 - a.bbox.y, a.bbox.height));
      // tighten: prevent bbox spanning multiple labeled answers (fixes Q2 covering Q3)
      a.bbox.width = Math.min(a.bbox.width, 0.92);
      // dynamic max height based on text length: short answers need less height
      const textLen = String(a.transcribedText ?? "").length;
      const maxH = textLen < 120 ? 0.18 : textLen < 300 ? 0.28 : 0.32;
      a.bbox.height = Math.min(Math.max(a.bbox.height, 0.04), maxH);
      if (!a.page || typeof a.page !== "number") a.page = batch[0].page;
      if (typeof a.confidence !== "number") a.confidence = a.rawLabel ? 0.7 : 0.3;
      a.confidence = Math.max(0, Math.min(1, a.confidence));
      if (typeof a.transcribedText !== "string") a.transcribedText = String(a.transcribedText ?? "");
    }
    // de-overlap on same page: if two boxes overlap vertically, shrink earlier
    parsed.sort((a, b) => a.bbox.y - b.bbox.y);
    for (let i = 0; i < parsed.length - 1; i++) {
      const cur = parsed[i];
      const nxt = parsed[i + 1];
      if (cur.page !== nxt.page) continue;
      const curBottom = cur.bbox.y + cur.bbox.height;
      const gap = nxt.bbox.y - curBottom;
      if (gap < 0.015) {
        cur.bbox.height = Math.max(0.04, nxt.bbox.y - cur.bbox.y - 0.015);
      }
    }
    all.push(...parsed);
  }

  return all;
}
