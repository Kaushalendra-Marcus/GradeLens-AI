# GradeLens AI — Product & Functional Specification

Status: Draft v1.0
Source brief: "AI Assessment Extraction & Answer Mapping" (VedaAI Hiring Assignment)
Design reference: Figma — VedaAI Hiring Assignment (node-id 0-1), interpreted from 6 exported frames (see §2.2)

---

## 1. Overview

### 1.1 Problem statement
A teacher has a question paper and a student's handwritten answer sheet, both as PDFs or images. Today they must manually flip between the two to figure out what the student answered, where, and whether it's correct. GradeLens AI automates this: it reads both documents, figures out which question each handwritten passage answers, and lets the teacher click a question to jump straight to the exact region of the answer sheet that answers it — with optional AI grading and feedback layered on top.

### 1.2 Core flow
```
Upload (question paper + answer sheet)
   → Question Extraction (OCR + structuring, preserving original numbering)
   → Answer Extraction (handwriting OCR, per labelled region)
   → Answer Mapping (question ⇄ answer reconciliation, incl. unanswered / unmatched / out-of-order / multi-page)
   → Grading & Feedback (optional layer: score, verdict, per-question AI feedback)
   → Review UI (split question list ⇄ answer sheet viewer with click-to-highlight)
```

### 1.3 In / out of scope (per assignment)
- In scope: single question paper + single student answer sheet, no auth, no DB, in-memory/client-held state, any AI API with a free tier, must be deployed to a live URL.
- In scope (optional but included): marks/scores, correct/incorrect evaluation, AI feedback per question, grading summary.
- Out of scope: multi-student batch grading, teacher accounts, persistence across sessions, editing the question paper itself.

---

## 2. Design Source & Adaptation Notes

### 2.1 What was provided
Six exported PNGs from the Figma file were supplied in lieu of direct Figma access (Figma blocks automated fetching): two upload-screen states, one processing state, one full desktop review/mapping screen, one mobile comparison (questions tab vs. answer-sheet tab), and one mobile upload screen.

### 2.2 Important interpretation note
The bright pink / yellow / green rectangle outlines visible around the header, upload zone, and avatar in the upload-screen frames are **reviewer/annotation call-outs added on top of the design for the assignment brief**, not actual product chrome. They are **not implemented**. The real UI signal in those frames is: a solid gold/amber border appears around the teacher-avatar illustration once both files are uploaded (state change from a soft glow to a solid ring) — that *is* implemented, as a lightweight "ready" indicator.

### 2.3 Branding adaptation
The frames show a host product called "VedaAI" with a sidebar (Home / My Classroom / Assignments / **Exams** / My Library) and an "AI Teacher's Toolkit" entry point — this tool lives inside a larger platform in the original design. Since this assignment only asks for the extraction/mapping tool itself, the plan is:
- Replicate the sidebar + header **as a static shell** for visual fidelity (branded "GradeLens AI" instead of "VedaAI").
- Only the flow behind the active "Exams" item is functional. Other nav items (Home, My Classroom, Assignments, My Library, Settings, the school card) render but are inert (no navigation) — called out in the UI as non-functional placeholders is not necessary visually, they simply don't need to do anything since there's nothing behind them for this assignment.
- The user avatar / school name in the header are static placeholder content (e.g. "Demo Teacher").

### 2.4 Design tokens (extracted, approximate)
Pulled visually from the screenshots — treat as a strong starting point, not exact hex values (no Figma inspector access):

| Token | Approx. value | Usage |
|---|---|---|
| `--bg-app` | `#F4F4F5` (zinc-100) | Page background behind cards |
| `--bg-surface` | `#FFFFFF` | Sidebar, cards, panels |
| `--text-primary` | `#18181B` (zinc-900) | Headings, question text |
| `--text-secondary` | `#71717A` (zinc-500) | Helper text, metadata |
| `--brand-dark` | `#1A1A1A` | Primary buttons, "AI Teacher's Toolkit" pill, answer-sheet toolbar |
| `--accent-orange` | `#F1633B` (~orange-600) | Accent text ("Question Paper"), sparkle icon, active-question left border, extracting icon |
| `--accent-orange-tint` | `#FDE6DA` (~orange-100) | Highlighter-style pill background behind the orange heading text |
| `--success` | `#16A34A` (green-600) / bg `#DCFCE7` | Full/near-full score pills, correct-answer highlight box |
| `--warning` | `#D97706` (amber-600) / bg `#FEF3C7` | Partial-score pills, partial-answer highlight box |
| `--danger` | `#DC2626` (red-600) / bg `#FEE2E2` | Zero/low-score pills, incorrect-answer highlight box |
| `--border-neutral` | `#E4E4E7` | Card borders |
| `--gold-ring` | `#EAB308`-ish | Solid ring around avatar once both files are uploaded |

Typography: a clean grotesk/humanist sans (Inter-equivalent is a safe substitute), bold weights for headings and question numbers, regular/medium for body.

Component inventory implied by the frames: pill nav button, sidebar nav list w/ active state, icon-only collapsed sidebar rail, dashed-border upload dropzone, uploaded-file card w/ remove action, primary pill button (disabled/enabled), full-screen centered loader, accordion list row, colored status pill/badge, dark toolbar panel w/ zoom + pagination controls, colored highlight box with a small corner tag, segmented tab control (mobile).

---

## 3. Screens

### 3.1 Upload screen
**States:** empty → files attached → (submit) → processing.

Layout: centered column. Heading "Upload **Question Paper & Answer Sheets**" (second phrase in the orange highlighter-pill style). Subtext "Upload both files to get started." Teacher-avatar illustration (decorative, static asset) with a soft glow ring by default, turning into a solid gold ring once **both** files are present. Two side-by-side (stacked on mobile) upload targets:
- Left: "Upload **Question Paper**" — accepts PDF/JPG/PNG, "Max 10MB" — supports multi-page PDFs.
- Right: "Upload Answer Sheet" — same constraints, supports multi-page PDFs (this is the file that will later need multi-page highlighting/pagination).

Once a file is chosen, its dropzone is replaced by a file card: red PDF glyph (or image glyph for images), filename, `size • N Pages`, and a remove (×) button that reverts to the empty dropzone for that slot.

"Start Mapping →" pill button: disabled/grey until both slots are filled; enabled/dark once both are present. Helper copy underneath: "Once both files are uploaded, you'll be able to map answers with questions." Clicking it (only when enabled) transitions to the processing screen.

**Validation:** reject non-PDF/JPG/PNG files and files over 10MB client-side with an inline error on the dropzone (not shown in mockups, but required for a working product — see §6.4).

### 3.2 Processing screen
Sidebar collapses to an icon-only rail (same nav items, icons only, active item ringed in orange). Header stays the same (back arrow, breadcrumb, help/notif/sparkle/avatar). Main area is a single centered state: pulsing 4-point orange sparkle glyph, "Extracting…" heading, "This may take a while" subtext.

The static mock shows one frame, but the explicit requirement is "show processing progress," so this is extended (kept visually identical, just adding a live sub-label) with a small status line cycling through the actual pipeline stages, e.g.:
`Reading question paper (1/2)` → `Reading answer sheet (2/4 pages)` → `Mapping answers to questions` → `Grading responses` → `Finishing up`
plus a thin indeterminate/segmented progress bar under the sparkle icon. This is the one place the spec adds a sub-state beyond the literal static frame, because the requirement can't be satisfied by a single silent spinner if something fails halfway — the teacher needs to know which stage they were in.

On completion, transitions automatically to the Review & Mapping screen. On failure, shows an inline error state in the same panel (see §6.4) with a "Try again" action — no separate mock exists for this, styled consistently with the rest of the system (danger token, same layout).

### 3.3 Review & Mapping screen (desktop, ≥1024px)
Two-panel split, sidebar collapsed (matches §3.2's rail):

**Left — "Extracted Questions (from question paper)"** (white header, "Expand All" link, top-right)
Scrollable accordion list, one row per question **in original printed order**:
- Grey circular index badge with the **preserved original number** (`1`, `2`, … `11`, and sub-parts rendered as `11` + `a.` / `11` + `b.` as distinct rows — confirms sub-parts are separate entries, never merged).
- Question text.
- A right-aligned status pill:
  - Graded & answered → colored score pill, e.g. `4/5` (green ≥ ~80%, amber for partial, red for 0 or very low — see §6.2 for exact thresholds, since the mock doesn't state them).
  - Not graded / grading skipped → neutral "Answered" pill.
  - No matching answer found → grey **"Not Answered"** pill (extension beyond the mock, since the mock's sample data has no unanswered questions — see §7).
- Chevron to expand the row.

Expanding a row (clicking anywhere on it) does three things simultaneously:
1. Marks the row **selected** (orange left border, as shown for Q2 in the reference frame).
2. Reveals an "AI Feedback" block inline (short paragraph — only present when grading is enabled and an answer was matched).
3. Drives the right panel to the correct page and highlights the matched answer region(s) (see below). If the question is unanswered, the right panel shows a small inline note instead ("No matching answer found on the answer sheet") and nothing is highlighted.

**Right — "Answer Sheet"** (dark toolbar header, unlike the left panel — deliberate contrast so it reads as a document viewer):
Toolbar: zoom controls (`− 100% +`), page navigator (`‹ Page 1 of N ›`). Below: the actual answer-sheet page rendered as an image, natural handwriting-on-paper look, vertically scrollable within the panel.

**Highlighting:** the exact answer region for the selected question is drawn as a rounded-rectangle overlay directly on top of the page image, with a small corner tag repeating the question number (e.g. a green `Q2` tag on a green box). The overlay's color follows the same status coding as the score pill (green/amber/red), or a neutral color if grading is off — this keeps the color language consistent across the list and the viewer rather than introducing a second, unrelated color meaning.

**Multi-page answers:** if a question's matched content spans more than one page, selecting it auto-navigates the right panel to the first page containing content and shows a small "continues on page N" affordance; the page navigator lets the teacher step through every page that contains a highlighted region for that question.

**Unmatched answers:** any transcribed handwriting block that could not be confidently tied to a known question number is not silently dropped. It surfaces in a collapsible "Unmatched content" section below the question list (extension beyond the mock — see §7), showing the page/snippet, so the teacher isn't left wondering where a chunk of the answer sheet went.

### 3.4 Review & Mapping screen (mobile, <768px)
The two panels don't fit side by side, so the mock shows a segmented control — **Questions | Answer Sheet** — that swaps the single visible panel. Selecting a question on the Questions tab and then switching to the Answer Sheet tab shows that question's highlight already in view (state is shared across tabs, only the visible panel changes).

### 3.5 Grading summary (extension, no mock provided)
The assignment explicitly allows "a clear grading summary" but no mock exists for it. To stay consistent with the rest of the system rather than inventing a new visual language, this is a slim summary bar pinned above the question list (desktop) / a summary sheet reachable from a "Summary" button (mobile), showing: total score (`38/60`), counts of answered/unanswered/needs-review questions, and an optional short overall AI comment. It reuses the same pill/badge components already defined for per-question scores.

---

## 4. Functional Requirements → Acceptance Criteria

| # | Requirement (from brief) | Acceptance criteria |
|---|---|---|
| 1 | Upload both files, show processing progress | Both dropzones accept PDF/JPG/PNG ≤10MB; submit disabled until both present; processing screen shows live stage labels, not just a static spinner |
| 2 | Extract every question in correct printed order | Extracted list order matches the source document's visual top-to-bottom, left-to-right reading order, not any re-sorting by number |
| 3 | Labelled sub-parts are separate questions | `11(a)` and `11(b)` (any bracket/spacing style) render and are stored as two independent question entries, each individually mappable/gradable |
| 4 | Preserve original numbering | The `displayNumber` shown to the teacher is exactly what's printed (`11 (a)`, `Q.4`, `Section B – 2`, etc.), never renumbered sequentially by the system |
| 5 | Handle answers out of order | Mapping is done by matching the question label the student wrote, not by position/order on the page |
| 6 | Handle unanswered questions | Any question with no confidently matched answer block is flagged "Not Answered"; no highlight is shown when selected |
| 7 | Handle answers matching no question | Any answer block below the match-confidence threshold is placed in "Unmatched content" instead of being force-matched or dropped |
| 8 | Highlight exact answer region | Clicking a question draws a bounding-box overlay on the exact answer-sheet region, positioned from model-returned normalized coordinates |
| 9 | Answers spanning multiple pages | A single question can own answer blocks on 2+ pages; page nav exposes all of them, in order |
| 10 | Follow the Figma design | Layout, component shapes, color language, and states described in §2–3 are implemented; deviations are called out explicitly (§7) rather than silently invented |

---

## 5. Data Model

```ts
type Question = {
  id: string;                     // internal id, e.g. "q_11_a"
  displayNumber: string;          // exactly as printed, e.g. "11 (a)"
  parentNumber?: string;          // "11" when this is a sub-part
  subLabel?: string;              // "a" | "b" | ...
  text: string;                   // transcribed question text
  maxMarks?: number;               // if printed on the paper, else undefined
  page: number;                   // page index in the question paper (1-based)
  bbox: NormalizedBox;            // question's own location, for potential future use
  orderIndex: number;             // printed reading order — the array itself is kept in this order
};

type AnswerBlock = {
  id: string;
  rawLabel: string | null;        // what the student wrote, e.g. "Q11 a)" — null if no label detected
  normalizedKey: string | null;    // normalized form used for matching, e.g. "11a"
  transcribedText: string;
  page: number;                    // page index in the answer sheet (1-based)
  bbox: NormalizedBox;
  confidence: number;              // 0–1, model-reported or heuristic
};

type NormalizedBox = { x: number; y: number; width: number; height: number }; // all 0–1, relative to page image

type MatchStatus = "answered" | "unanswered";

type Mapping = {
  questionId: string;
  status: MatchStatus;
  answerBlockIds: string[];        // ordered, may span pages; empty if unanswered
};

type UnmatchedAnswer = {
  answerBlockId: string;
  reason: "no_label_detected" | "label_not_in_question_paper" | "low_confidence";
};

type GradeVerdict = "correct" | "partial" | "incorrect" | "ungraded";

type GradeResult = {
  questionId: string;
  verdict: GradeVerdict;
  score?: number;
  maxMarks?: number;
  feedback?: string;               // short, per-question
};

type AssessmentResult = {
  questions: Question[];
  answerBlocks: AnswerBlock[];
  mappings: Mapping[];
  unmatched: UnmatchedAnswer[];
  grades: GradeResult[];           // empty if grading is skipped
  answerSheetPages: { page: number; imageUrl: string; width: number; height: number }[];
  summary?: { totalScore: number; totalMax: number; answeredCount: number; unansweredCount: number; overallFeedback?: string };
};
```

`AssessmentResult` is the single object the client holds in memory for the entire review session — nothing else needs to be fetched again once processing completes.

---

## 6. API Contract

Four stateless endpoints, called in sequence by the client so each stage can update the processing screen. No server-side session/storage — every request is self-contained.

### 6.1 `POST /api/extract-questions`
Request: `{ images: { page: number; dataUrl: string }[] }` (already-rasterized question-paper pages, client-side)
Response: `{ questions: Question[] }`

### 6.2 `POST /api/extract-answers`
Request: `{ images: { page: number; dataUrl: string }[] }` (answer-sheet pages)
Response: `{ answerBlocks: AnswerBlock[] }`

### 6.3 `POST /api/map`
Request: `{ questions: Question[]; answerBlocks: AnswerBlock[] }`
Response: `{ mappings: Mapping[]; unmatched: UnmatchedAnswer[] }`
Pure logic + a small LLM assist for ambiguous cases (see IMPLEMENTATION.md §7) — no image calls, cheap and fast.

### 6.4 `POST /api/grade` (optional stage — only called if grading is enabled)
Request: `{ questions: Question[]; answerBlocks: AnswerBlock[]; mappings: Mapping[] }`
Response: `{ grades: GradeResult[]; summary: AssessmentResult["summary"] }`

### 6.5 Error shape (all endpoints)
`{ error: { stage: string; message: string; retryable: boolean } }` — surfaced by the processing screen's failure state (§3.2) and, if it happens mid-review (e.g. grading fails after mapping succeeded), degrades gracefully rather than losing everything already extracted.

---

## 7. Edge Cases & Explicit Extensions Beyond the Mock

The provided frames only show a "happy path" (every question answered, all high-to-mid scores, single-page answers visible). The following are reasoned extensions, kept visually consistent with the existing component language rather than introducing new patterns:

| Situation | Handling |
|---|---|
| Question with no matched answer | Grey "Not Answered" pill; selecting it shows an inline note in the viewer, no overlay drawn |
| Answer with no question match | Routed to a collapsible "Unmatched content" list under the questions panel |
| Ambiguous match (e.g. handwriting reads "l1(a)" vs "11(a)") | Normalization + fuzzy matching first (see IMPLEMENTATION.md); if still below confidence threshold, treated as unmatched rather than force-assigned |
| Grading disabled / API budget exceeded | Question rows show neutral "Answered" pill instead of a score pill; no AI Feedback block; core mapping/highlighting still fully functional |
| Processing failure mid-pipeline | Inline error + "Try again" in the same processing panel, styled with the danger token |
| Grading summary | New slim component, reusing existing pill styles (§3.5) — no mock existed for this |
| Score color thresholds | Assumed: ≥ 80% → success, 40–79% → warning, < 40% (incl. 0) → danger. Configurable constant, not hard-coded, since the source brief doesn't specify exact cutoffs |

---

## 8. Non-Functional Requirements

- **File limits:** PDF/JPG/PNG, ≤10MB per file (matches the mock's stated limit), multi-page PDFs supported for both files.
- **Browser support:** latest Chrome/Edge/Firefox/Safari, desktop-first with the mobile tabbed layout as a secondary target.
- **Accessibility:** status is never color-only — every pill also carries text (`4/5`, "Not Answered"), and the corner tag on a highlight always repeats the question number as text, not just color.
- **Performance target:** given the AI provider's free-tier throughput (documented in IMPLEMENTATION.md §6), a typical 2-page question paper + 4–6 page answer sheet should complete end-to-end in well under a minute; the processing screen's staged messaging exists precisely because this isn't instantaneous.
- **No persistence:** refreshing the browser loses the current session — acceptable per the assignment's "no database required" constraint; this is called out to the user in-product only if it becomes a real point of confusion (not required by the mock).

---

## 9. Open Assumptions (consolidated)

1. Design tokens (§2.4) are visually estimated from PNG exports, not read from Figma's inspector — expect minor color/spacing drift from the real file.
2. Sidebar items other than the assignment's actual flow are static/non-functional (§2.3).
3. The pink/yellow/green annotation rectangles in the upload frames are reviewer call-outs, not implemented UI (§2.2).
4. Processing-screen sub-stage progress text/bar is an addition on top of the single static "Extracting…" frame, required to satisfy "show processing progress" meaningfully (§3.2).
5. Unanswered-question, unmatched-answer, and grading-failure states are original extensions consistent with the existing design language (§7), since the sample data in the mock has no such cases.
6. Grading summary UI (§3.5) is a new, minimal component — no mock exists for it.
7. Score-to-color thresholds are a configurable assumption (§7), not specified in the brief or visible unambiguously in the mock.
