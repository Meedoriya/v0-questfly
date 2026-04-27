"use client"

import { useState } from "react"
import { Calendar, RefreshCw, ChevronDown, X, Check } from "lucide-react"

type AdjustmentOption = "change-day" | "change-frequency" | "reduce-difficulty"

interface ScheduleSheetProps {
  onClose: () => void
  onConfirm: (option: AdjustmentOption, value: string) => void
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const FREQUENCIES = ["Daily", "Every other day", "3x per week", "Weekdays only", "Weekends only"]
const DIFFICULTIES = ["Keep current", "Slightly easier", "Much easier", "Minimal effort"]

export function ScheduleSheet({ onClose, onConfirm }: ScheduleSheetProps) {
  const [selected, setSelected] = useState<AdjustmentOption>("change-day")
  const [selectedDay, setSelectedDay] = useState("Mon")
  const [selectedFrequency, setSelectedFrequency] = useState("Daily")
  const [selectedDifficulty, setSelectedDifficulty] = useState("Slightly easier")

  const options: { id: AdjustmentOption; label: string; icon: React.ElementType; description: string }[] = [
    { id: "change-day", label: "Change Day", icon: Calendar, description: "Pick a better day for this task" },
    { id: "change-frequency", label: "Change Frequency", icon: RefreshCw, description: "Adjust how often this repeats" },
    { id: "reduce-difficulty", label: "Reduce Difficulty", icon: ChevronDown, description: "Lower the effort required" },
  ]

  const handleConfirm = () => {
    const value =
      selected === "change-day" ? selectedDay :
      selected === "change-frequency" ? selectedFrequency :
      selectedDifficulty
    onConfirm(selected, value)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-border bg-card animate-slide-up">
        <div className="mx-auto max-w-md px-6 pb-10 pt-4">
          {/* Handle */}
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-lg font-bold text-foreground">Adjust Schedule</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-foreground" />
            </button>
          </div>

          {/* Option Tabs */}
          <div className="flex gap-2 mb-6">
            {options.map((opt) => {
              const Icon = opt.icon
              const isActive = selected === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelected(opt.id)}
                  className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border p-3 transition-all ${
                    isActive
                      ? "border-primary/40 bg-primary/10"
                      : "border-border bg-secondary/50 hover:bg-secondary"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-[10px] font-semibold text-center leading-tight ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {opt.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Content */}
          <div className="mb-6">
            {selected === "change-day" && (
              <div>
                <p className="text-xs text-muted-foreground mb-3">Select a new day for this task</p>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`flex h-11 w-11 items-center justify-center rounded-xl text-xs font-semibold transition-all ${
                        selectedDay === day
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selected === "change-frequency" && (
              <div>
                <p className="text-xs text-muted-foreground mb-3">How often should this repeat?</p>
                <div className="flex flex-col gap-2">
                  {FREQUENCIES.map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setSelectedFrequency(freq)}
                      className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                        selectedFrequency === freq
                          ? "border-primary/40 bg-primary/10"
                          : "border-border bg-secondary/30 hover:bg-secondary/50"
                      }`}
                    >
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        selectedFrequency === freq ? "border-primary bg-primary" : "border-muted-foreground/30"
                      }`}>
                        {selectedFrequency === freq && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <span className={`text-sm font-medium ${
                        selectedFrequency === freq ? "text-foreground" : "text-muted-foreground"
                      }`}>
                        {freq}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selected === "reduce-difficulty" && (
              <div>
                <p className="text-xs text-muted-foreground mb-3">Choose a difficulty level</p>
                <div className="flex flex-col gap-2">
                  {DIFFICULTIES.map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                        selectedDifficulty === diff
                          ? "border-primary/40 bg-primary/10"
                          : "border-border bg-secondary/30 hover:bg-secondary/50"
                      }`}
                    >
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        selectedDifficulty === diff ? "border-primary bg-primary" : "border-muted-foreground/30"
                      }`}>
                        {selectedDifficulty === diff && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <span className={`text-sm font-medium ${
                        selectedDifficulty === diff ? "text-foreground" : "text-muted-foreground"
                      }`}>
                        {diff}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm */}
          <button
            onClick={handleConfirm}
            className="flex h-14 w-full items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Confirm
          </button>
        </div>
      </div>
    </>
  )
}
