"use client"

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
} from "lucide-react"
import type { Task } from "@/lib/types"

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

  const tasks = currentQuest.tasks
  const completedCount = tasks.filter((t) => t.status === "done").length
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  const handleNodeTap = (task: Task) => {
    if (task.status === "active") {
      setCurrentTask(task)
      setScreen("first-task")
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md">
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

      {/* Roadmap Path */}
      <div className="relative flex-1 overflow-x-hidden px-4 pb-32 pt-8">
        {/* SVG path connectors rendered behind nodes */}
        <svg
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          style={{ pointerEvents: "none" }}
        >
          {tasks.map((task, i) => {
            if (i === tasks.length - 1) return null
            const x1 = getNodeX(i)
            const x2 = getNodeX(i + 1)
            const y1 = i * 140 + 48 + 32
            const y2 = (i + 1) * 140 + 32
            const isCompleted = getNodeStatus(task) === "done"

            return (
              <path
                key={`conn-${task.id}`}
                d={`M ${x1}% ${y1} C ${x1}% ${y1 + 50}, ${x2}% ${y2 - 50}, ${x2}% ${y2}`}
                stroke={isCompleted ? "hsl(var(--primary))" : "hsl(var(--border))"}
                strokeWidth={isCompleted ? 3 : 2}
                strokeDasharray={isCompleted ? "none" : "8 5"}
                fill="none"
                strokeLinecap="round"
              />
            )
          })}
        </svg>

        {/* Nodes */}
        {tasks.map((task, i) => {
          const status = getNodeStatus(task)
          const xPercent = getNodeX(i)
          const isCheckpoint = (i + 1) % 4 === 0

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
                {/* Day label */}
                <span className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Day {task.day}
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
                        ? "animate-pulse-glow border-primary bg-primary shadow-lg shadow-primary/20"
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

      {/* Bottom action buttons */}
      <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t border-border bg-background/95 px-5 py-4 backdrop-blur-md">
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
