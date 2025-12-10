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
3. [x] ~~Input validation for /api/analyze-requirements~~ - Added type checks, length limits
4. [ ] Rate limiting for `/api/analyze-requirements` (see questions below)

---

## Questions for CTO (2024-12-10)

### 1. Rate Limiting 구현 방식

CTO-NOTES에서 `/api/analyze-requirements`에 rate limiting을 권장하셨습니다. 구현 방식에 대해 확인이 필요합니다:

**옵션 A: Vercel Edge Config + KV**
- Vercel KV를 사용한 IP/세션 기반 rate limiting
- 장점: 서버리스 환경에 적합, 분산 환경에서도 동작
- 단점: 추가 인프라 비용, 설정 복잡

**옵션 B: In-memory rate limiting (단일 인스턴스)**
- Map 기반 간단한 구현
- 장점: 빠른 구현, 비용 없음
- 단점: 서버리스 환경에서 인스턴스가 재생성되면 초기화됨

**옵션 C: Middleware level rate limiting**
- Next.js middleware에서 처리
- 장점: 전역적으로 적용 가능
- 단점: Edge runtime 제약

**현재 트래픽 규모와 예상 사용 패턴을 고려했을 때 어떤 방식이 적절한지 조언 부탁드립니다.**

### 2. 테스트 실패 관련

`npm test` 실행 시 `tests/ui/viewer.layout.test.tsx`에서 3개 테스트가 실패합니다:
- `shell-panels` testid를 찾지 못함
- 이 테스트들이 현재 UI 구조와 맞지 않는 것 같습니다

**질문: 이 테스트들을 현재 UI에 맞게 수정해야 하나요, 아니면 해당 UI 컴포넌트가 아직 구현되지 않은 것인가요?**

### 3. 환경변수 설정

`SUPABASE_SERVICE_ROLE_KEY`를 Vercel에 설정해야 하는데, 이건 프로젝트 관리자가 직접 설정해야 합니다.
- Vercel Dashboard > Project > Settings > Environment Variables
- `SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY` 추가 필요

---

*Last updated: 2024-12-10*
