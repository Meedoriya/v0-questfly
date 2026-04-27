"use client"

import { useEffect, useState } from "react"
import { useApp } from "@/lib/store"
import { Sword } from "lucide-react"

export function LoadingScreen() {
  const { setScreen, currentQuest } = useApp()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval)
          return 100
        }
        return p + 2
      })
    }, 40)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (progress === 100) {
      const timer = setTimeout(() => setScreen("quest-roadmap"), 400)
      return () => clearTimeout(timer)
    }
  }, [progress, setScreen])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 animate-pulse-glow">
          <Sword className="h-10 w-10 text-primary" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="font-serif text-xl font-bold text-foreground">
          Forging your quest...
        </h2>
        {currentQuest && (
          <p className="text-sm text-muted-foreground">{currentQuest.title}</p>
        )}
      </div>

      <div className="w-full max-w-xs">
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {progress < 30
            ? "Analyzing your goal..."
            : progress < 60
              ? "Planning daily tasks..."
              : progress < 90
                ? "Crafting your roadmap..."
                : "Almost ready!"}
        </p>
      </div>
    </div>
  )
}
