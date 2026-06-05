import { apiRequest } from "./client"
import type { MeUser } from "./types"

/**
 * Partial обновление identity. Сейчас поддерживается только `name` (1..100).
 * Email менять здесь нельзя — нужна OTP-верификация, отдельная фича.
 */
export async function updateUserName(name: string): Promise<MeUser> {
  return apiRequest<MeUser>("/api/v1/users/me", {
    method: "PATCH",
    body: JSON.stringify({ name }),
  })
}
