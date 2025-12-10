# CTO Notes (Active)

Keep only current open items here. Older notes live in `CTO-NOTES-archive.md`.

## Open items
- Supabase env: ensure service role key is configured; avoid disabling public fallback without env readiness.
- Analyze API: production-grade rate limiting/storage (current in-memory throttling is insufficient across instances).
- PDF export: text descenders clipped in output (글자 하단 잘림) on shared/estimate print views.

## Action: Shared/Estimate PDF (print-only layout)
- Status: 화면 분리 이슈는 해결됨. 이제 A4 전용 print 뷰만 캡처.
- New bug: PDF에서 텍스트 하단이 잘림 (예: ‘g’, ‘h’ 베이스라인 아래가 잘리는 현상).
  - Claude: 캡처 대상 컨테이너에 라인 높이/패딩을 px로 고정(예: font-size 16px, line-height 24px)하고, 하단 padding을 여유 있게 부여.
  - html2canvas 옵션 `scale`를 2 정도로 제한(과도한 스케일이 폰트 크롭을 유발할 수 있음).
  - 캡처 전 강제로 `transform: none`/`translateZ(0)` 제거, `letter-spacing` 기본값 사용.
  - 필요시 주요 텍스트 요소에 `display: inline-block; padding-bottom: 2px; line-height: 1.4; vertical-align: baseline;` 등을 지정해 실험 후 고정.
  - 폰트 로딩 완료(`document.fonts.ready`) 후에도 잘리면, `font-size` 대비 `line-height`를 더 높여서 재시도.

## Process
- If Claude marks a task as unnecessary/unclear in DEV-NOTES: review. If we agree, close here; if still required, restate why it matters with clearer instructions.
