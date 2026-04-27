"use client"

import { useState, useEffect, useMemo } from "react"
import { useApp } from "@/lib/store"
import {
  Trophy,
  Zap,
  Star,
  ChevronRight,
} from "lucide-react"
import { getAxisIcon, getAxisColor, getAxisHsl } from "@/components/radar-diagram"

const CONFETTI_COLORS = [
  "bg-accent", "bg-primary", "bg-quest", "bg-destructive",
  "bg-accent", "bg-primary",
]

export function QuestCelebrationScreen() {
  const { currentQuest, userProgress, setScreen, earnedXp } = useApp()
  const [phase, setPhase] = useState(0) // 0=burst, 1=trophy, 2=title, 3=stats, 4=cta

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 1400),
      setTimeout(() => setPhase(4), 2200),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 0.8}s`,
        size: Math.random() > 0.5 ? "h-2 w-2" : "h-1.5 w-3",
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotation: Math.random() * 360,
      })),
    []
  )

  const questName = currentQuest?.title || "Quest Complete"
  const xp = earnedXp || 250

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-6">
      {/* Radial burst */}
      {phase >= 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-32 w-32 rounded-full bg-accent/20 animate-radial-burst" />
        </div>
      )}

      {/* Confetti */}
      {phase >= 1 &&
        confettiPieces.map((p) => (
          <div
            key={p.id}
            className={`absolute ${p.size} rounded-sm ${p.color} animate-confetti`}
            style={{
              left: p.left,
              top: "30%",
              animationDelay: p.delay,
              transform: `rotate(${p.rotation}deg)`,
            }}
          />
        ))}

      {/* Trophy */}
      {phase >= 1 && (
        <div className="relative mb-6 animate-celebrate">
          <div className="flex h-28 w-28 items-center justify-center rounded-3xl border-2 border-accent/40 bg-accent/10 animate-boss-glow">
            <Trophy className="h-14 w-14 text-accent" />
          </div>
          <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-accent animate-bounce-in" style={{ animationDelay: "0.5s" }}>
            <Star className="h-4 w-4 text-accent-foreground" />
          </div>
        </div>
      )}

      {/* Quest Title */}
      {phase >= 2 && (
        <div className="text-center animate-float-up">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent/70">Quest Complete</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-balance text-foreground">{questName}</h1>
        </div>
      )}

      {/* XP Badge */}
      {phase >= 2 && (
        <div className="mt-4 flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2.5 animate-bounce-in" style={{ animationDelay: "0.3s" }}>
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-xl font-bold text-primary">+{xp} XP</span>
        </div>
      )}

      {/* Characteristic Progress Bars */}
      {phase >= 3 && (
        <div className="mt-8 w-full max-w-xs flex flex-col gap-3 animate-float-up">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-center mb-1">
            Stats Improved
          </p>
          {userProgress.characteristics.filter((c) => c.thisWeek > 0).slice(0, 6).map((char, idx) => {
            const Icon = getAxisIcon(char.key)
            const color = getAxisColor(char.key)
            const hsl = getAxisHsl(char.key)
            const pct = (char.current / char.max) * 100

            return (
              <div
                key={char.key}
                className="flex items-center gap-3"
                style={{ animationDelay: `${idx * 0.15}s` }}
              >
                <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground">{char.name}</span>
                    <span className={`text-[10px] font-bold ${color}`}>+{char.thisWeek}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full animate-bar-fill animate-stat-glow"
                      style={{ width: `${pct}%`, backgroundColor: `hsl(${hsl})`, animationDelay: `${0.3 + idx * 0.2}s` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CTA */}
      {phase >= 4 && (
        <div className="mt-10 w-full max-w-xs flex flex-col gap-3 animate-float-up">
          <button
            onClick={() => setScreen(currentQuest?.mode === "Rank" ? "rank-summary" : "casual-summary")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97]"
          >
            View Summary
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setScreen("home")}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Home
          </button>
        </div>
      )}
    </div>
  )
}
