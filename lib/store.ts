"use client"

import { createContext, useContext } from "react"
import type { HydratedCampaign } from "./hydrate-campaign"
import type { Screen, Quest, Task, ChatMessage, UserProgress, Habit, StreakSummary, JointQuest } from "./types"
import { zeroCharacteristics } from "./axes"

export type { HydratedCampaign }

export interface AppState {
  screen: Screen
  goal: string
  /** Активная кампания онбординга (UUID), если пользователь в чате с платформой. */
  onboardingCampaignId: string | null
  /** Кампания для рефетча после complete / домашний контекст */
  activeCampaignId: string | null
  chatMessages: ChatMessage[]
  currentQuest: Quest | null
  currentTask: Task | null
  quests: Quest[]
  userProgress: UserProgress
  earnedXp: number
  aiInsight: string
  habits: Habit[]
  streakSummaries: StreakSummary[]
  consecutiveSkips: number
  isPaused: boolean
  completedQuestId: string | null
  pendingHabit: Habit | null
  editingHabit: Habit | null
  jointQuests: JointQuest[]
  currentJointQuest: JointQuest | null
  lastImpactValue: string
  /** Черновик комментария для POST /quests/:id/feedback (с экрана задачи). */
  feedbackDraft: string
  /** После первого GET /campaigns и выбора стартового экрана (фаза D). */
  bootstrapComplete: boolean
}

export interface AppActions {
  setScreen: (screen: Screen) => void
  setGoal: (goal: string) => void
  setOnboardingCampaignId: (id: string | null) => void
  setActiveCampaignId: (id: string | null) => void
  setQuests: (quests: Quest[]) => void
  syncCampaignFromApi: (campaignId: string) => Promise<HydratedCampaign>
  setFeedbackDraft: (text: string) => void
  addChatMessage: (msg: ChatMessage) => void
  setChatMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void
  setCurrentQuest: (quest: Quest) => void
  setCurrentTask: (task: Task | null) => void
  completeTask: (taskId: string, note?: string) => void
  addXp: (amount: number) => void
  setEarnedXp: (xp: number) => void
  setAiInsight: (insight: string) => void
  togglePause: () => void
  setCompletedQuestId: (id: string | null) => void
  toggleTaskStatus: (taskId: string) => void
  addHabit: (habit: Habit) => void
  toggleHabit: (habitId: string) => void
  setHabits: (habits: Habit[]) => void
  refreshHabitsFromApi: () => void
  refreshCharacterFromApi: () => void
  setPendingHabit: (habit: Habit | null) => void
  setEditingHabit: (habit: Habit | null) => void
  updateHabitOnApi: (id: string, habit: Habit) => Promise<boolean>
  deleteHabitOnApi: (id: string) => Promise<boolean>
  setCurrentJointQuest: (quest: JointQuest | null) => void
  addJointQuest: (quest: JointQuest) => void
  setLastImpactValue: (value: string) => void
}

export type AppContextType = AppState & AppActions

export const AppContext = createContext<AppContextType | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}

export const initialState: AppState = {
  screen: "goal-input",
  goal: "",
  onboardingCampaignId: null,
  activeCampaignId: null,
  chatMessages: [],
  currentQuest: null,
  currentTask: null,
  quests: [],
  userProgress: {
    xp: 0,
    level: 1,
    megaStreak: 0,
    weekActivity: [false, false, false, false, false, false, false],
    characteristics: zeroCharacteristics(),
    friends: [],
  },
  earnedXp: 0,
  aiInsight: "",
  habits: [],
  streakSummaries: [
    { name: "Morning meditation", survived: true, previousStreak: 7 },
    { name: "Read 20 pages", survived: false, previousStreak: 4 },
    { name: "Daily coding", survived: true, previousStreak: 15 },
    { name: "Drink 2L water", survived: true, previousStreak: 12 },
    { name: "Journal before bed", survived: false, previousStreak: 0 },
  ],
  consecutiveSkips: 0,
  isPaused: false,
  completedQuestId: null,
  pendingHabit: null,
  editingHabit: null,
  jointQuests: [
    {
      id: "jq1",
      title: "Read 12 Books Together",
      description: "Both players read independently and track pages daily.",
      deadline: "Mar 30, 2026",
      daysLeft: 44,
      status: "active",
      player1: {
        id: "me",
        name: "You",
        avatar: "QF",
        progress: 5,
        totalTasks: 12,
        rankPoints: 320,
        streak: 7,
        failedTasks: 1,
        impactScore: 480,
        roadmapPreview: ["Read Ch.1-3", "Summarize notes", "Quiz review", "Read Ch.4-6"],
      },
      player2: {
        id: "f1",
        name: "Alex",
        avatar: "A",
        progress: 4,
        totalTasks: 12,
        rankPoints: 280,
        streak: 5,
        failedTasks: 2,
        impactScore: 390,
        roadmapPreview: ["Read Ch.1-2", "Write reflection", "Read Ch.3-4", "Book discussion"],
      },
    },
  ],
  currentJointQuest: null,
  lastImpactValue: "",
  feedbackDraft: "",
  bootstrapComplete: false,
}
