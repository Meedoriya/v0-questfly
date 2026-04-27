"use client"

import { useState } from "react"
import { useApp } from "@/lib/store"
import { RadarDiagram, getAxisIcon, getAxisColor, getAxisHsl } from "@/components/radar-diagram"
import type { AxisKey } from "@/lib/types"
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
} from "lucide-react"

export function CharacteristicsScreen() {
  const { userProgress, setScreen } = useApp()
  const [selectedAxis, setSelectedAxis] = useState<AxisKey | null>(null)

  const selectedChar = selectedAxis
    ? userProgress.characteristics.find((c) => c.key === selectedAxis)
    : null

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 pt-12 pb-4">
        <button
          onClick={() => setScreen("home")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Character Stats</p>
          <h1 className="font-serif text-xl font-bold text-foreground">Life Radar</h1>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
      </header>

      <div className="flex flex-1 flex-col px-6 pt-2 pb-8">
        {/* Full Radar Diagram */}
        <div className="flex items-center justify-center py-4">
          <RadarDiagram
            characteristics={userProgress.characteristics}
            size={300}
            highlightAxis={selectedAxis}
            onAxisTap={(key) => setSelectedAxis((prev) => (prev === key ? null : key))}
            animated
          />
        </div>

        {/* Selected axis detail */}
        {selectedChar && (
          <div className="mb-4 animate-float-up rounded-2xl border border-border bg-card p-5">
            {(() => {
              const Icon = getAxisIcon(selectedChar.key)
              const color = getAxisColor(selectedChar.key)
              const hsl = getAxisHsl(selectedChar.key)
              const delta = selectedChar.thisWeek - selectedChar.lastWeek
              const beforeVal = Math.max(0, selectedChar.current - selectedChar.thisWeek)
              const afterPct = (selectedChar.current / selectedChar.max) * 100
              const beforePct = (beforeVal / selectedChar.max) * 100

              return (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `hsl(${hsl} / 0.15)` }}>
                      <Icon className={`h-6 w-6 ${color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-foreground">{selectedChar.name}</h3>
                      <p className="text-xs text-muted-foreground">Level {selectedChar.current}/{selectedChar.max}</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full px-3 py-1" style={{ backgroundColor: `hsl(${hsl} / 0.15)` }}>
                      {delta > 0 && <TrendingUp className={`h-3 w-3 ${color}`} />}
                      {delta < 0 && <TrendingDown className="h-3 w-3 text-destructive" />}
                      {delta === 0 && <Minus className="h-3 w-3 text-muted-foreground" />}
                      <span className={`text-sm font-bold ${delta > 0 ? color : delta < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                        {delta > 0 ? `+${delta}` : delta}
                      </span>
                    </div>
                  </div>

                  {/* Before / After Bars */}
                  <div className="flex flex-col gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground">Before Quest</span>
                        <span className="text-[10px] font-medium text-muted-foreground">{beforeVal}</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full opacity-40"
                          style={{ width: `${beforePct}%`, backgroundColor: `hsl(${hsl})` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-foreground font-medium">After Quest</span>
                        <span className={`text-[10px] font-bold ${color}`}>{selectedChar.current}</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full animate-bar-fill animate-stat-glow"
                          style={{ width: `${afterPct}%`, backgroundColor: `hsl(${hsl})` }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        )}

        {/* All axes list */}
        <section className="mb-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">All Categories</h2>
          <div className="grid grid-cols-3 gap-2">
            {userProgress.characteristics.map((char) => {
              const Icon = getAxisIcon(char.key)
              const color = getAxisColor(char.key)
              const hsl = getAxisHsl(char.key)
              const isSelected = char.key === selectedAxis

              return (
                <button
                  key={char.key}
                  onClick={() => setSelectedAxis((prev) => (prev === char.key ? null : char.key))}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all active:scale-[0.97] ${
                    isSelected
                      ? "border-[hsl(var(--primary))] bg-card"
                      : "border-border bg-card hover:bg-secondary/50"
                  }`}
                  style={isSelected ? { borderColor: `hsl(${hsl})`, boxShadow: `0 0 12px hsl(${hsl} / 0.2)` } : undefined}
                >
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span className={`text-[10px] font-semibold ${isSelected ? color : "text-foreground"}`}>{char.name}</span>
                  <span className="text-[9px] text-muted-foreground">{char.current}/{char.max}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Total Growth Summary */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary">Total Growth This Quest</span>
            <span className="text-lg font-bold text-primary">
              +{userProgress.characteristics.reduce((acc, c) => acc + c.thisWeek, 0)} pts
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex flex-col gap-3 pt-6">
          <button
            onClick={() => setScreen("next-quest")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97]"
          >
            {"What's Next?"}
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setScreen("home")}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors text-center"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
