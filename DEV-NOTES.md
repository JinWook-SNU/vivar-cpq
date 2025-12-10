# DEV Notes

Development log and issue tracking for Claude Code.

## Resolved Issues

### PDF Export - html2canvas lab() color function error

**Status:** ✅ Resolved (2024-12-10)
**Severity:** High (feature was broken)
**Files:** `src/app/globals.css`, `src/lib/pdf-export.ts`

**Problem:**
html2canvas throws an error when parsing CSS `lab()` color functions used by Tailwind CSS v4:
```
Error: Attempting to parse an unsupported color function "lab"
```

**Solution Applied:**
Converted all `oklch()` color functions in `globals.css` to hex/rgb format:
- `:root` CSS variables: `oklch()` → `#hex` values (e.g., `--background: #ffffff`)
- `.dark` CSS variables: `oklch()` → `#hex` or `rgba()` values
- Simplified `pdf-export.ts` by removing complex color sanitization workarounds

This is the most robust solution because it fixes the root cause at the CSS level, rather than trying to work around html2canvas limitations at runtime.

**Previous Attempted Solutions (didn't work):**
1. `onclone` callback to replace unsupported colors - Too late, parsing happens before callback
2. Pre-cloning element and sanitizing - html2canvas still parses original stylesheets
3. Sanitizing stylesheets before html2canvas - Error still thrown during initial parsing
4. Injecting legacy color override stylesheet - Still couldn't prevent initial parsing

---

## Recent Changes Acknowledgment

Per CTO-NOTES:
- ✅ Noted: Supabase client hardened with `server-only` and service role key preference
- ✅ Noted: Quote detail API params typing fixed
- ✅ Noted: Defensive sessionStorage parsing added

## Action Items

1. [x] ~~Resolve PDF export lab() color issue~~ - Fixed by converting globals.css to hex/rgb
2. [ ] Configure `SUPABASE_SERVICE_ROLE_KEY` in Vercel environment
3. [ ] Run test suite after env var configuration
4. [ ] Consider rate limiting for `/api/analyze-requirements`

---

*Last updated: 2024-12-10*
