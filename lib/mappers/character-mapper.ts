import { asRecord, num, str } from "@/lib/api/json-helpers"
import type { UserProgress } from "@/lib/types"

/**
 * Накладывает ответ GET /users/me/character на локальный UserProgress.
 * Оси жизни / друзья / неделя остаются как в prev (в API пока нет).
 */
export function patchUserProgressFromCharacterGet(prev: UserProgress, raw: unknown): UserProgress {
  const d = asRecord(raw)
  if (!d) return prev
  const ch = asRecord(d.character)
  if (!ch) return prev
  const lp = asRecord(d.level_progress)

  const totalXp = num(ch.total_xp, prev.xp)
  const level = num(ch.level, prev.level)
  const streak = num(ch.streak, prev.megaStreak)
  const progressPercent = lp ? num(lp.progress_percent, NaN) : NaN
  const nextLevelXp = num(d.next_level_xp, NaN)
  const levelName = str(d.current_level_name, "").trim()

  return {
    ...prev,
    xp: totalXp,
    level,
    megaStreak: streak,
    levelProgressPercent: Number.isFinite(progressPercent) ? progressPercent : prev.levelProgressPercent,
    nextLevelXp: Number.isFinite(nextLevelXp) && nextLevelXp > 0 ? nextLevelXp : prev.nextLevelXp,
    currentLevelName: levelName || prev.currentLevelName,
  }
}
