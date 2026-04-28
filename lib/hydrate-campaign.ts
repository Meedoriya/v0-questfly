import { getCampaign, getCurrentQuest } from "@/lib/api/campaigns"
import {
  campaignTitleFromBundle,
  mapCampaignBundleToWrappedQuest,
  mapCurrentQuestResponse,
} from "@/lib/mappers/campaign-mapper"
import type { Quest, Task } from "@/lib/types"

export interface HydratedCampaign {
  quests: Quest[]
  currentQuest: Quest
  currentTask: Task | null
}

/**
 * Загружает кампанию и текущий квест с API.
 * Одна карточка кампании с вехами (`milestones`); для feedback/complete — `currentQuest.apiQuestId`.
 */
export async function hydrateCampaignState(campaignId: string): Promise<HydratedCampaign> {
  const bundle = await getCampaign(campaignId)
  const cq = await getCurrentQuest(campaignId)
  const goalTitle = campaignTitleFromBundle(bundle)

  const wrapped = mapCampaignBundleToWrappedQuest(bundle)
  const currentLeaf = mapCurrentQuestResponse(cq, campaignId, goalTitle)

  if (!wrapped.milestones?.length) {
    const nextTask = currentLeaf.tasks.find((t) => t.status === "active") ?? null
    const qWithApi: Quest = { ...currentLeaf, apiQuestId: currentLeaf.id }
    return {
      quests: [qWithApi],
      currentQuest: qWithApi,
      currentTask: nextTask,
    }
  }

  const activeId = currentLeaf.id

  const milestones = wrapped.milestones.map((ms) =>
    ms.id === activeId
      ? {
          ...ms,
          title: currentLeaf.title,
          tasks: currentLeaf.tasks,
          progress: currentLeaf.progress,
          totalTasks: currentLeaf.totalTasks,
        }
      : ms,
  )

  const allTasks = milestones.flatMap((m) => m.tasks)
  const done = allTasks.filter((t) => t.status === "done").length

  const mergedQuest: Quest = {
    ...wrapped,
    milestones,
    tasks: allTasks,
    progress: allTasks.length > 0 ? done : wrapped.progress,
    totalTasks: allTasks.length > 0 ? allTasks.length : 1,
    apiQuestId: activeId,
  }

  const nextTask = currentLeaf.tasks.find((t) => t.status === "active") ?? null

  return { quests: [mergedQuest], currentQuest: mergedQuest, currentTask: nextTask }
}
