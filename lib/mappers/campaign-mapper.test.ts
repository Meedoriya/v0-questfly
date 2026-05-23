import { describe, expect, it } from "vitest"
import {
  mapCampaignBundleToWrappedQuest,
  mapCurrentQuestResponse,
} from "./campaign-mapper"

function makeSubtask(id: string, sortOrder: number, completed: boolean) {
  return {
    id,
    title: `Subtask ${id}`,
    sort_order: sortOrder,
    completed,
    estimated_minutes: 10,
  }
}

function makeTaskData(
  id: string,
  sortOrder: number,
  completed: boolean,
  subtasks: ReturnType<typeof makeSubtask>[],
) {
  return {
    id,
    title: `Task ${id}`,
    description: `desc ${id}`,
    sort_order: sortOrder,
    completed,
    estimated_minutes: 20,
    subtasks,
  }
}

function makeQuest(id: string, title: string, status: string) {
  return { id, title, status }
}

describe("mapCurrentQuestResponse", () => {
  it("gates subtasks: done before pointer, active at pointer (parallel), pending after", () => {
    const tasks = [
      makeTaskData("t1", 1, false, [
        makeSubtask("t1s1", 1, false),
        makeSubtask("t1s2", 2, false),
      ]),
      makeTaskData("t2", 2, false, [
        makeSubtask("t2s1", 1, false),
        makeSubtask("t2s2", 2, false),
      ]),
      makeTaskData("t3", 3, false, [
        makeSubtask("t3s1", 1, false),
        makeSubtask("t3s2", 2, false),
      ]),
    ]
    const quest = makeQuest("q1", "Quest", "active")

    const out = mapCurrentQuestResponse(
      { quest, tasks },
      "camp-1",
      "fallback",
      "t2",
    )

    expect(out.tasks).toHaveLength(6)
    const byId = (id: string) => out.tasks.find((t) => t.id === id)!
    expect(byId("t1s1").status).toBe("done")
    expect(byId("t1s2").status).toBe("done")
    expect(byId("t2s1").status).toBe("active")
    expect(byId("t2s2").status).toBe("active")
    expect(byId("t3s1").status).toBe("pending")
    expect(byId("t3s2").status).toBe("pending")
  })

  it("currentTaskId null + quest.status completed → all subtasks done", () => {
    const tasks = [
      makeTaskData("t1", 1, false, [makeSubtask("t1s1", 1, false)]),
      makeTaskData("t2", 2, true, [makeSubtask("t2s1", 1, true)]),
      makeTaskData("t3", 3, false, [makeSubtask("t3s1", 1, false)]),
    ]
    const quest = makeQuest("q1", "Quest", "completed")

    const out = mapCurrentQuestResponse(
      { quest, tasks },
      "camp-1",
      "fallback",
      null,
    )

    expect(out.tasks).toHaveLength(3)
    for (const t of out.tasks) {
      expect(t.status).toBe("done")
    }
  })

  it("currentTaskId null + quest active → walks sort_order using completed flag", () => {
    const tasks = [
      makeTaskData("t1", 1, true, [makeSubtask("t1s1", 1, true)]),
      makeTaskData("t2", 2, false, [makeSubtask("t2s1", 1, false)]),
      makeTaskData("t3", 3, false, [makeSubtask("t3s1", 1, false)]),
    ]
    const quest = makeQuest("q1", "Quest", "active")

    const out = mapCurrentQuestResponse(
      { quest, tasks },
      "camp-1",
      "fallback",
      null,
    )

    const byId = (id: string) => out.tasks.find((t) => t.id === id)!
    expect(byId("t1s1").status).toBe("done")
    expect(byId("t2s1").status).toBe("active")
    expect(byId("t3s1").status).toBe("pending")
  })

  it("empty subtasks → synthetic Task uses gate", () => {
    const tasks = [
      makeTaskData("t1", 1, false, []),
      makeTaskData("t2", 2, false, []),
      makeTaskData("t3", 3, false, []),
    ]
    const quest = makeQuest("q1", "Quest", "active")

    const out = mapCurrentQuestResponse(
      { quest, tasks },
      "camp-1",
      "fallback",
      "t2",
    )

    expect(out.tasks).toHaveLength(3)
    const byId = (id: string) => out.tasks.find((t) => t.id === id)!
    expect(byId("t1").status).toBe("done")
    expect(byId("t2").status).toBe("active")
    expect(byId("t3").status).toBe("pending")
  })

  it("currentTaskId not found → falls back to walk-by-sort_order", () => {
    const tasks = [
      makeTaskData("t1", 1, true, [makeSubtask("t1s1", 1, true)]),
      makeTaskData("t2", 2, false, [makeSubtask("t2s1", 1, false)]),
      makeTaskData("t3", 3, false, [makeSubtask("t3s1", 1, false)]),
    ]
    const quest = makeQuest("q1", "Quest", "active")

    const out = mapCurrentQuestResponse(
      { quest, tasks },
      "camp-1",
      "fallback",
      "nonexistent",
    )

    const byId = (id: string) => out.tasks.find((t) => t.id === id)!
    expect(byId("t1s1").status).toBe("done")
    expect(byId("t2s1").status).toBe("active")
    expect(byId("t3s1").status).toBe("pending")
  })
})

describe("mapCampaignBundleToWrappedQuest", () => {
  it("walks sort_order for an active quest (no pointer branch)", () => {
    const bundle = {
      campaign: { id: "camp-1", goal_text: "Goal" },
      quests: [
        {
          quest: { id: "q1", title: "Q1", status: "active", quest_number: 1 },
          tasks: [
            makeTaskData("t1", 1, true, [makeSubtask("t1s1", 1, false)]),
            makeTaskData("t2", 2, false, [makeSubtask("t2s1", 1, false)]),
          ],
        },
      ],
    }

    const wrapped = mapCampaignBundleToWrappedQuest(bundle)

    expect(wrapped.tasks).toHaveLength(2)
    const byId = (id: string) => wrapped.tasks.find((t) => t.id === id)!
    expect(byId("t1s1").status).toBe("done")
    expect(byId("t2s1").status).toBe("active")
    expect(wrapped.milestones).toHaveLength(1)
    expect(wrapped.milestones![0].status).toBe("active")
  })
})
