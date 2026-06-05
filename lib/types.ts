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

export interface CollabPlayer {
  id: string
  name: string
  avatar: string
  progress: number
  totalTasks: number
  rankPoints: number
  streak: number
  failedTasks: number
  impactScore: number
  roadmapPreview: string[]
}

export interface JointQuest {
  id: string
  title: string
  description: string
  deadline: string
  daysLeft: number
  player1: CollabPlayer
  player2: CollabPlayer
  status: "active" | "completed" | "failed"
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

export interface FriendActivity {
  id: string
  name: string
  avatar: string
  action: string
  questLabel: string
  characteristic: string
  timeAgo: string
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
