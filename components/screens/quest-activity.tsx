"use client"

import { useMemo } from "react"
import { useApp } from "@/lib/store"
import type { QuestDay } from "@/lib/types"
import {
  ArrowLeft,
  Share2,
  CheckCircle2,
  Skull,
  Minus,
  CalendarDays,
} from "lucide-react"

function generateQuestDays(totalTasks: number, completedTasks: number): QuestDay[] {
  const days: QuestDay[] = []
  const totalDays = Math.max(totalTasks + 4, 21)
  let completed = 0
  let failed = 0
  const failTarget = totalTasks - completedTasks

  for (let i = 1; i <= totalDays; i++) {
    if (i <= totalTasks + failTarget) {
      if (completed < completedTasks && (Math.random() > 0.2 || failed >= failTarget)) {
        days.push({ day: i, status: "completed" })
        completed++
      } else if (failed < failTarget) {
        days.push({ day: i, status: "failed" })
        failed++
      } else {
        days.push({ day: i, status: "rest" })
      }
    } else {
      days.push({ day: i, status: i % 7 === 0 ? "rest" : "upcoming" })
    }
  }
  return days
}

const STATUS_STYLES: Record<string, { bg: string; icon?: React.ElementType; label: string }> = {
  completed: { bg: "bg-primary", icon: CheckCircle2, label: "Completed" },
  failed: { bg: "bg-destructive", icon: Skull, label: "Failed" },
  rest: { bg: "bg-secondary", icon: Minus, label: "Rest Day" },
  upcoming: { bg: "bg-muted", label: "Upcoming" },
}

export function QuestActivityScreen() {
  const { currentQuest, setScreen } = useApp()

  const quest = currentQuest
  const totalTasks = quest?.totalTasks || 14
  const completedTasks = quest?.progress || 12
  const days = useMemo(() => generateQuestDays(totalTasks, completedTasks), [totalTasks, completedTasks])

  const completedDays = days.filter((d) => d.status === "completed").length
  const failedDays = days.filter((d) => d.status === "failed").length
  const restDays = days.filter((d) => d.status === "rest").length

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: `${quest?.title || "Quest"} Activity`,
        text: `I completed ${completedDays} days of my "${quest?.title}" quest!`,
      }).catch(() => {})
    }
  }

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
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Quest Timeline</p>
          <h1 className="font-serif text-xl font-bold text-foreground">{quest?.title || "Activity"}</h1>
        </div>
        <button
          onClick={handleShare}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground hover:bg-secondary/80"
          aria-label="Share"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </header>

      <div className="flex flex-1 flex-col px-6 pt-4 pb-8">
        {/* Stats bar */}
        <div className="flex gap-3 mb-6">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Done</span>
            <span className="ml-auto text-sm font-bold text-foreground">{completedDays}</span>
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
            <div className="h-3 w-3 rounded-full bg-destructive" />
            <span className="text-xs text-muted-foreground">Failed</span>
            <span className="ml-auto text-sm font-bold text-foreground">{failedDays}</span>
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
            <div className="h-3 w-3 rounded-full bg-secondary" />
            <span className="text-xs text-muted-foreground">Rest</span>
            <span className="ml-auto text-sm font-bold text-foreground">{restDays}</span>
          </div>
        </div>

        {/* Day Grid */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">All Quest Days</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => {
              const style = STATUS_STYLES[day.status]
              const Icon = style.icon
              return (
                <div
                  key={day.day}
                  className={`relative flex h-11 w-full items-center justify-center rounded-lg ${style.bg} ${
                    day.status === "completed" ? "animate-stat-glow" : ""
                  }`}
                  title={`Day ${day.day}: ${style.label}`}
                >
                  {Icon ? (
                    <Icon className={`h-4 w-4 ${day.status === "completed" ? "text-primary-foreground" : "text-destructive-foreground"}`} />
                  ) : (
                    <span className={`text-[10px] font-medium ${day.status === "upcoming" ? "text-muted-foreground" : "text-secondary-foreground"}`}>
                      {day.day}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4">
          {Object.entries(STATUS_STYLES).map(([key, style]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`h-3 w-3 rounded-sm ${style.bg}`} />
              <span className="text-[10px] text-muted-foreground">{style.label}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-auto flex flex-col gap-3 pt-6">
          <button
            onClick={() => setScreen("characteristics-screen")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97]"
          >
            View Growth Stats
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
