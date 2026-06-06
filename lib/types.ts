export type Screen =
  | "goal-input"
  | "ai-chat"
  | "loading"
  | "first-task"
  | "task-waiting"
  | "feedback"
  | "paywall"
  | "home"
  | "quest-roadmap"
  | "day-summary"
  | "quest-failure"
  | "mega-streak-reset"
  | "mega-streak-success"
  | "quest-celebration"
  | "rank-summary"
  | "casual-summary"
  | "ai-reflection"
  | "quest-activity"
  | "characteristics-screen"
  | "next-quest"
  | "add-habit-entry"
  | "create-habit-manual"
  | "ask-ai-habit"
  | "habit-notification"
  | "habit-confirmation"
  | "collab-quest-settings"
  | "collab-invite"
  | "collab-impact-input"
  | "collab-friend-status"
  | "collab-quest-failure"
  | "collab-celebration"
  | "collab-final-results"
  | "collab-roadmap"
  | "edit-profile"

export interface Task {
  id: string
  /** ID подзадачи на бэке для POST /api/v1/subtasks/:id/complete */
  apiSubtaskId?: string
  /** Родительская TaskData из API (строки от `subtasks[]`, не синтетический лист). */
  parentTaskId?: string
  parentTaskTitle?: string
  title: string
  context: string
  instructions: string
  timeEstimate: string
  questId: string
  questTitle: string
  day: number
  status: "pending" | "active" | "done" | "transferred" | "failed"
  note?: string
  failCount?: number
  failTotal?: number
}

export interface Habit {
  id: string
  title: string
  completed: boolean
  streak: number
  icon: string
  /** Эмодзи с бэка (рутины); в списке приоритетнее иконки Lucide. */
  emoji?: string
  /** Ось жизни (AxisKey-словарь, см. lib/axes.ts); бэк принимает только эти ключи. */
  characteristic: string
  frequency: "every-day" | "specific-days" | "x-times-week"
  frequencyDays?: string[]
  frequencyCount?: number
  timeOfDay?: string
  /** Включено ли напоминание (поле reminder_enabled). */
  reminderEnabled?: boolean
  resetOnSkip: boolean
  linkedQuestId?: string
  /** Опциональные поля routine (пока без инпутов в форме — шлются дефолты). */
  notes?: string
  durationMinutes?: number
  xpReward?: number
}

export interface StreakSummary {
  name: string
  survived: boolean
  previousStreak: number
}

/** Веха (эл. GET /campaigns/:id → quests[] / QuestDetail) внутри квест-кампании. */
export interface QuestMilestone {
  /** ID квеста на бэке (POST /quests/:id/feedback, complete и т.д.) */
  id: string
  questNumber: number
  title: string
  description: string
  status: "pending" | "active" | "completed"
  tasks: Task[]
  progress: number
  totalTasks: number
}

export interface Quest {
  id: string
  /** Родительская кампания (UUID) для синхронизации с API */
  campaignId?: string
  /**
   * Когда задано — карточка Home = одна кампания-цель, внутри вехи.
   * `id` тогда синтетический `camp:<campaignId>`; для API квеста используйте `apiQuestId`.
   */
  milestones?: QuestMilestone[]
  /** ID актуальной вехи для API (feedback, complete quest), если `id` обёртка кампании. */
  apiQuestId?: string
  /** ID активной TaskData из GET .../current-quest.current_task_id; null/undefined ⇒ нет активной (квест готов к завершению). */
  currentTaskId?: string | null
  /** quest.status=completed, фидбек ещё не оставлен — показать feedback screen. */
  feedbackRequired?: boolean
  /** Фидбек получен, следующий квест ещё генерится — показать спиннер. */
  nextQuestGenerating?: boolean
  title: string
  mode: "Casual" | "Rank"
  progress: number
  totalTasks: number
  streak: number
  tasks: Task[]
  paused?: boolean
  grade?: "S" | "A" | "B" | "C"
  daysTaken?: number
  tasksCarriedOver?: number
  failedTaskCount?: number
}

export interface QuestDay {
  day: number
  status: "completed" | "failed" | "rest" | "upcoming"
}

export type JointQuestStatus =
  | "pending_accept"
  | "active"
  | "completed"
  | "failed"
  | "declined"

export type JointPlayerRole = "creator" | "invitee"

/**
 * Один игрок joint quest'а. Все скоринг-поля приходят готовыми с бэка —
 * фронт ничего не считает. До перехода в terminal status (completed/failed)
 * rank_points / rank_increase = 0.
 */
export interface JointPlayer {
  userId: string
  role: JointPlayerRole
  acceptedAt: string | null
  progress: number
  totalTasks: number
  rankPoints: number
  rankIncrease: number
  longestStreak: number
  failedTasks: number
  impactScore: number
  /** AI-сгенерированный план шагов, длина == totalTasks. */
  roadmapPreview: string[]
  /** Bool за сегодня UTC. Актуален только в ответе GET /{id}. */
  completedToday: boolean
  todayImpactValue: string | null
  /** Имя персонажа игрока. Пустая строка пока бэк не дотащит — фолбэк UI на "Player". */
  name: string
  /** Абсолютный URL аватара или null — UI фолбэк на getInitial(name). */
  avatarUrl: string | null
}

/**
 * Joint quest snapshot. См. phase6_joint_quests_integration.md.
 *
 * - `deadline` — ISO `YYYY-MM-DD` UTC. `daysLeft` считается локально через
 *   `daysLeftFromDeadline()` (см. `lib/joint-quest-utils.ts`).
 * - `players` обычно длиной 2; для email-pending invitee — 1 (только creator).
 * - `winnerUserId` != null только при `status === "completed"` и не tie.
 */
export interface JointQuest {
  id: string
  title: string
  description: string
  deadline: string
  status: JointQuestStatus
  totalTasks: number
  winnerUserId: string | null
  completedAt: string | null
  players: JointPlayer[]
}

/** Вариант ответа: строка или пара value/label с бэка. */
export type ChatOptionEntry = string | { value: string; label: string }

export interface ChatMessage {
  id: string
  role: "ai" | "user"
  content: string
  options?: ChatOptionEntry[]
}

export type AxisKey =
  | "health"
  | "appearance"
  | "environment"
  | "finance"
  | "career"
  | "growth"
  | "love"
  | "family"
  | "friends"
  | "creativity"
  | "lifestyle"
  | "spirituality"

export interface Characteristic {
  key: AxisKey
  name: string
  current: number
  max: number
  thisWeek: number
  lastWeek: number
}

/** Один день GitHub-style heatmap. `intensity` бакетизуется на бэке (0–4). */
export interface ActivityDay {
  /** ISO date `YYYY-MM-DD` (UTC). */
  date: string
  count: number
  intensity: 0 | 1 | 2 | 3 | 4
}

/**
 * Тип события в ленте друзей. Бэк отдаёт enum + payload — фронт сам рендерит
 * человекочитаемый текст (см. profile_endpoints_integration.md, friend_events).
 */
export type FriendActionKind =
  | "completed_quest"
  | "leveled_up"
  | "started_quest"
  | "streak_milestone"

export interface FriendActivity {
  /** ID друга (user_id). */
  id: string
  name: string
  /** Абсолютный URL аватара или null — фронт фолбэчит на инициалы. */
  avatarUrl: string | null
  kind: FriendActionKind
  /** Свободный bag с деталями события: quest_id, quest_title и т.п. */
  payload: Record<string, unknown>
  /** Снапшот названия квеста на момент события (квест может быть переименован/удалён). */
  questLabel: string | null
  /** Ключ характеристики или null. */
  characteristic: string | null
  /** ISO timestamp события. */
  happenedAt: string
}

export interface UserProgress {
  xp: number
  level: number
  megaStreak: number
  /** Доля прогресса внутри уровня, 0–100 (GET /users/me/character). */
  levelProgressPercent?: number
  /** Подпись текущего уровня на бэке. */
  currentLevelName?: string
  /** Порог XP следующего уровня (поле next_level_xp ответа персонажа). */
  nextLevelXp?: number
  /** Абсолютный URL аватара (?v=… для cache-bust) или null. */
  avatarUrl?: string | null
  /** Биография персонажа, ≤500 chars или null. */
  bio?: string | null
  /** Сколько всего дней с активностью (для блока "Active Days"). */
  activeDaysCount?: number
  /** Активность по дням последней недели (всегда 7 элементов: 6 дней назад → сегодня UTC). */
  weekActivity: boolean[]
  characteristics: Characteristic[]
  friends: FriendActivity[]
}
