# GradeLens AI — Assessment Extraction & Answer Mapping

An AI-powered assessment intelligence platform that extracts questions and handwritten answers, maps them accurately, and highlights the exact answer regions across pages.

## Approach Summary

Core flow: **Upload (question paper + answer sheet) → Question Extraction (OCR + structuring) → Answer Extraction (handwriting OCR) → Answer Mapping (label-based reconciliation handling out-of-order / unanswered / unmatched / multi-page) → Grading & Feedback (optional) → Review UI (split question list ↔ answer sheet viewer with click-to-highlight).**

- **Client-side PDF rasterization** (`pdfjs-dist` → `<canvas>` → JPEG data URLs) — server never touches raw PDFs, avoiding serverless rasterization fragility.
- **Stateless API routes** (`/api/extract-questions`, `/api/extract-answers`, `/api/map`, `/api/grade`) — pure functions, images/JSON in, structured JSON out, no DB/session.
- **Groq vision** (`qwen/qwen3.6-27b`) batched at **2 images/request** to stay under 8K TPM (each image = 2048 tokens), serialized through a 2100 ms rate-limiter with 429 backoff.
- **Deterministic mapping** layers exact normalized-key match → Levenshtein/confusable fuzzy (≤1) → text-only LLM escalation → unmatched bucket. Multi-page answers grouped in page order.
- **In-memory Zustand store** holds single `AssessmentResult` for the whole review session; highlight overlay uses normalized 0–1 boxes as CSS percentages (zoom-independent).

## AI Model / API Used

- **Groq API**, model **`qwen/qwen3.6-27b`** for all vision calls (question + handwriting extraction), plus small text-only calls for ambiguous mapping and grading. `temperature: 0`, `response_format: { type: "json_object" }`, free-tier limits: 30 RPM / 1,000 RPD / 8,000 TPM / 200,000 TPD, 5 images/request (batched at 2).

## Setup / Run

```bash
# 1. Clone & install
npm install

# 2. Configure env (required for real AI; without it app runs in mock demo mode)
cp .env.local.example .env.local
# edit .env.local and set:
# GROQ_API_KEY=your_groq_key_here
# (optional) GROQ_MODEL=qwen/qwen3.6-27b

# 3. Dev
npm run dev        # http://localhost:3000 → redirects to /exam

# 4. Build / start
npm run build
npm start

# 5. Deploy to Vercel
# - Push to GitHub, import in Vercel
# - Add GROQ_API_KEY as encrypted env var (only read in app/api/* routes)
# - No extra config needed; API routes maxDuration set to 60s
```

## Known Limitations

- **Handwriting OCR accuracy** depends entirely on scan/photo quality and the vision model's handwriting capability — no fallback OCR engine (free-tier constraint).
- **Free-tier throughput** (30 RPM / 8K TPM) caps large document sets (10+ pages) — serialized, rate-limited batching takes proportionally longer.
- **No persistence** — closing the tab loses the session (no DB, per assignment constraints).
- **Design tokens** approximated from PNG exports (no Figma inspector access) — minor color/spacing drift possible.
- **Mock mode** when `GROQ_API_KEY` is unset: extraction/grading return synthetic demo data so the UI remains testable without credentials.

## Tech Stack

Next.js 14 App Router + TypeScript, Tailwind CSS + shadcn/ui primitives, Zustand, Zod, pdfjs-dist, groq-sdk, lucide-react. Deployed target: Vercel.

## Project Structure

See `docs/SPEC.md` (product spec) and `docs/IMPLEMENTATION.md` (stack, file layout, prompts, algorithms, build order).

## License

Assignment submission — not licensed for reuse.
