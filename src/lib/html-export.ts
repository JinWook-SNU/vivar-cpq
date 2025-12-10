// HTML 내보내기 유틸리티
import type { PrintViewData, RoleSchedule } from "@/components/quote/EstimatePrintView"

const qualityGradeLabels: Record<string, string> = {
  excellent: "최상",
  good: "양호",
  fair: "보통",
  "needs-work": "개선 필요",
}

// 역할별 색상 (HTML용)
const ROLE_COLORS: Record<string, { bg: string; border: string; bar: string }> = {
  projectManager: { bg: "#f5f3ff", border: "#c4b5fd", bar: "#8b5cf6" },
  designer: { bg: "#fdf2f8", border: "#f9a8d4", bar: "#ec4899" },
  xrDeveloper: { bg: "#eff6ff", border: "#93c5fd", bar: "#3b82f6" },
  systemEngineer: { bg: "#ecfdf5", border: "#6ee7b7", bar: "#10b981" },
}

// 간트 차트 HTML 생성 (자동 스케일)
function generateGanttChartHTML(roleSchedules: RoleSchedule[], totalDays: number): string {
  const weeks = Math.ceil(totalDays / 5)

  // 자동 스케일 계산
  // 목표: 차트 영역이 약 600-750px 정도가 되도록 조정
  const targetChartWidth = 700
  const labelWidth = 140
  const availableWidth = targetChartWidth - labelWidth

  // 프로젝트 기간에 따른 표시 모드 결정
  const useWeeklyScale = totalDays > 30 // 30일 초과 시 주간 단위

  let unitWidth: number // 단위당 픽셀
  let markers: { position: number; label: string }[]
  let gridLines: number[] // 그리드 라인 위치 (단위 기준)

  if (useWeeklyScale) {
    // 주간 단위 스케일
    unitWidth = Math.max(availableWidth / weeks, 60) // 주당 최소 60px
    markers = Array.from({ length: weeks + 1 }, (_, i) => ({
      position: i,
      label: i === 0 ? '시작' : `${i}주`
    }))
    gridLines = Array.from({ length: weeks }, (_, i) => i + 1)
  } else if (totalDays > 15) {
    // 중간 프로젝트: 2일 간격
    unitWidth = Math.max(availableWidth / totalDays, 20)
    const interval = 2
    markers = Array.from(
      { length: Math.ceil(totalDays / interval) + 1 },
      (_, i) => i * interval
    ).filter(d => d <= totalDays).map(d => ({
      position: d,
      label: d === 0 ? '시작' : `${d}일`
    }))
    gridLines = Array.from({ length: weeks }, (_, i) => (i + 1) * 5).filter(d => d <= totalDays)
  } else {
    // 짧은 프로젝트: 일 단위
    unitWidth = Math.max(availableWidth / totalDays, 30)
    markers = Array.from({ length: totalDays + 1 }, (_, i) => ({
      position: i,
      label: i === 0 ? '시작' : `${i}일`
    }))
    gridLines = Array.from({ length: weeks }, (_, i) => (i + 1) * 5).filter(d => d <= totalDays)
  }

  // 실제 차트 너비 계산
  const chartWidth = useWeeklyScale
    ? weeks * unitWidth + labelWidth + 20
    : totalDays * unitWidth + labelWidth + 20

  // 위치 계산 헬퍼 함수
  const getPosition = (day: number) => useWeeklyScale ? (day / 5) * unitWidth : day * unitWidth
  const getBarWidth = (duration: number) => {
    const width = useWeeklyScale ? (duration / 5) * unitWidth : duration * unitWidth
    return Math.max(width - 4, 30)
  }

  return `
    <!-- 개발 일정 타임라인 -->
    <div class="card">
      <div class="card-header">
        <div class="card-header-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
        </div>
        <div>
          <div class="card-title">개발 일정 타임라인</div>
          <div class="card-description">예상 작업 일정 (총 ${totalDays}일, 약 ${weeks}주)${useWeeklyScale ? ' • 주간 단위 표시' : ''}</div>
        </div>
      </div>
      <div class="card-content" style="padding:0;overflow-x:auto;">
        <div style="min-width:${chartWidth}px;">
          <!-- 범례 -->
          <div style="display:flex;gap:16px;padding:12px 16px;border-bottom:1px solid #e2e8f0;flex-wrap:wrap;">
            ${roleSchedules.map(schedule => `
              <div style="display:flex;align-items:center;gap:6px;">
                <div style="width:12px;height:12px;border-radius:3px;background:${ROLE_COLORS[schedule.role]?.bar || '#6b7280'};"></div>
                <span style="font-size:12px;color:#64748b;">${schedule.roleName}</span>
              </div>
            `).join('')}
          </div>

          <!-- 헤더 -->
          <div style="display:flex;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
            <div style="width:${labelWidth}px;flex-shrink:0;padding:12px 16px;background:#f1f5f9;border-right:1px solid #e2e8f0;font-weight:500;font-size:13px;color:#475569;">
              담당
            </div>
            <div style="flex:1;position:relative;height:36px;">
              ${markers.map(m => `
                <div style="position:absolute;left:${m.position * unitWidth}px;height:100%;display:flex;align-items:center;justify-content:center;">
                  <span style="font-size:11px;font-weight:500;color:#64748b;">${m.label}</span>
                </div>
              `).join('')}
              ${useWeeklyScale
                ? gridLines.map(week => `
                    <div style="position:absolute;left:${week * unitWidth}px;top:0;height:100%;border-left:2px dashed #cbd5e1;"></div>
                  `).join('')
                : gridLines.map(day => `
                    <div style="position:absolute;left:${day * unitWidth}px;top:0;height:100%;border-left:2px dashed #cbd5e1;"></div>
                  `).join('')
              }
            </div>
          </div>

          <!-- 역할별 스케줄 -->
          ${roleSchedules.map((schedule, rowIndex) => `
            <div style="display:flex;border-bottom:1px solid #f1f5f9;${rowIndex % 2 === 0 ? '' : 'background:#fafafa;'}">
              <div style="width:${labelWidth}px;flex-shrink:0;padding:12px 16px;border-right:1px solid #e2e8f0;display:flex;align-items:center;gap:8px;background:${ROLE_COLORS[schedule.role]?.bg || '#f9fafb'};">
                <div style="width:4px;height:24px;border-radius:2px;background:${ROLE_COLORS[schedule.role]?.bar || '#6b7280'};"></div>
                <span style="font-weight:500;font-size:13px;color:#374151;">${schedule.roleName}</span>
              </div>
              <div style="flex:1;position:relative;height:52px;padding:8px 0;">
                ${markers.map(m => `
                  <div style="position:absolute;left:${m.position * unitWidth}px;top:0;height:100%;border-left:1px solid #f1f5f9;"></div>
                `).join('')}
                ${useWeeklyScale
                  ? gridLines.map(week => `
                      <div style="position:absolute;left:${week * unitWidth}px;top:0;height:100%;border-left:2px dashed #e2e8f0;"></div>
                    `).join('')
                  : gridLines.map(day => `
                      <div style="position:absolute;left:${day * unitWidth}px;top:0;height:100%;border-left:2px dashed #e2e8f0;"></div>
                    `).join('')
                }
                ${schedule.tasks.map(task => {
                  const barLeft = getPosition(task.startDay)
                  const barWidth = getBarWidth(task.duration)
                  return `
                    <div style="position:absolute;left:${barLeft + 2}px;top:50%;transform:translateY(-50%);width:${barWidth}px;height:28px;background:${ROLE_COLORS[schedule.role]?.bar || '#6b7280'};border-radius:4px;display:flex;align-items:center;padding:0 8px;box-shadow:0 1px 2px rgba(0,0,0,0.1);">
                      <span style="font-size:11px;font-weight:500;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${task.name}</span>
                    </div>
                  `
                }).join('')}
              </div>
            </div>
          `).join('')}

          <!-- 마일스톤 -->
          <div style="display:flex;background:#f8fafc;border-top:1px solid #e2e8f0;">
            <div style="width:${labelWidth}px;flex-shrink:0;padding:8px 16px;border-right:1px solid #e2e8f0;font-size:12px;color:#64748b;font-weight:500;">
              마일스톤
            </div>
            <div style="flex:1;position:relative;height:32px;">
              <div style="position:absolute;left:4px;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:4px;">
                <div style="width:8px;height:8px;border-radius:50%;background:#22c55e;"></div>
                <span style="font-size:11px;color:#16a34a;font-weight:500;">착수</span>
              </div>
              ${(() => {
                const qaTask = roleSchedules.flatMap(s => s.tasks).find(t => t.name === "QA 및 피드백 반영")
                if (qaTask) {
                  const qaPosition = getPosition(qaTask.startDay)
                  return `
                    <div style="position:absolute;left:${qaPosition}px;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:4px;">
                      <div style="width:8px;height:8px;border-radius:50%;background:#f59e0b;"></div>
                      <span style="font-size:11px;color:#d97706;font-weight:500;">검수</span>
                    </div>
                  `
                }
                return ''
              })()}
              <div style="position:absolute;left:${getPosition(totalDays) - 30}px;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:4px;">
                <div style="width:8px;height:8px;border-radius:50%;background:#3b82f6;"></div>
                <span style="font-size:11px;color:#2563eb;font-weight:500;">납품</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

export function generateEstimateHTML(data: PrintViewData): string {
  const weeks = Math.ceil(data.totalDays / 5)

  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>프로젝트 견적서 - ${data.companyName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      color: #1e293b;
      line-height: 1.6;
      padding: 40px 20px;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
    }

    .badge {
      display: inline-block;
      background: #1e293b;
      color: white;
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 16px;
    }

    .header h1 {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .header p {
      color: #64748b;
      font-size: 14px;
    }

    .card {
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      margin-bottom: 24px;
      overflow: hidden;
    }

    .card-header {
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .card-header-icon {
      width: 40px;
      height: 40px;
      background: #f1f5f9;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-header-icon svg {
      width: 20px;
      height: 20px;
      color: #3b82f6;
    }

    .card-title {
      font-size: 16px;
      font-weight: 600;
    }

    .card-description {
      font-size: 13px;
      color: #64748b;
    }

    .card-content {
      padding: 24px;
    }

    /* 견적 요약 카드 */
    .summary-card {
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      color: white;
    }

    .summary-total {
      text-align: center;
      padding: 32px 24px;
    }

    .summary-total .amount {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .summary-total .label {
      font-size: 13px;
      color: #94a3b8;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      padding: 24px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }

    .summary-item {
      text-align: center;
    }

    .summary-item .value {
      font-size: 24px;
      font-weight: 600;
    }

    .summary-item .label {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 4px;
    }

    /* 프로젝트 개요 */
    .overview-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .overview-item {
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
    }

    .overview-item .label {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 4px;
    }

    .overview-item .value {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }

    /* 테이블 스타일 */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    thead {
      background: #f8fafc;
    }

    th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 500;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
    }

    th:last-child {
      text-align: right;
    }

    td {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
    }

    td:last-child {
      text-align: right;
      font-weight: 500;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tfoot {
      background: #f8fafc;
    }

    tfoot td {
      font-weight: 600;
      border-top: 2px solid #e2e8f0;
    }

    /* 비용 행 */
    .cost-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .cost-row:last-child {
      border-bottom: none;
    }

    .cost-row .label {
      color: #64748b;
    }

    .cost-row .value {
      font-weight: 500;
    }

    .cost-row.total {
      background: #1e293b;
      color: white;
      margin: 16px -24px -24px;
      padding: 16px 24px;
      font-size: 16px;
    }

    .cost-row.total .value {
      font-weight: 700;
      font-size: 18px;
    }

    /* 3D 전처리 */
    .preprocessing-card {
      border-color: #06b6d4;
    }

    .preprocessing-card .card-header {
      background: #ecfeff;
    }

    .preprocessing-card .card-header-icon {
      background: #cffafe;
    }

    .preprocessing-card .card-header-icon svg {
      color: #0891b2;
    }

    .preprocessing-info {
      background: #ecfeff;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .preprocessing-info .filename {
      font-weight: 600;
      margin-bottom: 4px;
    }

    .preprocessing-info .meta {
      font-size: 13px;
      color: #0891b2;
    }

    /* AI 분석 */
    .ai-card {
      border-color: #a855f7;
    }

    .ai-card .card-header {
      background: #faf5ff;
    }

    .ai-card .card-header-icon {
      background: #f3e8ff;
    }

    .ai-card .card-header-icon svg {
      color: #9333ea;
    }

    .ai-summary {
      background: #faf5ff;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      font-size: 14px;
      color: #7c3aed;
    }

    /* 기능 목록 */
    .feature-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .feature-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f1f5f9;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: #475569;
    }

    .feature-badge .dot {
      width: 6px;
      height: 6px;
      background: #3b82f6;
      border-radius: 50%;
    }

    /* 푸터 */
    .footer {
      text-align: center;
      padding: 32px 0;
      color: #94a3b8;
      font-size: 13px;
      border-top: 1px solid #e2e8f0;
      margin-top: 40px;
    }

    /* 색상 */
    .text-cyan { color: #0891b2; }
    .text-purple { color: #9333ea; }
    .text-green { color: #16a34a; }

    /* 안내문구 */
    .notice {
      background: #fffbeb;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .notice-title {
      font-weight: 600;
      color: #b45309;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .notice-text {
      font-size: 13px;
      color: #92400e;
    }

    /* 인쇄 스타일 */
    @media print {
      body {
        background: white;
        padding: 0;
      }

      .card {
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 헤더 -->
    <div class="header">
      <span class="badge">견적서</span>
      <h1>3D 컨피규레이터 개발 견적서</h1>
      <p>${data.companyName} - ${data.productCategory} 컨피규레이터</p>
    </div>

    <!-- 견적 요약 -->
    <div class="card summary-card">
      <div class="summary-total">
        ${data.discount ? `
        <div style="text-decoration:line-through;color:#94a3b8;font-size:20px;margin-bottom:4px;">${data.discount.originalTotal.toLocaleString()}원</div>
        ` : ''}
        <div class="amount">${data.totalCost.toLocaleString()}원</div>
        <div class="label">VAT 포함 총 견적 금액</div>
        ${data.discount ? `
        <div style="margin-top:12px;display:inline-block;background:#fecaca;color:#b91c1c;padding:6px 16px;border-radius:9999px;font-size:13px;font-weight:600;">
          ${data.discount.discountPercentage}% 할인 (-${data.discount.totalDiscount.toLocaleString()}원)
        </div>
        ` : ''}
      </div>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="value">${data.featureCount}</div>
          <div class="label">개발 기능</div>
        </div>
        <div class="summary-item">
          <div class="value">${data.totalDays}일</div>
          <div class="label">예상 기간</div>
        </div>
        <div class="summary-item">
          <div class="value">${weeks}주</div>
          <div class="label">예상 주수</div>
        </div>
        <div class="summary-item">
          <div class="value">${data.teamCount}명</div>
          <div class="label">투입 인력</div>
        </div>
      </div>
    </div>

    <!-- 프로젝트 개요 -->
    <div class="card">
      <div class="card-header">
        <div class="card-header-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>
        </div>
        <div>
          <div class="card-title">프로젝트 개요</div>
          <div class="card-description">견적 요청 기본 정보</div>
        </div>
      </div>
      <div class="card-content">
        <div class="overview-grid">
          <div class="overview-item">
            <div class="label">고객사</div>
            <div class="value">${data.companyName}</div>
          </div>
          <div class="overview-item">
            <div class="label">제품 카테고리</div>
            <div class="value">${data.productCategory}</div>
          </div>
          <div class="overview-item">
            <div class="label">제품 수량</div>
            <div class="value">${data.productCount}개</div>
          </div>
          <div class="overview-item">
            <div class="label">견적일</div>
            <div class="value">${data.date}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 비용 내역 -->
    <div class="card">
      <div class="card-header">
        <div class="card-header-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><path d="M8 10h8"/><path d="M8 14h8"/></svg>
        </div>
        <div>
          <div class="card-title">비용 내역</div>
          <div class="card-description">개발 비용 상세 내역</div>
        </div>
      </div>
      <div class="card-content">
        <!-- 인건비 원가 -->
        <div class="cost-row">
          <span class="label">인건비 원가</span>
          <span class="value">${data.laborCost.toLocaleString()}원</span>
        </div>
        <!-- 인건비 하위 항목들 (AI 분석이 있을 때만 표시) -->
        ${(data.aiAnalysisCost || 0) > 0 ? `
        <div style="border-left:3px solid #e2e8f0;margin-left:8px;padding-left:16px;">
          <div class="cost-row">
            <span class="label" style="color:#64748b;">기본 옵션 개발</span>
            <span class="value" style="color:#64748b;">${(data.laborCost - (data.aiAnalysisCost || 0)).toLocaleString()}원</span>
          </div>
          <div class="cost-row">
            <span class="label text-purple">추가 요구사항 개발</span>
            <span class="value text-purple">${(data.aiAnalysisCost || 0).toLocaleString()}원</span>
          </div>
        </div>
        ` : ''}
        <!-- 제경비 -->
        <div class="cost-row">
          <span class="label">제경비 (110%)</span>
          <span class="value">${data.overhead.toLocaleString()}원</span>
        </div>
        <!-- 기술료 -->
        <div class="cost-row">
          <span class="label">기술료 (20%)</span>
          <span class="value">${data.technicalFee.toLocaleString()}원</span>
        </div>
        ${data.discount ? `
        <div class="cost-row" style="background:#fef2f2;margin:0 -24px;padding:12px 24px;">
          <span class="label" style="color:#b91c1c;display:flex;align-items:center;gap:8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            할인 적용
            ${data.discount.overheadDiscount ? `<span style="font-size:11px;background:#fecaca;padding:2px 6px;border-radius:4px;">제경비 ${data.discount.overheadDiscount.rate}%</span>` : ''}
            ${data.discount.techFeeDiscount ? `<span style="font-size:11px;background:#fecaca;padding:2px 6px;border-radius:4px;">기술료 ${data.discount.techFeeDiscount.rate}%</span>` : ''}
          </span>
          <span class="value" style="color:#b91c1c;font-weight:600;">-${data.discount.totalDiscount.toLocaleString()}원</span>
        </div>
        ` : ''}
        ${data.preprocessing3DCost > 0 ? `
        <div class="cost-row">
          <span class="label text-cyan">3D 데이터 전처리 (${data.productCount}개)</span>
          <span class="value text-cyan">${data.preprocessing3DCost.toLocaleString()}원</span>
        </div>
        ` : ''}
        <div class="cost-row">
          <span class="label">소계</span>
          <span class="value">${data.subtotal.toLocaleString()}원</span>
        </div>
        <div class="cost-row">
          <span class="label">부가가치세 (10%)</span>
          <span class="value">${data.vat.toLocaleString()}원</span>
        </div>
        ${data.truncationDiscount > 0 ? `
        <div class="cost-row">
          <span class="label text-green">절사</span>
          <span class="value text-green">-${data.truncationDiscount.toLocaleString()}원</span>
        </div>
        ` : ''}
        <div class="cost-row total">
          <span class="label">총 견적 금액</span>
          <span class="value">${data.totalCost.toLocaleString()}원</span>
        </div>
      </div>
    </div>

    <!-- 개발 기능 목록 -->
    <div class="card">
      <div class="card-header">
        <div class="card-header-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>
        </div>
        <div>
          <div class="card-title">개발 기능 목록</div>
          <div class="card-description">컨피규레이터에 포함되는 기능 (${data.featureCount}개)</div>
        </div>
      </div>
      <div class="card-content" style="padding:0;">
        <div style="display:flex;flex-direction:column;">
          ${data.features.map((f, i) => `
            <div style="padding:16px 24px;border-bottom:1px solid #f1f5f9;${i % 2 === 1 ? 'background:#fafafa;' : ''}">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <span style="font-weight:500;color:#1e293b;">${f.name}</span>
                </div>
                <span style="font-weight:600;color:#3b82f6;">${f.cost.toLocaleString()}원</span>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:8px;">
                ${f.roles.map(r => `
                  <span style="display:inline-flex;align-items:center;gap:4px;background:#f1f5f9;padding:4px 10px;border-radius:6px;font-size:12px;color:#475569;">
                    <span style="font-weight:500;">${r.role}</span>
                    <span style="color:#94a3b8;">|</span>
                    <span>${r.days}일</span>
                  </span>
                `).join('')}
              </div>
            </div>
          `).join('')}
          <!-- 합계 -->
          <div style="padding:16px 24px;background:#f8fafc;border-top:2px solid #e2e8f0;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:600;color:#1e293b;">기본 옵션 개발 합계</span>
              <span style="font-weight:700;color:#3b82f6;font-size:18px;">${data.features.reduce((sum, f) => sum + f.cost, 0).toLocaleString()}원</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 투입 인력 -->
    <div class="card">
      <div class="card-header">
        <div class="card-header-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div>
          <div class="card-title">투입 인력 구성</div>
          <div class="card-description">프로젝트 담당 인력</div>
        </div>
      </div>
      <div class="card-content" style="padding:0;">
        <table>
          <thead>
            <tr>
              <th>담당</th>
              <th style="text-align:right;">투입 기간</th>
            </tr>
          </thead>
          <tbody>
            ${data.personnel.map(p => `
            <tr>
              <td>${p.role}</td>
              <td style="text-align:right;">${p.days}일</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    ${data.file3DAnalysis ? `
    <!-- 3D 데이터 전처리 -->
    <div class="card preprocessing-card">
      <div class="card-header">
        <div class="card-header-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
        </div>
        <div>
          <div class="card-title">3D 데이터 전처리</div>
          <div class="card-description">3D 모델 최적화 및 웹 호환 처리</div>
        </div>
      </div>
      <div class="card-content">
        <div class="preprocessing-info">
          <div class="filename">${data.file3DAnalysis.fileName}</div>
          <div class="meta">${data.file3DAnalysis.format} • ${data.file3DAnalysis.fileSizeFormatted} • 품질 등급: ${qualityGradeLabels[data.file3DAnalysis.qualityGrade] || data.file3DAnalysis.qualityGrade}</div>
        </div>
        <div class="cost-row">
          <span class="label">제품당 전처리</span>
          <span class="value">${data.file3DAnalysis.unitCost.toLocaleString()}원 × ${data.productCount}개</span>
        </div>
        <div class="cost-row" style="background:#ecfeff;margin:0 -24px;padding:12px 24px;border-radius:8px;">
          <span class="label" style="font-weight:600;color:#0891b2;">전처리 비용</span>
          <span class="value" style="font-size:16px;color:#0891b2;">${data.preprocessing3DCost.toLocaleString()}원</span>
        </div>
      </div>
    </div>
    ` : ''}

    ${data.aiAnalysis ? `
    <!-- 추가 요구사항 -->
    <div class="card ai-card">
      <div class="card-header">
        <div class="card-header-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
        </div>
        <div>
          <div class="card-title">추가 요구사항 개발</div>
          <div class="card-description">기타 요구사항 분석 결과</div>
        </div>
      </div>
      <div class="card-content">
        <div class="ai-summary">
          ${data.aiAnalysis.summary}
        </div>
        <table>
          <thead>
            <tr>
              <th>개발 항목</th>
              <th style="text-align:right;">예상 기간</th>
              <th style="text-align:right;">개발 단가</th>
            </tr>
          </thead>
          <tbody>
            ${data.aiAnalysis.tasks.map((t, i) => `
            <tr style="background:${i % 2 === 1 ? '#faf5ff' : 'white'}">
              <td style="font-weight:500;">${t.name}</td>
              <td style="text-align:right;">${t.days}일</td>
              <td style="text-align:right;color:#9333ea;font-weight:500;">${t.cost.toLocaleString()}원</td>
            </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background:#faf5ff;">
              <td style="font-weight:600;color:#7c3aed;">합계</td>
              <td style="text-align:right;font-weight:600;color:#7c3aed;">${data.aiAnalysis.tasks.reduce((sum, t) => sum + t.days, 0)}일</td>
              <td style="text-align:right;font-weight:600;color:#7c3aed;">${data.aiAnalysisCost.toLocaleString()}원</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
    ` : ''}

    ${data.timeline && data.timeline.roleSchedules.length > 0 ? generateGanttChartHTML(data.timeline.roleSchedules, data.timeline.totalDays) : ''}

    ${data.maintenance ? `
    <!-- 서비스 유지비 -->
    <div class="card" style="border:2px solid #10b981;">
      <div class="card-header" style="background:#ecfdf5;">
        <div class="card-header-icon" style="background:#d1fae5;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
        </div>
        <div style="flex:1;">
          <div class="card-title" style="display:flex;align-items:center;gap:8px;">
            서비스 유지비
            <span style="background:#10b981;color:white;padding:2px 8px;border-radius:4px;font-size:12px;">${data.maintenance.planName}</span>
          </div>
          <div class="card-description">연간 서버 운영 및 유지보수</div>
        </div>
        <div style="text-align:right;">
          ${data.maintenance.firstYearFree ? `
            <p style="color:#64748b;text-decoration:line-through;font-size:14px;">연 ${(data.maintenance.annualCost / 10000).toLocaleString()}만원</p>
            <p style="color:#10b981;font-weight:700;font-size:20px;">1년차 무료</p>
          ` : `
            <p style="color:#10b981;font-weight:700;font-size:20px;">연 ${(data.maintenance.annualCost / 10000).toLocaleString()}만원</p>
          `}
        </div>
      </div>
      <div class="card-content">
        <!-- 플랜 개요 -->
        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;margin-bottom:24px;">
          <div style="padding:16px;background:#ecfdf5;border-radius:8px;text-align:center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 8px;"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            <p style="font-weight:700;font-size:20px;color:#059669;">${data.maintenance.ticketsPerYear}</p>
            <p style="font-size:12px;color:#64748b;">연간 지원 티켓</p>
          </div>
          <div style="padding:16px;background:#ecfdf5;border-radius:8px;text-align:center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 8px;"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            <p style="font-weight:700;font-size:20px;color:#059669;">${data.maintenance.managerHoursPerMonth}시간</p>
            <p style="font-size:12px;color:#64748b;">월 유지관리</p>
          </div>
          <div style="padding:16px;background:#ecfdf5;border-radius:8px;text-align:center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 8px;"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>
            <p style="font-weight:700;font-size:20px;color:#059669;">${(Object.values(data.maintenance.serverCosts).reduce((a, b) => a + b, 0) / 10000).toFixed(1)}만</p>
            <p style="font-size:12px;color:#64748b;">월 서버 비용</p>
          </div>
          <div style="padding:16px;background:#ecfdf5;border-radius:8px;text-align:center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 8px;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <p style="font-weight:700;font-size:20px;color:#059669;">${((data.maintenance.annualCost - Object.values(data.maintenance.serverCosts).reduce((a, b) => a + b, 0) * 12) / 10000).toLocaleString()}만</p>
            <p style="font-size:12px;color:#64748b;">연 인건비</p>
          </div>
        </div>

        <!-- 서비스 상세 -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
          <div>
            <h4 style="font-weight:600;font-size:14px;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              유지보수 서비스
            </h4>
            <ul style="list-style:none;padding:0;margin:0;font-size:13px;color:#64748b;">
              <li style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                에러 조치 및 버그 수정
              </li>
              <li style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                환경 변화 대응 (브라우저, OS 업데이트)
              </li>
              <li style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                경미한 변경 사항 반영
              </li>
              <li style="display:flex;align-items:center;gap:8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                담당 매니저 월 ${data.maintenance.managerHoursPerMonth}시간 투입
              </li>
            </ul>
          </div>
          <div>
            <h4 style="font-weight:600;font-size:14px;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>
              서버 비용 상세 (월 기준)
            </h4>
            <div style="font-size:13px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <span style="color:#64748b;">Route53 + Vercel 웹 호스팅</span>
                <span>${data.maintenance.serverCosts.webHosting.toLocaleString()}원</span>
              </div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <span style="color:#64748b;">AWS S3 모델 파일 스토리지</span>
                <span>${data.maintenance.serverCosts.storage.toLocaleString()}원</span>
              </div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <span style="color:#64748b;">AWS 3D 렌더링 인스턴스</span>
                <span>${data.maintenance.serverCosts.rendering.toLocaleString()}원</span>
              </div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <span style="color:#64748b;">AWS 주문 연동 서버</span>
                <span>${data.maintenance.serverCosts.orderServer.toLocaleString()}원</span>
              </div>
              <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
                <span style="color:#64748b;">Supabase DB</span>
                <span>${data.maintenance.serverCosts.database.toLocaleString()}원</span>
              </div>
              <div style="border-top:1px solid #e2e8f0;padding-top:8px;display:flex;justify-content:space-between;font-weight:600;">
                <span>월 서버 비용 합계</span>
                <span style="color:#10b981;">${Object.values(data.maintenance.serverCosts).reduce((a, b) => a + b, 0).toLocaleString()}원</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 비용 요약 -->
        <div style="margin-top:24px;padding:16px;background:#f8fafc;border-radius:8px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px;">
            <span style="color:#64748b;">연간 서버 비용 (월 ${Object.values(data.maintenance.serverCosts).reduce((a, b) => a + b, 0).toLocaleString()}원 × 12)</span>
            <span>${(Object.values(data.maintenance.serverCosts).reduce((a, b) => a + b, 0) * 12).toLocaleString()}원</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:10px;">
            <span style="color:#64748b;">연간 유지관리 인건비</span>
            <span>${(data.maintenance.annualCost - Object.values(data.maintenance.serverCosts).reduce((a, b) => a + b, 0) * 12).toLocaleString()}원</span>
          </div>
          <div style="border-top:1px solid #e2e8f0;padding-top:10px;display:flex;justify-content:space-between;font-weight:600;">
            <span>연간 유지비 합계</span>
            <span style="color:#10b981;font-size:16px;">${data.maintenance.annualCost.toLocaleString()}원</span>
          </div>
        </div>

        ${data.maintenance.firstYearFree ? `
        <!-- 1년차 면제 혜택 -->
        <div style="margin-top:16px;padding:16px;border:2px dashed #10b981;border-radius:8px;background:#ecfdf5;">
          <div style="display:flex;align-items:center;gap:8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="m7.5 8-1.26-2.83a1 1 0 0 1 .19-1.09L10 1l2 3 2-3 3.57 3.08a1 1 0 0 1 .19 1.09L16.5 8"/></svg>
            <div>
              <p style="font-weight:600;color:#059669;">1년차 유지비 면제 적용</p>
              <p style="font-size:13px;color:#64748b;">개발 계약 시 1년차 유지비가 면제됩니다 (-${data.maintenance.annualCost.toLocaleString()}원)</p>
            </div>
          </div>
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}

    <!-- 안내사항 -->
    <div class="notice">
      <div class="notice-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        안내사항
      </div>
      <div class="notice-text">
        본 견적서는 제공된 요구사항을 기반으로 산출된 예상 금액입니다.
        상세 협의 과정에서 요구사항 변경 시 금액이 조정될 수 있습니다.
        견적 유효기간은 발행일로부터 30일입니다.
      </div>
    </div>

    <!-- 푸터 -->
    <div class="footer" style="text-align:left;padding:32px 0;">
      <table style="width:100%;max-width:500px;margin:0 auto;border-collapse:collapse;font-size:13px;">
        <tbody>
          <tr>
            <td style="padding:8px 12px;color:#64748b;width:100px;border-bottom:1px solid #e2e8f0;">발행 주체</td>
            <td style="padding:8px 12px;font-weight:500;color:#1e293b;border-bottom:1px solid #e2e8f0;">(주)플래닝고</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;color:#64748b;border-bottom:1px solid #e2e8f0;">사업자번호</td>
            <td style="padding:8px 12px;font-weight:500;color:#1e293b;border-bottom:1px solid #e2e8f0;">276-81-01871</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;color:#64748b;border-bottom:1px solid #e2e8f0;">대표자</td>
            <td style="padding:8px 12px;font-weight:500;color:#1e293b;border-bottom:1px solid #e2e8f0;">신진욱</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;color:#64748b;border-bottom:1px solid #e2e8f0;">발행인</td>
            <td style="padding:8px 12px;font-weight:500;color:#1e293b;border-bottom:1px solid #e2e8f0;">신진욱</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;color:#64748b;border-bottom:1px solid #e2e8f0;">발행일</td>
            <td style="padding:8px 12px;font-weight:500;color:#1e293b;border-bottom:1px solid #e2e8f0;">${data.date}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;color:#64748b;">문의</td>
            <td style="padding:8px 12px;font-weight:500;color:#1e293b;">
              010-2083-2941<br>
              <a href="mailto:jw@planningo.io" style="color:#3b82f6;text-decoration:none;">jw@planningo.io</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>
`
  return html
}

export function downloadHTML(html: string, filename: string): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
