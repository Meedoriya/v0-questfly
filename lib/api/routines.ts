import { apiRequest } from "./client"
import { todayISODate } from "@/lib/date-iso"

/** Сырой объект рутины с бэка (см. RoutineData в openapi). */
export type RoutineData = Record<string, unknown>

export interface CreateRoutinePayload {
  emoji?: string
  title: string
  notes?: string
  duration_minutes?: number
  xp_reward?: number
  repeat_type: "daily" | "weekly" | "custom" | "off"
  times_per_week?: number
  days_of_week?: number[]
}

export interface UpdateRoutinePayload {
  title: string
  repeat_type: "daily" | "weekly" | "custom" | "off"
  emoji?: string
  notes?: string
  duration_minutes?: number
  xp_reward?: number
  times_per_week?: number
  days_of_week?: number[]
  active?: boolean
}

export async function createRoutine(body: CreateRoutinePayload): Promise<RoutineData> {
  return apiRequest<RoutineData>("/api/v1/routines", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function listRoutines(includeInactive = false): Promise<{ routines: RoutineData[] }> {
  const q = includeInactive ? "?include_inactive=true" : ""
  return apiRequest<{ routines: RoutineData[] }>(`/api/v1/routines${q}`, { method: "GET" })
}

export async function listRoutinesDaily(date?: string): Promise<{
  date: string
  routines: { routine: RoutineData; is_done: boolean; xp_awarded: number }[]
}> {
  const q = date ? `?date=${encodeURIComponent(date)}` : ""
  return apiRequest(`/api/v1/routines/daily${q}`, { method: "GET" })
}

export async function getRoutine(id: string): Promise<{
  routine: RoutineData
  completed_today: boolean
  today: string
}> {
  return apiRequest(`/api/v1/routines/${id}`, { method: "GET" })
}

export async function updateRoutine(id: string, body: UpdateRoutinePayload): Promise<RoutineData> {
  return apiRequest<RoutineData>(`/api/v1/routines/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export async function deleteRoutine(id: string): Promise<void> {
  return apiRequest<void>(`/api/v1/routines/${id}`, { method: "DELETE" })
}

export async function completeRoutine(id: string, date?: string): Promise<{
  routine: RoutineData
  xp_awarded: number
  already_done: boolean
}> {
  const q = date ? `?date=${encodeURIComponent(date)}` : ""
  return apiRequest(`/api/v1/routines/${id}/complete${q}`, { method: "POST" })
}

export async function uncompleteRoutine(id: string, date?: string): Promise<{ routine: RoutineData }> {
  const d = date ?? todayISODate()
  return apiRequest(`/api/v1/routines/${id}/uncomplete?date=${encodeURIComponent(d)}`, {
    method: "POST",
  })
}
