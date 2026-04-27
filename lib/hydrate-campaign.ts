import { getCampaign, getCurrentQuest } from "@/lib/api/campaigns"
import {
  campaignTitleFromBundle,
  mapCurrentQuestResponse,
  mapGetCampaignResponse,
} from "@/lib/mappers/campaign-mapper"
import type { Quest, Task } from "@/lib/types"

export interface HydratedCampaign {
  quests: Quest[]
  currentQuest: Quest
  currentTask: Task | null
}

/**
 * Загружает кампанию и текущий квест с API, согласует список квестов с актуальным current-quest.
 */
export async function hydrateCampaignState(campaignId: string): Promise<HydratedCampaign> {
  const bundle = await getCampaign(campaignId)
  const cq = await getCurrentQuest(campaignId)
  const title = campaignTitleFromBundle(bundle)
  const current = mapCurrentQuestResponse(cq, campaignId, title)
  const fromBundle = mapGetCampaignResponse(bundle)
  const merged = fromBundle.map((q) => (q.id === current.id ? current : q))
  if (!merged.some((q) => q.id === current.id)) {
    merged.push(current)
  }
  const nextTask = current.tasks.find((t) => t.status === "active") ?? null
  return { quests: merged, currentQuest: current, currentTask: nextTask }
}
