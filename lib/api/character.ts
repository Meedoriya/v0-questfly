import { apiRequest } from "./client"

/** Сырой ответ `data` из GET /users/me/character (см. GetCharacterResponse). */
export type GetCharacterData = Record<string, unknown>

export async function getUserCharacter(): Promise<GetCharacterData> {
  return apiRequest<GetCharacterData>("/api/v1/users/me/character", { method: "GET" })
}

export async function updateCharacterName(name: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/api/v1/users/me/character/name", {
    method: "PUT",
    body: JSON.stringify({ name }),
  })
}
