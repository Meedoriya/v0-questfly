import { describe, expect, it } from "vitest"
import { patchUserProgressFromCharacterGet } from "@/lib/mappers/character-mapper"
import { minimalUserProgress } from "@/lib/test/fixtures"

describe("patchUserProgressFromCharacterGet", () => {
  it("возвращает prev при невалидном теле", () => {
    const prev = minimalUserProgress({ xp: 5 })
    expect(patchUserProgressFromCharacterGet(prev, null)).toBe(prev)
    expect(patchUserProgressFromCharacterGet(prev, {})).toBe(prev)
    expect(patchUserProgressFromCharacterGet(prev, { character: "bad" })).toBe(prev)
  })

  it("накладывает xp, level, streak и метаданные уровня", () => {
    const prev = minimalUserProgress({
      xp: 1,
      level: 1,
      megaStreak: 0,
      levelProgressPercent: 10,
      currentLevelName: "Old",
      nextLevelXp: 99,
    })
    const raw = {
      character: {
        total_xp: 420,
        level: 7,
        streak: 12,
      },
      level_progress: {
        progress_percent: 45.5,
      },
      next_level_xp: 500,
      current_level_name: "Runner",
    }
    const next = patchUserProgressFromCharacterGet(prev, raw)
    expect(next.xp).toBe(420)
    expect(next.level).toBe(7)
    expect(next.megaStreak).toBe(12)
    expect(next.levelProgressPercent).toBe(45.5)
    expect(next.nextLevelXp).toBe(500)
    expect(next.currentLevelName).toBe("Runner")
    expect(next.characteristics).toEqual(prev.characteristics)
  })

  it("сохраняет прежние level_progress поля если в ответе нет level_progress", () => {
    const prev = minimalUserProgress({ levelProgressPercent: 33 })
    const raw = {
      character: { total_xp: 1, level: 1, streak: 1 },
      next_level_xp: 100,
      current_level_name: "",
    }
    const next = patchUserProgressFromCharacterGet(prev, raw)
    expect(next.levelProgressPercent).toBe(33)
  })
})
