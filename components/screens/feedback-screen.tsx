"use client"

import { useEffect, useState } from "react"
import { useApp } from "@/lib/store"
import { submitQuestFeedback, type QuestSentiment } from "@/lib/api/quests"
import { requestNextQuest } from "@/lib/api/campaigns"
import { waitForNextQuestReady } from "@/lib/wait-for-next-quest"
import { ApiError } from "@/lib/api/errors"
import { RadarDiagram, getAxisIcon, getAxisColor } from "@/components/radar-diagram"
import type { AxisKey } from "@/lib/types"
import { Sparkles, Star, Trophy, Loader2 } from "lucide-react"

const AXIS_KEYS: AxisKey[] = [
  "health", "appearance", "environment", "finance", "career", "growth",
  "love", "family", "friends", "creativity", "lifestyle", "spirituality",
]

const HIGHLIGHTED_AXIS = AXIS_KEYS[Math.floor(Math.random() * AXIS_KEYS.length)]

const SENTIMENT_OPTIONS: { value: QuestSentiment; label: string }[] = [
  { value: "good", label: "Отлично" },
  { value: "ok", label: "Нормально" },
  { value: "bad", label: "Тяжело" },
]

export function FeedbackScreen() {
  const {
    earnedXp,
    aiInsight,
    currentQuest,
    userProgress,
    setScreen,
    activeCampaignId,
    syncCampaignFromApi,
    feedbackDraft,
    setFeedbackDraft,
    refreshCharacterFromApi,
  } = useApp()

  const [showContent, setShowContent] = useState(false)
  const [displayXp, setDisplayXp] = useState(0)
  const [showRadar, setShowRadar] = useState(false)
  const [sentiment, setSentiment] = useState<QuestSentiment | null>(null)
  const [comment, setComment] = useState(feedbackDraft)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setComment(feedbackDraft)
  }, [feedbackDraft])

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!showContent) return
    let current = 0
    const interval = setInterval(() => {
      current += 1
      if (current >= earnedXp) {
        clearInterval(interval)
        setDisplayXp(earnedXp)
        return
      }
      setDisplayXp(current)
    }, 30)
    return () => clearInterval(interval)
  }, [showContent, earnedXp])

  useEffect(() => {
    if (displayXp < earnedXp) return
    const timer = setTimeout(() => setShowRadar(true), 300)
    return () => clearTimeout(timer)
  }, [displayXp, earnedXp])

  const questProgress = currentQuest
    ? Math.min(100, Math.round((currentQuest.progress / Math.max(currentQuest.totalTasks, 1)) * 100))
    : 20

  const HighlightIcon = getAxisIcon(HIGHLIGHTED_AXIS)
  const highlightColor = getAxisColor(HIGHLIGHTED_AXIS)
  const highlightedChar = userProgress.characteristics.find((c) => c.key === HIGHLIGHTED_AXIS)

  async function handleContinue() {
    setError(null)

    if (!activeCampaignId || !currentQuest?.id) {
      setFeedbackDraft("")
      setScreen("paywall")
      return
    }

    if (!sentiment) {
      setError("Выберите, как прошёл квест")
      return
    }

    const questId = currentQuest.apiQuestId ?? currentQuest.id
    setBusy(true)
    try {
      try {
        await submitQuestFeedback(questId, {
          sentiment,
          comment: comment.trim() || undefined,
        })
      } catch (err) {
        const dup = err instanceof ApiError && (err.code === "CONFLICT" || err.code === "ALREADY_EXISTS")
        if (!dup) throw err
      }

      try {
        await waitForNextQuestReady(activeCampaignId, questId)
      } catch (err) {
        if (err instanceof ApiError && err.code === "TIMEOUT") {
          // Бекенд не успел сгенерировать сам — пробуем повторно запустить и поллим ещё раз.
          try {
            await requestNextQuest(activeCampaignId)
            await waitForNextQuestReady(activeCampaignId, questId)
          } catch (retryErr) {
            if (retryErr instanceof ApiError && retryErr.code === "FEEDBACK_REQUIRED") {
              setError("Нужен отзыв по квесту перед следующей вехой")
              return
            }
            if (retryErr instanceof ApiError && (retryErr.code === "NOT_FOUND" || retryErr.code === "BAD_REQUEST")) {
              await syncCampaignFromApi(activeCampaignId)
              refreshCharacterFromApi()
              setFeedbackDraft("")
              setScreen("home")
              return
            }
            throw retryErr
          }
        } else if (err instanceof ApiError && (err.code === "NOT_FOUND" || err.code === "BAD_REQUEST")) {
          await syncCampaignFromApi(activeCampaignId)
          refreshCharacterFromApi()
          setFeedbackDraft("")
          setScreen("home")
          return
        } else {
          throw err
        }
      }

      await syncCampaignFromApi(activeCampaignId)
      refreshCharacterFromApi()
      setFeedbackDraft("")
      setScreen("home")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось сохранить прогресс")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="relative animate-celebrate">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="h-12 w-12 text-primary" />
          </div>
          <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-streak">
            <Star className="h-4 w-4 text-accent-foreground" />
          </div>
        </div>

        {showContent && (
          <div className="flex flex-col items-center gap-1 animate-float-up">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-serif text-4xl font-bold text-primary">+{displayXp}</span>
              <span className="text-lg font-semibold text-primary">XP</span>
            </div>
          </div>
        )}

        {showRadar && (
          <div className="animate-float-up flex flex-col items-center gap-3">
            <RadarDiagram
              characteristics={userProgress.characteristics}
              size={240}
              highlightAxis={HIGHLIGHTED_AXIS}
              animated
            />
            {highlightedChar && (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 animate-bounce-in">
                <HighlightIcon className={`h-4 w-4 ${highlightColor}`} />
                <span className="text-sm font-semibold text-foreground">{highlightedChar.name}</span>
                <span className={`text-sm font-bold ${highlightColor}`}>+1</span>
                <span className="text-xs text-muted-foreground">Lv.{highlightedChar.current}</span>
              </div>
            )}
          </div>
        )}

        {showContent && (
          <div className="flex flex-col items-center gap-3 text-center animate-float-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="font-serif text-2xl font-bold text-foreground">Quest updated!</h2>
            {aiInsight && (
              <div className="rounded-xl bg-secondary/50 p-4">
                <p className="text-sm leading-relaxed text-muted-foreground">{aiInsight}</p>
              </div>
            )}
          </div>
        )}

        {activeCampaignId && currentQuest && (
          <div className="w-full space-y-3 animate-float-up" style={{ animationDelay: "0.25s" }}>
            <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Как прошёл квест?
            </p>
            <div className="flex gap-2">
              {SENTIMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={busy}
                  onClick={() => setSentiment(opt.value)}
                  className={`flex-1 rounded-xl border py-2.5 text-xs font-semibold transition-colors ${
                    sentiment === opt.value
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Комментарий (необязательно)"
              rows={2}
              disabled={busy}
              className="w-full resize-none rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        )}

        {showContent && (
          <div className="w-full animate-float-up" style={{ animationDelay: "0.3s" }}>
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Quest Progress</span>
              <span>{questProgress}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${questProgress}%` }} />
            </div>
          </div>
        )}

        {error && <p className="text-center text-sm text-destructive">{error}</p>}

        {showContent && (
          <div className="w-full animate-float-up" style={{ animationDelay: "0.4s" }}>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleContinue()}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              {busy ? "Сохранение…" : activeCampaignId && currentQuest ? "Продолжить" : "Continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
