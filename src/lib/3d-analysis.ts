// 3D 파일 분석 및 전처리 비용 산정 유틸리티

export interface File3DAnalysis {
  fileName: string
  fileSize: number // bytes
  fileSizeFormatted: string
  fileExtension: string
  format: string

  // 미리보기 가능 여부
  canPreview: boolean
  previewType: "threejs" | "info-only"

  // 전처리 필요 항목
  preprocessing: {
    modelOptimization: boolean      // 모델링 최적화 필요 (10MB 이상)
    meshOptimization: boolean       // 메쉬 최적화 필요 (5MB 이상)
    textureMapping: boolean         // 텍스처 맵핑 필요 (STEP, SKP, STP)
  }

  // 비용 산정 (단일 파일 기준)
  cost: {
    baseCost: number               // 기본 비용 (50,000원)
    modelOptimizationCost: number  // 모델링 최적화 비용
    meshOptimizationCost: number   // 메쉬 최적화 비용
    textureMappingCost: number     // 텍스처 맵핑 비용
    unitCost: number               // 단일 파일 전처리 비용
  }

  // 품질 등급
  qualityGrade: "excellent" | "good" | "fair" | "needs-work"
  qualityMessage: string
}

// 파일 확장자별 정보
const FILE_FORMATS: Record<string, { name: string; canPreview: boolean }> = {
  obj: { name: "Wavefront OBJ", canPreview: true },
  fbx: { name: "Autodesk FBX", canPreview: true },
  gltf: { name: "GL Transmission Format", canPreview: true },
  glb: { name: "GL Binary", canPreview: true },
  step: { name: "STEP (ISO 10303)", canPreview: false },
  stp: { name: "STEP (ISO 10303)", canPreview: false },
  skp: { name: "SketchUp", canPreview: false },
  blend: { name: "Blender", canPreview: false },
  max: { name: "3ds Max", canPreview: false },
  ma: { name: "Maya ASCII", canPreview: false },
  mb: { name: "Maya Binary", canPreview: false },
}

// 비용 상수
const COSTS = {
  base: 50000,                    // 기본 전처리 비용
  modelOptimization: 100000,      // 모델링 최적화 (10MB 이상)
  meshOptimization: 50000,        // 메쉬 최적화 (5MB 이상)
  textureMapping: 80000,          // 텍스처 맵핑 (STEP, SKP, STP)
}

// 파일 크기 포맷팅
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// 파일 확장자 추출
function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() || ""
}

// 3D 파일 분석
export function analyze3DFile(file: File): File3DAnalysis {
  const fileName = file.name
  const fileSize = file.size
  const fileExtension = getFileExtension(fileName)
  const formatInfo = FILE_FORMATS[fileExtension] || { name: "Unknown", canPreview: false }

  // 전처리 필요 항목 판단
  const preprocessing = {
    modelOptimization: fileSize >= 10 * 1024 * 1024, // 10MB 이상
    meshOptimization: fileSize >= 5 * 1024 * 1024 && fileSize < 10 * 1024 * 1024, // 5MB ~ 10MB
    textureMapping: ["step", "stp", "skp"].includes(fileExtension),
  }

  // 비용 계산 (단일 파일 기준)
  const cost = {
    baseCost: COSTS.base,
    modelOptimizationCost: preprocessing.modelOptimization ? COSTS.modelOptimization : 0,
    meshOptimizationCost: preprocessing.meshOptimization ? COSTS.meshOptimization : 0,
    textureMappingCost: preprocessing.textureMapping ? COSTS.textureMapping : 0,
    unitCost: 0,
  }
  cost.unitCost =
    cost.baseCost +
    cost.modelOptimizationCost +
    cost.meshOptimizationCost +
    cost.textureMappingCost

  // 품질 등급 산정
  let qualityGrade: File3DAnalysis["qualityGrade"]
  let qualityMessage: string

  if (!preprocessing.modelOptimization && !preprocessing.meshOptimization && !preprocessing.textureMapping && formatInfo.canPreview) {
    qualityGrade = "excellent"
    qualityMessage = "최적화된 파일입니다. 즉시 사용 가능합니다."
  } else if (!preprocessing.modelOptimization && !preprocessing.textureMapping) {
    qualityGrade = "good"
    qualityMessage = "양호한 파일입니다. 경미한 최적화가 필요합니다."
  } else if (!preprocessing.modelOptimization) {
    qualityGrade = "fair"
    qualityMessage = "사용 가능하나 일부 전처리가 필요합니다."
  } else {
    qualityGrade = "needs-work"
    qualityMessage = "대규모 최적화가 필요합니다. 전처리 시간이 소요됩니다."
  }

  return {
    fileName,
    fileSize,
    fileSizeFormatted: formatFileSize(fileSize),
    fileExtension,
    format: formatInfo.name,
    canPreview: formatInfo.canPreview,
    previewType: formatInfo.canPreview ? "threejs" : "info-only",
    preprocessing,
    cost,
    qualityGrade,
    qualityMessage,
  }
}

// 분석 결과를 sessionStorage에 저장할 수 있도록 직렬화
export function serializeAnalysis(analysis: File3DAnalysis): string {
  return JSON.stringify(analysis)
}

// sessionStorage에서 분석 결과 복원
export function deserializeAnalysis(data: string): File3DAnalysis | null {
  try {
    return JSON.parse(data) as File3DAnalysis
  } catch {
    return null
  }
}
