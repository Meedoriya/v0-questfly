"use client"

import { useState } from "react"
import { useApp } from "@/lib/store"
import { completeSubtask } from "@/lib/api/subtasks"
import { completeQuest } from "@/lib/api/quests"
import { ApiError } from "@/lib/api/errors"
import { CheckCircle2, Clock } from "lucide-react"

function isQuestFullyDone(quest: { tasks: { status: string }[] }): boolean {
  return quest.tasks.length > 0 && quest.tasks.every((t) => t.status === "done")
}

export function TaskWaitingScreen() {
  const {
    currentTask,
    completeTask,
    setEarnedXp,
    refreshCharacterFromApi,
    setAiInsight,
    setScreen,
    activeCampaignId,
    syncCampaignFromApi,
    setFeedbackDraft,
  } = useApp()
  const [reflection, setReflection] = useState("")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!currentTask) return null

  async function handleComplete() {
    const task = currentTask
    if (!task) return
    setError(null)
    setBusy(true)
    try {
      const subId = task.apiSubtaskId || task.id
      const res = await completeSubtask(subId)
      const xpEarned = typeof res.xp_awarded === "number" ? res.xp_awarded : 25
      completeTask(task.id, note || undefined)
      setEarnedXp(xpEarned)
      refreshCharacterFromApi()
      setAiInsight(
        "Great start! Consistency is key. Research shows that regular practice, even in small doses, leads to exponential growth over time.",
      )

      const draft = [reflection.trim(), note.trim()].filter(Boolean).join("\n\n")

      if (!activeCampaignId) {
        setFeedbackDraft(draft)
        setScreen("feedback")
        return
      }

      const hydrated = await syncCampaignFromApi(activeCampaignId)
      const q = hydrated.currentQuest
      const done = isQuestFullyDone(q)

      if (done) {
        try {
          await completeQuest(q.id)
        } catch (err) {
          const ignorable =
            err instanceof ApiError && (err.code === "CONFLICT" || err.code === "ALREADY_EXISTS")
          if (!ignorable) {
            setError(err instanceof ApiError ? err.message : "Не удалось завершить квест")
            return
          }
        }
        await syncCampaignFromApi(activeCampaignId)
        refreshCharacterFromApi()
        setFeedbackDraft(draft)
        setScreen("feedback")
      } else {
        setScreen("quest-roadmap")
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось отметить задачу")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-3 px-6 pb-2 pt-12">
        <div className="flex flex-col">
          <span className="text-lg font-bold text-foreground">Day {currentTask.day}</span>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-6 pb-32 pt-6">
        <div>
          <h2 className="font-serif text-xl font-bold text-foreground text-balance">
            {currentTask.title}
          </h2>
          <div className="mt-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-streak" />
            <span className="text-sm text-muted-foreground">In progress...</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="reflection" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              How did it go?
            </label>
            <textarea
              id="reflection"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label htmlFor="note" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Note (optional)
            </label>
            <input
              id="note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any additional thoughts..."
              className="h-12 w-full rounded-xl border border-border bg-secondary px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="px-6 text-center text-sm text-destructive">{error}</p>
      )}

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-lg px-6 pb-8 pt-4">
        <button
          type="button"
          onClick={() => void handleComplete()}
          disabled={busy}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
        >
          <CheckCircle2 className="h-5 w-5" />
          <span>{busy ? "…" : "Done"}</span>
        </button>
      </div>
    </div>
  )
}
