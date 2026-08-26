# Task: Build GradeLens AI — full implementation

## 1. What this is
A hiring-assignment web app: "AI Assessment Extraction & Answer Mapping." A teacher uploads a question paper and one student's handwritten answer sheet (PDF or images). The app extracts every question, transcribes the handwritten answers, maps each answer to its question, and lets the teacher click a question to see the exact highlighted region on the answer sheet — with optional AI grading/feedback layered on top.

Core flow:
```
Upload (question paper + answer sheet)
  → Question Extraction (OCR + structuring, preserving original numbering)
  → Answer Extraction (handwriting OCR, per labelled region)
  → Answer Mapping (question ⇄ answer reconciliation: unanswered / unmatched / out-of-order / multi-page)
  → Grading & Feedback (optional: score, verdict, per-question AI feedback)
  → Review UI (split question list ⇄ answer sheet viewer with click-to-highlight)
```
No auth, no database, in-memory/client-held state only. Must end up deployed to a live URL.

## 2. Design reference
The Figma design (six exported frames were analyzed) shows:

**Upload screen** — centered heading "Upload **Question Paper & Answer Sheets**" (second phrase styled as an orange highlighter pill over the text), subtext "Upload both files to get started," a decorative teacher-avatar illustration (soft glow ring by default, turning into a **solid gold ring once both files are attached**), and two side-by-side dashed-border dropzones ("Upload Question Paper" / "Upload Answer Sheet", both "Max 10MB"). Once a file is chosen its dropzone becomes a file card: red PDF glyph, filename, `size • N Pages`, and a remove (×) button. A "Start Mapping →" pill button stays disabled/grey until both files are present, then becomes enabled/dark. Helper text below: "Once both files are uploaded, you'll be able to map answers with questions." Stacks vertically on mobile.

**Processing screen** — sidebar collapses to an icon-only rail. Main area is a centered state: pulsing orange 4-point sparkle glyph, "Extracting…" heading, "This may take a while" subtext. Extend this (still visually the same) with a live sub-label cycling through actual pipeline stages (e.g. "Reading question paper (1/2)" → "Reading answer sheet (2/4 pages)" → "Mapping answers to questions" → "Grading responses" → "Finishing up") plus a thin progress bar — a single silent spinner doesn't satisfy "show processing progress" if something fails halfway. On failure, show an inline error + "Try again" in the same panel, same visual language, no separate mock needed.

**Review & Mapping screen (desktop, ≥1024px)** — two-panel split, sidebar collapsed:
- Left, white header "Extracted Questions (from question paper)" + "Expand All" link. Scrollable accordion list, one row per question **in original printed order**: grey circular index badge with the exact printed number (sub-parts like `11(a)`/`11(b)` render as separate rows, badge `11` + label `a.`/`b.`), question text, and a right-aligned status pill — colored score (`4/5`, green/amber/red by thresholds below) if graded, neutral "Answered" if grading is off, or grey "Not Answered" if unmatched. Clicking a row expands it (orange left border on the selected row, "AI Feedback" text block revealed if graded) and drives the right panel.
- Right, **dark toolbar header** "Answer Sheet" (deliberately contrasts with the left panel so it reads as a document viewer) with zoom controls (`− 100% +`) and page nav (`‹ Page 1 of N ›`). Below: the answer-sheet page rendered as an image. The matched region for the selected question is drawn as a rounded-rectangle overlay with a small corner tag repeating the question number, colored to match that question's status (green/amber/red/neutral — keeps the color language consistent with the score pill rather than introducing a second meaning). If the answer spans multiple pages, selecting the question auto-navigates to the first page containing content and the page nav exposes the rest in order. If unanswered, show an inline note ("No matching answer found on the answer sheet") instead of an overlay.
- An "Unmatched content" collapsible section below the question list surfaces any transcribed handwriting block that couldn't be confidently tied to a question — don't silently drop it.

**Review & Mapping screen (mobile, <768px)** — a segmented **Questions | Answer Sheet** control swaps the single visible panel; selection state is shared across both tabs.

**Grading summary** (no mock exists for this — the assignment allows it, so add a minimal component consistent with the existing pill styles): a slim bar above the question list (desktop) / a sheet reachable from a "Summary" button (mobile) showing total score, counts of answered/unanswered/needs-review, optional short overall comment.

**Design tokens** (visually estimated from screenshots, not exact Figma values — expect minor drift, adjust to taste):
| Token | Approx. value | Usage |
|---|---|---|
| `--bg-app` | `#F4F4F5` | Page background |
| `--bg-surface` | `#FFFFFF` | Sidebar, cards, panels |
| `--text-primary` | `#18181B` | Headings, question text |
| `--text-secondary` | `#71717A` | Helper text, metadata |
| `--brand-dark` | `#1A1A1A` | Primary buttons, sidebar pill, answer-sheet toolbar |
| `--accent-orange` | `#F1633B` | Accent text, sparkle icon, selected-row border |
| `--accent-orange-tint` | `#FDE6DA` | Highlighter-pill background behind orange heading text |
| `--success` | `#16A34A` text / `#DCFCE7` bg | High score pill, correct-answer highlight |
| `--warning` | `#D97706` text / `#FEF3C7` bg | Partial-score pill, partial-answer highlight |
| `--danger` | `#DC2626` text / `#FEE2E2` bg | Zero/low-score pill, incorrect-answer highlight |
| `--border-neutral` | `#E4E4E7` | Card borders |
| `--gold-ring` | `#EAB308`-ish | Avatar ring once both files uploaded |

Score-color thresholds (not specified in the brief — use these as a configurable constant): ≥80% → success, 40–79% → warning, <40% (incl. 0) → danger.

**Important note on the reference screenshots**: bright pink/yellow/green rectangle outlines visible around the header/upload-zone/avatar in the upload-screen frames are reviewer annotation call-outs, **not actual UI** — do not implement colored borders around those regions. The one real state change is the avatar's glow → solid gold ring once both files are attached.

The design shows this tool living inside a larger platform ("VedaAI" branding, sidebar with Home/My Classroom/Assignments/Exams/My Library, an "AI Teacher's Toolkit" entry point). Replicate the sidebar + header **as a static shell** for visual fidelity (rebrand to "GradeLens AI"), but only the upload → processing → review flow needs to be functional — other nav items render but do nothing.

## 3. Functional requirements — all must be independently true
- Upload both files, show live processing progress (not just a static spinner).
- Extract every question in the paper's correct printed top-to-bottom order.
- Treat labelled sub-parts as separate questions (`11(a)` and `11(b)` are two entries, never merged).
- Preserve original printed numbering verbatim — never renumber sequentially.
- Handle answers given out of order — matching is by the label the student wrote, not by position on the page.
- Handle unanswered questions — flagged clearly, no highlight shown when selected.
- Handle answer content that matches no question — surfaced, never silently dropped or force-matched.
- Highlight the exact answer region (bounding box), not just "somewhere on this page."
- Support answers spanning multiple pages, with page navigation exposing all of them.
- Follow the design system above; call out any deviation rather than inventing silently.

## 4. Data model
```ts
type NormalizedBox = { x: number; y: number; width: number; height: number }; // all 0–1, relative to page image

type Question = {
  id: string;
  displayNumber: string;          // exactly as printed, e.g. "11 (a)"
  parentNumber?: string;          // "11" when this is a sub-part
  subLabel?: string;              // "a" | "b" | ...
  text: string;
  maxMarks?: number;              // only if printed
  page: number;                   // 1-based, in the question paper
  bbox: NormalizedBox;
  orderIndex: number;             // printed reading order
};

type AnswerBlock = {
  id: string;
  rawLabel: string | null;        // what the student wrote, e.g. "Q11 a)" — null if none detected
  normalizedKey: string | null;   // normalized form used for matching, e.g. "11a"
  transcribedText: string;
  page: number;                   // 1-based, in the answer sheet
  bbox: NormalizedBox;
  confidence: number;             // 0–1
};

type Mapping = {
  questionId: string;
  status: "answered" | "unanswered";
  answerBlockIds: string[];       // ordered, may span pages; empty if unanswered
};

type UnmatchedAnswer = {
  answerBlockId: string;
  reason: "no_label_detected" | "label_not_in_question_paper" | "low_confidence";
};

type GradeResult = {
  questionId: string;
  verdict: "correct" | "partial" | "incorrect" | "ungraded";
  score?: number;
  maxMarks?: number;
  feedback?: string;
};

type AssessmentResult = {
  questions: Question[];
  answerBlocks: AnswerBlock[];
  mappings: Mapping[];
  unmatched: UnmatchedAnswer[];
  grades: GradeResult[];          // empty if grading is skipped
  answerSheetPages: { page: number; imageUrl: string; width: number; height: number }[];
  summary?: { totalScore: number; totalMax: number; answeredCount: number; unansweredCount: number; overallFeedback?: string };
};
```
`AssessmentResult` is the single object the client holds in memory for the whole review session — nothing is re-fetched once processing completes.

## 5. API contract
Four stateless endpoints, called in sequence by the client, each a pure function (images/JSON in, structured JSON out) — no server-side session or storage of any kind:

- `POST /api/extract-questions` — Request: `{ images: { page: number; dataUrl: string }[] }` (already client-rasterized question-paper pages). Response: `{ questions: Question[] }`
- `POST /api/extract-answers` — Request: `{ images: { page: number; dataUrl: string }[] }` (answer-sheet pages). Response: `{ answerBlocks: AnswerBlock[] }`
- `POST /api/map` — Request: `{ questions: Question[]; answerBlocks: AnswerBlock[] }`. Response: `{ mappings: Mapping[]; unmatched: UnmatchedAnswer[] }`. Pure logic + a small text-only LLM assist for ambiguous cases only — no images, cheap and fast.
- `POST /api/grade` (optional stage, only called if grading is enabled) — Request: `{ questions: Question[]; answerBlocks: AnswerBlock[]; mappings: Mapping[] }`. Response: `{ grades: GradeResult[]; summary: AssessmentResult["summary"] }`
- All endpoints share an error shape: `{ error: { stage: string; message: string; retryable: boolean } }`, surfaced by the processing screen's failure state; if grading fails after mapping already succeeded, degrade gracefully rather than losing everything already extracted.

## 6. Tech stack — do not deviate
- Next.js 14+ App Router + TypeScript. Deployed target: Vercel free tier (single repo, one live URL).
- AI provider: **Groq**, model `qwen/qwen3.6-27b` for all vision calls (question extraction + handwriting extraction).
- PDF handling: `pdfjs-dist`, rendered **client-side** to `<canvas>` → JPEG data URLs. The server never touches a raw PDF — avoids fragile server-side PDF rasterization on serverless (native binaries, function timeouts on multi-page files). Plain JPG/PNG uploads skip this and are read directly via `FileReader`.
- State: Zustand, holding the single `AssessmentResult` in browser memory — no DB, no server session (Vercel functions don't reliably share memory across invocations anyway).
- Styling: Tailwind CSS + shadcn/ui primitives (button, badge, card, accordion, tabs, dialog, progress) skinned to the tokens in §2.
- Validation: Zod schemas shared between the LLM's structured JSON output and the API request/response contracts.
- Icons: `lucide-react`.

## 7. Project structure
```
gradelens-ai/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx                        # redirects to /exam
│   ├── exam/page.tsx                   # orchestrates Upload → Processing → Review (client component)
│   └── api/
│       ├── extract-questions/route.ts
│       ├── extract-answers/route.ts
│       ├── map/route.ts
│       └── grade/route.ts
├── components/
│   ├── layout/{AppSidebar.tsx,AppHeader.tsx}       # static shell, §2
│   ├── upload/{UploadDropzone.tsx,FileCard.tsx,TeacherAvatarBadge.tsx}
│   ├── processing/ProcessingView.tsx               # staged progress, §2
│   ├── review/{QuestionListPanel.tsx,QuestionRow.tsx,UnmatchedAnswersPanel.tsx,
│   │            AnswerSheetPanel.tsx,HighlightOverlay.tsx,PageNav.tsx,
│   │            GradingSummaryBar.tsx,MobileTabs.tsx}
│   └── ui/                                         # shadcn primitives
├── lib/
│   ├── groq/{client.ts,rateLimiter.ts}
│   ├── pdf/rasterize.ts                            # client-side, pdfjs-dist
│   ├── extraction/{prompts.ts,questionExtraction.ts,answerExtraction.ts}
│   ├── mapping/{normalize.ts,matcher.ts}
│   ├── grading/grader.ts
│   └── schemas.ts                                  # zod, shared client/server
├── store/useAssessmentStore.ts                     # zustand
├── types/domain.ts                                 # mirrors §4
├── public/teacher-avatar.png                       # decorative asset
├── .env.local.example
├── next.config.mjs
├── tailwind.config.ts
└── package.json
```
Key deps: `next react react-dom typescript groq-sdk pdfjs-dist zustand zod tailwindcss postcss autoprefixer class-variance-authority clsx tailwind-merge lucide-react`.

## 8. Groq integration — read carefully, this is load-bearing
Confirmed current free-tier limits for `qwen/qwen3.6-27b`: **30 RPM, 1,000 RPD, 8,000 TPM, 200,000 TPD**, up to 5 images/request, and **each image costs a flat 2,048 input tokens regardless of resolution**. That means a single request carrying the model's max of 5 images (10,240 tokens) already blows past the 8K TPM ceiling on its own. **Batch at most 2 images per vision request** — leaves headroom for the prompt text and completion tokens while keeping request counts reasonable for typical 2–6 page documents. Never fire uncontrolled parallel Groq calls; serialize them through a rate limiter.

Minimal rate limiter (`lib/groq/rateLimiter.ts`):
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
`lib/groq/client.ts` wraps `groq-sdk`'s chat completion, always `temperature: 0` (determinism) and `response_format: { type: "json_object" }`.

**Question extraction system prompt:**
```
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
Attach each page as an `image_url` (base64 data URL) plus a text part stating which page numbers are in this batch, so `"page"` stays correct across batched calls.

**Answer extraction system prompt:**
```
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

`/api/map` escalates only the ambiguous subset of `(question, candidateAnswer)` pairs to a small **text-only** Groq call (no images, so it doesn't compete for the vision TPM budget), asking a yes/no "does this label plausibly refer to this question?"

`/api/grade` sends `(question.text, matched answer transcript, maxMarks?)` per question, lightly batched (2–3 questions of text per call, no images), asking for `verdict`, `score`, and a 1–2 sentence `feedback`, JSON-mode.

## 9. Mapping algorithm
Normalization (`lib/mapping/normalize.ts`):
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
Matching (`lib/mapping/matcher.ts`):
1. Exact normalized-key match → direct mapping (label-based, so out-of-order answers still map correctly).
2. No exact match → Levenshtein distance (or an OCR-confusable substitution table: l/1, O/0, I/1, S/5) against all question keys; accept only if distance ≤1 char and no other question key is equally close (avoid ambiguous auto-assignment).
3. Still unresolved (or `rawLabel` was null) → escalate to the small text-only LLM check in §8, comparing the answer's transcribed content against candidate questions' text.
4. Still unresolved → goes to `unmatched`, with the appropriate `reason`.

Group multiple answer blocks mapping to the same question, in page order, into one `Mapping.answerBlockIds[]` (handles multi-page spillover). Any question with zero matched blocks is `status: "unanswered"`.

## 10. Highlight rendering
Each answer-sheet page image sits in a `position: relative` container; each highlighted block is an absolutely-positioned overlay using the box's normalized (0–1) coordinates directly as percentages — works at any zoom/width without recomputation:
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
Selecting a question: look up its `Mapping`, resolve the first page containing a block, set the answer panel's current page (triggers page nav), render `HighlightBox` for every block belonging to that question on the visible page (other pages' blocks render on navigation, from the same shared state). Color follows that question's `GradeResult.verdict` if grading ran, else neutral. Bring the box into view with `scrollIntoView({ behavior: "smooth", block: "center" })`.

## 11. State management
Single Zustand store: `stage: "upload" | "processing" | "review"`, the two `File`/rasterized-page-image inputs, `processingStep: string`, and the final `AssessmentResult`. `app/exam/page.tsx` drives the flow: rasterize both files client-side on submit → `stage = "processing"` → call `/api/extract-questions` → `/api/extract-answers` → `/api/map` → (if grading toggle on) `/api/grade`, updating `processingStep` between each → assemble `AssessmentResult` → `stage = "review"`. Any step throwing sets an `error` field consumed by the processing screen's failure state; retry re-runs only from the failed step, not from scratch.

## 12. Build order — follow in sequence
1. Scaffold Next.js + Tailwind + shadcn, static sidebar/header shell, design tokens in `tailwind.config.ts`.
2. Upload screen: dropzones, file cards, validation, avatar ring state, disabled/enabled submit (hard-code a delay to test the processing transition — no AI yet).
3. Client-side PDF rasterization — verify against single-page, multi-page PDFs, and plain images.
4. Groq client + rate limiter — smoke-test question extraction against one real image before wiring the route.
5. `/api/extract-questions` end-to-end, rendering the extracted list (no answer panel yet) — validate ordering/sub-part handling against a real scanned paper.
6. `/api/extract-answers` + raw answer-block dump — sanity-check transcription quality and label detection.
7. Mapping algorithm (`/api/map`) — unit-test normalization/matching against tricky labels (`"11 a)"`, `"Q.11(a)"`, `"ll(a)"`, unlabeled blocks) before wiring the UI.
8. Review screen: question list + answer panel + highlight overlay, wired to real mapping output — this is the core deliverable, expect the most iteration here.
9. Unanswered/unmatched states — deliberately test with a paper that has a skipped question and a stray handwritten note.
10. Multi-page answers — test with an answer that spills across a page break.
11. Grading (`/api/grade`) + summary bar — last, since it's explicitly optional scope.
12. Mobile tabbed layout, shared selection state.
13. Processing-screen polish: staged progress text/bar, failure + retry state.
14. Deploy to Vercel, smoke-test the live URL end-to-end with a fresh document pair.

## 13. Environment
`GROQ_API_KEY` goes in `.env.local`, read only inside `app/api/*/route.ts` — never exposed to the client. Add `.env.local` to `.gitignore`, commit a `.env.local.example` with a blank placeholder. I have a key ready — pause and ask me for it when you reach step 4 if it isn't already in the environment.

## 14. Testing
- I'll provide 1–2 real scanned question-paper + answer-sheet pairs once the upload → rasterize → extract pipeline is wired (around step 5–6) — ask me for them rather than guessing at handwriting-OCR quality with synthetic data.
- Unit-test only the pure logic: `normalizeLabel`, the matcher's distance/threshold logic, the rate-limiter's backoff timing. Don't try to unit-test the Groq calls themselves.

## 15. Git hygiene
Commit at natural checkpoints — roughly one per build-order step — with messages describing which pipeline stage just became functional, not generic "wip" commits.

## 16. When to stop and ask me
- Before adding any dependency not already listed in §6/§7.
- Before changing any of the API contract shapes in §5.
- Before deploying to Vercel — get the project deploy-ready and tell me; I'll connect my own account.
- If, once testing against real handwriting, a different model or batch size turns out to be needed — tell me what you found and what you'd change; don't silently swap it.

## 17. Definition of done
- Every requirement in §3 is demonstrably true against a real uploaded pair.
- Mobile tabbed layout works below 768px.
- Grading can be toggled off and core mapping/highlighting still fully works with neutral pills.
- Root `README.md` updated with: a short approach summary, the AI model/API used (Groq `qwen/qwen3.6-27b`), setup/run instructions, and known limitations (handwriting OCR accuracy depends on scan quality; free-tier throughput caps how fast large document sets process; no persistence across sessions) — needed for the assignment submission form.
- `npm run build` succeeds cleanly with no type errors.
