"use client"

import { useEffect, useRef, useState, Suspense } from "react"
import { Canvas, useLoader, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Environment, Center, Bounds, useBounds } from "@react-three/drei"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js"
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import * as THREE from "three"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { File3DAnalysis } from "@/lib/3d-analysis"
import {
  FileBox,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  FileType,
  Loader2,
} from "lucide-react"

interface File3DPreviewProps {
  file: File | null
  analysis: File3DAnalysis | null
  className?: string
}

// 모델 로드 후 Bounds에 맞추기 위한 컴포넌트
function FitToView({ children }: { children: React.ReactNode }) {
  const bounds = useBounds()

  useEffect(() => {
    // 모델이 로드되면 카메라를 자동으로 맞춤
    bounds.refresh().clip().fit()
  }, [bounds])

  return <>{children}</>
}

// 3D 모델 렌더링 컴포넌트
function Model({ file, extension }: { file: File; extension: string }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const meshRef = useRef<THREE.Group>(null)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // 자동 회전
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3
    }
  })

  if (!objectUrl) return null

  // 확장자에 따른 로더 선택
  if (extension === "obj") {
    const obj = useLoader(OBJLoader, objectUrl)
    return (
      <group ref={meshRef}>
        <primitive object={obj.clone()} />
      </group>
    )
  }

  if (extension === "fbx") {
    const fbx = useLoader(FBXLoader, objectUrl)
    return (
      <group ref={meshRef}>
        <primitive object={fbx.clone()} />
      </group>
    )
  }

  if (extension === "gltf" || extension === "glb") {
    const gltf = useLoader(GLTFLoader, objectUrl)
    return (
      <group ref={meshRef}>
        <primitive object={gltf.scene.clone()} />
      </group>
    )
  }

  return null
}

// 로딩 폴백
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#94a3b8" wireframe />
    </mesh>
  )
}

// 품질 등급별 색상 및 아이콘
const gradeConfig: Record<string, { color: string; bgColor: string; icon: typeof CheckCircle2 }> = {
  excellent: { color: "text-green-700", bgColor: "bg-green-100", icon: CheckCircle2 },
  good: { color: "text-blue-700", bgColor: "bg-blue-100", icon: CheckCircle2 },
  fair: { color: "text-amber-700", bgColor: "bg-amber-100", icon: AlertCircle },
  "needs-work": { color: "text-red-700", bgColor: "bg-red-100", icon: AlertTriangle },
}

const gradeLabels: Record<string, string> = {
  excellent: "최상",
  good: "양호",
  fair: "보통",
  "needs-work": "개선 필요",
}

export function File3DPreview({ file, analysis, className }: File3DPreviewProps) {
  const [loadError, setLoadError] = useState(false)

  if (!file || !analysis) {
    return (
      <div className={cn("border-2 border-dashed rounded-lg p-8 text-center", className)}>
        <FileBox className="size-12 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">3D 파일을 업로드하면 미리보기가 표시됩니다</p>
      </div>
    )
  }

  const gradeStyle = gradeConfig[analysis.qualityGrade]
  const GradeIcon = gradeStyle.icon

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-white", className)}>
      {/* 3D 미리보기 영역 */}
      <div className="relative h-[200px] bg-gradient-to-br from-slate-100 to-slate-200">
        {analysis.canPreview && !loadError ? (
          <Canvas
            camera={{ position: [5, 5, 5], fov: 45, near: 0.01, far: 10000 }}
            onError={() => setLoadError(true)}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <directionalLight position={[-10, -10, -5]} intensity={0.3} />
            <Suspense fallback={<LoadingFallback />}>
              <Bounds fit clip observe margin={1.2}>
                <FitToView>
                  <Center>
                    <Model file={file} extension={analysis.fileExtension} />
                  </Center>
                </FitToView>
              </Bounds>
              <Environment preset="studio" />
            </Suspense>
            <OrbitControls
              enableZoom={true}
              enablePan={true}
              minDistance={0.5}
              maxDistance={1000}
              makeDefault
            />
          </Canvas>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <FileBox className="size-16 text-slate-400 mb-3" />
            <p className="text-sm text-slate-500 font-medium">{analysis.format}</p>
            <p className="text-xs text-slate-400 mt-1">
              {analysis.canPreview ? "로딩 중 오류 발생" : "이 형식은 미리보기를 지원하지 않습니다"}
            </p>
          </div>
        )}

        {/* 품질 등급 배지 */}
        <div className="absolute top-3 right-3">
          <Badge className={cn("gap-1", gradeStyle.bgColor, gradeStyle.color)}>
            <GradeIcon className="size-3" />
            {gradeLabels[analysis.qualityGrade]}
          </Badge>
        </div>
      </div>

      {/* 파일 정보 */}
      <div className="p-4 space-y-3">
        {/* 파일명 및 기본 정보 */}
        <div>
          <p className="font-medium text-sm truncate" title={analysis.fileName}>
            {analysis.fileName}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileType className="size-3" />
              {analysis.format}
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="size-3" />
              {analysis.fileSizeFormatted}
            </span>
          </div>
        </div>

        {/* 품질 메시지 */}
        <p className={cn("text-xs", gradeStyle.color)}>
          {analysis.qualityMessage}
        </p>

        {/* 전처리 필요 항목 */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-slate-600">전처리 필요 항목:</p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.preprocessing.modelOptimization && (
              <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                모델링 최적화
              </Badge>
            )}
            {analysis.preprocessing.meshOptimization && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                메쉬 최적화
              </Badge>
            )}
            {analysis.preprocessing.textureMapping && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                텍스처 맵핑
              </Badge>
            )}
          </div>
        </div>

        {/* 예상 전처리 비용 (단가) */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">파일당 전처리 비용</span>
            <span className="font-semibold text-primary">
              {analysis.cost.unitCost.toLocaleString()}원
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// 간단한 정보만 표시하는 컴팩트 버전
export function File3DPreviewCompact({ analysis }: { analysis: File3DAnalysis | null }) {
  if (!analysis) return null

  const gradeStyle = gradeConfig[analysis.qualityGrade]
  const GradeIcon = gradeStyle.icon

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
      <div className={cn("p-2 rounded-lg", gradeStyle.bgColor)}>
        <FileBox className={cn("size-5", gradeStyle.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{analysis.fileName}</p>
        <p className="text-xs text-muted-foreground">
          {analysis.format} • {analysis.fileSizeFormatted}
        </p>
      </div>
      <Badge className={cn("shrink-0 gap-1", gradeStyle.bgColor, gradeStyle.color)}>
        <GradeIcon className="size-3" />
        {gradeLabels[analysis.qualityGrade]}
      </Badge>
    </div>
  )
}

// 로딩 상태
export function File3DPreviewLoading() {
  return (
    <div className="border-2 border-dashed rounded-lg p-8 text-center">
      <Loader2 className="size-8 mx-auto mb-3 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground">3D 파일 분석 중...</p>
    </div>
  )
}
