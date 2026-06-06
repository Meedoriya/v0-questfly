import { describe, expect, it } from "vitest"
import { mapJointQuest, mapJointQuestsList } from "@/lib/mappers/joint-quest-mapper"

const validPlayerRaw = {
  user_id: "u1",
  role: "creator",
  accepted_at: "2026-06-06T09:12:33Z",
  progress: 5,
  total_tasks: 12,
  rank_points: 0,
  rank_increase: 0,
  longest_streak: 5,
  failed_tasks: 0,
  impact_score: 145,
  roadmap_preview: ["Step 1", "Step 2"],
  completed_today: true,
  today_impact_value: "30 pages",
}

const validQuestRaw = {
  id: "q1",
  title: "Read 12 Books Together",
  description: "shared reading goal",
  deadline: "2026-12-31",
  status: "active",
  total_tasks: 12,
  winner_user_id: null,
  completed_at: null,
  players: [
    validPlayerRaw,
    { ...validPlayerRaw, user_id: "u2", role: "invitee", roadmap_preview: ["A", "B"] },
  ],
}

describe("mapJointQuest", () => {
  it("парсит валидный snapshot полностью", () => {
    const jq = mapJointQuest(validQuestRaw)
    expect(jq).not.toBeNull()
    expect(jq!.id).toBe("q1")
    expect(jq!.status).toBe("active")
    expect(jq!.players).toHaveLength(2)
    expect(jq!.players[0]).toMatchObject({
      userId: "u1",
      role: "creator",
      progress: 5,
      rankPoints: 0,
      impactScore: 145,
      completedToday: true,
      todayImpactValue: "30 pages",
    })
    expect(jq!.players[1].role).toBe("invitee")
  })

  it("возвращает null при отсутствии id или невалидном status", () => {
    expect(mapJointQuest(null)).toBeNull()
    expect(mapJointQuest({})).toBeNull()
    expect(mapJointQuest({ id: "q1", status: "wat" })).toBeNull()
    expect(mapJointQuest({ id: "", status: "active" })).toBeNull()
  })

  it("отбрасывает игроков с неизвестной role или без user_id", () => {
    const raw = {
      ...validQuestRaw,
      players: [
        { ...validPlayerRaw, role: "spectator" },
        { ...validPlayerRaw, user_id: "" },
        { ...validPlayerRaw, user_id: "u3", role: "creator" },
      ],
    }
    const jq = mapJointQuest(raw)
    expect(jq!.players).toHaveLength(1)
    expect(jq!.players[0].userId).toBe("u3")
  })

  it("корректно парсит email-pending (1 игрок)", () => {
    const raw = { ...validQuestRaw, status: "pending_accept", players: [validPlayerRaw] }
    const jq = mapJointQuest(raw)
    expect(jq!.players).toHaveLength(1)
    expect(jq!.status).toBe("pending_accept")
  })

  it("читает все 5 статусов", () => {
    for (const s of ["pending_accept", "active", "completed", "failed", "declined"] as const) {
      const jq = mapJointQuest({ ...validQuestRaw, status: s })
      expect(jq!.status).toBe(s)
    }
  })

  it("null допустим для accepted_at, winner_user_id, completed_at, today_impact_value", () => {
    const raw = {
      ...validQuestRaw,
      winner_user_id: null,
      completed_at: null,
      players: [{ ...validPlayerRaw, accepted_at: null, today_impact_value: null }],
    }
    const jq = mapJointQuest(raw)
    expect(jq!.winnerUserId).toBeNull()
    expect(jq!.completedAt).toBeNull()
    expect(jq!.players[0].acceptedAt).toBeNull()
    expect(jq!.players[0].todayImpactValue).toBeNull()
  })

  it("roadmap_preview без не-строк отфильтрован", () => {
    const raw = {
      ...validQuestRaw,
      players: [{ ...validPlayerRaw, roadmap_preview: ["ok", 42, null, "ok2"] }],
    }
    const jq = mapJointQuest(raw)
    expect(jq!.players[0].roadmapPreview).toEqual(["ok", "ok2"])
  })

  it("name/avatar_url опциональны, дефолты «» / null", () => {
    const jq = mapJointQuest(validQuestRaw)
    expect(jq!.players[0].name).toBe("")
    expect(jq!.players[0].avatarUrl).toBeNull()
    const raw = {
      ...validQuestRaw,
      players: [{ ...validPlayerRaw, name: "Alex", avatar_url: "https://x.jpg" }],
    }
    const jq2 = mapJointQuest(raw)
    expect(jq2!.players[0].name).toBe("Alex")
    expect(jq2!.players[0].avatarUrl).toBe("https://x.jpg")
  })
})

describe("mapJointQuestsList", () => {
  it("возвращает [] при невалидном теле", () => {
    expect(mapJointQuestsList(null)).toEqual([])
    expect(mapJointQuestsList({})).toEqual([])
    expect(mapJointQuestsList({ joint_quests: "no" })).toEqual([])
  })

  it("отбрасывает битые элементы", () => {
    const raw = {
      joint_quests: [
        validQuestRaw,
        { id: "", status: "active" },
        { ...validQuestRaw, id: "q2" },
      ],
    }
    const list = mapJointQuestsList(raw)
    expect(list).toHaveLength(2)
    expect(list.map((q) => q.id)).toEqual(["q1", "q2"])
  })
})
