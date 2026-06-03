"use client"

import { useState, useCallback, useRef, useEffect, type ReactNode } from "react"
import { AppContext, initialState, type AppState } from "@/lib/store"
import { hydrateCampaignState } from "@/lib/hydrate-campaign"
import { resolveInitialSessionFromCampaigns } from "@/lib/resolve-initial-session"
import { completeRoutine, uncompleteRoutine, updateRoutine, deleteRoutine } from "@/lib/api/routines"
import { getUserCharacter } from "@/lib/api/character"
import { fetchDailyHabitsMapped } from "@/lib/mappers/routine-mapper"
import { habitDraftToCreateRoutine } from "@/lib/mappers/habit-form-to-routine"
import { patchUserProgressFromCharacterGet } from "@/lib/mappers/character-mapper"
import { todayISODate } from "@/lib/date-iso"
import type { Screen, Quest, Task, ChatMessage, Habit, JointQuest } from "@/lib/types"

const ROUTINE_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState)
  const habitsRef = useRef(state.habits)
  useEffect(() => {
    habitsRef.current = state.habits
  }, [state.habits])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      let patch: Partial<AppState> | null = null
      try {
        patch = await resolveInitialSessionFromCampaigns(initialState.goal)
      } catch {
        /* сеть / 401 */
      }
      if (cancelled) return
      setState((s) => ({ ...s, ...patch, bootstrapComplete: true }))
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const setScreen = useCallback((screen: Screen) => {
    setState((s) => ({ ...s, screen }))
  }, [])

  const setGoal = useCallback((goal: string) => {
    setState((s) => ({ ...s, goal }))
  }, [])

  const setOnboardingCampaignId = useCallback((id: string | null) => {
    setState((s) => ({ ...s, onboardingCampaignId: id }))
  }, [])

  const setActiveCampaignId = useCallback((id: string | null) => {
    setState((s) => ({ ...s, activeCampaignId: id }))
  }, [])

  const setQuests = useCallback((quests: Quest[]) => {
    setState((s) => ({ ...s, quests }))
  }, [])

  const syncCampaignFromApi = useCallback(async (campaignId: string) => {
    const next = await hydrateCampaignState(campaignId)
    setState((s) => ({
      ...s,
      quests: next.quests,
      currentQuest: next.currentQuest,
      currentTask: next.currentTask,
    }))
    return next
  }, [])

  const setFeedbackDraft = useCallback((text: string) => {
    setState((s) => ({ ...s, feedbackDraft: text }))
  }, [])

  const addChatMessage = useCallback((msg: ChatMessage) => {
    setState((s) => ({ ...s, chatMessages: [...s.chatMessages, msg] }))
  }, [])

  const setChatMessages = useCallback(
    (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      setState((s) => ({
        ...s,
        chatMessages: typeof messages === "function" ? messages(s.chatMessages) : messages,
      }))
    },
    [],
  )

  const setCurrentQuest = useCallback((quest: Quest) => {
    setState((s) => ({
      ...s,
      currentQuest: quest,
      quests: s.quests.some((q) => q.id === quest.id)
        ? s.quests.map((q) => (q.id === quest.id ? quest : q))
        : [...s.quests, quest],
    }))
  }, [])

  const setCurrentTask = useCallback((task: Task | null) => {
    setState((s) => ({ ...s, currentTask: task }))
  }, [])

  const completeTask = useCallback((taskId: string, note?: string) => {
    setState((s) => {
      const updatedQuests = s.quests.map((q) => ({
        ...q,
        tasks: q.tasks.map((t) =>
          t.id === taskId ? { ...t, status: "done" as const, note } : t
        ),
        progress: q.tasks.filter((t) => t.id === taskId || t.status === "done").length,
      }))
      return {
        ...s,
        quests: updatedQuests,
        currentQuest: s.currentQuest
          ? updatedQuests.find((q) => q.id === s.currentQuest!.id) || s.currentQuest
          : null,
      }
    })
  }, [])

  const addXp = useCallback((amount: number) => {
    setState((s) => {
      const newXp = s.userProgress.xp + amount
      const newLevel = Math.floor(newXp / 100) + 1
      return {
        ...s,
        userProgress: {
          ...s.userProgress,
          xp: newXp,
          level: newLevel,
        },
      }
    })
  }, [])

  const setEarnedXp = useCallback((xp: number) => {
    setState((s) => ({ ...s, earnedXp: xp }))
  }, [])

  const setAiInsight = useCallback((insight: string) => {
    setState((s) => ({ ...s, aiInsight: insight }))
  }, [])

  const togglePause = useCallback(() => {
    setState((s) => ({ ...s, isPaused: !s.isPaused }))
  }, [])

  const setCompletedQuestId = useCallback((id: string | null) => {
    setState((s) => ({ ...s, completedQuestId: id }))
  }, [])

  const toggleTaskStatus = useCallback((taskId: string) => {
    setState((s) => {
      const updatedQuests = s.quests.map((q) => ({
        ...q,
        tasks: q.tasks.map((t) =>
          t.id === taskId
            ? { ...t, status: (t.status === "done" ? "active" : "done") as "done" | "active" }
            : t
        ),
        progress: q.tasks.reduce((acc, t) => {
          if (t.id === taskId) return acc + (t.status === "done" ? 0 : 1)
          return acc + (t.status === "done" ? 1 : 0)
        }, 0),
      }))
      return {
        ...s,
        quests: updatedQuests,
        currentQuest: s.currentQuest
          ? updatedQuests.find((q) => q.id === s.currentQuest!.id) || s.currentQuest
          : null,
      }
    })
  }, [])

  const addHabit = useCallback((habit: Habit) => {
    setState((s) => ({ ...s, habits: [...s.habits, habit], pendingHabit: null }))
  }, [])

  const setHabits = useCallback((habits: Habit[]) => {
    setState((s) => ({ ...s, habits }))
  }, [])

  const refreshHabitsFromApi = useCallback(() => {
    void (async () => {
      try {
        const habits = await fetchDailyHabitsMapped()
        setState((s) => ({ ...s, habits }))
      } catch {
        /* офлайн / 401 */
      }
    })()
  }, [])

  const refreshCharacterFromApi = useCallback(() => {
    void (async () => {
      try {
        const raw = await getUserCharacter()
        setState((s) => ({
          ...s,
          userProgress: patchUserProgressFromCharacterGet(s.userProgress, raw),
        }))
      } catch {
        /* офлайн / 401 */
      }
    })()
  }, [])

  const toggleHabit = useCallback((habitId: string) => {
    void (async () => {
      const h = habitsRef.current.find((x) => x.id === habitId)
      if (!h) return
      const isApi = ROUTINE_ID_RE.test(habitId)
      if (!isApi) {
        setState((s) => ({
          ...s,
          habits: s.habits.map((hab) =>
            hab.id === habitId
              ? {
                  ...hab,
                  completed: !hab.completed,
                  streak: !hab.completed ? hab.streak + 1 : Math.max(0, hab.streak - 1),
                }
              : hab
          ),
        }))
        return
      }
      try {
        const day = todayISODate()
        if (h.completed) {
          await uncompleteRoutine(habitId, day)
        } else {
          await completeRoutine(habitId, day)
        }
        const [habits, rawChar] = await Promise.all([fetchDailyHabitsMapped(), getUserCharacter()])
        setState((s) => ({
          ...s,
          habits,
          userProgress: patchUserProgressFromCharacterGet(s.userProgress, rawChar),
        }))
      } catch {
        try {
          const habits = await fetchDailyHabitsMapped()
          setState((s) => ({ ...s, habits }))
        } catch {
          /* ignore */
        }
        refreshCharacterFromApi()
      }
    })()
  }, [refreshCharacterFromApi])

  const setPendingHabit = useCallback((habit: Habit | null) => {
    setState((s) => ({ ...s, pendingHabit: habit }))
  }, [])

  const setEditingHabit = useCallback((habit: Habit | null) => {
    setState((s) => ({ ...s, editingHabit: habit }))
  }, [])

  /** Сохранить правки привычки: UUID → PATCH /routines, локальный черновик → стейт. */
  const updateHabitOnApi = useCallback(
    async (id: string, habit: Habit): Promise<boolean> => {
      if (ROUTINE_ID_RE.test(id)) {
        try {
          await updateRoutine(id, habitDraftToCreateRoutine(habit))
        } catch {
          return false
        }
        refreshHabitsFromApi()
        return true
      }
      setState((s) => ({
        ...s,
        habits: s.habits.map((h) => (h.id === id ? { ...habit, id } : h)),
      }))
      return true
    },
    [refreshHabitsFromApi],
  )

  /** Удалить привычку: UUID → DELETE /routines, локальный черновик → стейт. */
  const deleteHabitOnApi = useCallback(async (id: string): Promise<boolean> => {
    if (ROUTINE_ID_RE.test(id)) {
      try {
        await deleteRoutine(id)
      } catch {
        return false
      }
    }
    setState((s) => ({ ...s, habits: s.habits.filter((h) => h.id !== id) }))
    return true
  }, [])

  const setCurrentJointQuest = useCallback((quest: JointQuest | null) => {
    setState((s) => ({ ...s, currentJointQuest: quest }))
  }, [])

  const addJointQuest = useCallback((quest: JointQuest) => {
    setState((s) => ({ ...s, jointQuests: [...s.jointQuests, quest] }))
  }, [])

  const setLastImpactValue = useCallback((value: string) => {
    setState((s) => ({ ...s, lastImpactValue: value }))
  }, [])

  return (
    <AppContext.Provider
      value={{
        ...state,
        setScreen,
        setGoal,
        setOnboardingCampaignId,
        setActiveCampaignId,
        setQuests,
        syncCampaignFromApi,
        setFeedbackDraft,
        addChatMessage,
        setChatMessages,
        setCurrentQuest,
        setCurrentTask,
        completeTask,
        addXp,
        setEarnedXp,
        setAiInsight,
        togglePause,
        setCompletedQuestId,
        toggleTaskStatus,
        addHabit,
        toggleHabit,
        setHabits,
        refreshHabitsFromApi,
        refreshCharacterFromApi,
        setPendingHabit,
        setEditingHabit,
        updateHabitOnApi,
        deleteHabitOnApi,
        setCurrentJointQuest,
        addJointQuest,
        setLastImpactValue,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
