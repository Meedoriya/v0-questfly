"use client"

import { useEffect, useState } from "react"
import { useApp } from "@/lib/store"
import { useAuth } from "@/components/auth-provider"
import { acceptJointQuest, declineJointQuest, getJointQuest } from "@/lib/api/joint-quests"
import { mapJointQuest } from "@/lib/mappers/joint-quest-mapper"
import { daysLeftFromDeadline, findOpponent, findPlayerByUserId, formatDeadline } from "@/lib/joint-quest-utils"
import { getInitial } from "@/lib/friend-feed"
import { ApiError } from "@/lib/api/errors"
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Sword,
  Users,
  X,
  Zap,
} from "lucide-react"

export function CollabInviteScreen() {
  const { setScreen, jointQuests, currentJointQuest, setCurrentJointQuest, upsertJointQuest } = useApp()
  const { user } = useAuth()
  const meId = user?.userId ?? ""

  const [decided, setDecided] = useState<"accepted" | "declined" | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Источник: currentJointQuest если выбран; иначе первый pending_accept где я — invitee.
  const inviteQuest =
    currentJointQuest ?? jointQuests.find((q) => q.status === "pending_accept" && findPlayerByUserId(q, meId)?.role === "invitee") ?? null

  // Перетянуть свежий snapshot, если ещё не финализирован.
  useEffect(() => {
    let cancelled = false
    if (!inviteQuest) return
    void (async () => {
      try {
        const raw = await getJointQuest(inviteQuest.id)
        const next = mapJointQuest(raw)
        if (!cancelled && next) {
          setCurrentJointQuest(next)
          upsertJointQuest(next)
        }
      } catch {
        /* офлайн — рендерим то что есть */
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!inviteQuest) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-muted-foreground">No invite found</p>
      </div>
    )
  }

  const me = findPlayerByUserId(inviteQuest, meId)
  const inviter = findOpponent(inviteQuest, meId) ?? inviteQuest.players[0]
  const inviterName = inviter?.name || "A friend"
  const meName = me?.name || "You"
  const daysLeft = daysLeftFromDeadline(inviteQuest.deadline)

  async function handleAccept() {
    if (!inviteQuest || busy) return
    setBusy(true)
    setError(null)
    try {
      const raw = await acceptJointQuest(inviteQuest.id)
      const next = mapJointQuest(raw)
      if (next) {
        setCurrentJointQuest(next)
        upsertJointQuest(next)
      }
      setDecided("accepted")
      setTimeout(() => setScreen("home"), 1200)
    } catch (e) {
      handleApiError(e, "Couldn't accept the invite")
    } finally {
      setBusy(false)
    }
  }

  async function handleDecline() {
    if (!inviteQuest || busy) return
    setBusy(true)
    setError(null)
    try {
      const raw = await declineJointQuest(inviteQuest.id)
      const next = mapJointQuest(raw)
      if (next) upsertJointQuest(next)
      setCurrentJointQuest(null)
      setDecided("declined")
      setTimeout(() => setScreen("home"), 1000)
    } catch (e) {
      handleApiError(e, "Couldn't decline the invite")
    } finally {
      setBusy(false)
    }
  }

  function handleApiError(e: unknown, fallback: string) {
    if (e instanceof ApiError) {
      setError(e.message || fallback)
    } else {
      setError(e instanceof Error ? e.message : fallback)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center gap-3 px-6 pb-4 pt-12">
        <button onClick={() => setScreen("home")} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary" aria-label="Back">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="font-serif text-xl font-bold text-foreground">Quest Invite</h1>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-6 pb-32">
        {/* From badge */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-quest/15 text-xs font-bold text-quest">
            {inviter?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={inviter.avatarUrl} alt={inviterName} className="h-full w-full object-cover" />
            ) : (
              getInitial(inviterName)
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{inviterName}</span> invited you
          </p>
        </div>

        {/* Quest details */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="bg-gradient-to-r from-primary/10 to-quest/10 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-card/80 backdrop-blur">
                <Sword className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{inviteQuest.title}</h2>
                <div className="mt-0.5 flex items-center gap-2">
                  <Users className="h-3 w-3 text-quest" />
                  <span className="text-xs text-quest font-medium">Joint Quest</span>
                </div>
              </div>
            </div>
            {inviteQuest.description && (
              <p className="text-sm leading-relaxed text-secondary-foreground">{inviteQuest.description}</p>
            )}
          </div>

          <div className="flex divide-x divide-border border-t border-border">
            <div className="flex flex-1 items-center gap-2 p-4">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-semibold text-foreground">{formatDeadline(inviteQuest.deadline)}</p>
                <p className="text-[10px] text-muted-foreground">{Math.max(0, daysLeft)} days left</p>
              </div>
            </div>
            <div className="flex flex-1 items-center gap-2 p-4">
              <Zap className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs font-semibold text-foreground">{inviteQuest.totalTasks} tasks</p>
                <p className="text-[10px] text-muted-foreground">Rank Mode</p>
              </div>
            </div>
          </div>
        </div>

        {/* Roadmaps */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI-Generated Roadmaps</h3>
          <div className="flex gap-3">
            {[
              { player: inviter, name: inviterName, accent: "primary" },
              { player: me, name: meName, accent: "quest" },
            ].map(({ player, name, accent }, i) =>
              player ? (
                <div key={i} className={`flex-1 rounded-xl border border-${accent}/20 bg-${accent}/5 p-4`}>
                  <div className="mb-3 flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-${accent}/15 text-xs font-bold text-${accent}`}>
                      {player.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={player.avatarUrl} alt={name} className="h-full w-full object-cover" />
                      ) : (
                        getInitial(name)
                      )}
                    </div>
                    <span className="text-xs font-semibold text-foreground">{name}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {player.roadmapPreview.slice(0, 4).map((step, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full bg-${accent}/10 text-[9px] font-bold text-${accent}`}>
                          {j + 1}
                        </div>
                        <span className="text-[11px] text-secondary-foreground">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null,
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {decided && (
          <div className={`flex items-center justify-center gap-2 rounded-xl p-4 animate-bounce-in ${
            decided === "accepted" ? "bg-primary/10 border border-primary/30" : "bg-secondary border border-border"
          }`}>
            {decided === "accepted" ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-primary">Quest accepted! Redirecting…</span>
              </>
            ) : (
              <>
                <X className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-semibold text-muted-foreground">Invite declined</span>
              </>
            )}
          </div>
        )}
      </div>

      {!decided && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 px-6 pb-8 pt-4 backdrop-blur-lg">
          <div className="mx-auto flex max-w-md gap-3">
            <button
              onClick={handleDecline}
              disabled={busy}
              className="flex-1 rounded-2xl border border-border bg-secondary py-4 text-sm font-bold text-foreground transition-all hover:bg-secondary/80 active:scale-[0.98] disabled:opacity-50"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={busy}
              className="flex-1 rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
            >
              {busy ? "…" : "Accept"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
