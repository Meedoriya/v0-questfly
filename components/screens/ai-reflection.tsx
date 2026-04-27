"use client"

import { useState } from "react"
import { useApp } from "@/lib/store"
import {
  Sparkles,
  TrendingUp,
  Brain,
  Lightbulb,
  ChevronRight,
  ArrowLeft,
  Send,
} from "lucide-react"

const INSIGHT_CARDS = [
  {
    icon: TrendingUp,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    title: "Consistency Pattern",
    body: "You completed 85% of tasks on time. Your most productive days were Tuesday and Thursday. Consider scheduling important tasks on these days.",
  },
  {
    icon: Brain,
    color: "text-quest",
    bg: "bg-quest/10",
    border: "border-quest/20",
    title: "Focus Insight",
    body: "Tasks requiring deep focus took 30% longer than estimated. Breaking them into smaller sub-tasks could improve your flow state.",
  },
  {
    icon: Lightbulb,
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/20",
    title: "Growth Suggestion",
    body: "Your Strength and Creativity stats grew the most. To level up Discipline, try adding a daily habit like journaling or time-blocking.",
  },
]

export function AiReflectionScreen() {
  const { setScreen, currentQuest } = useApp()
  const [reflection, setReflection] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (reflection.trim()) {
      setSubmitted(true)
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
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">AI Insights</p>
          <h1 className="font-serif text-xl font-bold text-foreground">Reflection</h1>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
      </header>

      <div className="flex flex-1 flex-col px-6 pt-4 pb-8">
        {/* Insight Cards */}
        <div className="flex flex-col gap-3">
          {INSIGHT_CARDS.map((card, idx) => {
            const Icon = card.icon
            return (
              <div
                key={idx}
                className={`rounded-xl border ${card.border} bg-card p-5 animate-float-up`}
                style={{ animationDelay: `${idx * 0.15}s` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.bg}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{card.body}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Reflection Input */}
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your Thoughts (optional)
          </p>
          {!submitted ? (
            <div className="relative">
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="What did you learn from this quest? Any thoughts on your journey..."
                className="w-full resize-none rounded-xl border border-border bg-card p-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                rows={4}
              />
              <button
                onClick={handleSubmit}
                disabled={!reflection.trim()}
                className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all disabled:opacity-30 hover:bg-primary/90"
                aria-label="Submit reflection"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 animate-float-up">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary">Reflection Saved</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{reflection}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex flex-col gap-3 pt-6">
          <button
            onClick={() => setScreen("characteristics-screen")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97]"
          >
            View Growth Stats
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setScreen("next-quest")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors"
          >
            {"What's Next?"}
          </button>
        </div>
      </div>
    </div>
  )
}
