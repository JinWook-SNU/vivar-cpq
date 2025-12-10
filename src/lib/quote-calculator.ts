// 견적 비용 계산 공통 유틸리티

export interface CostBreakdown {
  laborCost: number        // 인건비 원가
  overhead: number         // 제경비 (인건비의 110%)
  technicalFee: number     // 기술료 ((인건비 + 제경비)의 20%)
  subtotal: number         // 소계 (인건비 + 제경비 + 기술료 + 기타비용)
  vat: number              // VAT (소계의 10%)
  totalBeforeDiscount: number  // 할인 전 총액 (소계 + VAT)
  truncationDiscount: number   // 절사금 (10000원 단위)
  totalCost: number        // 최종 총액
}

export interface CostCalculationInput {
  laborCost: number        // 인건비 원가
  additionalCosts?: number // 추가 비용 (3D 전처리 등)
}

/**
 * 비용 계산 공통 함수
 * - 제경비: 인건비의 110%
 * - 기술료: (인건비 + 제경비)의 20%
 * - VAT: 소계의 10%
 * - 절사: 10000원 단위
 */
export function calculateCostBreakdown(input: CostCalculationInput): CostBreakdown {
  const { laborCost, additionalCosts = 0 } = input

  // 제경비: 인건비의 110%
  const overhead = Math.round(laborCost * 1.1)

  // 기술료: (인건비 + 제경비)의 20%
  const technicalFee = Math.round((laborCost + overhead) * 0.2)

  // 소계: 인건비 + 제경비 + 기술료 + 추가비용
  const subtotal = laborCost + overhead + technicalFee + additionalCosts

  // VAT: 소계의 10%
  const vat = Math.round(subtotal * 0.1)

  // 할인 전 총액
  const totalBeforeDiscount = subtotal + vat

  // 절사금: 10000원 단위
  const truncationDiscount = totalBeforeDiscount % 10000

  // 최종 총액
  const totalCost = totalBeforeDiscount - truncationDiscount

  return {
    laborCost,
    overhead,
    technicalFee,
    subtotal,
    vat,
    totalBeforeDiscount,
    truncationDiscount,
    totalCost,
  }
}

/**
 * 할인이 적용된 비용 계산
 */
export interface DiscountedCostInput extends CostCalculationInput {
  overheadDiscountRate?: number  // 제경비 할인율 (0-100)
  techFeeDiscountRate?: number   // 기술료 할인율 (0-100)
}

export interface DiscountedCostBreakdown extends CostBreakdown {
  originalOverhead: number
  originalTechFee: number
  overheadDiscount: number
  techFeeDiscount: number
  totalDiscount: number
  discountPercentage: number
}

export function calculateDiscountedCostBreakdown(input: DiscountedCostInput): DiscountedCostBreakdown {
  const { laborCost, additionalCosts = 0, overheadDiscountRate = 0, techFeeDiscountRate = 0 } = input

  // 원래 제경비 및 기술료
  const originalOverhead = Math.round(laborCost * 1.1)
  const originalTechFee = Math.round((laborCost + originalOverhead) * 0.2)

  // 할인 적용
  const overheadDiscount = Math.round(originalOverhead * (overheadDiscountRate / 100))
  const techFeeDiscount = Math.round(originalTechFee * (techFeeDiscountRate / 100))

  const discountedOverhead = originalOverhead - overheadDiscount
  const discountedTechFee = originalTechFee - techFeeDiscount

  // 소계: 인건비 + 할인된 제경비 + 할인된 기술료 + 추가비용
  const subtotal = laborCost + discountedOverhead + discountedTechFee + additionalCosts

  // VAT: 소계의 10%
  const vat = Math.round(subtotal * 0.1)

  // 할인 전 총액
  const totalBeforeDiscount = subtotal + vat

  // 절사금: 10000원 단위
  const truncationDiscount = totalBeforeDiscount % 10000

  // 최종 총액
  const totalCost = totalBeforeDiscount - truncationDiscount

  // 원래 총액 (할인 없는 경우)
  const originalSubtotal = laborCost + originalOverhead + originalTechFee + additionalCosts
  const originalVat = Math.round(originalSubtotal * 0.1)
  const originalTotalBeforeDiscount = originalSubtotal + originalVat
  const originalTruncationDiscount = originalTotalBeforeDiscount % 10000
  const originalTotal = originalTotalBeforeDiscount - originalTruncationDiscount

  const totalDiscount = originalTotal - totalCost
  const discountPercentage = originalTotal > 0 ? Math.round((totalDiscount / originalTotal) * 100) : 0

  return {
    laborCost,
    overhead: discountedOverhead,
    technicalFee: discountedTechFee,
    subtotal,
    vat,
    totalBeforeDiscount,
    truncationDiscount,
    totalCost,
    originalOverhead,
    originalTechFee,
    overheadDiscount,
    techFeeDiscount,
    totalDiscount,
    discountPercentage,
  }
}
