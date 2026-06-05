import type { FriendActivity } from "@/lib/types"

/** Первая буква имени друга для аватар-фолбэка. */
export function getInitial(name: string): string {
  const trimmed = name.trim()
  return trimmed.length > 0 ? trimmed[0]!.toUpperCase() : "?"
}

/**
 * Превращает ISO timestamp в короткую human-readable строку
 * («just now», «12m ago», «3h ago», «2d ago»).
 */
export function formatTimeAgo(iso: string, now: Date = new Date()): string {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ""
  const diffMs = now.getTime() - t
  const sec = Math.max(0, Math.floor(diffMs / 1000))
  if (sec < 60) return "just now"
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  return `${d}d ago`
}

/**
 * Рендерит текст события из enum kind + payload + label.
 * Бэк намеренно не отдаёт готовую строку (см. profile_endpoints_integration.md).
 */
export function formatFriendAction(friend: FriendActivity): string {
  const title = (friend.payload.quest_title as string | undefined) ?? friend.questLabel ?? "a quest"
  switch (friend.kind) {
    case "completed_quest":
      return `Completed ${title}`
    case "started_quest":
      return `Started ${title}`
    case "leveled_up": {
      const level = friend.payload.level
      return typeof level === "number" ? `Leveled up to ${level}` : "Leveled up"
    }
    case "streak_milestone": {
      const streak = friend.payload.streak
      return typeof streak === "number" ? `Hit a ${streak}-day streak` : "Hit a streak milestone"
    }
  }
}
