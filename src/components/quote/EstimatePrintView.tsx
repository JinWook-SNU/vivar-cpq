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

// 페이지 나눔 방지 스타일
const noBreakStyle: React.CSSProperties = {
  pageBreakInside: "avoid",
  breakInside: "avoid",
}

export const EstimatePrintView = forwardRef<HTMLDivElement, EstimatePrintViewProps>(
  ({ data }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: "794px", // A4 at 96dpi
          minHeight: "1123px", // A4 height at 96dpi
          padding: "48px", // ~15mm
          fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
          backgroundColor: colors.white,
          color: colors.slate900,
          boxSizing: "border-box",
        }}
      >
        {/* 헤더 */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "32px",
          paddingBottom: "24px",
          borderBottom: `2px solid ${colors.slate800}`,
        }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", color: colors.slate800, marginBottom: "4px" }}>
              프로젝트 견적서
            </h1>
            <p style={{ color: colors.slate500, fontSize: "14px" }}>3D Configurator Development Estimate</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "14px", color: colors.slate500 }}>발행일</p>
            <p style={{ fontWeight: "600" }}>{data.date}</p>
          </div>
        </div>

        {/* 고객 정보 */}
        <div style={{
          marginBottom: "32px",
          padding: "16px",
          backgroundColor: colors.slate50,
          borderRadius: "8px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.slate600} strokeWidth="2">
              <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
              <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
              <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
              <path d="M10 6h4"/>
              <path d="M10 10h4"/>
              <path d="M10 14h4"/>
              <path d="M10 18h4"/>
            </svg>
            <span style={{ fontSize: "14px", color: colors.slate500 }}>고객사</span>
          </div>
          <p style={{ fontSize: "18px", fontWeight: "600" }}>{data.companyName}</p>
          <p style={{ fontSize: "14px", color: colors.slate500 }}>{data.productCategory} 컨피규레이터</p>
        </div>

        {/* 견적 요약 */}
        <div style={{
          marginBottom: "32px",
          padding: "24px",
          backgroundColor: colors.slate800, // 그라데이션 대신 단색 (html2canvas 호환)
          color: colors.white,
          borderRadius: "8px",
          ...noBreakStyle,
        }}>
          <h2 style={{ fontSize: "14px", fontWeight: "500", color: colors.slate300, marginBottom: "8px" }}>
            총 견적 금액
          </h2>
          {data.discount && (
            <p style={{ fontSize: "20px", color: colors.slate400, textDecoration: "line-through", marginBottom: "4px" }}>
              {data.discount.originalTotal.toLocaleString()}원
            </p>
          )}
          <p style={{ fontSize: "30px", fontWeight: "bold", marginBottom: "8px" }}>
            {data.totalCost.toLocaleString()}원
          </p>
          <p style={{ fontSize: "12px", color: colors.slate400 }}>VAT 포함</p>
          {data.discount && (
            <div style={{
              marginTop: "12px",
              display: "inline-block",
              backgroundColor: colors.red500,
              color: colors.white,
              padding: "4px 12px",
              borderRadius: "9999px",
              fontSize: "14px",
              fontWeight: "600",
            }}>
              {data.discount.discountPercentage}% 할인 (-{data.discount.totalDiscount.toLocaleString()}원)
            </div>
          )}

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: `1px solid ${colors.slate600}`,
          }}>
            <div style={{ textAlign: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.slate400} strokeWidth="2" style={{ margin: "0 auto 4px" }}>
                <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/>
                <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/>
                <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>
              </svg>
              <p style={{ fontSize: "18px", fontWeight: "600" }}>{data.featureCount}</p>
              <p style={{ fontSize: "12px", color: colors.slate400 }}>기능 수</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.slate400} strokeWidth="2" style={{ margin: "0 auto 4px" }}>
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <p style={{ fontSize: "18px", fontWeight: "600" }}>{data.totalDays}</p>
              <p style={{ fontSize: "12px", color: colors.slate400 }}>예상 일수</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.slate400} strokeWidth="2" style={{ margin: "0 auto 4px" }}>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <p style={{ fontSize: "18px", fontWeight: "600" }}>{data.teamCount}</p>
              <p style={{ fontSize: "12px", color: colors.slate400 }}>투입 인력</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.slate400} strokeWidth="2" style={{ margin: "0 auto 4px" }}>
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                <line x1="16" x2="16" y1="2" y2="6"/>
                <line x1="8" x2="8" y1="2" y2="6"/>
                <line x1="3" x2="21" y1="10" y2="10"/>
              </svg>
              <p style={{ fontSize: "18px", fontWeight: "600" }}>{Math.ceil(data.totalDays / 5)}</p>
              <p style={{ fontSize: "12px", color: colors.slate400 }}>예상 주수</p>
            </div>
          </div>
        </div>

        {/* 비용 상세 */}
        <div style={{ marginBottom: "32px", ...noBreakStyle }}>
          <h3 style={{
            fontSize: "18px",
            fontWeight: "600",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <div style={{ width: "4px", height: "20px", backgroundColor: colors.slate800, borderRadius: "2px" }}></div>
            비용 산출 내역
          </h3>
          <div style={{ border: `1px solid ${colors.slate200}`, borderRadius: "8px", overflow: "hidden" }}>
            <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
              <tbody>
                <tr style={{ borderBottom: `1px solid ${colors.slate200}` }}>
                  <td style={{ padding: "12px 16px", color: colors.slate600 }}>인건비 원가</td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "500" }}>{data.laborCost.toLocaleString()}원</td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${colors.slate200}` }}>
                  <td style={{ padding: "12px 16px", color: colors.slate600 }}>제경비 (110%)</td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "500" }}>{data.overhead.toLocaleString()}원</td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${colors.slate200}` }}>
                  <td style={{ padding: "12px 16px", color: colors.slate600 }}>기술료 (20%)</td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "500" }}>{data.technicalFee.toLocaleString()}원</td>
                </tr>
                {data.discount && (
                  <tr style={{ borderBottom: `1px solid ${colors.slate200}`, backgroundColor: colors.red50 }}>
                    <td style={{ padding: "12px 16px", color: colors.red700 }}>
                      할인 적용
                      {data.discount.overheadDiscount && (
                        <span style={{ marginLeft: "8px", fontSize: "12px", backgroundColor: colors.red100, padding: "2px 8px", borderRadius: "4px" }}>
                          제경비 {data.discount.overheadDiscount.rate}%
                        </span>
                      )}
                      {data.discount.techFeeDiscount && (
                        <span style={{ marginLeft: "4px", fontSize: "12px", backgroundColor: colors.red100, padding: "2px 8px", borderRadius: "4px" }}>
                          기술료 {data.discount.techFeeDiscount.rate}%
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "600", color: colors.red700 }}>
                      -{data.discount.totalDiscount.toLocaleString()}원
                    </td>
                  </tr>
                )}
                {data.preprocessing3DCost > 0 && (
                  <tr style={{ borderBottom: `1px solid ${colors.slate200}`, backgroundColor: colors.cyan50 }}>
                    <td style={{ padding: "12px 16px", color: colors.cyan700 }}>
                      3D 전처리 ({data.productCount}개 × {data.preprocessing3DUnitCost.toLocaleString()}원)
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "500", color: colors.cyan700 }}>
                      {data.preprocessing3DCost.toLocaleString()}원
                    </td>
                  </tr>
                )}
                {data.aiAnalysisCost > 0 && (
                  <tr style={{ borderBottom: `1px solid ${colors.slate200}`, backgroundColor: colors.purple50 }}>
                    <td style={{ padding: "12px 16px", color: colors.purple700 }}>AI 분석 요구사항</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "500", color: colors.purple700 }}>
                      {data.aiAnalysisCost.toLocaleString()}원
                    </td>
                  </tr>
                )}
                <tr style={{ borderBottom: `1px solid ${colors.slate200}` }}>
                  <td style={{ padding: "12px 16px", color: colors.slate600 }}>소계 (VAT 제외)</td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "500" }}>{data.subtotal.toLocaleString()}원</td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${colors.slate200}` }}>
                  <td style={{ padding: "12px 16px", color: colors.slate600 }}>부가가치세 (10%)</td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "500" }}>{data.vat.toLocaleString()}원</td>
                </tr>
                {data.truncationDiscount > 0 && (
                  <tr style={{ borderBottom: `1px solid ${colors.slate200}` }}>
                    <td style={{ padding: "12px 16px", color: colors.emerald600 }}>절사금</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "500", color: colors.emerald600 }}>
                      -{data.truncationDiscount.toLocaleString()}원
                    </td>
                  </tr>
                )}
                <tr style={{ backgroundColor: colors.slate800 }}>
                  <td style={{ padding: "16px", color: colors.white, fontWeight: "600" }}>총 견적 금액</td>
                  <td style={{ padding: "16px", textAlign: "right", fontWeight: "bold", fontSize: "18px", color: colors.white }}>
                    {data.totalCost.toLocaleString()}원
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 포함 기능 */}
        <div style={{ marginBottom: "32px", ...noBreakStyle }}>
          <h3 style={{
            fontSize: "18px",
            fontWeight: "600",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <div style={{ width: "4px", height: "20px", backgroundColor: colors.slate800, borderRadius: "2px" }}></div>
            포함 기능 ({data.featureCount}개)
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
            {data.features.map((feature, index) => (
              <div
                key={index}
                style={{
                  padding: "12px",
                  backgroundColor: colors.slate50,
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.emerald500} strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span style={{ fontSize: "13px", fontWeight: "500" }}>{feature.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3D 파일 분석 정보 */}
        {data.file3DAnalysis && (
          <div style={{ marginBottom: "32px", ...noBreakStyle }}>
            <h3 style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <div style={{ width: "4px", height: "20px", backgroundColor: colors.cyan700, borderRadius: "2px" }}></div>
              3D 파일 분석
            </h3>
            <div style={{
              padding: "16px",
              backgroundColor: colors.cyan50,
              borderRadius: "8px",
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
            }}>
              <div>
                <p style={{ fontSize: "12px", color: colors.slate500 }}>파일명</p>
                <p style={{ fontWeight: "500", fontSize: "14px" }}>{data.file3DAnalysis.fileName}</p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: colors.slate500 }}>포맷</p>
                <p style={{ fontWeight: "500", fontSize: "14px" }}>{data.file3DAnalysis.format}</p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: colors.slate500 }}>파일 크기</p>
                <p style={{ fontWeight: "500", fontSize: "14px" }}>{data.file3DAnalysis.fileSizeFormatted}</p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: colors.slate500 }}>품질 등급</p>
                <p style={{ fontWeight: "500", fontSize: "14px" }}>{qualityGradeLabels[data.file3DAnalysis.qualityGrade] || data.file3DAnalysis.qualityGrade}</p>
              </div>
            </div>
          </div>
        )}

        {/* AI 분석 결과 */}
        {data.aiAnalysis && (
          <div style={{ marginBottom: "32px", ...noBreakStyle }}>
            <h3 style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <div style={{ width: "4px", height: "20px", backgroundColor: colors.purple700, borderRadius: "2px" }}></div>
              AI 분석 요구사항
            </h3>
            <div style={{ padding: "16px", backgroundColor: colors.purple50, borderRadius: "8px", marginBottom: "16px" }}>
              <p style={{ fontSize: "14px", color: colors.slate600 }}>{data.aiAnalysis.summary}</p>
              <span style={{
                marginTop: "8px",
                display: "inline-block",
                fontSize: "12px",
                backgroundColor: colors.purple700,
                color: colors.white,
                padding: "2px 8px",
                borderRadius: "4px",
              }}>
                복잡도: {data.aiAnalysis.complexity}
              </span>
            </div>
            <div style={{ border: `1px solid ${colors.slate200}`, borderRadius: "8px", overflow: "hidden" }}>
              <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: colors.slate50 }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600" }}>개발 항목</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: "600" }}>예상 기간</th>
                  </tr>
                </thead>
                <tbody>
                  {data.aiAnalysis.tasks.map((task, index) => (
                    <tr key={index} style={{ borderTop: `1px solid ${colors.slate200}` }}>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontWeight: "500" }}>{task.name}</span>
                        <span style={{
                          marginLeft: "8px",
                          fontSize: "11px",
                          backgroundColor: colors.purple50,
                          color: colors.purple700,
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}>
                          {task.category}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: colors.slate600 }}>
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
          <div style={{ marginBottom: "32px", ...noBreakStyle }}>
            <h3 style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <div style={{ width: "4px", height: "20px", backgroundColor: colors.emerald600, borderRadius: "2px" }}></div>
              서비스 유지비
              <span style={{
                fontSize: "12px",
                backgroundColor: colors.emerald500,
                color: colors.white,
                padding: "2px 8px",
                borderRadius: "4px",
              }}>
                {data.maintenance.planName}
              </span>
            </h3>
            <div style={{
              padding: "16px",
              backgroundColor: colors.emerald50,
              borderRadius: "8px",
              border: `2px solid ${colors.emerald500}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <p style={{ fontSize: "14px", color: colors.slate600 }}>연간 유지비</p>
                  {data.maintenance.firstYearFree ? (
                    <>
                      <p style={{ fontSize: "16px", color: colors.slate400, textDecoration: "line-through" }}>
                        {data.maintenance.annualCost.toLocaleString()}원
                      </p>
                      <p style={{ fontSize: "24px", fontWeight: "bold", color: colors.emerald600 }}>1년차 무료</p>
                    </>
                  ) : (
                    <p style={{ fontSize: "24px", fontWeight: "bold", color: colors.emerald600 }}>
                      {data.maintenance.annualCost.toLocaleString()}원
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", gap: "24px" }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "20px", fontWeight: "bold", color: colors.emerald700 }}>{data.maintenance.ticketsPerYear}</p>
                    <p style={{ fontSize: "12px", color: colors.slate500 }}>연간 티켓</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "20px", fontWeight: "bold", color: colors.emerald700 }}>{data.maintenance.managerHoursPerMonth}h</p>
                    <p style={{ fontSize: "12px", color: colors.slate500 }}>월 유지관리</p>
                  </div>
                </div>
              </div>
              {data.maintenance.firstYearFree && (
                <div style={{
                  padding: "12px",
                  backgroundColor: colors.white,
                  borderRadius: "6px",
                  border: `2px dashed ${colors.emerald500}`,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.emerald600} strokeWidth="2">
                    <rect x="3" y="8" width="18" height="4" rx="1"/>
                    <path d="M12 8v13"/>
                    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/>
                  </svg>
                  <div>
                    <p style={{ fontWeight: "600", color: colors.emerald600 }}>1년차 유지비 면제 적용</p>
                    <p style={{ fontSize: "13px", color: colors.slate500 }}>
                      개발 계약 시 1년차 유지비가 면제됩니다 (-{data.maintenance.annualCost.toLocaleString()}원)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 안내사항 */}
        <div style={{
          marginTop: "32px",
          padding: "16px",
          backgroundColor: colors.slate50,
          borderRadius: "8px",
          borderLeft: `4px solid ${colors.slate400}`,
          ...noBreakStyle,
        }}>
          <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px", color: colors.slate700 }}>안내사항</h4>
          <ul style={{ fontSize: "13px", color: colors.slate600, paddingLeft: "16px", margin: 0 }}>
            <li style={{ marginBottom: "4px" }}>본 견적서는 제공된 요구사항을 기반으로 산출된 예상 금액입니다.</li>
            <li style={{ marginBottom: "4px" }}>상세 협의 과정에서 요구사항 변경 시 금액이 조정될 수 있습니다.</li>
            <li>견적 유효기간은 발행일로부터 30일입니다.</li>
          </ul>
        </div>

        {/* 푸터 */}
        <div style={{
          marginTop: "32px",
          paddingTop: "16px",
          borderTop: `1px solid ${colors.slate200}`,
          textAlign: "center",
        }}>
          <p style={{ fontSize: "14px", fontWeight: "600", color: colors.slate700, marginBottom: "4px" }}>
            (주)플래닝고
          </p>
          <p style={{ fontSize: "12px", color: colors.slate500 }}>
            사업자번호: 276-81-01871 | 대표자: 신진욱
          </p>
          <p style={{ fontSize: "12px", color: colors.slate500 }}>
            문의: 010-2083-2941 | jw@planningo.io
          </p>
        </div>
      </div>
    )
  }
)

EstimatePrintView.displayName = "EstimatePrintView"
