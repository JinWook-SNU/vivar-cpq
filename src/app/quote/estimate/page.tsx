"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Download,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Users,
  Layers,
  Zap,
  Package,
  Building2,
  Calculator,
  X,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Code2,
  FileBox,
  HardDrive,
  FileType,
  AlertCircle,
  FileCode,
  Percent,
  Tag,
  Shield,
  Server,
  Ticket,
  Wrench,
  Gift,
} from "lucide-react"
import type { SurveyFormData, MaintenancePlanType } from "@/components/quote/ConfiguratorSurvey"
import { MAINTENANCE_PLANS } from "@/components/quote/ConfiguratorSurvey"
import { ProjectTimeline } from "@/components/quote/ProjectTimeline"
import { deserializeAnalysis, type File3DAnalysis } from "@/lib/3d-analysis"
import { exportElementToPDF } from "@/lib/pdf-export"
import { generateEstimateHTML, downloadHTML } from "@/lib/html-export"
import { EstimatePrintView, type PrintViewData, type RoleSchedule, type ScheduledTask } from "@/components/quote/EstimatePrintView"
import { Loader2 } from "lucide-react"

// AI 분석 결과 타입
interface AIAnalysisResult {
  success: boolean
  analysis: {
    summary: string
    developmentTasks: {
      name: string
      description: string
      category: string
      estimatedDays: number
      requiredRoles: string[]
    }[]
    personnelAllocation: {
      role: string
      roleName: string
      days: number
      tasks: string[]
      dailyRate?: number
      totalCost?: number
    }[]
    technicalConsiderations: string[]
    risks: string[]
    estimatedComplexity: "low" | "medium" | "high"
  }
  costBreakdown: {
    laborCost: number
    overhead: number
    technicalFee: number
    subtotal: number
    vat: number
    totalBeforeDiscount: number
    truncationDiscount: number
    totalCost: number
  }
  generatedAt: string
}

// 인력 유형별 일일 단가 (20% 할인 적용)
const DAILY_RATES = {
  xrDeveloper: 336000,    // XR 개발자 (420,000 * 0.8)
  systemEngineer: 272000, // 시스템 엔지니어 (340,000 * 0.8)
  projectManager: 448000, // 프로젝트 매니저 (560,000 * 0.8)
  designer: 200000,       // 디자이너 (250,000 * 0.8)
}

const ROLE_LABELS: Record<string, string> = {
  xrDeveloper: "XR 개발자",
  systemEngineer: "시스템 엔지니어",
  projectManager: "프로젝트 매니저",
  designer: "디자이너",
}

// 기능별 인력 투입 계획 (일수 기준)
interface FeatureAllocation {
  name: string
  allocation: {
    xrDeveloper: number
    systemEngineer: number
    projectManager: number
    designer: number
  }
}

interface PersonnelSummary {
  role: string
  days: number
  dailyRate: number
  totalCost: number
}

interface EstimateData {
  features: FeatureAllocation[]
  personnelSummary: PersonnelSummary[]
  laborCost: number      // 인건비 원가
  overhead: number       // 제경비 (110%)
  technicalFee: number   // 기술료 (20%)
  subtotal: number       // 소계
  vat: number            // VAT (10%)
  totalBeforeDiscount: number // 절사 전 총 비용
  truncationDiscount: number  // 절사금 (만원 단위 절사)
  totalCost: number      // 최종 비용
  totalDays: number      // 총 소요일
  timeline: { phase: string; duration: string; description: string }[]
}

const complexityLabels: Record<string, string> = {
  low: "낮음",
  medium: "중간",
  high: "높음",
}

// 타임라인용 역할별 이름
const ROLE_NAMES: Record<string, string> = {
  projectManager: "PM",
  designer: "디자이너",
  xrDeveloper: "XR 개발자",
  systemEngineer: "시스템 엔지니어",
}

// 작업 의존성 정의
const TASK_DEPENDENCIES: Record<string, string[]> = {
  "기획 및 플랫폼 베이스 구축": [],
  "3D 모델링 제작": ["기획 및 플랫폼 베이스 구축"],
  "컬러 변경": ["기획 및 플랫폼 베이스 구축"],
  "옵션 변경": ["기획 및 플랫폼 베이스 구축"],
  "사이즈 조절": ["기획 및 플랫폼 베이스 구축"],
  "모듈 조립": ["기획 및 플랫폼 베이스 구축"],
  "AR/VR 호환": ["기획 및 플랫폼 베이스 구축"],
  "애니메이션": ["기획 및 플랫폼 베이스 구축"],
  "실시간 견적": ["기획 및 플랫폼 베이스 구축"],
  "치수 측정": ["기획 및 플랫폼 베이스 구축"],
  "ERP 연동": ["기획 및 플랫폼 베이스 구축"],
  "장바구니 연동": ["ERP 연동"],
  "프리셋": ["기획 및 플랫폼 베이스 구축"],
  "캠페인 모드": ["기획 및 플랫폼 베이스 구축"],
  "규정 검토": ["기획 및 플랫폼 베이스 구축"],
  "AI 실사 렌더링": ["기획 및 플랫폼 베이스 구축"],
  "주문 상세 내역 관리": ["기획 및 플랫폼 베이스 구축"],
  "팀 관리": ["기획 및 플랫폼 베이스 구축"],
  "유닛 관리": ["기획 및 플랫폼 베이스 구축"],
  "텍스처 관리": ["기획 및 플랫폼 베이스 구축"],
  "견적서 발행": ["주문 상세 내역 관리"],
  "도면 출력": ["기획 및 플랫폼 베이스 구축"],
  "설치 안내서 발행": ["기획 및 플랫폼 베이스 구축"],
  "QA 및 피드백 반영": [],
}

// 작업 우선순위
const TASK_PRIORITY: Record<string, number> = {
  "기획 및 플랫폼 베이스 구축": 0,
  "3D 모델링 제작": 1,
  "컬러 변경": 2,
  "옵션 변경": 2,
  "사이즈 조절": 2,
  "모듈 조립": 3,
  "AR/VR 호환": 3,
  "애니메이션": 3,
  "실시간 견적": 4,
  "치수 측정": 4,
  "ERP 연동": 5,
  "장바구니 연동": 6,
  "프리셋": 4,
  "캠페인 모드": 5,
  "규정 검토": 5,
  "AI 실사 렌더링": 5,
  "주문 상세 내역 관리": 4,
  "팀 관리": 4,
  "유닛 관리": 4,
  "텍스처 관리": 5,
  "견적서 발행": 6,
  "도면 출력": 6,
  "설치 안내서 발행": 6,
  "QA 및 피드백 반영": 100,
}

function getTaskBaseName(taskName: string): string {
  return taskName.replace(/\s*\([^)]*\)\s*/g, "").trim()
}

// 타임라인 데이터 계산
function calculateTimeline(features: FeatureAllocation[]): { roleSchedules: RoleSchedule[]; totalDays: number } {
  const sortedFeatures = [...features].sort((a, b) => {
    const priorityA = TASK_PRIORITY[getTaskBaseName(a.name)] ?? 50
    const priorityB = TASK_PRIORITY[getTaskBaseName(b.name)] ?? 50
    return priorityA - priorityB
  })

  const taskEndDays: Record<string, number> = {}
  const roleAvailableDay: Record<string, number> = {
    projectManager: 0,
    designer: 0,
    xrDeveloper: 0,
    systemEngineer: 0,
  }

  const schedules: Record<string, ScheduledTask[]> = {
    projectManager: [],
    designer: [],
    xrDeveloper: [],
    systemEngineer: [],
  }

  const qaTask = sortedFeatures.find(f => f.name === "QA 및 피드백 반영")
  const otherTasks = sortedFeatures.filter(f => f.name !== "QA 및 피드백 반영")

  otherTasks.forEach(feature => {
    const baseName = getTaskBaseName(feature.name)
    const dependencies = TASK_DEPENDENCIES[baseName] || []

    let earliestStart = 0
    dependencies.forEach(dep => {
      const depEndDay = taskEndDays[dep] || 0
      earliestStart = Math.max(earliestStart, depEndDay)
    })

    const roles = ["projectManager", "designer", "xrDeveloper", "systemEngineer"] as const
    let taskEndDay = 0

    roles.forEach(role => {
      const days = feature.allocation[role]
      if (days > 0) {
        const startDay = Math.max(roleAvailableDay[role], earliestStart)

        schedules[role].push({
          name: feature.name,
          role,
          startDay,
          duration: days,
        })

        roleAvailableDay[role] = startDay + days
        taskEndDay = Math.max(taskEndDay, startDay + days)
      }
    })

    taskEndDays[baseName] = taskEndDay
  })

  if (qaTask) {
    const allTasksEndDay = Math.max(...Object.values(taskEndDays), ...Object.values(roleAvailableDay))

    const roles = ["projectManager", "designer", "xrDeveloper", "systemEngineer"] as const
    roles.forEach(role => {
      const days = qaTask.allocation[role]
      if (days > 0) {
        schedules[role].push({
          name: qaTask.name,
          role,
          startDay: allTasksEndDay,
          duration: days,
        })
      }
    })
  }

  let maxDay = 0
  Object.values(schedules).forEach(tasks => {
    tasks.forEach(task => {
      maxDay = Math.max(maxDay, task.startDay + task.duration)
    })
  })

  const roleSchedules: RoleSchedule[] = [
    {
      role: "projectManager",
      roleName: ROLE_NAMES.projectManager,
      tasks: schedules.projectManager,
    },
    {
      role: "designer",
      roleName: ROLE_NAMES.designer,
      tasks: schedules.designer,
    },
    {
      role: "xrDeveloper",
      roleName: ROLE_NAMES.xrDeveloper,
      tasks: schedules.xrDeveloper,
    },
    {
      role: "systemEngineer",
      roleName: ROLE_NAMES.systemEngineer,
      tasks: schedules.systemEngineer,
    },
  ].filter(schedule => schedule.tasks.length > 0)

  return { roleSchedules, totalDays: Math.ceil(maxDay) }
}

// 기능별 인력 투입 정의
function getFeatureAllocations(surveyData: Partial<SurveyFormData>): FeatureAllocation[] {
  // 먼저 중간 기능들을 수집하여 개수 파악
  const middleFeatures: FeatureAllocation[] = []

  // 컨피규레이터 기능
  if (surveyData.features?.colorChange) {
    const colorTypeLabels: Record<string, string> = {
      fixed: "고정",
      admin: "관리자 지정",
      user: "사용자 지정",
    }
    const colorTypeLabel = surveyData.colorChangeType
      ? colorTypeLabels[surveyData.colorChangeType] || ""
      : ""
    const colorTypeSuffix = colorTypeLabel ? ` (${colorTypeLabel})` : ""

    // 타입별 인력 배분 차등 적용 (PM 제외)
    let colorAllocation = { xrDeveloper: 2, systemEngineer: 0, projectManager: 0, designer: 0 }
    if (surveyData.colorChangeType === "admin") {
      // 관리자 지정: 대시보드 연동 필요하므로 시스템 엔지니어 추가
      colorAllocation = { xrDeveloper: 2, systemEngineer: 1, projectManager: 0, designer: 0 }
    } else if (surveyData.colorChangeType === "user") {
      // 사용자 지정: UI 복잡도 증가
      colorAllocation = { xrDeveloper: 3, systemEngineer: 0, projectManager: 0, designer: 0 }
    }

    middleFeatures.push({
      name: `컬러 변경${colorTypeSuffix}`,
      allocation: colorAllocation
    })
  }
  if (surveyData.features?.optionChange) {
    const optionTypeLabels: Record<string, string> = {
      global: "전체 영향",
      attachment: "탈부착",
    }
    const optionTypeLabel = surveyData.optionChangeType
      ? optionTypeLabels[surveyData.optionChangeType] || ""
      : ""
    const optionTypeSuffix = optionTypeLabel ? ` (${optionTypeLabel})` : ""

    // 타입별 인력 배분 차등 적용 (PM 제외)
    let optionAllocation = { xrDeveloper: 2, systemEngineer: 1, projectManager: 0, designer: 0 }
    if (surveyData.optionChangeType === "global") {
      // 전체 영향: 복잡도 증가
      optionAllocation = { xrDeveloper: 3, systemEngineer: 2, projectManager: 0, designer: 0 }
    }

    middleFeatures.push({
      name: `옵션 변경${optionTypeSuffix}`,
      allocation: optionAllocation
    })
  }
  if (surveyData.features?.sizeAdjustment) {
    const sizeTypeLabels: Record<string, string> = {
      preset: "프리셋",
      custom: "맞춤형",
    }
    const sizeTypeLabel = surveyData.sizeAdjustmentType
      ? sizeTypeLabels[surveyData.sizeAdjustmentType] || ""
      : ""
    const sizeTypeSuffix = sizeTypeLabel ? ` (${sizeTypeLabel})` : ""

    // 타입별 인력 배분 차등 적용 (PM 제외)
    let sizeAllocation = { xrDeveloper: 3, systemEngineer: 1, projectManager: 0, designer: 0 }
    if (surveyData.sizeAdjustmentType === "custom") {
      // 맞춤형: UI 복잡도 및 시스템 연동 증가
      sizeAllocation = { xrDeveloper: 4, systemEngineer: 2, projectManager: 0, designer: 0 }
    }

    middleFeatures.push({
      name: `사이즈 조절${sizeTypeSuffix}`,
      allocation: sizeAllocation
    })
  }
  if (surveyData.features?.moduleAssembly) {
    const complexity = surveyData.moduleComplexity || "low"
    const multiplier = { low: 1, medium: 1.5, high: 2.5 }[complexity] || 1
    const complexityLabel = complexityLabels[complexity] || "낮음"
    middleFeatures.push({
      name: `모듈 조립 (${complexityLabel})`,
      allocation: {
        xrDeveloper: Math.round(4 * multiplier * 10) / 10,
        systemEngineer: Math.round(2 * multiplier * 10) / 10,
        projectManager: 1,
        designer: 0
      }
    })
  }

  // 기술 기능
  if (surveyData.arVrCompatible) {
    middleFeatures.push({
      name: "AR/VR 호환",
      allocation: { xrDeveloper: 3, systemEngineer: 1, projectManager: 0, designer: 0 }
    })
  }
  if (surveyData.animation) {
    middleFeatures.push({
      name: "애니메이션",
      allocation: { xrDeveloper: 3, systemEngineer: 0, projectManager: 0.5, designer: 0 }
    })
  }
  if (surveyData.realTimeQuote) {
    middleFeatures.push({
      name: "실시간 견적",
      allocation: { xrDeveloper: 1, systemEngineer: 3, projectManager: 1, designer: 0 }
    })
  }
  if (surveyData.dimensionMeasurement) {
    middleFeatures.push({
      name: "치수 측정",
      allocation: { xrDeveloper: 2, systemEngineer: 1, projectManager: 0, designer: 0 }
    })
  }

  // 시스템 연동
  if (surveyData.erpIntegration) {
    middleFeatures.push({
      name: "ERP 연동",
      allocation: { xrDeveloper: 0.5, systemEngineer: 3, projectManager: 0.5, designer: 0 }
    })
  }
  if (surveyData.cartIntegration) {
    middleFeatures.push({
      name: "장바구니 연동",
      allocation: { xrDeveloper: 0.5, systemEngineer: 2, projectManager: 0.5, designer: 0 }
    })
  }

  // 추가 기능
  if (surveyData.presetAddition) {
    middleFeatures.push({
      name: "프리셋",
      allocation: { xrDeveloper: 1, systemEngineer: 1, projectManager: 0.5, designer: 0 }
    })
  }
  if (surveyData.campaignMode) {
    middleFeatures.push({
      name: "캠페인 모드",
      allocation: { xrDeveloper: 1, systemEngineer: 2, projectManager: 1, designer: 0 }
    })
  }
  if (surveyData.complianceCheck) {
    middleFeatures.push({
      name: "규정 검토",
      allocation: { xrDeveloper: 1, systemEngineer: 3, projectManager: 1, designer: 0 }
    })
  }

  // AI 실사 렌더링 (AX 개발자 1일 + 서비스 엔지니어 1일)
  if (surveyData.aiRealisticRendering) {
    middleFeatures.push({
      name: "AI 실사 렌더링",
      allocation: { xrDeveloper: 1, systemEngineer: 1, projectManager: 0, designer: 0 }
    })
  }

  // 대시보드 기능
  if (surveyData.dashboardEnabled) {
    // 필수 기능 (시스템 엔지니어 단독 1일)
    middleFeatures.push({
      name: "주문 상세 내역 관리",
      allocation: { xrDeveloper: 0, systemEngineer: 1, projectManager: 0, designer: 0 }
    })
    middleFeatures.push({
      name: "팀 관리",
      allocation: { xrDeveloper: 0, systemEngineer: 1, projectManager: 0, designer: 0 }
    })
    middleFeatures.push({
      name: "유닛 관리",
      allocation: { xrDeveloper: 0, systemEngineer: 1, projectManager: 0, designer: 0 }
    })

    // 선택 기능
    if (surveyData.dashboard?.textureManagement) {
      middleFeatures.push({
        name: "텍스처 관리",
        allocation: { xrDeveloper: 2, systemEngineer: 1, projectManager: 0.5, designer: 0 }
      })
    }
    if (surveyData.dashboard?.quoteIssuance) {
      middleFeatures.push({
        name: "견적서 발행",
        allocation: { xrDeveloper: 0, systemEngineer: 3, projectManager: 1, designer: 0 }
      })
    }
    if (surveyData.dashboard?.blueprintOutput) {
      middleFeatures.push({
        name: "도면 출력",
        allocation: { xrDeveloper: 2, systemEngineer: 3, projectManager: 1, designer: 0 }
      })
    }
    if (surveyData.dashboard?.installationGuide) {
      middleFeatures.push({
        name: "설치 안내서 발행",
        allocation: { xrDeveloper: 1, systemEngineer: 2, projectManager: 0.5, designer: 0 }
      })
    }
  }

  // 기능 개수에 따른 기획/QA 일수 계산 (1~20개 기능 기준으로 스케일링)
  const featureCount = middleFeatures.length
  const scaleFactor = Math.min(featureCount / 15, 1) // 15개 기능을 최대치로

  // 기획 및 플랫폼 베이스 구축: PM 0.5~2일, 디자이너 0.5~1일 (추가 축소)
  const planningPmDays = Math.round((0.5 + scaleFactor * 1.5) * 2) / 2  // 0.5 ~ 2 (0.5일 단위)
  const planningDesignerDays = Math.round((0.5 + scaleFactor * 0.5) * 2) / 2  // 0.5 ~ 1 (0.5일 단위)

  // QA 및 피드백 반영: 개발자들 0.5~1.5일 (추가 축소)
  const qaDevDays = Math.round((0.5 + scaleFactor * 1) * 2) / 2  // 0.5 ~ 1.5 (0.5일 단위)

  const features: FeatureAllocation[] = []

  // 첫 번째: 기획 및 플랫폼 베이스 구축 (인력 추가 축소)
  features.push({
    name: "기획 및 플랫폼 베이스 구축",
    allocation: {
      xrDeveloper: 1.5,
      systemEngineer: 0.5,
      projectManager: planningPmDays,
      designer: planningDesignerDays
    }
  })

  // 중간 기능들 추가
  features.push(...middleFeatures)

  // 마지막: QA 및 피드백 반영 (인력 추가 축소)
  features.push({
    name: "QA 및 피드백 반영",
    allocation: {
      xrDeveloper: qaDevDays,
      systemEngineer: qaDevDays,
      projectManager: 0.5,
      designer: 0.5
    }
  })

  return features
}

function calculateEstimate(surveyData: Partial<SurveyFormData>): EstimateData {
  const features = getFeatureAllocations(surveyData)

  // 인력별 총 투입일 계산
  const totalsByRole = {
    xrDeveloper: 0,
    systemEngineer: 0,
    projectManager: 0,
    designer: 0,
  }

  features.forEach(feature => {
    totalsByRole.xrDeveloper += feature.allocation.xrDeveloper
    totalsByRole.systemEngineer += feature.allocation.systemEngineer
    totalsByRole.projectManager += feature.allocation.projectManager
    totalsByRole.designer += feature.allocation.designer
  })

  // 인력 요약 생성
  const personnelSummary: PersonnelSummary[] = [
    {
      role: "XR 개발자",
      days: totalsByRole.xrDeveloper,
      dailyRate: DAILY_RATES.xrDeveloper,
      totalCost: totalsByRole.xrDeveloper * DAILY_RATES.xrDeveloper
    },
    {
      role: "시스템 엔지니어",
      days: totalsByRole.systemEngineer,
      dailyRate: DAILY_RATES.systemEngineer,
      totalCost: totalsByRole.systemEngineer * DAILY_RATES.systemEngineer
    },
    {
      role: "프로젝트 매니저",
      days: totalsByRole.projectManager,
      dailyRate: DAILY_RATES.projectManager,
      totalCost: totalsByRole.projectManager * DAILY_RATES.projectManager
    },
    {
      role: "디자이너",
      days: totalsByRole.designer,
      dailyRate: DAILY_RATES.designer,
      totalCost: totalsByRole.designer * DAILY_RATES.designer
    },
  ].filter(p => p.days > 0)

  // 비용 계산
  const laborCost = personnelSummary.reduce((sum, p) => sum + p.totalCost, 0)
  const overhead = Math.round(laborCost * 1.1) // 제경비 110%
  const technicalFee = Math.round((laborCost + overhead) * 0.2) // 기술료 20%
  const subtotal = laborCost + overhead + technicalFee
  const vat = Math.round(subtotal * 0.1) // VAT 10%
  const totalBeforeDiscount = subtotal + vat

  // 만원 단위 절사
  const truncationDiscount = totalBeforeDiscount % 10000
  const totalCost = totalBeforeDiscount - truncationDiscount

  // 총 소요일 (병렬 작업 고려하여 가장 긴 인력의 투입일 기준)
  const totalDays = Math.max(
    totalsByRole.xrDeveloper,
    totalsByRole.systemEngineer,
    totalsByRole.projectManager,
    totalsByRole.designer
  )

  // 일정 계산 (총 소요일 기준)
  const totalWeeks = Math.ceil(totalDays / 5)
  let timeline: { phase: string; duration: string; description: string }[]

  if (totalWeeks <= 4) {
    timeline = [
      { phase: "기획 및 분석", duration: "1주", description: "요구사항 분석 및 프로젝트 기획" },
      { phase: "디자인 및 프로토타입", duration: "1주", description: "UI/UX 디자인 및 3D 프로토타입 개발" },
      { phase: "개발", duration: `${Math.max(1, totalWeeks - 2)}주`, description: "핵심 기능 구현" },
      { phase: "테스트 및 배포", duration: "1주", description: "품질 보증 및 운영 환경 배포" },
    ]
  } else if (totalWeeks <= 8) {
    timeline = [
      { phase: "기획 및 분석", duration: "2주", description: "상세 요구사항 및 아키텍처 설계" },
      { phase: "디자인 및 프로토타입", duration: "2주", description: "UI/UX 디자인 및 인터랙티브 프로토타입" },
      { phase: "개발 1단계", duration: `${Math.ceil((totalWeeks - 5) / 2)}주`, description: "핵심 컨피규레이터 기능" },
      { phase: "개발 2단계", duration: `${Math.floor((totalWeeks - 5) / 2)}주`, description: "고급 기능 및 연동" },
      { phase: "테스트 및 QA", duration: "1주", description: "종합 테스트 및 최적화" },
      { phase: "배포 및 교육", duration: "1주", description: "운영 환경 배포 및 사용자 교육" },
    ]
  } else {
    timeline = [
      { phase: "기획 및 분석", duration: "3주", description: "종합 요구사항 및 시스템 아키텍처" },
      { phase: "디자인 및 프로토타입", duration: "3주", description: "전체 UI/UX 디자인 및 사용자 테스트" },
      { phase: "개발 1단계", duration: `${Math.ceil((totalWeeks - 8) / 3)}주`, description: "핵심 컨피규레이터 및 3D 엔진" },
      { phase: "개발 2단계", duration: `${Math.ceil((totalWeeks - 8) / 3)}주`, description: "고급 기능 구현" },
      { phase: "개발 3단계", duration: `${Math.floor((totalWeeks - 8) / 3)}주`, description: "연동 및 자동화" },
      { phase: "테스트 및 QA", duration: "2주", description: "전체 테스트 및 성능 최적화" },
      { phase: "배포 및 교육", duration: "2주", description: "단계별 배포 및 종합 교육" },
    ]
  }

  return {
    features,
    personnelSummary,
    laborCost,
    overhead,
    technicalFee,
    subtotal,
    vat,
    totalBeforeDiscount,
    truncationDiscount,
    totalCost,
    totalDays,
    timeline,
  }
}

// 기능별 비용 계산
function calculateFeatureCost(allocation: FeatureAllocation["allocation"]): number {
  return (
    allocation.xrDeveloper * DAILY_RATES.xrDeveloper +
    allocation.systemEngineer * DAILY_RATES.systemEngineer +
    allocation.projectManager * DAILY_RATES.projectManager +
    allocation.designer * DAILY_RATES.designer
  )
}

// 포함된 기능만으로 비용 재계산
function recalculateCosts(features: FeatureAllocation[], excludedIndices: Set<number>) {
  const includedFeatures = features.filter((_, index) => !excludedIndices.has(index))

  // 인력별 총 투입일 계산
  const totalsByRole = {
    xrDeveloper: 0,
    systemEngineer: 0,
    projectManager: 0,
    designer: 0,
  }

  includedFeatures.forEach(feature => {
    totalsByRole.xrDeveloper += feature.allocation.xrDeveloper
    totalsByRole.systemEngineer += feature.allocation.systemEngineer
    totalsByRole.projectManager += feature.allocation.projectManager
    totalsByRole.designer += feature.allocation.designer
  })

  // 인력 요약 생성
  const personnelSummary: PersonnelSummary[] = [
    {
      role: "XR 개발자",
      days: totalsByRole.xrDeveloper,
      dailyRate: DAILY_RATES.xrDeveloper,
      totalCost: totalsByRole.xrDeveloper * DAILY_RATES.xrDeveloper
    },
    {
      role: "시스템 엔지니어",
      days: totalsByRole.systemEngineer,
      dailyRate: DAILY_RATES.systemEngineer,
      totalCost: totalsByRole.systemEngineer * DAILY_RATES.systemEngineer
    },
    {
      role: "프로젝트 매니저",
      days: totalsByRole.projectManager,
      dailyRate: DAILY_RATES.projectManager,
      totalCost: totalsByRole.projectManager * DAILY_RATES.projectManager
    },
    {
      role: "디자이너",
      days: totalsByRole.designer,
      dailyRate: DAILY_RATES.designer,
      totalCost: totalsByRole.designer * DAILY_RATES.designer
    },
  ].filter(p => p.days > 0)

  // 비용 계산
  const laborCost = personnelSummary.reduce((sum, p) => sum + p.totalCost, 0)
  const overhead = Math.round(laborCost * 1.1)
  const technicalFee = Math.round((laborCost + overhead) * 0.2)
  const subtotal = laborCost + overhead + technicalFee
  const vat = Math.round(subtotal * 0.1)
  const totalBeforeDiscount = subtotal + vat
  const truncationDiscount = totalBeforeDiscount % 10000
  const totalCost = totalBeforeDiscount - truncationDiscount

  const totalDays = Math.max(
    totalsByRole.xrDeveloper,
    totalsByRole.systemEngineer,
    totalsByRole.projectManager,
    totalsByRole.designer
  )

  return {
    personnelSummary,
    laborCost,
    overhead,
    technicalFee,
    subtotal,
    vat,
    totalBeforeDiscount,
    truncationDiscount,
    totalCost,
    totalDays,
    includedCount: includedFeatures.length,
  }
}

const categoryLabels: Record<string, string> = {
  furniture: "가구",
  automotive: "자동차/모빌리티",
  industrial: "산업용 기계",
  architecture: "건축/인테리어",
  fashion: "패션/의류",
  electronics: "전자제품",
  other: "기타",
}

export default function EstimatePage() {
  const router = useRouter()
  const [surveyData, setSurveyData] = useState<Partial<SurveyFormData> | null>(null)
  const [estimate, setEstimate] = useState<EstimateData | null>(null)
  const [excludedFeatures, setExcludedFeatures] = useState<Set<number>>(new Set())
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null)
  const [excludedAiTasks, setExcludedAiTasks] = useState<Set<number>>(new Set())
  const [file3DAnalysis, setFile3DAnalysis] = useState<File3DAnalysis | null>(null)
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  // 할인 관련 state
  const [overheadDiscountEnabled, setOverheadDiscountEnabled] = useState(false)
  const [overheadDiscountRate, setOverheadDiscountRate] = useState(10) // 기본 10%
  const [techFeeDiscountEnabled, setTechFeeDiscountEnabled] = useState(false)
  const [techFeeDiscountRate, setTechFeeDiscountRate] = useState(10) // 기본 10%

  // 유지비 1년차 면제 할인 state
  const [maintenanceFirstYearFree, setMaintenanceFirstYearFree] = useState(false)

  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem("surveyData")
    if (stored) {
      const data = JSON.parse(stored)
      setSurveyData(data)
      setEstimate(calculateEstimate(data))

      // AI 분석 결과 불러오기
      const aiStored = sessionStorage.getItem("aiAnalysis")
      if (aiStored) {
        try {
          const aiData = JSON.parse(aiStored)
          setAiAnalysis(aiData)
        } catch {
          console.error("AI 분석 결과 파싱 실패")
        }
      }

      // 3D 파일 분석 결과 불러오기
      const file3DStored = sessionStorage.getItem("file3DAnalysis")
      if (file3DStored) {
        const analysis = deserializeAnalysis(file3DStored)
        if (analysis) {
          setFile3DAnalysis(analysis)
        }
      }
    } else {
      router.push("/quote")
    }
  }, [router])

  // AI 작업 제외 토글
  const toggleAiTaskExclusion = (index: number) => {
    setExcludedAiTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  // AI 제외 초기화
  const resetAiExclusions = () => {
    setExcludedAiTasks(new Set())
  }

  // 0.5일 단위로 반올림하는 헬퍼 함수
  const roundToHalfDay = (days: number): number => {
    return Math.round(days * 2) / 2
  }

  // AI 분석 비용 재계산
  const recalculateAiCosts = () => {
    if (!aiAnalysis) return null

    const includedTasks = aiAnalysis.analysis.developmentTasks.filter(
      (_, index) => !excludedAiTasks.has(index)
    )

    // 인력별 일수 재계산
    const roleMap: Record<string, { days: number; tasks: string[] }> = {}

    includedTasks.forEach(task => {
      const daysPerRole = task.estimatedDays / task.requiredRoles.length
      task.requiredRoles.forEach(role => {
        if (!roleMap[role]) {
          roleMap[role] = { days: 0, tasks: [] }
        }
        roleMap[role].days += daysPerRole
        roleMap[role].tasks.push(task.name)
      })
    })

    const personnelAllocation = Object.entries(roleMap).map(([role, data]) => {
      const roundedDays = roundToHalfDay(data.days)
      return {
        role,
        roleName: ROLE_LABELS[role] || role,
        days: roundedDays,
        tasks: data.tasks,
        dailyRate: DAILY_RATES[role as keyof typeof DAILY_RATES] || 300000,
        totalCost: (DAILY_RATES[role as keyof typeof DAILY_RATES] || 300000) * roundedDays,
      }
    })

    const totalLaborCost = personnelAllocation.reduce((sum, p) => sum + p.totalCost, 0)
    const overhead = Math.round(totalLaborCost * 1.1)
    const technicalFee = Math.round((totalLaborCost + overhead) * 0.2)
    const subtotal = totalLaborCost + overhead + technicalFee
    const vat = Math.round(subtotal * 0.1)
    const totalBeforeDiscount = subtotal + vat
    const truncationDiscount = totalBeforeDiscount % 10000
    const totalCost = totalBeforeDiscount - truncationDiscount

    return {
      personnelAllocation,
      laborCost: totalLaborCost,
      overhead,
      technicalFee,
      subtotal,
      vat,
      totalBeforeDiscount,
      truncationDiscount,
      totalCost,
      includedCount: includedTasks.length,
    }
  }

  // 제외된 기능 토글
  const toggleFeatureExclusion = (index: number) => {
    setExcludedFeatures(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  // 모든 제외 초기화
  const resetExclusions = () => {
    setExcludedFeatures(new Set())
  }

  // 할인 적용된 비용 계산
  const calculateDiscountedCosts = () => {
    if (!estimate) return null

    const costs = recalculateCosts(estimate.features, excludedFeatures)
    const aiCostsData = recalculateAiCosts()
    const prodCount = parseInt(surveyData?.productCount || "1")
    const prep3DUnitCost = file3DAnalysis?.cost.unitCost || 0
    const prep3DTotalCost = prep3DUnitCost * prodCount

    const combinedLabor = costs.laborCost + (aiCostsData?.laborCost || 0)

    // 원래 제경비 및 기술료
    const originalOverhead = Math.round(combinedLabor * 1.1)
    const originalTechFee = Math.round((combinedLabor + originalOverhead) * 0.2)

    // 할인 적용
    const overheadDiscount = overheadDiscountEnabled ? Math.round(originalOverhead * overheadDiscountRate / 100) : 0
    const techFeeDiscount = techFeeDiscountEnabled ? Math.round(originalTechFee * techFeeDiscountRate / 100) : 0

    const discountedOverhead = originalOverhead - overheadDiscount
    const discountedTechFee = originalTechFee - techFeeDiscount

    // 소계 계산 (할인 적용)
    const subtotal = combinedLabor + discountedOverhead + discountedTechFee + prep3DTotalCost
    const vat = Math.round(subtotal * 0.1)
    const totalBeforeDiscount = subtotal + vat
    const truncationDiscount = totalBeforeDiscount % 10000
    const totalCost = totalBeforeDiscount - truncationDiscount

    // 원래 가격 (할인 없이)
    const originalSubtotal = combinedLabor + originalOverhead + originalTechFee + prep3DTotalCost
    const originalVat = Math.round(originalSubtotal * 0.1)
    const originalTotalBefore = originalSubtotal + originalVat
    const originalTrunc = originalTotalBefore % 10000
    const originalTotal = originalTotalBefore - originalTrunc

    const totalDiscount = overheadDiscount + techFeeDiscount
    const discountPercentage = originalTotal > 0 ? Math.round((totalDiscount / originalTotal) * 100 * 10) / 10 : 0

    return {
      costs,
      aiCostsData,
      prodCount,
      prep3DUnitCost,
      prep3DTotalCost,
      combinedLabor,
      originalOverhead,
      originalTechFee,
      overheadDiscount,
      techFeeDiscount,
      discountedOverhead,
      discountedTechFee,
      subtotal,
      vat,
      truncationDiscount,
      totalCost,
      originalTotal,
      totalDiscount,
      discountPercentage,
    }
  }

  // PDF용 데이터 생성
  const getPrintViewData = (): PrintViewData | null => {
    if (!surveyData || !estimate) return null

    const discounted = calculateDiscountedCosts()
    if (!discounted) return null

    const {
      costs,
      aiCostsData,
      prodCount,
      prep3DUnitCost,
      prep3DTotalCost,
      combinedLabor,
      originalOverhead,
      originalTechFee,
      overheadDiscount,
      techFeeDiscount,
      discountedOverhead,
      discountedTechFee,
      subtotal,
      vat,
      truncationDiscount,
      totalCost,
      originalTotal,
      totalDiscount,
      discountPercentage,
    } = discounted

    const includedFeatures = estimate.features
      .filter((_, index) => !excludedFeatures.has(index))
      .map(f => {
        const allocations = [
          f.allocation.xrDeveloper > 0 ? `XR ${f.allocation.xrDeveloper}일` : "",
          f.allocation.systemEngineer > 0 ? `SE ${f.allocation.systemEngineer}일` : "",
          f.allocation.projectManager > 0 ? `PM ${f.allocation.projectManager}일` : "",
          f.allocation.designer > 0 ? `디자인 ${f.allocation.designer}일` : "",
        ].filter(Boolean).join(", ")

        // 역할별 상세 정보
        const roles = [
          { role: "XR 개발자", days: f.allocation.xrDeveloper, dailyRate: DAILY_RATES.xrDeveloper },
          { role: "시스템 엔지니어", days: f.allocation.systemEngineer, dailyRate: DAILY_RATES.systemEngineer },
          { role: "PM", days: f.allocation.projectManager, dailyRate: DAILY_RATES.projectManager },
          { role: "디자이너", days: f.allocation.designer, dailyRate: DAILY_RATES.designer },
        ]
          .filter(r => r.days > 0)
          .map(r => ({
            ...r,
            cost: Math.round(r.days * r.dailyRate)
          }))

        return {
          name: f.name,
          cost: calculateFeatureCost(f.allocation),
          allocation: allocations,
          roles
        }
      })

    // 타임라인 데이터 계산 (제외된 기능 제외)
    const includedFeaturesForTimeline = estimate.features.filter((_, index) => !excludedFeatures.has(index))
    const timelineData = calculateTimeline(includedFeaturesForTimeline)

    return {
      companyName: surveyData.companyName || "Company",
      productCategory: categoryLabels[surveyData.productCategory || ""] || surveyData.productCategory || "",
      date: new Date().toLocaleDateString("ko-KR"),
      totalCost,
      featureCount: includedFeatures.length,
      totalDays: Math.ceil(costs.totalDays),
      teamCount: costs.personnelSummary.length,
      laborCost: combinedLabor,
      overhead: discountedOverhead,
      technicalFee: discountedTechFee,
      subtotal,
      vat,
      truncationDiscount,
      preprocessing3DCost: prep3DTotalCost,
      preprocessing3DUnitCost: prep3DUnitCost,
      productCount: prodCount,
      aiAnalysisCost: aiCostsData?.laborCost || 0,
      personnel: costs.personnelSummary.map(p => ({
        role: p.role,
        days: p.days,
        dailyRate: p.dailyRate,
        totalCost: p.totalCost
      })),
      features: includedFeatures,
      file3DAnalysis: file3DAnalysis ? {
        fileName: file3DAnalysis.fileName,
        format: file3DAnalysis.format,
        fileSizeFormatted: file3DAnalysis.fileSizeFormatted,
        qualityGrade: file3DAnalysis.qualityGrade,
        unitCost: file3DAnalysis.cost.unitCost
      } : undefined,
      aiAnalysis: aiAnalysis ? {
        summary: aiAnalysis.analysis.summary,
        complexity: complexityLabels[aiAnalysis.analysis.estimatedComplexity] || aiAnalysis.analysis.estimatedComplexity,
        tasks: aiAnalysis.analysis.developmentTasks
          .filter((_, index) => !excludedAiTasks.has(index))
          .map(t => {
            const taskDailyRate = 350000 // 평균 단가
            return {
              name: t.name,
              category: t.category,
              days: t.estimatedDays,
              cost: t.estimatedDays * taskDailyRate
            }
          })
      } : undefined,
      timeline: timelineData,
      // 할인 정보
      discount: totalDiscount > 0 ? {
        originalTotal,
        totalDiscount,
        discountPercentage,
        overheadDiscount: overheadDiscountEnabled ? { rate: overheadDiscountRate, amount: overheadDiscount } : undefined,
        techFeeDiscount: techFeeDiscountEnabled ? { rate: techFeeDiscountRate, amount: techFeeDiscount } : undefined,
      } : undefined,
      // 유지비 정보
      maintenance: (() => {
        if (!surveyData.maintenancePlan || surveyData.maintenancePlan === "none") return undefined
        const plan = MAINTENANCE_PLANS.find(p => p.id === surveyData.maintenancePlan)
        if (!plan) return undefined
        // AI 실사 렌더링 유지비
        const aiRenderingMaintenanceCost = surveyData.aiRealisticRendering
          ? (surveyData.aiRenderingImagesPerYear ?? 1) * 2500000
          : 0
        return {
          planName: plan.name,
          annualCost: plan.annualCost + aiRenderingMaintenanceCost,
          ticketsPerYear: plan.ticketsPerYear,
          managerHoursPerMonth: plan.managerHoursPerMonth,
          serverCosts: plan.serverCosts,
          firstYearFree: maintenanceFirstYearFree,
          aiRenderingCost: aiRenderingMaintenanceCost,
          aiRenderingImages: surveyData.aiRealisticRendering ? surveyData.aiRenderingImagesPerYear : 0,
        }
      })(),
    }
  }

  // PDF 내보내기
  const handleExportPDF = async () => {
    if (!printRef.current || !surveyData) return

    setIsExportingPDF(true)
    try {
      const filename = `견적서_${surveyData.companyName || "Project"}_${new Date().toISOString().split("T")[0]}.pdf`
      await exportElementToPDF(printRef.current, { filename })
    } catch (error) {
      console.error("PDF 내보내기 실패:", error)
      alert("PDF 내보내기에 실패했습니다. 다시 시도해주세요.")
    } finally {
      setIsExportingPDF(false)
    }
  }

  // HTML 내보내기
  const handleExportHTML = () => {
    const data = getPrintViewData()
    if (!data || !surveyData) return

    try {
      const html = generateEstimateHTML(data)
      const filename = `견적서_${surveyData.companyName || "Project"}_${new Date().toISOString().split("T")[0]}.html`
      downloadHTML(html, filename)
    } catch (error) {
      console.error("HTML 내보내기 실패:", error)
      alert("HTML 내보내기에 실패했습니다. 다시 시도해주세요.")
    }
  }

  const printViewData = getPrintViewData()

  if (!surveyData || !estimate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">견적서 생성 중...</p>
        </div>
      </div>
    )
  }

  // 실시간 비용 계산
  const adjustedCosts = recalculateCosts(estimate.features, excludedFeatures)

  // AI 분석 비용 계산
  const aiCosts = recalculateAiCosts()
  const hasAiExclusions = excludedAiTasks.size > 0

  // 3D 전처리 비용 (제품 수량 * 단가)
  const productCount = parseInt(surveyData?.productCount || "1")
  const preprocessing3DUnitCost = file3DAnalysis?.cost.unitCost || 0
  const preprocessing3DTotalCost = preprocessing3DUnitCost * productCount

  // 전체 합계 계산 (기존 견적 + AI 분석 + 3D 전처리)
  const combinedLaborCost = adjustedCosts.laborCost + (aiCosts?.laborCost || 0)

  // 원래 제경비 및 기술료 (할인 전)
  const originalOverhead = Math.round(combinedLaborCost * 1.1)
  const originalTechFee = Math.round((combinedLaborCost + originalOverhead) * 0.2)

  // 할인 적용
  const currentOverheadDiscount = overheadDiscountEnabled ? Math.round(originalOverhead * overheadDiscountRate / 100) : 0
  const currentTechFeeDiscount = techFeeDiscountEnabled ? Math.round(originalTechFee * techFeeDiscountRate / 100) : 0

  const combinedOverhead = originalOverhead - currentOverheadDiscount
  const combinedTechnicalFee = originalTechFee - currentTechFeeDiscount

  const combinedSubtotal = combinedLaborCost + combinedOverhead + combinedTechnicalFee + preprocessing3DTotalCost
  const combinedVat = Math.round(combinedSubtotal * 0.1)
  const combinedTotalBeforeDiscount = combinedSubtotal + combinedVat
  const combinedTruncationDiscount = combinedTotalBeforeDiscount % 10000
  const combinedTotalCost = combinedTotalBeforeDiscount - combinedTruncationDiscount

  // 원래 총 금액 (할인 없이)
  const originalSubtotal = combinedLaborCost + originalOverhead + originalTechFee + preprocessing3DTotalCost
  const originalVat = Math.round(originalSubtotal * 0.1)
  const originalTotalBeforeDiscount = originalSubtotal + originalVat
  const originalTruncDiscount = originalTotalBeforeDiscount % 10000
  const originalTotalCost = originalTotalBeforeDiscount - originalTruncDiscount

  // 총 할인액 및 할인율
  const totalDiscountAmount = currentOverheadDiscount + currentTechFeeDiscount
  const discountPercentage = originalTotalCost > 0 ? Math.round((totalDiscountAmount / originalTotalCost) * 1000) / 10 : 0
  const hasDiscount = overheadDiscountEnabled || techFeeDiscountEnabled

  const totalDuration = estimate.timeline.reduce((total, phase) => {
    const weeks = parseInt(phase.duration)
    return total + weeks
  }, 0)

  const categoryLabel = categoryLabels[surveyData.productCategory || ""] || surveyData.productCategory
  const hasExclusions = excludedFeatures.size > 0

  // 카테고리 아이콘/색상 매핑
  const categoryColors: Record<string, string> = {
    frontend: "bg-blue-100 text-blue-700",
    backend: "bg-green-100 text-green-700",
    integration: "bg-purple-100 text-purple-700",
    design: "bg-pink-100 text-pink-700",
    infrastructure: "bg-orange-100 text-orange-700",
    other: "bg-gray-100 text-gray-700",
  }

  const categoryLabelsKr: Record<string, string> = {
    frontend: "프론트엔드",
    backend: "백엔드",
    integration: "연동",
    design: "디자인",
    infrastructure: "인프라",
    other: "기타",
  }

  const complexityColors: Record<string, string> = {
    low: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700",
  }

  const complexityLabelsKr: Record<string, string> = {
    low: "낮음",
    medium: "중간",
    high: "높음",
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/quote">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="size-4 mr-2" />
              설문으로 돌아가기
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportHTML}>
              <FileCode className="size-4 mr-2" />
              HTML 내보내기
            </Button>
            <Button size="sm" onClick={handleExportPDF} disabled={isExportingPDF}>
              {isExportingPDF ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  내보내는 중...
                </>
              ) : (
                <>
                  <Download className="size-4 mr-2" />
                  PDF 내보내기
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <Badge className="mb-4">견적 완료</Badge>
          <h1 className="text-3xl font-semibold mb-2">프로젝트 견적 및 개발 계획</h1>
          <p className="text-muted-foreground">
            {surveyData.companyName} - {categoryLabel} 컨피규레이터
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Project Overview & Cost */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="size-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>프로젝트 개요</CardTitle>
                    <CardDescription>설문 응답 기반 요약</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <Package className="size-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-semibold">{surveyData.productCount}</p>
                    <p className="text-sm text-muted-foreground">제품 수</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <Layers className="size-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-semibold">{adjustedCosts.includedCount}</p>
                    <p className="text-sm text-muted-foreground">기능 수</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <Users className="size-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-semibold">{adjustedCosts.personnelSummary.length}</p>
                    <p className="text-sm text-muted-foreground">투입 인력</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <Clock className="size-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-semibold">{Math.ceil(adjustedCosts.totalDays)}</p>
                    <p className="text-sm text-muted-foreground">영업일</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personnel Summary */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="size-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>인력 투입 계획</CardTitle>
                    <CardDescription>인력 유형별 투입일수 및 인건비</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 font-medium">인력 유형</th>
                        <th className="text-right py-3 font-medium">일일 단가</th>
                        <th className="text-right py-3 font-medium">투입일수</th>
                        <th className="text-right py-3 font-medium">소계</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adjustedCosts.personnelSummary.map((person, index) => (
                        <tr key={index} className="border-b last:border-b-0">
                          <td className="py-3">{person.role}</td>
                          <td className="text-right py-3 text-muted-foreground">
                            {person.dailyRate.toLocaleString()}원
                          </td>
                          <td className="text-right py-3">{person.days}일</td>
                          <td className="text-right py-3 font-medium">
                            {person.totalCost.toLocaleString()}원
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50">
                        <td colSpan={3} className="py-3 font-semibold">인건비 원가 합계</td>
                        <td className="text-right py-3 font-bold">
                          {adjustedCosts.laborCost.toLocaleString()}원
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calculator className="size-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>비용 산출 내역</CardTitle>
                    <CardDescription>인건비, 제경비, 기술료, VAT 포함{aiAnalysis && " (AI 분석 포함)"}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">기본 기능 인건비</span>
                    <span className="font-medium">{adjustedCosts.laborCost.toLocaleString()}원</span>
                  </div>
                  {aiCosts && aiCosts.laborCost > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Sparkles className="size-4 text-purple-500" />
                        AI 분석 요구사항 인건비
                      </span>
                      <span className="font-medium text-purple-600">{aiCosts.laborCost.toLocaleString()}원</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 bg-slate-50 px-2 rounded">
                    <span className="font-medium">인건비 원가 합계</span>
                    <span className="font-semibold">{combinedLaborCost.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">제경비 (110%)</span>
                    <span className="font-medium">{combinedOverhead.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">기술료 (20%)</span>
                    <span className="font-medium">{combinedTechnicalFee.toLocaleString()}원</span>
                  </div>
                  {preprocessing3DTotalCost > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <FileBox className="size-4 text-cyan-500" />
                        3D 전처리 ({productCount}개 × {preprocessing3DUnitCost.toLocaleString()}원)
                      </span>
                      <span className="font-medium text-cyan-600">{preprocessing3DTotalCost.toLocaleString()}원</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">소계 (VAT 제외)</span>
                    <span className="font-medium">{combinedSubtotal.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">부가가치세 (10%)</span>
                    <span className="font-medium">{combinedVat.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">합계 (VAT 포함)</span>
                    <span className="font-medium">{combinedTotalBeforeDiscount.toLocaleString()}원</span>
                  </div>
                  {combinedTruncationDiscount > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-green-600">절사금</span>
                      <span className="font-medium text-green-600">-{combinedTruncationDiscount.toLocaleString()}원</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center py-3 text-lg">
                    <span className="font-semibold">총 예상 비용</span>
                    <span className="font-bold text-primary">{combinedTotalCost.toLocaleString()}원</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature Cost Breakdown */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Layers className="size-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>기능별 상세 내역</CardTitle>
                      <CardDescription>각 기능별 인력 투입 및 비용 (클릭하여 제외/포함)</CardDescription>
                    </div>
                  </div>
                  {hasExclusions && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetExclusions}
                      className="shrink-0"
                    >
                      <RotateCcw className="size-4 mr-2" />
                      초기화
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {estimate.features.map((feature, index) => {
                    const featureCost = calculateFeatureCost(feature.allocation)
                    const isExcluded = excludedFeatures.has(index)
                    const allocations = [
                      { role: "XR 개발자", days: feature.allocation.xrDeveloper },
                      { role: "시스템 엔지니어", days: feature.allocation.systemEngineer },
                      { role: "PM", days: feature.allocation.projectManager },
                      { role: "디자이너", days: feature.allocation.designer },
                    ].filter(a => a.days > 0)

                    return (
                      <div
                        key={index}
                        className={`p-4 border rounded-lg transition-all ${
                          isExcluded
                            ? "bg-slate-100 border-dashed opacity-60"
                            : "bg-white hover:border-primary/50"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2 flex-1">
                            {isExcluded ? (
                              <X className="size-4 text-muted-foreground shrink-0" />
                            ) : (
                              <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                            )}
                            <span className={`font-medium ${isExcluded ? "line-through text-muted-foreground" : ""}`}>
                              {feature.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`font-semibold ${isExcluded ? "line-through text-muted-foreground" : "text-primary"}`}>
                              {featureCost.toLocaleString()}원
                            </span>
                            <Button
                              variant={isExcluded ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleFeatureExclusion(index)}
                              className="shrink-0"
                            >
                              {isExcluded ? "포함" : "제외"}
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {allocations.map((alloc, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className={`text-xs ${isExcluded ? "opacity-50" : ""}`}
                            >
                              {alloc.role}: {alloc.days}일
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {hasExclusions && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      {excludedFeatures.size}개 기능이 제외되었습니다. 위의 비용 산출 내역에 반영됩니다.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI 분석 결과 */}
            {aiAnalysis && (
              <Card className="border-2 border-purple-200">
                <CardHeader className="bg-purple-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Sparkles className="size-5 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          AI 요구사항 분석 결과
                          <Badge className={complexityColors[aiAnalysis.analysis.estimatedComplexity]}>
                            복잡도: {complexityLabelsKr[aiAnalysis.analysis.estimatedComplexity]}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          기타 요구사항을 AI가 분석하여 도출한 개발 작업입니다
                        </CardDescription>
                      </div>
                    </div>
                    {hasAiExclusions && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetAiExclusions}
                        className="shrink-0"
                      >
                        <RotateCcw className="size-4 mr-2" />
                        초기화
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* 요약 */}
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <p className="text-sm text-purple-800">{aiAnalysis.analysis.summary}</p>
                  </div>

                  {/* 개발 작업 목록 */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Code2 className="size-4" />
                      식별된 개발 작업
                    </h4>
                    {aiAnalysis.analysis.developmentTasks.map((task, index) => {
                      const isExcluded = excludedAiTasks.has(index)
                      const taskDailyRate = 350000 // 평균 단가
                      const taskCost = task.estimatedDays * taskDailyRate

                      return (
                        <div
                          key={index}
                          className={`p-4 border rounded-lg transition-all ${
                            isExcluded
                              ? "bg-slate-100 border-dashed opacity-60"
                              : "bg-white hover:border-purple-300"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {isExcluded ? (
                                  <X className="size-4 text-muted-foreground shrink-0" />
                                ) : (
                                  <CheckCircle2 className="size-4 text-purple-500 shrink-0" />
                                )}
                                <span className={`font-medium ${isExcluded ? "line-through text-muted-foreground" : ""}`}>
                                  {task.name}
                                </span>
                                <Badge className={`text-xs ${categoryColors[task.category]}`}>
                                  {categoryLabelsKr[task.category] || task.category}
                                </Badge>
                              </div>
                              <p className={`text-sm text-muted-foreground ml-6 ${isExcluded ? "line-through" : ""}`}>
                                {task.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                              <div className="text-right">
                                <p className={`font-semibold ${isExcluded ? "line-through text-muted-foreground" : "text-purple-600"}`}>
                                  {task.estimatedDays}일
                                </p>
                                <p className={`text-xs ${isExcluded ? "line-through text-muted-foreground" : "text-muted-foreground"}`}>
                                  ~{taskCost.toLocaleString()}원
                                </p>
                              </div>
                              <Button
                                variant={isExcluded ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleAiTaskExclusion(index)}
                                className="shrink-0"
                              >
                                {isExcluded ? "포함" : "제외"}
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 ml-6">
                            {task.requiredRoles.map((role, i) => (
                              <Badge key={i} variant="secondary" className={`text-xs ${isExcluded ? "opacity-50" : ""}`}>
                                {ROLE_LABELS[role] || role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* 기술 고려사항 */}
                  {aiAnalysis.analysis.technicalConsiderations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Lightbulb className="size-4 text-yellow-500" />
                        기술 고려사항
                      </h4>
                      <ul className="space-y-1 ml-6">
                        {aiAnalysis.analysis.technicalConsiderations.map((item, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-yellow-500 mt-1">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 위험 요소 */}
                  {aiAnalysis.analysis.risks.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <AlertTriangle className="size-4 text-orange-500" />
                        잠재적 위험 요소
                      </h4>
                      <ul className="space-y-1 ml-6">
                        {aiAnalysis.analysis.risks.map((item, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-orange-500 mt-1">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {hasAiExclusions && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        {excludedAiTasks.size}개 AI 분석 작업이 제외되었습니다. 비용 산출 내역에 반영됩니다.
                      </p>
                    </div>
                  )}

                  {/* AI 분석 비용 소계 */}
                  {aiCosts && aiCosts.laborCost > 0 && (
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-purple-800">AI 분석 요구사항 인건비 소계</span>
                        <span className="text-lg font-bold text-purple-600">{aiCosts.laborCost.toLocaleString()}원</span>
                      </div>
                      <p className="text-xs text-purple-600 mt-1">
                        {aiCosts.includedCount}개 작업 포함 • 위 비용은 총 비용에 합산됩니다
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 3D 파일 전처리 비용 */}
            {file3DAnalysis && (
              <Card className="border-2 border-cyan-200">
                <CardHeader className="bg-cyan-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-100 rounded-lg">
                      <FileBox className="size-5 text-cyan-600" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        3D 파일 전처리 비용
                        <Badge className={
                          file3DAnalysis.qualityGrade === "excellent" ? "bg-green-100 text-green-700" :
                          file3DAnalysis.qualityGrade === "good" ? "bg-blue-100 text-blue-700" :
                          file3DAnalysis.qualityGrade === "fair" ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }>
                          {file3DAnalysis.qualityGrade === "excellent" ? "최상" :
                           file3DAnalysis.qualityGrade === "good" ? "양호" :
                           file3DAnalysis.qualityGrade === "fair" ? "보통" : "개선 필요"}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        업로드된 3D 파일의 품질 분석 및 전처리 비용
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {/* 파일 정보 */}
                  <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-100">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-lg border border-cyan-200">
                        <FileBox className="size-8 text-cyan-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium truncate">{file3DAnalysis.fileName}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileType className="size-4" />
                            {file3DAnalysis.format}
                          </span>
                          <span className="flex items-center gap-1">
                            <HardDrive className="size-4" />
                            {file3DAnalysis.fileSizeFormatted}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-cyan-700 mt-3">
                      {file3DAnalysis.qualityMessage}
                    </p>
                  </div>

                  {/* 전처리 필요 항목 */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <AlertCircle className="size-4 text-cyan-600" />
                      전처리 필요 항목
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {file3DAnalysis.preprocessing.modelOptimization && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="font-medium text-red-700 text-sm">모델링 최적화</p>
                          <p className="text-xs text-red-600 mt-1">
                            {file3DAnalysis.cost.modelOptimizationCost.toLocaleString()}원
                          </p>
                        </div>
                      )}
                      {file3DAnalysis.preprocessing.meshOptimization && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="font-medium text-amber-700 text-sm">메쉬 최적화</p>
                          <p className="text-xs text-amber-600 mt-1">
                            {file3DAnalysis.cost.meshOptimizationCost.toLocaleString()}원
                          </p>
                        </div>
                      )}
                      {file3DAnalysis.preprocessing.textureMapping && (
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <p className="font-medium text-purple-700 text-sm">텍스처 맵핑</p>
                          <p className="text-xs text-purple-600 mt-1">
                            {file3DAnalysis.cost.textureMappingCost.toLocaleString()}원
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 비용 내역 */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">기본 전처리 비용</span>
                      <span className="font-medium">{file3DAnalysis.cost.baseCost.toLocaleString()}원</span>
                    </div>
                    {file3DAnalysis.cost.modelOptimizationCost > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">모델링 최적화</span>
                        <span className="font-medium">{file3DAnalysis.cost.modelOptimizationCost.toLocaleString()}원</span>
                      </div>
                    )}
                    {file3DAnalysis.cost.meshOptimizationCost > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">메쉬 최적화</span>
                        <span className="font-medium">{file3DAnalysis.cost.meshOptimizationCost.toLocaleString()}원</span>
                      </div>
                    )}
                    {file3DAnalysis.cost.textureMappingCost > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">텍스처 맵핑</span>
                        <span className="font-medium">{file3DAnalysis.cost.textureMappingCost.toLocaleString()}원</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-cyan-700">파일당 전처리 비용</span>
                      <span className="text-cyan-700">{file3DAnalysis.cost.unitCost.toLocaleString()}원</span>
                    </div>
                  </div>

                  {/* 총 전처리 비용 (제품 수량 기반) */}
                  <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-cyan-700">파일당 전처리 비용</span>
                      <span className="font-medium text-cyan-700">{preprocessing3DUnitCost.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-cyan-700">제품 수량</span>
                      <span className="font-medium text-cyan-700">× {productCount}개</span>
                    </div>
                    <Separator className="border-cyan-200" />
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-cyan-800">3D 전처리 비용 합계</span>
                      <span className="text-lg font-bold text-cyan-600">
                        {preprocessing3DTotalCost.toLocaleString()}원
                      </span>
                    </div>
                    <p className="text-xs text-cyan-600">
                      위 비용은 총 비용에 합산됩니다
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Development Timeline - Gantt Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="size-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>개발 일정 타임라인</CardTitle>
                    <CardDescription>포지션별 작업 스케줄 (의존성 기반 배치)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ProjectTimeline
                  features={estimate.features.filter((_, index) => !excludedFeatures.has(index))}
                />
              </CardContent>
            </Card>

            {/* 서비스 유지비 */}
            {surveyData?.maintenancePlan && surveyData.maintenancePlan !== "none" && (() => {
              const selectedPlan = MAINTENANCE_PLANS.find(p => p.id === surveyData.maintenancePlan)
              if (!selectedPlan) return null

              const monthlyServerCost = Object.values(selectedPlan.serverCosts).reduce((a, b) => a + b, 0)
              const annualServerCost = monthlyServerCost * 12
              const managerCost = selectedPlan.annualCost - annualServerCost
              // AI 실사 렌더링 연간 유지비 (1만장당 250만원)
              const aiRenderingMaintenanceCost = surveyData.aiRealisticRendering
                ? (surveyData.aiRenderingImagesPerYear ?? 1) * 2500000
                : 0
              const totalAnnualCost = selectedPlan.annualCost + aiRenderingMaintenanceCost
              const effectiveCost = maintenanceFirstYearFree ? 0 : totalAnnualCost

              return (
                <Card className="border-2 border-emerald-200">
                  <CardHeader className="bg-emerald-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <Shield className="size-5 text-emerald-600" />
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            서비스 유지비
                            <Badge className="bg-emerald-500">{selectedPlan.name}</Badge>
                          </CardTitle>
                          <CardDescription>연간 서버 운영 및 유지보수</CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        {maintenanceFirstYearFree ? (
                          <>
                            <p className="text-lg text-muted-foreground line-through">
                              연 {(totalAnnualCost / 10000).toLocaleString()}만원
                            </p>
                            <p className="text-2xl font-bold text-emerald-600">1년차 무료</p>
                          </>
                        ) : (
                          <p className="text-2xl font-bold text-emerald-600">
                            연 {(totalAnnualCost / 10000).toLocaleString()}만원
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* 플랜 개요 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-emerald-50 rounded-lg text-center">
                        <Ticket className="size-6 text-emerald-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-emerald-700">{selectedPlan.ticketsPerYear}</p>
                        <p className="text-sm text-muted-foreground">연간 지원 티켓</p>
                      </div>
                      <div className="p-4 bg-emerald-50 rounded-lg text-center">
                        <Wrench className="size-6 text-emerald-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-emerald-700">{selectedPlan.managerHoursPerMonth}시간</p>
                        <p className="text-sm text-muted-foreground">월 유지관리</p>
                      </div>
                      <div className="p-4 bg-emerald-50 rounded-lg text-center">
                        <Server className="size-6 text-emerald-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-emerald-700">{(monthlyServerCost / 10000).toFixed(1)}만</p>
                        <p className="text-sm text-muted-foreground">월 서버 비용</p>
                      </div>
                      <div className="p-4 bg-emerald-50 rounded-lg text-center">
                        <Users className="size-6 text-emerald-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-emerald-700">{(managerCost / 10000).toLocaleString()}만</p>
                        <p className="text-sm text-muted-foreground">연 인건비</p>
                      </div>
                    </div>

                    {/* 서비스 내용 */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2 text-sm">
                          <Wrench className="size-4 text-emerald-600" />
                          유지보수 서비스
                        </h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-emerald-500" />
                            에러 조치 및 버그 수정
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-emerald-500" />
                            환경 변화 대응 (브라우저, OS 업데이트)
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-emerald-500" />
                            경미한 변경 사항 반영
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-emerald-500" />
                            담당 매니저 월 {selectedPlan.managerHoursPerMonth}시간 투입
                          </li>
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2 text-sm">
                          <Server className="size-4 text-emerald-600" />
                          서버 비용 상세 (월 기준)
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Route53 + Vercel 웹 호스팅</span>
                            <span>{selectedPlan.serverCosts.webHosting.toLocaleString()}원</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">AWS S3 모델 파일 스토리지</span>
                            <span>{selectedPlan.serverCosts.storage.toLocaleString()}원</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">AWS 3D 렌더링 인스턴스</span>
                            <span>{selectedPlan.serverCosts.rendering.toLocaleString()}원</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">AWS 주문 연동 서버</span>
                            <span>{selectedPlan.serverCosts.orderServer.toLocaleString()}원</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Supabase DB</span>
                            <span>{selectedPlan.serverCosts.database.toLocaleString()}원</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-medium">
                            <span>월 서버 비용 합계</span>
                            <span className="text-emerald-600">{monthlyServerCost.toLocaleString()}원</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 비용 요약 */}
                    <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">연간 서버 비용 (월 {monthlyServerCost.toLocaleString()}원 × 12)</span>
                        <span>{annualServerCost.toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">연간 유지관리 인건비</span>
                        <span>{managerCost.toLocaleString()}원</span>
                      </div>
                      {aiRenderingMaintenanceCost > 0 && (
                        <div className="flex justify-between text-sm text-violet-600">
                          <span>AI 실사 렌더링 (연간 {surveyData.aiRenderingImagesPerYear}만장)</span>
                          <span>{aiRenderingMaintenanceCost.toLocaleString()}원</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>연간 유지비 합계</span>
                        <span className="text-emerald-600">{totalAnnualCost.toLocaleString()}원</span>
                      </div>
                    </div>

                    {/* 1년차 면제 옵션 */}
                    <div className="p-4 border-2 border-dashed border-emerald-300 rounded-lg bg-emerald-50/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="maintenance-first-year-free"
                            checked={maintenanceFirstYearFree}
                            onCheckedChange={(checked) => setMaintenanceFirstYearFree(checked === true)}
                          />
                          <div>
                            <Label htmlFor="maintenance-first-year-free" className="cursor-pointer flex items-center gap-2">
                              <Gift className="size-4 text-emerald-600" />
                              <span className="font-medium">1년차 유지비 면제</span>
                            </Label>
                            <p className="text-sm text-muted-foreground">개발 계약 시 1년차 유지비를 면제합니다</p>
                          </div>
                        </div>
                        {maintenanceFirstYearFree && (
                          <Badge className="bg-emerald-500">
                            -{totalAnnualCost.toLocaleString()}원
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })()}
          </div>

          {/* Right Column - Summary & Actions */}
          <div className="space-y-6">
            {/* Quick Summary */}
            <Card className="sticky top-6">
              <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
                <CardTitle className="text-center">견적 요약</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  {hasDiscount && (
                    <p className="text-xl text-muted-foreground line-through mb-1">
                      {originalTotalCost.toLocaleString()}원
                    </p>
                  )}
                  <p className="text-3xl font-bold">{combinedTotalCost.toLocaleString()}원</p>
                  <p className="text-sm text-muted-foreground mt-1">VAT 포함 총 비용</p>
                  {hasDiscount && (
                    <Badge className="mt-2 bg-red-100 text-red-700">
                      <Tag className="size-3 mr-1" />
                      {discountPercentage}% 할인 (-{totalDiscountAmount.toLocaleString()}원)
                    </Badge>
                  )}
                  {(hasExclusions || hasAiExclusions) && (
                    <p className="text-xs text-amber-600 mt-1">
                      ({excludedFeatures.size + excludedAiTasks.size}개 항목 제외됨)
                    </p>
                  )}
                  <div className="flex justify-center gap-1 mt-2 flex-wrap">
                    {aiAnalysis && (
                      <Badge className="bg-purple-100 text-purple-700">
                        <Sparkles className="size-3 mr-1" />
                        AI 분석 포함
                      </Badge>
                    )}
                    {file3DAnalysis && (
                      <Badge className="bg-cyan-100 text-cyan-700">
                        <FileBox className="size-3 mr-1" />
                        3D 전처리 포함
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">기본 기능 인건비</span>
                    <span className="font-medium">{adjustedCosts.laborCost.toLocaleString()}원</span>
                  </div>
                  {aiCosts && aiCosts.laborCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Sparkles className="size-3 text-purple-500" />
                        AI 분석
                      </span>
                      <span className="font-medium text-purple-600">{aiCosts.laborCost.toLocaleString()}원</span>
                    </div>
                  )}
                  <div className="flex justify-between bg-slate-50 px-1 py-1 rounded">
                    <span className="text-muted-foreground">인건비 합계</span>
                    <span className="font-semibold">{combinedLaborCost.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">제경비 (110%)</span>
                    <span className="font-medium">
                      {overheadDiscountEnabled && (
                        <span className="text-muted-foreground line-through mr-2 text-xs">
                          {originalOverhead.toLocaleString()}원
                        </span>
                      )}
                      <span className={overheadDiscountEnabled ? "text-red-600" : ""}>
                        {combinedOverhead.toLocaleString()}원
                      </span>
                      {overheadDiscountEnabled && (
                        <span className="text-red-500 text-xs ml-1">(-{overheadDiscountRate}%)</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">기술료 (20%)</span>
                    <span className="font-medium">
                      {techFeeDiscountEnabled && (
                        <span className="text-muted-foreground line-through mr-2 text-xs">
                          {originalTechFee.toLocaleString()}원
                        </span>
                      )}
                      <span className={techFeeDiscountEnabled ? "text-red-600" : ""}>
                        {combinedTechnicalFee.toLocaleString()}원
                      </span>
                      {techFeeDiscountEnabled && (
                        <span className="text-red-500 text-xs ml-1">(-{techFeeDiscountRate}%)</span>
                      )}
                    </span>
                  </div>
                  {preprocessing3DTotalCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <FileBox className="size-3 text-cyan-500" />
                        3D 전처리 ({productCount}개)
                      </span>
                      <span className="font-medium text-cyan-600">{preprocessing3DTotalCost.toLocaleString()}원</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">VAT (10%)</span>
                    <span className="font-medium">{combinedVat.toLocaleString()}원</span>
                  </div>
                  {combinedTruncationDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-600">절사금</span>
                      <span className="font-medium text-green-600">-{combinedTruncationDiscount.toLocaleString()}원</span>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">소요 기간</span>
                    <span className="font-medium">{totalDuration}주 ({Math.ceil(adjustedCosts.totalDays)}일)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">투입 인력</span>
                    <span className="font-medium">{adjustedCosts.personnelSummary.length}개 직군</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">기본 기능</span>
                    <span className="font-medium">{adjustedCosts.includedCount}개</span>
                  </div>
                  {aiCosts && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Sparkles className="size-3 text-purple-500" />
                        AI 분석 작업
                      </span>
                      <span className="font-medium text-purple-600">{aiCosts.includedCount}개</span>
                    </div>
                  )}
                </div>

                {/* 유지비 요약 */}
                {surveyData?.maintenancePlan && surveyData.maintenancePlan !== "none" && (() => {
                  const selectedPlan = MAINTENANCE_PLANS.find(p => p.id === surveyData.maintenancePlan)
                  if (!selectedPlan) return null
                  // AI 실사 렌더링 유지비
                  const aiRenderingCost = surveyData.aiRealisticRendering
                    ? (surveyData.aiRenderingImagesPerYear ?? 1) * 2500000
                    : 0
                  const totalCost = selectedPlan.annualCost + aiRenderingCost
                  return (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2 font-medium">
                          <Shield className="size-4 text-emerald-500" />
                          <span>연간 유지비</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground flex items-center gap-1">
                            {selectedPlan.name} 플랜{aiRenderingCost > 0 ? " + AI 렌더링" : ""}
                          </span>
                          {maintenanceFirstYearFree ? (
                            <div className="text-right">
                              <span className="text-muted-foreground line-through text-xs mr-2">
                                {totalCost.toLocaleString()}원
                              </span>
                              <span className="font-medium text-emerald-600">1년차 무료</span>
                            </div>
                          ) : (
                            <span className="font-medium text-emerald-600">{totalCost.toLocaleString()}원</span>
                          )}
                        </div>
                      </div>
                    </>
                  )
                })()}

                <Separator className="my-4" />

                {/* 할인 설정 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Tag className="size-4 text-red-500" />
                    <span>할인 설정</span>
                  </div>

                  {/* 제경비 할인 */}
                  <div className="p-3 border rounded-lg bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="overhead-discount"
                          checked={overheadDiscountEnabled}
                          onCheckedChange={(checked) => setOverheadDiscountEnabled(checked === true)}
                        />
                        <Label htmlFor="overhead-discount" className="text-sm cursor-pointer">
                          제경비 할인
                        </Label>
                      </div>
                      {overheadDiscountEnabled && (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={overheadDiscountRate}
                            onChange={(e) => setOverheadDiscountRate(Math.min(100, Math.max(1, parseInt(e.target.value) || 0)))}
                            className="w-16 h-8 text-center text-sm"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      )}
                    </div>
                    {overheadDiscountEnabled && (
                      <p className="text-xs text-red-600 pl-6">
                        -{currentOverheadDiscount.toLocaleString()}원 할인
                      </p>
                    )}
                  </div>

                  {/* 기술료 할인 */}
                  <div className="p-3 border rounded-lg bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="techfee-discount"
                          checked={techFeeDiscountEnabled}
                          onCheckedChange={(checked) => setTechFeeDiscountEnabled(checked === true)}
                        />
                        <Label htmlFor="techfee-discount" className="text-sm cursor-pointer">
                          기술료 할인
                        </Label>
                      </div>
                      {techFeeDiscountEnabled && (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={techFeeDiscountRate}
                            onChange={(e) => setTechFeeDiscountRate(Math.min(100, Math.max(1, parseInt(e.target.value) || 0)))}
                            className="w-16 h-8 text-center text-sm"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      )}
                    </div>
                    {techFeeDiscountEnabled && (
                      <p className="text-xs text-red-600 pl-6">
                        -{currentTechFeeDiscount.toLocaleString()}원 할인
                      </p>
                    )}
                  </div>

                  {hasDiscount && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-red-700">총 할인</span>
                        <span className="font-bold text-red-700">-{totalDiscountAmount.toLocaleString()}원</span>
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <Button className="w-full" size="lg">
                    <FileText className="size-4 mr-2" />
                    상세 제안서 요청
                  </Button>
                  <Button variant="outline" className="w-full">
                    상담 예약하기
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  본 견적은 예상 금액이며, 상세 요구사항에 따라 변동될 수 있습니다.
                </p>
              </CardContent>
            </Card>

            {/* Selected Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">포함된 기능</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {estimate.features.map((feature, index) => {
                    const isExcluded = excludedFeatures.has(index)
                    if (isExcluded) return null
                    return (
                      <Badge key={index} variant="secondary" className="text-xs">
                        <Zap className="size-3 mr-1" />
                        {feature.name}
                      </Badge>
                    )
                  })}
                </div>
                {hasExclusions && (
                  <>
                    <Separator className="my-3" />
                    <p className="text-xs text-muted-foreground mb-2">제외된 기능</p>
                    <div className="flex flex-wrap gap-2">
                      {estimate.features.map((feature, index) => {
                        const isExcluded = excludedFeatures.has(index)
                        if (!isExcluded) return null
                        return (
                          <Badge key={index} variant="outline" className="text-xs opacity-50">
                            <X className="size-3 mr-1" />
                            {feature.name}
                          </Badge>
                        )
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* PDF 출력용 숨겨진 컴포넌트 */}
      {printViewData && (
        <div
          style={{
            position: "absolute",
            left: "-9999px",
            top: 0,
            width: "210mm",
          }}
        >
          <EstimatePrintView ref={printRef} data={printViewData} />
        </div>
      )}
    </div>
  )
}
