"use client"

import { useState } from "react"
import { useApp } from "@/lib/store"
import {
  ArrowLeft,
  Users,
  Search,
  Sword,
  Calendar,
  Zap,
  ChevronRight,
  CheckCircle2,
  Shield,
} from "lucide-react"

const DEMO_FRIENDS = [
  { id: "f1", name: "Alex", avatar: "A", level: 8 },
  { id: "f2", name: "Maya", avatar: "M", level: 12 },
  { id: "f3", name: "Sam", avatar: "S", level: 6 },
  { id: "f4", name: "Jordan", avatar: "J", level: 10 },
]

export function CollabQuestSettingsScreen() {
  const { setScreen, currentQuest } = useApp()
  const [isJoint, setIsJoint] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null)

  const filteredFriends = DEMO_FRIENDS.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  const questTitle = currentQuest?.title || "New Quest"
  const isRank = currentQuest?.mode === "Rank"

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 pb-4 pt-12">
        <button onClick={() => setScreen("goal-input")} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary" aria-label="Back">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="font-serif text-xl font-bold text-foreground">Quest Settings</h1>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-6 pb-32">
        {/* Quest preview */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Sword className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-foreground">{questTitle}</h2>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                  {currentQuest?.mode || "Rank"}
                </span>
                <span className="text-xs text-muted-foreground">{currentQuest?.totalTasks || 10} tasks</span>
              </div>
            </div>
          </div>
        </div>

        {/* Collaborative toggle */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-quest/10">
                <Users className="h-5 w-5 text-quest" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Make Joint Quest</p>
                <p className="text-xs text-muted-foreground">Play together with a friend</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isRank && (
                <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[9px] font-bold uppercase text-accent">
                  Rank Only
                </span>
              )}
              <button
                onClick={() => isRank && setIsJoint(!isJoint)}
                className={`relative h-7 w-12 rounded-full transition-colors ${
                  isJoint ? "bg-primary" : "bg-secondary"
                } ${!isRank ? "cursor-not-allowed opacity-40" : ""}`}
                aria-label="Toggle joint quest"
                disabled={!isRank}
              >
                <div
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-foreground shadow transition-transform ${
                    isJoint ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Friend search */}
        {isJoint && (
          <div className="flex flex-col gap-4 animate-float-up">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search friends..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-secondary pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-2">
              {filteredFriends.map((friend) => {
                const isSelected = selectedFriend === friend.id
                return (
                  <button
                    key={friend.id}
                    onClick={() => setSelectedFriend(isSelected ? null : friend.id)}
                    className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-secondary/50"
                    }`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                      isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}>
                      {friend.avatar}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-foreground">{friend.name}</p>
                      <p className="text-xs text-muted-foreground">Level {friend.level}</p>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Selected preview */}
            {selectedFriend && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 animate-float-up">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">Joint Quest Preview</span>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 rounded-xl bg-card p-3 text-center">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">QF</div>
                    <p className="text-xs font-medium text-foreground">You</p>
                    <p className="text-[10px] text-muted-foreground">AI Roadmap</p>
                  </div>
                  <div className="flex items-center">
                    <Zap className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1 rounded-xl bg-card p-3 text-center">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-quest/10 text-sm font-bold text-quest">
                      {DEMO_FRIENDS.find((f) => f.id === selectedFriend)?.avatar}
                    </div>
                    <p className="text-xs font-medium text-foreground">
                      {DEMO_FRIENDS.find((f) => f.id === selectedFriend)?.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">AI Roadmap</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 px-6 pb-8 pt-4 backdrop-blur-lg">
        <div className="mx-auto max-w-md">
          <button
            onClick={() => setScreen(isJoint && selectedFriend ? "collab-invite" : "loading")}
            disabled={isJoint && !selectedFriend}
            className="w-full rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isJoint ? "Send Invite & Create Quest" : "Create Quest"}
          </button>
        </div>
      </div>
    </div>
  )
}
