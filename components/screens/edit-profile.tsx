"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  AlertCircle,
  Camera,
  Save,
  Sparkles,
} from "lucide-react"

import { useApp } from "@/lib/store"
import { useAuth } from "@/components/auth-provider"
import { updateCharacter, uploadAvatar } from "@/lib/api/character"

const NAME_MIN = 2
const NAME_MAX = 50
const BIO_MAX = 500
const AVATAR_MAX_BYTES = 2 * 1024 * 1024
const AVATAR_MIME = new Set(["image/png", "image/jpeg"])

export function EditProfileScreen() {
  const { setScreen, userProgress, refreshCharacterFromApi } = useApp()
  const { user } = useAuth()

  const initialName = (user?.character.name ?? "").trim()
  const initialBio = (userProgress.bio ?? "").trim()
  const remoteAvatar = userProgress.avatarUrl ?? null

  const [name, setName] = useState(initialName)
  const [bio, setBio] = useState(initialBio)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Освобождаем object URL при смене / размонтировании, чтобы не течь памятью.
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  const initial = useMemo(() => {
    const src = name.trim() || initialName
    return src.length > 0 ? src[0]!.toUpperCase() : "?"
  }, [name, initialName])

  const nameLen = name.trim().length
  const bioLen = bio.length
  const nameValid = nameLen >= NAME_MIN && nameLen <= NAME_MAX
  const bioValid = bioLen <= BIO_MAX

  const dirty =
    name.trim() !== initialName ||
    bio.trim() !== initialBio ||
    avatarFile !== null

  const canSave = dirty && nameValid && bioValid && !saving

  const avatarSrc = avatarPreview ?? remoteAvatar

  function handleBack() {
    setScreen("home")
  }

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    if (!AVATAR_MIME.has(file.type)) {
      setAvatarError("PNG or JPEG only")
      return
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarError("Max 2 MB")
      return
    }

    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarError(null)
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!canSave) return
    setSaveError(null)
    setSaving(true)
    try {
      const patch: { name?: string; bio?: string } = {}
      const trimmedName = name.trim()
      const trimmedBio = bio.trim()
      if (trimmedName !== initialName) patch.name = trimmedName
      if (trimmedBio !== initialBio) patch.bio = trimmedBio
      if (patch.name !== undefined || patch.bio !== undefined) {
        await updateCharacter(patch)
      }
      if (avatarFile) {
        await uploadAvatar(avatarFile)
      }
      refreshCharacterFromApi()
      setScreen("home")
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Couldn't save changes")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      {/* Atmosphere: soft radial glow behind the avatar — gives the screen a "forge"-feel without competing with content */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-60"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, hsl(var(--primary) / 0.18), transparent 70%)",
        }}
      />

      <header className="relative flex items-center gap-3 px-6 pb-4 pt-12">
        <button
          onClick={handleBack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-secondary/80"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-serif text-xl font-bold text-foreground">Edit Character</h1>
      </header>

      <main className="relative flex flex-1 flex-col gap-6 px-6 pb-40">
        {/* Avatar block */}
        <section className="flex flex-col items-center gap-4 pt-4">
          <div className="relative">
            {/* Outer decorative ring — subtle RPG character-frame echo */}
            <div className="absolute -inset-2 rounded-full border border-primary/20" />
            <div className="absolute -inset-[14px] rounded-full border border-border/60" />

            <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-secondary ring-2 ring-primary/30">
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc}
                  alt={initialName || "Character"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-serif text-3xl font-bold text-foreground">{initial}</span>
              )}

              <button
                type="button"
                onClick={openFilePicker}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
                aria-label="Change photo"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={openFilePicker}
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            Change photo
          </button>
          <p className="text-[10px] text-muted-foreground/70">PNG or JPEG · up to 2 MB</p>

          {avatarError && (
            <div className="flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-[11px] font-medium text-destructive">
              <AlertCircle className="h-3 w-3" />
              {avatarError}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </section>

        {/* Name field */}
        <section className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="character-name"
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Character name
            </label>
            <span
              className={`text-[10px] tabular-nums ${
                nameValid ? "text-muted-foreground" : "text-destructive"
              }`}
            >
              {nameLen}/{NAME_MAX}
            </span>
          </div>
          <input
            id="character-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))}
            placeholder="Your hero's name"
            className="h-11 w-full rounded-xl border border-border bg-secondary px-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {nameLen > 0 && nameLen < NAME_MIN && (
            <p className="text-[10px] text-destructive">At least {NAME_MIN} characters</p>
          )}
        </section>

        {/* Bio field */}
        <section className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="character-bio"
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Bio
            </label>
            <span
              className={`text-[10px] tabular-nums ${
                bioValid ? "text-muted-foreground" : "text-destructive"
              }`}
            >
              {bioLen}/{BIO_MAX}
            </span>
          </div>
          <textarea
            id="character-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
            placeholder="Tell others what you're here for"
            rows={4}
            className="w-full resize-none rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
            <Sparkles className="h-3 w-3 text-accent" />
            Shown to friends on joint quests
          </p>
        </section>
      </main>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 px-6 pb-8 pt-4 backdrop-blur-lg">
        <div className="mx-auto flex max-w-md flex-col gap-2">
          {saveError && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{saveError}</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}
