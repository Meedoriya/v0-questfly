"use client"

import { AlertTriangle, X, Settings2, ChevronDown } from "lucide-react"

interface AiPatternInsightProps {
  onDismiss: () => void
  onAdjustSchedule: () => void
  onReduceDifficulty: () => void
}

export function AiPatternInsight({
  onDismiss,
  onAdjustSchedule,
  onReduceDifficulty,
}: AiPatternInsightProps) {
  return (
    <div className="mx-6 mt-4 rounded-xl border border-accent/30 bg-accent/5 p-4 animate-float-up">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15">
          <AlertTriangle className="h-4 w-4 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-accent">Pattern Detected</p>
            <button
              onClick={onDismiss}
              className="shrink-0 p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Dismiss insight"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-secondary-foreground">
            {"You've skipped 3 tasks in a row. Maybe your schedule needs a tweak?"}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={onAdjustSchedule}
              className="flex items-center gap-1.5 rounded-lg bg-accent/15 px-3 py-2 text-[11px] font-semibold text-accent transition-all hover:bg-accent/25 active:scale-[0.97]"
            >
              <Settings2 className="h-3 w-3" />
              Adjust schedule
            </button>
            <button
              onClick={onReduceDifficulty}
              className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-[11px] font-semibold text-muted-foreground transition-all hover:bg-secondary/80 active:scale-[0.97]"
            >
              <ChevronDown className="h-3 w-3" />
              Reduce difficulty
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
