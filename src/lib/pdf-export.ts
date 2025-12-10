// PDF 내보내기 유틸리티
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

export interface PDFExportOptions {
  filename?: string
}

// 지원되지 않는 색상 함수 패턴
const UNSUPPORTED_COLOR_REGEX = /\b(lab|oklch|oklab|lch|color)\s*\([^)]+\)/gi

// CSS 값에서 지원되지 않는 색상 함수를 대체 색상으로 변환
function replaceUnsupportedColorInValue(value: string): string | null {
  if (!UNSUPPORTED_COLOR_REGEX.test(value)) {
    return null // 변환 불필요
  }
  // lab(), oklch() 등이 포함된 경우 기본 색상으로 대체
  // 투명도가 있는 경우 투명으로, 아니면 기본 색상 사용
  if (value.includes("/ 0") || value.includes("/0")) {
    return "transparent"
  }
  return value.replace(UNSUPPORTED_COLOR_REGEX, "rgb(15, 23, 42)") // slate-900
}

// 클론된 문서의 모든 스타일시트에서 지원되지 않는 색상 함수 제거
function sanitizeStyleSheets(clonedDoc: Document): void {
  // 모든 스타일시트 순회
  Array.from(clonedDoc.styleSheets).forEach((styleSheet) => {
    try {
      const rules = styleSheet.cssRules || styleSheet.rules
      if (!rules) return

      Array.from(rules).forEach((rule) => {
        if (rule instanceof CSSStyleRule) {
          const style = rule.style
          for (let i = 0; i < style.length; i++) {
            const prop = style[i]
            const value = style.getPropertyValue(prop)
            if (UNSUPPORTED_COLOR_REGEX.test(value)) {
              const replacement = replaceUnsupportedColorInValue(value)
              if (replacement) {
                style.setProperty(prop, replacement)
              }
            }
          }
        }
      })
    } catch {
      // CORS로 인해 외부 스타일시트 접근 불가 시 무시
    }
  })
}

// 요소와 모든 자식 요소의 인라인 스타일에서 지원되지 않는 색상 변환
function sanitizeInlineStyles(element: HTMLElement, clonedDoc: Document): void {
  const allElements = [element, ...Array.from(element.querySelectorAll("*"))] as HTMLElement[]

  const colorProperties = [
    "color",
    "background-color",
    "border-color",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
    "outline-color",
    "text-decoration-color",
    "fill",
    "stroke",
    "box-shadow",
    "text-shadow",
  ]

  allElements.forEach((el) => {
    if (!(el instanceof HTMLElement)) return

    // 클론된 문서의 window를 사용하여 computed style 가져오기
    const computedStyle = clonedDoc.defaultView?.getComputedStyle(el)
    if (!computedStyle) return

    colorProperties.forEach((prop) => {
      const value = computedStyle.getPropertyValue(prop)
      if (value && UNSUPPORTED_COLOR_REGEX.test(value)) {
        const replacement = replaceUnsupportedColorInValue(value)
        if (replacement) {
          el.style.setProperty(prop, replacement, "important")
        }
      }
    })
  })
}

// 모든 요소에 인라인 스타일로 computed color 적용
function applyInlineColors(element: HTMLElement): Map<HTMLElement, string> {
  const originalStyles = new Map<HTMLElement, string>()
  const allElements = [element, ...Array.from(element.querySelectorAll("*"))] as HTMLElement[]

  const colorProperties = [
    "color",
    "background-color",
    "border-color",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
    "outline-color",
  ]

  allElements.forEach((el) => {
    if (!(el instanceof HTMLElement)) return

    try {
      // 원본 인라인 스타일 저장
      originalStyles.set(el, el.getAttribute("style") || "")

      const computedStyle = window.getComputedStyle(el)

      colorProperties.forEach((prop) => {
        const value = computedStyle.getPropertyValue(prop)
        if (value) {
          // computed style은 이미 rgb로 변환되어 있음
          el.style.setProperty(prop, value, "important")
        }
      })
    } catch {
      // 무시
    }
  })

  return originalStyles
}

// 원본 인라인 스타일 복원
function restoreInlineStyles(originalStyles: Map<HTMLElement, string>): void {
  originalStyles.forEach((style, el) => {
    if (style) {
      el.setAttribute("style", style)
    } else {
      el.removeAttribute("style")
    }
  })
}

// Tailwind v4 CSS 변수를 RGB로 오버라이드하는 스타일 생성
// html2canvas가 lab()/oklch()를 파싱하기 전에 주입
const LEGACY_COLOR_OVERRIDES = `
  :root {
    --background: 255 255 255 !important;
    --foreground: 15 23 42 !important;
    --card: 255 255 255 !important;
    --card-foreground: 15 23 42 !important;
    --popover: 255 255 255 !important;
    --popover-foreground: 15 23 42 !important;
    --primary: 15 23 42 !important;
    --primary-foreground: 248 250 252 !important;
    --secondary: 241 245 249 !important;
    --secondary-foreground: 15 23 42 !important;
    --muted: 241 245 249 !important;
    --muted-foreground: 100 116 139 !important;
    --accent: 241 245 249 !important;
    --accent-foreground: 15 23 42 !important;
    --destructive: 239 68 68 !important;
    --destructive-foreground: 248 250 252 !important;
    --border: 226 232 240 !important;
    --input: 226 232 240 !important;
    --ring: 15 23 42 !important;
  }
  * {
    color: rgb(15, 23, 42) !important;
    border-color: rgb(226, 232, 240) !important;
  }
  .bg-primary { background-color: rgb(15, 23, 42) !important; }
  .bg-primary\\/10 { background-color: rgba(15, 23, 42, 0.1) !important; }
  .text-primary { color: rgb(15, 23, 42) !important; }
  .text-primary-foreground { color: rgb(248, 250, 252) !important; }
  .text-muted-foreground { color: rgb(100, 116, 139) !important; }
  .bg-slate-50 { background-color: rgb(248, 250, 252) !important; }
  .bg-slate-50\\/50 { background-color: rgba(248, 250, 252, 0.5) !important; }
  .bg-white { background-color: rgb(255, 255, 255) !important; }
  .border { border-color: rgb(226, 232, 240) !important; }
  .bg-purple-50 { background-color: rgb(250, 245, 255) !important; }
  .bg-purple-50\\/50 { background-color: rgba(250, 245, 255, 0.5) !important; }
  .bg-purple-100 { background-color: rgb(243, 232, 255) !important; }
  .text-purple-600 { color: rgb(147, 51, 234) !important; }
  .text-purple-700 { color: rgb(126, 34, 206) !important; }
  .text-purple-800 { color: rgb(107, 33, 168) !important; }
  .bg-cyan-50 { background-color: rgb(236, 254, 255) !important; }
  .bg-cyan-50\\/50 { background-color: rgba(236, 254, 255, 0.5) !important; }
  .bg-cyan-100 { background-color: rgb(207, 250, 254) !important; }
  .text-cyan-600 { color: rgb(8, 145, 178) !important; }
  .text-cyan-700 { color: rgb(14, 116, 144) !important; }
  .bg-emerald-50 { background-color: rgb(236, 253, 245) !important; }
  .bg-emerald-50\\/50 { background-color: rgba(236, 253, 245, 0.5) !important; }
  .bg-emerald-100 { background-color: rgb(209, 250, 229) !important; }
  .text-emerald-600 { color: rgb(5, 150, 105) !important; }
  .text-emerald-700 { color: rgb(4, 120, 87) !important; }
  .bg-green-50 { background-color: rgb(240, 253, 244) !important; }
  .bg-green-100 { background-color: rgb(220, 252, 231) !important; }
  .text-green-500 { color: rgb(34, 197, 94) !important; }
  .text-green-600 { color: rgb(22, 163, 74) !important; }
  .text-green-700 { color: rgb(21, 128, 61) !important; }
  .bg-amber-50 { background-color: rgb(255, 251, 235) !important; }
  .bg-amber-100 { background-color: rgb(254, 243, 199) !important; }
  .text-amber-700 { color: rgb(180, 83, 9) !important; }
  .text-amber-800 { color: rgb(146, 64, 14) !important; }
  .bg-red-100 { background-color: rgb(254, 226, 226) !important; }
  .text-red-700 { color: rgb(185, 28, 28) !important; }
  .bg-blue-100 { background-color: rgb(219, 234, 254) !important; }
  .text-blue-700 { color: rgb(29, 78, 216) !important; }
  .text-blue-800 { color: rgb(30, 64, 175) !important; }
  .bg-orange-100 { background-color: rgb(255, 237, 213) !important; }
  .text-orange-500 { color: rgb(249, 115, 22) !important; }
  .text-orange-700 { color: rgb(194, 65, 12) !important; }
  .text-yellow-500 { color: rgb(234, 179, 8) !important; }
`

// 레거시 색상 오버라이드 스타일 주입
function injectLegacyColorOverrides(): HTMLStyleElement {
  const style = document.createElement("style")
  style.setAttribute("data-pdf-legacy-colors", "true")
  style.textContent = LEGACY_COLOR_OVERRIDES
  document.head.appendChild(style)
  return style
}

// 레거시 색상 오버라이드 스타일 제거
function removeLegacyColorOverrides(style: HTMLStyleElement): void {
  if (style.parentNode) {
    style.parentNode.removeChild(style)
  }
}

// HTML 요소를 PDF로 내보내기 (한글 지원)
export async function exportElementToPDF(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<void> {
  const { filename = "견적서.pdf" } = options

  // 레거시 색상 오버라이드 스타일 주입 (html2canvas가 lab()/oklch() 파싱 전에)
  const legacyStyle = injectLegacyColorOverrides()

  // Sanitize global stylesheets before html2canvas parses them
  try {
    sanitizeStyleSheets(document)
  } catch {
    // ignore cross-origin stylesheets
  }

  // A4 크기 설정 (mm)
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 0 // 마진은 컴포넌트에서 처리

  // html2canvas 실행 전에 모든 요소에 인라인 스타일로 색상 적용
  // (computed style은 이미 브라우저가 rgb로 변환함)
  const originalStyles = applyInlineColors(element)

  try {
    // html2canvas로 요소 캡처
    const canvas = await html2canvas(element, {
      scale: 2, // 고해상도
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc, clonedElement) => {
        // 클론된 요소의 모든 부모 요소에 기본 배경색 적용
        let parent = clonedElement.parentElement
        while (parent) {
          parent.style.backgroundColor = "#ffffff"
          parent.style.color = "#0f172a"
          parent = parent.parentElement
        }
        // body와 html에도 적용
        clonedDoc.body.style.backgroundColor = "#ffffff"
        clonedDoc.body.style.color = "#0f172a"
        clonedDoc.documentElement.style.backgroundColor = "#ffffff"

        // 스타일시트에서 지원되지 않는 색상 함수 제거
        sanitizeStyleSheets(clonedDoc)

        // 인라인 스타일에서 지원되지 않는 색상 함수 변환
        sanitizeInlineStyles(clonedElement, clonedDoc)
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
  } finally {
    // 원본 인라인 스타일 복원
    restoreInlineStyles(originalStyles)
    // 레거시 색상 오버라이드 스타일 제거
    removeLegacyColorOverrides(legacyStyle)
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
