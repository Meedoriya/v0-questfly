import type { AxisKey } from "@/lib/types"

/**
 * Единый словарь 12 осей жизни (Life Radar). Совпадает с `AxisKey` и enum на бэке —
 * `routine.characteristic` принимает только эти ключи. Любое расхождение строк =
 * молчаливая потеря тега, поэтому форма привычки и превью берут оси отсюда.
 */
export const AXES: { key: AxisKey; label: string }[] = [
  { key: "health", label: "Health" },
  { key: "appearance", label: "Appearance" },
  { key: "environment", label: "Environment" },
  { key: "finance", label: "Finance" },
  { key: "career", label: "Career" },
  { key: "growth", label: "Growth" },
  { key: "love", label: "Love" },
  { key: "family", label: "Family" },
  { key: "friends", label: "Friends" },
  { key: "creativity", label: "Creativity" },
  { key: "lifestyle", label: "Lifestyle" },
  { key: "spirituality", label: "Spirituality" },
]

const AXIS_LABEL = Object.fromEntries(AXES.map((a) => [a.key, a.label])) as Record<AxisKey, string>

const AXIS_KEYS = new Set<string>(AXES.map((a) => a.key))

/** Человекочитаемая подпись оси; неизвестный ключ возвращается как есть. */
export function axisLabel(key: string): string {
  return AXIS_LABEL[key as AxisKey] ?? key
}

/** Валидна ли строка как `AxisKey`. */
export function isAxisKey(key: string): key is AxisKey {
  return AXIS_KEYS.has(key)
}
