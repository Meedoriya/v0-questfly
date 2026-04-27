"use client"

import { useState } from "react"
import { useApp } from "@/lib/store"
import type { Habit } from "@/lib/types"
import {
  ArrowLeft,
  BookOpen,
  Dumbbell,
  Code,
  Music,
  Palette,
  Heart,
  Globe,
  Briefcase,
  GraduationCap,
  Utensils,
  Brain,
  Shield,
  Target,
  Flame,
  Droplets,
  Bike,
  Sunrise,
  Moon,
  Sun,
  Check,
} from "lucide-react"

const ICONS = [
  { id: "book", icon: BookOpen, label: "Book" },
  { id: "dumbbell", icon: Dumbbell, label: "Fitness" },
  { id: "code", icon: Code, label: "Code" },
  { id: "music", icon: Music, label: "Music" },
  { id: "palette", icon: Palette, label: "Art" },
  { id: "heart", icon: Heart, label: "Health" },
  { id: "globe", icon: Globe, label: "Language" },
  { id: "briefcase", icon: Briefcase, label: "Work" },
  { id: "graduation", icon: GraduationCap, label: "Study" },
  { id: "utensils", icon: Utensils, label: "Nutrition" },
  { id: "brain", icon: Brain, label: "Mind" },
  { id: "shield", icon: Shield, label: "Discipline" },
  { id: "target", icon: Target, label: "Focus" },
  { id: "flame", icon: Flame, label: "Energy" },
  { id: "droplets", icon: Droplets, label: "Water" },
  { id: "bike", icon: Bike, label: "Cardio" },
]

const CHARACTERISTICS = ["Strength", "Focus", "Creativity", "Discipline"]
const FREQUENCIES = [
  { id: "every-day" as const, label: "Every day" },
  { id: "specific-days" as const, label: "Specific days" },
  { id: "x-times-week" as const, label: "X times a week" },
]
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const TIME_SLOTS = [
  { id: "morning", label: "Morning", icon: Sunrise, time: "07:00" },
  { id: "afternoon", label: "Afternoon", icon: Sun, time: "13:00" },
  { id: "evening", label: "Evening", icon: Moon, time: "20:00" },
]

export function CreateHabitManualScreen() {
  const { setScreen, setPendingHabit, quests } = useApp()

  const [name, setName] = useState("")
  const [selectedIcon, setSelectedIcon] = useState("heart")
  const [characteristic, setCharacteristic] = useState("Discipline")
  const [frequency, setFrequency] = useState<"every-day" | "specific-days" | "x-times-week">("every-day")
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [timesPerWeek, setTimesPerWeek] = useState(3)
  const [timeOfDay, setTimeOfDay] = useState<string | undefined>(undefined)
  const [showLinkSheet, setShowLinkSheet] = useState(false)
  const [linkedQuestId, setLinkedQuestId] = useState<string | undefined>(undefined)
  const [resetOnSkip, setResetOnSkip] = useState(true)

  const linkedQuest = quests.find((q) => q.id === linkedQuestId)
  const isRankLinked = linkedQuest?.mode === "Rank"

  const toggleDay = (day: string) => {
    setSelectedDays((d) => (d.includes(day) ? d.filter((x) => x !== day) : [...d, day]))
  }

  const handleSave = () => {
    if (!name.trim()) return
    const habit: Habit = {
      id: `h-${Date.now()}`,
      title: name.trim(),
      completed: false,
      streak: 0,
      icon: selectedIcon,
      characteristic,
      frequency,
      frequencyDays: frequency === "specific-days" ? selectedDays : undefined,
      frequencyCount: frequency === "x-times-week" ? timesPerWeek : undefined,
      timeOfDay,
      resetOnSkip: isRankLinked ? true : resetOnSkip,
      linkedQuestId,
    }
    setPendingHabit(habit)
    setScreen("habit-notification")
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-3 px-4 pb-4 pt-12">
        <button
          onClick={() => setScreen("add-habit-entry")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="font-serif text-xl font-bold text-foreground">Create Habit</h1>
      </header>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 pb-32 pt-2">
        {/* Name */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Habit Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Morning push-ups"
            className="rounded-xl border border-border bg-card px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Icon Picker */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Icon</label>
          <div className="grid grid-cols-8 gap-2">
            {ICONS.map((ic) => {
              const IconComp = ic.icon
              const isSelected = selectedIcon === ic.id
              return (
                <button
                  key={ic.id}
                  onClick={() => setSelectedIcon(ic.id)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
                    isSelected
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label={ic.label}
                >
                  <IconComp className="h-4 w-4" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Characteristic */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Characteristic</label>
          <div className="flex flex-wrap gap-2">
            {CHARACTERISTICS.map((c) => (
              <button
                key={c}
                onClick={() => setCharacteristic(c)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                  characteristic === c
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Frequency</label>
          <div className="flex flex-col gap-2">
            {FREQUENCIES.map((f) => (
              <button
                key={f.id}
                onClick={() => setFrequency(f.id)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3.5 text-sm font-medium transition-all ${
                  frequency === f.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:bg-secondary/50"
                }`}
              >
                {f.label}
                {frequency === f.id && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>

          {/* Specific days picker */}
          {frequency === "specific-days" && (
            <div className="mt-2 flex gap-2">
              {WEEKDAYS.map((d) => (
                <button
                  key={d}
                  onClick={() => toggleDay(d)}
                  className={`flex h-10 flex-1 items-center justify-center rounded-lg border text-xs font-semibold transition-all ${
                    selectedDays.includes(d)
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {d.charAt(0)}
                </button>
              ))}
            </div>
          )}

          {/* X times per week */}
          {frequency === "x-times-week" && (
            <div className="mt-2 flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3">
              <span className="flex-1 text-sm text-foreground">Times per week</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setTimesPerWeek((v) => Math.max(1, v - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary text-foreground"
                >
                  -
                </button>
                <span className="w-6 text-center text-sm font-bold text-foreground">{timesPerWeek}</span>
                <button
                  onClick={() => setTimesPerWeek((v) => Math.min(7, v + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary text-foreground"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Time of Day */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time of Day (optional)</label>
          <div className="flex gap-2">
            {TIME_SLOTS.map((slot) => {
              const SlotIcon = slot.icon
              const isSelected = timeOfDay === slot.time
              return (
                <button
                  key={slot.id}
                  onClick={() => setTimeOfDay(isSelected ? undefined : slot.time)}
                  className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border p-3 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <SlotIcon className="h-5 w-5" />
                  <span className="text-[10px] font-semibold">{slot.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Link to Quest */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Link to Quest</label>
          {!showLinkSheet ? (
            <button
              onClick={() => setShowLinkSheet(true)}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5 text-sm text-foreground transition-colors hover:bg-secondary/50"
            >
              <span className={linkedQuest ? "text-foreground" : "text-muted-foreground/60"}>
                {linkedQuest ? linkedQuest.title : "Keep standalone"}
              </span>
              <span className="text-xs text-primary">Change</span>
            </button>
          ) : (
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
              <button
                onClick={() => { setLinkedQuestId(undefined); setShowLinkSheet(false) }}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all ${
                  !linkedQuestId ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary/50"
                }`}
              >
                Keep standalone
                {!linkedQuestId && <Check className="h-4 w-4" />}
              </button>
              {quests.map((q) => (
                <button
                  key={q.id}
                  onClick={() => { setLinkedQuestId(q.id); setShowLinkSheet(false); if (q.mode === "Rank") setResetOnSkip(true) }}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all ${
                    linkedQuestId === q.id ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{q.title}</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-semibold uppercase text-muted-foreground">{q.mode}</span>
                  </div>
                  {linkedQuestId === q.id && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Streak Settings */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Streak Settings</label>
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Reset streak on skip</p>
              {isRankLinked && (
                <p className="mt-0.5 text-[10px] text-accent">Locked for Rank mode quests</p>
              )}
            </div>
            <button
              onClick={() => { if (!isRankLinked) setResetOnSkip(!resetOnSkip) }}
              disabled={isRankLinked}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                resetOnSkip ? "bg-primary" : "bg-secondary"
              } ${isRankLinked ? "opacity-50" : ""}`}
              aria-label="Toggle reset streak on skip"
            >
              <span
                className={`absolute top-0.5 block h-6 w-6 rounded-full bg-foreground shadow transition-transform ${
                  resetOnSkip ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 px-6 pb-8 pt-4 backdrop-blur-lg">
        <div className="mx-auto max-w-md">
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="w-full rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
