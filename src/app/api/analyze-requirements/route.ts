import { NextRequest, NextResponse } from "next/server"

// 간단한 in-memory rate limiting
// 주의: 서버리스 환경에서는 인스턴스 간 공유되지 않음
// 프로덕션에서는 Redis 또는 Upstash 사용 권장
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1분
const RATE_LIMIT_MAX_REQUESTS = 10 // 분당 10회

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  // 오래된 레코드 정리 (메모리 누수 방지)
  if (rateLimitMap.size > 10000) {
    const cutoff = now - RATE_LIMIT_WINDOW_MS
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < cutoff) {
        rateLimitMap.delete(key)
      }
    }
  }

  if (!record || now > record.resetTime) {
    // 새 윈도우 시작
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetIn: RATE_LIMIT_WINDOW_MS }
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now }
  }

  record.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count, resetIn: record.resetTime - now }
}

// AI 분석 결과 타입 정의
export interface AIRequirementAnalysis {
  summary: string // 요구사항 요약
  developmentTasks: DevelopmentTask[] // 개발 작업 목록
  personnelAllocation: PersonnelAllocation[] // 인력 배분
  technicalConsiderations: string[] // 기술 고려사항
  risks: string[] // 위험 요소
  estimatedComplexity: "low" | "medium" | "high" // 복잡도
}

export interface DevelopmentTask {
  name: string // 작업명
  description: string // 상세 설명
  category: "frontend" | "backend" | "integration" | "design" | "infrastructure" | "other" // 분류
  estimatedDays: number // 예상 소요일
  requiredRoles: string[] // 필요 인력 유형
}

export interface PersonnelAllocation {
  role: string // 인력 유형
  roleName: string // 인력명 (한글)
  days: number // 투입일
  tasks: string[] // 담당 작업 목록
}

// 일일 단가 (estimate 페이지와 동일)
const DAILY_RATES: Record<string, number> = {
  xrDeveloper: 420000,
  systemEngineer: 340000,
  projectManager: 560000,
  designer: 250000,
}

const ROLE_NAMES: Record<string, string> = {
  xrDeveloper: "XR 개발자",
  systemEngineer: "시스템 엔지니어",
  projectManager: "프로젝트 매니저",
  designer: "디자이너",
}

// 0.5일 단위로 반올림하는 헬퍼 함수
function roundToHalfDay(days: number): number {
  return Math.round(days * 2) / 2
}

// 요청 본문 최대 크기 (10KB)
const MAX_REQUIREMENTS_LENGTH = 10000
const MAX_FEATURES_COUNT = 50

export async function POST(request: NextRequest) {
  // Rate limiting 체크
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
             request.headers.get("x-real-ip") ||
             "unknown"
  const rateLimit = checkRateLimit(ip)

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetIn / 1000)),
          "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)),
        },
      }
    )
  }

  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: "잘못된 요청 형식입니다." },
        { status: 400 }
      )
    }

    // 기본 타입 검증
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "잘못된 요청 형식입니다." },
        { status: 400 }
      )
    }

    const { requirements, productCategory, existingFeatures } = body as {
      requirements?: unknown
      productCategory?: unknown
      existingFeatures?: unknown
    }

    // requirements 검증
    if (!requirements || typeof requirements !== "string" || requirements.trim().length === 0) {
      return NextResponse.json(
        { error: "요구사항이 입력되지 않았습니다." },
        { status: 400 }
      )
    }

    if (requirements.length > MAX_REQUIREMENTS_LENGTH) {
      return NextResponse.json(
        { error: `요구사항은 ${MAX_REQUIREMENTS_LENGTH}자를 초과할 수 없습니다.` },
        { status: 400 }
      )
    }

    // productCategory 검증 (선택적)
    if (productCategory !== undefined && typeof productCategory !== "string") {
      return NextResponse.json(
        { error: "제품 카테고리 형식이 올바르지 않습니다." },
        { status: 400 }
      )
    }

    // existingFeatures 검증 (선택적)
    if (existingFeatures !== undefined) {
      if (!Array.isArray(existingFeatures)) {
        return NextResponse.json(
          { error: "기존 기능 목록 형식이 올바르지 않습니다." },
          { status: 400 }
        )
      }
      if (existingFeatures.length > MAX_FEATURES_COUNT) {
        return NextResponse.json(
          { error: `기능 목록은 ${MAX_FEATURES_COUNT}개를 초과할 수 없습니다.` },
          { status: 400 }
        )
      }
      if (!existingFeatures.every((f) => typeof f === "string")) {
        return NextResponse.json(
          { error: "기존 기능 목록에 잘못된 항목이 있습니다." },
          { status: 400 }
        )
      }
    }

    const validatedRequirements = requirements.trim()
    const validatedCategory = typeof productCategory === "string" ? productCategory : undefined
    const validatedFeatures = Array.isArray(existingFeatures) ? existingFeatures : undefined

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API 키가 설정되지 않았습니다." },
        { status: 500 }
      )
    }

    // OpenAI API 호출
    const systemPrompt = `당신은 3D 컨피규레이터 개발 프로젝트의 기술 분석 전문가입니다.
사용자가 입력한 자연어 요구사항을 분석하여 개발에 필요한 작업, 인력 배분, 기술 고려사항을 도출합니다.

반드시 다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):

{
  "summary": "요구사항 요약 (1-2문장)",
  "developmentTasks": [
    {
      "name": "작업명",
      "description": "상세 설명",
      "category": "frontend|backend|integration|design|infrastructure|other",
      "estimatedDays": 숫자 (0.5일 단위, 예: 0.5, 1, 1.5, 2, 2.5...),
      "requiredRoles": ["xrDeveloper", "systemEngineer", "projectManager", "designer"]
    }
  ],
  "personnelAllocation": [
    {
      "role": "xrDeveloper|systemEngineer|projectManager|designer",
      "roleName": "역할 한글명",
      "days": 숫자 (0.5일 단위),
      "tasks": ["담당 작업 목록"]
    }
  ],
  "technicalConsiderations": ["기술 고려사항 목록"],
  "risks": ["위험 요소 목록"],
  "estimatedComplexity": "low|medium|high"
}

인력 유형:
- xrDeveloper (XR 개발자): 3D/WebGL/Three.js 개발, AR/VR 기능
- systemEngineer (시스템 엔지니어): 백엔드, API, DB, 연동 개발
- projectManager (프로젝트 매니저): 기획, 설계, PM
- designer (디자이너): UI/UX, 3D 모델링, 그래픽

예상 일수 산정 기준 (반드시 0.5일 단위로 산정):
- 간단한 기능: 0.5-2일
- 중간 복잡도: 2.5-5일
- 복잡한 기능: 5-10일
- 대규모 개발: 10일 이상`

    const userPrompt = `제품 카테고리: ${validatedCategory || "일반"}
기존 선택된 기능: ${validatedFeatures?.join(", ") || "없음"}

추가 요구사항:
${validatedRequirements}

위 요구사항을 분석하여 개발 작업, 인력 배분, 기술 고려사항을 JSON 형식으로 제공해주세요.`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("OpenAI API error:", errorData)
      return NextResponse.json(
        { error: "AI 분석 중 오류가 발생했습니다." },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: "AI 응답이 비어있습니다." },
        { status: 500 }
      )
    }

    // JSON 파싱
    let analysis: AIRequirementAnalysis
    try {
      // JSON 블록 추출 (```json ... ``` 형식 처리)
      let jsonContent = content
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        jsonContent = jsonMatch[1]
      }
      analysis = JSON.parse(jsonContent)
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "content:", content)
      return NextResponse.json(
        { error: "AI 응답 파싱 중 오류가 발생했습니다." },
        { status: 500 }
      )
    }

    // 모든 일수를 0.5일 단위로 반올림
    analysis.developmentTasks = analysis.developmentTasks.map((task) => ({
      ...task,
      estimatedDays: roundToHalfDay(task.estimatedDays),
    }))

    analysis.personnelAllocation = analysis.personnelAllocation.map((person) => ({
      ...person,
      days: roundToHalfDay(person.days),
    }))

    // 비용 계산 추가 (0.5일 단위로 반올림된 값 사용)
    const personnelWithCost = analysis.personnelAllocation.map((person) => ({
      ...person,
      roleName: ROLE_NAMES[person.role] || person.roleName,
      dailyRate: DAILY_RATES[person.role] || 300000,
      totalCost: (DAILY_RATES[person.role] || 300000) * person.days,
    }))

    const totalLaborCost = personnelWithCost.reduce(
      (sum, p) => sum + p.totalCost,
      0
    )
    const overhead = Math.round(totalLaborCost * 1.1)
    const technicalFee = Math.round((totalLaborCost + overhead) * 0.2)
    const subtotal = totalLaborCost + overhead + technicalFee
    const vat = Math.round(subtotal * 0.1)
    const totalBeforeDiscount = subtotal + vat
    const truncationDiscount = totalBeforeDiscount % 10000
    const totalCost = totalBeforeDiscount - truncationDiscount

    return NextResponse.json({
      success: true,
      analysis: {
        ...analysis,
        personnelAllocation: personnelWithCost,
      },
      costBreakdown: {
        laborCost: totalLaborCost,
        overhead,
        technicalFee,
        subtotal,
        vat,
        totalBeforeDiscount,
        truncationDiscount,
        totalCost,
      },
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Analyze requirements error:", error)
    return NextResponse.json(
      { error: "요구사항 분석 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
