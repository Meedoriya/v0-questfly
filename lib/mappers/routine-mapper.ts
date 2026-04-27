import { asRecord, num, str } from "@/lib/api/json-helpers"
import type { Habit } from "@/lib/types"
import { listRoutinesDaily } from "@/lib/api/routines"

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function mapRepeatTypeToFrequency(
  repeat: string,
): "every-day" | "specific-days" | "x-times-week" {
  const r = repeat.toLowerCase()
  if (r === "daily") return "every-day"
  if (r === "weekly") return "x-times-week"
  if (r === "custom") return "specific-days"
  return "every-day"
}

function mapDaysOfWeekToLabels(days: unknown): string[] | undefined {
  if (!Array.isArray(days) || days.length === 0) return undefined
  return days
    .map((d) => WEEKDAY_LABELS[num(d, 0) % 7])
    .filter(Boolean)
}

export function routineDailyRowToHabit(row: {
  routine: unknown
  is_done: boolean
  xp_awarded: number
}): Habit {
  const r = asRecord(row.routine) || {}
  const repeat = str(r.repeat_type, "daily")
  const freq = mapRepeatTypeToFrequency(repeat)
  const days = mapDaysOfWeekToLabels(r.days_of_week)
  const tw = num(r.times_per_week, 0)

  return {
    id: str(r.id),
    title: str(r.title),
    completed: row.is_done,
    streak: num(r.current_streak, 0),
    icon: "briefcase",
    emoji: str(r.emoji, "") || undefined,
    characteristic: repeat,
    frequency: freq,
    frequencyDays: freq === "specific-days" ? days : undefined,
    frequencyCount: freq === "x-times-week" && tw > 0 ? tw : undefined,
    resetOnSkip: true,
  }
}

export async function fetchDailyHabitsMapped(): Promise<Habit[]> {
  const data = await listRoutinesDaily()
  const rows = Array.isArray(data.routines) ? data.routines : []
  return rows.map(routineDailyRowToHabit)
}
