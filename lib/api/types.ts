/** Обёртка успешного ответа API. */
export interface ApiSuccessEnvelope<T> {
  success: true
  data: T
}

/** Обёртка ошибки API. */
export interface ApiErrorBody {
  success: false
  error: {
    code: string
    message: string
  }
}

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorBody

export interface TokenData {
  access_token: string
  refresh_token: string
  expires_at: string
}

export interface CharacterDto {
  id: string
  name: string
  total_xp: number
  level: number
  streak: number
}

export interface AuthResponse {
  user_id: string
  email: string
  name: string
  character: CharacterDto
  /** Для `/me` может быть пустым; после login/register — пара токенов. */
  token: TokenData | null
  is_new_user: boolean
}

export interface SendOtpData {
  message: string
  email: string
  user_exists: boolean
}

/** Снимок сессии для UI (без токенов). */
export interface AuthSessionUser {
  userId: string
  email: string
  name: string
  character: CharacterDto
}
