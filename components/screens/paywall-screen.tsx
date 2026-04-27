"use client"

import { useApp } from "@/lib/store"
import { Shield, Zap, Flame, Mail } from "lucide-react"

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

export function PaywallScreen() {
  const { userProgress, currentQuest, setScreen } = useApp()

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 animate-pulse-glow">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground text-balance">
            Save your progress -- it already started
          </h1>
        </div>

        {/* Progress summary */}
        <div className="w-full rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{userProgress.xp} XP earned</p>
                <p className="text-xs text-muted-foreground">Level {userProgress.level}</p>
              </div>
            </div>
            {currentQuest && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-streak/10">
                  <Flame className="h-5 w-5 text-streak" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">1 task completed</p>
                  <p className="text-xs text-muted-foreground">{currentQuest.title}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Auth buttons */}
        <div className="flex w-full flex-col gap-3">
          <button
            onClick={() => setScreen("home")}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-foreground font-semibold text-background transition-all hover:brightness-90 active:scale-[0.98]"
          >
            <AppleIcon className="h-5 w-5" />
            <span>Continue with Apple</span>
          </button>
          <button
            onClick={() => setScreen("home")}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card font-semibold text-foreground transition-all hover:bg-secondary active:scale-[0.98]"
          >
            <GoogleIcon className="h-5 w-5" />
            <span>Continue with Google</span>
          </button>
          <button
            onClick={() => setScreen("home")}
            className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Mail className="h-4 w-4" />
            <span>Sign in with email</span>
          </button>
        </div>
      </div>
    </div>
  )
}
