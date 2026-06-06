"use client"

import { useMemo } from "react"
import { AlertCircle } from "lucide-react"

import { useActivity } from "@/hooks/use-activity"
import type { ActivityDay } from "@/lib/types"

const CELL_PX = 12
const GAP_PX = 2
const STEP_PX = CELL_PX + GAP_PX
const DAY_LABELS_WIDTH = 32
const DAY_LABELS_GAP = 8

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const VISIBLE_ROW_LABELS: (string | null)[] = [null, "Mon", null, "Wed", null, "Fri", null]

const INTENSITY_BG: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-secondary/40",
  1: "bg-primary/20",
  2: "bg-primary/45",
  3: "bg-primary/70",
  4: "bg-primary",
}

interface CellSlot {
  day: ActivityDay
  isToday: boolean
}

interface Column {
  cells: (CellSlot | null)[]
  monthLabel: string | null
}

// Mon=0, Sun=6 — ISO ordering, matches the row layout.
function isoWeekday(date: Date): number {
  const d = date.getUTCDay()
  return d === 0 ? 6 : d - 1
}

function parseIsoUtc(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

/**
 * Раскладывает плотный массив дней в колонки по 7 ячеек.
 * Алгоритм выравнивания:
 *   1. Берём ISO-день недели самой старой даты (firstWeekday). Это row, в который
 *      должна попасть data[0]. Верхние firstWeekday ячеек первой колонки — null
 *      (пустые пады), чтобы каждая ячейка стояла напротив своего реального дня.
 *   2. Дальше data[i] идёт по row = (firstWeekday + i) % 7, col = floor(...).
 *   3. Ярлык месяца ставим на колонку, в которой:
 *        - находится 1-е число месяца, ИЛИ
 *        - это первая колонка (label стартового месяца, для контекста).
 */
function buildGrid(days: ActivityDay[], todayIso: string): { columns: Column[]; total: number } {
  if (days.length === 0) return { columns: [], total: 0 }

  const firstDate = parseIsoUtc(days[0].date)
  const startPad = isoWeekday(firstDate)
  const totalSlots = startPad + days.length
  const colCount = Math.ceil(totalSlots / 7)

  const columns: Column[] = []
  let total = 0

  for (let c = 0; c < colCount; c++) {
    const cells: (CellSlot | null)[] = new Array(7).fill(null)
    let monthLabel: string | null = null

    for (let r = 0; r < 7; r++) {
      const slotIdx = c * 7 + r
      const dataIdx = slotIdx - startPad
      if (dataIdx < 0 || dataIdx >= days.length) continue

      const day = days[dataIdx]
      cells[r] = { day, isToday: day.date === todayIso }
      if (day.count > 0) total++

      const date = parseIsoUtc(day.date)
      if (monthLabel === null && (c === 0 || date.getUTCDate() === 1)) {
        monthLabel = MONTH_NAMES[date.getUTCMonth()]
      }
    }

    columns.push({ cells, monthLabel })
  }

  return { columns, total }
}

function todayIsoUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatTooltip(day: ActivityDay): string {
  const date = parseIsoUtc(day.date)
  const m = MONTH_NAMES[date.getUTCMonth()]
  const d = date.getUTCDate()
  const y = date.getUTCFullYear()
  if (day.count === 0) return `${m} ${d}, ${y} · No activity`
  return `${m} ${d}, ${y} · ${day.count} task${day.count === 1 ? "" : "s"}`
}

export function ActivityHeatmap() {
  const { days, loading, error } = useActivity()
  const todayIso = useMemo(() => todayIsoUtc(), [])
  const { columns, total } = useMemo(() => buildGrid(days, todayIso), [days, todayIso])

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <span>Couldn&apos;t load activity</span>
      </div>
    )
  }

  if (loading) return <HeatmapSkeleton />

  const monthRowWidth = columns.length * STEP_PX
  const monthRowLeftOffset = DAY_LABELS_WIDTH + DAY_LABELS_GAP

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground tabular-nums">
          <span className="font-serif text-sm font-semibold text-foreground">{total}</span>{" "}
          contributions in the last year
        </p>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="inline-flex flex-col">
          {/* Month labels — absolute over the cell columns so each label sits over its starting week. */}
          <div
            className="relative mb-1"
            style={{
              height: 14,
              marginLeft: monthRowLeftOffset,
              width: monthRowWidth,
            }}
          >
            {columns.map((col, idx) =>
              col.monthLabel ? (
                <span
                  key={idx}
                  className="absolute top-0 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground"
                  style={{ left: idx * STEP_PX }}
                >
                  {col.monthLabel}
                </span>
              ) : null,
            )}
          </div>

          <div className="flex" style={{ gap: DAY_LABELS_GAP }}>
            {/* Day-of-week labels */}
            <div className="flex flex-col" style={{ gap: GAP_PX, width: DAY_LABELS_WIDTH }}>
              {VISIBLE_ROW_LABELS.map((label, r) => (
                <div
                  key={r}
                  className="flex items-center text-[10px] font-medium text-muted-foreground"
                  style={{ height: CELL_PX }}
                >
                  {label ?? ""}
                </div>
              ))}
            </div>

            {/* Cell grid */}
            <div className="flex" style={{ gap: GAP_PX }}>
              {columns.map((col, c) => (
                <div key={c} className="flex flex-col" style={{ gap: GAP_PX }}>
                  {col.cells.map((slot, r) => {
                    if (!slot) {
                      return (
                        <div
                          key={r}
                          aria-hidden
                          style={{ width: CELL_PX, height: CELL_PX, visibility: "hidden" }}
                        />
                      )
                    }
                    const { day, isToday } = slot
                    const cls = [
                      "relative rounded-[2px] transition-colors duration-150",
                      INTENSITY_BG[day.intensity],
                      isToday
                        ? "ring-1 ring-primary ring-offset-1 ring-offset-card"
                        : "hover:ring-1 hover:ring-foreground/40",
                    ].join(" ")
                    return (
                      <div
                        key={r}
                        title={formatTooltip(day)}
                        className={cls}
                        style={{ width: CELL_PX, height: CELL_PX }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] tracking-wide text-muted-foreground">
        <span>Less</span>
        {([0, 1, 2, 3, 4] as const).map((i) => (
          <div
            key={i}
            className={`rounded-[2px] ${INTENSITY_BG[i]}`}
            style={{ width: CELL_PX, height: CELL_PX }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

function HeatmapSkeleton() {
  // 53 колонки — ровно один год при любой стартовой стороне недели.
  const columns = 53
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-4 w-48 animate-pulse rounded bg-secondary/60" />
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="inline-flex" style={{ gap: DAY_LABELS_GAP }}>
          <div className="flex flex-col" style={{ gap: GAP_PX, width: DAY_LABELS_WIDTH }} />
          <div className="flex" style={{ gap: GAP_PX }}>
            {Array.from({ length: columns }).map((_, c) => (
              <div key={c} className="flex flex-col" style={{ gap: GAP_PX }}>
                {Array.from({ length: 7 }).map((_, r) => (
                  <div
                    key={r}
                    className="animate-pulse rounded-[2px] bg-secondary/40"
                    style={{
                      width: CELL_PX,
                      height: CELL_PX,
                      animationDelay: `${((c * 7 + r) % 50) * 18}ms`,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <div className="h-3 w-32 animate-pulse rounded bg-secondary/60" />
      </div>
    </div>
  )
}
