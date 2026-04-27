"use client"

import { useApp } from "@/lib/store"
import {
  Skull,
  Trophy,
  Zap,
  Flame,
  X,
} from "lucide-react"

export function CollabQuestFailureScreen() {
  const { setScreen, currentJointQuest } = useApp()

  const quest = currentJointQuest
  if (!quest) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-muted-foreground">No quest data</p>
      </div>
    )
  }

  const p1 = quest.player1
  const p2 = quest.player2
  const p1Won = p1.rankPoints > p2.rankPoints
  const winner = p1Won ? p1 : p2
  const loser = p1Won ? p2 : p1

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-12 pb-4">
        <h1 className="font-serif text-xl font-bold text-foreground">Quest Ended</h1>
        <button onClick={() => setScreen("home")} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary" aria-label="Close">
          <X className="h-5 w-5 text-foreground" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-6 px-6 pb-8">
        {/* Status badge */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-full bg-destructive/10 border border-destructive/30 px-4 py-2">
            <Skull className="h-4 w-4 text-destructive" />
            <span className="text-sm font-bold text-destructive">Quest Failed</span>
          </div>
        </div>

        {/* Two-panel layout */}
        <div className="flex gap-3">
          {/* Winner side */}
          <div className="flex-1 rounded-2xl border border-primary/30 bg-primary/5 p-5 animate-pulse-glow">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary">
                  {winner.avatar}
                </div>
                <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent">
                  <Trophy className="h-3.5 w-3.5 text-accent-foreground" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">{winner.name}</p>
                <p className="text-[10px] text-primary font-semibold uppercase">Winner</p>
              </div>

              {/* Stats */}
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-card px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">Rank Points</span>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm font-bold text-primary">+{winner.rankPoints}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-card px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">Streak</span>
                  <div className="flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-streak" />
                    <span className="text-sm font-bold text-streak">{winner.streak}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-card px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">Failed Tasks</span>
                  <span className="text-sm font-bold text-foreground">{winner.failedTasks}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Loser side */}
          <div className="flex-1 rounded-2xl border border-border bg-card/50 p-5 opacity-70">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-lg font-bold text-muted-foreground">
                {loser.avatar}
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-muted-foreground">{loser.name}</p>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase">Runner-up</p>
              </div>

              {/* Stats */}
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">Rank Points</span>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-bold text-muted-foreground">+{Math.floor(loser.rankPoints * 0.5)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">Streak</span>
                  <div className="flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-bold text-muted-foreground">{loser.streak}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">Failed Tasks</span>
                  <span className="text-sm font-bold text-muted-foreground">{loser.failedTasks}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">Both players receive base points. Winner gets bonus rank increase.</p>
      </div>

      {/* Bottom */}
      <div className="px-6 pb-8">
        <button
          onClick={() => setScreen("collab-final-results")}
          className="w-full rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          View Final Results
        </button>
      </div>
    </div>
  )
}
