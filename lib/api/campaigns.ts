import { apiRequest } from "./client"

export interface CampaignBundle {
  campaign: unknown
  quests: unknown[]
}

export interface CurrentQuestBundle {
  quest: unknown
  tasks: unknown[]
}

export async function listCampaigns(): Promise<{ campaigns: unknown[] }> {
  return apiRequest<{ campaigns: unknown[] }>("/api/v1/campaigns", { method: "GET" })
}

export async function getCampaign(id: string): Promise<CampaignBundle> {
  return apiRequest<CampaignBundle>(`/api/v1/campaigns/${id}`, { method: "GET" })
}

export async function getCampaignRoadmap(id: string): Promise<unknown> {
  return apiRequest<unknown>(`/api/v1/campaigns/${id}/roadmap`, { method: "GET" })
}

export async function getCurrentQuest(campaignId: string): Promise<CurrentQuestBundle> {
  return apiRequest<CurrentQuestBundle>(`/api/v1/campaigns/${campaignId}/current-quest`, {
    method: "GET",
  })
}

/** Тело 202 от POST .../next-quest (AsyncResponse). */
export interface AsyncAcceptedData {
  status: string
  campaign_id: string
  message: string
}

export async function requestNextQuest(campaignId: string): Promise<AsyncAcceptedData> {
  return apiRequest<AsyncAcceptedData>(`/api/v1/campaigns/${campaignId}/next-quest`, {
    method: "POST",
  })
}
