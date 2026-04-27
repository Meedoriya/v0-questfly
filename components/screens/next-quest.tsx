"use client"

import { useState } from "react"
import { useApp } from "@/lib/store"
import {
  Sparkles,
  Sword,
  Zap,
  Clock,
  ArrowLeft,
  Play,
  Pause,
  ChevronRight,
} from "lucide-react"
import { getAxisIcon, getAxisColor, getAxisHsl } from "@/components/radar-diagram"
import type { AxisKey } from "@/lib/types"

const SUGGESTED_QUEST = {
  title: "Master Deep Work",
  description:
    "Train your focus muscle with 14 days of structured deep work sessions. Build unshakeable concentration and ship your most important projects.",
  duration: "14 days",
  xpReward: 350,
  characteristics: ["career", "growth"] as AxisKey[],
  difficulty: "Intermediate",
  mode: "Rank" as const,
}

export function NextQuestScreen() {
  const { setScreen, togglePause } = useApp()
  const [hoveredAction, setHoveredAction] = useState<string | null>(null)

  const handleStartQuest = () => {
    setScreen("goal-input")
  }

  const handleTakeBreak = () => {
    togglePause()
    setScreen("home")
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
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">AI Suggested</p>
          <h1 className="font-serif text-xl font-bold text-foreground">Next Quest</h1>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
      </header>

      <div className="flex flex-1 flex-col px-6 pt-4 pb-8">
        {/* AI Explanation */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 animate-float-up">
          <Sparkles className="h-5 w-5 shrink-0 text-primary mt-0.5" />
          <p className="text-xs leading-relaxed text-secondary-foreground">
            Based on your growth patterns, your Focus and Discipline stats could use a boost. This quest is designed to target both while building on your existing strengths.
          </p>
        </div>

        {/* Quest Card */}
        <div className="rounded-2xl border-2 border-primary/30 bg-card overflow-hidden animate-float-up" style={{ animationDelay: "0.15s" }}>
          {/* Card Header */}
          <div className="bg-primary/5 px-5 py-4 border-b border-primary/10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                <Sword className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-foreground">{SUGGESTED_QUEST.title}</h2>
                <span className="inline-block rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-primary mt-1">
                  {SUGGESTED_QUEST.mode}
                </span>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-5 flex flex-col gap-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{SUGGESTED_QUEST.description}</p>

            {/* Meta */}
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">{SUGGESTED_QUEST.duration}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">{SUGGESTED_QUEST.xpReward} XP</span>
              </div>
            </div>

            {/* Characteristics targeted */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Targets
              </p>
              <div className="flex gap-2">
                {SUGGESTED_QUEST.characteristics.map((c) => {
                  const Icon = getAxisIcon(c)
                  const color = getAxisColor(c)
                  const hsl = getAxisHsl(c)
                  return (
                    <div key={c} className="flex items-center gap-1.5 rounded-lg px-3 py-2" style={{ backgroundColor: `hsl(${hsl} / 0.1)` }}>
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                      <span className={`text-xs font-medium capitalize ${color}`}>{c}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex flex-col gap-3 pt-8">
          <button
            onClick={handleStartQuest}
            onPointerEnter={() => setHoveredAction("start")}
            onPointerLeave={() => setHoveredAction(null)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97]"
          >
            <Play className="h-4 w-4" />
            Start Quest
            <ChevronRight className={`h-4 w-4 transition-transform ${hoveredAction === "start" ? "translate-x-0.5" : ""}`} />
          </button>
          <button
            onClick={handleTakeBreak}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors"
          >
            <Pause className="h-4 w-4 text-muted-foreground" />
            Take a Break
          </button>
        </div>
      </div>
    </div>
  )
}
