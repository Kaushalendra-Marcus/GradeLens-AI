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
  const batches = chunk(pages, 2);
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
      if (!a.page || typeof a.page !== "number") a.page = batch[0].page;
      if (typeof a.confidence !== "number") a.confidence = a.rawLabel ? 0.7 : 0.3;
      a.confidence = Math.max(0, Math.min(1, a.confidence));
      if (typeof a.transcribedText !== "string") a.transcribedText = String(a.transcribedText ?? "");
    }
    all.push(...parsed);
  }

  return all;
}
