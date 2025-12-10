import { NextRequest, NextResponse } from "next/server"
import { getQuote } from "@/lib/supabase"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: "견적서 ID가 필요합니다" },
        { status: 400 }
      )
    }

    const quote = await getQuote(id)

    if (!quote) {
      return NextResponse.json(
        { error: "견적서를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    return NextResponse.json(quote)
  } catch (error) {
    console.error("Quote fetch error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
