import type { Habit, UserProgress } from "@/lib/types"
import { zeroCharacteristics } from "@/lib/axes"

export function minimalUserProgress(over: Partial<UserProgress> = {}): UserProgress {
  return {
    xp: 0,
    level: 1,
    megaStreak: 0,
    weekActivity: [false, false, false, false, false, false, false],
    characteristics: zeroCharacteristics(),
    friends: [],
    ...over,
  }
}

export function minimalHabit(over: Partial<Habit> = {}): Habit {
  return {
    id: "h-1",
    title: "Test",
    completed: false,
    streak: 0,
    icon: "book",
    characteristic: "Focus",
    frequency: "every-day",
    resetOnSkip: true,
    ...over,
  }
}
