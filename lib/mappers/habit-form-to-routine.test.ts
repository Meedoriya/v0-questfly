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
})
