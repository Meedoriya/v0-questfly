"use client"

import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"

const PHRASES = [
  "Listening to your goal",
  "Summoning your first quest",
  "Mapping the path ahead",
  "Tuning the constellation",
  "Almost ready",
]

const PARTICLES = [
  { left: "12%", delay: "0s", driftX: "8px", size: 3 },
  { left: "24%", delay: "1.4s", driftX: "-10px", size: 2 },
  { left: "38%", delay: "2.6s", driftX: "6px", size: 4 },
  { left: "55%", delay: "0.8s", driftX: "-14px", size: 2 },
  { left: "70%", delay: "3.2s", driftX: "10px", size: 3 },
  { left: "84%", delay: "1.8s", driftX: "-6px", size: 2 },
  { left: "92%", delay: "4s", driftX: "4px", size: 3 },
]

export function GoalSummoningLoader({ goal }: { goal: string }) {
  const [phraseIndex, setPhraseIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % PHRASES.length)
    }, 2400)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-background animate-fade-in">
      {/* drifting particles layer */}
      <div className="pointer-events-none absolute inset-0">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="absolute bottom-0 rounded-full bg-primary/70 animate-drift-up"
            style={{
              left: p.left,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: p.delay,
              boxShadow: "0 0 8px hsl(var(--primary) / 0.8)",
              ["--drift-x" as string]: p.driftX,
            }}
          />
        ))}
      </div>

      {/* sigil — center stage */}
      <div className="relative flex h-[300px] w-[300px] items-center justify-center">
        {/* aurora — conic sweep behind everything */}
        <div
          className="absolute inset-0 rounded-full opacity-40 blur-2xl animate-aurora"
          style={{
            background:
              "conic-gradient(from 0deg, hsl(155 70% 50% / 0.6), hsl(270 60% 60% / 0.5), hsl(200 70% 50% / 0.5), hsl(155 70% 50% / 0.6))",
          }}
        />

        {/* outer ring — slow, dashed */}
        <div className="absolute h-[280px] w-[280px] rounded-full border border-dashed border-primary/20 animate-orbit-slow">
          <span
            className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-primary"
            style={{ boxShadow: "0 0 12px hsl(var(--primary))" }}
          />
        </div>

        {/* middle ring — counter-rotation */}
        <div className="absolute h-[210px] w-[210px] rounded-full border border-dashed border-accent/30 animate-orbit-medium">
          <span
            className="absolute top-1/2 -right-1 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent"
            style={{ boxShadow: "0 0 10px hsl(var(--accent))" }}
          />
          <span
            className="absolute top-1/2 -left-1 h-1 w-1 -translate-y-1/2 rounded-full bg-accent/70"
          />
        </div>

        {/* inner ring — fast */}
        <div className="absolute h-[150px] w-[150px] rounded-full border border-primary/30 animate-orbit-fast">
          <span
            className="absolute -bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary"
            style={{ boxShadow: "0 0 8px hsl(var(--primary))" }}
          />
        </div>

        {/* core orb */}
        <div className="relative animate-core-breathe">
          <div
            className="absolute inset-0 rounded-full blur-xl"
            style={{
              background:
                "radial-gradient(circle, hsl(155 70% 50% / 0.5) 0%, transparent 70%)",
            }}
          />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 animate-pulse-glow">
            <Sparkles className="h-9 w-9 text-primary" />
          </div>
        </div>
      </div>

      {/* goal anchor chip */}
      <div className="mt-10 px-6">
        <div className="mx-auto inline-flex max-w-[280px] items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary animate-pulse" />
          <span className="truncate text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {goal}
          </span>
        </div>
      </div>

      {/* status line — fades between phrases */}
      <div className="mt-6 flex h-7 items-center justify-center px-6">
        <p
          key={phraseIndex}
          className="font-serif text-lg italic text-foreground/90"
          style={{ animation: "status-fade 2.4s ease-in-out forwards" }}
        >
          {PHRASES[phraseIndex]}
          <span className="ml-0.5 inline-flex">
            <span className="animate-pulse" style={{ animationDelay: "0ms" }}>.</span>
            <span className="animate-pulse" style={{ animationDelay: "200ms" }}>.</span>
            <span className="animate-pulse" style={{ animationDelay: "400ms" }}>.</span>
          </span>
        </p>
      </div>

      {/* shimmer thread */}
      <div className="relative mt-5 h-px w-44 overflow-hidden rounded-full bg-border/40">
        <div className="absolute inset-0 animate-shimmer" />
      </div>

      <p className="mt-8 max-w-[260px] text-balance text-center text-xs leading-relaxed text-muted-foreground/70">
        Crafting questions tailored to your journey
      </p>
    </div>
  )
}
