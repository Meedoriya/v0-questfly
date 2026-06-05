import { apiRequest } from "./client"

/** Сырой ответ `data` из GET /users/me/activity. */
export type GetActivityData = Record<string, unknown>

/**
 * Heatmap активности персонажа.
 * Окно: до 366 дней. По умолчанию бэк возвращает последние 90 дней.
 * Для year-view фронт явно запрашивает `to - 364 дня`.
 */
export async function getActivity(params?: { from?: string; to?: string }): Promise<GetActivityData> {
  const qs = new URLSearchParams()
  if (params?.from) qs.set("from", params.from)
  if (params?.to) qs.set("to", params.to)
  const suffix = qs.toString() ? `?${qs.toString()}` : ""
  return apiRequest<GetActivityData>(`/api/v1/users/me/activity${suffix}`, { method: "GET" })
}
