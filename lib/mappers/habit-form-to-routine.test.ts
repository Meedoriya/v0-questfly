import { describe, expect, it } from "vitest"
import { habitDraftToCreateRoutine } from "@/lib/mappers/habit-form-to-routine"
import { minimalHabit } from "@/lib/test/fixtures"

describe("habitDraftToCreateRoutine", () => {
  it("every-day → daily", () => {
    const p = habitDraftToCreateRoutine(minimalHabit({ frequency: "every-day", icon: "heart" }))
    expect(p.repeat_type).toBe("daily")
    expect(p.emoji).toBe("❤️")
    expect(p.times_per_week).toBeUndefined()
    expect(p.days_of_week).toBeUndefined()
  })

  it("x-times-week → weekly + times_per_week", () => {
    const p = habitDraftToCreateRoutine(
      minimalHabit({ frequency: "x-times-week", frequencyCount: 4 }),
    )
    expect(p.repeat_type).toBe("weekly")
    expect(p.times_per_week).toBe(4)
  })

  it("specific-days → custom + days_of_week (0=Sun)", () => {
    const p = habitDraftToCreateRoutine(
      minimalHabit({
        frequency: "specific-days",
        frequencyDays: ["Mon", "Wed", "Sun"],
      }),
    )
    expect(p.repeat_type).toBe("custom")
    expect(p.days_of_week).toEqual([1, 3, 0])
  })

  it("specific-days без дней → будни по умолчанию", () => {
    const p = habitDraftToCreateRoutine(
      minimalHabit({ frequency: "specific-days", frequencyDays: [] }),
    )
    expect(p.days_of_week).toEqual([1, 2, 3, 4, 5])
  })

  it("неизвестная иконка → ⭐", () => {
    const p = habitDraftToCreateRoutine(minimalHabit({ icon: "unknown-icon-id" }))
    expect(p.emoji).toBe("⭐")
  })

  it("пробрасывает characteristic / reset_on_skip / quest_id", () => {
    const p = habitDraftToCreateRoutine(
      minimalHabit({ characteristic: "growth", resetOnSkip: false, linkedQuestId: "q-42" }),
    )
    expect(p.characteristic).toBe("growth")
    expect(p.reset_on_skip).toBe(false)
    expect(p.quest_id).toBe("q-42")
  })

  it("reminder включён → time_of_day сохраняется", () => {
    const p = habitDraftToCreateRoutine(
      minimalHabit({ timeOfDay: "07:00", reminderEnabled: true }),
    )
    expect(p.reminder_enabled).toBe(true)
    expect(p.time_of_day).toBe("07:00")
  })

  it("reminder выключен → time_of_day = null", () => {
    const p = habitDraftToCreateRoutine(
      minimalHabit({ timeOfDay: "07:00", reminderEnabled: false }),
    )
    expect(p.reminder_enabled).toBe(false)
    expect(p.time_of_day).toBeNull()
  })

  it("нет linkedQuestId → quest_id = null", () => {
    const p = habitDraftToCreateRoutine(minimalHabit({ linkedQuestId: undefined }))
    expect(p.quest_id).toBeNull()
  })
})
