import { asRecord, num, str } from "@/lib/api/json-helpers"
import type { Quest, Task } from "@/lib/types"

/**
 * Маппинг по `docs/openapi.yaml`: GetCampaignResponse.quests[] = QuestDetail
 * { quest: QuestData, tasks: TaskData[], feedback? }; TaskData.subtasks[] = SubtaskData (completed: boolean).
 */

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

export function mapQuestDetailToQuest(detail: unknown, campaignId: string, goalFallback: string): Quest {
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
  let dayCounter = 1
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

export function mapGetCampaignResponse(data: { campaign: unknown; quests: unknown[] }): Quest[] {
  const camp = asRecord(data.campaign) || {}
  const cid = str(camp.id, "")
  const fallback = campaignTitleFromBundle(data)
  const qlist = Array.isArray(data.quests) ? data.quests : []
  return qlist.map((detail) => mapQuestDetailToQuest(detail, cid, fallback))
}

export function mapCurrentQuestResponse(
  data: { quest: unknown; tasks: unknown[] },
  campaignId: string,
  fallbackTitle: string,
): Quest {
  return mapQuestDetailToQuest({ quest: data.quest, tasks: data.tasks }, campaignId, fallbackTitle)
}
