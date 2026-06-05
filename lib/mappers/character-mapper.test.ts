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

  it("читает level_progress/next_level_xp/current_level_name из формы /auth/me (внутри character)", () => {
    const prev = minimalUserProgress()
    const raw = {
      character: {
        total_xp: 100,
        level: 2,
        streak: 3,
        level_progress: { progress_percent: 60 },
        next_level_xp: 250,
        current_level_name: "Hero",
      },
    }
    const next = patchUserProgressFromCharacterGet(prev, raw)
    expect(next.levelProgressPercent).toBe(60)
    expect(next.nextLevelXp).toBe(250)
    expect(next.currentLevelName).toBe("Hero")
  })

  it("парсит avatar_url, bio, active_days_count и week_activity", () => {
    const prev = minimalUserProgress({ avatarUrl: "old", bio: "old", activeDaysCount: 1 })
    const raw = {
      character: {
        total_xp: 0,
        level: 1,
        streak: 0,
        avatar_url: "https://cdn/x.jpg?v=1",
        bio: "I level up",
        active_days_count: 47,
        week_activity: [
          { date: "2026-05-30", active: false },
          { date: "2026-05-31", active: true },
          { date: "2026-06-01", active: true },
          { date: "2026-06-02", active: false },
          { date: "2026-06-03", active: true },
          { date: "2026-06-04", active: true },
          { date: "2026-06-05", active: true },
        ],
      },
    }
    const next = patchUserProgressFromCharacterGet(prev, raw)
    expect(next.avatarUrl).toBe("https://cdn/x.jpg?v=1")
    expect(next.bio).toBe("I level up")
    expect(next.activeDaysCount).toBe(47)
    expect(next.weekActivity).toEqual([false, true, true, false, true, true, true])
  })

  it("различает null и отсутствие поля для avatar_url/bio", () => {
    const prev = minimalUserProgress({ avatarUrl: "kept", bio: "kept" })
    const rawWithNull = {
      character: { total_xp: 0, level: 1, streak: 0, avatar_url: null, bio: null },
    }
    const next = patchUserProgressFromCharacterGet(prev, rawWithNull)
    expect(next.avatarUrl).toBeNull()
    expect(next.bio).toBeNull()

    const rawMissing = { character: { total_xp: 0, level: 1, streak: 0 } }
    const same = patchUserProgressFromCharacterGet(prev, rawMissing)
    expect(same.avatarUrl).toBe("kept")
    expect(same.bio).toBe("kept")
  })

  it("игнорирует week_activity если длина не 7", () => {
    const prev = minimalUserProgress({ weekActivity: [true, true, true, true, true, true, true] })
    const raw = {
      character: {
        total_xp: 0,
        level: 1,
        streak: 0,
        week_activity: [{ date: "x", active: true }],
      },
    }
    const next = patchUserProgressFromCharacterGet(prev, raw)
    expect(next.weekActivity).toEqual(prev.weekActivity)
  })
})
