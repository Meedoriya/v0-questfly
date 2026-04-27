"use client"

import { useApp } from "@/lib/store"
import {
  Calendar,
  ArrowRightLeft,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Clock,
} from "lucide-react"

export function CasualSummaryScreen() {
  const { currentQuest, setScreen } = useApp()

  const quest = currentQuest
  const daysTaken = quest?.daysTaken || 18
  const totalTasks = quest?.totalTasks || 14
  const completedTasks = quest?.progress || 14
  const carriedOver = quest?.tasksCarriedOver || 4

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
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Casual Mode</p>
          <h1 className="font-serif text-xl font-bold text-foreground">{quest?.title || "Quest Summary"}</h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col px-6 pt-6">
        {/* Completed badge */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 mb-4">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">Completed</p>
          <h2 className="mt-1 font-serif text-2xl font-bold text-foreground">{quest?.title || "Quest"}</h2>
        </div>

        {/* Stats - facts only, no grade */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-quest/10">
              <Calendar className="h-5 w-5 text-quest" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Days Taken</p>
              <p className="text-xl font-bold text-foreground">{daysTaken}<span className="ml-1 text-sm font-normal text-muted-foreground">days</span></p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Tasks Completed</p>
              <p className="text-xl font-bold text-foreground">{completedTasks}<span className="text-sm font-normal text-muted-foreground"> / {totalTasks}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
              <ArrowRightLeft className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Tasks Carried Over</p>
              <p className="text-xl font-bold text-foreground">{carriedOver}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Average Pace</p>
              <p className="text-xl font-bold text-foreground">{(daysTaken / totalTasks).toFixed(1)}<span className="ml-1 text-sm font-normal text-muted-foreground">days/task</span></p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 pb-8">
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
