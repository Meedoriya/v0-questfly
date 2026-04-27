"use client"

import { useApp } from "@/lib/store"
import { GoalInputScreen } from "@/components/screens/goal-input"
import { AiChatScreen } from "@/components/screens/ai-chat"
import { LoadingScreen } from "@/components/screens/loading-screen"
import { FirstTaskScreen } from "@/components/screens/first-task"
import { TaskWaitingScreen } from "@/components/screens/task-waiting"
import { FeedbackScreen } from "@/components/screens/feedback-screen"
import { PaywallScreen } from "@/components/screens/paywall-screen"
import { HomeScreen } from "@/components/screens/home-screen"
import { QuestRoadmapScreen } from "@/components/screens/quest-roadmap"
import { DaySummaryScreen } from "@/components/screens/day-summary"
import { QuestFailureScreen } from "@/components/screens/quest-failure"
import { MegaStreakResetScreen, MegaStreakSuccessScreen } from "@/components/screens/mega-streak"
import { QuestCelebrationScreen } from "@/components/screens/quest-celebration"
import { RankSummaryScreen } from "@/components/screens/rank-summary"
import { CasualSummaryScreen } from "@/components/screens/casual-summary"
import { AiReflectionScreen } from "@/components/screens/ai-reflection"
import { QuestActivityScreen } from "@/components/screens/quest-activity"
import { CharacteristicsScreen } from "@/components/screens/characteristics-screen"
import { NextQuestScreen } from "@/components/screens/next-quest"
import { AddHabitEntryScreen } from "@/components/screens/add-habit-entry"
import { CreateHabitManualScreen } from "@/components/screens/create-habit-manual"
import { AskAiHabitScreen } from "@/components/screens/ask-ai-habit"
import { HabitNotificationScreen } from "@/components/screens/habit-notification"
import { HabitConfirmationScreen } from "@/components/screens/habit-confirmation"
import { CollabQuestSettingsScreen } from "@/components/screens/collab-quest-settings"
import { CollabInviteScreen } from "@/components/screens/collab-invite"
import { CollabImpactInputScreen } from "@/components/screens/collab-impact-input"
import { CollabFriendStatusScreen } from "@/components/screens/collab-friend-status"
import { CollabQuestFailureScreen } from "@/components/screens/collab-quest-failure"
import { CollabCelebrationScreen } from "@/components/screens/collab-celebration"
import { CollabFinalResultsScreen } from "@/components/screens/collab-final-results"

export function ScreenRouter() {
  const { screen, bootstrapComplete } = useApp()

  if (!bootstrapComplete) {
    return <LoadingScreen />
  }

  switch (screen) {
    case "goal-input":
      return <GoalInputScreen />
    case "ai-chat":
      return <AiChatScreen />
    case "loading":
      return <LoadingScreen />
    case "first-task":
      return <FirstTaskScreen />
    case "task-waiting":
      return <TaskWaitingScreen />
    case "feedback":
      return <FeedbackScreen />
    case "paywall":
      return <PaywallScreen />
    case "home":
      return <HomeScreen />
    case "quest-roadmap":
      return <QuestRoadmapScreen />
    case "day-summary":
      return <DaySummaryScreen />
    case "quest-failure":
      return <QuestFailureScreen />
    case "mega-streak-reset":
      return <MegaStreakResetScreen />
    case "mega-streak-success":
      return <MegaStreakSuccessScreen />
    case "quest-celebration":
      return <QuestCelebrationScreen />
    case "rank-summary":
      return <RankSummaryScreen />
    case "casual-summary":
      return <CasualSummaryScreen />
    case "ai-reflection":
      return <AiReflectionScreen />
    case "quest-activity":
      return <QuestActivityScreen />
    case "characteristics-screen":
      return <CharacteristicsScreen />
    case "next-quest":
      return <NextQuestScreen />
    case "add-habit-entry":
      return <AddHabitEntryScreen />
    case "create-habit-manual":
      return <CreateHabitManualScreen />
    case "ask-ai-habit":
      return <AskAiHabitScreen />
    case "habit-notification":
      return <HabitNotificationScreen />
    case "habit-confirmation":
      return <HabitConfirmationScreen />
    case "collab-quest-settings":
      return <CollabQuestSettingsScreen />
    case "collab-invite":
      return <CollabInviteScreen />
    case "collab-impact-input":
      return <CollabImpactInputScreen />
    case "collab-friend-status":
      return <CollabFriendStatusScreen />
    case "collab-quest-failure":
      return <CollabQuestFailureScreen />
    case "collab-celebration":
      return <CollabCelebrationScreen />
    case "collab-final-results":
      return <CollabFinalResultsScreen />
    default:
      return <GoalInputScreen />
  }
}
