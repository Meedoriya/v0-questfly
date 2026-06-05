"use client"

import { useEffect, useState } from "react"
import { getActivity } from "@/lib/api/activity"
import { mapActivityResponse } from "@/lib/mappers/activity-mapper"
import type { ActivityDay } from "@/lib/types"

interface UseActivityOptions {
  /** ISO `YYYY-MM-DD`. Если не передан — берёт `to - 364`. */
  from?: string
  /** ISO `YYYY-MM-DD`. Если не передан — сегодня UTC (бэк). */
  to?: string
}

interface UseActivityResult {
  days: ActivityDay[]
  loading: boolean
  error: string | null
}

/**
 * Загружает heatmap активности персонажа.
 * По умолчанию — окно year-view (365 дней).
 */
export function useActivity(options: UseActivityOptions = {}): UseActivityResult {
  const { from, to } = options
  const [days, setDays] = useState<ActivityDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const params = { from: from ?? defaultFromUtc(364), to }
    getActivity(params)
      .then((raw) => {
        if (cancelled) return
        setDays(mapActivityResponse(raw))
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : "Не удалось загрузить активность")
        setDays([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [from, to])

  return { days, loading, error }
}

function defaultFromUtc(daysAgo: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}
