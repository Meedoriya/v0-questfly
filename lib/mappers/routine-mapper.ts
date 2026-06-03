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
  const timeOfDay = str(r.time_of_day, "") || undefined

  return {
    id: str(r.id),
    title: str(r.title),
    completed: row.is_done,
    streak: num(r.current_streak, 0),
    icon: "briefcase",
    emoji: str(r.emoji, "") || undefined,
    // ось жизни с бэка (раньше сюда ошибочно писался repeat_type).
    characteristic: str(r.characteristic, ""),
    frequency: freq,
    frequencyDays: freq === "specific-days" ? days : undefined,
    frequencyCount: freq === "x-times-week" && tw > 0 ? tw : undefined,
    timeOfDay,
    reminderEnabled: r.reminder_enabled === true,
    resetOnSkip: r.reset_on_skip !== false,
    notes: str(r.notes, "") || undefined,
    durationMinutes: num(r.duration_minutes, 0) || undefined,
    xpReward: num(r.xp_reward, 0) || undefined,
    linkedQuestId: str(r.quest_id, "") || undefined,
  }
}

/**
 * AI-подсказка (сырой routine-черновик с бэка) → локальный черновик Habit.
 * `id` синтетический (`h-…`), чтобы handleDone в confirmation ушёл по пути createRoutine.
 */
export function aiSuggestionToHabitDraft(raw: unknown, index = 0): Habit {
  const r = asRecord(raw) || {}
  const repeat = str(r.repeat_type, "daily")
  const freq = mapRepeatTypeToFrequency(repeat)
  const days = mapDaysOfWeekToLabels(r.days_of_week)
  const tw = num(r.times_per_week, 0)
  const timeOfDay = str(r.time_of_day, "") || undefined

  return {
    id: `h-${Date.now()}-${index}`,
    title: str(r.title),
    completed: false,
    streak: 0,
    icon: "heart",
    emoji: str(r.emoji, "") || undefined,
    characteristic: str(r.characteristic, ""),
    frequency: freq,
    frequencyDays: freq === "specific-days" ? days : undefined,
    frequencyCount: freq === "x-times-week" && tw > 0 ? tw : undefined,
    timeOfDay,
    reminderEnabled: r.reminder_enabled === true || Boolean(timeOfDay),
    resetOnSkip: r.reset_on_skip !== false,
    notes: str(r.notes, "") || undefined,
    durationMinutes: num(r.duration_minutes, 0) || undefined,
    xpReward: num(r.xp_reward, 0) || undefined,
  }
}

export async function fetchDailyHabitsMapped(): Promise<Habit[]> {
  const data = await listRoutinesDaily()
  const rows = Array.isArray(data.routines) ? data.routines : []
  return rows.map(routineDailyRowToHabit)
}
