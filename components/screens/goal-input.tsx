"use client"

import { useState } from "react"
import { useApp } from "@/lib/store"
import { startOnboarding } from "@/lib/api/onboarding"
import { ApiError } from "@/lib/api/errors"
import { questionToAiMessage } from "@/lib/onboarding-messages"
import { GoalSummoningLoader } from "@/components/goal-summoning-loader"
import { Send, Sparkles } from "lucide-react"

const GOAL_CHIPS = [
  "Learn guitar",
  "Get fit",
  "Read more books",
  "Learn a new language",
  "Start meditating",
]

const GOAL_MIN = 3
const GOAL_MAX = 1000

export function GoalInputScreen() {
  const { setGoal, setOnboardingCampaignId, setChatMessages, setScreen } = useApp()
  const [inputValue, setInputValue] = useState("")
  const [inputFocused, setInputFocused] = useState(false)
  const [busy, setBusy] = useState(false)
  const [busyGoal, setBusyGoal] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function submitGoal(raw: string) {
    const goalText = raw.trim()
    if (goalText.length < GOAL_MIN || goalText.length > GOAL_MAX) {
      setError(`Цель: от ${GOAL_MIN} до ${GOAL_MAX} символов`)
      return
    }
    setError(null)
    setBusyGoal(goalText)
    setBusy(true)
    try {
      const data = await startOnboarding(goalText)
      setOnboardingCampaignId(data.campaign_id)
      setGoal(goalText)
      setChatMessages([questionToAiMessage(data.question, `ai-${data.campaign_id}-0`)])
      setScreen("ai-chat")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось начать онбординг")
    } finally {
      setBusy(false)
    }
  }

  if (busy) {
    return <GoalSummoningLoader goal={busyGoal} />
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 animate-pulse-glow">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>

        <h1 className="text-balance text-center font-serif text-3xl font-bold leading-tight tracking-tight text-foreground">
          What do you want to achieve?
        </h1>
        <p className="mt-3 text-balance text-center text-sm leading-relaxed text-muted-foreground">
          Tell me your goal and I&apos;ll craft a personalized quest with daily tasks to get you there.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {GOAL_CHIPS.map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={busy}
              onClick={() => void submitGoal(opt)}
              className="rounded-full border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary transition-all hover:bg-primary/10 active:scale-95 disabled:opacity-50"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border bg-background/95 px-4 pb-8 pt-4 backdrop-blur-lg">
        {error && <p className="mb-3 text-center text-sm text-destructive">{error}</p>}
        <div className="flex items-center gap-2">
          <div
            className={`flex flex-1 items-center rounded-2xl border bg-secondary px-4 py-3 transition-all ${
              inputFocused ? "border-primary/50 ring-2 ring-primary/20" : "border-border"
            }`}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && inputValue.trim()) {
                  void submitGoal(inputValue.trim())
                  setInputValue("")
                }
              }}
              placeholder="Or type your own goal..."
              disabled={busy}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (inputValue.trim()) {
                void submitGoal(inputValue.trim())
                setInputValue("")
              }
            }}
            disabled={!inputValue.trim() || busy}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:brightness-110 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
