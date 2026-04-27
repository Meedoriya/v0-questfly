"use client"

import { useApp } from "@/lib/store"
import { Skull, MapPin, AlertTriangle, RotateCcw, Plus } from "lucide-react"

export function QuestFailureScreen() {
  const { currentQuest, setScreen } = useApp()

  const failedTasks = currentQuest?.tasks.filter((t) => t.status === "failed").length ?? 0
  const completedTasks = currentQuest?.tasks.filter((t) => t.status === "done").length ?? 0
  const totalTasks = currentQuest?.totalTasks ?? 0
  const stageReached = completedTasks > 0 ? `Stage ${completedTasks}/${totalTasks}` : "Stage 1"

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      {/* Atmospheric bg */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-destructive/5 via-transparent to-destructive/10" />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6">
        {/* Skull icon */}
        <div className="animate-celebrate">
          <div className="flex h-28 w-28 items-center justify-center rounded-full border-[3px] border-destructive/40 bg-destructive/10 animate-red-pulse">
            <Skull className="h-14 w-14 text-destructive" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold text-foreground text-balance">Quest Failed</h1>
          <p className="mt-2 text-sm text-muted-foreground text-pretty">
            {"Don't worry -- every adventurer faces setbacks. Learn and rise again."}
          </p>
        </div>

        {/* Quest info card */}
        <div className="w-full rounded-2xl border border-destructive/20 bg-card p-5">
          <h3 className="font-semibold text-foreground text-balance">{currentQuest?.title ?? "Quest"}</h3>
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Failed Tasks</p>
                <p className="text-sm font-bold text-destructive">{failedTasks} of {totalTasks}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Roadmap Stage Reached</p>
                <p className="text-sm font-bold text-foreground">{stageReached}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex w-full flex-col gap-3">
          <button
            onClick={() => setScreen("home")}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-destructive font-semibold text-destructive-foreground transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4" />
            Restart Quest
          </button>
          <button
            onClick={() => setScreen("goal-input")}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card font-semibold text-foreground transition-all hover:bg-secondary active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Create New Quest
          </button>
        </div>
      </div>
    </div>
  )
}
