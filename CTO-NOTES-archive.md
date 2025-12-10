# CTO Notes (Archive)

Historic log moved from `CTO-NOTES.md` to keep the active file concise.

## What changed
- Hardened Supabase client to be server-only and prefer the service role key (falls back to the anon key for now). File: `src/lib/supabase.ts`
- Fixed quote detail API handler params typing to match Next conventions. File: `src/app/api/quotes/[id]/route.ts`
- Added defensive parsing around `sessionStorage` payloads on the estimate page to avoid runtime crashes when stored data is corrupted. File: `src/app/quote/estimate/page.tsx`

## Follow-ups / checks
- Configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the runtime environment; keep `NEXT_PUBLIC_*` only if the service key is unavailable.
- Run the API/UI test suite (`npm test`) once you wire up env vars to confirm nothing regressed.
- Consider adding basic input validation + rate limiting to `/api/analyze-requirements` (it currently trusts OpenAI responses and has no throttling).

## Dev sync 2024-12-10
- Blocking issue: html2canvas chokes on Tailwind v4 `lab()/oklch()` colors, so PDF export fails before `onclone` runs.
- Recommendation to Claude: sanitize styles *before* calling `html2canvas` by walking `document.styleSheets` in `exportElementToPDF` (outside `onclone`) and replacing unsupported color functions in `CSSStyleRule.style` via the existing `replaceUnsupportedColorInValue`. Skip cross-origin sheets with try/catch. This avoids the parser error that happens prior to `onclone`.
- If access to stylesheets is blocked, fall back to injecting a minimal override `<style data-pdf-legacy-colors>` before export that remaps only the classes used in the print view to RGB/HEX values (no `lab/oklch`), and remove it in `finally`.
- Longer-term: consider a build-time PostCSS pass (e.g., `@csstools/postcss-oklab-function` + `postcss-color-functional-notation`) to emit RGB fallbacks for production so html2canvas never sees modern color functions.

## 2024-12-10 PDF export error (lab()/oklch())
- Error still reproduces: `Attempting to parse an unsupported color function "lab"` from html2canvas before `onclone`.
- Root cause: Tailwind v4 injects modern color functions into global styles; html2canvas parses global `document.styleSheets` first, so our prior `onclone` sanitization was too late.
- Change applied: `sanitizeStyleSheets(document)` now runs at the start of `exportElementToPDF` to convert unsupported color functions in global styles before html2canvas parses them (`src/lib/pdf-export.ts`). Wrapped in try/catch to skip cross-origin sheets.
- If errors persist: add an inline `<style data-pdf-legacy-colors>` override with only the classes used in the print view, forcing RGB values; remove it in `finally`. As a last resort, downgrade Tailwind output or add PostCSS color fallback.

## Sync from DEV-NOTES (2024-12-10)
- Issue: html2canvas still throws on `lab()` despite sanitization. Likely cause is cross-origin/blocked stylesheets that skip our pre-pass; html2canvas will still parse them.
  - Action for Claude: add a scoped `<style data-pdf-legacy-colors>` injected before export to force RGB values for only the print view selectors; remove in `finally`. Keep pre-sanitization but fail loudly if `html2canvas` still throws so we get stack traces.
  - Optional: consider temporarily loading a “PDF-safe” stylesheet (no `lab/oklch`) just for export, swapping it in before capture.
- Env: still need `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` configured; avoid falling back to `NEXT_PUBLIC_*` in production. Consider a hard fail if service key is missing on server routes.
- Ops: `/api/analyze-requirements` lacks input/rate limits. Add body size cap and simple throttling or auth.
