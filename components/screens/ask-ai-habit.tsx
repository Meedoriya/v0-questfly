"use client"

import { useState } from "react"
import { useApp } from "@/lib/store"
import { aiSuggestRoutines } from "@/lib/api/routines"
import { aiSuggestionToHabitDraft } from "@/lib/mappers/routine-mapper"
import { axisLabel } from "@/lib/axes"
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
  AlertCircle,
} from "lucide-react"

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
  const [suggestions, setSuggestions] = useState<Habit[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showLinkSheet, setShowLinkSheet] = useState(false)
  const [linkedQuestId, setLinkedQuestId] = useState<string | undefined>(undefined)

  const generate = () => {
    if (!input.trim() || isGenerating) return
    void (async () => {
      setIsGenerating(true)
      setError(null)
      setSuggestions([])
      try {
        const { suggestions: raw } = await aiSuggestRoutines(input.trim())
        const drafts = (Array.isArray(raw) ? raw : [])
          .slice(0, 3)
          .map((s, i) => aiSuggestionToHabitDraft(s, i))
          .filter((h) => h.title)
        if (drafts.length === 0) {
          setError("AI didn't return any suggestions. Try rephrasing your goal.")
        } else {
          setSuggestions(drafts)
          setSelectedIdx(0)
        }
      } catch {
        setError("Couldn't reach the AI service. Check your connection and try again.")
      } finally {
        setIsGenerating(false)
      }
    })()
  }

  const buildHabit = (base: Habit): Habit => {
    const linkedQuest = quests.find((q) => q.id === linkedQuestId)
    return {
      ...base,
      resetOnSkip: linkedQuest?.mode === "Rank" ? true : base.resetOnSkip,
      linkedQuestId,
    }
  }

  const handleConfirm = () => {
    const base = suggestions[selectedIdx]
    if (!base) return
    setPendingHabit(buildHabit(base))
    setScreen("habit-notification")
  }

  const handleEdit = () => {
    const base = suggestions[selectedIdx]
    if (base) setPendingHabit(buildHabit(base))
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

      <div className="flex flex-1 flex-col gap-6 px-6 pt-2 pb-10">
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

        {/* Error */}
        {error && !isGenerating && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && !isGenerating && (
          <div className="animate-float-up flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-accent">
                AI Suggestions
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {suggestions.map((s, i) => {
                const isSelected = i === selectedIdx
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedIdx(i)}
                    className={`rounded-2xl border p-4 text-left transition-all active:scale-[0.99] ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-secondary/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-bold text-foreground">
                        {s.emoji ? `${s.emoji} ` : ""}
                        {s.title}
                      </h3>
                      {isSelected && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {s.characteristic && (
                        <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getCharColor(s.characteristic)}`}>
                          <Shield className="h-3 w-3" />
                          {axisLabel(s.characteristic)}
                        </span>
                      )}
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {getFreqLabel(s.frequency, s.frequencyDays, s.frequencyCount)}
                      </span>
                      {s.reminderEnabled && s.timeOfDay && (
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                          {s.timeOfDay}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Flame className="h-3 w-3 text-streak" />
                      <span>Streak starts at 0</span>
                    </div>
                  </button>
                )
              })}
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
