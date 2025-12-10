import { NextRequest, NextResponse } from "next/server"
import { saveQuote } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { companyName, productCategory, totalCost, surveyData, estimateData, aiAnalysisData } = body

    if (!companyName || !productCategory || totalCost === undefined || !surveyData || !estimateData) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다" },
        { status: 400 }
      )
    }

    const result = await saveQuote({
      company_name: companyName,
      product_category: productCategory,
      total_cost: totalCost,
      survey_data: surveyData,
      estimate_data: estimateData,
      ai_analysis_data: aiAnalysisData || null,
    })

    if (!result) {
      return NextResponse.json(
        { error: "견적서 저장에 실패했습니다. Supabase 테이블이 생성되었는지 확인하세요." },
        { status: 500 }
      )
    }

    return NextResponse.json({ id: result.id })
  } catch (error) {
    console.error("Quote save error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
