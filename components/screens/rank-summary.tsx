"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/lib/store"
import {
  Sword,
  CheckCircle2,
  XCircle,
  Skull,
  ChevronRight,
  ArrowLeft,
} from "lucide-react"

const GRADE_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  S: { bg: "bg-accent/15", text: "text-accent", border: "border-accent/40", glow: "animate-boss-glow" },
  A: { bg: "bg-primary/15", text: "text-primary", border: "border-primary/40", glow: "animate-pulse-glow" },
  B: { bg: "bg-quest/15", text: "text-quest", border: "border-quest/40", glow: "" },
  C: { bg: "bg-muted", text: "text-muted-foreground", border: "border-border", glow: "" },
}

export function RankSummaryScreen() {
  const { currentQuest, setScreen } = useApp()
  const [showGrade, setShowGrade] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowGrade(true), 600)
    return () => clearTimeout(t)
  }, [])

  const quest = currentQuest
  const totalTasks = quest?.totalTasks || 14
  const completedTasks = quest?.progress || 12
  const failedTasks = quest?.failedTaskCount || totalTasks - completedTasks

  // Calculate grade
  const ratio = completedTasks / totalTasks
  let grade: "S" | "A" | "B" | "C" = "C"
  if (ratio >= 0.95) grade = "S"
  else if (ratio >= 0.8) grade = "A"
  else if (ratio >= 0.6) grade = "B"

  const gradeStyle = GRADE_COLORS[grade]

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 pt-12 pb-4">
        <button
          onClick={() => setScreen("home")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Rank Mode</p>
          <h1 className="font-serif text-xl font-bold text-foreground">{quest?.title || "Quest Summary"}</h1>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <Sword className="h-5 w-5 text-primary" />
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center px-6 pt-6">
        {/* Grade Badge */}
        <div className="relative mb-8">
          {showGrade ? (
            <div className={`flex h-36 w-36 items-center justify-center rounded-3xl border-2 ${gradeStyle.border} ${gradeStyle.bg} ${gradeStyle.glow} animate-grade-enter`}>
              <span className={`font-serif text-7xl font-black ${gradeStyle.text}`}>{grade}</span>
            </div>
          ) : (
            <div className="flex h-36 w-36 items-center justify-center rounded-3xl border-2 border-border bg-secondary">
              <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-muted-foreground animate-spin" />
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="w-full max-w-xs flex flex-col gap-3">
          {/* Completed */}
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Tasks Completed</p>
              <p className="text-xl font-bold text-foreground">{completedTasks}<span className="text-sm font-normal text-muted-foreground"> / {totalTasks}</span></p>
            </div>
          </div>

          {/* Failed */}
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Tasks Failed</p>
              <p className="text-xl font-bold text-foreground">{failedTasks}</p>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Completion Rate</p>
              <span className="text-sm font-bold text-foreground">{Math.round(ratio * 100)}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary animate-bar-fill"
                style={{ width: `${ratio * 100}%` }}
              />
            </div>
          </div>

          {/* Failed task note */}
          {failedTasks > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
              <Skull className="h-4 w-4 shrink-0 text-destructive" />
              <p className="text-xs text-destructive/80">
                {failedTasks} task{failedTasks > 1 ? "s" : ""} failed. In Rank mode, failed tasks cannot be recovered.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 w-full max-w-xs flex flex-col gap-3 pb-8">
          <button
            onClick={() => setScreen("ai-reflection")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97]"
          >
            View AI Reflection
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setScreen("quest-activity")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors"
          >
            Quest Activity Graph
          </button>
          <button
            onClick={() => setScreen("home")}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors text-center"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
