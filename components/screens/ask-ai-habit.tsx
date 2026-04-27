"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/lib/store"
import type { Habit } from "@/lib/types"
import {
  ArrowLeft,
  Sparkles,
  Send,
  RefreshCw,
  PenLine,
  Flame,
  Shield,
  Check,
} from "lucide-react"

const AI_SUGGESTIONS = [
  {
    title: "Morning cold shower",
    frequency: "every-day" as const,
    characteristic: "Discipline",
    icon: "shield",
    timeOfDay: "06:30",
  },
  {
    title: "Read 30 minutes before bed",
    frequency: "every-day" as const,
    characteristic: "Focus",
    icon: "book",
    timeOfDay: "21:30",
  },
  {
    title: "Practice guitar for 20 min",
    frequency: "specific-days" as const,
    characteristic: "Creativity",
    icon: "music",
    frequencyDays: ["Mon", "Wed", "Fri"],
  },
  {
    title: "Run 5K outdoor",
    frequency: "x-times-week" as const,
    characteristic: "Strength",
    icon: "dumbbell",
    frequencyCount: 3,
  },
]

function getCharColor(_name: string) {
  return "text-primary bg-primary/10"
}

function getFreqLabel(f: string, days?: string[], count?: number) {
  if (f === "every-day") return "Every day"
  if (f === "specific-days" && days) return days.join(", ")
  if (f === "x-times-week" && count) return `${count}x per week`
  return f
}

export function AskAiHabitScreen() {
  const { setScreen, setPendingHabit, quests } = useApp()

  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestion, setSuggestion] = useState<(typeof AI_SUGGESTIONS)[number] | null>(null)
  const [showLinkSheet, setShowLinkSheet] = useState(false)
  const [linkedQuestId, setLinkedQuestId] = useState<string | undefined>(undefined)

  const generate = () => {
    if (!input.trim()) return
    setIsGenerating(true)
    setSuggestion(null)
    // Simulate AI generation
    setTimeout(() => {
      const idx = Math.floor(Math.random() * AI_SUGGESTIONS.length)
      setSuggestion(AI_SUGGESTIONS[idx])
      setIsGenerating(false)
    }, 1500)
  }

  const handleConfirm = () => {
    if (!suggestion) return
    const linkedQuest = quests.find((q) => q.id === linkedQuestId)
    const habit: Habit = {
      id: `h-${Date.now()}`,
      title: suggestion.title,
      completed: false,
      streak: 0,
      icon: suggestion.icon,
      characteristic: suggestion.characteristic,
      frequency: suggestion.frequency,
      frequencyDays: suggestion.frequencyDays,
      frequencyCount: suggestion.frequencyCount,
      timeOfDay: suggestion.timeOfDay,
      resetOnSkip: linkedQuest?.mode === "Rank" ? true : true,
      linkedQuestId,
    }
    setPendingHabit(habit)
    setScreen("habit-notification")
  }

  const handleEdit = () => {
    // Navigate to manual form -- user can tweak from there
    if (suggestion) {
      const habit: Habit = {
        id: `h-${Date.now()}`,
        title: suggestion.title,
        completed: false,
        streak: 0,
        icon: suggestion.icon,
        characteristic: suggestion.characteristic,
        frequency: suggestion.frequency,
        frequencyDays: suggestion.frequencyDays,
        frequencyCount: suggestion.frequencyCount,
        timeOfDay: suggestion.timeOfDay,
        resetOnSkip: true,
        linkedQuestId,
      }
      setPendingHabit(habit)
    }
    setScreen("create-habit-manual")
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-3 px-4 pb-4 pt-12">
        <button
          onClick={() => setScreen("add-habit-entry")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="font-serif text-xl font-bold text-foreground">Ask AI</h1>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-6 pt-2">
        {/* Input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Describe the habit you want
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()}
              placeholder="e.g. I want to get stronger..."
              className="flex-1 rounded-xl border border-border bg-card px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={generate}
              disabled={!input.trim() || isGenerating}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-40"
              aria-label="Generate"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Loading */}
        {isGenerating && (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <Sparkles className="h-7 w-7 animate-pulse text-accent" />
            </div>
            <p className="text-sm text-muted-foreground">Generating your habit...</p>
          </div>
        )}

        {/* Suggestion Card */}
        {suggestion && !isGenerating && (
          <div className="animate-float-up flex flex-col gap-4">
            <div className="rounded-2xl border border-primary/20 bg-card p-5">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-accent">AI Suggestion</span>
              </div>

              <h3 className="text-lg font-bold text-foreground">{suggestion.title}</h3>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getCharColor(suggestion.characteristic)}`}>
                  <Shield className="h-3 w-3" />
                  {suggestion.characteristic}
                </span>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {getFreqLabel(suggestion.frequency, suggestion.frequencyDays, suggestion.frequencyCount)}
                </span>
                {suggestion.timeOfDay && (
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {suggestion.timeOfDay}
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Flame className="h-3 w-3 text-streak" />
                <span>Streak starts at 0</span>
              </div>
            </div>

            {/* Link to Quest inline */}
            {!showLinkSheet ? (
              <button
                onClick={() => setShowLinkSheet(true)}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5 text-sm transition-colors hover:bg-secondary/50"
              >
                <span className="text-muted-foreground">
                  {linkedQuestId ? quests.find((q) => q.id === linkedQuestId)?.title : "Link to a quest? (optional)"}
                </span>
                <span className="text-xs text-primary">Select</span>
              </button>
            ) : (
              <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
                <button
                  onClick={() => { setLinkedQuestId(undefined); setShowLinkSheet(false) }}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all ${
                    !linkedQuestId ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary/50"
                  }`}
                >
                  Keep standalone
                  {!linkedQuestId && <Check className="h-4 w-4" />}
                </button>
                {quests.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => { setLinkedQuestId(q.id); setShowLinkSheet(false) }}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all ${
                      linkedQuestId === q.id ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{q.title}</span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-semibold uppercase text-muted-foreground">{q.mode}</span>
                    </div>
                    {linkedQuestId === q.id && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
              >
                Confirm
              </button>
              <button
                onClick={handleEdit}
                className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-4 text-sm font-semibold text-foreground transition-all hover:bg-secondary/50 active:scale-[0.98]"
              >
                <PenLine className="h-4 w-4" />
                Edit
              </button>
            </div>

            {/* Regenerate */}
            <button
              onClick={generate}
              className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <RefreshCw className="h-3 w-3" />
              Generate again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
