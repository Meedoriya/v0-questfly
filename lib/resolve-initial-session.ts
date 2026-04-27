import { listCampaigns } from "@/lib/api/campaigns"
import { asRecord, str } from "@/lib/api/json-helpers"
import { hydrateCampaignState } from "@/lib/hydrate-campaign"
import type { AppState } from "@/lib/store"

function campaignIdFromSummary(r: Record<string, unknown>): string {
  return str(r.campaign_id, str(r.id, ""))
}

function normStatus(r: Record<string, unknown>): string {
  return str(r.status, "").toLowerCase()
}

/**
 * По GET /campaigns выбирает стартовый экран после входа:
 * — есть draft → продолжить онбординг (ai-chat);
 * — иначе → home с гидрацией активной (или первой) кампании.
 */
export async function resolveInitialSessionFromCampaigns(fallbackGoal: string): Promise<Partial<AppState> | null> {
  const { campaigns } = await listCampaigns()
  if (!campaigns?.length) return null

  const rows = campaigns
    .map((raw) => asRecord(raw))
    .filter((r): r is Record<string, unknown> => r != null)

  const draft = rows.find((r) => normStatus(r) === "draft")
  if (draft) {
    const cid = campaignIdFromSummary(draft)
    if (!cid) return null
    return {
      screen: "ai-chat",
      onboardingCampaignId: cid,
      goal: str(draft.goal_text, fallbackGoal),
    }
  }

  const primary =
    rows.find((r) => normStatus(r) === "active") ??
    rows.find((r) => normStatus(r) === "completed") ??
    rows[0]

  const pid = campaignIdFromSummary(primary)
  if (!pid) return null

  const hydrated = await hydrateCampaignState(pid)
  return {
    screen: "home",
    activeCampaignId: pid,
    quests: hydrated.quests,
    currentQuest: hydrated.currentQuest,
    currentTask: hydrated.currentTask,
  }
}
