"use client"

import { AuthProvider, useAuth } from "@/components/auth-provider"
import { AppProvider } from "@/components/app-provider"
import { ScreenRouter } from "@/components/screen-router"
import { AuthScreen } from "@/components/screens/auth-screen"
import { useApp } from "@/lib/store"
import { Loader2 } from "lucide-react"

/** Экраны-«хабы» рендерят собственный web-layout (сайдбар + широкая сетка). */
const HUB_SCREENS = new Set(["home"])

function AuthedShell() {
  const { screen } = useApp()
  const { signOut } = useAuth()

  // Хаб (Home) сам управляет своим макетом: сайдбар, контент, выход.
  if (HUB_SCREENS.has(screen)) {
    return <ScreenRouter />
  }

  // Поточные / «моментные» экраны (онбординг, квест, празднование) — сфокусированная
  // колонка по центру атмосферного фона, чтобы не растягиваться на весь web-вьюпорт.
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
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
  )
}

function AppGate() {
  const { status } = useAuth()

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
      <AuthedShell />
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
