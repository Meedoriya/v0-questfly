"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/lib/store"
import {
  Trophy,
  Zap,
  Flame,
  CheckCircle2,
  BarChart3,
  Star,
} from "lucide-react"

function Confetti() {
  const colors = ["bg-primary", "bg-accent", "bg-quest", "bg-streak", "bg-foreground"]
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className={`absolute h-2 w-2 rounded-full ${colors[i % colors.length]} animate-confetti`}
          style={{
            left: `${Math.random() * 100}%`,
            top: "-10px",
            animationDelay: `${Math.random() * 1.5}s`,
            animationDuration: `${1 + Math.random() * 1.5}s`,
          }}
        />
      ))}
    </div>
  )
}

export function CollabCelebrationScreen() {
  const { setScreen, currentJointQuest } = useApp()
  const [showContent, setShowContent] = useState(false)
  const [showStats, setShowStats] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShowContent(true), 400)
    const t2 = setTimeout(() => setShowStats(true), 1000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

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
    <div className="relative flex min-h-dvh flex-col bg-background">
      <Confetti />

      {/* Shared XP Animation */}
      <div className="flex items-center justify-center pt-16 pb-4">
        <div className="flex items-center gap-2 rounded-full bg-primary/15 px-5 py-2.5 animate-bounce-in animate-pulse-glow">
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold text-primary">+{p1.rankPoints + p2.rankPoints} Shared XP</span>
        </div>
      </div>

      {/* Title */}
      <div className="px-6 pb-6 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 animate-celebrate">
          <Trophy className="h-8 w-8 text-accent" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Quest Complete!</h1>
        <p className="mt-1 text-sm text-muted-foreground">{quest.title}</p>
      </div>

      {showContent && (
        <div className="flex flex-col gap-5 px-6 pb-8 animate-float-up">
          {/* Side by side comparison */}
          <div className="flex gap-3">
            {/* Player 1 */}
            <div className={`flex-1 rounded-2xl border p-5 ${
              p1Won ? "border-primary/30 bg-primary/5" : "border-border bg-card"
            }`}>
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-full text-base font-bold ${
                    p1Won ? "bg-primary/15 text-primary" : "bg-secondary text-foreground"
                  }`}>
                    {p1.avatar}
                  </div>
                  {p1Won && (
                    <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent">
                      <Star className="h-3 w-3 text-accent-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-bold text-foreground">{p1.name}</p>
              </div>
            </div>

            {/* VS */}
            <div className="flex items-center">
              <span className="text-xs font-bold text-muted-foreground">VS</span>
            </div>

            {/* Player 2 */}
            <div className={`flex-1 rounded-2xl border p-5 ${
              !p1Won ? "border-quest/30 bg-quest/5" : "border-border bg-card"
            }`}>
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-full text-base font-bold ${
                    !p1Won ? "bg-quest/15 text-quest" : "bg-secondary text-foreground"
                  }`}>
                    {p2.avatar}
                  </div>
                  {!p1Won && (
                    <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent">
                      <Star className="h-3 w-3 text-accent-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-bold text-foreground">{p2.name}</p>
              </div>
            </div>
          </div>

          {showStats && (
            <div className="flex flex-col gap-3 animate-float-up">
              {/* Stat rows */}
              {[
                { label: "Tasks Done", icon: CheckCircle2, v1: `${p1.progress}/${p1.totalTasks}`, v2: `${p2.progress}/${p2.totalTasks}` },
                { label: "Streak", icon: Flame, v1: `${p1.streak}d`, v2: `${p2.streak}d` },
                { label: "Impact Score", icon: BarChart3, v1: String(p1.impactScore), v2: String(p2.impactScore) },
                { label: "Rank Points", icon: Zap, v1: `+${p1.rankPoints}`, v2: `+${p2.rankPoints}` },
              ].map((row) => {
                const Icon = row.icon
                return (
                  <div key={row.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="flex-1 text-xs text-muted-foreground">{row.label}</span>
                    <span className="w-16 text-right text-sm font-bold text-primary">{row.v1}</span>
                    <span className="w-16 text-right text-sm font-bold text-quest">{row.v2}</span>
                  </div>
                )
              })}

              {/* Winner badge */}
              <div className="flex justify-center">
                <div className={`flex items-center gap-2 rounded-full px-5 py-2.5 ${
                  p1Won ? "bg-primary/15" : "bg-quest/15"
                }`}>
                  <Trophy className={`h-4 w-4 ${p1Won ? "text-primary" : "text-quest"}`} />
                  <span className={`text-sm font-bold ${p1Won ? "text-primary" : "text-quest"}`}>
                    {p1Won ? p1.name : p2.name} wins with +{Math.max(p1.rankPoints, p2.rankPoints)} rank pts
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom */}
      <div className="mt-auto px-6 pb-8">
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
