import { asRecord, num, str } from "@/lib/api/json-helpers"
import type { Quest, QuestMilestone, Task } from "@/lib/types"

/**
 * Маппинг по `docs/openapi.yaml`: GetCampaignResponse.quests[] = QuestDetail
 * { quest: QuestData, tasks: TaskData[], feedback? }; TaskData.subtasks[] = SubtaskData (completed: boolean).
 */

function normQuestStatus(s: string): QuestMilestone["status"] {
  const x = s.toLowerCase()
  if (x === "completed") return "completed"
  if (x === "active") return "active"
  return "pending"
}

type DayGate = "done" | "active" | "locked"

function formatMinutes(m: number): string {
  if (!m || m <= 0) return "—"
  return `${m} min`
}

function subtaskToUiTask(
  stRaw: unknown,
  parent: Record<string, unknown>,
  questId: string,
  questTitle: string,
  day: number,
  gate: DayGate,
): Task {
  const st = asRecord(stRaw) || {}
  const completed = st.completed === true
  const sid = str(st.id)
  let status: Task["status"]
  if (gate === "done") {
    status = "done"
  } else if (gate === "active") {
    status = completed ? "done" : "active"
  } else {
    status = "pending"
  }
  return {
    id: sid,
    apiSubtaskId: sid,
    parentTaskId: str(parent.id),
    parentTaskTitle: str(parent.title),
    title: str(st.title),
    context: str(parent.description, ""),
    instructions: str(st.title),
    timeEstimate: formatMinutes(num(st.estimated_minutes)),
    questId,
    questTitle,
    day,
    status,
  }
}

function flattenTaskDataToUiTasks(
  taskRaw: unknown,
  questId: string,
  questTitle: string,
  daySeed: number,
  gate: DayGate,
): Task[] {
  const t = asRecord(taskRaw)
  if (!t) return []
  const subtasks = Array.isArray(t.subtasks) ? t.subtasks : []
  const sortedSubs = [...subtasks].sort(
    (a, b) => num(asRecord(a)?.sort_order, 0) - num(asRecord(b)?.sort_order, 0),
  )

  if (sortedSubs.length === 0) {
    const tid = str(t.id)
    const completed = t.completed === true
    let status: Task["status"]
    if (gate === "done") {
      status = "done"
    } else if (gate === "active") {
      status = completed ? "done" : "active"
    } else {
      status = "pending"
    }
    return [
      {
        id: tid,
        apiSubtaskId: tid,
        title: str(t.title),
        context: str(t.description, ""),
        instructions: str(t.description, str(t.title)),
        timeEstimate: formatMinutes(num(t.estimated_minutes)),
        questId,
        questTitle,
        day: daySeed,
        status,
      },
    ]
  }

  return sortedSubs.map((st, i) =>
    subtaskToUiTask(st, t, questId, questTitle, daySeed + i, gate),
  )
}

/**
 * Одна строка кампании: quest + tasks[]
 * @param startingDay первый номер «дня» для первой задачи (для следующей вехи без дубля Day 1)
 */
export function mapQuestDetailToQuest(
  detail: unknown,
  campaignId: string,
  goalFallback: string,
  startingDay = 1,
  currentTaskId: string | null = null,
): Quest {
  const d = asRecord(detail)
  if (!d) {
    return {
      id: "unknown",
      title: goalFallback,
      mode: "Casual",
      campaignId: campaignId || undefined,
      progress: 0,
      totalTasks: 1,
      streak: 0,
      tasks: [],
    }
  }

  const q = asRecord(d.quest) || {}
  const questId = str(q.id, "quest-unknown")
  const questTitle = str(q.title, goalFallback)
  const questStatusRaw = str(q.status)
  const tasksRaw = Array.isArray(d.tasks) ? d.tasks : []
  const sortedTasks = [...tasksRaw].sort(
    (a, b) => num(asRecord(a)?.sort_order, 0) - num(asRecord(b)?.sort_order, 0),
  )

  // Compute gate per TaskData
  const gates: DayGate[] = new Array(sortedTasks.length).fill("locked")
  const pointerIndex =
    currentTaskId !== null
      ? sortedTasks.findIndex((tr) => str(asRecord(tr)?.id) === currentTaskId)
      : -1

  if (currentTaskId !== null && pointerIndex >= 0) {
    for (let i = 0; i < sortedTasks.length; i++) {
      if (i < pointerIndex) gates[i] = "done"
      else if (i === pointerIndex) gates[i] = "active"
      else gates[i] = "locked"
    }
  } else if (questStatusRaw.toLowerCase() === "completed") {
    for (let i = 0; i < sortedTasks.length; i++) gates[i] = "done"
  } else {
    // No pointer (or pointer not found): walk by sort_order
    let activeAssigned = false
    for (let i = 0; i < sortedTasks.length; i++) {
      const tr = asRecord(sortedTasks[i]) || {}
      const completed = tr.completed === true
      if (completed) {
        gates[i] = "done"
      } else if (!activeAssigned) {
        gates[i] = "active"
        activeAssigned = true
      } else {
        gates[i] = "locked"
      }
    }
  }

  const uiTasks: Task[] = []
  let dayCounter = startingDay
  for (let i = 0; i < sortedTasks.length; i++) {
    const chunk = flattenTaskDataToUiTasks(sortedTasks[i], questId, questTitle, dayCounter, gates[i])
    uiTasks.push(...chunk)
    dayCounter += Math.max(chunk.length, 1)
  }

  const doneCount = uiTasks.filter((t) => t.status === "done").length

  let progress: number
  let totalTasks: number
  if (uiTasks.length === 0) {
    totalTasks = 1
    progress = questStatusRaw === "completed" ? 1 : 0
  } else {
    totalTasks = uiTasks.length
    progress = doneCount
  }

  return {
    id: questId,
    title: questTitle,
    mode: "Casual",
    campaignId: campaignId || undefined,
    progress,
    totalTasks,
    streak: 0,
    tasks: uiTasks,
  }
}

export function campaignTitleFromBundle(bundle: { campaign: unknown }): string {
  const c = asRecord(bundle.campaign) || {}
  return str(c.goal_text, str(c.title, "Кампания"))
}

/** Один объект Quest на кампанию: цель из campaign, вехи = элементы quests[] с бэка. */
export function mapCampaignBundleToWrappedQuest(data: { campaign: unknown; quests: unknown[] }): Quest {
  const camp = asRecord(data.campaign) || {}
  const cid = str(camp.id, "")
  const goal = campaignTitleFromBundle(data)
  const qlist = Array.isArray(data.quests) ? data.quests : []
  const sorted = [...qlist].sort(
    (a, b) =>
      num(asRecord(asRecord(a)?.quest)?.quest_number, 0) -
      num(asRecord(asRecord(b)?.quest)?.quest_number, 0),
  )

  if (sorted.length === 0) {
    return {
      id: cid ? `camp:${cid}` : "camp:unknown",
      campaignId: cid || undefined,
      title: goal,
      mode: "Casual",
      progress: 0,
      totalTasks: 1,
      streak: 0,
      tasks: [],
      milestones: [],
    }
  }

  const milestones: QuestMilestone[] = []
  let nextDayStart = 1

  for (const detail of sorted) {
    const leaf = mapQuestDetailToQuest(detail, cid, goal, nextDayStart)
    const dq = asRecord(asRecord(detail)?.quest) || {}
    milestones.push({
      id: leaf.id,
      questNumber: num(dq.quest_number, milestones.length + 1),
      title: leaf.title,
      description: str(dq.description, ""),
      status: normQuestStatus(str(dq.status)),
      tasks: leaf.tasks,
      progress: leaf.progress,
      totalTasks: leaf.totalTasks,
    })
    nextDayStart =
      leaf.tasks.length > 0 ? Math.max(...leaf.tasks.map((t) => t.day)) + 1 : nextDayStart
  }

  const allTasks = milestones.flatMap((m) => m.tasks)
  const done = allTasks.filter((t) => t.status === "done").length

  return {
    id: `camp:${cid}`,
    campaignId: cid || undefined,
    title: goal,
    mode: "Casual",
    progress: allTasks.length > 0 ? done : 0,
    totalTasks: allTasks.length > 0 ? allTasks.length : 1,
    streak: 0,
    tasks: allTasks,
    milestones,
  }
}

export function mapGetCampaignResponse(data: { campaign: unknown; quests: unknown[] }): Quest[] {
  return [mapCampaignBundleToWrappedQuest(data)]
}

/**
 * Сохраняет полный список шагов из GET /campaigns/:id и обновляет статусы из current-quest
 * (там часто только «верхний» слой задач без subtasks в JSON).
 */
export function overlayTaskStatuses(base: Task[], fromCurrentQuest: Task[]): Task[] {
  if (fromCurrentQuest.length === 0) return base
  if (base.length === 0) return fromCurrentQuest

  const pick = new Map<string, Task>()
  for (const t of fromCurrentQuest) {
    pick.set(t.id, t)
    if (t.apiSubtaskId && t.apiSubtaskId !== t.id) pick.set(t.apiSubtaskId, t)
  }

  return base.map((t) => {
    const o = pick.get(t.id) ?? (t.apiSubtaskId ? pick.get(t.apiSubtaskId) : undefined)
    if (!o) return t
    if (o.status === t.status) return t
    return { ...t, status: o.status }
  })
}

export function mapCurrentQuestResponse(
  data: { quest: unknown; tasks: unknown[] },
  campaignId: string,
  fallbackTitle: string,
  currentTaskId: string | null = null,
): Quest {
  return mapQuestDetailToQuest(
    { quest: data.quest, tasks: data.tasks },
    campaignId,
    fallbackTitle,
    1,
    currentTaskId,
  )
}
