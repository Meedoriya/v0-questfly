import { describe, expect, it } from "vitest"
import { mapActivityResponse } from "@/lib/mappers/activity-mapper"

describe("mapActivityResponse", () => {
  it("возвращает [] при невалидном теле", () => {
    expect(mapActivityResponse(null)).toEqual([])
    expect(mapActivityResponse({})).toEqual([])
    expect(mapActivityResponse({ days: "bad" })).toEqual([])
  })

  it("парсит дни с date/count/intensity", () => {
    const raw = {
      days: [
        { date: "2026-03-08", completed_tasks_count: 0, intensity: 0 },
        { date: "2026-03-09", completed_tasks_count: 3, intensity: 2 },
        { date: "2026-03-10", completed_tasks_count: 7, intensity: 4 },
      ],
    }
    expect(mapActivityResponse(raw)).toEqual([
      { date: "2026-03-08", count: 0, intensity: 0 },
      { date: "2026-03-09", count: 3, intensity: 2 },
      { date: "2026-03-10", count: 7, intensity: 4 },
    ])
  })

  it("клампит intensity вне диапазона 0..4", () => {
    const raw = {
      days: [
        { date: "2026-03-08", completed_tasks_count: 0, intensity: -1 },
        { date: "2026-03-09", completed_tasks_count: 99, intensity: 9 },
      ],
    }
    const result = mapActivityResponse(raw)
    expect(result[0].intensity).toBe(0)
    expect(result[1].intensity).toBe(4)
  })

  it("пропускает записи без date", () => {
    const raw = {
      days: [
        { date: "2026-03-08", completed_tasks_count: 1, intensity: 1 },
        { completed_tasks_count: 5, intensity: 2 },
        null,
      ],
    }
    expect(mapActivityResponse(raw)).toHaveLength(1)
  })
})
