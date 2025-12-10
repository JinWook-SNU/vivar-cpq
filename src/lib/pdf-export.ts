// PDF 내보내기 유틸리티
// Note: globals.css의 oklch() 색상이 rgb/hex로 변환되어 html2canvas 호환성 문제 해결됨
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

export interface PDFExportOptions {
  filename?: string
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
  const canvas = await html2canvas(element, {
    scale: 2, // 고해상도
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    onclone: (_clonedDoc, clonedElement) => {
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
