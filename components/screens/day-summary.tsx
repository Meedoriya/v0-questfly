"use client"

import { useApp } from "@/lib/store"
import {
  CheckCircle2,
  XCircle,
  Crown,
  Flame,
  ArrowRight,
  Sword,
  BookOpen,
  Dumbbell,
  Code,
  Music,
  Palette,
  Heart,
  Globe,
  Briefcase,
  GraduationCap,
  Utensils,
  ArrowRightLeft,
  Skull,
} from "lucide-react"

function getTaskIcon(title: string): React.ElementType {
  const t = title.toLowerCase()
  if (t.includes("read") || t.includes("learn") || t.includes("book")) return BookOpen
  if (t.includes("exercise") || t.includes("workout") || t.includes("run") || t.includes("gym")) return Dumbbell
  if (t.includes("code") || t.includes("program") || t.includes("build")) return Code
  if (t.includes("music") || t.includes("instrument")) return Music
  if (t.includes("draw") || t.includes("paint") || t.includes("design")) return Palette
  if (t.includes("meditat") || t.includes("health") || t.includes("mindful")) return Heart
  if (t.includes("language") || t.includes("spanish") || t.includes("vocab")) return Globe
  if (t.includes("work") || t.includes("project") || t.includes("email")) return Briefcase
  if (t.includes("study") || t.includes("course") || t.includes("exam")) return GraduationCap
  if (t.includes("cook") || t.includes("meal") || t.includes("diet")) return Utensils
  return Sword
}

export function DaySummaryScreen() {
  const { quests, habits, userProgress, setScreen } = useApp()

  const todaysTasks = quests.flatMap((q) =>
    q.tasks.slice(0, 3).map((t) => ({ ...t, questTitle: q.title }))
  )

  const allTasksDone = todaysTasks.every((t) => t.status === "done")
  const allHabitsDone = habits.every((h) => h.completed)
  const megaStreakIntact = allTasksDone && allHabitsDone

  return (
    <div className="flex min-h-dvh flex-col px-6 pb-8 pt-12">
      {/* Mega Streak Badge */}
      <div className="flex flex-col items-center gap-2 mb-8">
        <div
          className={`flex h-20 w-20 items-center justify-center rounded-full border-[3px] ${
            megaStreakIntact
              ? "border-streak bg-streak/15 animate-gold-glow"
              : "border-border bg-secondary/50"
          }`}
        >
          <Crown
            className={`h-10 w-10 ${megaStreakIntact ? "text-streak" : "text-muted-foreground/40"}`}
          />
        </div>
        <div className="text-center">
          <p className={`text-3xl font-bold ${megaStreakIntact ? "text-streak" : "text-muted-foreground"}`}>
            {userProgress.megaStreak || 1}
          </p>
          <p className={`text-xs ${megaStreakIntact ? "text-streak/70" : "text-muted-foreground"}`}>
            {megaStreakIntact ? "Mega Streak Intact" : "Mega Streak Broken"}
          </p>
        </div>
      </div>

      {/* Tasks Section */}
      <section className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tasks</h2>
        <div className="flex flex-col gap-2">
          {todaysTasks.map((task) => {
            const Icon = getTaskIcon(task.title)
            const isDone = task.status === "done"
            const isTransferred = task.status === "transferred"
            const isFailed = task.status === "failed"

            return (
              <div
                key={task.id}
                className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${
                  isDone
                    ? "border-primary/20 bg-primary/5"
                    : isFailed
                      ? "border-destructive/30 bg-destructive/5"
                      : isTransferred
                        ? "border-border bg-secondary/30 opacity-70"
                        : "border-destructive/30 bg-destructive/5"
                }`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  isDone ? "bg-primary/15" : isFailed ? "bg-destructive/15" : isTransferred ? "bg-secondary" : "bg-destructive/10"
                }`}>
                  {isFailed ? (
                    <Skull className="h-4 w-4 text-destructive" />
                  ) : isTransferred ? (
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Icon className={`h-4 w-4 ${isDone ? "text-primary" : "text-destructive"}`} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-medium ${
                    isDone ? "text-foreground" : isFailed ? "text-destructive" : isTransferred ? "text-muted-foreground" : "text-foreground"
                  }`}>
                    {task.title}
                  </p>
                  {isTransferred && (
                    <p className="text-[10px] text-muted-foreground">Transferred to tomorrow</p>
                  )}
                  {isFailed && task.failCount !== undefined && (
                    <p className="text-[10px] text-destructive">
                      Failed: {task.failCount}/{task.failTotal}
                    </p>
                  )}
                  {!isDone && !isTransferred && !isFailed && (
                    <p className="text-[10px] text-muted-foreground">{task.questTitle}</p>
                  )}
                </div>
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                ) : isFailed ? (
                  <Skull className="h-4 w-4 shrink-0 text-destructive" />
                ) : isTransferred ? (
                  <ArrowRightLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <XCircle className="h-5 w-5 shrink-0 text-destructive" />
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Habits Section */}
      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Habits</h2>
        <div className="flex flex-col gap-2">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className={`flex items-center gap-3 rounded-xl border p-4 ${
                habit.completed
                  ? "border-primary/20 bg-primary/5"
                  : "border-destructive/30 bg-destructive/5"
              }`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                habit.completed ? "bg-primary/15" : "bg-destructive/10"
              }`}>
                {habit.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{habit.title}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Flame className="h-3 w-3 text-streak" />
                  <span className="text-[10px] text-muted-foreground">{habit.streak} day streak</span>
                </div>
              </div>
              {habit.completed ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
              ) : (
                <XCircle className="h-5 w-5 shrink-0 text-destructive" />
              )}
            </div>
          ))}
        </div>
      </section>

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
