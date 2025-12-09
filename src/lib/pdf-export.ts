// PDF 내보내기 유틸리티
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

export interface PDFExportOptions {
  filename?: string
}

// lab(), oklch() 등 지원되지 않는 색상 함수를 RGB로 변환
function convertUnsupportedColors(element: HTMLElement): void {
  const allElements = element.querySelectorAll("*")
  const elementsToProcess = [element, ...Array.from(allElements)] as HTMLElement[]

  elementsToProcess.forEach((el) => {
    if (!(el instanceof HTMLElement)) return

    const computedStyle = window.getComputedStyle(el)

    // 색상 속성들을 확인하고 변환
    const colorProperties = [
      "color",
      "backgroundColor",
      "borderColor",
      "borderTopColor",
      "borderRightColor",
      "borderBottomColor",
      "borderLeftColor",
      "outlineColor",
      "textDecorationColor",
      "fill",
      "stroke",
    ]

    colorProperties.forEach((prop) => {
      const value = computedStyle.getPropertyValue(prop.replace(/([A-Z])/g, "-$1").toLowerCase())
      if (value && (value.includes("lab(") || value.includes("oklch(") || value.includes("oklab("))) {
        // 임시 요소를 만들어서 브라우저가 변환한 RGB 값을 가져옴
        const tempEl = document.createElement("div")
        tempEl.style.cssText = `${prop.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`
        document.body.appendChild(tempEl)
        const converted = window.getComputedStyle(tempEl).getPropertyValue(prop.replace(/([A-Z])/g, "-$1").toLowerCase())
        document.body.removeChild(tempEl)

        // 변환된 값이 rgb/rgba 형식이면 적용
        if (converted && (converted.startsWith("rgb") || converted.startsWith("#"))) {
          el.style.setProperty(prop.replace(/([A-Z])/g, "-$1").toLowerCase(), converted)
        } else {
          // 변환 실패 시 기본값 적용
          if (prop === "backgroundColor") {
            el.style.backgroundColor = "transparent"
          } else if (prop === "color") {
            el.style.color = "#0f172a"
          } else {
            el.style.setProperty(prop.replace(/([A-Z])/g, "-$1").toLowerCase(), "transparent")
          }
        }
      }
    })
  })
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

  // html2canvas로 요소 캡처
  // onclone을 사용하여 클론된 요소의 색상을 html2canvas가 지원하는 형식으로 변환
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

      // lab(), oklch() 등 지원되지 않는 색상 함수 변환
      convertUnsupportedColors(clonedElement)
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
