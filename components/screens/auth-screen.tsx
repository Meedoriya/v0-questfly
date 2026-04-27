"use client"

import { useState } from "react"

import { useAuth } from "@/components/auth-provider"
import { login, register, sendOtp } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/errors"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

type Step = "email" | "code"

export function AuthScreen() {
  const { signIn } = useAuth()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [userExists, setUserExists] = useState<boolean | null>(null)
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [characterName, setCharacterName] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !trimmed.includes("@")) {
      setError("Укажите корректный email")
      return
    }
    setBusy(true)
    try {
      const data = await sendOtp(trimmed)
      setEmail(data.email)
      setUserExists(data.user_exists)
      setStep("code")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось отправить код")
    } finally {
      setBusy(false)
    }
  }

  async function onLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const c = code.replace(/\D/g, "").slice(0, 6)
    if (c.length !== 6) {
      setError("Введите 6-значный код из письма")
      return
    }
    setBusy(true)
    try {
      const auth = await login(email, c)
      signIn(auth)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Вход не удался")
    } finally {
      setBusy(false)
    }
  }

  async function onRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const c = code.replace(/\D/g, "").slice(0, 6)
    if (c.length !== 6) {
      setError("Введите 6-значный код из письма")
      return
    }
    const n = name.trim()
    const cn = characterName.trim()
    if (n.length < 2) {
      setError("Имя: минимум 2 символа")
      return
    }
    if (cn.length < 2) {
      setError("Имя персонажа: минимум 2 символа")
      return
    }
    setBusy(true)
    try {
      const auth = await register({
        email,
        code: c,
        name: n,
        character_name: cn,
      })
      signIn(auth)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Регистрация не удалась")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-8">
      <Card className="border-border/80 bg-card/80 shadow-lg backdrop-blur">
        <CardHeader className="space-y-1">
          <CardTitle className="font-[family-name:var(--font-space-grotesk)] text-2xl">Questfly</CardTitle>
          <CardDescription>Вход по коду из email</CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" && (
            <form onSubmit={onSendOtp} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="auth-email">Email</Label>
                <Input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  disabled={busy}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? <Loader2 className="animate-spin" /> : "Отправить код"}
              </Button>
            </form>
          )}

          {step === "code" && userExists === true && (
            <form onSubmit={onLogin} className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">Код отправлен на {email}</p>
              <div className="space-y-2">
                <Label htmlFor="auth-code">Код</Label>
                <Input
                  id="auth-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(ev) => setCode(ev.target.value.replace(/\D/g, "").slice(0, 6))}
                  disabled={busy}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={busy}
                  onClick={() => {
                    setStep("email")
                    setCode("")
                    setError(null)
                  }}
                >
                  Назад
                </Button>
                <Button type="submit" className="flex-1" disabled={busy}>
                  {busy ? <Loader2 className="animate-spin" /> : "Войти"}
                </Button>
              </div>
            </form>
          )}

          {step === "code" && userExists === false && (
            <form onSubmit={onRegister} className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">Создайте аккаунт для {email}</p>
              <div className="space-y-2">
                <Label htmlFor="auth-code-new">Код из письма</Label>
                <Input
                  id="auth-code-new"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(ev) => setCode(ev.target.value.replace(/\D/g, "").slice(0, 6))}
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auth-name">Ваше имя</Label>
                <Input
                  id="auth-name"
                  autoComplete="name"
                  value={name}
                  onChange={(ev) => setName(ev.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auth-character">Имя персонажа</Label>
                <Input
                  id="auth-character"
                  value={characterName}
                  onChange={(ev) => setCharacterName(ev.target.value)}
                  disabled={busy}
                  placeholder="Как вас звать в квестах"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={busy}
                  onClick={() => {
                    setStep("email")
                    setCode("")
                    setName("")
                    setCharacterName("")
                    setUserExists(null)
                    setError(null)
                  }}
                >
                  Назад
                </Button>
                <Button type="submit" className="flex-1" disabled={busy}>
                  {busy ? <Loader2 className="animate-spin" /> : "Зарегистрироваться"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
