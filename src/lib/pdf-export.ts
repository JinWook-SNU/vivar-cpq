// PDF 내보내기 유틸리티
// Note: globals.css의 oklch() 색상이 rgb/hex로 변환되어 html2canvas 호환성 문제 해결됨
// cross-origin/blocked 스타일시트의 lab()/oklch() 문제 방지를 위해 legacy-colors 스타일 주입
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

export interface PDFExportOptions {
  filename?: string
}

// PDF 내보내기용 레거시 색상 오버라이드 스타일
// cross-origin 스타일시트에서 올 수 있는 lab()/oklch() 색상을 RGB로 강제 변환
const LEGACY_COLORS_CSS = `
/* PDF Legacy Colors Override - Forces RGB colors for html2canvas compatibility */
* {
  --background: #ffffff !important;
  --foreground: #0f172a !important;
  --card: #ffffff !important;
  --card-foreground: #0f172a !important;
  --popover: #ffffff !important;
  --popover-foreground: #0f172a !important;
  --primary: #1e293b !important;
  --primary-foreground: #f8fafc !important;
  --secondary: #f1f5f9 !important;
  --secondary-foreground: #1e293b !important;
  --muted: #f1f5f9 !important;
  --muted-foreground: #64748b !important;
  --accent: #f1f5f9 !important;
  --accent-foreground: #1e293b !important;
  --destructive: #ef4444 !important;
  --destructive-foreground: #ffffff !important;
  --border: #e2e8f0 !important;
  --input: #e2e8f0 !important;
  --ring: #94a3b8 !important;
}

/* Explicit light theme colors for print view */
[data-pdf-print-container],
[data-pdf-print-container] * {
  background-color: #ffffff !important;
  color: #0f172a !important;
  border-color: #e2e8f0 !important;
}

[data-pdf-print-container] .text-muted-foreground {
  color: #64748b !important;
}

[data-pdf-print-container] .bg-slate-50,
[data-pdf-print-container] .bg-slate-100 {
  background-color: #f8fafc !important;
}

[data-pdf-print-container] .bg-primary {
  background-color: #1e293b !important;
}

[data-pdf-print-container] .text-primary {
  color: #1e293b !important;
}

[data-pdf-print-container] .text-primary-foreground {
  color: #f8fafc !important;
}

[data-pdf-print-container] .bg-purple-50,
[data-pdf-print-container] .bg-purple-100 {
  background-color: #faf5ff !important;
}

[data-pdf-print-container] .text-purple-600,
[data-pdf-print-container] .text-purple-700 {
  color: #7c3aed !important;
}

[data-pdf-print-container] .bg-cyan-50,
[data-pdf-print-container] .bg-cyan-100 {
  background-color: #ecfeff !important;
}

[data-pdf-print-container] .text-cyan-600,
[data-pdf-print-container] .text-cyan-700 {
  color: #0891b2 !important;
}

[data-pdf-print-container] .bg-emerald-50,
[data-pdf-print-container] .bg-emerald-100 {
  background-color: #ecfdf5 !important;
}

[data-pdf-print-container] .text-emerald-600,
[data-pdf-print-container] .text-emerald-700 {
  color: #059669 !important;
}

[data-pdf-print-container] .bg-amber-50,
[data-pdf-print-container] .bg-amber-100 {
  background-color: #fffbeb !important;
}

[data-pdf-print-container] .text-amber-600,
[data-pdf-print-container] .text-amber-700,
[data-pdf-print-container] .text-amber-800 {
  color: #d97706 !important;
}

[data-pdf-print-container] .bg-green-50,
[data-pdf-print-container] .bg-green-100 {
  background-color: #f0fdf4 !important;
}

[data-pdf-print-container] .text-green-600,
[data-pdf-print-container] .text-green-700 {
  color: #16a34a !important;
}

[data-pdf-print-container] .bg-red-50,
[data-pdf-print-container] .bg-red-100 {
  background-color: #fef2f2 !important;
}

[data-pdf-print-container] .text-red-600,
[data-pdf-print-container] .text-red-700 {
  color: #dc2626 !important;
}

[data-pdf-print-container] .bg-blue-50,
[data-pdf-print-container] .bg-blue-100 {
  background-color: #eff6ff !important;
}

[data-pdf-print-container] .text-blue-600,
[data-pdf-print-container] .text-blue-700 {
  color: #2563eb !important;
}

[data-pdf-print-container] .bg-orange-50,
[data-pdf-print-container] .bg-orange-100 {
  background-color: #fff7ed !important;
}

[data-pdf-print-container] .text-orange-500,
[data-pdf-print-container] .text-orange-600 {
  color: #ea580c !important;
}

[data-pdf-print-container] .text-yellow-500 {
  color: #eab308 !important;
}

/* Badge colors */
[data-pdf-print-container] .bg-primary\\/10 {
  background-color: rgba(30, 41, 59, 0.1) !important;
}

[data-pdf-print-container] .bg-purple-100 {
  background-color: #f3e8ff !important;
}

[data-pdf-print-container] .bg-cyan-100 {
  background-color: #cffafe !important;
}

[data-pdf-print-container] .bg-emerald-100 {
  background-color: #d1fae5 !important;
}

[data-pdf-print-container] .border-purple-200 {
  border-color: #e9d5ff !important;
}

[data-pdf-print-container] .border-cyan-200 {
  border-color: #a5f3fc !important;
}

[data-pdf-print-container] .border-emerald-200 {
  border-color: #a7f3d0 !important;
}

[data-pdf-print-container] .border-amber-200 {
  border-color: #fde68a !important;
}
`

// 레거시 색상 스타일 주입
function injectLegacyColorsStyle(): HTMLStyleElement {
  const style = document.createElement("style")
  style.setAttribute("data-pdf-legacy-colors", "true")
  style.textContent = LEGACY_COLORS_CSS
  document.head.appendChild(style)
  return style
}

// 레거시 색상 스타일 제거
function removeLegacyColorsStyle(style: HTMLStyleElement): void {
  if (style && style.parentNode) {
    style.parentNode.removeChild(style)
  }
}

// PDF 내보내기 결과 타입
export interface PDFExportResult {
  success: boolean
  error?: Error
}

// HTML 요소를 PDF로 내보내기 (한글 지원)
export async function exportElementToPDF(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<PDFExportResult> {
  const { filename = "견적서.pdf" } = options

  // 폰트 로딩 대기 (최대 3초)
  try {
    await Promise.race([
      document.fonts.ready,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Font loading timeout")), 3000)
      ),
    ])
  } catch (fontError) {
    console.warn("[PDF Export] Font loading issue:", fontError)
    // 폰트 로딩 실패해도 계속 진행
  }

  // 레거시 색상 스타일 주입
  const legacyStyle = injectLegacyColorsStyle()

  // PDF 출력 컨테이너 마커 추가
  element.setAttribute("data-pdf-print-container", "true")

  try {
    // A4 크기 설정 (mm)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 0 // 마진은 컴포넌트에서 처리

    // A4 at 96dpi
    const A4_WIDTH_PX = 794

    // 페이지별 요소 찾기 (직계 자식들이 각각의 페이지)
    const pageElements = element.children
    const pageCount = pageElements.length

    // 각 페이지를 개별적으로 캡처하여 PDF에 추가
    for (let i = 0; i < pageCount; i++) {
      const pageElement = pageElements[i] as HTMLElement

      // 페이지 캡처 - height를 지정하지 않아 요소의 실제 높이 사용
      const canvas = await html2canvas(pageElement, {
        scale: 2, // 고해상도 (CTO: 2 정도로 제한)
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: A4_WIDTH_PX,
        windowWidth: A4_WIDTH_PX,
        onclone: (clonedDoc, clonedElement) => {
          clonedElement.setAttribute("data-pdf-print-container", "true")
          clonedElement.style.backgroundColor = "#ffffff"
          clonedElement.style.color = "#0f172a"
          clonedElement.style.width = `${A4_WIDTH_PX}px`
          clonedElement.style.overflow = "visible"
          // CTO: transform/letter-spacing 기본값 강제
          clonedElement.style.transform = "none"
          clonedElement.style.letterSpacing = "normal"

          // 모든 텍스트 요소에 descender 잘림 방지 스타일 적용
          const textElements = clonedDoc.querySelectorAll("p, span, td, th, li, h1, h2, h3, h4, h5, h6")
          textElements.forEach((el) => {
            const htmlEl = el as HTMLElement
            htmlEl.style.transform = "none"
            htmlEl.style.letterSpacing = "normal"
          })

          let parent = clonedElement.parentElement
          while (parent) {
            parent.style.backgroundColor = "#ffffff"
            parent.style.color = "#0f172a"
            parent.style.overflow = "visible"
            parent = parent.parentElement
          }
        },
      })

      const imgData = canvas.toDataURL("image/png")

      // 첫 페이지가 아니면 새 페이지 추가
      if (i > 0) {
        pdf.addPage()
      }

      // 캡처된 이미지의 비율 유지하면서 페이지에 맞춤
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * pageWidth) / canvas.width
      pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight)
    }

    // PDF 저장
    pdf.save(filename)
    return { success: true }
  } catch (error) {
    // html2canvas에서 lab()/oklch() 에러 발생 시 스택 트레이스 출력
    console.error("[PDF Export] Failed:", error)
    if (error instanceof Error) {
      console.error("[PDF Export] Stack trace:", error.stack)
      return { success: false, error }
    }
    return { success: false, error: new Error(String(error)) }
  } finally {
    // 레거시 색상 스타일 정리
    removeLegacyColorsStyle(legacyStyle)
    // 마커 속성 제거
    element.removeAttribute("data-pdf-print-container")
  }
}

// 브라우저 인쇄 기능으로 fallback
export function printWithBrowser(): void {
  window.print()
}

// PDF 데이터 인터페이스 (PrintView 컴포넌트용)
export interface EstimatePDFData {
  companyName: string
  productCategory: string
  date: string
  totalCost: number
  featureCount: number
  totalDays: number
  teamCount: number
  laborCost: number
  overhead: number
  technicalFee: number
  subtotal: number
  vat: number
  truncationDiscount: number
  preprocessing3DCost: number
  preprocessing3DUnitCost: number
  productCount: number
  aiAnalysisCost: number
  personnel: {
    role: string
    days: number
    dailyRate: number
    totalCost: number
  }[]
  features: {
    name: string
    cost: number
    allocation: string
  }[]
  file3DAnalysis?: {
    fileName: string
    format: string
    fileSizeFormatted: string
    qualityGrade: string
    unitCost: number
  }
  aiAnalysis?: {
    summary: string
    complexity: string
    tasks: {
      name: string
      category: string
      days: number
      cost: number
    }[]
  }
}
