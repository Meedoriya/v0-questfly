"use client"

import { useMemo, type ReactElement } from "react"
import { useApp } from "@/lib/store"
import {
  ArrowLeft,
  Flame,
  Lock,
  CheckCircle2,
  Star,
  Zap,
  Trophy,
  Play,
  Plus,
  Repeat,
  Map as MapIcon,
} from "lucide-react"
import type { QuestMilestone, Task } from "@/lib/types"

type NodeStatus = "done" | "active" | "locked"

function getNodeStatus(task: Task): NodeStatus {
  if (task.status === "done") return "done"
  if (task.status === "active") return "active"
  return "locked"
}

// Duolingo-style winding offset: nodes snake left-center-right-center-left
function getNodeX(index: number): number {
  const positions = [50, 30, 15, 30, 50, 70, 85, 70]
  return positions[index % positions.length]
}

/* Circular progress ring — emerald arc on a muted track, glowing softly. */
function ProgressRing({ percent, size = 132 }: { percent: number; size?: number }) {
  const stroke = 11
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const clamped = Math.min(100, Math.max(0, percent))
  const offset = circ - (clamped / 100) * circ
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
          style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.5))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold leading-none text-foreground">{clamped}%</span>
        <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Complete
        </span>
      </div>
    </div>
  )
}

export function QuestRoadmapScreen() {
  const { currentQuest, setScreen, setCurrentTask } = useApp()

  if (!currentQuest) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <Trophy className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          No quest selected. Go back and tap a quest card.
        </p>
        <button
          onClick={() => setScreen("home")}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Back to Home
        </button>
      </div>
    )
  }

  const milestones = currentQuest.milestones
  const tasks = currentQuest.tasks
  const completedCount = tasks.filter((t) => t.status === "done").length
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  const milestoneSections: QuestMilestone[] =
    milestones && milestones.length > 0
      ? milestones
      : [{ id: currentQuest.id, questNumber: 1, title: "", tasks, status: "active", description: "", progress: 0, totalTasks: tasks.length }]

  const connectors = useMemo(() => {
    const flat: Task[] = []
    for (const ms of milestoneSections) {
      for (const task of ms.tasks) {
        flat.push(task)
      }
    }
    const paths: ReactElement[] = []
    for (let j = 0; j < flat.length - 1; j++) {
      const task = flat[j]
      const i = j
      const x1 = getNodeX(i)
      const x2 = getNodeX(i + 1)
      const y1 = i * 140 + 48 + 32
      const y2 = (i + 1) * 140 + 32
      const isCompleted = getNodeStatus(task) === "done"
      paths.push(
        <path
          key={`conn-${task.id}-${j}`}
          d={`M ${x1}% ${y1} C ${x1}% ${y1 + 50}, ${x2}% ${y2 - 50}, ${x2}% ${y2}`}
          stroke={isCompleted ? "hsl(var(--primary))" : "hsl(var(--border))"}
          strokeWidth={isCompleted ? 3 : 2}
          strokeDasharray={isCompleted ? "none" : "8 5"}
          fill="none"
          strokeLinecap="round"
        />,
      )
    }
    return paths
  }, [milestoneSections])

  const milestoneStartIndexes = useMemo(() => {
    let sum = 0
    const out: number[] = []
    for (const ms of milestoneSections) {
      out.push(sum)
      sum += ms.tasks.length
    }
    return out
  }, [milestoneSections])

  // Per-milestone completion, used by the desktop navigator rail.
  const milestoneStats = useMemo(
    () =>
      milestoneSections.map((ms) => {
        const done = ms.tasks.filter((t) => t.status === "done").length
        const total = ms.tasks.length
        return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
      }),
    [milestoneSections],
  )

  const handleNodeTap = (task: Task) => {
    if (task.status === "active") {
      setCurrentTask(task)
      setScreen("first-task")
    }
  }

  const scrollToMilestone = (id: string) => {
    if (typeof document === "undefined") return
    document.getElementById(`ms-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="min-h-dvh lg:mx-auto lg:flex lg:max-w-6xl">
      {/* ───────── Mobile sticky header (hidden on desktop) ───────── */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3 px-5 pb-3 pt-12">
          <button
            onClick={() => setScreen("home")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-secondary/80"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-serif text-lg font-bold text-foreground">
              {currentQuest.title}
            </h1>
            <div className="mt-1 flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-streak" />
                <span className="text-xs font-semibold text-streak">
                  {currentQuest.streak}d
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">
                  {completedCount}/{tasks.length}
                </span>
              </div>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-accent">
            {currentQuest.mode}
          </span>
        </div>

        {/* Progress bar */}
        <div className="px-5 pb-3">
          <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Quest Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      {/* ───────── Desktop command rail (hidden on mobile) ───────── */}
      <aside className="sticky top-0 hidden h-dvh w-80 shrink-0 flex-col border-r border-border/60 bg-card/20 backdrop-blur-xl lg:flex">
        {/* Top: back + identity + single progress hero */}
        <div className="flex flex-col gap-6 px-7 pb-6 pt-7">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setScreen("home")}
              className="-ml-1.5 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
              aria-label="Back to hub"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {currentQuest.mode}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-primary">
              <MapIcon className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Quest Map</span>
            </div>
            <h1 className="font-display text-2xl font-bold leading-tight text-foreground">
              {currentQuest.title}
            </h1>
          </div>

          {/* Single hero metric: ring + one quiet caption line */}
          <div className="flex flex-col items-center gap-3 pt-1">
            <ProgressRing percent={progressPercent} />
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{completedCount}</span> of {tasks.length} tasks done
              </p>
              {currentQuest.streak > 0 && (
                <div className="flex items-center gap-1.5 text-streak">
                  <Flame className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">{currentQuest.streak}-day streak</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle: milestone navigator — clean list, no redundant bars */}
        <div className="min-h-0 flex-1 overflow-y-auto border-t border-border/60 px-4 py-5">
          <p className="px-3 pb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Milestones
          </p>
          <div className="flex flex-col gap-0.5">
            {milestoneSections.map((ms, idx) => {
              const stat = milestoneStats[idx]!
              const isComplete = stat.total > 0 && stat.done === stat.total
              const isActive = !isComplete && ms.tasks.some((t) => t.status === "active")
              return (
                <button
                  key={ms.id}
                  onClick={() => scrollToMilestone(ms.id)}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    isActive ? "bg-secondary/50" : "hover:bg-secondary/40"
                  }`}
                >
                  {/* Status indicator */}
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : isActive ? (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/60" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
                      </span>
                    ) : (
                      <Lock className="h-3 w-3 text-muted-foreground/40" />
                    )}
                  </span>

                  <span
                    className={`min-w-0 flex-1 truncate text-sm ${
                      isComplete
                        ? "text-muted-foreground"
                        : isActive
                          ? "font-medium text-foreground"
                          : "text-muted-foreground/50"
                    }`}
                  >
                    {ms.title.trim() !== "" ? ms.title : `Milestone ${ms.questNumber}`}
                  </span>

                  {/* Show the fraction only where it matters — the active milestone */}
                  {isActive && (
                    <span className="shrink-0 text-[10px] font-semibold tabular-nums text-accent">
                      {stat.done}/{stat.total}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Bottom: actions — quiet, secondary to the path itself */}
        <div className="flex items-center gap-2 border-t border-border/60 p-4">
          <button
            onClick={() => setScreen("first-task")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            <Plus className="h-4 w-4 text-primary" />
            Add task
          </button>
          <span className="h-5 w-px bg-border/60" />
          <button
            onClick={() => setScreen("add-habit-entry")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            <Repeat className="h-4 w-4 text-accent" />
            Add habit
          </button>
        </div>
      </aside>

      {/* ───────── Roadmap path lane ───────── */}
      <main className="relative min-w-0 flex-1">
        <div className="relative mx-auto w-full max-w-md overflow-x-hidden px-4 pb-32 pt-8 lg:pb-16 lg:pt-12">
          {/* SVG path connectors rendered behind nodes */}
          <svg
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
            style={{ pointerEvents: "none" }}
          >
            {connectors}
          </svg>

          {/* Nodes */}
          {milestoneSections.map((ms, msIdx) => (
            <div key={ms.id} id={`ms-${ms.id}`} className="scroll-mt-20">
              {milestoneSections.length > 1 && ms.title.trim() !== "" ? (
                <div className="mb-6 mt-4 first:mt-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">Milestone {ms.questNumber}</p>
                  <p className="mt-1 font-semibold leading-snug text-foreground">{ms.title}</p>
                </div>
              ) : null}
              {ms.tasks.map((task, ti) => {
                const i = milestoneStartIndexes[msIdx]! + ti
                const status = getNodeStatus(task)
                const xPercent = getNodeX(i)
                const isCheckpoint = (i + 1) % 4 === 0
                const prev = ti > 0 ? ms.tasks[ti - 1] : undefined
                const groupStart =
                  Boolean(task.parentTaskId) &&
                  (!prev?.parentTaskId || prev.parentTaskId !== task.parentTaskId)

                return (
              <div
                key={task.id}
                className="relative flex items-start"
                style={{
                  height: 140,
                  paddingLeft: `calc(${xPercent}% - 28px)`,
                }}
              >
                <div className="flex flex-col items-center">
                  {groupStart && task.parentTaskTitle ? (
                    <p className="mb-1 max-w-[160px] text-center text-[10px] font-semibold leading-tight text-muted-foreground">
                      {task.parentTaskTitle}
                    </p>
                  ) : null}
                  {/* Day label */}
                  <span className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Task {task.day}
                  </span>

                  {/* Node circle */}
                  <button
                    onClick={() => handleNodeTap(task)}
                    disabled={status === "locked"}
                    className={`relative flex items-center justify-center rounded-full border-[3px] transition-all ${
                      isCheckpoint ? "h-16 w-16" : "h-14 w-14"
                    } ${
                      status === "done"
                        ? "border-primary bg-primary/15"
                        : status === "active"
                          ? "animate-pulse-glow border-primary bg-primary shadow-lg shadow-primary/20 lg:hover:scale-105"
                          : "border-border/50 bg-secondary/40 opacity-50"
                    }`}
                    aria-label={`${task.title} - ${status}`}
                  >
                    {status === "done" ? (
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    ) : status === "active" ? (
                      <Play className="h-6 w-6 fill-primary-foreground text-primary-foreground" />
                    ) : isCheckpoint ? (
                      <Trophy className="h-5 w-5 text-muted-foreground/40" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground/40" />
                    )}

                    {/* XP badge */}
                    {status === "done" && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Zap className="h-3 w-3" />
                      </span>
                    )}
                  </button>

                  {/* Task title */}
                  <p
                    className={`mt-2 max-w-[130px] text-center text-[11px] font-medium leading-tight ${
                      status === "locked"
                        ? "text-muted-foreground/30"
                        : status === "done"
                          ? "text-muted-foreground"
                          : "text-foreground"
                    }`}
                  >
                    {task.title}
                  </p>

                  {/* Time estimate for active */}
                  {status === "active" && (
                    <span className="mt-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                      {task.timeEstimate}
                    </span>
                  )}
                </div>
              </div>
                )
              })}
            </div>
          ))}

          {/* End trophy */}
          <div
            className="relative flex items-start"
            style={{
              height: 120,
              paddingLeft: `calc(${getNodeX(tasks.length)}% - 34px)`,
            }}
          >
            <div className="flex flex-col items-center">
              <div className={`flex h-[68px] w-[68px] items-center justify-center rounded-full border-[3px] border-dashed ${progressPercent === 100 ? "border-accent bg-accent/10" : "border-border/30 bg-secondary/20"}`}>
                <Trophy className={`h-7 w-7 ${progressPercent === 100 ? "text-accent" : "text-muted-foreground/20"}`} />
              </div>
              <p className="mt-2 text-[11px] font-semibold text-muted-foreground">
                {progressPercent === 100 ? "Quest Complete!" : "Finish Line"}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ───────── Mobile bottom action bar (hidden on desktop) ───────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-md border-t border-border bg-background/95 px-5 py-4 backdrop-blur-md lg:hidden">
        <div className="flex gap-3">
          <button
            onClick={() => setScreen("first-task")}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-xs font-semibold text-foreground transition-all hover:bg-secondary/50 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 text-primary" />
            Add task
          </button>
          <button
            onClick={() => setScreen("add-habit-entry")}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-xs font-semibold text-foreground transition-all hover:bg-secondary/50 active:scale-[0.98]"
          >
            <Repeat className="h-4 w-4 text-accent" />
            Add habit
          </button>
        </div>
      </div>
    </div>
  )
}
