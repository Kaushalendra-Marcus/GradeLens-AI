# GradeLens AI — Implementation Plan

Companion to `SPEC.md`. This is the "how" — stack, file layout, prompts, algorithms, and build order.

---

## 1. Stack & Rationale

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14+ (App Router, TypeScript) | Single repo, one deploy, matches the assignment's own recommendation; API routes double as the AI backend without a separate server |
| Hosting | Vercel (free tier) | Zero-config Next.js deploys, satisfies "must be deployed and accessible through a live URL" |
| AI provider | Groq API, `qwen/qwen3.6-27b` (vision) | Free tier, fast inference, JSON mode + tool use, up to 5 images/request — see §6 for the exact rate-limit numbers this design is built around |
| PDF handling | `pdfjs-dist`, rendered **client-side** to `<canvas>` → PNG data URLs | Avoids server-side PDF rasterization on serverless (fragile: needs native binaries or heavy WASM, risks function timeouts on multi-page files). The server never touches a raw PDF — only pre-rendered page images |
| State | Zustand (client) | Single `AssessmentResult` blob held in memory per SPEC §5 — no server persistence, no DB |
| Styling/UI | Tailwind CSS + shadcn/ui primitives | Fast to match the design tokens in SPEC §2.4; shadcn gives accordion/tabs/dialog/badge primitives to skin rather than build from scratch |
| Validation | Zod | Shared schemas for both the LLM's structured output and the API request/response contracts |

No database, no auth, no server session — every API route is a pure function: images/JSON in, structured JSON out. This sidesteps the fact that Vercel serverless functions don't reliably share memory across invocations.

---

## 2. Project Structure

```
gradelens-ai/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx                        # redirects to /exam
│   ├── exam/
│   │   └── page.tsx                    # orchestrates Upload → Processing → Review (client component)
│   └── api/
│       ├── extract-questions/route.ts
│       ├── extract-answers/route.ts
│       ├── map/route.ts
│       └── grade/route.ts
├── components/
│   ├── layout/
│   │   ├── AppSidebar.tsx              # static shell, SPEC §2.3
│   │   └── AppHeader.tsx
│   ├── upload/
│   │   ├── UploadDropzone.tsx
│   │   ├── FileCard.tsx
│   │   └── TeacherAvatarBadge.tsx
│   ├── processing/
│   │   └── ProcessingView.tsx          # staged progress, SPEC §3.2
│   ├── review/
│   │   ├── QuestionListPanel.tsx
│   │   ├── QuestionRow.tsx
│   │   ├── UnmatchedAnswersPanel.tsx
│   │   ├── AnswerSheetPanel.tsx
│   │   ├── HighlightOverlay.tsx
│   │   ├── PageNav.tsx
│   │   ├── GradingSummaryBar.tsx
│   │   └── MobileTabs.tsx
│   └── ui/                             # shadcn primitives (button, badge, card, accordion, tabs, dialog, progress)
├── lib/
│   ├── groq/
│   │   ├── client.ts
│   │   └── rateLimiter.ts
│   ├── pdf/
│   │   └── rasterize.ts                # client-side, pdfjs-dist
│   ├── extraction/
│   │   ├── prompts.ts
│   │   ├── questionExtraction.ts
│   │   └── answerExtraction.ts
│   ├── mapping/
│   │   ├── normalize.ts
│   │   └── matcher.ts
│   ├── grading/
│   │   └── grader.ts
│   └── schemas.ts                      # zod schemas, shared client/server
├── store/
│   └── useAssessmentStore.ts           # zustand
├── types/
│   └── domain.ts                       # mirrors SPEC §5
├── public/
│   └── teacher-avatar.png              # decorative asset
├── docs/
│   ├── SPEC.md
│   └── IMPLEMENTATION.md
├── .env.local.example
├── next.config.mjs
├── tailwind.config.ts
└── package.json
```

---

## 3. Environment & Dependencies

`.env.local.example`
```
GROQ_API_KEY=your_key_here
```

Key `package.json` dependencies:
```
next, react, react-dom, typescript
groq-sdk
pdfjs-dist
zustand
zod
tailwindcss, postcss, autoprefixer
class-variance-authority, clsx, tailwind-merge   (shadcn helpers)
lucide-react                                     (icons)
```

`GROQ_API_KEY` is only ever read inside `app/api/*/route.ts` (server), never sent to the client.

---

## 4. Domain Types

`types/domain.ts` — direct translation of SPEC §5 into TypeScript (`Question`, `AnswerBlock`, `NormalizedBox`, `Mapping`, `UnmatchedAnswer`, `GradeResult`, `AssessmentResult`). This file is imported by both `lib/schemas.ts` (for zod parsing) and the components — kept as the single source of truth for shapes.

---

## 5. Client-side PDF Rasterization

`lib/pdf/rasterize.ts` — runs in the browser before any network call:

```ts
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"; // copied to /public at build time

export async function rasterizePdf(file: File, targetWidth = 1600): Promise<PageImage[]> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const pages: PageImage[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = targetWidth / baseViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;

    pages.push({
      page: i,
      dataUrl: canvas.toDataURL("image/jpeg", 0.85),
      width: canvas.width,
      height: canvas.height,
    });
  }
  return pages;
}
```

Plain image uploads (JPG/PNG) skip this step and are read directly via `FileReader` into the same `PageImage` shape (`page: 1`). `targetWidth = 1600` balances handwriting legibility against payload size (a 10MB cap per SPEC §8, and Groq's own 20MB per-request image limit).

---

## 6. Groq Integration

### 6.1 Confirmed free-tier limits (checked against current Groq docs)

| Model | RPM | RPD | TPM | TPD | Images/request |
|---|---|---|---|---|---|
| `qwen/qwen3.6-27b` | 30 | 1,000 | 8,000 | 200,000 | 5 |
| `qwen/qwen3.8-27b` | 30 | 1,000 | 8,000 | 2,000,000 | 3 |

Each image costs a flat **2,048 input tokens** regardless of resolution. This is the load-bearing constraint on the whole extraction design: **8,000 TPM means a single request can safely carry at most ~3 images** (3 × 2048 = 6,144, leaving headroom for the text prompt) before risking a 429 on that request alone, and no more than ~3–4 requests worth of images per minute in total across both extraction calls.

Decision: **`qwen/qwen3.6-27b`** is primary (higher images/request headroom, JSON mode, tool use), used at **batch size 2 images/request** — comfortably under the TPM ceiling with room for the prompt text and completion tokens, while still keeping request counts (and thus latency) reasonable for typical 2–6 page documents.

### 6.2 Rate limiter (`lib/groq/rateLimiter.ts`)

A minimal in-memory token-bucket + retry wrapper — sufficient because each user session is a handful of sequential calls, not sustained load:

```ts
const MIN_INTERVAL_MS = 2100; // ~30 RPM ceiling → space calls out safely
let lastCallAt = 0;

export async function callWithRateLimit<T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> {
  const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastCallAt));
  if (wait > 0) await sleep(wait);
  lastCallAt = Date.now();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      if (err?.status === 429 && attempt < maxRetries) {
        const retryAfter = Number(err?.headers?.["retry-after"] ?? 2 ** attempt);
        await sleep(retryAfter * 1000);
        continue;
      }
      throw err;
    }
  }
  throw new Error("Groq call failed after retries");
}
```

`lib/groq/client.ts` wraps the `groq-sdk` chat completion call, always setting `temperature: 0` (determinism for extraction/matching) and `response_format: { type: "json_object" }`.

### 6.3 Batching strategy

Both `questionExtraction.ts` and `answerExtraction.ts` chunk their page images into groups of 2, call the model once per chunk (serialized through `callWithRateLimit`), and merge the returned arrays — re-indexing `orderIndex` / re-numbering nothing (the model is told to preserve printed numbers, not to invent sequential ones).

### 6.4 Question extraction prompt (`lib/extraction/prompts.ts`)

```
SYSTEM:
You are an exam-paper structuring assistant. You will be shown one or more
consecutive pages of a printed question paper. Extract every question EXACTLY
as printed, in top-to-bottom reading order.

Rules:
- Preserve the original printed numbering verbatim (e.g. "11 (a)", "Q.4", "2.").
- Treat every labelled sub-part as its own separate entry — never merge
  "11 (a)" and "11 (b)" into one item.
- If a maximum-marks value is printed for a question, capture it as a number;
  otherwise omit the field.
- Return the bounding box of each question's text block, normalized to 0-1
  relative to the page image's width/height.
- Do not answer or solve the questions. Do not invent numbering that is not
  printed on the page.

Return ONLY a JSON object of the shape:
{ "questions": [ { "displayNumber": string, "parentNumber": string|null,
  "subLabel": string|null, "text": string, "maxMarks": number|null,
  "page": number, "bbox": {"x":number,"y":number,"width":number,"height":number} } ] }
No prose, no markdown fences — JSON only.
```

The user message attaches each page as an `image_url` (base64 data URL) plus a text part stating which page numbers are included in this batch, so the model's `"page"` field stays correct across batched calls.

### 6.5 Answer extraction prompt

```
SYSTEM:
You are a handwriting transcription assistant. You will be shown one or more
consecutive pages of a student's handwritten answer sheet. The student may
have labelled each answer with a question number (e.g. "Q1", "11 a)", "2."),
may have answered out of the printed order, may have left some questions
blank, and may have written content that doesn't correspond to any question
number at all.

For every distinct answer block you can identify (a contiguous chunk of
handwriting that appears to address one question), return:
- rawLabel: the exact label text the student wrote near/before the block,
  or null if no label is visible.
- transcribedText: your best transcription of the handwritten content.
- page, bbox: as with question extraction, normalized 0-1.
- confidence: 0-1, your confidence that rawLabel correctly identifies which
  question this answers.

Do not guess a label if none is written — return null and let a separate
matching step handle it. Do not merge two visually distinct answer blocks
into one, even if adjacent.

Return ONLY: { "answerBlocks": [ {...} ] } — JSON only, no prose.
```

### 6.6 Mapping/grading calls

`/api/map` is mostly deterministic (see §7) and only escalates to a small **text-only** Groq call (same model or a cheaper text model, no images — so it doesn't compete for the image TPM budget) for the specific subset of `(question, candidateAnswer)` pairs that fuzzy matching leaves ambiguous, asking a yes/no "does this label plausibly refer to this question?" — kept to a handful of pairs per document, not a bulk call.

`/api/grade` sends `(question.text, matched answer transcript, maxMarks?)` per question, one call per question or lightly batched (2–3 questions of text per call, no images — much lighter on tokens than the vision calls), asking for `verdict`, `score`, and a 1–2 sentence `feedback` string, JSON-mode.

---

## 7. Mapping Algorithm (`lib/mapping/normalize.ts`, `matcher.ts`)

### 7.1 Normalization

Both the question's `displayNumber` and an answer block's `rawLabel` are reduced to a comparable key:

```ts
export function normalizeLabel(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^q\.?\s*/i, "")     // strip a leading "Q" / "Q." / "Q "
    .replace(/[().]/g, "")         // drop brackets and periods
    .replace(/\s+/g, "")           // collapse whitespace
    .trim();
}
// "11 (a)" -> "11a"   "Q11 a)" -> "11a"   "11.a" -> "11a"   "2." -> "2"
```

### 7.2 Matching

```
for each question, compute normalizedKey = normalizeLabel(question.displayNumber)
for each answerBlock with rawLabel != null, compute normalizedKey = normalizeLabel(rawLabel)

1. Exact key match -> direct mapping (handles out-of-order answers, since this
   is label-based, not position-based).
2. No exact match -> Levenshtein distance (or a simple OCR-confusable
   substitution table: l/1, O/0, I/1, S/5) against all question keys;
   accept the closest match only if distance <= 1 char and no other question
   key is equally close (avoid ambiguous auto-assignment).
3. Still unresolved (or rawLabel was null) -> escalate to the small LLM
   check described in §6.6, using the answer's transcribedText content
   against the leading candidate question(s)' text for a semantic check.
4. Still unresolved -> answerBlock goes to `unmatched` (SPEC §7), reason
   "no_label_detected" | "label_not_in_question_paper" | "low_confidence".
```

Multiple answer blocks mapping to the same question (multi-page spillover) are grouped in page order into a single `Mapping.answerBlockIds[]`. Any question with zero matched blocks is `status: "unanswered"`.

---

## 8. Highlight Rendering (`components/review/HighlightOverlay.tsx`)

Each answer-sheet page image is rendered at its natural aspect ratio inside a `position: relative` container; the overlay is an absolutely-positioned `<div>` per highlighted block:

```tsx
function HighlightBox({ box, color }: { box: NormalizedBox; color: "success"|"warning"|"danger"|"neutral" }) {
  return (
    <div
      className={cn("absolute rounded-md border-2 pointer-events-none", colorClass[color])}
      style={{
        left: `${box.x * 100}%`,
        top: `${box.y * 100}%`,
        width: `${box.width * 100}%`,
        height: `${box.height * 100}%`,
      }}
    >
      <span className={cn("absolute -top-5 left-0 text-xs font-medium rounded px-1", tagClass[color])}>
        {questionDisplayNumber}
      </span>
    </div>
  );
}
```

Because `box` is normalized (0–1), this works at any zoom level or container width without recomputation — the browser's percentage layout does the scaling. Selecting a question:
1. Looks up its `Mapping`, resolves the first page containing a block, sets `AnswerSheetPanel`'s current page to that page (triggers `PageNav`).
2. Renders `HighlightBox` for every block belonging to that question on the currently visible page; other pages' blocks render when the teacher navigates to them (kept in the same shared state, not recomputed).
3. Colour (`success`/`warning`/`danger`/`neutral`) is derived from that question's `GradeResult.verdict` if grading ran, else `neutral`.

Smooth scroll (`scrollIntoView({ behavior: "smooth", block: "center" })`) brings the box into view within the panel on selection.

---

## 9. State Management (`store/useAssessmentStore.ts`)

Single Zustand store holding: `stage: "upload" | "processing" | "review"`, the two `File`/`PageImage[]` inputs, `processingStep: string`, and the final `AssessmentResult`. All API calls are triggered from `app/exam/page.tsx`, which:
1. On both files present + "Start Mapping" → rasterizes both files client-side → sets `stage = "processing"`.
2. Calls `/api/extract-questions`, updates `processingStep`, then `/api/extract-answers`, then `/api/map`, then (if grading toggle is on) `/api/grade`.
3. Assembles `AssessmentResult`, sets `stage = "review"`.
4. Any step throwing → sets an `error` field consumed by `ProcessingView`'s failure state, with a retry that re-runs from the failed step only (the successfully-extracted data already in the store isn't re-fetched).

No data ever needs to leave the browser except the page images themselves (sent once per extraction call) — nothing is persisted server-side, satisfying "no database required."

---

## 10. Build Order

1. **Scaffold** — Next.js + Tailwind + shadcn init, static `AppSidebar`/`AppHeader` shell, design tokens in `tailwind.config.ts`.
2. **Upload screen** — dropzones, file cards, validation, avatar ring state, disabled/enabled submit. (No AI yet — hard-code a delay to test the processing transition.)
3. **Client-side PDF rasterization** — verify page images render correctly for both single-page and multi-page PDFs and plain images.
4. **Groq client + rate limiter** — smoke-test question extraction against one real question-paper image via the Playground-equivalent call before wiring the route.
5. **`/api/extract-questions`** end-to-end, rendering the extracted list (no answer panel yet) to validate ordering/sub-part handling against a real scanned paper.
6. **`/api/extract-answers`** + raw answer-block dump (no mapping yet) to sanity-check transcription quality and label detection.
7. **Mapping algorithm** (`/api/map`) — unit-test normalization/matching against a table of tricky labels (`"11 a)"`, `"Q.11(a)"`, `"ll(a)"`, unlabeled blocks) before wiring the UI.
8. **Review screen** — question list + answer panel + highlight overlay, wired to real mapping output; this is the core deliverable and gets the most iteration.
9. **Unanswered / unmatched states** — deliberately test with a paper that has a skipped question and a stray handwritten note.
10. **Multi-page answers** — test with an answer sheet where one answer's content spills across a page break.
11. **Grading (`/api/grade`) + summary bar** — layered in last since it's explicitly optional scope.
12. **Mobile tabbed layout** — `MobileTabs` swapping `QuestionListPanel`/`AnswerSheetPanel`, shared selection state.
13. **Processing-screen polish** — staged progress text/bar, failure + retry state.
14. **Deploy to Vercel**, smoke-test the live URL end-to-end with a fresh document pair.

---

## 11. Testing Approach

- Fixture set: 2–3 question papers of varying layout complexity (single column, two-column, mixed sub-parts) and matching handwritten answer sheets (including at least one with an out-of-order answer, one skipped question, and one stray unlabeled note), used manually through the real UI rather than mocked — the extraction quality is the product, so testing against the real Groq model matters more than unit-mocking it.
- Pure-logic unit tests: `normalizeLabel`, the matcher's distance/threshold logic, and the rate limiter's backoff timing — these don't need the network.
- Manual edge-case matrix, run once per fixture set: unanswered question renders correctly / unmatched answer surfaces / multi-page highlight navigates pages / mobile tab state stays in sync / oversized file rejected / non-PDF-non-image file rejected.

## 12. Deployment

1. Push to GitHub.
2. Import into Vercel, set `GROQ_API_KEY` as an encrypted environment variable (never exposed client-side — only read inside route handlers).
3. Set the four API routes' `maxDuration` (Vercel function config) high enough to cover a multi-page extraction sequence if routes are combined; since routes here are one-stage-per-call, default limits should suffice — revisit only if a single extraction call batches more pages than planned.
4. Verify the live URL end-to-end before submission; this is a hard requirement of the assignment, not optional polish.

## 13. Known Limitations (carried from SPEC §9)

- Handwriting OCR accuracy depends entirely on scan/photo quality and the vision model's current handwriting capability — no fallback OCR engine is planned given the free-tier/no-cost constraint.
- Free-tier throughput (30 RPM / 8K TPM) caps how large a document set can be processed quickly; very long answer sheets (10+ pages) will take proportionally longer due to serialized, rate-limited batching.
- No persistence — closing the tab loses the session; acceptable per the assignment's constraints but worth stating plainly in the submission notes.
