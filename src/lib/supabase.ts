import "server-only"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

// 서버 라우트 환경변수 (권장: service role key 사용)
// fallback: public 키 (보안 경고 출력)
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 환경변수 검증 상태
let envValidated = false

// 환경변수 검증 - 서버 라우트에서 Supabase 필요 시 경고
function validateSupabaseEnv(): void {
  if (envValidated) return

  if (!supabaseUrl) {
    console.error(
      "[Supabase] SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) is not set. " +
      "Database operations will fail."
    )
  }

  if (!supabaseServiceRoleKey && supabaseAnonKey) {
    console.warn(
      "[Supabase] SUPABASE_SERVICE_ROLE_KEY is not set. " +
      "Falling back to NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "This is not recommended for production - set SUPABASE_SERVICE_ROLE_KEY for server routes."
    )
  }

  if (!supabaseServiceRoleKey && !supabaseAnonKey) {
    console.error(
      "[Supabase] Neither SUPABASE_SERVICE_ROLE_KEY nor NEXT_PUBLIC_SUPABASE_ANON_KEY is set. " +
      "Database operations will fail."
    )
  }

  envValidated = true
}

// 사용할 키 결정 (service role 우선, anon key fallback)
function getSupabaseKey(): string | undefined {
  return supabaseServiceRoleKey ?? supabaseAnonKey
}

// Supabase 클라이언트를 lazy하게 초기화
let _supabase: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient | null {
  // 환경변수 검증 (최초 1회)
  validateSupabaseEnv()

  const key = getSupabaseKey()
  if (!supabaseUrl || !key) {
    // 환경변수 미설정 시 null 반환 (호출자가 처리)
    return null
  }

  if (!_supabase) {
    _supabase = createClient(supabaseUrl, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }

  return _supabase
}

// 견적서 데이터 타입
export interface QuoteData {
  id?: string
  created_at?: string
  quote_number?: string // 견적서 번호 (YYYYMMDD-NNN 형식)
  company_name: string
  product_category: string
  total_cost: number
  survey_data: Record<string, unknown>
  estimate_data: Record<string, unknown>
  ai_analysis_data?: Record<string, unknown> | null
}

// 견적서 번호 생성 (YYYYMMDD-NNN 형식)
async function generateQuoteNumber(): Promise<string> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    // fallback: 타임스탬프 기반 번호
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "")
    return `${dateStr}-001`
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const dateStr = `${year}${month}${day}`

  // 해당 날짜의 견적서 수 조회
  const startOfDay = `${year}-${month}-${day}T00:00:00.000Z`
  const endOfDay = `${year}-${month}-${day}T23:59:59.999Z`

  const { count, error } = await supabase
    .from("quotes")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfDay)
    .lte("created_at", endOfDay)

  if (error) {
    console.error("Error counting quotes for today:", error)
    return `${dateStr}-001`
  }

  const sequenceNumber = String((count || 0) + 1).padStart(3, "0")
  return `${dateStr}-${sequenceNumber}`
}

// 견적서 저장
export async function saveQuote(data: Omit<QuoteData, "id" | "created_at" | "quote_number">): Promise<{ id: string; quote_number: string } | null> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    console.error("Supabase client not initialized")
    return null
  }

  // 견적서 번호 생성
  const quoteNumber = await generateQuoteNumber()

  const { data: result, error } = await supabase
    .from("quotes")
    .insert([{ ...data, quote_number: quoteNumber }])
    .select("id, quote_number")
    .single()

  if (error) {
    console.error("Error saving quote:", error)
    return null
  }

  return result
}

// 견적서 조회
export async function getQuote(id: string): Promise<QuoteData | null> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    console.error("Supabase client not initialized")
    return null
  }

  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching quote:", error)
    return null
  }

  return data
}

// 견적서 목록 조회 (요약 정보만)
export interface QuoteSummary {
  id: string
  created_at: string
  quote_number?: string
  company_name: string
  product_category: string
  total_cost: number
}

export async function getQuotesList(): Promise<QuoteSummary[]> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    console.error("Supabase client not initialized")
    return []
  }

  const { data, error } = await supabase
    .from("quotes")
    .select("id, created_at, quote_number, company_name, product_category, total_cost")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching quotes list:", error)
    return []
  }

  return data || []
}
