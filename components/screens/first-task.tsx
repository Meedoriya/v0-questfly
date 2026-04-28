"use client"

import { useApp } from "@/lib/store"
import { ArrowLeft, Clock, Flame } from "lucide-react"

export function FirstTaskScreen() {
  const { currentTask, currentQuest, setScreen } = useApp()

  function goBack() {
    setScreen("quest-roadmap")
  }

  if (!currentTask || !currentQuest) return null

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-3 px-4 pb-2 pt-12">
        <button
          onClick={goBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground transition-colors hover:bg-secondary/80"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-foreground">Day {currentTask.day}</span>
          <span className="text-xs text-muted-foreground">
            {currentTask.questTitle.trim() || currentQuest.title}
          </span>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-6 pb-32 pt-6">
        <div className="animate-float-up">
          <h2 className="font-serif text-2xl font-bold text-foreground leading-tight text-balance">
            {currentTask.title}
          </h2>
        </div>

        <div className="animate-float-up" style={{ animationDelay: "0.1s" }}>
          <div className="rounded-xl bg-secondary/50 p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {currentTask.context}
            </p>
          </div>
        </div>

        <div className="animate-float-up" style={{ animationDelay: "0.2s" }}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Instructions
          </h3>
          <p className="text-sm leading-relaxed text-foreground">
            {currentTask.instructions}
          </p>
        </div>

        <div className="flex items-center gap-4 animate-float-up" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{currentTask.timeEstimate}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
            <Flame className="h-4 w-4 text-streak" />
            <span className="text-sm font-medium text-foreground">+25 XP</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-lg px-6 pb-8 pt-4">
        <button
          onClick={() => setScreen("task-waiting")}
          className="flex h-14 w-full items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]"
        >
          {"I'm going to do it"}
        </button>
      </div>
    </div>
  )
}
