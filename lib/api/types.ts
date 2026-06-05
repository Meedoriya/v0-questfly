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

/** День недели в week_activity бэка. */
export interface WeekActivityDay {
  date: string
  active: boolean
}

/** Блок level_progress, который бэк отдаёт внутри character (на /auth/me) или рядом с ним (на /users/me/character). */
export interface LevelProgress {
  current_level: number
  current_xp: number
  xp_for_current_level: number
  xp_for_next_level: number
  progress_percent: number
}

/**
 * Полная форма персонажа с бэка (после фаз 0–4 интеграции).
 * Используется в `MeResponse` и в ответе `GET /users/me/character`.
 * Slim-вариант `CharacterDto` остаётся для `AuthResponse` (login/register/refresh).
 */
export interface CharacterData {
  id: string
  user_id: string
  name: string
  avatar_url: string | null
  bio: string | null
  total_xp: number
  level: number
  streak: number
  last_activity_date?: string
  week_activity: WeekActivityDay[]
  active_days_count: number
  /** В /auth/me лежит ВНУТРИ character; в /users/me/character — рядом. */
  level_progress?: LevelProgress
  next_level_xp?: number
  current_level_name?: string
}

/**
 * Ответ register/login/refresh — старый shape с токенами.
 * Для /auth/me используется отдельный `MeResponse` (см. ниже).
 */
export interface AuthResponse {
  user_id: string
  email: string
  name: string
  character: CharacterDto
  /** Для login/register — пара токенов. Для refresh — обновлённая пара. */
  token: TokenData | null
  is_new_user: boolean
}

/** Identity-блок в /auth/me. */
export interface MeUser {
  user_id: string
  email: string
  name: string
}

/**
 * Ответ `GET /api/v1/auth/me` после фазы 0 интеграции профиля.
 * Поля `token` и `is_new_user` удалены — bootstrap не нужен токен (он уже в storage).
 * `character.level_progress`/`next_level_xp`/`current_level_name` лежат ВНУТРИ character.
 */
export interface MeResponse {
  user: MeUser
  character: CharacterData
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
