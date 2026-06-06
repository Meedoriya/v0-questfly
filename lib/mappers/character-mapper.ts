import { asRecord, num, str } from "@/lib/api/json-helpers"
import { axisLabel, isAxisKey } from "@/lib/axes"
import type { Characteristic, UserProgress } from "@/lib/types"

/**
 * Накладывает ответ бэка с данными персонажа на локальный UserProgress.
 *
 * Поддерживает оба контракта (см. profile_endpoints_integration.md):
 * - `GET /users/me/character` — `level_progress`/`next_level_xp`/`current_level_name`
 *   лежат РЯДОМ с `character`.
 * - `GET /auth/me` — те же поля лежат ВНУТРИ `character`.
 *
 * `friends` остаётся как в prev — лента приходит отдельной ручкой /users/me/friends.
 */
export function patchUserProgressFromCharacterGet(prev: UserProgress, raw: unknown): UserProgress {
  const d = asRecord(raw)
  if (!d) return prev
  const ch = asRecord(d.character)
  if (!ch) return prev

  const lp = asRecord(d.level_progress) ?? asRecord(ch.level_progress)
  const nextLevelXpRaw = d.next_level_xp ?? ch.next_level_xp
  const levelNameRaw = d.current_level_name ?? ch.current_level_name

  const totalXp = num(ch.total_xp, prev.xp)
  const level = num(ch.level, prev.level)
  const streak = num(ch.streak, prev.megaStreak)
  const progressPercent = lp ? num(lp.progress_percent, NaN) : NaN
  const nextLevelXp = num(nextLevelXpRaw, NaN)
  const levelName = str(levelNameRaw, "").trim()
  const activeDaysCount = num(ch.active_days_count, NaN)

  const avatarUrl = parseNullableString(ch.avatar_url, prev.avatarUrl)
  const bio = parseNullableString(ch.bio, prev.bio)
  const weekActivity = parseWeekActivity(ch.week_activity, prev.weekActivity)
  const characteristics = parseCharacteristics(ch.characteristics, prev.characteristics)

  return {
    ...prev,
    xp: totalXp,
    level,
    megaStreak: streak,
    levelProgressPercent: Number.isFinite(progressPercent) ? progressPercent : prev.levelProgressPercent,
    nextLevelXp: Number.isFinite(nextLevelXp) && nextLevelXp > 0 ? nextLevelXp : prev.nextLevelXp,
    currentLevelName: levelName || prev.currentLevelName,
    avatarUrl,
    bio,
    activeDaysCount: Number.isFinite(activeDaysCount) ? activeDaysCount : prev.activeDaysCount,
    weekActivity,
    characteristics,
  }
}

function parseNullableString(v: unknown, fallback: string | null | undefined): string | null | undefined {
  if (v === null) return null
  if (typeof v === "string") return v
  return fallback
}

function parseWeekActivity(v: unknown, fallback: boolean[]): boolean[] {
  if (!Array.isArray(v)) return fallback
  const parsed = v.map((entry) => {
    const r = asRecord(entry)
    return r?.active === true
  })
  return parsed.length === 7 ? parsed : fallback
}

/**
 * Парсит `character.characteristics` (12 элементов в каноничном порядке).
 * Записи с неизвестным `key` отбрасываются — на случай если бэк когда-то добавит
 * 13-ю ось до обновления фронта (защита, чтобы радар не упал).
 * Cap на `current` не делаем — бэк уже capped at max=20.
 */
function parseCharacteristics(v: unknown, fallback: Characteristic[]): Characteristic[] {
  if (!Array.isArray(v)) return fallback
  const parsed = v
    .map((entry): Characteristic | null => {
      const r = asRecord(entry)
      if (!r) return null
      const key = str(r.key, "")
      if (!isAxisKey(key)) return null
      return {
        key,
        name: axisLabel(key),
        current: num(r.current, 0),
        max: num(r.max, 20),
        thisWeek: num(r.this_week, 0),
        lastWeek: num(r.last_week, 0),
      }
    })
    .filter((x): x is Characteristic => x !== null)
  return parsed.length === 0 ? fallback : parsed
}
