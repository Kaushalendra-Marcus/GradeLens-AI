import Groq from "groq-sdk";
import { callWithRateLimit } from "./rateLimiter";

let groqInstance: Groq | null = null;

export function getGroq(): Groq {
  if (groqInstance) return groqInstance;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");
  groqInstance = new Groq({ apiKey });
  return groqInstance;
}

export async function groqChatCompletion(params: {
  model?: string;
  systemPrompt: string;
  userContent: any[];
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const groq = getGroq();
  const model = params.model ?? "qwen/qwen3.6-27b";
  const completion = await callWithRateLimit(() =>
    groq.chat.completions.create({
      model,
      temperature: params.temperature ?? 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.userContent as any },
      ],
      max_tokens: params.maxTokens ?? 4096,
    })
  );
  const content = completion.choices[0]?.message?.content ?? "";
  return content;
}

export function configuredModel(): string {
  return process.env.GROQ_MODEL ?? "qwen/qwen3.6-27b";
}
