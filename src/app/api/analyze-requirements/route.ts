import { NextRequest, NextResponse } from "next/server"

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

export async function POST(request: NextRequest) {
  try {
    const { requirements, productCategory, existingFeatures } = await request.json()

    if (!requirements || requirements.trim().length === 0) {
      return NextResponse.json(
        { error: "요구사항이 입력되지 않았습니다." },
        { status: 400 }
      )
    }

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

    const userPrompt = `제품 카테고리: ${productCategory || "일반"}
기존 선택된 기능: ${existingFeatures?.join(", ") || "없음"}

추가 요구사항:
${requirements}

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
