import { describe, expect, it } from "vitest"
import { mapFriendsResponse } from "@/lib/mappers/friend-mapper"

describe("mapFriendsResponse", () => {
  it("возвращает [] при невалидном теле", () => {
    expect(mapFriendsResponse(null)).toEqual([])
    expect(mapFriendsResponse({})).toEqual([])
    expect(mapFriendsResponse({ friends: "bad" })).toEqual([])
  })

  it("парсит валидную запись со всеми полями", () => {
    const raw = {
      friends: [
        {
          id: "u1",
          name: "Alex",
          avatar_url: "https://cdn/a.jpg?v=1",
          kind: "completed_quest",
          payload: { quest_id: "q1", quest_title: "Get fit" },
          quest_label: "Get fit",
          characteristic: "discipline",
          happened_at: "2026-06-05T19:51:00Z",
        },
      ],
    }
    expect(mapFriendsResponse(raw)).toEqual([
      {
        id: "u1",
        name: "Alex",
        avatarUrl: "https://cdn/a.jpg?v=1",
        kind: "completed_quest",
        payload: { quest_id: "q1", quest_title: "Get fit" },
        questLabel: "Get fit",
        characteristic: "discipline",
        happenedAt: "2026-06-05T19:51:00Z",
      },
    ])
  })

  it("отбрасывает записи с неизвестным kind или без id/name", () => {
    const raw = {
      friends: [
        { id: "", name: "Alex", kind: "completed_quest", happened_at: "x" },
        { id: "u1", name: "", kind: "completed_quest", happened_at: "x" },
        { id: "u1", name: "Alex", kind: "unknown_kind", happened_at: "x" },
        { id: "u2", name: "Bob", kind: "leveled_up", happened_at: "x" },
      ],
    }
    const result = mapFriendsResponse(raw)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("u2")
  })

  it("null avatar_url, characteristic, quest_label — допустимы", () => {
    const raw = {
      friends: [
        {
          id: "u1",
          name: "Alex",
          avatar_url: null,
          kind: "leveled_up",
          payload: {},
          quest_label: null,
          characteristic: null,
          happened_at: "2026-06-05T19:51:00Z",
        },
      ],
    }
    const result = mapFriendsResponse(raw)
    expect(result[0].avatarUrl).toBeNull()
    expect(result[0].characteristic).toBeNull()
    expect(result[0].questLabel).toBeNull()
  })
})
