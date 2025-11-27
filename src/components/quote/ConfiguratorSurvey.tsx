"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Upload, CheckCircle2, Building2, Package, Settings, Zap, FileText, LayoutDashboard, Pencil, Sparkles, Loader2, X, FileBox, HardDrive, FileType, AlertTriangle, AlertCircle, Wrench, Server, Ticket, Shield, Home, ArrowLeft } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { analyze3DFile, serializeAnalysis, type File3DAnalysis } from "@/lib/3d-analysis"
import { File3DPreview } from "@/components/quote/File3DPreview"

// 유지비 플랜 타입
export type MaintenancePlanType = "basic" | "standard" | "premium" | "none"

// 유지비 플랜 정보
export interface MaintenancePlan {
  id: MaintenancePlanType
  name: string
  annualCost: number
  ticketsPerYear: number
  serverCosts: {
    webHosting: number      // Route53 + Vercel 웹 호스팅
    storage: number         // AWS S3 모델 파일 스토리지
    rendering: number       // AWS 인스턴스 3D 렌더링
    orderServer: number     // AWS 인스턴스 주문 연동 서버
    database: number        // Supabase DB
  }
  managerHoursPerMonth: number
  description: string
}

export const MAINTENANCE_PLANS: MaintenancePlan[] = [
  {
    id: "basic",
    name: "Basic",
    annualCost: 5500000,
    ticketsPerYear: 6,
    serverCosts: {
      webHosting: 20000,    // 월 2만원
      storage: 30000,       // 월 3만원
      rendering: 30000,     // 월 3만원
      orderServer: 20000,   // 월 2만원
      database: 25000,      // 월 2.5만원
    },
    managerHoursPerMonth: 8,
    description: "소규모 프로젝트에 적합한 기본 유지보수 플랜",
  },
  {
    id: "standard",
    name: "Standard",
    annualCost: 7700000,
    ticketsPerYear: 12,
    serverCosts: {
      webHosting: 25000,    // 월 2.5만원
      storage: 50000,       // 월 5만원
      rendering: 50000,     // 월 5만원
      orderServer: 30000,   // 월 3만원
      database: 28000,      // 월 2.8만원
    },
    managerHoursPerMonth: 12,
    description: "중규모 프로젝트를 위한 표준 유지보수 플랜",
  },
  {
    id: "premium",
    name: "Premium",
    annualCost: 13200000,
    ticketsPerYear: 24,
    serverCosts: {
      webHosting: 30000,    // 월 3만원
      storage: 80000,       // 월 8만원
      rendering: 80000,     // 월 8만원
      orderServer: 50000,   // 월 5만원
      database: 35000,      // 월 3.5만원
    },
    managerHoursPerMonth: 20,
    description: "대규모 프로젝트를 위한 프리미엄 유지보수 플랜",
  },
]

export interface SurveyFormData {
  companyName: string
  contactPerson: string
  productCategory: string
  productCount: string
  features: {
    colorChange: boolean
    optionChange: boolean
    sizeAdjustment: boolean
    moduleAssembly: boolean
  }
  colorChangeType: string // "fixed" | "admin" | "user"
  optionChangeType: string // "global" | "attachment"
  sizeAdjustmentType: string // "preset" | "custom"
  moduleComplexity: string
  arVrCompatible: boolean
  animation: boolean
  realTimeQuote: boolean
  dimensionMeasurement: boolean
  erpIntegration: boolean
  erpProgram: string
  cartIntegration: boolean
  dashboardEnabled: boolean
  dashboard: {
    orderManagement: boolean
    teamManagement: boolean
    unitManagement: boolean
    textureManagement: boolean
    quoteIssuance: boolean
    blueprintOutput: boolean
    installationGuide: boolean
  }
  presetAddition: boolean
  campaignMode: boolean
  complianceCheck: boolean
  userSeats: string
  quotingRule: string
  has3DFile: boolean
  uploadedFile: File | null
  otherRequirements: string
  maintenancePlan: MaintenancePlanType
}

interface ConfiguratorSurveyProps {
  onSubmit?: (data: SurveyFormData) => void
}

export function ConfiguratorSurvey({ onSubmit }: ConfiguratorSurveyProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<SurveyFormData>({
    companyName: "",
    contactPerson: "",
    productCategory: "",
    productCount: "",
    features: {
      colorChange: false,
      optionChange: false,
      sizeAdjustment: false,
      moduleAssembly: false,
    },
    colorChangeType: "",
    optionChangeType: "",
    sizeAdjustmentType: "",
    moduleComplexity: "",
    arVrCompatible: false,
    animation: false,
    realTimeQuote: false,
    dimensionMeasurement: false,
    erpIntegration: false,
    erpProgram: "",
    cartIntegration: false,
    dashboardEnabled: true,
    dashboard: {
      orderManagement: true,
      teamManagement: true,
      unitManagement: true,
      textureManagement: false,
      quoteIssuance: false,
      blueprintOutput: false,
      installationGuide: false,
    },
    presetAddition: false,
    campaignMode: false,
    complianceCheck: false,
    userSeats: "",
    quotingRule: "",
    has3DFile: false,
    uploadedFile: null,
    otherRequirements: "",
    maintenancePlan: "none",
  })

  const [submitted, setSubmitted] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisStep, setAnalysisStep] = useState("")
  const [file3DAnalysis, setFile3DAnalysis] = useState<File3DAnalysis | null>(null)

  // 하위 옵션 편집 상태 (열려있는 패널)
  const [editingSubOption, setEditingSubOption] = useState<string | null>(null)

  // 하위 옵션 레이블
  const colorTypeLabels: Record<string, string> = {
    fixed: "고정",
    admin: "관리자 지정",
    user: "사용자 지정",
  }
  const optionTypeLabels: Record<string, string> = {
    global: "전체 영향",
    attachment: "탈부착",
  }
  const sizeTypeLabels: Record<string, string> = {
    preset: "프리셋",
    custom: "맞춤형",
  }
  const complexityLabels: Record<string, string> = {
    low: "낮음",
    medium: "중간",
    high: "높음",
  }

  const handleFeatureChange = (feature: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: checked,
      }
    }))

    // 하위 옵션이 있는 기능이 활성화되면 해당 패널 열기
    if (checked) {
      if (feature === "colorChange") {
        setEditingSubOption("colorChange")
      } else if (feature === "optionChange") {
        setEditingSubOption("optionChange")
      } else if (feature === "sizeAdjustment") {
        setEditingSubOption("sizeAdjustment")
      } else if (feature === "moduleAssembly") {
        setEditingSubOption("moduleAssembly")
      }
    } else {
      // 비활성화 시 하위 옵션 값 초기화 및 패널 닫기
      if (feature === "colorChange") {
        setFormData(prev => ({ ...prev, colorChangeType: "" }))
        if (editingSubOption === "colorChange") setEditingSubOption(null)
      } else if (feature === "optionChange") {
        setFormData(prev => ({ ...prev, optionChangeType: "" }))
        if (editingSubOption === "optionChange") setEditingSubOption(null)
      } else if (feature === "sizeAdjustment") {
        setFormData(prev => ({ ...prev, sizeAdjustmentType: "" }))
        if (editingSubOption === "sizeAdjustment") setEditingSubOption(null)
      } else if (feature === "moduleAssembly") {
        setFormData(prev => ({ ...prev, moduleComplexity: "" }))
        if (editingSubOption === "moduleAssembly") setEditingSubOption(null)
      }
    }
  }

  const handleDashboardChange = (feature: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      dashboard: {
        ...prev.dashboard,
        [feature]: checked,
      }
    }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, uploadedFile: file }))
      // 3D 파일 분석 실행
      const analysis = analyze3DFile(file)
      setFile3DAnalysis(analysis)
    }
  }

  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, uploadedFile: null }))
    setFile3DAnalysis(null)
  }

  // 선택된 기능 목록 생성
  const getSelectedFeatures = () => {
    const features: string[] = []
    if (formData.features.colorChange) features.push(`컬러 변경 (${colorTypeLabels[formData.colorChangeType] || "미선택"})`)
    if (formData.features.optionChange) features.push(`옵션 변경 (${optionTypeLabels[formData.optionChangeType] || "미선택"})`)
    if (formData.features.sizeAdjustment) features.push(`사이즈 조절 (${sizeTypeLabels[formData.sizeAdjustmentType] || "미선택"})`)
    if (formData.features.moduleAssembly) features.push(`모듈 조립 (${complexityLabels[formData.moduleComplexity] || "미선택"})`)
    if (formData.arVrCompatible) features.push("AR/VR 호환")
    if (formData.animation) features.push("애니메이션")
    if (formData.realTimeQuote) features.push("실시간 견적")
    if (formData.dimensionMeasurement) features.push("치수 측정")
    if (formData.erpIntegration) features.push(`ERP 연동 (${formData.erpProgram || "미선택"})`)
    if (formData.cartIntegration) features.push("장바구니 연동")
    if (formData.dashboardEnabled) {
      features.push("대시보드")
      if (formData.dashboard.textureManagement) features.push("텍스처 관리")
      if (formData.dashboard.quoteIssuance) features.push("견적서 발행")
      if (formData.dashboard.blueprintOutput) features.push("도면 출력")
      if (formData.dashboard.installationGuide) features.push("설치 안내서")
    }
    if (formData.presetAddition) features.push("프리셋")
    if (formData.campaignMode) features.push("캠페인 모드")
    if (formData.complianceCheck) features.push("규정 검토")
    return features
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (onSubmit) {
      onSubmit(formData)
    }

    // 기타 요구사항이 있는 경우 AI 분석 진행
    const hasOtherRequirements = formData.otherRequirements.trim().length > 0

    if (hasOtherRequirements) {
      setIsAnalyzing(true)
      setAnalysisProgress(0)
      setAnalysisStep("요구사항 분석 준비 중...")

      // 프로그레스 애니메이션
      const progressSteps = [
        { progress: 15, step: "요구사항 텍스트 분석 중..." },
        { progress: 35, step: "개발 요소 식별 중..." },
        { progress: 55, step: "인력 배분 계산 중..." },
        { progress: 75, step: "비용 산출 중..." },
        { progress: 90, step: "결과 정리 중..." },
      ]

      let currentStep = 0
      const progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length) {
          setAnalysisProgress(progressSteps[currentStep].progress)
          setAnalysisStep(progressSteps[currentStep].step)
          currentStep++
        }
      }, 800)

      try {
        const categoryLabels: Record<string, string> = {
          furniture: "가구",
          automotive: "자동차/모빌리티",
          industrial: "산업용 기계",
          architecture: "건축/인테리어",
          fashion: "패션/의류",
          electronics: "전자제품",
          other: "기타",
        }

        const response = await fetch("/api/analyze-requirements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requirements: formData.otherRequirements,
            productCategory: categoryLabels[formData.productCategory] || formData.productCategory,
            existingFeatures: getSelectedFeatures(),
          }),
        })

        clearInterval(progressInterval)

        if (response.ok) {
          const aiResult = await response.json()
          setAnalysisProgress(100)
          setAnalysisStep("분석 완료!")

          // AI 분석 결과와 함께 저장
          sessionStorage.setItem("surveyData", JSON.stringify({
            ...formData,
            uploadedFile: formData.uploadedFile?.name || null,
          }))
          sessionStorage.setItem("aiAnalysis", JSON.stringify(aiResult))
          // 3D 파일 분석 결과 저장
          if (file3DAnalysis) {
            sessionStorage.setItem("file3DAnalysis", serializeAnalysis(file3DAnalysis))
          } else {
            sessionStorage.removeItem("file3DAnalysis")
          }

          setSubmitted(true)
          setTimeout(() => {
            router.push("/quote/estimate")
          }, 1000)
        } else {
          // AI 분석 실패 시에도 기본 견적으로 진행
          setAnalysisProgress(100)
          setAnalysisStep("기본 견적으로 진행합니다.")

          sessionStorage.setItem("surveyData", JSON.stringify({
            ...formData,
            uploadedFile: formData.uploadedFile?.name || null,
          }))
          // 3D 파일 분석 결과 저장
          if (file3DAnalysis) {
            sessionStorage.setItem("file3DAnalysis", serializeAnalysis(file3DAnalysis))
          } else {
            sessionStorage.removeItem("file3DAnalysis")
          }

          setSubmitted(true)
          setTimeout(() => {
            router.push("/quote/estimate")
          }, 1000)
        }
      } catch {
        clearInterval(progressInterval)
        // 오류 시에도 기본 견적으로 진행
        setAnalysisProgress(100)
        setAnalysisStep("기본 견적으로 진행합니다.")

        sessionStorage.setItem("surveyData", JSON.stringify({
          ...formData,
          uploadedFile: formData.uploadedFile?.name || null,
        }))
        // 3D 파일 분석 결과 저장
        if (file3DAnalysis) {
          sessionStorage.setItem("file3DAnalysis", serializeAnalysis(file3DAnalysis))
        } else {
          sessionStorage.removeItem("file3DAnalysis")
        }

        setSubmitted(true)
        setTimeout(() => {
          router.push("/quote/estimate")
        }, 1000)
      }
    } else {
      // 기타 요구사항이 없는 경우 바로 이동
      sessionStorage.setItem("surveyData", JSON.stringify({
        ...formData,
        uploadedFile: formData.uploadedFile?.name || null,
      }))

      // 이전 AI 분석 결과 삭제
      sessionStorage.removeItem("aiAnalysis")

      // 3D 파일 분석 결과 저장
      if (file3DAnalysis) {
        sessionStorage.setItem("file3DAnalysis", serializeAnalysis(file3DAnalysis))
      } else {
        sessionStorage.removeItem("file3DAnalysis")
      }

      setSubmitted(true)
      setTimeout(() => {
        router.push("/quote/estimate")
      }, 1500)
    }
  }

  return (
    <div className="container max-w-5xl mx-auto py-12 px-4">
      {/* 홈으로 돌아가기 버튼 */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          홈으로 돌아가기
        </Link>
      </div>

      <div className="text-center mb-12 space-y-2">
        <h1 className="text-3xl font-semibold mb-3">3D 컨피규레이터 개발 설문</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          정확한 견적과 개발 계획을 위해 아래 정보를 입력해 주세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 기본 정보 */}
        <Card className="border-2">
          <CardHeader className="bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle>기본 정보</CardTitle>
                <CardDescription>회사 및 담당자 정보를 입력해 주세요</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="companyName">회사명 <span className="text-destructive">*</span></Label>
                <Input
                  id="companyName"
                  placeholder="회사명을 입력하세요"
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">담당자명 <span className="text-destructive">*</span></Label>
                <Input
                  id="contactPerson"
                  placeholder="담당자명을 입력하세요"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  required
                  className="h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="productCategory">제품 카테고리 <span className="text-destructive">*</span></Label>
              <Select
                value={formData.productCategory}
                onValueChange={(value) => setFormData(prev => ({ ...prev, productCategory: value }))}
                required
              >
                <SelectTrigger id="productCategory" className="h-11">
                  <SelectValue placeholder="제품 카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="furniture">가구</SelectItem>
                  <SelectItem value="automotive">자동차/모빌리티</SelectItem>
                  <SelectItem value="industrial">산업용 기계</SelectItem>
                  <SelectItem value="architecture">건축/인테리어</SelectItem>
                  <SelectItem value="fashion">패션/의류</SelectItem>
                  <SelectItem value="electronics">전자제품</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="productCount">제품 수량 <span className="text-destructive">*</span></Label>
              <Input
                id="productCount"
                type="number"
                min="1"
                placeholder="제품 수량을 입력하세요"
                value={formData.productCount}
                onChange={(e) => setFormData(prev => ({ ...prev, productCount: e.target.value }))}
                required
                className="h-11"
              />
            </div>
          </CardContent>
        </Card>

        {/* 컨피규레이터 기능 범위 */}
        <Card className="border-2">
          <CardHeader className="bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Settings className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle>컨피규레이터 기능 범위</CardTitle>
                <CardDescription>필요한 기능을 모두 선택해 주세요</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                  formData.features.colorChange && formData.colorChangeType
                    ? "border-primary/50 bg-primary/5"
                    : "hover:bg-slate-50"
                }`}
              >
                <label
                  htmlFor="colorChange"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <span>컬러 변경</span>
                  {formData.features.colorChange && formData.colorChangeType && (
                    <>
                      <Badge variant="secondary" className="text-xs">
                        {colorTypeLabels[formData.colorChangeType]}
                      </Badge>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setEditingSubOption("colorChange")
                        }}
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                      >
                        <Pencil className="size-3 text-muted-foreground" />
                      </button>
                    </>
                  )}
                </label>
                <Checkbox
                  id="colorChange"
                  checked={formData.features.colorChange}
                  onCheckedChange={(checked) => handleFeatureChange("colorChange", checked as boolean)}
                  className="size-5"
                />
              </div>
              <div
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                  formData.features.optionChange && formData.optionChangeType
                    ? "border-primary/50 bg-primary/5"
                    : "hover:bg-slate-50"
                }`}
              >
                <label
                  htmlFor="optionChange"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <span>옵션 변경</span>
                  {formData.features.optionChange && formData.optionChangeType && (
                    <>
                      <Badge variant="secondary" className="text-xs">
                        {optionTypeLabels[formData.optionChangeType]}
                      </Badge>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setEditingSubOption("optionChange")
                        }}
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                      >
                        <Pencil className="size-3 text-muted-foreground" />
                      </button>
                    </>
                  )}
                </label>
                <Checkbox
                  id="optionChange"
                  checked={formData.features.optionChange}
                  onCheckedChange={(checked) => handleFeatureChange("optionChange", checked as boolean)}
                  className="size-5"
                />
              </div>
              <div
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                  formData.features.sizeAdjustment && formData.sizeAdjustmentType
                    ? "border-primary/50 bg-primary/5"
                    : "hover:bg-slate-50"
                }`}
              >
                <label
                  htmlFor="sizeAdjustment"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <span>사이즈 조절</span>
                  {formData.features.sizeAdjustment && formData.sizeAdjustmentType && (
                    <>
                      <Badge variant="secondary" className="text-xs">
                        {sizeTypeLabels[formData.sizeAdjustmentType]}
                      </Badge>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setEditingSubOption("sizeAdjustment")
                        }}
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                      >
                        <Pencil className="size-3 text-muted-foreground" />
                      </button>
                    </>
                  )}
                </label>
                <Checkbox
                  id="sizeAdjustment"
                  checked={formData.features.sizeAdjustment}
                  onCheckedChange={(checked) => handleFeatureChange("sizeAdjustment", checked as boolean)}
                  className="size-5"
                />
              </div>
              <div
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                  formData.features.moduleAssembly && formData.moduleComplexity
                    ? "border-primary/50 bg-primary/5"
                    : "hover:bg-slate-50"
                }`}
              >
                <label
                  htmlFor="moduleAssembly"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <span>모듈 조립</span>
                  {formData.features.moduleAssembly && formData.moduleComplexity && (
                    <>
                      <Badge variant="secondary" className="text-xs">
                        {complexityLabels[formData.moduleComplexity]}
                      </Badge>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setEditingSubOption("moduleAssembly")
                        }}
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                      >
                        <Pencil className="size-3 text-muted-foreground" />
                      </button>
                    </>
                  )}
                </label>
                <Checkbox
                  id="moduleAssembly"
                  checked={formData.features.moduleAssembly}
                  onCheckedChange={(checked) => handleFeatureChange("moduleAssembly", checked as boolean)}
                  className="size-5"
                />
              </div>
            </div>

            {formData.features.colorChange && editingSubOption === "colorChange" && (
              <div className="mt-6 p-6 border-2 border-primary/20 rounded-lg bg-primary/5 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label>컬러 변경 방식 <span className="text-destructive">*</span></Label>
                  <p className="text-sm text-muted-foreground">컬러 변경 방식을 선택해 주세요</p>
                </div>

                <RadioGroup
                  value={formData.colorChangeType}
                  onValueChange={(value) => {
                    setFormData(prev => {
                      const newState = { ...prev, colorChangeType: value }
                      // 관리자 지정 컬러 선택 시 대시보드 텍스처 관리 자동 활성화
                      if (value === "admin") {
                        newState.dashboardEnabled = true
                        newState.dashboard = {
                          ...prev.dashboard,
                          textureManagement: true,
                        }
                      }
                      return newState
                    })
                  }}
                  className="space-y-3"
                >
                  <div className="flex items-start space-x-3 p-4 border-2 rounded-lg bg-white hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="fixed" id="color-fixed" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="color-fixed" className="cursor-pointer flex items-center gap-2">
                        <span>고정 컬러 변경</span>
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-800">
                          기본
                        </span>
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        사전에 지정된 컬러 옵션에서 선택하는 방식입니다.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border-2 rounded-lg bg-white hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="admin" id="color-admin" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="color-admin" className="cursor-pointer flex items-center gap-2">
                        <span>관리자 지정 컬러 변경</span>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-800">
                          대시보드 연동
                        </span>
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        관리자가 대시보드에서 컬러를 추가/관리할 수 있습니다. (텍스처 관리 기능 필수 포함)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border-2 rounded-lg bg-white hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="user" id="color-user" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="color-user" className="cursor-pointer flex items-center gap-2">
                        <span>사용자 지정 컬러 변경</span>
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs text-purple-800">
                          자유 선택
                        </span>
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        사용자가 컬러 팔레트에서 자유롭게 색상을 선택하고 주문 내역에 반영됩니다.
                      </p>
                    </div>
                  </div>
                </RadioGroup>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={!formData.colorChangeType}
                    onClick={() => setEditingSubOption(null)}
                  >
                    <CheckCircle2 className="size-4 mr-2" />
                    확인
                  </Button>
                </div>
              </div>
            )}

            {formData.features.optionChange && editingSubOption === "optionChange" && (
              <div className="mt-6 p-6 border-2 border-primary/20 rounded-lg bg-primary/5 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label>옵션 변경 방식 <span className="text-destructive">*</span></Label>
                  <p className="text-sm text-muted-foreground">옵션 변경 방식을 선택해 주세요</p>
                </div>

                <RadioGroup
                  value={formData.optionChangeType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, optionChangeType: value }))}
                  className="space-y-3"
                >
                  <div className="flex items-start space-x-3 p-4 border-2 rounded-lg bg-white hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="attachment" id="option-attachment" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="option-attachment" className="cursor-pointer flex items-center gap-2">
                        <span>탈부착 옵션</span>
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-800">
                          단순
                        </span>
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        단순히 해당 옵션을 추가하거나 제거하는 방식입니다. (예: 액세서리 추가/제거)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border-2 rounded-lg bg-white hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="global" id="option-global" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="option-global" className="cursor-pointer flex items-center gap-2">
                        <span>전체 영향 옵션</span>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-800">
                          복합
                        </span>
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        옵션 선택이 제품 전반에 영향을 주는 방식입니다. (예: 엔진 타입 변경 시 외관/성능 변화)
                      </p>
                    </div>
                  </div>
                </RadioGroup>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={!formData.optionChangeType}
                    onClick={() => setEditingSubOption(null)}
                  >
                    <CheckCircle2 className="size-4 mr-2" />
                    확인
                  </Button>
                </div>
              </div>
            )}

            {formData.features.sizeAdjustment && editingSubOption === "sizeAdjustment" && (
              <div className="mt-6 p-6 border-2 border-primary/20 rounded-lg bg-primary/5 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label>사이즈 조절 방식 <span className="text-destructive">*</span></Label>
                  <p className="text-sm text-muted-foreground">사이즈 조절 방식을 선택해 주세요</p>
                </div>

                <RadioGroup
                  value={formData.sizeAdjustmentType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, sizeAdjustmentType: value }))}
                  className="space-y-3"
                >
                  <div className="flex items-start space-x-3 p-4 border-2 rounded-lg bg-white hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="preset" id="size-preset" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="size-preset" className="cursor-pointer flex items-center gap-2">
                        <span>프리셋 사이즈</span>
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-800">
                          기본
                        </span>
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        고정된 사이즈 선택지 중에서 선택하는 방식입니다. (예: S, M, L, XL)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border-2 rounded-lg bg-white hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="custom" id="size-custom" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="size-custom" className="cursor-pointer flex items-center gap-2">
                        <span>맞춤형 사이즈</span>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-800">
                          상세 조절
                        </span>
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        표준 단위(mm, cm, inch 등)로 상세하게 사이즈를 조절할 수 있는 맞춤형 방식입니다.
                      </p>
                    </div>
                  </div>
                </RadioGroup>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={!formData.sizeAdjustmentType}
                    onClick={() => setEditingSubOption(null)}
                  >
                    <CheckCircle2 className="size-4 mr-2" />
                    확인
                  </Button>
                </div>
              </div>
            )}

            {formData.features.moduleAssembly && editingSubOption === "moduleAssembly" && (
              <div className="mt-6 p-6 border-2 border-primary/20 rounded-lg bg-primary/5 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label>모듈 조립 복잡도 <span className="text-destructive">*</span></Label>
                  <p className="text-sm text-muted-foreground">필요한 복잡도 수준을 선택해 주세요</p>
                </div>

                <RadioGroup
                  value={formData.moduleComplexity}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, moduleComplexity: value }))}
                  className="space-y-3"
                >
                  <div className="flex items-start space-x-3 p-4 border-2 rounded-lg bg-white hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="low" id="complexity-low" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="complexity-low" className="cursor-pointer flex items-center gap-2">
                        <span>낮은 복잡도</span>
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-800">
                          단순
                        </span>
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        모듈이 동일한 규칙으로 순차적으로 확장됩니다.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border-2 rounded-lg bg-white hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="medium" id="complexity-medium" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="complexity-medium" className="cursor-pointer flex items-center gap-2">
                        <span>중간 복잡도</span>
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs text-yellow-800">
                          보통
                        </span>
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        특정 유닛 간 결합 규칙이 존재합니다.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border-2 rounded-lg bg-white hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="high" id="complexity-high" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="complexity-high" className="cursor-pointer flex items-center gap-2">
                        <span>높은 복잡도</span>
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs text-red-800">
                          복잡
                        </span>
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        유닛 간 상호작용이 있으며, 복잡한 알고리즘 규칙이 필요합니다.
                      </p>
                    </div>
                  </div>
                </RadioGroup>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={!formData.moduleComplexity}
                    onClick={() => setEditingSubOption(null)}
                  >
                    <CheckCircle2 className="size-4 mr-2" />
                    확인
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 기술 요구사항 */}
        <Card className="border-2">
          <CardHeader className="bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Zap className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle>기술 요구사항</CardTitle>
                <CardDescription>필요한 기술 기능을 선택해 주세요</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div
              className="flex items-center justify-between p-4 border rounded-lg bg-white cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setFormData(prev => ({ ...prev, arVrCompatible: !prev.arVrCompatible }))}
            >
              <div className="space-y-0.5">
                <Label htmlFor="arvr" className="cursor-pointer">AR / VR 호환</Label>
                <p className="text-sm text-muted-foreground">증강현실 및 가상현실 지원</p>
              </div>
              <Switch
                id="arvr"
                checked={formData.arVrCompatible}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, arVrCompatible: checked }))}
              />
            </div>

            <div
              className="flex items-center justify-between p-4 border rounded-lg bg-white cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setFormData(prev => ({ ...prev, animation: !prev.animation }))}
            >
              <div className="space-y-0.5">
                <Label htmlFor="animation" className="cursor-pointer">애니메이션</Label>
                <p className="text-sm text-muted-foreground">제품 움직임 및 전환 효과</p>
              </div>
              <Switch
                id="animation"
                checked={formData.animation}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, animation: checked }))}
              />
            </div>

            <div
              className="flex items-center justify-between p-4 border rounded-lg bg-white cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setFormData(prev => ({ ...prev, realTimeQuote: !prev.realTimeQuote }))}
            >
              <div className="space-y-0.5">
                <Label htmlFor="realtime" className="cursor-pointer">실시간 견적</Label>
                <p className="text-sm text-muted-foreground">구성에 따른 즉시 가격 계산</p>
              </div>
              <Switch
                id="realtime"
                checked={formData.realTimeQuote}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, realTimeQuote: checked }))}
              />
            </div>

            <div
              className="flex items-center justify-between p-4 border rounded-lg bg-white cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setFormData(prev => ({ ...prev, dimensionMeasurement: !prev.dimensionMeasurement }))}
            >
              <div className="space-y-0.5">
                <Label htmlFor="dimension" className="cursor-pointer">치수 측정</Label>
                <p className="text-sm text-muted-foreground">3D 모델에서 실시간 치수 측정</p>
              </div>
              <Switch
                id="dimension"
                checked={formData.dimensionMeasurement}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, dimensionMeasurement: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* 시스템 연동 */}
        <Card className="border-2">
          <CardHeader className="bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle>시스템 연동</CardTitle>
                <CardDescription>외부 시스템 연동 요구사항을 선택해 주세요</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="space-y-4">
              <div
                className="flex items-center justify-between p-4 border rounded-lg bg-white cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setFormData(prev => ({ ...prev, erpIntegration: !prev.erpIntegration }))}
              >
                <div className="space-y-0.5">
                  <Label htmlFor="erp" className="cursor-pointer">ERP / 이커머스 연동</Label>
                  <p className="text-sm text-muted-foreground">기존 시스템과 데이터 동기화</p>
                </div>
                <Switch
                  id="erp"
                  checked={formData.erpIntegration}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, erpIntegration: checked }))}
                />
              </div>

              {formData.erpIntegration && (
                <div className="ml-4 space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label htmlFor="erpProgram">연동 프로그램</Label>
                  <Select
                    value={formData.erpProgram}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      erpProgram: value,
                      // Cafe24가 아니면 장바구니 연동 비활성화
                      cartIntegration: value === "cafe24" ? prev.cartIntegration : false
                    }))}
                  >
                    <SelectTrigger id="erpProgram" className="h-11">
                      <SelectValue placeholder="프로그램을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sap">SAP</SelectItem>
                      <SelectItem value="oracle">Oracle ERP</SelectItem>
                      <SelectItem value="salesforce">Salesforce</SelectItem>
                      <SelectItem value="shopify">Shopify</SelectItem>
                      <SelectItem value="cafe24">Cafe24</SelectItem>
                      <SelectItem value="imweb">imWeb</SelectItem>
                      <SelectItem value="other">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {formData.erpIntegration && formData.erpProgram === "cafe24" && (
              <div
                className="flex items-center justify-between p-4 border rounded-lg bg-white cursor-pointer hover:bg-slate-50 transition-colors animate-in fade-in slide-in-from-top-2"
                onClick={() => setFormData(prev => ({ ...prev, cartIntegration: !prev.cartIntegration }))}
              >
                <div className="space-y-0.5">
                  <Label htmlFor="cart" className="cursor-pointer">장바구니 연동</Label>
                  <p className="text-sm text-muted-foreground">구성된 제품 직접 구매</p>
                </div>
                <Switch
                  id="cart"
                  checked={formData.cartIntegration}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, cartIntegration: checked }))}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 대시보드 */}
        <Card className="border-2">
          <CardHeader className="bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <LayoutDashboard className="size-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle>대시보드</CardTitle>
                <CardDescription>관리 대시보드에 포함할 기능을 선택해 주세요</CardDescription>
              </div>
              <Switch
                id="dashboardEnabled"
                checked={formData.dashboardEnabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, dashboardEnabled: checked }))}
              />
            </div>
          </CardHeader>
          {formData.dashboardEnabled && (
            <CardContent className="pt-6 space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 필수 항목 - disabled */}
                <div
                  className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 opacity-75"
                >
                  <span className="text-muted-foreground">주문 상세 내역 관리</span>
                  <Checkbox
                    id="orderManagement"
                    checked={true}
                    disabled
                    className="size-5"
                  />
                </div>
                <div
                  className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 opacity-75"
                >
                  <span className="text-muted-foreground">팀 관리</span>
                  <Checkbox
                    id="teamManagement"
                    checked={true}
                    disabled
                    className="size-5"
                  />
                </div>
                <div
                  className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 opacity-75"
                >
                  <span className="text-muted-foreground">유닛 관리</span>
                  <Checkbox
                    id="unitManagement"
                    checked={true}
                    disabled
                    className="size-5"
                  />
                </div>
                {/* 선택 항목 */}
                <label
                  htmlFor="textureManagement"
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>텍스처 관리</span>
                  <Checkbox
                    id="textureManagement"
                    checked={formData.dashboard.textureManagement}
                    onCheckedChange={(checked) => handleDashboardChange("textureManagement", checked as boolean)}
                    className="size-5"
                  />
                </label>
                <label
                  htmlFor="quoteIssuance"
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>견적서 발행</span>
                  <Checkbox
                    id="quoteIssuance"
                    checked={formData.dashboard.quoteIssuance}
                    onCheckedChange={(checked) => handleDashboardChange("quoteIssuance", checked as boolean)}
                    className="size-5"
                  />
                </label>
                <label
                  htmlFor="dashboardBlueprintOutput"
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>도면 출력 기능</span>
                  <Checkbox
                    id="dashboardBlueprintOutput"
                    checked={formData.dashboard.blueprintOutput}
                    onCheckedChange={(checked) => handleDashboardChange("blueprintOutput", checked as boolean)}
                    className="size-5"
                  />
                </label>
                <label
                  htmlFor="installationGuide"
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>설치 안내서 발행</span>
                  <Checkbox
                    id="installationGuide"
                    checked={formData.dashboard.installationGuide}
                    onCheckedChange={(checked) => handleDashboardChange("installationGuide", checked as boolean)}
                    className="size-5"
                  />
                </label>
              </div>
            </CardContent>
          )}
        </Card>

        {/* 추가 기능 */}
        <Card className="border-2">
          <CardHeader className="bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle>추가 기능 및 설정</CardTitle>
                <CardDescription>추가 프로젝트 기능을 설정해 주세요</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
              <div className="space-y-0.5">
                <Label htmlFor="preset" className="cursor-pointer">프리셋</Label>
                <p className="text-sm text-muted-foreground">미리 구성된 설정 저장 및 불러오기</p>
              </div>
              <Switch
                id="preset"
                checked={formData.presetAddition}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, presetAddition: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
              <div className="space-y-0.5">
                <Label htmlFor="campaign" className="cursor-pointer">캠페인 모드</Label>
                <p className="text-sm text-muted-foreground">마케팅 이벤트용 특별 모드</p>
              </div>
              <Switch
                id="campaign"
                checked={formData.campaignMode}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, campaignMode: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
              <div className="space-y-0.5">
                <Label htmlFor="compliance" className="cursor-pointer">규정 검토</Label>
                <p className="text-sm text-muted-foreground">전력/법적 규정 자동 검증</p>
              </div>
              <Switch
                id="compliance"
                checked={formData.complianceCheck}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, complianceCheck: checked }))}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="userSeats">사용자 수 <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.userSeats}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, userSeats: value }))}
                >
                  <SelectTrigger id="userSeats" className="h-11">
                    <SelectValue placeholder="사용자 수를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-5">1-5명</SelectItem>
                    <SelectItem value="6-10">6-10명</SelectItem>
                    <SelectItem value="11-20">11-20명</SelectItem>
                    <SelectItem value="21-50">21-50명</SelectItem>
                    <SelectItem value="50+">50명 이상</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quotingRule">가격 정책 <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.quotingRule}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, quotingRule: value }))}
                >
                  <SelectTrigger id="quotingRule" className="h-11">
                    <SelectValue placeholder="가격 정책을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quantity">수량 기반</SelectItem>
                    <SelectItem value="cost">원가 기반</SelectItem>
                    <SelectItem value="fixed">고정 가격</SelectItem>
                    <SelectItem value="complex">복합 규칙</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3D 파일 정보 */}
        <Card className="border-2">
          <CardHeader className="bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Upload className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle>3D 파일 정보</CardTitle>
                <CardDescription>3D 파일 보유 여부 및 업로드</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div
              className="flex items-center justify-between p-4 border rounded-lg bg-white cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setFormData(prev => ({ ...prev, has3DFile: !prev.has3DFile }))}
            >
              <div className="space-y-0.5">
                <Label htmlFor="has3d" className="cursor-pointer">3D 파일 보유</Label>
                <p className="text-sm text-muted-foreground">기존 3D 모델링 파일 보유 여부</p>
              </div>
              <Switch
                id="has3d"
                checked={formData.has3DFile}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has3DFile: checked }))}
              />
            </div>

            {formData.has3DFile && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <Label>3D 파일 업로드</Label>

                {!formData.uploadedFile ? (
                  /* 업로드 영역 */
                  <div className="border-2 border-dashed rounded-lg p-10 text-center hover:border-primary/50 hover:bg-slate-50/50 transition-all cursor-pointer">
                    <input
                      type="file"
                      id="fileUpload"
                      className="hidden"
                      accept=".fbx,.obj,.gltf,.glb,.step,.stp,.skp,.blend,.max,.ma,.mb"
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="fileUpload" className="cursor-pointer block">
                      <Upload className="size-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="mb-2">드래그 앤 드롭 또는 클릭하여 업로드</p>
                      <p className="text-muted-foreground text-sm">
                        지원 형식: OBJ, FBX, GLTF, GLB, STEP, STP, SKP
                      </p>
                    </label>
                  </div>
                ) : (
                  /* 미리보기 및 분석 결과 */
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* 3D 미리보기 */}
                    <File3DPreview
                      file={formData.uploadedFile}
                      analysis={file3DAnalysis}
                    />

                    {/* 분석 결과 상세 */}
                    {file3DAnalysis && (
                      <div className="space-y-4">
                        {/* 파일 제거 버튼 */}
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveFile}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="size-4 mr-1" />
                            파일 제거
                          </Button>
                        </div>

                        {/* 전처리 비용 상세 */}
                        <div className="border rounded-lg p-4 space-y-3">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <FileBox className="size-4 text-primary" />
                            전처리 비용 상세
                          </h4>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">기본 전처리</span>
                              <span>{file3DAnalysis.cost.baseCost.toLocaleString()}원</span>
                            </div>

                            {file3DAnalysis.preprocessing.modelOptimization && (
                              <div className="flex justify-between text-red-600">
                                <span className="flex items-center gap-1">
                                  <AlertTriangle className="size-3" />
                                  모델링 최적화
                                </span>
                                <span>+{file3DAnalysis.cost.modelOptimizationCost.toLocaleString()}원</span>
                              </div>
                            )}

                            {file3DAnalysis.preprocessing.meshOptimization && (
                              <div className="flex justify-between text-amber-600">
                                <span className="flex items-center gap-1">
                                  <AlertCircle className="size-3" />
                                  메쉬 최적화
                                </span>
                                <span>+{file3DAnalysis.cost.meshOptimizationCost.toLocaleString()}원</span>
                              </div>
                            )}

                            {file3DAnalysis.preprocessing.textureMapping && (
                              <div className="flex justify-between text-purple-600">
                                <span className="flex items-center gap-1">
                                  <FileType className="size-3" />
                                  텍스처 맵핑
                                </span>
                                <span>+{file3DAnalysis.cost.textureMappingCost.toLocaleString()}원</span>
                              </div>
                            )}

                            <Separator />

                            <div className="flex justify-between font-semibold">
                              <span>파일당 전처리 비용</span>
                              <span className="text-primary">{file3DAnalysis.cost.unitCost.toLocaleString()}원</span>
                            </div>
                          </div>
                        </div>

                        {/* 파일 용량 경고 */}
                        {file3DAnalysis.preprocessing.modelOptimization && (
                          <Alert className="border-red-200 bg-red-50">
                            <AlertTriangle className="size-4 text-red-600" />
                            <AlertDescription className="text-red-800">
                              파일 용량이 10MB 이상입니다. 모델링 최적화가 필요하며 추가 비용이 발생합니다.
                            </AlertDescription>
                          </Alert>
                        )}

                        {file3DAnalysis.preprocessing.meshOptimization && !file3DAnalysis.preprocessing.modelOptimization && (
                          <Alert className="border-amber-200 bg-amber-50">
                            <AlertCircle className="size-4 text-amber-600" />
                            <AlertDescription className="text-amber-800">
                              파일 용량이 5MB 이상입니다. 메쉬 최적화가 권장됩니다.
                            </AlertDescription>
                          </Alert>
                        )}

                        {file3DAnalysis.preprocessing.textureMapping && (
                          <Alert className="border-purple-200 bg-purple-50">
                            <FileType className="size-4 text-purple-600" />
                            <AlertDescription className="text-purple-800">
                              {file3DAnalysis.format} 형식은 텍스처 맵핑 작업이 필요합니다.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 서비스 유지비 */}
        <Card className="border-2">
          <CardHeader className="bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Shield className="size-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle>서비스 유지비</CardTitle>
                <CardDescription>
                  연간 서버 운영 및 유지보수 플랜을 선택해 주세요
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <RadioGroup
              value={formData.maintenancePlan}
              onValueChange={(value) => setFormData(prev => ({ ...prev, maintenancePlan: value as MaintenancePlanType }))}
              className="space-y-4"
            >
              {/* 유지비 미선택 옵션 */}
              <div
                className={`p-4 border-2 rounded-lg transition-colors cursor-pointer ${
                  formData.maintenancePlan === "none"
                    ? "border-slate-400 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                onClick={() => setFormData(prev => ({ ...prev, maintenancePlan: "none" }))}
              >
                <div className="flex items-start gap-3">
                  <RadioGroupItem value="none" id="plan-none" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="plan-none" className="cursor-pointer font-medium">
                      유지비 미선택
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      개발 완료 후 유지보수 계약 없이 진행합니다
                    </p>
                  </div>
                </div>
              </div>

              {/* 유지비 플랜 옵션들 */}
              {MAINTENANCE_PLANS.map((plan) => {
                const monthlyServerCost = Object.values(plan.serverCosts).reduce((a, b) => a + b, 0)
                const annualServerCost = monthlyServerCost * 12
                const managerCost = plan.annualCost - annualServerCost

                return (
                  <div
                    key={plan.id}
                    className={`p-4 border-2 rounded-lg transition-colors cursor-pointer ${
                      formData.maintenancePlan === plan.id
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 hover:border-emerald-300"
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, maintenancePlan: plan.id }))}
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value={plan.id} id={`plan-${plan.id}`} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor={`plan-${plan.id}`} className="cursor-pointer">
                            <span className="font-semibold text-base">{plan.name}</span>
                            {plan.id === "standard" && (
                              <Badge className="ml-2 bg-emerald-500">추천</Badge>
                            )}
                          </Label>
                          <span className="font-bold text-lg text-emerald-600">
                            연 {(plan.annualCost / 10000).toLocaleString()}만원
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>

                        {/* 플랜 상세 정보 */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Ticket className="size-4 text-emerald-500" />
                            <span>연간 지원 티켓 <strong className="text-foreground">{plan.ticketsPerYear}회</strong></span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Wrench className="size-4 text-emerald-500" />
                            <span>월 유지관리 <strong className="text-foreground">{plan.managerHoursPerMonth}시간</strong></span>
                          </div>
                        </div>

                        {/* 서버 비용 상세 (선택 시 표시) */}
                        {formData.maintenancePlan === plan.id && (
                          <div className="mt-4 pt-4 border-t border-emerald-200 space-y-2 animate-in fade-in slide-in-from-top-2">
                            <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                              <Server className="size-3" />
                              서버 비용 상세 (월 기준)
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">웹 호스팅</span>
                                <span>{plan.serverCosts.webHosting.toLocaleString()}원</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">스토리지</span>
                                <span>{plan.serverCosts.storage.toLocaleString()}원</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">3D 렌더링</span>
                                <span>{plan.serverCosts.rendering.toLocaleString()}원</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">주문 서버</span>
                                <span>{plan.serverCosts.orderServer.toLocaleString()}원</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">데이터베이스</span>
                                <span>{plan.serverCosts.database.toLocaleString()}원</span>
                              </div>
                              <div className="flex justify-between font-medium">
                                <span>월 서버 합계</span>
                                <span>{monthlyServerCost.toLocaleString()}원</span>
                              </div>
                            </div>
                            <Separator className="my-2" />
                            <div className="text-xs space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">연간 서버 비용</span>
                                <span>{annualServerCost.toLocaleString()}원</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">유지관리 인건비</span>
                                <span>{managerCost.toLocaleString()}원</span>
                              </div>
                              <div className="flex justify-between font-semibold text-emerald-600">
                                <span>연간 총 비용</span>
                                <span>{plan.annualCost.toLocaleString()}원</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </RadioGroup>

            {formData.maintenancePlan !== "none" && (
              <Alert className="border-emerald-200 bg-emerald-50">
                <Shield className="size-4 text-emerald-600" />
                <AlertDescription className="text-emerald-800">
                  유지비는 개발 완료 후 서비스 운영 시점부터 적용됩니다. 1년차 유지비 면제 혜택은 견적 페이지에서 선택할 수 있습니다.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* 기타 요구사항 */}
        <Card className="border-2">
          <CardHeader className="bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="size-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  기타 요구사항
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                    AI 분석
                  </Badge>
                </CardTitle>
                <CardDescription>
                  추가 요구사항을 자연어로 입력하시면 AI가 개발 요소를 분석하여 견적에 반영합니다
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <Textarea
              placeholder="예시: 사용자가 제품 이미지를 SNS에 공유할 수 있는 기능이 필요합니다. 또한 관리자가 실시간으로 주문 현황을 모니터링할 수 있는 대시보드 알림 기능도 추가해 주세요..."
              value={formData.otherRequirements}
              onChange={(e) => setFormData(prev => ({ ...prev, otherRequirements: e.target.value }))}
              className="min-h-32 resize-none"
            />
            {formData.otherRequirements.trim().length > 0 && (
              <Alert className="border-purple-200 bg-purple-50">
                <Sparkles className="size-4 text-purple-600" />
                <AlertDescription className="text-purple-800">
                  입력하신 요구사항은 AI가 분석하여 개발 작업, 인력 배분, 예상 비용을 자동으로 산출합니다.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* 제출 버튼 / 프로그레스 바 */}
        <div className="flex flex-col items-center pt-6 pb-4 space-y-4">
          {isAnalyzing ? (
            <div className="w-full max-w-md space-y-4">
              <div className="flex items-center justify-center gap-3 text-primary">
                <Loader2 className="size-5 animate-spin" />
                <span className="font-medium">{analysisStep}</span>
              </div>
              <Progress value={analysisProgress} className="h-3" />
              <p className="text-center text-sm text-muted-foreground">
                AI가 요구사항을 분석하고 있습니다...
              </p>
            </div>
          ) : (
            <Button
              type="submit"
              size="lg"
              className="px-16 h-12 text-base"
              disabled={submitted}
            >
              {submitted ? (
                <>
                  <CheckCircle2 className="size-5 mr-2" />
                  제출 완료
                </>
              ) : formData.otherRequirements.trim().length > 0 ? (
                <>
                  <Sparkles className="size-5 mr-2" />
                  AI 분석 후 견적 요청
                </>
              ) : (
                "견적 요청하기"
              )}
            </Button>
          )}
        </div>

        {submitted && !isAnalyzing && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="size-4 text-green-600" />
            <AlertDescription className="text-green-800">
              설문이 성공적으로 제출되었습니다. 견적 페이지로 이동합니다...
            </AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  )
}
