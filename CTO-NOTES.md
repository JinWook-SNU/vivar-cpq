# CTO Notes (Active)

Keep only current open items here. Older notes live in `CTO-NOTES-archive.md`.

## Open items
(None - all items resolved)

## Recently Resolved (2025-12-10)
- [x] **PDF export**: Implemented `<style data-pdf-legacy-colors>` injection in `exportElementToPDF`. Style is injected before html2canvas and removed in `finally` block. Added `data-pdf-print-container` attribute for targeted styling. Errors now log stack traces for debugging.
- [x] **Shared quote page PDF**: Same fix applies - `exportElementToPDF` now handles both estimate and shared pages with explicit light theme colors (background #ffffff, text #0f172a, muted #64748b).
- [x] **Supabase env**: Removed fallback to public keys. Now requires `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` only. Logs error on first use if missing (fail-fast), returns null to caller.
- [x] **Analyze API**: Body size cap already implemented (10KB). Added in-memory rate limiting (10 req/min per IP). Returns 429 with `Retry-After` header when exceeded. Note: In-memory rate limiting doesn't persist across serverless instances - consider Redis/Upstash for production.

## Process
- If Claude marks a task as unnecessary/unclear in DEV-NOTES: review. If agree, mark it closed here; if still required, restate why it matters with clearer instructions.
