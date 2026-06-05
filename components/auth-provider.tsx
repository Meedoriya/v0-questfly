"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { getMe } from "@/lib/api/auth"
import type { AuthResponse, AuthSessionUser, MeResponse } from "@/lib/api/types"
import { clearTokens, getAccessToken, getRefreshToken, persistAuthTokens } from "@/lib/api/tokens"

export type AuthStatus = "loading" | "unauthenticated" | "authenticated"

interface AuthContextValue {
  status: AuthStatus
  user: AuthSessionUser | null
  signIn: (auth: AuthResponse) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toSessionUserFromAuth(r: AuthResponse): AuthSessionUser {
  return {
    userId: r.user_id,
    email: r.email,
    name: r.name,
    character: r.character,
  }
}

function toSessionUserFromMe(r: MeResponse): AuthSessionUser {
  const c = r.character
  return {
    userId: r.user.user_id,
    email: r.user.email,
    name: r.user.name,
    character: {
      id: c.id,
      name: c.name,
      total_xp: c.total_xp,
      level: c.level,
      streak: c.streak,
    },
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading")
  const [user, setUser] = useState<AuthSessionUser | null>(null)

  const signOut = useCallback(() => {
    clearTokens()
    setUser(null)
    setStatus("unauthenticated")
  }, [])

  const signIn = useCallback((auth: AuthResponse) => {
    persistAuthTokens(auth)
    setUser(toSessionUserFromAuth(auth))
    setStatus("authenticated")
  }, [])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (typeof window === "undefined") return
      if (!getAccessToken() && !getRefreshToken()) {
        setStatus("unauthenticated")
        return
      }

      setStatus("loading")
      try {
        const me = await getMe()
        if (cancelled) return
        setUser(toSessionUserFromMe(me))
        setStatus("authenticated")
      } catch {
        if (cancelled) return
        setUser(null)
        setStatus("unauthenticated")
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({ status, user, signIn, signOut }),
    [status, user, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth должен вызываться внутри AuthProvider")
  return ctx
}
