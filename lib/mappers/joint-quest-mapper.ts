import { asRecord, num, str } from "@/lib/api/json-helpers"
import type {
  JointPlayer,
  JointPlayerRole,
  JointQuest,
  JointQuestStatus,
} from "@/lib/types"

const VALID_STATUSES: ReadonlySet<JointQuestStatus> = new Set<JointQuestStatus>([
  "pending_accept",
  "active",
  "completed",
  "failed",
  "declined",
])

const VALID_ROLES: ReadonlySet<JointPlayerRole> = new Set<JointPlayerRole>([
  "creator",
  "invitee",
])

/**
 * Парсит один JointQuest из ответа API.
 * Возвращает null если запись битая (нет id или невалидный status).
 */
export function mapJointQuest(raw: unknown): JointQuest | null {
  const r = asRecord(raw)
  if (!r) return null
  const id = str(r.id, "")
  const status = str(r.status, "")
  if (!id || !VALID_STATUSES.has(status as JointQuestStatus)) return null

  const players = Array.isArray(r.players)
    ? (r.players
        .map((p) => mapPlayer(p))
        .filter((p): p is JointPlayer => p !== null))
    : []

  return {
    id,
    title: str(r.title, ""),
    description: str(r.description, ""),
    deadline: str(r.deadline, ""),
    status: status as JointQuestStatus,
    totalTasks: num(r.total_tasks, 0),
    winnerUserId: typeof r.winner_user_id === "string" ? r.winner_user_id : null,
    completedAt: typeof r.completed_at === "string" ? r.completed_at : null,
    players,
  }
}

/** Парсит ответ GET /joint-quests в массив (битые записи отбрасываются). */
export function mapJointQuestsList(raw: unknown): JointQuest[] {
  const d = asRecord(raw)
  if (!d) return []
  const items = d.joint_quests
  if (!Array.isArray(items)) return []
  return items
    .map((x) => mapJointQuest(x))
    .filter((x): x is JointQuest => x !== null)
}

function mapPlayer(raw: unknown): JointPlayer | null {
  const r = asRecord(raw)
  if (!r) return null
  const userId = str(r.user_id, "")
  const role = str(r.role, "")
  if (!userId || !VALID_ROLES.has(role as JointPlayerRole)) return null

  const roadmapPreview = Array.isArray(r.roadmap_preview)
    ? r.roadmap_preview.filter((x): x is string => typeof x === "string")
    : []

  return {
    userId,
    role: role as JointPlayerRole,
    acceptedAt: typeof r.accepted_at === "string" ? r.accepted_at : null,
    progress: num(r.progress, 0),
    totalTasks: num(r.total_tasks, 0),
    rankPoints: num(r.rank_points, 0),
    rankIncrease: num(r.rank_increase, 0),
    longestStreak: num(r.longest_streak, 0),
    failedTasks: num(r.failed_tasks, 0),
    impactScore: num(r.impact_score, 0),
    roadmapPreview,
    completedToday: r.completed_today === true,
    todayImpactValue: typeof r.today_impact_value === "string" ? r.today_impact_value : null,
    name: str(r.name, ""),
    avatarUrl: typeof r.avatar_url === "string" ? r.avatar_url : null,
  }
}
