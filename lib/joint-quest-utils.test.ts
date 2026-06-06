import { describe, expect, it } from "vitest"
import {
  daysLeftFromDeadline,
  findOpponent,
  findPlayer,
  findPlayerByUserId,
  formatDeadline,
  isAwaitingRegistration,
} from "@/lib/joint-quest-utils"
import type { JointPlayer, JointQuest } from "@/lib/types"

const mkPlayer = (over: Partial<JointPlayer>): JointPlayer => ({
  userId: "u1",
  role: "creator",
  acceptedAt: null,
  progress: 0,
  totalTasks: 12,
  rankPoints: 0,
  rankIncrease: 0,
  longestStreak: 0,
  failedTasks: 0,
  impactScore: 0,
  roadmapPreview: [],
  completedToday: false,
  todayImpactValue: null,
  name: "",
  avatarUrl: null,
  ...over,
})

const mkQuest = (over: Partial<JointQuest>): JointQuest => ({
  id: "q1",
  title: "Test",
  description: "",
  deadline: "2026-12-31",
  status: "active",
  totalTasks: 12,
  winnerUserId: null,
  completedAt: null,
  myCompletedToday: false,
  players: [mkPlayer({ role: "creator" }), mkPlayer({ userId: "u2", role: "invitee" })],
  ...over,
})

describe("daysLeftFromDeadline", () => {
  it("сегодня = deadline → 0", () => {
    const now = new Date("2026-06-06T15:00:00Z")
    expect(daysLeftFromDeadline("2026-06-06", now)).toBe(0)
  })

  it("завтра deadline → 1", () => {
    const now = new Date("2026-06-06T23:59:00Z")
    expect(daysLeftFromDeadline("2026-06-07", now)).toBe(1)
  })

  it("дедлайн прошёл → отрицательное", () => {
    const now = new Date("2026-06-06T00:00:00Z")
    expect(daysLeftFromDeadline("2026-06-04", now)).toBe(-2)
  })

  it("ровно неделя", () => {
    const now = new Date("2026-06-06T05:00:00Z")
    expect(daysLeftFromDeadline("2026-06-13", now)).toBe(7)
  })

  it("пустая строка / битый ISO → 0", () => {
    expect(daysLeftFromDeadline("")).toBe(0)
    expect(daysLeftFromDeadline("not-a-date")).toBe(0)
  })
})

describe("formatDeadline", () => {
  it("ISO → Mar 30, 2026", () => {
    expect(formatDeadline("2026-03-30")).toBe("Mar 30, 2026")
  })

  it("битый ISO возвращается как есть", () => {
    expect(formatDeadline("xx")).toBe("xx")
    expect(formatDeadline("")).toBe("")
  })
})

describe("find helpers", () => {
  const q = mkQuest({})

  it("findPlayer по role", () => {
    expect(findPlayer(q, "creator")?.userId).toBe("u1")
    expect(findPlayer(q, "invitee")?.userId).toBe("u2")
  })

  it("findPlayerByUserId", () => {
    expect(findPlayerByUserId(q, "u2")?.role).toBe("invitee")
    expect(findPlayerByUserId(q, "ghost")).toBeNull()
  })

  it("findOpponent — игрок ≠ meUserId", () => {
    expect(findOpponent(q, "u1")?.userId).toBe("u2")
    expect(findOpponent(q, "u2")?.userId).toBe("u1")
  })
})

describe("isAwaitingRegistration", () => {
  it("pending_accept + один игрок → true", () => {
    expect(
      isAwaitingRegistration(
        mkQuest({ status: "pending_accept", players: [mkPlayer({})] }),
      ),
    ).toBe(true)
  })

  it("active не считается awaiting независимо от длины", () => {
    expect(
      isAwaitingRegistration(mkQuest({ status: "active", players: [mkPlayer({})] })),
    ).toBe(false)
  })

  it("pending_accept с двумя игроками — нет, invitee уже привязан", () => {
    expect(isAwaitingRegistration(mkQuest({ status: "pending_accept" }))).toBe(false)
  })
})
