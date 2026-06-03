import type { CreateRoutinePayload } from "@/lib/api/routines"
import type { Habit } from "@/lib/types"

const WEEKDAY_TO_API: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

const ICON_EMOJI: Record<string, string> = {
  book: "📚",
  dumbbell: "💪",
  code: "💻",
  music: "🎵",
  palette: "🎨",
  heart: "❤️",
  globe: "🌍",
  briefcase: "💼",
  graduation: "🎓",
  utensils: "🍽️",
  brain: "🧠",
  shield: "🛡️",
  target: "🎯",
  flame: "🔥",
  droplets: "💧",
  bike: "🚲",
}

/** Маппинг черновика привычки из UI в тело POST /routines. */
export function habitDraftToCreateRoutine(h: Habit): CreateRoutinePayload {
  const emoji = ICON_EMOJI[h.icon] ?? "⭐"
  let repeat_type: CreateRoutinePayload["repeat_type"] = "daily"
  let times_per_week: number | undefined
  let days_of_week: number[] | undefined

  if (h.frequency === "every-day") {
    repeat_type = "daily"
  } else if (h.frequency === "x-times-week") {
    repeat_type = "weekly"
    times_per_week = h.frequencyCount ?? 3
  } else {
    repeat_type = "custom"
    const mapped = (h.frequencyDays ?? [])
      .map((d) => WEEKDAY_TO_API[d])
      .filter((n): n is number => typeof n === "number")
    days_of_week = mapped.length > 0 ? mapped : [1, 2, 3, 4, 5]
  }

  // reminder_enabled выводим из наличия времени, если флаг явно не задан.
  const reminder_enabled = h.reminderEnabled ?? Boolean(h.timeOfDay)

  return {
    emoji,
    title: h.title,
    // notes/duration/xp пока без инпутов в форме — дефолты, если черновик их не несёт.
    notes: h.notes ?? "",
    duration_minutes: h.durationMinutes ?? 15,
    xp_reward: h.xpReward ?? 10,
    repeat_type,
    times_per_week,
    days_of_week,
    // characteristic — ось жизни (AxisKey); бэк отвергнет неизвестную строку (400).
    characteristic: h.characteristic || undefined,
    time_of_day: reminder_enabled ? h.timeOfDay ?? null : null,
    reminder_enabled,
    reset_on_skip: h.resetOnSkip,
    // форма знает только квест; campaign_id бэк выводит из связи сам.
    quest_id: h.linkedQuestId ?? null,
  }
}
