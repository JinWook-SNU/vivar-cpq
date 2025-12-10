"use client"

import { forwardRef } from "react"

// 타임라인 관련 타입
export interface ScheduledTask {
  name: string
  role: string
  startDay: number
  duration: number
}

export interface RoleSchedule {
  role: string
  roleName: string
  tasks: ScheduledTask[]
}

export interface PrintViewData {
  companyName: string
  productCategory: string
  date: string
  totalCost: number
  featureCount: number
  totalDays: number
  teamCount: number
  laborCost: number
  overhead: number
  technicalFee: number
  subtotal: number
  vat: number
  truncationDiscount: number
  preprocessing3DCost: number
  preprocessing3DUnitCost: number
  productCount: number
  aiAnalysisCost: number
  personnel: {
    role: string
    days: number
    dailyRate: number
    totalCost: number
  }[]
  features: {
    name: string
    cost: number
    allocation: string
    roles: {
      role: string
      days: number
      dailyRate: number
      cost: number
    }[]
  }[]
  file3DAnalysis?: {
    fileName: string
    format: string
    fileSizeFormatted: string
    qualityGrade: string
    unitCost: number
  }
  aiAnalysis?: {
    summary: string
    complexity: string
    tasks: {
      name: string
      category: string
      days: number
      cost: number
    }[]
  }
  timeline?: {
    roleSchedules: RoleSchedule[]
    totalDays: number
  }
  discount?: {
    originalTotal: number
    totalDiscount: number
    discountPercentage: number
    overheadDiscount?: { rate: number; amount: number }
    techFeeDiscount?: { rate: number; amount: number }
  }
  maintenance?: {
    planName: string
    annualCost: number
    ticketsPerYear: number
    managerHoursPerMonth: number
    serverCosts: {
      webHosting: number
      storage: number
      rendering: number
      orderServer: number
      database: number
    }
    firstYearFree: boolean
  }
}

interface EstimatePrintViewProps {
  data: PrintViewData
}

const qualityGradeLabels: Record<string, string> = {
  excellent: "최상",
  good: "양호",
  fair: "보통",
  "needs-work": "개선 필요",
}

// 색상 상수 (html2canvas 호환용 - oklch 대신 hex/rgb 사용)
const colors = {
  white: "#ffffff",
  slate50: "#f8fafc",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate300: "#cbd5e1",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1e293b",
  slate900: "#0f172a",
  red50: "#fef2f2",
  red100: "#fee2e2",
  red500: "#ef4444",
  red700: "#b91c1c",
  cyan50: "#ecfeff",
  cyan700: "#0e7490",
  purple50: "#faf5ff",
  purple700: "#7c3aed",
  emerald50: "#ecfdf5",
  emerald500: "#10b981",
  emerald600: "#059669",
  emerald700: "#047857",
}

// A4 페이지 크기 (96dpi 기준)
const PAGE_WIDTH = 794
const PAGE_HEIGHT = 1123
const PAGE_PADDING = 48

// 페이지 컨테이너 스타일
const pageStyle: React.CSSProperties = {
  width: `${PAGE_WIDTH}px`,
  minHeight: `${PAGE_HEIGHT}px`,
  padding: `${PAGE_PADDING}px`,
  fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
  backgroundColor: colors.white,
  color: colors.slate900,
  boxSizing: "border-box",
  overflow: "visible",
  lineHeight: "1.6", // 글자 하단 잘림 방지
  letterSpacing: "normal", // CTO: 기본값 사용
  transform: "none", // CTO: transform 제거
}

// 텍스트 요소 기본 스타일 (descender 잘림 방지)
const textStyle: React.CSSProperties = {
  display: "inline-block",
  paddingBottom: "2px",
  verticalAlign: "baseline",
}

// 페이지 푸터 (회사 정보)
const PageFooter = () => (
  <div style={{
    marginTop: "auto",
    paddingTop: "24px",
    borderTop: `1px solid ${colors.slate200}`,
    textAlign: "center",
    fontSize: "11px",
    color: colors.slate500,
  }}>
    <p style={{ fontWeight: "600", color: colors.slate700, marginBottom: "2px" }}>(주)플래닝고</p>
    <p>사업자번호: 276-81-01871 | 대표자: 신진욱 | 문의: 010-2083-2941 | jw@planningo.io</p>
  </div>
)

// 섹션 제목 컴포넌트
const SectionTitle = ({ children, color = colors.slate800 }: { children: React.ReactNode; color?: string }) => (
  <h3 style={{
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  }}>
    <div style={{ width: "4px", height: "18px", backgroundColor: color, borderRadius: "2px" }}></div>
    {children}
  </h3>
)

export const EstimatePrintView = forwardRef<HTMLDivElement, EstimatePrintViewProps>(
  ({ data }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ========== 페이지 1: 헤더 + 요약 + 비용 내역 ========== */}
        <div style={{ ...pageStyle, display: "flex", flexDirection: "column" }}>
          {/* 헤더 */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "24px",
            paddingBottom: "16px",
            borderBottom: `2px solid ${colors.slate800}`,
          }}>
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: "bold", color: colors.slate800, marginBottom: "2px" }}>
                프로젝트 견적서
              </h1>
              <p style={{ color: colors.slate500, fontSize: "12px" }}>3D Configurator Development Estimate</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "12px", color: colors.slate500 }}>발행일</p>
              <p style={{ fontWeight: "600", fontSize: "14px" }}>{data.date}</p>
            </div>
          </div>

          {/* 고객 정보 */}
          <div style={{
            marginBottom: "20px",
            padding: "12px 16px",
            backgroundColor: colors.slate50,
            borderRadius: "6px",
          }}>
            <p style={{ fontSize: "11px", color: colors.slate500, marginBottom: "4px" }}>고객사</p>
            <p style={{ fontSize: "16px", fontWeight: "600" }}>{data.companyName}</p>
            <p style={{ fontSize: "12px", color: colors.slate500 }}>{data.productCategory} 컨피규레이터</p>
          </div>

          {/* 견적 요약 */}
          <div style={{
            marginBottom: "24px",
            padding: "20px",
            backgroundColor: colors.slate800,
            color: colors.white,
            borderRadius: "8px",
          }}>
            <p style={{ fontSize: "12px", color: colors.slate400, marginBottom: "4px" }}>총 견적 금액</p>
            {data.discount && (
              <p style={{ fontSize: "16px", color: colors.slate400, textDecoration: "line-through", marginBottom: "2px" }}>
                {data.discount.originalTotal.toLocaleString()}원
              </p>
            )}
            <p style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "4px" }}>
              {data.totalCost.toLocaleString()}원
            </p>
            <p style={{ fontSize: "11px", color: colors.slate400 }}>VAT 포함</p>

            {data.discount && (
              <span style={{
                display: "inline-block",
                marginTop: "8px",
                backgroundColor: colors.red500,
                padding: "3px 10px",
                borderRadius: "9999px",
                fontSize: "12px",
                fontWeight: "600",
              }}>
                {data.discount.discountPercentage}% 할인 (-{data.discount.totalDiscount.toLocaleString()}원)
              </span>
            )}

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px",
              marginTop: "16px",
              paddingTop: "12px",
              borderTop: `1px solid ${colors.slate600}`,
            }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "16px", fontWeight: "600", lineHeight: "24px", ...textStyle }}>{data.featureCount}</p>
                <p style={{ fontSize: "10px", color: colors.slate400, lineHeight: "16px", ...textStyle }}>기능 수</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "16px", fontWeight: "600", lineHeight: "24px", ...textStyle }}>{data.totalDays}</p>
                <p style={{ fontSize: "10px", color: colors.slate400, lineHeight: "16px", ...textStyle }}>예상 일수</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "16px", fontWeight: "600", lineHeight: "24px", ...textStyle }}>{data.teamCount}</p>
                <p style={{ fontSize: "10px", color: colors.slate400, lineHeight: "16px", ...textStyle }}>투입 인력</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "16px", fontWeight: "600", lineHeight: "24px", ...textStyle }}>{Math.ceil(data.totalDays / 5)}</p>
                <p style={{ fontSize: "10px", color: colors.slate400, lineHeight: "16px", ...textStyle }}>예상 주수</p>
              </div>
            </div>
          </div>

          {/* 비용 상세 */}
          <div style={{ marginBottom: "24px" }}>
            <SectionTitle>비용 산출 내역</SectionTitle>
            <div style={{ border: `1px solid ${colors.slate200}`, borderRadius: "6px", overflow: "hidden" }}>
              <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
                <tbody>
                  <tr style={{ borderBottom: `1px solid ${colors.slate200}` }}>
                    <td style={{ padding: "10px 14px", color: colors.slate600 }}>인건비 원가</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "500" }}>{data.laborCost.toLocaleString()}원</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${colors.slate200}` }}>
                    <td style={{ padding: "10px 14px", color: colors.slate600 }}>제경비 (110%)</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "500" }}>{data.overhead.toLocaleString()}원</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${colors.slate200}` }}>
                    <td style={{ padding: "10px 14px", color: colors.slate600 }}>기술료 (20%)</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "500" }}>{data.technicalFee.toLocaleString()}원</td>
                  </tr>
                  {data.discount && (
                    <tr style={{ borderBottom: `1px solid ${colors.slate200}`, backgroundColor: colors.red50 }}>
                      <td style={{ padding: "10px 14px", color: colors.red700 }}>
                        할인 적용
                        {data.discount.overheadDiscount && (
                          <span style={{ marginLeft: "6px", fontSize: "10px", backgroundColor: colors.red100, padding: "2px 6px", borderRadius: "3px" }}>
                            제경비 {data.discount.overheadDiscount.rate}%
                          </span>
                        )}
                        {data.discount.techFeeDiscount && (
                          <span style={{ marginLeft: "4px", fontSize: "10px", backgroundColor: colors.red100, padding: "2px 6px", borderRadius: "3px" }}>
                            기술료 {data.discount.techFeeDiscount.rate}%
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "600", color: colors.red700 }}>
                        -{data.discount.totalDiscount.toLocaleString()}원
                      </td>
                    </tr>
                  )}
                  {data.preprocessing3DCost > 0 && (
                    <tr style={{ borderBottom: `1px solid ${colors.slate200}`, backgroundColor: colors.cyan50 }}>
                      <td style={{ padding: "10px 14px", color: colors.cyan700 }}>
                        3D 전처리 ({data.productCount}개 × {data.preprocessing3DUnitCost.toLocaleString()}원)
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "500", color: colors.cyan700 }}>
                        {data.preprocessing3DCost.toLocaleString()}원
                      </td>
                    </tr>
                  )}
                  {data.aiAnalysisCost > 0 && (
                    <tr style={{ borderBottom: `1px solid ${colors.slate200}`, backgroundColor: colors.purple50 }}>
                      <td style={{ padding: "10px 14px", color: colors.purple700 }}>AI 분석 요구사항</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "500", color: colors.purple700 }}>
                        {data.aiAnalysisCost.toLocaleString()}원
                      </td>
                    </tr>
                  )}
                  <tr style={{ borderBottom: `1px solid ${colors.slate200}` }}>
                    <td style={{ padding: "10px 14px", color: colors.slate600 }}>소계 (VAT 제외)</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "500" }}>{data.subtotal.toLocaleString()}원</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${colors.slate200}` }}>
                    <td style={{ padding: "10px 14px", color: colors.slate600 }}>부가가치세 (10%)</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "500" }}>{data.vat.toLocaleString()}원</td>
                  </tr>
                  {data.truncationDiscount > 0 && (
                    <tr style={{ borderBottom: `1px solid ${colors.slate200}` }}>
                      <td style={{ padding: "10px 14px", color: colors.emerald600 }}>절사금</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "500", color: colors.emerald600 }}>
                        -{data.truncationDiscount.toLocaleString()}원
                      </td>
                    </tr>
                  )}
                  <tr style={{ backgroundColor: colors.slate800 }}>
                    <td style={{ padding: "12px 14px", color: colors.white, fontWeight: "600" }}>총 견적 금액</td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: "bold", fontSize: "16px", color: colors.white }}>
                      {data.totalCost.toLocaleString()}원
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 안내사항 */}
          <div style={{
            padding: "12px 14px",
            backgroundColor: colors.slate50,
            borderRadius: "6px",
            borderLeft: `3px solid ${colors.slate400}`,
            marginBottom: "20px",
          }}>
            <h4 style={{ fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: colors.slate700 }}>안내사항</h4>
            <ul style={{ fontSize: "11px", color: colors.slate600, paddingLeft: "14px", margin: 0 }}>
              <li style={{ marginBottom: "2px" }}>본 견적서는 제공된 요구사항을 기반으로 산출된 예상 금액입니다.</li>
              <li style={{ marginBottom: "2px" }}>상세 협의 과정에서 요구사항 변경 시 금액이 조정될 수 있습니다.</li>
              <li>견적 유효기간은 발행일로부터 30일입니다.</li>
            </ul>
          </div>

          <PageFooter />
        </div>

        {/* ========== 페이지 2: 포함 기능 + 유지비 ========== */}
        <div style={{ ...pageStyle, display: "flex", flexDirection: "column" }}>
          {/* 포함 기능 */}
          <div style={{ marginBottom: "24px" }}>
            <SectionTitle>포함 기능 ({data.featureCount}개)</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px" }}>
              {data.features.map((feature, index) => (
                <div
                  key={index}
                  style={{
                    padding: "10px 12px",
                    backgroundColor: colors.slate50,
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.emerald500} strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span style={{ fontSize: "12px", fontWeight: "500" }}>{feature.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3D 파일 분석 정보 */}
          {data.file3DAnalysis && (
            <div style={{ marginBottom: "24px" }}>
              <SectionTitle color={colors.cyan700}>3D 파일 분석</SectionTitle>
              <div style={{
                padding: "14px",
                backgroundColor: colors.cyan50,
                borderRadius: "6px",
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "12px",
              }}>
                <div>
                  <p style={{ fontSize: "10px", color: colors.slate500 }}>파일명</p>
                  <p style={{ fontWeight: "500", fontSize: "12px" }}>{data.file3DAnalysis.fileName}</p>
                </div>
                <div>
                  <p style={{ fontSize: "10px", color: colors.slate500 }}>포맷</p>
                  <p style={{ fontWeight: "500", fontSize: "12px" }}>{data.file3DAnalysis.format}</p>
                </div>
                <div>
                  <p style={{ fontSize: "10px", color: colors.slate500 }}>파일 크기</p>
                  <p style={{ fontWeight: "500", fontSize: "12px" }}>{data.file3DAnalysis.fileSizeFormatted}</p>
                </div>
                <div>
                  <p style={{ fontSize: "10px", color: colors.slate500 }}>품질 등급</p>
                  <p style={{ fontWeight: "500", fontSize: "12px" }}>{qualityGradeLabels[data.file3DAnalysis.qualityGrade] || data.file3DAnalysis.qualityGrade}</p>
                </div>
              </div>
            </div>
          )}

          {/* AI 분석 결과 */}
          {data.aiAnalysis && data.aiAnalysis.tasks.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <SectionTitle color={colors.purple700}>AI 분석 요구사항</SectionTitle>
              <div style={{ padding: "12px", backgroundColor: colors.purple50, borderRadius: "6px", marginBottom: "12px" }}>
                <p style={{ fontSize: "12px", color: colors.slate600, marginBottom: "6px" }}>{data.aiAnalysis.summary}</p>
                <span style={{
                  fontSize: "10px",
                  backgroundColor: colors.purple700,
                  color: colors.white,
                  padding: "2px 6px",
                  borderRadius: "3px",
                }}>
                  복잡도: {data.aiAnalysis.complexity}
                </span>
              </div>
              <div style={{ border: `1px solid ${colors.slate200}`, borderRadius: "6px", overflow: "hidden" }}>
                <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: colors.slate50 }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: "600" }}>개발 항목</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: "600" }}>예상 기간</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.aiAnalysis.tasks.map((task, index) => (
                      <tr key={index} style={{ borderTop: `1px solid ${colors.slate200}` }}>
                        <td style={{ padding: "8px 12px" }}>
                          <span style={{ fontWeight: "500" }}>{task.name}</span>
                          <span style={{
                            marginLeft: "6px",
                            fontSize: "9px",
                            backgroundColor: colors.purple50,
                            color: colors.purple700,
                            padding: "1px 4px",
                            borderRadius: "2px",
                          }}>
                            {task.category}
                          </span>
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "right", color: colors.slate600 }}>
                          {task.days}일
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 유지비 정보 */}
          {data.maintenance && (
            <div style={{ marginBottom: "24px" }}>
              <SectionTitle color={colors.emerald600}>
                서비스 유지비
                <span style={{
                  marginLeft: "8px",
                  fontSize: "10px",
                  backgroundColor: colors.emerald500,
                  color: colors.white,
                  padding: "2px 6px",
                  borderRadius: "3px",
                }}>
                  {data.maintenance.planName}
                </span>
              </SectionTitle>
              <div style={{
                padding: "14px",
                backgroundColor: colors.emerald50,
                borderRadius: "6px",
                border: `1px solid ${colors.emerald500}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div>
                    <p style={{ fontSize: "12px", color: colors.slate600 }}>연간 유지비</p>
                    {data.maintenance.firstYearFree ? (
                      <>
                        <p style={{ fontSize: "14px", color: colors.slate400, textDecoration: "line-through" }}>
                          {data.maintenance.annualCost.toLocaleString()}원
                        </p>
                        <p style={{ fontSize: "20px", fontWeight: "bold", color: colors.emerald600 }}>1년차 무료</p>
                      </>
                    ) : (
                      <p style={{ fontSize: "20px", fontWeight: "bold", color: colors.emerald600 }}>
                        {data.maintenance.annualCost.toLocaleString()}원
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "20px" }}>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: "18px", fontWeight: "bold", color: colors.emerald700, lineHeight: "28px", ...textStyle }}>{data.maintenance.ticketsPerYear}</p>
                      <p style={{ fontSize: "10px", color: colors.slate500, lineHeight: "16px", ...textStyle }}>연간 티켓</p>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: "18px", fontWeight: "bold", color: colors.emerald700, lineHeight: "28px", ...textStyle }}>{data.maintenance.managerHoursPerMonth}h</p>
                      <p style={{ fontSize: "10px", color: colors.slate500, lineHeight: "16px", ...textStyle }}>월 유지관리</p>
                    </div>
                  </div>
                </div>
                {data.maintenance.firstYearFree && (
                  <div style={{
                    padding: "10px",
                    backgroundColor: colors.white,
                    borderRadius: "4px",
                    border: `1px dashed ${colors.emerald500}`,
                  }}>
                    <p style={{ fontWeight: "600", color: colors.emerald600, fontSize: "12px" }}>1년차 유지비 면제 적용</p>
                    <p style={{ fontSize: "11px", color: colors.slate500 }}>
                      개발 계약 시 1년차 유지비가 면제됩니다 (-{data.maintenance.annualCost.toLocaleString()}원)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <PageFooter />
        </div>
      </div>
    )
  }
)

EstimatePrintView.displayName = "EstimatePrintView"
