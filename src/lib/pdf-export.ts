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

// 요소를 복제하고 지원되지 않는 색상을 변환하여 반환
function createSanitizedClone(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement

  // 복제된 요소를 임시로 DOM에 추가 (computed style 계산을 위해)
  clone.style.position = "absolute"
  clone.style.left = "-9999px"
  clone.style.top = "-9999px"
  document.body.appendChild(clone)

  // 모든 요소의 computed style에서 lab() 등 색상 함수를 RGB로 변환
  const allElements = [clone, ...Array.from(clone.querySelectorAll("*"))] as HTMLElement[]

  const colorProperties = [
    "color",
    "background-color",
    "backgroundColor",
    "border-color",
    "borderColor",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
    "outline-color",
    "text-decoration-color",
    "fill",
    "stroke",
    "box-shadow",
    "boxShadow",
    "text-shadow",
    "textShadow",
  ]

  allElements.forEach((el) => {
    if (!(el instanceof HTMLElement)) return

    try {
      const computedStyle = window.getComputedStyle(el)

      colorProperties.forEach((prop) => {
        try {
          const value = computedStyle.getPropertyValue(prop)
          if (value && UNSUPPORTED_COLOR_REGEX.test(value)) {
            const replacement = replaceUnsupportedColorInValue(value)
            if (replacement) {
              el.style.setProperty(prop, replacement, "important")
            }
          }
        } catch {
          // 개별 속성 처리 실패 시 무시
        }
      })
    } catch {
      // computed style 접근 실패 시 무시
    }
  })

  // DOM에서 제거
  document.body.removeChild(clone)

  return clone
}

// HTML 요소를 PDF로 내보내기 (한글 지원)
export async function exportElementToPDF(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<void> {
  const { filename = "견적서.pdf" } = options

  // A4 크기 설정 (mm)
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 0 // 마진은 컴포넌트에서 처리

  // 지원되지 않는 색상을 미리 변환한 복제본 생성
  const sanitizedClone = createSanitizedClone(element)

  // 복제본을 임시로 DOM에 추가
  sanitizedClone.style.position = "absolute"
  sanitizedClone.style.left = "-9999px"
  sanitizedClone.style.top = "-9999px"
  sanitizedClone.style.width = `${element.offsetWidth}px`
  document.body.appendChild(sanitizedClone)

  try {
    // html2canvas로 요소 캡처
    const canvas = await html2canvas(sanitizedClone, {
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
    // 복제본 정리
    if (sanitizedClone.parentNode) {
      document.body.removeChild(sanitizedClone)
    }
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
