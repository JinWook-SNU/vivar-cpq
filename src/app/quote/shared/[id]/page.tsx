"use client"

import { useEffect, useState, use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  Users,
  Calculator,
  Package,
  Sparkles,
  AlertCircle,
  Server,
  Ticket,
  Wrench,
  Gift,
  Layers,
  AlertTriangle,
  Lightbulb,
  Code2,
  FileBox,
  FileType,
  HardDrive,
  Shield,
  Tag,
  X,
  RotateCcw,
} from "lucide-react"
import type { PrintViewData } from "@/components/quote/EstimatePrintView"
import { calculateCostBreakdown } from "@/lib/quote-calculator"

interface QuoteResponse {
  id: string
  created_at: string
  company_name: string
  product_category: string
  total_cost: number
  survey_data: Record<string, unknown>
  estimate_data: PrintViewData
  ai_analysis_data?: {
    analysis: {
      summary: string
      estimatedComplexity: "low" | "medium" | "high"
      developmentTasks: {
        name: string
        description: string
        category: string
        estimatedDays: number
        requiredRoles: string[]
      }[]
      technicalConsiderations: string[]
      risks: string[]
    }
  } | null
}

const ROLE_LABELS: Record<string, string> = {
  xrDeveloper: "XR 개발자",
  systemEngineer: "시스템 엔지니어",
  projectManager: "PM",
  designer: "디자이너",
}

const complexityColors: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
}

const complexityLabelsKr: Record<string, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
}

const categoryColors: Record<string, string> = {
  frontend: "bg-blue-100 text-blue-700",
  backend: "bg-green-100 text-green-700",
  integration: "bg-purple-100 text-purple-700",
  "3d": "bg-cyan-100 text-cyan-700",
  infrastructure: "bg-orange-100 text-orange-700",
}

const categoryLabelsKr: Record<string, string> = {
  frontend: "프론트엔드",
  backend: "백엔드",
  integration: "연동",
  "3d": "3D",
  infrastructure: "인프라",
}

export default function SharedQuotePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [excludedFeatures, setExcludedFeatures] = useState<Set<number>>(new Set())
  const [excludedAiTasks, setExcludedAiTasks] = useState<Set<number>>(new Set())

  useEffect(() => {
    async function fetchQuote() {
      try {
        const response = await fetch(`/api/quotes/${id}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError("견적서를 찾을 수 없습니다")
          } else {
            setError("견적서를 불러오는데 실패했습니다")
          }
          return
        }
        const data = await response.json()
        setQuote(data)
      } catch {
        setError("서버 오류가 발생했습니다")
      } finally {
        setLoading(false)
      }
    }

    fetchQuote()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">견적서 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="size-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">오류</h2>
            <p className="text-muted-foreground">{error || "견적서를 불러올 수 없습니다"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const data = quote.estimate_data
  const aiAnalysis = quote.ai_analysis_data
  const surveyData = quote.survey_data as {
    productCount?: number
    aiRealisticRendering?: boolean
    aiRenderingImagesPerYear?: number
  }

  // 총 개발 기간 (주 단위)
  const totalDuration = Math.ceil(data.totalDays / 5)

  // 기능 제외 토글
  const toggleFeatureExclusion = (index: number) => {
    setExcludedFeatures(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  // AI 작업 제외 토글
  const toggleAiTaskExclusion = (index: number) => {
    setExcludedAiTasks(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  // 제외 초기화
  const hasExclusions = excludedFeatures.size > 0
  const hasAiExclusions = excludedAiTasks.size > 0

  // 제외된 항목을 반영한 비용 재계산
  const includedFeatures = data.features.filter((_, index) => !excludedFeatures.has(index))
  const excludedFeatureCost = data.features
    .filter((_, index) => excludedFeatures.has(index))
    .reduce((sum, f) => sum + f.cost, 0)

  const includedAiTasks = data.aiAnalysis?.tasks?.filter((_, index) => !excludedAiTasks.has(index)) || []
  const excludedAiTaskCost = data.aiAnalysis?.tasks
    ?.filter((_, index) => excludedAiTasks.has(index))
    .reduce((sum, t) => sum + t.cost, 0) || 0

  // 조정된 인건비 계산 - 공통 유틸리티 사용
  const adjustedLaborCost = data.laborCost - excludedFeatureCost - excludedAiTaskCost
  const adjustedCost = calculateCostBreakdown({
    laborCost: adjustedLaborCost,
    additionalCosts: data.preprocessing3DCost,
  })
  const adjustedOverhead = adjustedCost.overhead
  const adjustedTechFee = adjustedCost.technicalFee
  const adjustedSubtotal = adjustedCost.subtotal
  const adjustedVat = adjustedCost.vat
  const adjustedTruncationDiscount = adjustedCost.truncationDiscount
  const adjustedTotalCost = adjustedCost.totalCost

  // 할인 금액 계산
  const totalExcludedCost = data.totalCost - adjustedTotalCost
  const hasAnyExclusion = hasExclusions || hasAiExclusions

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="container max-w-6xl mx-auto">
        {/* Title */}
        <div className="text-center mb-12">
          <Badge className="mb-4">공유된 견적서</Badge>
          <h1 className="text-3xl font-semibold mb-2">프로젝트 견적 및 개발 계획</h1>
          <p className="text-muted-foreground">
            {data.companyName} - {data.productCategory} 컨피규레이터
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            <Calendar className="size-4 inline mr-1" />
            {new Date(quote.created_at).toLocaleDateString("ko-KR")}
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
                    <p className="text-2xl font-semibold">{data.productCount}</p>
                    <p className="text-sm text-muted-foreground">제품 수</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <Layers className="size-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-semibold">{data.featureCount}</p>
                    <p className="text-sm text-muted-foreground">기능 수</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <Users className="size-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-semibold">{data.teamCount}</p>
                    <p className="text-sm text-muted-foreground">투입 인력</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <Clock className="size-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-semibold">{data.totalDays}</p>
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
                      {data.personnel.map((person, index) => (
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
                          {data.laborCost.toLocaleString()}원
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
                    <CardDescription>인건비, 제경비, 기술료, VAT 포함{data.aiAnalysis && " (AI 분석 포함)"}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">기본 기능 인건비</span>
                    <span className="font-medium">{(data.laborCost - (data.aiAnalysisCost || 0)).toLocaleString()}원</span>
                  </div>
                  {data.aiAnalysisCost && data.aiAnalysisCost > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Sparkles className="size-4 text-purple-500" />
                        AI 분석 요구사항 인건비
                      </span>
                      <span className="font-medium text-purple-600">{data.aiAnalysisCost.toLocaleString()}원</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 bg-slate-50 px-2 rounded">
                    <span className="font-medium">인건비 원가 합계</span>
                    <span className="font-semibold">{data.laborCost.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">제경비 (110%)</span>
                    <span className="font-medium">{data.overhead.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">기술료 (20%)</span>
                    <span className="font-medium">{data.technicalFee.toLocaleString()}원</span>
                  </div>
                  {data.preprocessing3DCost > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <FileBox className="size-4 text-cyan-500" />
                        3D 전처리 ({data.productCount}개 × {data.preprocessing3DUnitCost.toLocaleString()}원)
                      </span>
                      <span className="font-medium text-cyan-600">{data.preprocessing3DCost.toLocaleString()}원</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">소계 (VAT 제외)</span>
                    <span className="font-medium">{data.subtotal.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">부가가치세 (10%)</span>
                    <span className="font-medium">{data.vat.toLocaleString()}원</span>
                  </div>
                  {data.truncationDiscount > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-green-600">절사금</span>
                      <span className="font-medium text-green-600">-{data.truncationDiscount.toLocaleString()}원</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center py-3 text-lg">
                    <span className="font-semibold">총 예상 비용</span>
                    <span className="font-bold text-primary">{data.totalCost.toLocaleString()}원</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature List */}
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
                      onClick={() => setExcludedFeatures(new Set())}
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
                  {data.features.map((feature, index) => {
                    const isExcluded = excludedFeatures.has(index)
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
                              {feature.cost.toLocaleString()}원
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
                          {feature.allocation.split(", ").map((alloc, i) => (
                            <Badge key={i} variant="secondary" className={`text-xs ${isExcluded ? "opacity-50" : ""}`}>
                              {alloc}
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
                      {excludedFeatures.size}개 기능이 제외되었습니다. 실제 계약 시 반영됩니다.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Analysis Results */}
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
                        onClick={() => setExcludedAiTasks(new Set())}
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
                  {data.aiAnalysis?.tasks && data.aiAnalysis.tasks.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Code2 className="size-4" />
                        식별된 개발 작업
                      </h4>
                      {data.aiAnalysis.tasks.map((task, index) => {
                        const isExcluded = excludedAiTasks.has(index)
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
                                  <Badge className={`text-xs ${categoryColors[task.category] || "bg-gray-100 text-gray-700"}`}>
                                    {categoryLabelsKr[task.category] || task.category}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 ml-4">
                                <div className="text-right">
                                  <p className={`font-semibold ${isExcluded ? "line-through text-muted-foreground" : "text-purple-600"}`}>
                                    {task.days}일
                                  </p>
                                  <p className={`text-xs ${isExcluded ? "line-through text-muted-foreground" : "text-muted-foreground"}`}>
                                    {task.cost.toLocaleString()}원
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
                          </div>
                        )
                      })}
                    </div>
                  )}

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
                        {excludedAiTasks.size}개 AI 분석 작업이 제외되었습니다. 실제 계약 시 반영됩니다.
                      </p>
                    </div>
                  )}

                  {/* AI 분석 비용 소계 */}
                  {data.aiAnalysisCost && data.aiAnalysisCost > 0 && (
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-purple-800">AI 분석 요구사항 인건비 소계</span>
                        <span className="text-lg font-bold text-purple-600">{data.aiAnalysisCost.toLocaleString()}원</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 3D File Preprocessing */}
            {data.file3DAnalysis && (
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
                          data.file3DAnalysis.qualityGrade === "excellent" ? "bg-green-100 text-green-700" :
                          data.file3DAnalysis.qualityGrade === "good" ? "bg-blue-100 text-blue-700" :
                          data.file3DAnalysis.qualityGrade === "fair" ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }>
                          {data.file3DAnalysis.qualityGrade === "excellent" ? "최상" :
                           data.file3DAnalysis.qualityGrade === "good" ? "양호" :
                           data.file3DAnalysis.qualityGrade === "fair" ? "보통" : "개선 필요"}
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
                        <p className="font-medium truncate">{data.file3DAnalysis.fileName}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileType className="size-4" />
                            {data.file3DAnalysis.format}
                          </span>
                          <span className="flex items-center gap-1">
                            <HardDrive className="size-4" />
                            {data.file3DAnalysis.fileSizeFormatted}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 총 전처리 비용 */}
                  <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-cyan-700">파일당 전처리 비용</span>
                      <span className="font-medium text-cyan-700">{data.preprocessing3DUnitCost.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-cyan-700">제품 수량</span>
                      <span className="font-medium text-cyan-700">× {data.productCount}개</span>
                    </div>
                    <Separator className="border-cyan-200" />
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-cyan-800">3D 전처리 비용 합계</span>
                      <span className="text-lg font-bold text-cyan-600">
                        {data.preprocessing3DCost.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Maintenance Plan */}
            {data.maintenance && (
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
                          <Badge className="bg-emerald-500">{data.maintenance.planName}</Badge>
                        </CardTitle>
                        <CardDescription>연간 서버 운영 및 유지보수</CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      {data.maintenance.firstYearFree ? (
                        <>
                          <p className="text-lg text-muted-foreground line-through">
                            연 {(data.maintenance.annualCost / 10000).toLocaleString()}만원
                          </p>
                          <p className="text-2xl font-bold text-emerald-600">1년차 무료</p>
                        </>
                      ) : (
                        <p className="text-2xl font-bold text-emerald-600">
                          연 {(data.maintenance.annualCost / 10000).toLocaleString()}만원
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
                      <p className="text-2xl font-bold text-emerald-700">{data.maintenance.ticketsPerYear}</p>
                      <p className="text-sm text-muted-foreground">연간 지원 티켓</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-lg text-center">
                      <Wrench className="size-6 text-emerald-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-emerald-700">{data.maintenance.managerHoursPerMonth}시간</p>
                      <p className="text-sm text-muted-foreground">월 유지관리</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-lg text-center">
                      <Server className="size-6 text-emerald-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-emerald-700">
                        {(Object.values(data.maintenance.serverCosts).reduce((a, b) => a + b, 0) / 10000).toFixed(1)}만
                      </p>
                      <p className="text-sm text-muted-foreground">월 서버 비용</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-lg text-center">
                      <Users className="size-6 text-emerald-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-emerald-700">
                        {((data.maintenance.annualCost - Object.values(data.maintenance.serverCosts).reduce((a, b) => a + b, 0) * 12) / 10000).toLocaleString()}만
                      </p>
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
                          담당 매니저 월 {data.maintenance.managerHoursPerMonth}시간 투입
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
                          <span>{data.maintenance.serverCosts.webHosting.toLocaleString()}원</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">AWS S3 모델 파일 스토리지</span>
                          <span>{data.maintenance.serverCosts.storage.toLocaleString()}원</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">AWS 3D 렌더링 인스턴스</span>
                          <span>{data.maintenance.serverCosts.rendering.toLocaleString()}원</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">AWS 주문 연동 서버</span>
                          <span>{data.maintenance.serverCosts.orderServer.toLocaleString()}원</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Supabase DB</span>
                          <span>{data.maintenance.serverCosts.database.toLocaleString()}원</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>월 서버 비용 합계</span>
                          <span className="text-emerald-600">
                            {Object.values(data.maintenance.serverCosts).reduce((a, b) => a + b, 0).toLocaleString()}원
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 1년차 면제 표시 */}
                  {data.maintenance.firstYearFree && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <Gift className="size-5" />
                        <span className="font-medium">1년차 유지비 면제 적용</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Quick Summary */}
            <Card className="sticky top-6">
              <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
                <CardTitle className="text-center">견적 요약</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  {/* 원래 금액 (제외 항목이 있을 때만 표시) */}
                  {hasAnyExclusion && (
                    <p className="text-xl text-muted-foreground line-through mb-1">
                      {data.totalCost.toLocaleString()}원
                    </p>
                  )}
                  <p className="text-3xl font-bold">{adjustedTotalCost.toLocaleString()}원</p>
                  <p className="text-sm text-muted-foreground mt-1">VAT 포함 총 비용</p>
                  {hasAnyExclusion && (
                    <Badge className="mt-2 bg-amber-100 text-amber-700">
                      <Tag className="size-3 mr-1" />
                      {excludedFeatures.size + excludedAiTasks.size}개 항목 제외 (-{totalExcludedCost.toLocaleString()}원)
                    </Badge>
                  )}
                  <div className="flex justify-center gap-1 mt-2 flex-wrap">
                    {data.aiAnalysis && (
                      <Badge className="bg-purple-100 text-purple-700">
                        <Sparkles className="size-3 mr-1" />
                        AI 분석 포함
                      </Badge>
                    )}
                    {data.file3DAnalysis && (
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
                    <span className="text-muted-foreground">인건비 원가</span>
                    <span className="font-medium">
                      {hasAnyExclusion && adjustedLaborCost !== data.laborCost && (
                        <span className="text-muted-foreground line-through mr-2 text-xs">
                          {data.laborCost.toLocaleString()}원
                        </span>
                      )}
                      {adjustedLaborCost.toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">제경비 (110%)</span>
                    <span className="font-medium">
                      {hasAnyExclusion && adjustedOverhead !== data.overhead && (
                        <span className="text-muted-foreground line-through mr-2 text-xs">
                          {data.overhead.toLocaleString()}원
                        </span>
                      )}
                      {adjustedOverhead.toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">기술료 (20%)</span>
                    <span className="font-medium">
                      {hasAnyExclusion && adjustedTechFee !== data.technicalFee && (
                        <span className="text-muted-foreground line-through mr-2 text-xs">
                          {data.technicalFee.toLocaleString()}원
                        </span>
                      )}
                      {adjustedTechFee.toLocaleString()}원
                    </span>
                  </div>
                  {data.preprocessing3DCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <FileBox className="size-3 text-cyan-500" />
                        3D 전처리
                      </span>
                      <span className="font-medium text-cyan-600">{data.preprocessing3DCost.toLocaleString()}원</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">VAT (10%)</span>
                    <span className="font-medium">
                      {hasAnyExclusion && adjustedVat !== data.vat && (
                        <span className="text-muted-foreground line-through mr-2 text-xs">
                          {data.vat.toLocaleString()}원
                        </span>
                      )}
                      {adjustedVat.toLocaleString()}원
                    </span>
                  </div>
                  {adjustedTruncationDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-600">절사금</span>
                      <span className="font-medium text-green-600">-{adjustedTruncationDiscount.toLocaleString()}원</span>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">소요 기간</span>
                    <span className="font-medium">{totalDuration}주 ({data.totalDays}일)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">투입 인력</span>
                    <span className="font-medium">{data.teamCount}개 직군</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">기본 기능</span>
                    <span className="font-medium">
                      {hasExclusions ? (
                        <>
                          <span className="text-muted-foreground line-through mr-1 text-xs">{data.featureCount}개</span>
                          {includedFeatures.length}개
                        </>
                      ) : (
                        <>{data.featureCount}개</>
                      )}
                    </span>
                  </div>
                  {data.aiAnalysis?.tasks && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Sparkles className="size-3 text-purple-500" />
                        AI 분석 작업
                      </span>
                      <span className="font-medium text-purple-600">
                        {hasAiExclusions ? (
                          <>
                            <span className="text-muted-foreground line-through mr-1 text-xs">{data.aiAnalysis.tasks.length}개</span>
                            {includedAiTasks.length}개
                          </>
                        ) : (
                          <>{data.aiAnalysis.tasks.length}개</>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* 유지비 요약 */}
                {data.maintenance && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2 font-medium">
                        <Shield className="size-4 text-emerald-500" />
                        <span>연간 유지비</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          {data.maintenance.planName} 플랜
                        </span>
                        {data.maintenance.firstYearFree ? (
                          <div className="text-right">
                            <span className="text-muted-foreground line-through text-xs mr-2">
                              {data.maintenance.annualCost.toLocaleString()}원
                            </span>
                            <span className="font-medium text-emerald-600">1년차 무료</span>
                          </div>
                        ) : (
                          <span className="font-medium text-emerald-600">{data.maintenance.annualCost.toLocaleString()}원</span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <Separator className="my-4" />

                <p className="text-xs text-muted-foreground text-center">
                  본 견적은 예상 금액이며, 상세 요구사항에 따라 변동될 수 있습니다.
                </p>
                {(hasExclusions || hasAiExclusions) && (
                  <p className="text-xs text-amber-600 text-center mt-2">
                    {excludedFeatures.size + excludedAiTasks.size}개 항목이 제외되었습니다
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>이 견적서는 VIVAR CPQ 시스템에서 생성되었습니다.</p>
        </div>
      </div>
    </div>
  )
}
