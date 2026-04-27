const DEFAULT_API_BASE = "https://questfly-platform-production.up.railway.app"

/** Базовый URL бэкенда без завершающего слэша. Переопределение: `NEXT_PUBLIC_API_BASE_URL`. */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
  return (raw || DEFAULT_API_BASE).replace(/\/+$/, "")
}
