import { getCampaign, getCurrentQuest } from "@/lib/api/campaigns"
import {
  campaignTitleFromBundle,
  mapCampaignBundleToWrappedQuest,
  mapCurrentQuestResponse,
  overlayTaskStatuses,
} from "@/lib/mappers/campaign-mapper"
import type { Quest, Task } from "@/lib/types"

export interface HydratedCampaign {
  quests: Quest[]
  currentQuest: Quest
  currentTask: Task | null
  currentTaskId: string | null
  feedbackRequired: boolean
  nextQuestGenerating: boolean
}

/**
 * Загружает кампанию и текущий квест с API.
 * Одна карточка кампании с вехами (`milestones`); для feedback/complete — `currentQuest.apiQuestId`.
 */
export async function hydrateCampaignState(campaignId: string): Promise<HydratedCampaign> {
  const bundle = await getCampaign(campaignId)
  const cq = await getCurrentQuest(campaignId)
  const goalTitle = campaignTitleFromBundle(bundle)

  const currentTaskId = cq.current_task_id ?? null
  const feedbackRequired = cq.feedback_required ?? false
  const nextQuestGenerating = cq.next_quest_generating ?? false

  const wrapped = mapCampaignBundleToWrappedQuest(bundle)
  const currentLeaf = mapCurrentQuestResponse(cq, campaignId, goalTitle, currentTaskId)

  if (!wrapped.milestones?.length) {
    const nextTask = currentLeaf.tasks.find((t) => t.status === "active") ?? null
    const qWithApi: Quest = {
      ...currentLeaf,
      apiQuestId: currentLeaf.id,
      currentTaskId,
      feedbackRequired,
      nextQuestGenerating,
    }
    return {
      quests: [qWithApi],
      currentQuest: qWithApi,
      currentTask: nextTask,
      currentTaskId,
      feedbackRequired,
      nextQuestGenerating,
    }
  }

  const activeId = currentLeaf.id

  const milestones = wrapped.milestones.map((ms) => {
    if (ms.id !== activeId) return ms

    const merged =
      ms.tasks.length > 0
        ? overlayTaskStatuses(ms.tasks, currentLeaf.tasks)
        : currentLeaf.tasks.length > 0
          ? currentLeaf.tasks
          : ms.tasks

    const doneCount = merged.filter((t) => t.status === "done").length
    const totalTasks = merged.length > 0 ? merged.length : 1
    const progress = merged.length > 0 ? doneCount : ms.progress

    return {
      ...ms,
      title: currentLeaf.title,
      tasks: merged,
      progress,
      totalTasks,
    }
  })

  const allTasks = milestones.flatMap((m) => m.tasks)
  const done = allTasks.filter((t) => t.status === "done").length

  const mergedQuest: Quest = {
    ...wrapped,
    milestones,
    tasks: allTasks,
    progress: allTasks.length > 0 ? done : wrapped.progress,
    totalTasks: allTasks.length > 0 ? allTasks.length : 1,
    apiQuestId: activeId,
    currentTaskId,
    feedbackRequired,
    nextQuestGenerating,
  }

  const activeMilestone = milestones.find((m) => m.id === activeId)
  const nextTask =
    activeMilestone?.tasks.find((t) => t.status === "active") ??
    mergedQuest.tasks.find((t) => t.status === "active") ??
    null

  return {
    quests: [mergedQuest],
    currentQuest: mergedQuest,
    currentTask: nextTask,
    currentTaskId,
    feedbackRequired,
    nextQuestGenerating,
  }
}
