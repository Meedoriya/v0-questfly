"use client"

import { useEffect, useState } from "react"
import { useApp } from "@/lib/store"
import {
  Crown,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Flame,
  Sparkles,
  Star,
  Zap,
} from "lucide-react"

/* ---------- MEGA STREAK RESET SUMMARY ---------- */

export function MegaStreakResetScreen() {
  const { userProgress, streakSummaries, setScreen } = useApp()

  const survived = streakSummaries.filter((s) => s.survived)
  const reset = streakSummaries.filter((s) => !s.survived)

  return (
    <div className="flex min-h-dvh flex-col px-6 pb-8 pt-12">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-border bg-secondary/50">
          <Crown className="h-10 w-10 text-muted-foreground/40" />
        </div>
        <div className="text-center">
          <h1 className="font-serif text-2xl font-bold text-foreground">Streak Summary</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your mega streak lasted {userProgress.megaStreak || 1} days
          </p>
        </div>
      </div>

      {/* Survived */}
      {survived.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Survived
          </h2>
          <div className="flex flex-col gap-2">
            {survived.map((s) => (
              <div
                key={s.name}
                className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Flame className="h-3 w-3 text-streak" />
                    <span className="text-[10px] text-muted-foreground">{s.previousStreak} days</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reset */}
      {reset.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-destructive">
            <XCircle className="h-3.5 w-3.5" />
            Reset
          </h2>
          <div className="flex flex-col gap-2">
            {reset.map((s) => (
              <div
                key={s.name}
                className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4"
              >
                <XCircle className="h-5 w-5 shrink-0 text-destructive" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Was {s.previousStreak} days -- now reset
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Neutral message */}
      <div className="mb-6 rounded-xl bg-secondary/50 p-4 text-center">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Every streak starts at day one. What matters is getting back on track.
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={() => setScreen("home")}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]"
      >
        Continue
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

/* ---------- MEGA STREAK SUCCESS ---------- */

export function MegaStreakSuccessScreen() {
  const { userProgress, setScreen } = useApp()
  const [showContent, setShowContent] = useState(false)
  const [showBonus, setShowBonus] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShowContent(true), 400)
    const t2 = setTimeout(() => setShowBonus(true), 1200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // Confetti particles
  const confettiColors = ["bg-streak", "bg-primary", "bg-accent", "bg-quest"]

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6">
      {/* Gold radial glow bg */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-streak/8 via-transparent to-streak/5" />

      {/* Confetti */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className={`absolute h-2 w-2 rounded-full ${confettiColors[i % confettiColors.length]} animate-confetti`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 40}%`,
              animationDelay: `${Math.random() * 1.5}s`,
              animationDuration: `${1.2 + Math.random() * 0.8}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6">
        {/* Crown */}
        <div className="animate-celebrate">
          <div className="flex h-28 w-28 items-center justify-center rounded-full border-[3px] border-streak bg-streak/15 animate-gold-glow">
            <Crown className="h-14 w-14 text-streak" />
          </div>
        </div>

        {/* Counter */}
        {showContent && (
          <div className="flex flex-col items-center gap-1 animate-float-up">
            <p className="text-6xl font-bold text-streak">{userProgress.megaStreak || 7}</p>
            <p className="text-sm font-semibold text-streak/70">Day Mega Streak</p>
          </div>
        )}

        {/* Title */}
        {showContent && (
          <div className="text-center animate-float-up" style={{ animationDelay: "0.15s" }}>
            <h1 className="font-serif text-3xl font-bold text-foreground">Unstoppable!</h1>
            <p className="mt-2 text-sm text-muted-foreground text-pretty">
              You completed every task and habit today. Your dedication is legendary.
            </p>
          </div>
        )}

        {/* XP Bonus badge */}
        {showBonus && (
          <div className="animate-bounce-in flex items-center gap-3 rounded-2xl border border-streak/30 bg-streak/10 px-6 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-streak/20">
              <Zap className="h-6 w-6 text-streak" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-streak/70">Bonus XP</p>
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-streak" />
                <span className="text-2xl font-bold text-streak">+50</span>
                <Star className="h-4 w-4 text-streak" />
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        {showContent && (
          <div className="w-full animate-float-up" style={{ animationDelay: "0.3s" }}>
            <button
              onClick={() => setScreen("home")}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-streak font-semibold text-accent-foreground transition-all hover:brightness-110 active:scale-[0.98]"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
