import { getCurrentQuest } from "@/lib/api/campaigns"
import { asRecord, str } from "@/lib/api/json-helpers"
import { ApiError } from "@/lib/api/errors"

const POLL_MS = 2000
const POLL_MAX = 90

/**
 * После POST .../next-quest (202) поллит current-quest, пока не сменится quest.id.
 */
export async function waitForNextQuestReady(campaignId: string, previousQuestId: string): Promise<void> {
  for (let i = 0; i < POLL_MAX; i++) {
    const data = await getCurrentQuest(campaignId)
    const q = asRecord(data.quest)
    const nid = str(q?.id, "")
    if (nid && nid !== previousQuestId) return
    await new Promise((r) => setTimeout(r, POLL_MS))
  }
  throw new ApiError("TIMEOUT", "Превышено время ожидания следующего квеста")
}
