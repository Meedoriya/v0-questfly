"use client"

import { useEffect, useState } from "react"
import { useApp } from "@/lib/store"
import { createRoutine } from "@/lib/api/routines"
import { habitDraftToCreateRoutine } from "@/lib/mappers/habit-form-to-routine"
import {
  CheckCircle2,
  Flame,
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
  Brain,
  Shield,
  Target,
  Droplets,
  Bike,
} from "lucide-react"

const ICON_MAP: Record<string, React.ElementType> = {
  book: BookOpen,
  dumbbell: Dumbbell,
  code: Code,
  music: Music,
  palette: Palette,
  heart: Heart,
  globe: Globe,
  briefcase: Briefcase,
  graduation: GraduationCap,
  utensils: Utensils,
  brain: Brain,
  shield: Shield,
  target: Target,
  flame: Flame,
  droplets: Droplets,
  bike: Bike,
}

function getCharColor(_name: string) {
  return { text: "text-primary", bg: "bg-primary/10" }
}

function getFreqLabel(f: string, days?: string[], count?: number) {
  if (f === "every-day") return "Every day"
  if (f === "specific-days" && days) return days.join(", ")
  if (f === "x-times-week" && count) return `${count}x per week`
  return f
}

export function HabitConfirmationScreen() {
  const { setScreen, pendingHabit, addHabit, setPendingHabit, refreshHabitsFromApi } = useApp()
  const [showCheck, setShowCheck] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowCheck(true), 300)
    return () => clearTimeout(t)
  }, [])

  if (!pendingHabit) return null

  const HabitIcon = ICON_MAP[pendingHabit.icon] || Heart
  const charColors = getCharColor(pendingHabit.characteristic)

  const handleDone = () => {
    void (async () => {
      const isLocalDraft = pendingHabit.id.startsWith("h-")
      if (isLocalDraft) {
        try {
          await createRoutine(habitDraftToCreateRoutine(pendingHabit))
          setPendingHabit(null)
          refreshHabitsFromApi()
        } catch {
          addHabit(pendingHabit)
        }
      } else {
        addHabit(pendingHabit)
      }
      setScreen("home")
    })()
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      {/* Success check */}
      <div className={`mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 transition-all duration-500 ${showCheck ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}>
        <CheckCircle2 className="h-10 w-10 text-primary" />
      </div>

      <h1 className="mb-2 text-center font-serif text-2xl font-bold text-foreground">
        Habit Created!
      </h1>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        {"Here's how it will appear in your daily list"}
      </p>

      {/* Habit Preview Card */}
      <div className="w-full animate-float-up rounded-2xl border border-primary/20 bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <HabitIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{pendingHabit.title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${charColors.bg} ${charColors.text}`}>
                {pendingHabit.characteristic}
              </span>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] text-muted-foreground">
                {getFreqLabel(pendingHabit.frequency, pendingHabit.frequencyDays, pendingHabit.frequencyCount)}
              </span>
            </div>
          </div>
        </div>

        {/* Streak counter preview */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-streak" />
            <span className="text-sm font-bold text-foreground">0</span>
            <span className="text-xs text-muted-foreground">day streak</span>
          </div>
          {pendingHabit.timeOfDay && (
            <span className="rounded-full bg-card px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {pendingHabit.timeOfDay}
            </span>
          )}
        </div>

        {/* Reset on skip indicator */}
        <div className="mt-3 flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${pendingHabit.resetOnSkip ? "bg-accent" : "bg-primary"}`} />
          <span className="text-[10px] text-muted-foreground">
            {pendingHabit.resetOnSkip ? "Streak resets if you skip" : "Streak pauses if you skip"}
          </span>
        </div>
      </div>

      {/* Done Button */}
      <button
        onClick={handleDone}
        className="mt-8 w-full rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
      >
        Done
      </button>

      <button
        onClick={() => setScreen("add-habit-entry")}
        className="mt-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        Add another habit
      </button>
    </div>
  )
}
