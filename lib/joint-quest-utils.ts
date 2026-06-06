import type { JointPlayer, JointPlayerRole, JointQuest } from "@/lib/types"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/**
 * Сколько полных дней осталось до дедлайна. Считается по UTC.
 *
 * - `> 0` — квест ещё активен (N дней до полуночи UTC дедлайн-даты+1).
 * - `0`   — сегодня UTC == deadline; последний день.
 * - `< 0` — дедлайн уже истёк (cron финализации может ещё не сработать,
 *   см. phase6_joint_quests_integration.md §9.2).
 *
 * Невалидный ISO — `0` (безопасный дефолт).
 */
export function daysLeftFromDeadline(deadlineIso: string, now: Date = new Date()): number {
  if (!deadlineIso) return 0
  const dl = Date.parse(`${deadlineIso}T00:00:00Z`)
  if (Number.isNaN(dl)) return 0
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Math.floor((dl - todayUtc) / 86_400_000)
}

/** «Mar 30, 2026» из ISO YYYY-MM-DD. Пустую строку возвращает как есть. */
export function formatDeadline(deadlineIso: string): string {
  if (!deadlineIso) return ""
  const t = Date.parse(`${deadlineIso}T00:00:00Z`)
  if (Number.isNaN(t)) return deadlineIso
  const d = new Date(t)
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
}

/** Найти игрока в snapshot'е по role. */
export function findPlayer(jq: JointQuest, role: JointPlayerRole): JointPlayer | null {
  return jq.players.find((p) => p.role === role) ?? null
}

/** Найти игрока в snapshot'е по userId. */
export function findPlayerByUserId(jq: JointQuest, userId: string): JointPlayer | null {
  return jq.players.find((p) => p.userId === userId) ?? null
}

/** Найти «другого» игрока в паре (того, кто не = me). null если меня нет в players. */
export function findOpponent(jq: JointQuest, meUserId: string): JointPlayer | null {
  const opp = jq.players.find((p) => p.userId !== meUserId)
  return opp ?? null
}

/**
 * Признак email-pending invitee: квест в pending_accept, в players только creator.
 * См. phase6_joint_quests_integration.md §6.
 */
export function isAwaitingRegistration(jq: JointQuest): boolean {
  return jq.status === "pending_accept" && jq.players.length === 1
}
