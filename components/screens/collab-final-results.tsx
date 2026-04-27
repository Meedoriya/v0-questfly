"use client"

import { useApp } from "@/lib/store"
import {
  Trophy,
  Zap,
  BarChart3,
  TrendingUp,
  Users,
  Plus,
} from "lucide-react"

export function CollabFinalResultsScreen() {
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
  const p1Won = p1.rankPoints >= p2.rankPoints

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15">
          <Trophy className="h-7 w-7 text-accent" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Final Results</h1>
        <p className="mt-1 text-sm text-muted-foreground">{quest.title}</p>
      </div>

      <div className="flex flex-1 flex-col gap-6 px-6 pb-32">
        {/* Two-column results */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {/* Column headers */}
          <div className="flex border-b border-border">
            <div className="flex-1 p-4 text-center">
              <div className={`mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ${
                p1Won ? "bg-primary/15 text-primary" : "bg-secondary text-foreground"
              }`}>
                {p1.avatar}
              </div>
              <p className="text-xs font-semibold text-foreground">{p1.name}</p>
              {p1Won && (
                <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase text-primary">Winner</span>
              )}
            </div>
            <div className="w-px bg-border" />
            <div className="flex-1 p-4 text-center">
              <div className={`mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ${
                !p1Won ? "bg-quest/15 text-quest" : "bg-secondary text-foreground"
              }`}>
                {p2.avatar}
              </div>
              <p className="text-xs font-semibold text-foreground">{p2.name}</p>
              {!p1Won && (
                <span className="mt-1 inline-block rounded-full bg-quest/10 px-2 py-0.5 text-[9px] font-bold uppercase text-quest">Winner</span>
              )}
            </div>
          </div>

          {/* Stat rows */}
          {[
            {
              label: "Rank Points Earned",
              icon: Zap,
              v1: `+${p1Won ? p1.rankPoints : Math.floor(p1.rankPoints * 0.5)}`,
              v2: `+${!p1Won ? p2.rankPoints : Math.floor(p2.rankPoints * 0.5)}`,
              highlight1: p1Won,
              highlight2: !p1Won,
            },
            {
              label: "Rank Increase",
              icon: TrendingUp,
              v1: p1Won ? "+2" : "+1",
              v2: !p1Won ? "+2" : "+1",
              highlight1: p1Won,
              highlight2: !p1Won,
            },
            {
              label: "Impact Score",
              icon: BarChart3,
              v1: String(p1.impactScore),
              v2: String(p2.impactScore),
              highlight1: p1.impactScore >= p2.impactScore,
              highlight2: p2.impactScore > p1.impactScore,
            },
          ].map((row) => {
            const Icon = row.icon
            return (
              <div key={row.label} className="flex border-b border-border last:border-b-0">
                <div className="flex flex-1 flex-col items-center justify-center p-4">
                  <span className={`text-lg font-bold ${row.highlight1 ? "text-primary" : "text-foreground"}`}>{row.v1}</span>
                </div>
                <div className="flex w-28 flex-col items-center justify-center border-x border-border bg-secondary/30 p-3">
                  <Icon className="h-4 w-4 text-muted-foreground mb-1" />
                  <span className="text-[10px] text-center text-muted-foreground leading-tight">{row.label}</span>
                </div>
                <div className="flex flex-1 flex-col items-center justify-center p-4">
                  <span className={`text-lg font-bold ${row.highlight2 ? "text-quest" : "text-foreground"}`}>{row.v2}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-border bg-card p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Joint Quest Summary</span>
          </div>
          <p className="text-sm leading-relaxed text-secondary-foreground">
            Both players pushed each other to complete <span className="font-bold text-foreground">{p1.progress + p2.progress}</span> tasks
            with a combined impact score of <span className="font-bold text-foreground">{p1.impactScore + p2.impactScore}</span>.
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 px-6 pb-8 pt-4 backdrop-blur-lg">
        <div className="mx-auto flex max-w-md flex-col gap-3">
          <button
            onClick={() => setScreen("collab-quest-settings")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Start New Joint Quest
          </button>
          <button
            onClick={() => setScreen("home")}
            className="w-full py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
