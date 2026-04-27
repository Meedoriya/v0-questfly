import { getApiBaseUrl } from "./config"
import { ApiError } from "./errors"
import type { ApiEnvelope, ApiErrorBody, TokenData } from "./types"
import { clearTokens, getAccessToken, getRefreshToken, setTokensFromData } from "./tokens"

let refreshPromise: Promise<boolean> | null = null

async function postRefresh(refresh_token: string): Promise<TokenData> {
  const url = `${getApiBaseUrl()}/api/v1/auth/refresh`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ refresh_token }),
  })
  const raw = (await res.json().catch(() => ({}))) as ApiEnvelope<TokenData> | ApiErrorBody | Record<string, unknown>

  if (!res.ok) {
    const err = raw as ApiErrorBody
    if ("success" in err && err.success === false && err.error) {
      throw new ApiError(err.error.code, err.error.message)
    }
    throw new ApiError("HTTP_ERROR", res.statusText || String(res.status))
  }

  const envelope = raw as ApiEnvelope<TokenData>
  if ("success" in envelope && envelope.success === false) {
    throw new ApiError(envelope.error.code, envelope.error.message)
  }
  if (!("success" in envelope) || !envelope.success) {
    throw new ApiError("INVALID_RESPONSE", "Ответ refresh без success: true")
  }
  return envelope.data
}

function tryRefreshOnce(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const rt = getRefreshToken()
      if (!rt) return false
      try {
        const data = await postRefresh(rt)
        setTokensFromData(data)
        return true
      } catch {
        clearTokens()
        return false
      } finally {
        refreshPromise = null
      }
    })()
  }
  return refreshPromise
}

export interface ApiRequestOptions extends RequestInit {
  /** Не добавлять Authorization (публичные эндпоинты). */
  skipAuth?: boolean
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions & { _retried?: boolean } = {},
): Promise<T> {
  const { skipAuth, _retried, ...init } = options
  const base = getApiBaseUrl()
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`

  const headers = new Headers(init.headers)
  if (!headers.has("Accept")) headers.set("Accept", "application/json")

  if (init.body && typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  if (!skipAuth && !headers.has("Authorization")) {
    const access = getAccessToken()
    if (access) headers.set("Authorization", `Bearer ${access}`)
  }

  const res = await fetch(url, { ...init, headers })

  if (res.status === 204) {
    return undefined as T
  }

  if (res.status === 401 && !skipAuth && !_retried) {
    const refreshed = await tryRefreshOnce()
    if (refreshed) return apiRequest<T>(path, { ...options, _retried: true })
    clearTokens()
  }

  const raw = (await res.json().catch(() => ({}))) as ApiEnvelope<T> | ApiErrorBody | Record<string, unknown>

  if (!res.ok) {
    const err = raw as ApiErrorBody
    if ("success" in err && err.success === false && err.error) {
      throw new ApiError(err.error.code, err.error.message)
    }
    throw new ApiError("HTTP_ERROR", res.statusText || `HTTP ${res.status}`)
  }

  const envelope = raw as ApiEnvelope<T>
  if ("success" in envelope && envelope.success === false) {
    throw new ApiError(envelope.error.code, envelope.error.message)
  }
  if (!("success" in envelope) || !envelope.success) {
    throw new ApiError("INVALID_RESPONSE", "Ответ API без success: true")
  }

  return envelope.data
}
