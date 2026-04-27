const ACCESS_KEY = "questfly_access_token"
const REFRESH_KEY = "questfly_refresh_token"

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(REFRESH_KEY)
}

export function setTokenPair(access: string, refresh: string): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(ACCESS_KEY, access)
  window.localStorage.setItem(REFRESH_KEY, refresh)
}

export function setTokensFromData(data: { access_token: string; refresh_token: string }): void {
  setTokenPair(data.access_token, data.refresh_token)
}

export function clearTokens(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(ACCESS_KEY)
  window.localStorage.removeItem(REFRESH_KEY)
}

/** См. api-policy.md: в GET /auth/me поля token — пустые строки, их нельзя писать в storage. */
export function persistAuthTokens(auth: { token: { access_token: string; refresh_token: string } | null }): void {
  if (!auth.token) return
  const access = auth.token.access_token?.trim()
  const refresh = auth.token.refresh_token?.trim()
  if (!access || !refresh) return
  setTokenPair(access, refresh)
}
