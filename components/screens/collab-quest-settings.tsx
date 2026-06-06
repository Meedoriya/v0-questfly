"use client"

import { useMemo, useState, type ComponentType, type ReactNode } from "react"
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Mail,
  Send,
  Sparkles,
  Users,
} from "lucide-react"

import { useApp } from "@/lib/store"
import { createJointQuest } from "@/lib/api/joint-quests"
import { mapJointQuest } from "@/lib/mappers/joint-quest-mapper"
import { ApiError } from "@/lib/api/errors"

const TITLE_MIN = 2
const TITLE_MAX = 100
const DESCRIPTION_MAX = 500
const TASKS_MIN = 3
const TASKS_MAX = 30
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isoDateOffsetUtc(daysFromToday: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + daysFromToday)
  return d.toISOString().slice(0, 10)
}

export function CollabQuestSettingsScreen() {
  const { setScreen, setCurrentJointQuest, upsertJointQuest } = useApp()

  const minDeadline = useMemo(() => isoDateOffsetUtc(1), [])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [inviteeEmail, setInviteeEmail] = useState("")
  const [deadline, setDeadline] = useState(() => isoDateOffsetUtc(30))
  const [totalTasks, setTotalTasks] = useState(7)

  const [busy, setBusy] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [touched, setTouched] = useState<{
    title?: boolean
    description?: boolean
    email?: boolean
    deadline?: boolean
    tasks?: boolean
  }>({})

  const titleLen = title.trim().length
  const descLen = description.length
  const emailTrimmed = inviteeEmail.trim()

  const titleValid = titleLen >= TITLE_MIN && titleLen <= TITLE_MAX
  const descValid = descLen <= DESCRIPTION_MAX
  const emailValid = EMAIL_RE.test(emailTrimmed)
  const deadlineValid = deadline >= minDeadline
  const tasksValid =
    Number.isInteger(totalTasks) && totalTasks >= TASKS_MIN && totalTasks <= TASKS_MAX

  const canSubmit = titleValid && descValid && emailValid && deadlineValid && tasksValid && !busy

  async function handleSubmit() {
    if (!canSubmit) return
    setBusy(true)
    setApiError(null)
    try {
      const raw = await createJointQuest({
        title: title.trim(),
        description: description.trim(),
        invitee_email: emailTrimmed,
        deadline,
        total_tasks: totalTasks,
      })
      const next = mapJointQuest(raw)
      if (next) {
        upsertJointQuest(next)
        setCurrentJointQuest(next)
      }
      setScreen("home")
    } catch (e) {
      if (e instanceof ApiError && e.code === "JOINT_QUEST_CAP_REACHED") {
        setApiError("You or your friend already have 3 active joint quests.")
      } else if (e instanceof Error) {
        setApiError(e.message || "Couldn't send the invite. Try again.")
      } else {
        setApiError("Couldn't send the invite. Try again.")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      {/* Atmosphere: faint radial glow behind the hero — gives the screen a "forge" mood without competing with content */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-60"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, hsl(var(--primary) / 0.15), transparent 70%)",
        }}
      />

      <header className="relative flex items-center gap-3 px-6 pb-4 pt-12">
        <button
          onClick={() => setScreen("home")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-secondary/80"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-serif text-xl font-bold text-foreground">Start Joint Quest</h1>
      </header>

      <main className="relative flex flex-1 flex-col gap-5 px-6 pb-40 pt-2">
        {/* Hero card */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="bg-gradient-to-r from-primary/10 to-quest/10 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-card/80 backdrop-blur">
                <Users className="h-6 w-6 text-quest" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-foreground">Forge a Joint Quest</h2>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  Set the pact. AI generates a personal roadmap for each side.
                </p>
              </div>
            </div>
          </div>
        </section>

        <FieldCard
          index={1}
          label="Quest title"
          counter={`${titleLen}/${TITLE_MAX}`}
          counterDanger={titleLen > TITLE_MAX}
          error={
            touched.title && !titleValid
              ? titleLen < TITLE_MIN
                ? `At least ${TITLE_MIN} characters`
                : `Max ${TITLE_MAX} characters`
              : null
          }
        >
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
            onBlur={() => setTouched((t) => ({ ...t, title: true }))}
            placeholder="Read 12 books together"
            className="h-11 w-full rounded-xl border border-border bg-secondary px-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </FieldCard>

        <FieldCard
          index={2}
          label="Description (optional)"
          counter={`${descLen}/${DESCRIPTION_MAX}`}
          counterDanger={descLen > DESCRIPTION_MAX}
          error={touched.description && !descValid ? `Max ${DESCRIPTION_MAX} characters` : null}
        >
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX))}
            onBlur={() => setTouched((t) => ({ ...t, description: true }))}
            placeholder="Both players read independently and log pages."
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </FieldCard>

        <FieldCard
          index={3}
          label="Friend's email"
          icon={Mail}
          helper="If they're not on QuestFly yet, the invite waits until they register."
          error={
            touched.email && !emailValid
              ? "Use a valid email like name@example.com"
              : null
          }
        >
          <input
            type="email"
            value={inviteeEmail}
            onChange={(e) => setInviteeEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            placeholder="friend@example.com"
            className="h-11 w-full rounded-xl border border-border bg-secondary px-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </FieldCard>

        <div className="flex flex-col gap-5 md:flex-row">
          <div className="flex-1">
            <FieldCard
              index={4}
              label="Deadline"
              icon={Calendar}
              error={touched.deadline && !deadlineValid ? "Pick a date in the future" : null}
            >
              <input
                type="date"
                value={deadline}
                min={minDeadline}
                onChange={(e) => setDeadline(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, deadline: true }))}
                className="h-11 w-full rounded-xl border border-border bg-secondary px-3 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary [color-scheme:dark]"
              />
            </FieldCard>
          </div>
          <div className="flex-1">
            <FieldCard
              index={5}
              label="Steps in roadmap"
              icon={Sparkles}
              helper="AI generates this many milestones per player."
              error={
                touched.tasks && !tasksValid
                  ? `Pick between ${TASKS_MIN} and ${TASKS_MAX}`
                  : null
              }
            >
              <input
                type="number"
                value={Number.isFinite(totalTasks) ? totalTasks : ""}
                min={TASKS_MIN}
                max={TASKS_MAX}
                step={1}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setTotalTasks(Number.isFinite(v) ? Math.floor(v) : 0)
                }}
                onBlur={() => setTouched((t) => ({ ...t, tasks: true }))}
                className="h-11 w-full rounded-xl border border-border bg-secondary px-3 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </FieldCard>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 px-6 pb-8 pt-4 backdrop-blur-lg">
        <div className="mx-auto flex max-w-md flex-col gap-2">
          {apiError && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {busy ? "Sending…" : "Send Invite"}
          </button>
        </div>
      </div>
    </div>
  )
}

interface FieldCardProps {
  index: number
  label: string
  counter?: string
  counterDanger?: boolean
  error?: string | null
  helper?: string
  icon?: ComponentType<{ className?: string }>
  children: ReactNode
}

function FieldCard({
  index,
  label,
  counter,
  counterDanger,
  error,
  helper,
  icon: Icon,
  children,
}: FieldCardProps) {
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-secondary text-[10px] font-bold tabular-nums text-muted-foreground">
            {String(index).padStart(2, "0")}
          </span>
          {Icon ? <Icon className="h-3.5 w-3.5 text-muted-foreground" /> : null}
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </label>
        </div>
        {counter ? (
          <span
            className={`text-[10px] tabular-nums ${
              counterDanger ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {counter}
          </span>
        ) : null}
      </div>
      {children}
      {helper && !error ? (
        <p className="text-[10px] leading-relaxed text-muted-foreground/80">{helper}</p>
      ) : null}
      {error ? <p className="text-[10px] text-destructive">{error}</p> : null}
    </section>
  )
}
