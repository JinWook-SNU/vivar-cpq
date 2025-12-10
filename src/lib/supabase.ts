import { createClient, SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Supabase 클라이언트를 lazy하게 초기화
let _supabase: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables are not configured")
    return null
  }

  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey)
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
