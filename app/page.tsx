"use client"

import { AuthProvider, useAuth } from "@/components/auth-provider"
import { AppProvider } from "@/components/app-provider"
import { ScreenRouter } from "@/components/screen-router"
import { AuthScreen } from "@/components/screens/auth-screen"
import { Loader2 } from "lucide-react"

function AppGate() {
  const { status, signOut } = useAuth()

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Загрузка" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    return <AuthScreen />
  }

  return (
    <AppProvider>
      <main className="mx-auto min-h-dvh max-w-md">
        <header className="flex items-center justify-end border-b border-border/60 px-4 py-2">
          <button
            type="button"
            onClick={signOut}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Выйти
          </button>
        </header>
        <ScreenRouter />
      </main>
    </AppProvider>
  )
}

export default function Page() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  )
}
