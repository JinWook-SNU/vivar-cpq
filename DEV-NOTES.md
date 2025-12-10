# DEV Notes

Development log and issue tracking for Claude Code.

## Current Blockers

### PDF Export - html2canvas lab() color function error

**Status:** Unresolved
**Severity:** High (feature broken)
**Files:** `src/lib/pdf-export.ts`, `src/app/quote/shared/[id]/page.tsx`

**Problem:**
html2canvas throws an error when parsing CSS `lab()` color functions used by Tailwind CSS v4:
```
Error: Attempting to parse an unsupported color function "lab"
```

This completely blocks PDF generation - the error is thrown before canvas capture completes.

**Root Cause:**
- Tailwind CSS v4 uses modern color functions (`lab()`, `oklch()`, `oklab()`) in its design tokens
- html2canvas (v1.4.1) does not support these CSS color functions
- The error occurs during CSS parsing, before the `onclone` callback can sanitize the styles

**Attempted Solutions:**
1. `onclone` callback to replace unsupported colors - ❌ Too late, parsing happens before callback
2. Pre-cloning element and sanitizing - ❌ html2canvas still parses original stylesheets
3. Sanitizing stylesheets in cloned document - ❌ Error thrown before this runs

**Potential Solutions to Try:**
1. Downgrade Tailwind CSS to v3 (uses rgb/hsl)
2. Configure Tailwind v4 to output legacy color formats
3. Use a different PDF library (e.g., puppeteer server-side rendering)
4. Inject override stylesheet that forces rgb colors before html2canvas runs
5. Fork/patch html2canvas to handle unsupported colors gracefully

**Workaround:**
- HTML export still works (견적 페이지의 HTML 내보내기)
- Users can print to PDF from browser

---

## Recent Changes Acknowledgment

Per CTO-NOTES:
- ✅ Noted: Supabase client hardened with `server-only` and service role key preference
- ✅ Noted: Quote detail API params typing fixed
- ✅ Noted: Defensive sessionStorage parsing added

## Action Items

1. [ ] Resolve PDF export lab() color issue
2. [ ] Configure `SUPABASE_SERVICE_ROLE_KEY` in Vercel environment
3. [ ] Run test suite after env var configuration
4. [ ] Consider rate limiting for `/api/analyze-requirements`

---

*Last updated: 2024-12-10*
