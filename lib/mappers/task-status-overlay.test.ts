import { describe, expect, it } from "vitest"
import { overlayTaskStatuses } from "./campaign-mapper"
import type { Task } from "@/lib/types"

function t(partial: Partial<Task> & Pick<Task, "id" | "title">): Task {
  return {
    context: "",
    instructions: "",
    timeEstimate: "",
    questId: "q",
    questTitle: "",
    day: 1,
    status: "pending",
    ...partial,
  }
}

describe("overlayTaskStatuses", () => {
  it("накладывает статус с current-quest на развёрнутые сабтаски из bundle", () => {
    const base: Task[] = [
      t({
        id: "s1",
        apiSubtaskId: "s1",
        parentTaskId: "t1",
        parentTaskTitle: "Блок A",
        title: "Шаг 1",
      }),
      t({
        id: "s2",
        apiSubtaskId: "s2",
        parentTaskId: "t1",
        parentTaskTitle: "Блок A",
        title: "Шаг 2",
      }),
    ]
    const cq: Task[] = [
      t({
        id: "s1",
        title: "ignored",
        status: "done",
      }),
      t({
        id: "s2",
        title: "ignored",
        status: "active",
      }),
    ]

    const out = overlayTaskStatuses(base, cq)

    expect(out).toHaveLength(2)
    expect(out[0]?.status).toBe("done")
    expect(out[1]?.status).toBe("active")
    expect(out[0]?.parentTaskTitle).toBe("Блок A")
    expect(out[1]?.title).toBe("Шаг 2")
  })

  it("сопоставляет по apiSubtaskId если id в current-quest другой", () => {
    const base: Task[] = [
      t({
        id: "sub-uuid",
        apiSubtaskId: "sub-uuid",
        title: "Leaf",
      }),
    ]
    const cq: Task[] = [
      t({
        id: "different",
        apiSubtaskId: "sub-uuid",
        title: "Leaf",
        status: "done",
      }),
    ]

    const out = overlayTaskStatuses(base, cq)
    expect(out[0]?.status).toBe("done")
  })
})
