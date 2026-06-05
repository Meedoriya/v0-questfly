import { apiRequest } from "./client"

/** Сырой ответ `data` из GET /users/me/friends. Сейчас бэк возвращает `{ friends: [] }` (stub). */
export type GetFriendsData = Record<string, unknown>

export async function getFriends(): Promise<GetFriendsData> {
  return apiRequest<GetFriendsData>("/api/v1/users/me/friends", { method: "GET" })
}
