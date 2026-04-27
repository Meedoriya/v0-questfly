"use client"

import { useState } from "react"
import { useApp } from "@/lib/store"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Heart,
  Zap,
  Flame,
  BarChart3,
} from "lucide-react"

export function CollabFriendStatusScreen() {
  const { setScreen, currentJointQuest, lastImpactValue } = useApp()
  const [encouraged, setEncouraged] = useState(false)

  const quest = currentJointQuest
  const friend = quest?.player2

  // Simulate: friend completed ~60% of the time
  const friendCompleted = Math.random() > 0.4
  const friendImpact = friendCompleted ? Math.floor(Math.random() * 40) + 10 : 0

  if (!quest || !friend) {
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

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 pb-4 pt-12">
        <button onClick={() => setScreen("home")} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary" aria-label="Back">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="font-serif text-xl font-bold text-foreground">{"Partner's"} Status</h1>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-6 pb-8">
        {/* Your completion */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">QF</div>
            <div>
              <p className="text-sm font-semibold text-foreground">You</p>
              <p className="text-xs text-primary">Completed today</p>
            </div>
            <CheckCircle2 className="ml-auto h-5 w-5 text-primary" />
          </div>
          {lastImpactValue && (
            <div className="flex items-center gap-2 rounded-lg bg-card px-3 py-2">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">Impact:</span>
              <span className="text-xs font-bold text-foreground">{lastImpactValue}</span>
            </div>
          )}
        </div>

        {/* Friend status */}
        <div className={`rounded-2xl border p-5 ${
          friendCompleted
            ? "border-quest/20 bg-quest/5"
            : "border-border bg-card"
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
              friendCompleted ? "bg-quest/15 text-quest" : "bg-secondary text-foreground"
            }`}>
              {friend.avatar}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{friend.name}</p>
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
            <div className="flex items-center gap-2 rounded-lg bg-card px-3 py-2">
              <BarChart3 className="h-3.5 w-3.5 text-quest" />
              <span className="text-xs text-muted-foreground">Impact:</span>
              <span className="text-xs font-bold text-foreground">{friendImpact} pages</span>
            </div>
          ) : (
            <button
              onClick={() => setEncouraged(true)}
              disabled={encouraged}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
                encouraged
                  ? "bg-accent/10 text-accent border border-accent/30 cursor-default"
                  : "bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.98]"
              }`}
            >
              <Heart className={`h-4 w-4 ${encouraged ? "fill-accent" : ""}`} />
              {encouraged ? "Encouragement sent!" : "Encourage"}
            </button>
          )}
        </div>

        {/* Quest stats */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quest Progress</h3>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">QF</div>
                <span className="text-xs text-foreground">You</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(quest.player1.progress / quest.player1.totalTasks) * 100}%` }} />
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{quest.player1.progress}/{quest.player1.totalTasks}</span>
                <div className="flex items-center gap-1">
                  <Flame className="h-3 w-3 text-streak" />
                  <span className="text-[10px] font-bold text-streak">{quest.player1.streak}</span>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-quest/10 text-[10px] font-bold text-quest">{friend.avatar}</div>
                <span className="text-xs text-foreground">{friend.name}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-quest transition-all" style={{ width: `${(quest.player2.progress / quest.player2.totalTasks) * 100}%` }} />
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{quest.player2.progress}/{quest.player2.totalTasks}</span>
                <div className="flex items-center gap-1">
                  <Flame className="h-3 w-3 text-streak" />
                  <span className="text-[10px] font-bold text-streak">{quest.player2.streak}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rank points */}
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
            <Zap className="mx-auto h-5 w-5 text-primary" />
            <p className="mt-1 text-xl font-bold text-foreground">{quest.player1.rankPoints}</p>
            <p className="text-[10px] text-muted-foreground">Your Rank Pts</p>
          </div>
          <div className="flex-1 rounded-xl border border-quest/20 bg-quest/5 p-4 text-center">
            <Zap className="mx-auto h-5 w-5 text-quest" />
            <p className="mt-1 text-xl font-bold text-foreground">{quest.player2.rankPoints}</p>
            <p className="text-[10px] text-muted-foreground">{friend.name} Rank Pts</p>
          </div>
        </div>
      </div>

      {/* Bottom */}
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
