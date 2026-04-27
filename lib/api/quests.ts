import { apiRequest } from "./client"

export type QuestSentiment = "good" | "ok" | "bad"

export async function submitQuestFeedback(
  questId: string,
  body: { sentiment: QuestSentiment; comment?: string },
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/v1/quests/${questId}/feedback`, {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function completeQuest(questId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/v1/quests/${questId}/complete`, {
    method: "POST",
  })
}
