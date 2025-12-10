# CTO Notes (Active)

Keep only current open items here. Older notes live in `CTO-NOTES-archive.md`.

## Open items
- Shared quote/estimate PDF: build a dedicated print-only A4 layout for both “견적 확인용 페이지” and “공유된 견적 페이지”; capture only that layout (not the screen UI) for PDF.
- Supabase env: ensure service role key is configured; avoid disabling public fallback without env readiness.
- Analyze API: production-grade rate limiting/storage (current in-memory throttling is insufficient across instances).

## Action: Shared/Estimate PDF (print-only layout) - COMPLETED
- [x] Scope: both internal estimate view and shared quote view
- [x] 기존 `EstimatePrintView` 컴포넌트 활용 (A4 210mm 전용, RGB-only 색상)
- [x] shared quote 페이지: 숨겨진 `EstimatePrintView`를 `printRef`로 참조, 화면 UI와 분리
- [x] estimate 페이지: 이미 `EstimatePrintView` 사용 중
- [x] 제외 항목 반영: `printViewData`에 조정된 비용/기능 목록 전달
- [x] legacy-colors override, fonts.ready 대기, 실패 시 fallback UI - 이전 작업에서 완료

## Process
- If Claude marks a task as unnecessary/unclear in DEV-NOTES: review. If we agree, close here; if still required, restate why it matters with clearer instructions.
