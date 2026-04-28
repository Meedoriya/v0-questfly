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
  isActive: boolean,
): Task {
  const st = asRecord(stRaw) || {}
  const completed = st.completed === true
  const sid = str(st.id)
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
    status: completed ? "done" : isActive ? "active" : "pending",
  }
}

function flattenTaskDataToUiTasks(
  taskRaw: unknown,
  questId: string,
  questTitle: string,
  daySeed: number,
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
        status: completed ? "done" : "active",
      },
    ]
  }

  let assignedActive = false
  return sortedSubs.map((st, i) => {
    const stRec = asRecord(st) || {}
    const completed = stRec.completed === true
    let isActive = false
    if (!completed && !assignedActive) {
      isActive = true
      assignedActive = true
    }
    return subtaskToUiTask(st, t, questId, questTitle, daySeed + i, isActive)
  })
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
  const tasksRaw = Array.isArray(d.tasks) ? d.tasks : []
  const sortedTasks = [...tasksRaw].sort(
    (a, b) => num(asRecord(a)?.sort_order, 0) - num(asRecord(b)?.sort_order, 0),
  )

  const uiTasks: Task[] = []
  let dayCounter = startingDay
  for (const td of sortedTasks) {
    const chunk = flattenTaskDataToUiTasks(td, questId, questTitle, dayCounter)
    uiTasks.push(...chunk)
    dayCounter += Math.max(chunk.length, 1)
  }

  const doneCount = uiTasks.filter((t) => t.status === "done").length
  const questStatus = str(q.status)

  let progress: number
  let totalTasks: number
  if (uiTasks.length === 0) {
    totalTasks = 1
    progress = questStatus === "completed" ? 1 : 0
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
): Quest {
  return mapQuestDetailToQuest({ quest: data.quest, tasks: data.tasks }, campaignId, fallbackTitle)
}
