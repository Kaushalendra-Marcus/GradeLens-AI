import { groqChatCompletion, configuredModel } from "@/lib/groq/client";
import { QUESTION_EXTRACTION_SYSTEM } from "./prompts";

type PageInput = { page: number; dataUrl: string };

type RawQuestion = {
  displayNumber: string;
  parentNumber: string | null;
  subLabel: string | null;
  text: string;
  maxMarks: number | null;
  page: number;
  bbox: { x: number; y: number; width: number; height: number };
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function safeParseQuestions(content: string, fallbackPage: number): RawQuestion[] {
  try {
    const json = JSON.parse(content);
    if (Array.isArray(json.questions)) return json.questions;
    if (Array.isArray(json)) return json;
    return [];
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const j = JSON.parse(match[0]);
        if (Array.isArray(j.questions)) return j.questions;
      } catch {}
    }
    return [];
  }
}

export async function extractQuestions(pages: PageInput[]): Promise<RawQuestion[]> {
  const batches = chunk(pages, 2);
  const all: RawQuestion[] = [];

  for (const batch of batches) {
    const pageNums = batch.map((p) => p.page).join(", ");
    const userContent: any[] = [
      { type: "text", text: `These are question paper pages: ${pageNums}. Extract per instructions. Ensure "page" field matches the actual page number shown (one of ${pageNums}).` },
    ];
    for (const p of batch) {
      userContent.push({ type: "image_url", image_url: { url: p.dataUrl } });
    }

    const content = await groqChatCompletion({
      model: configuredModel(),
      systemPrompt: QUESTION_EXTRACTION_SYSTEM,
      userContent,
    });

    const parsed = safeParseQuestions(content, batch[0].page);
    // Validate / clamp bbox
    for (const q of parsed) {
      if (!q.bbox) q.bbox = { x: 0.05, y: 0.05, width: 0.9, height: 0.08 };
      q.bbox.x = Math.max(0, Math.min(1, q.bbox.x));
      q.bbox.y = Math.max(0, Math.min(1, q.bbox.y));
      q.bbox.width = Math.max(0, Math.min(1 - q.bbox.x, q.bbox.width));
      q.bbox.height = Math.max(0, Math.min(1 - q.bbox.y, q.bbox.height));
      if (!q.page || typeof q.page !== "number") q.page = batch[0].page;
    }
    all.push(...parsed);
  }

  return all;
}
