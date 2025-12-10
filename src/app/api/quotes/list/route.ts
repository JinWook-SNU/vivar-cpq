import { NextResponse } from "next/server"
import { getQuotesList } from "@/lib/supabase"

export async function GET() {
  try {
    const quotes = await getQuotesList()
    return NextResponse.json(quotes)
  } catch (error) {
    console.error("Quotes list error:", error)
    return NextResponse.json(
      { error: "견적서 목록을 불러오는데 실패했습니다" },
      { status: 500 }
    )
  }
}
