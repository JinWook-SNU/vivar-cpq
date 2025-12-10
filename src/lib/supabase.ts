import "server-only"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

// 서버 라우트에서는 반드시 SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 사용
// public 키로 fallback하지 않음 (프로덕션 보안)
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// 환경변수 검증 상태
let envValidated = false

// 환경변수 검증 - 서버 라우트에서 Supabase 필요 시 fail-fast
function validateSupabaseEnv(): void {
  if (envValidated) return

  if (!supabaseUrl) {
    console.error(
      "SUPABASE_URL environment variable is not set. " +
      "Database operations will fail. " +
      "Set SUPABASE_URL in your environment or .env.local file."
    )
  }

  if (!supabaseServiceRoleKey) {
    console.error(
      "SUPABASE_SERVICE_ROLE_KEY environment variable is not set. " +
      "Database operations will fail. " +
      "Set SUPABASE_SERVICE_ROLE_KEY in your environment or .env.local file."
    )
  }

  envValidated = true
}

// Supabase 클라이언트를 lazy하게 초기화
let _supabase: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient | null {
  // 환경변수 검증 (최초 1회)
  validateSupabaseEnv()

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    // 환경변수 미설정 시 null 반환 (호출자가 처리)
    return null
  }

  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }

  return _supabase
}

// 견적서 데이터 타입
export interface QuoteData {
  id?: string
  created_at?: string
  company_name: string
  product_category: string
  total_cost: number
  survey_data: Record<string, unknown>
  estimate_data: Record<string, unknown>
  ai_analysis_data?: Record<string, unknown> | null
}

// 견적서 저장
export async function saveQuote(data: Omit<QuoteData, "id" | "created_at">): Promise<{ id: string } | null> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    console.error("Supabase client not initialized")
    return null
  }

  const { data: result, error } = await supabase
    .from("quotes")
    .insert([data])
    .select("id")
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
    .select("id, created_at, company_name, product_category, total_cost")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching quotes list:", error)
    return []
  }

  return data || []
}
