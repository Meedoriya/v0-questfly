import { apiRequest } from "./client"
import { ApiError } from "./errors"
import { asRecord, str } from "./json-helpers"

export interface OnboardingOption {
  value: string
  label: string
}

export interface OnboardingQuestion {
  content: string
  options: OnboardingOption[]
}

export interface StartOnboardingData {
  campaign_id: string
  question: OnboardingQuestion
}

export interface MessageOnboardingData {
  question?: OnboardingQuestion
  questions_answered: number
  can_generate: boolean
}

export interface GenerateOnboardingData {
  status: string
  campaign_id: string
  message: string
}

export interface OnboardingConversationMessage {
  role: string
  content: string
  options?: OnboardingOption[]
}

export interface ConversationData {
  campaign_id: string
  messages: OnboardingConversationMessage[]
  status: string
}

export interface OnboardingStatusData {
  campaign_id: string
  status: string
  goal_text: string
  total_quests: number
  quests: unknown[]
}

export async function startOnboarding(goal_text: string): Promise<StartOnboardingData> {
  return apiRequest<StartOnboardingData>("/api/v1/onboarding/start", {
    method: "POST",
    body: JSON.stringify({ goal_text }),
  })
}

export async function sendOnboardingMessage(campaignId: string, message: string): Promise<MessageOnboardingData> {
  return apiRequest<MessageOnboardingData>(`/api/v1/onboarding/${campaignId}/message`, {
    method: "POST",
    body: JSON.stringify({ message }),
  })
}

export async function generateOnboardingQuests(campaignId: string): Promise<GenerateOnboardingData> {
  return apiRequest<GenerateOnboardingData>(`/api/v1/onboarding/${campaignId}/generate`, {
    method: "POST",
  })
}

export async function getOnboardingConversation(campaignId: string): Promise<ConversationData> {
  return apiRequest<ConversationData>(`/api/v1/onboarding/${campaignId}/conversation`, {
    method: "GET",
  })
}

export async function getOnboardingStatus(campaignId: string): Promise<OnboardingStatusData> {
  return apiRequest<OnboardingStatusData>(`/api/v1/onboarding/${campaignId}/status`, {
    method: "GET",
  })
}

const POLL_INTERVAL_MS = 2000
const POLL_MAX_ATTEMPTS = 90

/** См. CampaignStatusResponse в docs/openapi.yaml: кампания draft|active|completed|archived; веха с has_tasks. */
function isOnboardingGenerationReady(s: OnboardingStatusData): boolean {
  if (str(s.status) === "draft") return false
  const quests = Array.isArray(s.quests) ? s.quests : []
  if (quests.length === 0) return false
  return quests.some((q) => asRecord(q)?.has_tasks === true)
}

/**
 * После POST /generate (202) опрашивает GET /status, пока квесты не будут готовы.
 */
export async function waitForOnboardingGeneration(campaignId: string): Promise<OnboardingStatusData> {
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    const s = await getOnboardingStatus(campaignId)
    if (isOnboardingGenerationReady(s)) return s
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
  }
  throw new ApiError("TIMEOUT", "Генерация квестов заняла слишком много времени")
}
