export function asRecord(v: unknown): Record<string, unknown> | null {
  if (v !== null && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>
  return null
}

export function str(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v
  if (typeof v === "number" && !Number.isNaN(v)) return String(v)
  return fallback
}

export function num(v: unknown, fallback = 0): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v
  return fallback
}
