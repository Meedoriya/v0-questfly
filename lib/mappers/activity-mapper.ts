import { asRecord, num, str } from "@/lib/api/json-helpers"
import type { ActivityDay } from "@/lib/types"

/**
 * Парсит ответ GET /users/me/activity → массив дней.
 * Дни с count=0 бэк включает явно (плотная сетка), пропуски не фолдим.
 */
export function mapActivityResponse(raw: unknown): ActivityDay[] {
  const d = asRecord(raw)
  if (!d) return []
  const days = d.days
  if (!Array.isArray(days)) return []

  return days
    .map((entry): ActivityDay | null => {
      const r = asRecord(entry)
      if (!r) return null
      const date = str(r.date, "")
      if (!date) return null
      return {
        date,
        count: num(r.completed_tasks_count, 0),
        intensity: clampIntensity(num(r.intensity, 0)),
      }
    })
    .filter((x): x is ActivityDay => x !== null)
}

function clampIntensity(v: number): 0 | 1 | 2 | 3 | 4 {
  if (v <= 0) return 0
  if (v >= 4) return 4
  return Math.round(v) as 0 | 1 | 2 | 3 | 4
}
