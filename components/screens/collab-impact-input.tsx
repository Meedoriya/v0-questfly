"use client"

import { useState } from "react"
import { useApp } from "@/lib/store"
import { recordDailyProgress } from "@/lib/api/joint-quests"
import { mapJointQuest } from "@/lib/mappers/joint-quest-mapper"
import { ApiError } from "@/lib/api/errors"
import {
  ArrowLeft,
  CheckCircle2,
  BarChart3,
  Zap,
  AlertCircle,
} from "lucide-react"

export function CollabImpactInputScreen() {
  const { setScreen, setLastImpactValue, currentTask, currentJointQuest, upsertJointQuest, setCurrentJointQuest } = useApp()
  const [value, setValue] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const placeholder = currentTask?.title?.toLowerCase().includes("read")
    ? "How many pages did you read?"
    : currentTask?.title?.toLowerCase().includes("run") || currentTask?.title?.toLowerCase().includes("exercise")
    ? "How many minutes did you work out?"
    : currentTask?.title?.toLowerCase().includes("write") || currentTask?.title?.toLowerCase().includes("word")
    ? "How many words did you write?"
    : "What did you accomplish? (e.g., a number)"

  async function submitProgress(impact: string) {
    if (!currentJointQuest) {
      setScreen("collab-friend-status")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const raw = await recordDailyProgress(currentJointQuest.id, impact ? { impact_value: impact } : {})
      const next = mapJointQuest(raw)
      if (next) {
        upsertJointQuest(next)
        setCurrentJointQuest(next)
      }
      setLastImpactValue(impact)
      setSubmitted(true)
      setTimeout(() => setScreen("collab-friend-status"), 1200)
    } catch (e) {
      if (e instanceof ApiError && e.code === "ALREADY_LOGGED_TODAY") {
        setError("You've already logged today's progress.")
      } else {
        setError(e instanceof Error ? e.message : "Couldn't log progress")
      }
    } finally {
      setBusy(false)
    }
  }

  const handleSubmit = () => void submitProgress(value)
  const handleSkip = () => void submitProgress("")

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 pb-4 pt-12">
        <button onClick={() => setScreen("home")} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary" aria-label="Back">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="font-serif text-xl font-bold text-foreground">Log Impact</h1>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
        {!submitted ? (
          <>
            {/* Icon */}
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
              <BarChart3 className="h-10 w-10 text-primary" />
            </div>

            {/* Title */}
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">Task Completed!</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Log your impact so AI can score your progress in the joint quest.
              </p>
            </div>

            {/* Task reference */}
            {currentTask && (
              <div className="w-full rounded-xl border border-border bg-card px-4 py-3">
                <p className="text-xs text-muted-foreground">Task completed</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">{currentTask.title}</p>
              </div>
            )}

            {/* Impact input */}
            <div className="w-full">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Impact Value (Optional)
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className="h-14 w-full rounded-xl border border-border bg-secondary px-4 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-center text-lg"
              />
            </div>

            {error && (
              <div className="flex w-full items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex w-full flex-col gap-3">
              <button
                onClick={handleSubmit}
                disabled={busy}
                className="w-full rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Saving…" : "Log Impact"}
              </button>
              <button
                onClick={handleSkip}
                disabled={busy}
                className="w-full py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                Skip for now
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 animate-bounce-in">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/15">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <p className="text-lg font-bold text-foreground">Impact Logged!</p>
            <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">{value}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
