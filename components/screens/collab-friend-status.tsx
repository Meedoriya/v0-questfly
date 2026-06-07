"use client"

import { useEffect, useState } from "react"
import { useApp } from "@/lib/store"
import { useAuth } from "@/components/auth-provider"
import { encourageJointQuestPlayer, getJointQuest } from "@/lib/api/joint-quests"
import { mapJointQuest } from "@/lib/mappers/joint-quest-mapper"
import { findOpponent, findPlayerByUserId } from "@/lib/joint-quest-utils"
import { getInitial } from "@/lib/friend-feed"
import { ApiError } from "@/lib/api/errors"
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock,
  Flame,
  Heart,
  Map,
  Zap,
} from "lucide-react"

export function CollabFriendStatusScreen() {
  const { setScreen, currentJointQuest, setCurrentJointQuest, upsertJointQuest } = useApp()
  const { user } = useAuth()
  const meId = user?.userId ?? ""

  const [encouraged, setEncouraged] = useState(false)
  const [encourageError, setEncourageError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Свежий snapshot, чтобы видеть completed_today обоих после возврата с impact-input.
  useEffect(() => {
    let cancelled = false
    if (!currentJointQuest) return
    void (async () => {
      try {
        const raw = await getJointQuest(currentJointQuest.id)
        const next = mapJointQuest(raw)
        if (!cancelled && next) {
          setCurrentJointQuest(next)
          upsertJointQuest(next)
        }
      } catch {
        /* офлайн — рисуем то что есть */
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const quest = currentJointQuest
  if (!quest) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <header className="flex items-center gap-3 px-6 pb-4 pt-12">
          <button onClick={() => setScreen("home")} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary" aria-label="Back">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">No joint quest active</p>
        </div>
      </div>
    )
  }

  const me = findPlayerByUserId(quest, meId) ?? quest.players[0]
  const friend = findOpponent(quest, meId) ?? quest.players[1]

  if (!me || !friend) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <header className="flex items-center gap-3 px-6 pb-4 pt-12">
          <button onClick={() => setScreen("home")} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary" aria-label="Back">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
        </header>
        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <p className="text-sm text-muted-foreground">Waiting for your partner to accept the invite.</p>
        </div>
      </div>
    )
  }

  if (quest.status === "pending_accept") {
    const meName = me.name || "You"
    const friendNameEarly = friend.name || "Friend"
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-60"
          style={{ background: "radial-gradient(60% 100% at 50% 0%, hsl(var(--accent) / 0.10), transparent 70%)" }}
        />
        <header className="relative flex items-center gap-3 px-6 pb-4 pt-12">
          <button onClick={() => setScreen("home")} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary" aria-label="Back">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="font-serif text-xl font-bold text-foreground">Joint Quest</h1>
            {quest.title && <p className="text-[11px] text-muted-foreground">{quest.title}</p>}
          </div>
        </header>

        <div className="relative flex flex-1 flex-col gap-5 px-6 pb-8">
          {/* Pending invite banner */}
          <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
              <Clock className="h-4.5 w-4.5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Invite sent</p>
              <p className="text-xs text-muted-foreground">
                Waiting for <span className="font-medium text-foreground">{friendNameEarly}</span> to accept
              </p>
            </div>
          </div>

          {/* Players */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { player: me, name: meName, label: "You", color: "bg-primary/15 text-primary", badge: "Ready" },
              { player: friend, name: friendNameEarly, label: "Partner", color: "bg-secondary text-muted-foreground", badge: "Pending" },
            ].map(({ player, name, label, color, badge }) => (
              <div key={label} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4">
                <div className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-base font-bold ${color}`}>
                  {player.avatarUrl
                    ? <img src={player.avatarUrl} alt={name} className="h-full w-full object-cover" /> // eslint-disable-line @next/next/no-img-element
                    : getInitial(name)}
                </div>
                <p className="text-xs font-semibold text-foreground">{name}</p>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  badge === "Ready" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                }`}>{badge}</span>
              </div>
            ))}
          </div>

          {/* Roadmap teaser */}
          {me.roadmapPreview.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Your roadmap preview</p>
              <div className="flex flex-col gap-2">
                {me.roadmapPreview.slice(0, 3).map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-muted-foreground">
                      {i + 1}
                    </div>
                    <p className="text-[11px] leading-snug text-muted-foreground">{step}</p>
                  </div>
                ))}
                {me.roadmapPreview.length > 3 && (
                  <p className="pl-7 text-[10px] text-muted-foreground/60">+{me.roadmapPreview.length - 3} more steps…</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-8">
          <button
            onClick={() => setScreen("home")}
            className="w-full rounded-2xl border border-border bg-card py-4 text-sm font-bold text-foreground transition-all hover:bg-secondary/60 active:scale-[0.98]"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const meName = me.name || "You"
  const friendName = friend.name || "Friend"
  const friendCompleted = friend.completedToday
  const myImpact = me.todayImpactValue

  const encourageDisabled = encouraged || friendCompleted || busy || quest.status !== "active"

  async function handleEncourage() {
    if (encourageDisabled || !friend || !quest) return
    setBusy(true)
    setEncourageError(null)
    try {
      await encourageJointQuestPlayer(quest.id, friend.userId)
      setEncouraged(true)
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === "ALREADY_ENCOURAGED_TODAY") {
          setEncouraged(true)
        } else if (e.code === "ALREADY_COMPLETED") {
          setEncourageError("Your partner already finished today.")
        } else {
          setEncourageError(e.message || "Couldn't send encouragement")
        }
      } else {
        setEncourageError(e instanceof Error ? e.message : "Couldn't send encouragement")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center gap-3 px-6 pb-4 pt-12">
        <button onClick={() => setScreen("home")} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary" aria-label="Back">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="font-serif text-xl font-bold text-foreground">{"Partner's"} Status</h1>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-6 pb-8">
        {/* You today */}
        <div className={`rounded-2xl border p-5 ${me.completedToday ? "border-primary/20 bg-primary/5" : "border-border bg-card"}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-sm font-bold text-primary">
              {me.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={me.avatarUrl} alt={meName} className="h-full w-full object-cover" />
              ) : (
                getInitial(meName)
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{meName}</p>
              {me.completedToday ? (
                <p className="text-xs text-primary">Completed today</p>
              ) : (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Not completed yet</p>
                </div>
              )}
            </div>
            {me.completedToday && <CheckCircle2 className="ml-auto h-5 w-5 text-primary" />}
          </div>
          {myImpact && (
            <div className="flex items-center gap-2 rounded-lg bg-card px-3 py-2">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">Impact:</span>
              <span className="text-xs font-bold text-foreground">{myImpact}</span>
            </div>
          )}
        </div>

        {/* Friend today */}
        <div className={`rounded-2xl border p-5 ${friendCompleted ? "border-quest/20 bg-quest/5" : "border-border bg-card"}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-sm font-bold ${friendCompleted ? "bg-quest/15 text-quest" : "bg-secondary text-foreground"}`}>
              {friend.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={friend.avatarUrl} alt={friendName} className="h-full w-full object-cover" />
              ) : (
                getInitial(friendName)
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{friendName}</p>
              {friendCompleted ? (
                <p className="text-xs text-quest">Completed today</p>
              ) : (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Not completed yet</p>
                </div>
              )}
            </div>
            {friendCompleted && <CheckCircle2 className="ml-auto h-5 w-5 text-quest" />}
          </div>

          {friendCompleted ? (
            friend.todayImpactValue && (
              <div className="flex items-center gap-2 rounded-lg bg-card px-3 py-2">
                <BarChart3 className="h-3.5 w-3.5 text-quest" />
                <span className="text-xs text-muted-foreground">Impact:</span>
                <span className="text-xs font-bold text-foreground">{friend.todayImpactValue}</span>
              </div>
            )
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleEncourage}
                disabled={encourageDisabled}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
                  encouraged
                    ? "bg-accent/10 text-accent border border-accent/30 cursor-default"
                    : "bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.98]"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <Heart className={`h-4 w-4 ${encouraged ? "fill-accent" : ""}`} />
                {encouraged ? "Encouragement sent!" : busy ? "Sending…" : "Encourage"}
              </button>
              {encourageError && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{encourageError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quest Progress</h3>
          <div className="flex gap-4">
            {[
              { p: me, name: meName, color: "bg-primary", textColor: "text-primary", initialBg: "bg-primary/10" },
              { p: friend, name: friendName, color: "bg-quest", textColor: "text-quest", initialBg: "bg-quest/10" },
            ].map((row, i) => (
              <div key={i} className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`flex h-6 w-6 items-center justify-center overflow-hidden rounded-full ${row.initialBg} text-[10px] font-bold ${row.textColor}`}>
                    {row.p.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.p.avatarUrl} alt={row.name} className="h-full w-full object-cover" />
                    ) : (
                      getInitial(row.name)
                    )}
                  </div>
                  <span className="text-xs text-foreground">{row.name}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full ${row.color} transition-all`}
                    style={{ width: `${row.p.totalTasks > 0 ? (row.p.progress / row.p.totalTasks) * 100 : 0}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{row.p.progress}/{row.p.totalTasks}</span>
                  <div className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-streak" />
                    <span className="text-[10px] font-bold text-streak">{row.p.longestStreak}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Log Today's Progress (only when active and not yet logged) */}
        {quest.status === "active" && !me.completedToday && (
          <button
            onClick={() => setScreen("collab-impact-input")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-[0_0_24px_-4px] shadow-primary/40 transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            <Zap className="h-4 w-4" />
            Log Today&apos;s Progress
          </button>
        )}

        {/* View Roadmap */}
        <button
          onClick={() => setScreen("collab-roadmap")}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/60"
        >
          <Map className="h-4 w-4 text-muted-foreground" />
          View Roadmap
        </button>

        {/* Rank points (live, до финализации = 0) */}
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
            <Zap className="mx-auto h-5 w-5 text-primary" />
            <p className="mt-1 text-xl font-bold text-foreground">{me.rankPoints}</p>
            <p className="text-[10px] text-muted-foreground">Your Rank Pts</p>
          </div>
          <div className="flex-1 rounded-xl border border-quest/20 bg-quest/5 p-4 text-center">
            <Zap className="mx-auto h-5 w-5 text-quest" />
            <p className="mt-1 text-xl font-bold text-foreground">{friend.rankPoints}</p>
            <p className="text-[10px] text-muted-foreground">{friendName} Rank Pts</p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8">
        <button
          onClick={() => setScreen("home")}
          className="w-full rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          Back to Home
        </button>
      </div>
    </div>
  )
}
