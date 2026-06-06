"use client"

import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Lock,
  Route,
} from "lucide-react"

import { useApp } from "@/lib/store"
import { useAuth } from "@/components/auth-provider"
import { findOpponent, findPlayerByUserId } from "@/lib/joint-quest-utils"
import { getInitial } from "@/lib/friend-feed"
import type { JointPlayer } from "@/lib/types"

type StepState = "completed" | "current" | "locked"

function stepState(index: number, progress: number): StepState {
  if (index < progress) return "completed"
  if (index === progress) return "current"
  return "locked"
}

export function CollabRoadmapScreen() {
  const { setScreen, currentJointQuest } = useApp()
  const { user } = useAuth()
  const meId = user?.userId ?? ""

  const quest = currentJointQuest
  if (!quest) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-muted-foreground">No quest data</p>
      </div>
    )
  }

  const me = findPlayerByUserId(quest, meId) ?? quest.players[0]
  const opp = findOpponent(quest, meId) ?? quest.players[1]

  if (!me || !opp) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <header className="flex items-center gap-3 px-6 pb-4 pt-12">
          <button
            onClick={() => setScreen("collab-friend-status")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
        </header>
        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <p className="text-sm text-muted-foreground">Waiting for your partner to accept the invite.</p>
        </div>
      </div>
    )
  }

  const meName = me.name || "You"
  const oppName = opp.name || "Friend"

  const totalSteps = Math.max(me.roadmapPreview.length, opp.roadmapPreview.length, me.totalTasks, opp.totalTasks)
  const steps = Array.from({ length: totalSteps }, (_, i) => i)

  const canLog = quest.status === "active"

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      {/* Atmosphere glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-70"
        style={{ background: "radial-gradient(60% 100% at 50% 0%, hsl(var(--primary) / 0.12), transparent 70%)" }}
      />

      {/* Header */}
      <header className="relative flex items-center gap-3 px-6 pb-4 pt-12">
        <button
          onClick={() => setScreen("collab-friend-status")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-secondary/80"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-muted-foreground" />
            <h1 className="font-serif text-xl font-bold text-foreground">Roadmap</h1>
          </div>
          {quest.title && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{quest.title}</p>
          )}
        </div>
      </header>

      {/* Progress summary */}
      <div className="relative mx-6 mb-4 grid grid-cols-2 gap-3">
        <PlayerProgressBar player={me} name={meName} color="primary" />
        <PlayerProgressBar player={opp} name={oppName} color="quest" />
      </div>

      {/* Column headers */}
      <div className="relative mx-6 mb-3 grid grid-cols-[1fr_2rem_1fr] items-center gap-1">
        <PlayerChip player={me} name={meName} align="right" color="primary" />
        <div />
        <PlayerChip player={opp} name={oppName} align="left" color="quest" />
      </div>

      {/* Steps */}
      <main className="relative flex-1 overflow-y-auto px-6 pb-40">
        <div className="relative flex flex-col gap-2">
          {/* Vertical center line */}
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border" />

          {steps.map((i) => {
            const meStep = me.roadmapPreview[i] ?? null
            const oppStep = opp.roadmapPreview[i] ?? null
            const meState = stepState(i, me.progress)
            const oppState = stepState(i, opp.progress)

            /* dominant state for the center chip: prefer "current" > "completed" > "locked" */
            const centerState: StepState =
              meState === "current" || oppState === "current"
                ? "current"
                : meState === "completed" && oppState === "completed"
                  ? "completed"
                  : "locked"

            return (
              <div key={i} className="grid grid-cols-[1fr_2rem_1fr] items-start gap-1">
                <StepCard state={meState} text={meStep} align="right" />
                <CenterChip index={i} state={centerState} />
                <StepCard state={oppState} text={oppStep} align="left" />
              </div>
            )
          })}
        </div>
      </main>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 px-6 pb-8 pt-4 backdrop-blur-lg">
        <div className="mx-auto max-w-md">
          {canLog && !me.completedToday ? (
            <button
              onClick={() => setScreen("collab-impact-input")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-[0_0_24px_-4px] shadow-primary/40 transition-all hover:bg-primary/90 active:scale-[0.98]"
            >
              <ChevronRight className="h-4 w-4" />
              Log Today&apos;s Progress
            </button>
          ) : (
            <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/50 py-4 text-sm font-bold text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              {me.completedToday ? "Today logged" : "Quest ended"}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ----- sub-components ----- */

interface PlayerProgressBarProps {
  player: JointPlayer
  name: string
  color: "primary" | "quest"
}

function PlayerProgressBar({ player, name, color }: PlayerProgressBarProps) {
  const pct = player.totalTasks > 0 ? (player.progress / player.totalTasks) * 100 : 0
  const barColor = color === "primary" ? "bg-primary" : "bg-quest"
  const textColor = color === "primary" ? "text-primary" : "text-quest"
  const avatarBg = color === "primary" ? "bg-primary/15 text-primary" : "bg-quest/15 text-quest"

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <div className={`flex h-7 w-7 items-center justify-center overflow-hidden rounded-full text-[10px] font-bold ${avatarBg}`}>
          {player.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={player.avatarUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            getInitial(name)
          )}
        </div>
        <p className="flex-1 truncate text-[11px] font-semibold text-foreground">{name}</p>
        <span className={`text-[10px] font-bold tabular-nums ${textColor}`}>
          {player.progress}/{player.totalTasks}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

interface PlayerChipProps {
  player: JointPlayer
  name: string
  align: "left" | "right"
  color: "primary" | "quest"
}

function PlayerChip({ name, align, color }: PlayerChipProps) {
  const textColor = color === "primary" ? "text-primary" : "text-quest"
  return (
    <p className={`text-[10px] font-semibold uppercase tracking-wider ${textColor} ${align === "right" ? "text-right" : "text-left"}`}>
      {name}
    </p>
  )
}

interface StepCardProps {
  state: StepState
  text: string | null
  align: "left" | "right"
}

function StepCard({ state, text, align }: StepCardProps) {
  const base = "relative flex min-h-[52px] flex-col justify-center rounded-lg border px-3 py-2 transition-all"
  const stateClass =
    state === "completed"
      ? "border-primary/30 bg-primary/10"
      : state === "current"
        ? "border-primary/50 bg-primary/15 ring-1 ring-primary/40 shadow-[0_0_12px_-4px] shadow-primary/30"
        : "border-border bg-secondary/30"

  const Icon =
    state === "completed" ? CheckCircle2 : state === "current" ? ChevronRight : Lock

  const iconClass =
    state === "completed"
      ? "h-3 w-3 text-primary flex-shrink-0"
      : state === "current"
        ? "h-3 w-3 text-primary flex-shrink-0 animate-pulse"
        : "h-3 w-3 text-muted-foreground/40 flex-shrink-0"

  const textClass =
    state === "completed"
      ? "text-[11px] leading-snug text-foreground/80"
      : state === "current"
        ? "text-[11px] leading-snug text-foreground font-medium"
        : "text-[11px] leading-snug text-muted-foreground/50 italic"

  const flexDir = align === "right" ? "flex-row-reverse" : "flex-row"

  return (
    <div className={`${base} ${stateClass}`}>
      {text !== null ? (
        <div className={`flex items-start gap-1.5 ${flexDir}`}>
          <Icon className={iconClass} />
          <span className={`${textClass} ${align === "right" ? "text-right" : "text-left"}`}>{text}</span>
        </div>
      ) : (
        <div className="h-4 w-3/4 rounded bg-secondary/50" />
      )}
    </div>
  )
}

interface CenterChipProps {
  index: number
  state: StepState
}

function CenterChip({ index, state }: CenterChipProps) {
  const bg =
    state === "completed"
      ? "bg-primary/20 text-primary"
      : state === "current"
        ? "bg-primary/30 text-primary font-bold"
        : "bg-secondary text-muted-foreground"

  return (
    <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-[10px] tabular-nums">
      <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${bg}`}>
        {index + 1}
      </div>
    </div>
  )
}
