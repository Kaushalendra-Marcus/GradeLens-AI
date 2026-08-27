# Task: Fix critical bugs found in code review

A review of the current codebase found one product-breaking bug and several smaller gaps. Fix in the order below — the first one is the only thing that actually blocks the app from working with a real API key.

## 1. CRITICAL — wrong Groq model is used for vision calls

`lib/groq/client.ts` defaults to model `"qwen/qwen3-32b"`. This model is **text-only** on Groq — it does not accept image inputs. The actual vision-capable model (the one that supports `image_url` content, JSON mode, and OCR/handwriting tasks) is **`qwen/qwen3.6-27b`**. Confirm this yourself against Groq's current docs (`console.groq.com/docs/vision` and the model card for `qwen/qwen3.6-27b`) before changing anything, since Groq's lineup changes over time — don't just take this file's word for it.

Both `lib/extraction/questionExtraction.ts` and `lib/extraction/answerExtraction.ts` call `groqChatCompletion({ model: configuredModel(), ... })` and attach `image_url` content — so right now, with a real `GROQ_API_KEY` set, both extraction calls will fail as soon as they hit Groq, because the configured model can't read images.

Fix:
- Change the default in `configuredModel()` (and wherever else `"qwen/qwen3-32b"` appears as a hardcoded default) to `"qwen/qwen3.6-27b"`.
- Update `.env.local.example`'s suggested `GROQ_MODEL` value to match.
- Update `README.md` (currently states `qwen/qwen3-32b` as the model used) to reflect the corrected model.
- `qwen/qwen3.6-27b` also handles plain text input fine, so grading (`lib/grading/grader.ts`) and any text-only mapping calls can keep using the same configured model — no need for a second model config unless you find a reason to split them.
- Verify by actually calling `/api/extract-questions` with one real image and a real key (ask me for a key + a sample scanned question-paper image if you need one) — confirm you get back a non-empty `questions` array with plausible content, not a 400/model error.

## 2. Missing tier in the mapping algorithm — restore the LLM escalation step

`lib/mapping/matcher.ts` currently only has two matching tiers: exact normalized-key match, then Levenshtein/confusable-substitution match (distance ≤1). Anything that fails both goes straight to `unmatched`. The intended design had a third tier in between: for answer blocks that fail deterministic matching but have a `rawLabel` reasonably close to more than one question, or have no label but non-trivial transcribed content, escalate to a small **text-only** Groq call (same model, no images) that's given the answer's transcribed text plus the 2–3 closest candidate questions' text, and asks it to pick the best match or say none fit. Only escalate the genuinely ambiguous cases — this should be a handful of calls per document, not one per answer block.

Add this as a new function (e.g. `lib/mapping/llmEscalation.ts`), call it from `app/api/map/route.ts` after the deterministic passes in `runMapping` leave some blocks unresolved, and only fall through to `unmatched` if the escalation call also fails to find a confident match.

## 3. No automated tests exist

Add a test runner (Vitest is the natural fit for a Next.js/TS project — pick it unless you have a specific reason to prefer something else, and say why if so) and write unit tests for:
- `lib/mapping/normalize.ts` → `normalizeLabel`: cover `"11 (a)"`, `"Q11 a)"`, `"11.a"`, `"2."`, and at least one messy/whitespace case.
- `lib/mapping/matcher.ts` → `runMapping`: exact match, confusable-substitution match (e.g. `"l1a"` → `"11a"`), Levenshtein-1 match, an ambiguous case that should land in `unmatched`, out-of-order answer blocks still mapping correctly by label rather than position, and multi-page answer blocks grouping into one ordered `Mapping.answerBlockIds`.
- `lib/groq/rateLimiter.ts` → `callWithRateLimit`: calls are spaced at least `MIN_INTERVAL_MS` apart, a simulated 429 triggers backoff and retry, and it throws after `maxRetries` is exhausted.

Don't try to unit-test real Groq network calls — mock the client boundary instead. Add a `"test": "vitest run"` script to `package.json`.

## 4. Verify against real scanned documents

Once the model fix (§1) is in, this has never actually been tested against real handwriting — everything so far has run in mock mode (no `.env.local` exists yet). Ask me for a real `GROQ_API_KEY` and 1–2 real scanned question-paper + answer-sheet pairs, run the full pipeline through the actual UI, and report back specifically: does extraction succeed without errors, do the bounding-box highlights roughly land on the correct handwritten regions, and does mapping correctly identify at least the answers the student clearly labeled. Fix whatever you find — transcription quality, bbox drift, mismapping — rather than treating a clean build as "done."

## 5. Deployment-readiness check (don't actually deploy)

Confirm `.gitignore` excludes `.env.local`, confirm the four API routes' `maxDuration` settings are suf1ficient for a real multi-page extraction sequence, and otherwise leave deployment alone — that's still gated on me connecting my own Vercel account.

## When to stop and ask me
- Before switching to a different vision provider/model entirely (as opposed to correcting the model name within Groq).
- Before deploying to Vercel.
- If, once you've actually tested against real handwriting, the batching size (2 images/request) or rate-limiter timing needs to change — tell me what you found first.

## Definition of done for this fix pass
- A real call to `/api/extract-questions` and `/api/extract-answers` with a valid `GROQ_API_KEY` succeeds against a real image and returns plausible structured content — not a model/image-support error.
- The LLM-escalation mapping tier exists and is exercised by at least one test with a mocked response.
- `normalizeLabel`, `runMapping`, and `callWithRateLimit` all have passing unit tests via `npm test`.
- `README.md` and `.env.local.example` state the corrected model.
- `npm run build` still succeeds with no type errors.
