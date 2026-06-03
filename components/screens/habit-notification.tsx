"use client"

import { useState } from "react"
import { useApp } from "@/lib/store"
import {
  ArrowLeft,
  Bell,
  Sparkles,
  Clock,
  Check,
} from "lucide-react"

const TIME_OPTIONS = [
  { time: "06:00", label: "6:00 AM" },
  { time: "07:00", label: "7:00 AM" },
  { time: "08:00", label: "8:00 AM" },
  { time: "09:00", label: "9:00 AM" },
  { time: "12:00", label: "12:00 PM" },
  { time: "13:00", label: "1:00 PM" },
  { time: "17:00", label: "5:00 PM" },
  { time: "18:00", label: "6:00 PM" },
  { time: "20:00", label: "8:00 PM" },
  { time: "21:00", label: "9:00 PM" },
  { time: "22:00", label: "10:00 PM" },
]

function getAiSuggestedTime(habitTime?: string): string {
  if (habitTime) return habitTime
  return "08:00"
}

export function HabitNotificationScreen() {
  const { setScreen, pendingHabit, setPendingHabit } = useApp()
  const aiSuggested = getAiSuggestedTime(pendingHabit?.timeOfDay)
  const [selectedTime, setSelectedTime] = useState(aiSuggested)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  const handleConfirm = () => {
    if (pendingHabit) {
      setPendingHabit({
        ...pendingHabit,
        timeOfDay: selectedTime,
        reminderEnabled: notificationsEnabled,
      })
    }
    setScreen("habit-confirmation")
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-3 px-4 pb-4 pt-12">
        <button
          onClick={() => setScreen("create-habit-manual")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="font-serif text-xl font-bold text-foreground">Notification</h1>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-6 pt-4">
        {/* Bell icon */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Bell className="h-9 w-9 text-primary" />
          </div>
          <h2 className="text-center text-lg font-bold text-foreground">Set a reminder</h2>
          <p className="max-w-[260px] text-center text-sm leading-relaxed text-muted-foreground">
            {"We'll nudge you at the right time so you never miss a day"}
          </p>
        </div>

        {/* Enable/disable toggle */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Bell className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Enable notifications</span>
          </div>
          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`relative h-7 w-12 rounded-full transition-colors ${notificationsEnabled ? "bg-primary" : "bg-secondary"}`}
            aria-label="Toggle notifications"
          >
            <span className={`absolute top-0.5 block h-6 w-6 rounded-full bg-foreground shadow transition-transform ${notificationsEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>

        {/* Time picker */}
        {notificationsEnabled && (
          <div className="flex flex-col gap-3">
            {/* AI suggestion highlight */}
            <div className="flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs text-accent">
                AI suggests{" "}
                <span className="font-bold">
                  {TIME_OPTIONS.find((t) => t.time === aiSuggested)?.label || aiSuggested}
                </span>{" "}
                based on your habit timing
              </span>
            </div>

            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Choose a time
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TIME_OPTIONS.map((opt) => {
                const isSelected = selectedTime === opt.time
                const isAiPick = opt.time === aiSuggested
                return (
                  <button
                    key={opt.time}
                    onClick={() => setSelectedTime(opt.time)}
                    className={`relative flex items-center justify-center rounded-xl border py-3 text-sm font-medium transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    {opt.label}
                    {isAiPick && !isSelected && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent">
                        <Sparkles className="h-2.5 w-2.5 text-accent-foreground" />
                      </span>
                    )}
                    {isSelected && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Confirm */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 px-6 pb-8 pt-4 backdrop-blur-lg">
        <div className="mx-auto max-w-md">
          <button
            onClick={handleConfirm}
            className="w-full rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            {notificationsEnabled ? "Set Reminder" : "Skip for Now"}
          </button>
        </div>
      </div>
    </div>
  )
}
