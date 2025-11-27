"use client"

import { useMemo, useRef, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react"

interface FeatureAllocation {
  name: string
  allocation: {
    xrDeveloper: number
    systemEngineer: number
    projectManager: number
    designer: number
  }
}

interface ScheduledTask {
  name: string
  role: string
  startDay: number
  duration: number
  color: string
}

interface RoleSchedule {
  role: string
  roleName: string
  color: string
  bgColor: string
  tasks: ScheduledTask[]
}

interface ProjectTimelineProps {
  features: FeatureAllocation[]
  className?: string
}

// 줌 레벨 설정
const ZOOM_LEVELS = [
  { label: "50%", value: 0.5, dayWidth: 20 },
  { label: "75%", value: 0.75, dayWidth: 30 },
  { label: "100%", value: 1, dayWidth: 40 },
  { label: "125%", value: 1.25, dayWidth: 50 },
  { label: "150%", value: 1.5, dayWidth: 60 },
  { label: "200%", value: 2, dayWidth: 80 },
]

// 역할별 색상 정의
const ROLE_COLORS: Record<string, { color: string; bgColor: string; barColor: string }> = {
  projectManager: {
    color: "text-violet-700",
    bgColor: "bg-violet-50",
    barColor: "bg-gradient-to-r from-violet-500 to-violet-400"
  },
  designer: {
    color: "text-pink-700",
    bgColor: "bg-pink-50",
    barColor: "bg-gradient-to-r from-pink-500 to-pink-400"
  },
  xrDeveloper: {
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    barColor: "bg-gradient-to-r from-blue-500 to-blue-400"
  },
  systemEngineer: {
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    barColor: "bg-gradient-to-r from-emerald-500 to-emerald-400"
  },
}

const ROLE_NAMES: Record<string, string> = {
  projectManager: "PM",
  designer: "디자이너",
  xrDeveloper: "XR 개발자",
  systemEngineer: "시스템 엔지니어",
}

// 작업 의존성 정의
const TASK_DEPENDENCIES: Record<string, string[]> = {
  "기획 및 플랫폼 베이스 구축": [],
  "3D 모델링 제작": ["기획 및 플랫폼 베이스 구축"],
  "컬러 변경": ["기획 및 플랫폼 베이스 구축"],
  "옵션 변경": ["기획 및 플랫폼 베이스 구축"],
  "사이즈 조절": ["기획 및 플랫폼 베이스 구축"],
  "모듈 조립": ["기획 및 플랫폼 베이스 구축"],
  "AR/VR 호환": ["기획 및 플랫폼 베이스 구축"],
  "애니메이션": ["기획 및 플랫폼 베이스 구축"],
  "실시간 견적": ["기획 및 플랫폼 베이스 구축"],
  "치수 측정": ["기획 및 플랫폼 베이스 구축"],
  "ERP 연동": ["기획 및 플랫폼 베이스 구축"],
  "장바구니 연동": ["ERP 연동"],
  "프리셋": ["기획 및 플랫폼 베이스 구축"],
  "캠페인 모드": ["기획 및 플랫폼 베이스 구축"],
  "규정 검토": ["기획 및 플랫폼 베이스 구축"],
  "주문 상세 내역 관리": ["기획 및 플랫폼 베이스 구축"],
  "팀 관리": ["기획 및 플랫폼 베이스 구축"],
  "유닛 관리": ["기획 및 플랫폼 베이스 구축"],
  "텍스처 관리": ["기획 및 플랫폼 베이스 구축"],
  "견적서 발행": ["주문 상세 내역 관리"],
  "도면 출력": ["기획 및 플랫폼 베이스 구축"],
  "설치 안내서 발행": ["기획 및 플랫폼 베이스 구축"],
  "QA 및 피드백 반영": [],
}

// 작업 우선순위
const TASK_PRIORITY: Record<string, number> = {
  "기획 및 플랫폼 베이스 구축": 0,
  "3D 모델링 제작": 1,
  "컬러 변경": 2,
  "옵션 변경": 2,
  "사이즈 조절": 2,
  "모듈 조립": 3,
  "AR/VR 호환": 3,
  "애니메이션": 3,
  "실시간 견적": 4,
  "치수 측정": 4,
  "ERP 연동": 5,
  "장바구니 연동": 6,
  "프리셋": 4,
  "캠페인 모드": 5,
  "규정 검토": 5,
  "주문 상세 내역 관리": 4,
  "팀 관리": 4,
  "유닛 관리": 4,
  "텍스처 관리": 5,
  "견적서 발행": 6,
  "도면 출력": 6,
  "설치 안내서 발행": 6,
  "QA 및 피드백 반영": 100,
}

function getTaskBaseName(taskName: string): string {
  return taskName.replace(/\s*\([^)]*\)\s*/g, "").trim()
}

export function ProjectTimeline({ features, className }: ProjectTimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [zoomIndex, setZoomIndex] = useState(2)
  const [hoveredTask, setHoveredTask] = useState<string | null>(null)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const currentZoom = ZOOM_LEVELS[zoomIndex]
  const dayWidth = currentZoom.dayWidth

  const handleZoomIn = () => {
    if (zoomIndex < ZOOM_LEVELS.length - 1) {
      setZoomIndex(zoomIndex + 1)
    }
  }

  const handleZoomOut = () => {
    if (zoomIndex > 0) {
      setZoomIndex(zoomIndex - 1)
    }
  }

  const handleZoomReset = () => {
    setZoomIndex(2)
  }

  // 스케줄 계산
  const { roleSchedules, totalDays } = useMemo(() => {
    const sortedFeatures = [...features].sort((a, b) => {
      const priorityA = TASK_PRIORITY[getTaskBaseName(a.name)] ?? 50
      const priorityB = TASK_PRIORITY[getTaskBaseName(b.name)] ?? 50
      return priorityA - priorityB
    })

    const taskEndDays: Record<string, number> = {}
    const roleAvailableDay: Record<string, number> = {
      projectManager: 0,
      designer: 0,
      xrDeveloper: 0,
      systemEngineer: 0,
    }

    const schedules: Record<string, ScheduledTask[]> = {
      projectManager: [],
      designer: [],
      xrDeveloper: [],
      systemEngineer: [],
    }

    const qaTask = sortedFeatures.find(f => f.name === "QA 및 피드백 반영")
    const otherTasks = sortedFeatures.filter(f => f.name !== "QA 및 피드백 반영")

    otherTasks.forEach(feature => {
      const baseName = getTaskBaseName(feature.name)
      const dependencies = TASK_DEPENDENCIES[baseName] || []

      let earliestStart = 0
      dependencies.forEach(dep => {
        const depEndDay = taskEndDays[dep] || 0
        earliestStart = Math.max(earliestStart, depEndDay)
      })

      const roles = ["projectManager", "designer", "xrDeveloper", "systemEngineer"] as const
      let taskEndDay = 0

      roles.forEach(role => {
        const days = feature.allocation[role]
        if (days > 0) {
          const startDay = Math.max(roleAvailableDay[role], earliestStart)

          schedules[role].push({
            name: feature.name,
            role,
            startDay,
            duration: days,
            color: ROLE_COLORS[role].barColor,
          })

          roleAvailableDay[role] = startDay + days
          taskEndDay = Math.max(taskEndDay, startDay + days)
        }
      })

      taskEndDays[baseName] = taskEndDay
    })

    if (qaTask) {
      const allTasksEndDay = Math.max(...Object.values(taskEndDays), ...Object.values(roleAvailableDay))

      const roles = ["projectManager", "designer", "xrDeveloper", "systemEngineer"] as const
      roles.forEach(role => {
        const days = qaTask.allocation[role]
        if (days > 0) {
          schedules[role].push({
            name: qaTask.name,
            role,
            startDay: allTasksEndDay,
            duration: days,
            color: ROLE_COLORS[role].barColor,
          })
        }
      })
    }

    let maxDay = 0
    Object.values(schedules).forEach(tasks => {
      tasks.forEach(task => {
        maxDay = Math.max(maxDay, task.startDay + task.duration)
      })
    })

    const roleSchedules: RoleSchedule[] = [
      {
        role: "projectManager",
        roleName: ROLE_NAMES.projectManager,
        color: ROLE_COLORS.projectManager.color,
        bgColor: ROLE_COLORS.projectManager.bgColor,
        tasks: schedules.projectManager,
      },
      {
        role: "designer",
        roleName: ROLE_NAMES.designer,
        color: ROLE_COLORS.designer.color,
        bgColor: ROLE_COLORS.designer.bgColor,
        tasks: schedules.designer,
      },
      {
        role: "xrDeveloper",
        roleName: ROLE_NAMES.xrDeveloper,
        color: ROLE_COLORS.xrDeveloper.color,
        bgColor: ROLE_COLORS.xrDeveloper.bgColor,
        tasks: schedules.xrDeveloper,
      },
      {
        role: "systemEngineer",
        roleName: ROLE_NAMES.systemEngineer,
        color: ROLE_COLORS.systemEngineer.color,
        bgColor: ROLE_COLORS.systemEngineer.bgColor,
        tasks: schedules.systemEngineer,
      },
    ].filter(schedule => schedule.tasks.length > 0)

    return { roleSchedules, totalDays: Math.ceil(maxDay) }
  }, [features])

  // 드래그 스크롤 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0))
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    const x = e.pageX - (scrollContainerRef.current?.offsetLeft || 0)
    const walk = (x - startX) * 1.5
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollLeft - walk
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false)
    window.addEventListener("mouseup", handleGlobalMouseUp)
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp)
  }, [])

  // 일수 표시 간격 계산
  const getInterval = () => {
    if (dayWidth >= 60) return 1
    if (dayWidth >= 40) return totalDays <= 20 ? 1 : 2
    if (dayWidth >= 30) return totalDays <= 15 ? 1 : totalDays <= 30 ? 2 : 5
    return totalDays <= 10 ? 1 : totalDays <= 20 ? 2 : 5
  }
  const dayInterval = getInterval()
  const dayMarkers = Array.from(
    { length: Math.ceil(totalDays / dayInterval) + 1 },
    (_, i) => i * dayInterval
  ).filter(d => d <= totalDays)

  const chartWidth = Math.max(totalDays * dayWidth, 600)
  const weeks = Math.ceil(totalDays / 5)

  return (
    <div className={cn("space-y-4", className)}>
      {/* 프로젝트 요약 및 줌 컨트롤 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Badge variant="outline" className="text-sm px-3 py-1">
            총 {totalDays}일 ({weeks}주)
          </Badge>
          <div className="flex items-center gap-3 flex-wrap">
            {roleSchedules.map(schedule => (
              <div key={schedule.role} className="flex items-center gap-1.5">
                <div className={cn("w-3 h-3 rounded-sm", ROLE_COLORS[schedule.role].barColor)} />
                <span className="text-xs text-muted-foreground">{schedule.roleName}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 줌 컨트롤 */}
        <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoomIndex === 0}
            className="h-7 w-7 p-0"
          >
            <ZoomOut className="size-4" />
          </Button>
          <span className="text-xs font-medium w-12 text-center">{currentZoom.label}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
            className="h-7 w-7 p-0"
          >
            <ZoomIn className="size-4" />
          </Button>
          <div className="w-px h-4 bg-slate-300" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomReset}
            className="h-7 w-7 p-0"
            title="100%로 리셋"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
        <span>호버하여 작업 상세 보기</span>
        <span>•</span>
        <span>드래그하여 스크롤</span>
      </div>

      {/* 타임라인 차트 */}
      <div
        ref={scrollContainerRef}
        className={cn(
          "relative overflow-x-auto border rounded-lg bg-white",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div style={{ minWidth: chartWidth + 140 }} className="select-none">
          {/* 헤더 - 일수 표시 */}
          <div className="sticky top-0 z-20 bg-slate-50 border-b">
            <div className="flex">
              <div className="w-[140px] shrink-0 px-4 py-3 border-r bg-slate-100 font-medium text-sm text-slate-600">
                포지션
              </div>
              <div className="flex-1 relative h-10">
                {dayMarkers.map(day => (
                  <div
                    key={day}
                    className="absolute top-0 h-full flex flex-col items-center justify-center"
                    style={{ left: day * dayWidth }}
                  >
                    <span className="text-xs font-medium text-slate-500">
                      {day === 0 ? "시작" : `${day}일`}
                    </span>
                  </div>
                ))}
                {Array.from({ length: weeks }, (_, i) => (i + 1) * 5).map(day => (
                  day <= totalDays && (
                    <div
                      key={`week-${day}`}
                      className="absolute top-0 h-full border-l-2 border-dashed border-slate-300"
                      style={{ left: day * dayWidth }}
                    />
                  )
                ))}
              </div>
            </div>
          </div>

          {/* 역할별 스케줄 행 */}
          {roleSchedules.map((schedule, rowIndex) => {
            const isExpanded = expandedRow === schedule.role
            const rowHeight = isExpanded ? 120 : 60

            return (
              <div
                key={schedule.role}
                className={cn(
                  "flex border-b last:border-b-0 transition-all duration-300 ease-out",
                  rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                )}
                style={{ minHeight: rowHeight }}
              >
                <div
                  className={cn(
                    "w-[140px] shrink-0 px-4 py-4 border-r flex items-center gap-2 transition-all duration-300",
                    schedule.bgColor
                  )}
                >
                  <div
                    className={cn("w-2 rounded-full transition-all duration-300", ROLE_COLORS[schedule.role].barColor)}
                    style={{ height: isExpanded ? 60 : 32 }}
                  />
                  <span className={cn("font-medium text-sm", schedule.color)}>
                    {schedule.roleName}
                  </span>
                </div>

                <div
                  className="flex-1 relative py-2 transition-all duration-300"
                  style={{ height: rowHeight }}
                  onMouseLeave={() => setExpandedRow(null)}
                >
                  {dayMarkers.map(day => (
                    <div
                      key={day}
                      className="absolute top-0 h-full border-l border-slate-100"
                      style={{ left: day * dayWidth }}
                    />
                  ))}

                  {Array.from({ length: weeks }, (_, i) => (i + 1) * 5).map(day => (
                    day <= totalDays && (
                      <div
                        key={`week-line-${day}`}
                        className="absolute top-0 h-full border-l-2 border-dashed border-slate-200"
                        style={{ left: day * dayWidth }}
                      />
                    )
                  ))}

                  {schedule.tasks.map((task, taskIndex) => {
                    const taskId = `${schedule.role}-${task.name}-${taskIndex}`
                    const isHovered = hoveredTask === taskId
                    const barWidth = task.duration * dayWidth - 4
                    const expandedWidth = Math.max(barWidth, 200)

                    return (
                      <div
                        key={taskId}
                        className={cn(
                          "absolute rounded-md shadow-sm",
                          "flex items-center overflow-hidden",
                          "border border-white/20",
                          "transition-all duration-300 ease-out",
                          task.color,
                          isHovered ? "z-30 shadow-lg ring-2 ring-white/50" : "z-10"
                        )}
                        style={{
                          left: task.startDay * dayWidth + 2,
                          width: isHovered ? expandedWidth : Math.max(barWidth, 30),
                          height: isHovered ? 80 : 36,
                          top: "50%",
                          transform: "translateY(-50%)",
                        }}
                        onMouseEnter={() => {
                          setHoveredTask(taskId)
                          setExpandedRow(schedule.role)
                        }}
                        onMouseLeave={() => {
                          setHoveredTask(null)
                        }}
                      >
                        <div className="px-3 py-2 w-full h-full flex flex-col justify-center transition-all duration-300">
                          <span className={cn(
                            "font-medium text-white drop-shadow-sm",
                            isHovered ? "text-sm" : "text-xs truncate"
                          )}>
                            {task.name}
                          </span>
                          {isHovered && (
                            <div className="mt-1 space-y-0.5 animate-in fade-in duration-200">
                              <p className="text-xs text-white/90">
                                {task.startDay + 1}일 ~ {task.startDay + task.duration}일
                              </p>
                              <p className="text-xs text-white/80">
                                소요: {task.duration}일
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* 마일스톤 표시 */}
          <div className="flex border-t bg-slate-50">
            <div className="w-[140px] shrink-0 px-4 py-2 border-r text-xs text-slate-500 font-medium">
              마일스톤
            </div>
            <div className="flex-1 relative h-8">
              <div
                className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1"
                style={{ left: 4 }}
              >
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-green-600 font-medium">시작</span>
              </div>

              {(() => {
                const qaTask = roleSchedules
                  .flatMap(s => s.tasks)
                  .find(t => t.name === "QA 및 피드백 반영")
                if (qaTask) {
                  return (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1"
                      style={{ left: qaTask.startDay * dayWidth }}
                    >
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-xs text-amber-600 font-medium">QA</span>
                    </div>
                  )
                }
                return null
              })()}

              <div
                className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1"
                style={{ left: totalDays * dayWidth - 30 }}
              >
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs text-blue-600 font-medium">완료</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
