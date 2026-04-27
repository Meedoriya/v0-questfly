"use client"

import { useApp } from "@/lib/store"
import {
  ArrowLeft,
  PenLine,
  Sparkles,
} from "lucide-react"

export function AddHabitEntryScreen() {
  const { setScreen } = useApp()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-3 px-4 pb-4 pt-12">
        <button
          onClick={() => setScreen("home")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-secondary/80"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="font-serif text-xl font-bold text-foreground">Add Habit</h1>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-6 pt-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          How would you like to create your new habit?
        </p>

        {/* Create Manually */}
        <button
          onClick={() => setScreen("create-habit-manual")}
          className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-primary/30 hover:bg-primary/5 active:scale-[0.98]"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
            <PenLine className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-foreground">Create manually</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Set up your habit with custom name, frequency, and characteristic
            </p>
          </div>
        </button>

        {/* Ask AI */}
        <button
          onClick={() => setScreen("ask-ai-habit")}
          className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-accent/30 hover:bg-accent/5 active:scale-[0.98]"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent/10 transition-colors group-hover:bg-accent/15">
            <Sparkles className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-foreground">Ask AI</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Describe what you want and AI will generate the perfect habit for you
            </p>
          </div>
        </button>
      </div>
    </div>
  )
}
