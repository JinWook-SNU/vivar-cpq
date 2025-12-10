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

// HTML 요소를 PDF로 내보내기 (한글 지원)
export async function exportElementToPDF(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<void> {
  const { filename = "견적서.pdf" } = options

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

    // html2canvas로 요소 캡처
    const canvas = await html2canvas(element, {
      scale: 2, // 고해상도
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (_clonedDoc, clonedElement) => {
        // 클론된 요소에도 마커 추가
        clonedElement.setAttribute("data-pdf-print-container", "true")
        // 명시적 라이트 테마 적용
        clonedElement.style.backgroundColor = "#ffffff"
        clonedElement.style.color = "#0f172a"

        // 클론된 요소의 모든 부모 요소에 기본 배경색 적용
        let parent = clonedElement.parentElement
        while (parent) {
          parent.style.backgroundColor = "#ffffff"
          parent.style.color = "#0f172a"
          parent = parent.parentElement
        }
      },
    })

    const imgData = canvas.toDataURL("image/png")
    const imgWidth = pageWidth - margin * 2
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // 페이지당 높이 계산
    const pageContentHeight = pageHeight - margin * 2
    let heightLeft = imgHeight
    let position = margin

    // 첫 페이지 추가
    pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight)
    heightLeft -= pageContentHeight

    // 여러 페이지 처리
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin
      pdf.addPage()
      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight)
      heightLeft -= pageContentHeight
    }

    // PDF 저장
    pdf.save(filename)
  } catch (error) {
    // html2canvas에서 lab()/oklch() 에러 발생 시 스택 트레이스 출력
    console.error("PDF export failed:", error)
    if (error instanceof Error) {
      console.error("Stack trace:", error.stack)
    }
    throw error
  } finally {
    // 레거시 색상 스타일 정리
    removeLegacyColorsStyle(legacyStyle)
    // 마커 속성 제거
    element.removeAttribute("data-pdf-print-container")
  }
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
