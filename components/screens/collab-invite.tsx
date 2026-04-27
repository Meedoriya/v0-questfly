"use client"

import { useState } from "react"
import { useApp } from "@/lib/store"
import {
  ArrowLeft,
  Sword,
  Calendar,
  Users,
  CheckCircle2,
  X,
  Zap,
  Flame,
} from "lucide-react"

export function CollabInviteScreen() {
  const { setScreen, jointQuests, setCurrentJointQuest } = useApp()
  const [decided, setDecided] = useState<"accepted" | "declined" | null>(null)

  const quest = jointQuests[0]

  const handleAccept = () => {
    setDecided("accepted")
    if (quest) setCurrentJointQuest(quest)
    setTimeout(() => setScreen("home"), 1200)
  }

  const handleDecline = () => {
    setDecided("declined")
    setTimeout(() => setScreen("home"), 1000)
  }

  if (!quest) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-muted-foreground">No invite found</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 pb-4 pt-12">
        <button onClick={() => setScreen("home")} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary" aria-label="Back">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="font-serif text-xl font-bold text-foreground">Quest Invite</h1>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-6 pb-32">
        {/* From badge */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-quest/15 text-xs font-bold text-quest">
            {quest.player2.avatar}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{quest.player2.name}</span> invited you
          </p>
        </div>

        {/* Quest details card */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="bg-gradient-to-r from-primary/10 to-quest/10 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-card/80 backdrop-blur">
                <Sword className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{quest.title}</h2>
                <div className="mt-0.5 flex items-center gap-2">
                  <Users className="h-3 w-3 text-quest" />
                  <span className="text-xs text-quest font-medium">Joint Quest</span>
                </div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-secondary-foreground">{quest.description}</p>
          </div>

          <div className="flex divide-x divide-border border-t border-border">
            <div className="flex flex-1 items-center gap-2 p-4">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-semibold text-foreground">{quest.deadline}</p>
                <p className="text-[10px] text-muted-foreground">{quest.daysLeft} days left</p>
              </div>
            </div>
            <div className="flex flex-1 items-center gap-2 p-4">
              <Zap className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs font-semibold text-foreground">Rank Mode</p>
                <p className="text-[10px] text-muted-foreground">Competitive scoring</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI-generated roadmaps */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI-Generated Roadmaps</h3>
          <div className="flex gap-3">
            {/* Player 1 (you) */}
            <div className="flex-1 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  {quest.player1.avatar}
                </div>
                <span className="text-xs font-semibold text-foreground">{quest.player1.name}</span>
              </div>
              <div className="flex flex-col gap-2">
                {quest.player1.roadmapPreview.map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                      {i + 1}
                    </div>
                    <span className="text-[11px] text-secondary-foreground">{step}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Player 2 (friend) */}
            <div className="flex-1 rounded-xl border border-quest/20 bg-quest/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-quest/15 text-xs font-bold text-quest">
                  {quest.player2.avatar}
                </div>
                <span className="text-xs font-semibold text-foreground">{quest.player2.name}</span>
              </div>
              <div className="flex flex-col gap-2">
                {quest.player2.roadmapPreview.map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-quest/10 text-[9px] font-bold text-quest">
                      {i + 1}
                    </div>
                    <span className="text-[11px] text-secondary-foreground">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Decision feedback */}
        {decided && (
          <div className={`flex items-center justify-center gap-2 rounded-xl p-4 animate-bounce-in ${
            decided === "accepted" ? "bg-primary/10 border border-primary/30" : "bg-secondary border border-border"
          }`}>
            {decided === "accepted" ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-primary">Quest accepted! Redirecting...</span>
              </>
            ) : (
              <>
                <X className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-semibold text-muted-foreground">Invite declined</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom CTAs */}
      {!decided && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 px-6 pb-8 pt-4 backdrop-blur-lg">
          <div className="mx-auto flex max-w-md gap-3">
            <button
              onClick={handleDecline}
              className="flex-1 rounded-2xl border border-border bg-secondary py-4 text-sm font-bold text-foreground transition-all hover:bg-secondary/80 active:scale-[0.98]"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
            >
              Accept
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
