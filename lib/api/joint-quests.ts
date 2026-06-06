import { apiRequest } from "./client"
import type { ApiJointQuest } from "./types"

/** Сырой ответ `data` из GET /joint-quests (список активных). */
export interface ListJointQuestsData {
  joint_quests: ApiJointQuest[]
}

/** Создать joint quest. AI генерит roadmap'ы обоим игрокам синхронно перед ответом. */
export interface CreateJointQuestInput {
  title: string
  description: string
  invitee_email: string
  deadline: string
  total_tasks: number
}

export async function createJointQuest(input: CreateJointQuestInput): Promise<ApiJointQuest> {
  return apiRequest<ApiJointQuest>("/api/v1/joint-quests", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function listJointQuests(): Promise<ListJointQuestsData> {
  return apiRequest<ListJointQuestsData>("/api/v1/joint-quests", { method: "GET" })
}

export async function getJointQuest(id: string): Promise<ApiJointQuest> {
  return apiRequest<ApiJointQuest>(`/api/v1/joint-quests/${encodeURIComponent(id)}`, {
    method: "GET",
  })
}

export async function acceptJointQuest(id: string): Promise<ApiJointQuest> {
  return apiRequest<ApiJointQuest>(`/api/v1/joint-quests/${encodeURIComponent(id)}/accept`, {
    method: "POST",
  })
}

export async function declineJointQuest(id: string): Promise<ApiJointQuest> {
  return apiRequest<ApiJointQuest>(`/api/v1/joint-quests/${encodeURIComponent(id)}/decline`, {
    method: "POST",
  })
}

/**
 * Закрыть день в joint quest'е. Идемпотентность по `(user, date UTC)` —
 * второй вызов в тот же день вернёт 409 ALREADY_LOGGED_TODAY.
 */
export async function recordDailyProgress(
  id: string,
  input: { impact_value?: string },
): Promise<ApiJointQuest> {
  return apiRequest<ApiJointQuest>(
    `/api/v1/joint-quests/${encodeURIComponent(id)}/daily-progress`,
    {
      method: "POST",
      body: JSON.stringify(input ?? {}),
    },
  )
}

/**
 * Подбодрить друга. 204 No Content. После успеха перерисовывайте экран через
 * getJointQuest(id), чтобы обновить локальный snapshot.
 *
 * Rate-limit: 1 раз/день в направлении на квест. Скоп: только когда
 * target.completed_today === false и quest.status === "active".
 */
export async function encourageJointQuestPlayer(
  id: string,
  targetUserId: string,
): Promise<void> {
  await apiRequest<void>(`/api/v1/joint-quests/${encodeURIComponent(id)}/encourage`, {
    method: "POST",
    body: JSON.stringify({ target_user_id: targetUserId }),
  })
}
