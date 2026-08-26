import { NextRequest, NextResponse } from "next/server";
import { MapRequestSchema } from "@/lib/schemas";
import { runMapping } from "@/lib/mapping/matcher";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = MapRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { stage: "map", message: parsed.error.message, retryable: false } }, { status: 400 });
    }

    const { mappings, unmatched } = runMapping(parsed.data.questions, parsed.data.answerBlocks);

    return NextResponse.json({ mappings, unmatched });
  } catch (err: any) {
    console.error("map error", err);
    return NextResponse.json({ error: { stage: "map", message: err?.message ?? "Mapping failed", retryable: false } }, { status: 500 });
  }
}
