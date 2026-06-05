import { asRecord, str } from "@/lib/api/json-helpers"
import type { FriendActionKind, FriendActivity } from "@/lib/types"

const KNOWN_KINDS: ReadonlySet<FriendActionKind> = new Set<FriendActionKind>([
  "completed_quest",
  "leveled_up",
  "started_quest",
  "streak_milestone",
])

/**
 * Парсит ответ GET /users/me/friends в плоский массив FriendActivity.
 * Сейчас бэк возвращает `{ friends: [] }` (stub). Контракт зафиксирован
 * заранее, чтобы при запуске реальной фичи подключение было zero-cost.
 */
export function mapFriendsResponse(raw: unknown): FriendActivity[] {
  const d = asRecord(raw)
  if (!d) return []
  const items = d.friends
  if (!Array.isArray(items)) return []

  return items
    .map((entry): FriendActivity | null => {
      const r = asRecord(entry)
      if (!r) return null
      const id = str(r.id, "")
      const name = str(r.name, "")
      const kindRaw = str(r.kind, "")
      if (!id || !name || !KNOWN_KINDS.has(kindRaw as FriendActionKind)) return null

      const avatarUrl = typeof r.avatar_url === "string" ? r.avatar_url : null
      const payload = asRecord(r.payload) ?? {}
      const questLabel = typeof r.quest_label === "string" ? r.quest_label : null
      const characteristic = typeof r.characteristic === "string" ? r.characteristic : null
      const happenedAt = str(r.happened_at, "")

      return {
        id,
        name,
        avatarUrl,
        kind: kindRaw as FriendActionKind,
        payload,
        questLabel,
        characteristic,
        happenedAt,
      }
    })
    .filter((x): x is FriendActivity => x !== null)
}
