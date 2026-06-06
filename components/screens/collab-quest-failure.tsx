"use client"

import type { ComponentType } from "react"
import {
  BarChart3,
  CheckCircle2,
  Flame,
  Skull,
  TrendingUp,
  Trophy,
  X,
  Zap,
} from "lucide-react"

import { useApp } from "@/lib/store"
import { useAuth } from "@/components/auth-provider"
import { findOpponent, findPlayerByUserId } from "@/lib/joint-quest-utils"
import { getInitial } from "@/lib/friend-feed"
import type { JointPlayer } from "@/lib/types"

export function CollabQuestFailureScreen() {
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
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-muted-foreground">Quest data is incomplete</p>
      </div>
    )
  }

  // Winner определяет ТОЛЬКО бэк через winnerUserId. На failure он может быть null
  // (оба провалились — рендерим симметрично) или uuid того, кто оказался «ближе по
  // прогрессу к total_tasks». Локальное сравнение rankPoints было бы враньём.
  const meName = me.name || "You"
  const oppName = opp.name || "Friend"
  const tie = quest.winnerUserId === null
  const meIsClosest = !tie && quest.winnerUserId === me.userId
  const oppIsClosest = !tie && quest.winnerUserId === opp.userId

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      {/* Atmosphere — лёгкий destructive ореол вверху, без пульсации */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-70"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, hsl(var(--destructive) / 0.12), transparent 70%)",
        }}
      />

      <header className="relative flex items-center justify-between px-6 pt-12 pb-4">
        <h1 className="font-serif text-xl font-bold text-foreground">Quest Ended</h1>
        <button
          onClick={() => setScreen("home")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-secondary/80"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <main className="relative flex flex-1 flex-col gap-6 px-6 pb-8">
        {/* Status badge */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-4 py-2 animate-pulse">
            <Skull className="h-4 w-4 text-destructive" />
            <span className="text-sm font-bold uppercase tracking-wide text-destructive">
              Quest Failed
            </span>
          </div>
        </div>

        {/* Quest title */}
        {quest.title && (
          <p className="text-center text-xs text-muted-foreground">{quest.title}</p>
        )}

        {/* Side-by-side panels */}
        <div className="flex gap-3">
          <PlayerPanel
            player={me}
            name={meName}
            label={tie ? "Did not finish" : meIsClosest ? "Closest" : "Runner-up"}
            highlighted={meIsClosest}
            faded={oppIsClosest}
          />
          <PlayerPanel
            player={opp}
            name={oppName}
            label={tie ? "Did not finish" : oppIsClosest ? "Closest" : "Runner-up"}
            highlighted={oppIsClosest}
            faded={meIsClosest}
          />
        </div>

        {/* Caption */}
        <p className="px-2 text-center text-xs leading-relaxed text-muted-foreground">
          {tie
            ? "Neither side reached the goal. Rank points are still awarded for the days you held the line."
            : "Both players keep what they earned. Rank stays where you left it."}
        </p>
      </main>

      <div className="px-6 pb-8">
        <button
          onClick={() => setScreen("collab-final-results")}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          View Final Results
        </button>
      </div>
    </div>
  )
}

interface PlayerPanelProps {
  player: JointPlayer
  name: string
  label: string
  highlighted: boolean
  faded: boolean
}

function PlayerPanel({ player, name, label, highlighted, faded }: PlayerPanelProps) {
  return (
    <div
      className={`relative flex-1 rounded-2xl border p-5 ${
        highlighted
          ? "border-primary/30 bg-primary/5"
          : faded
            ? "border-border bg-card/60 opacity-90"
            : "border-border bg-card"
      }`}
    >
      <div className="flex flex-col items-center gap-3">
        {/* Avatar */}
        <div className="relative">
          <div
            className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-full text-lg font-bold ${
              highlighted ? "bg-primary/15 text-primary" : "bg-secondary text-foreground"
            }`}
          >
            {player.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={player.avatarUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              getInitial(name)
            )}
          </div>
          {highlighted && (
            <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent">
              <Trophy className="h-3.5 w-3.5 text-accent-foreground" />
            </div>
          )}
        </div>

        {/* Name + label */}
        <div className="text-center">
          <p className="text-sm font-bold text-foreground">{name}</p>
          <p
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              highlighted ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {label}
          </p>
        </div>

        {/* Stat ledger */}
        <div className="w-full space-y-1.5">
          <StatRow
            icon={Zap}
            label="Rank Points"
            value={formatSigned(player.rankPoints)}
            highlighted={highlighted}
            accent="text-primary"
            serif
          />
          <StatRow
            icon={TrendingUp}
            label="Rank Increase"
            value={formatSigned(player.rankIncrease)}
            highlighted={highlighted}
            accent="text-accent"
          />
          <StatRow
            icon={Flame}
            label="Streak"
            value={`${player.longestStreak}d`}
            highlighted={highlighted}
            accent="text-streak"
          />
          <StatRow
            icon={BarChart3}
            label="Impact"
            value={String(player.impactScore)}
            highlighted={highlighted}
            accent="text-quest"
          />
          <StatRow
            icon={CheckCircle2}
            label="Tasks Done"
            value={`${player.progress}/${player.totalTasks}`}
            highlighted={highlighted}
            accent="text-foreground"
          />
        </div>
      </div>
    </div>
  )
}

interface StatRowProps {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  highlighted: boolean
  accent: string
  serif?: boolean
}

function StatRow({ icon: Icon, label, value, highlighted, accent, serif }: StatRowProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg px-3 py-2 ${
        highlighted ? "bg-card" : "bg-secondary/40"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3 w-3 ${highlighted ? accent : "text-muted-foreground"}`} />
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <span
        className={`tabular-nums text-sm font-bold ${serif ? "font-serif" : ""} ${
          highlighted ? accent : "text-muted-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  )
}

/** `+5` для положительных, `0` для нуля — иначе `+0` в failure-контексте читается как participation award. */
function formatSigned(n: number): string {
  return n > 0 ? `+${n}` : String(n)
}
