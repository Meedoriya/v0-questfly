import { apiRequest } from "./client"

/** Сырой ответ `data` из GET /users/me/character (см. GetCharacterResponse). */
export type GetCharacterData = Record<string, unknown>

export async function getUserCharacter(): Promise<GetCharacterData> {
  return apiRequest<GetCharacterData>("/api/v1/users/me/character", { method: "GET" })
}

/**
 * Partial обновление персонажа: name (2..50) и/или bio (≤500).
 * Возвращает полный character (как GET /users/me/character).
 */
export async function updateCharacter(input: { name?: string; bio?: string }): Promise<GetCharacterData> {
  return apiRequest<GetCharacterData>("/api/v1/users/me/character", {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

/**
 * Загрузка аватара. Принимаются PNG/JPEG ≤2 MB. Бэк center-crop'ит,
 * ресайзит до 512×512 JPEG q85 и возвращает абсолютный URL с `?v=<unix>`.
 */
export async function uploadAvatar(file: File): Promise<{ avatar_url: string }> {
  const formData = new FormData()
  formData.append("file", file)
  return apiRequest<{ avatar_url: string }>("/api/v1/users/me/character/avatar", {
    method: "PUT",
    body: formData,
  })
}

/**
 * @deprecated Используй `updateCharacter({ name })`. Эндпоинт PUT .../character/name
 * помечен deprecated на бэке и будет удалён через 1 релиз.
 */
export async function updateCharacterName(name: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/api/v1/users/me/character/name", {
    method: "PUT",
    body: JSON.stringify({ name }),
  })
}
