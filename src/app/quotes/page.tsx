"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Building2,
  Calendar,
  FileText,
  ExternalLink,
  RefreshCw,
} from "lucide-react"

interface QuoteSummary {
  id: string
  created_at: string
  quote_number?: string
  company_name: string
  product_category: string
  total_cost: number
}

const CATEGORY_LABELS: Record<string, string> = {
  furniture: "가구",
  kitchen: "주방/욕실",
  interior: "인테리어",
  industrial: "산업용품",
  fashion: "패션/액세서리",
  other: "기타",
}

export default function QuotesListPage() {
  const [quotes, setQuotes] = useState<QuoteSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuotes = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/quotes/list")
      if (!response.ok) {
        throw new Error("Failed to fetch quotes")
      }
      const data = await response.json()
      setQuotes(data)
    } catch {
      setError("견적서 목록을 불러오는데 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuotes()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="container max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="size-4 mr-2" />
              홈으로
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={fetchQuotes} disabled={loading}>
            <RefreshCw className={`size-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <Badge className="mb-4">견적서 관리</Badge>
          <h1 className="text-3xl font-semibold mb-2">견적서 목록</h1>
          <p className="text-muted-foreground">
            지금까지 생성된 모든 견적서를 확인할 수 있습니다
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">견적서 목록 불러오는 중...</p>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchQuotes}>다시 시도</Button>
            </CardContent>
          </Card>
        ) : quotes.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <FileText className="size-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">견적서가 없습니다</h3>
              <p className="text-muted-foreground mb-4">
                아직 생성된 견적서가 없습니다. 새 견적을 생성해보세요.
              </p>
              <Link href="/quote">
                <Button>새 견적 생성</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {quotes.map((quote) => (
              <Card key={quote.id} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="size-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{quote.company_name}</CardTitle>
                          {quote.quote_number && (
                            <Badge variant="outline" className="font-mono text-xs">
                              {quote.quote_number}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">
                            {CATEGORY_LABELS[quote.product_category] || quote.product_category}
                          </Badge>
                          <span className="flex items-center gap-1 text-xs">
                            <Calendar className="size-3" />
                            {new Date(quote.created_at).toLocaleDateString("ko-KR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">
                        {quote.total_cost.toLocaleString()}원
                      </p>
                      <p className="text-xs text-muted-foreground">VAT 포함</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex justify-end gap-2">
                    <Link href={`/quote/shared/${quote.id}`}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="size-4 mr-2" />
                        견적서 보기
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && !error && quotes.length > 0 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            총 {quotes.length}개의 견적서
          </div>
        )}
      </div>
    </div>
  )
}
