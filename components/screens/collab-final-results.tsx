"use client"

import type { ComponentType } from "react"
import {
  BarChart3,
  CheckCircle2,
  Flame,
  Home,
  Plus,
  Skull,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react"

import { useApp } from "@/lib/store"
import { useAuth } from "@/components/auth-provider"
import { findOpponent, findPlayerByUserId } from "@/lib/joint-quest-utils"
import { getInitial } from "@/lib/friend-feed"
import type { JointPlayer, JointQuest } from "@/lib/types"

type Outcome = "victory" | "tie-completed" | "failed-closest" | "failed-tie"

interface SideContext {
  player: JointPlayer
  name: string
  /** "Winner" | "Runner-up" | "Completed" | "Closest" | "Did not finish" */
  label: string
  isWinner: boolean
  isTied: boolean
}

export function CollabFinalResultsScreen() {
  const { setScreen, currentJointQuest, setCurrentJointQuest } = useApp()
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

  const meName = me.name || "You"
  const oppName = opp.name || "Friend"
  const outcome = determineOutcome(quest)
  const meSide = sideFor(me, meName, outcome, quest.winnerUserId === me.userId)
  const oppSide = sideFor(opp, oppName, outcome, quest.winnerUserId === opp.userId)

  const isFailed = outcome === "failed-closest" || outcome === "failed-tie"
  const HeaderIcon = isFailed ? Skull : Trophy
  const headerIconColor = isFailed ? "text-destructive" : "text-accent"
  const headerIconBg = isFailed ? "bg-destructive/15" : "bg-accent/15"

  function handleNewQuest() {
    setCurrentJointQuest(null)
    setScreen("collab-quest-settings")
  }

  function handleHome() {
    setCurrentJointQuest(null)
    setScreen("home")
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      {/* Atmosphere — radial glow меняется по исходу */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 opacity-80"
        style={{ background: `radial-gradient(60% 100% at 50% 0%, ${outcomeGlow(outcome)}, transparent 70%)` }}
      />

      <header className="relative px-6 pt-12 pb-6 text-center">
        <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${headerIconBg}`}>
          <HeaderIcon className={`h-7 w-7 ${headerIconColor}`} />
        </div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Final Results</h1>
        {quest.title && <p className="mt-1 text-sm text-muted-foreground">{quest.title}</p>}
      </header>

      <main className="relative flex flex-1 flex-col gap-6 px-6 pb-40">
        {/* Outcome badge */}
        <div className="flex justify-center">
          <OutcomeBadge outcome={outcome} />
        </div>

        {/* Player headers */}
        <div className="grid grid-cols-2 gap-3">
          <PlayerHeader side={meSide} accent="primary" />
          <PlayerHeader side={oppSide} accent="quest" />
        </div>

        {/* Comparison ledger */}
        <div className="flex flex-col gap-2">
          {LEDGER_ROWS.map((row) => (
            <LedgerRow
              key={row.label}
              icon={row.icon}
              label={row.label}
              meValue={row.value(me)}
              oppValue={row.value(opp)}
              meIsWinner={meSide.isWinner}
              oppIsWinner={oppSide.isWinner}
              accentColor={row.accent}
              headline={row.headline}
            />
          ))}
        </div>

        <SummaryCard me={me} opp={opp} oppName={oppName} />
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 px-6 pb-8 pt-4 backdrop-blur-lg">
        <div className="mx-auto flex max-w-md flex-col gap-3">
          <button
            onClick={handleNewQuest}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-[0_0_24px_-4px] shadow-primary/40 transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Start New Joint Quest
          </button>
          <button
            onClick={handleHome}
            className="flex w-full items-center justify-center gap-2 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Home className="h-3.5 w-3.5" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

/* ----- ledger spec ----- */

interface LedgerRowSpec {
  icon: ComponentType<{ className?: string }>
  label: string
  /** Tailwind text color класс. Применяется к winner-стороне ряда. */
  accent: string
  /** True для строки rank_points — headline serif-treatment. */
  headline?: boolean
  value: (p: JointPlayer) => string
}

const LEDGER_ROWS: LedgerRowSpec[] = [
  { icon: Zap,           label: "Rank Points",   accent: "text-primary",    headline: true, value: (p) => formatSigned(p.rankPoints) },
  { icon: TrendingUp,    label: "Rank Increase", accent: "text-accent",                     value: (p) => formatSigned(p.rankIncrease) },
  { icon: Flame,         label: "Streak",        accent: "text-streak",                     value: (p) => `${p.longestStreak}d` },
  { icon: BarChart3,     label: "Impact",        accent: "text-quest",                      value: (p) => String(p.impactScore) },
  { icon: CheckCircle2,  label: "Tasks Done",    accent: "text-foreground",                 value: (p) => `${p.progress}/${p.totalTasks}` },
]

/* ----- components ----- */

interface LedgerRowProps {
  icon: ComponentType<{ className?: string }>
  label: string
  meValue: string
  oppValue: string
  meIsWinner: boolean
  oppIsWinner: boolean
  accentColor: string
  headline?: boolean
}

function LedgerRow({ icon: Icon, label, meValue, oppValue, meIsWinner, oppIsWinner, accentColor, headline }: LedgerRowProps) {
  const numberBase = headline ? "font-serif text-xl" : "text-lg"
  return (
    <div className="grid min-h-[68px] grid-cols-[1fr_auto_1fr] overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-end px-4">
        <span className={`tabular-nums font-bold ${numberBase} ${meIsWinner ? accentColor : "text-foreground"}`}>
          {meValue}
        </span>
      </div>
      <div className="flex w-28 flex-col items-center justify-center gap-1 border-x border-border bg-secondary/30 px-3 py-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-center text-[10px] leading-tight text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center justify-start px-4">
        <span className={`tabular-nums font-bold ${numberBase} ${oppIsWinner ? accentColor : "text-foreground"}`}>
          {oppValue}
        </span>
      </div>
    </div>
  )
}

interface PlayerHeaderProps {
  side: SideContext
  accent: "primary" | "quest"
}

function PlayerHeader({ side, accent }: PlayerHeaderProps) {
  const winnerRing = accent === "primary" ? "ring-2 ring-primary" : "ring-2 ring-quest"
  const winnerAvatarBg = accent === "primary" ? "bg-primary/15 text-primary" : "bg-quest/15 text-quest"
  const winnerLabelColor = accent === "primary" ? "text-primary" : "text-quest"

  const ringClass = side.isWinner ? winnerRing : side.isTied ? "ring-1 ring-accent/60" : ""
  const avatarBg = side.isWinner ? winnerAvatarBg : "bg-secondary text-foreground"
  const labelColor = side.isWinner ? winnerLabelColor : "text-muted-foreground"

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4">
      <div className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-base font-bold ${avatarBg} ${ringClass}`}>
        {side.player.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={side.player.avatarUrl} alt={side.name} className="h-full w-full object-cover" />
        ) : (
          getInitial(side.name)
        )}
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-foreground">{side.name}</p>
        <p className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>{side.label}</p>
      </div>
    </div>
  )
}

function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  if (outcome === "victory") {
    return (
      <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2">
        <Trophy className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold uppercase tracking-wide text-primary">Victory</span>
      </div>
    )
  }
  if (outcome === "tie-completed") {
    return (
      <div className="flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2">
        <Users className="h-4 w-4 text-accent" />
        <span className="text-sm font-bold uppercase tracking-wide text-accent">Tie — both completed</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-4 py-2">
      <Skull className="h-4 w-4 text-destructive" />
      <span className="text-sm font-bold uppercase tracking-wide text-destructive">Quest Failed</span>
    </div>
  )
}

function SummaryCard({ me, opp, oppName }: { me: JointPlayer; opp: JointPlayer; oppName: string }) {
  const totalTasks = me.progress + opp.progress
  const totalImpact = me.impactScore + opp.impactScore
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-2 flex items-center justify-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Joint Quest Summary
        </span>
      </div>
      <p className="text-center text-sm leading-relaxed text-secondary-foreground">
        You and <span className="font-bold text-foreground">{oppName}</span> completed{" "}
        <span className="font-bold text-foreground tabular-nums">{totalTasks}</span> tasks combined with{" "}
        <span className="font-bold text-foreground tabular-nums">{totalImpact}</span> impact.
      </p>
    </div>
  )
}

/* ----- helpers ----- */

function determineOutcome(quest: JointQuest): Outcome {
  if (quest.status === "failed") {
    return quest.winnerUserId === null ? "failed-tie" : "failed-closest"
  }
  return quest.winnerUserId === null ? "tie-completed" : "victory"
}

function outcomeGlow(outcome: Outcome): string {
  switch (outcome) {
    case "victory":
      return "hsl(var(--primary) / 0.18)"
    case "tie-completed":
      return "hsl(var(--accent) / 0.15)"
    case "failed-tie":
    case "failed-closest":
      return "hsl(var(--destructive) / 0.12)"
  }
}

function sideFor(player: JointPlayer, name: string, outcome: Outcome, isWinner: boolean): SideContext {
  if (outcome === "victory") {
    return { player, name, label: isWinner ? "Winner" : "Runner-up", isWinner, isTied: false }
  }
  if (outcome === "tie-completed") {
    return { player, name, label: "Completed", isWinner: false, isTied: true }
  }
  if (outcome === "failed-closest") {
    return { player, name, label: isWinner ? "Closest" : "Runner-up", isWinner, isTied: false }
  }
  return { player, name, label: "Did not finish", isWinner: false, isTied: true }
}

function formatSigned(n: number): string {
  return n > 0 ? `+${n}` : String(n)
}
