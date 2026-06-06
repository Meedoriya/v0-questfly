"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useApp } from "@/lib/store"
import type { Characteristic, FriendActivity, AxisKey, Quest } from "@/lib/types"
import { ActivityHeatmap } from "@/components/activity-heatmap"
import { formatFriendAction, formatTimeAgo, getInitial } from "@/lib/friend-feed"
import { daysLeftFromDeadline, findOpponent, findPlayerByUserId } from "@/lib/joint-quest-utils"
import { listCampaigns, getCampaign } from "@/lib/api/campaigns"
import { asRecord, str } from "@/lib/api/json-helpers"
import { mapGetCampaignResponse } from "@/lib/mappers/campaign-mapper"
import { ScheduleSheet } from "@/components/schedule-sheet"
import { RadarDiagram, getAxisIcon, getAxisColor, getAxisHsl } from "@/components/radar-diagram"
import {
  Home,
  Sword,
  BarChart3,
  User,
  Flame,
  Zap,
  CheckCircle2,
  ChevronRight,
  Plus,
  BookOpen,
  Dumbbell,
  Code,
  Music,
  Palette,
  Heart,
  Globe,
  Briefcase,
  GraduationCap,
  Utensils,
  Brain,
  Target,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  ArrowRightLeft,
  Skull,
  ClipboardList,
  Circle,
  Trophy,
  Calendar,
  Star,
  Timer,
  Crown,
  MessageCircle,
  LogOut,
  Pencil,
} from "lucide-react"

/* ---------- helpers ---------- */

function getTaskIcon(title: string, questTitle: string): React.ElementType {
  const combined = `${title} ${questTitle}`.toLowerCase()
  if (combined.includes("read") || combined.includes("learn") || combined.includes("book")) return BookOpen
  if (combined.includes("exercise") || combined.includes("workout") || combined.includes("run") || combined.includes("gym") || combined.includes("fitness")) return Dumbbell
  if (combined.includes("code") || combined.includes("program") || combined.includes("build") || combined.includes("develop")) return Code
  if (combined.includes("music") || combined.includes("practice") || combined.includes("instrument") || combined.includes("song")) return Music
  if (combined.includes("draw") || combined.includes("paint") || combined.includes("design") || combined.includes("art") || combined.includes("sketch")) return Palette
  if (combined.includes("meditat") || combined.includes("health") || combined.includes("sleep") || combined.includes("mindful")) return Heart
  if (combined.includes("language") || combined.includes("spanish") || combined.includes("french") || combined.includes("vocab")) return Globe
  if (combined.includes("work") || combined.includes("project") || combined.includes("meeting") || combined.includes("email")) return Briefcase
  if (combined.includes("study") || combined.includes("course") || combined.includes("exam") || combined.includes("class")) return GraduationCap
  if (combined.includes("cook") || combined.includes("meal") || combined.includes("eat") || combined.includes("diet") || combined.includes("nutrition")) return Utensils
  return Sword
}

const ICON_COLORS = ["text-primary", "text-accent", "text-quest", "text-streak"]
const ICON_BG = ["bg-primary/10", "bg-accent/10", "bg-quest/10", "bg-streak/10"]

/* ---------- sub-components ---------- */

function SocialFeedCard({ friend }: { friend: FriendActivity }) {
  const [reacted, setReacted] = useState(false)
  const action = formatFriendAction(friend)
  const timeAgo = formatTimeAgo(friend.happenedAt)

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-sm font-bold text-accent">
          {friend.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={friend.avatarUrl} alt={friend.name} className="h-full w-full object-cover" />
          ) : (
            getInitial(friend.name)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{friend.name}</p>
          <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-secondary-foreground">{action}</p>
      <div className="flex flex-wrap items-center gap-2">
        {friend.questLabel && (
          <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-medium text-muted-foreground">{friend.questLabel}</span>
        )}
        {friend.characteristic && (
          <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-medium text-accent">{friend.characteristic}</span>
        )}
      </div>
      <button
        onClick={() => setReacted(true)}
        className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition-all ${
          reacted ? "border-accent/30 bg-accent/10 text-accent" : "border-border bg-secondary text-muted-foreground hover:text-foreground"
        }`}
      >
        {reacted ? "Cheered!" : "Cheer"}
      </button>
    </div>
  )
}

function RelativeProgressCard({ characteristics }: { characteristics: Characteristic[] }) {
  const sorted = [...characteristics].sort((a, b) => (b.thisWeek + b.lastWeek) - (a.thisWeek + a.lastWeek)).slice(0, 6)
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">This Week vs Last Week</h3>
      <div className="flex flex-col gap-4">
        {sorted.map((char) => {
          const delta = char.thisWeek - char.lastWeek
          const Icon = getAxisIcon(char.key)
          const maxVal = Math.max(char.thisWeek, char.lastWeek, 1)
          return (
            <div key={char.key} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 ${getAxisColor(char.key)}`} />
                  <span className="text-xs font-medium text-foreground">{char.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {delta > 0 && <TrendingUp className="h-3 w-3 text-primary" />}
                  {delta < 0 && <TrendingDown className="h-3 w-3 text-destructive" />}
                  {delta === 0 && <Minus className="h-3 w-3 text-muted-foreground" />}
                  <span className={`text-[10px] font-bold ${delta > 0 ? "text-primary" : delta < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex flex-1 flex-col gap-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(char.thisWeek / maxVal) * 100}%` }} />
                  </div>
                  <span className="text-[9px] text-muted-foreground">This wk: {char.thisWeek}</span>
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary/40 transition-all" style={{ width: `${(char.lastWeek / maxVal) * 100}%` }} />
                  </div>
                  <span className="text-[9px] text-muted-foreground">Last wk: {char.lastWeek}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- task card with circle toggle ---------- */

function TaskCard({
  task,
  idx,
  questTitle,
  questMode,
  onToggle,
}: {
  task: { id: string; title: string; status: string; failCount?: number; failTotal?: number }
  idx: number
  questTitle: string
  questMode: string
  onToggle: (id: string) => void
}) {
  const TaskIcon = getTaskIcon(task.title, questTitle)
  const colorClass = ICON_COLORS[idx % ICON_COLORS.length]
  const bgClass = ICON_BG[idx % ICON_BG.length]
  const isDone = task.status === "done"

  if (task.status === "transferred") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 p-4 opacity-70">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
          <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-muted-foreground line-through">{task.title}</p>
          <p className="text-[10px] text-muted-foreground">Transferred to tomorrow</p>
        </div>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-semibold uppercase text-muted-foreground">Casual</span>
      </div>
    )
  }

  if (task.status === "failed") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 animate-red-pulse">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/15">
          <Skull className="h-4 w-4 text-destructive" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-destructive">{task.title}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-[10px] text-destructive">Failed: {task.failCount ?? 0}/{task.failTotal ?? 0}</span>
            <span className="text-[10px] text-muted-foreground">Streak reset to 0</span>
          </div>
        </div>
        <Skull className="h-4 w-4 shrink-0 text-destructive/60" />
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${isDone ? "border-primary/20 bg-primary/5" : "border-border bg-card hover:bg-secondary/50"}`}>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isDone ? "bg-primary/15" : bgClass}`}>
        <TaskIcon className={`h-4 w-4 ${isDone ? "text-primary" : colorClass}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${isDone ? "text-primary/70 line-through" : "text-foreground"}`}>{task.title}</p>
        <p className={`truncate text-xs ${isDone ? "text-primary/40" : "text-muted-foreground"}`}>{questTitle}</p>
      </div>
      <button
        onClick={() => onToggle(task.id)}
        className="group relative flex h-7 w-7 shrink-0 items-center justify-center"
        aria-label={isDone ? "Mark as incomplete" : "Mark as complete"}
      >
        {isDone ? (
          <CheckCircle2 className="h-6 w-6 text-primary transition-transform group-active:scale-90" />
        ) : (
          <Circle className="h-6 w-6 text-muted-foreground/50 transition-colors group-hover:text-primary/60 group-active:scale-90" />
        )}
      </button>
    </div>
  )
}


/* ---------- tab: progress ---------- */

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"]

function ProgressTab() {
  const { userProgress, quests } = useApp()
  const totalTasksDone = quests.reduce((acc, q) => acc + q.tasks.filter((t) => t.status === "done").length, 0)

  return (
    <div className="flex flex-col gap-6 px-6 pt-6 lg:px-10 lg:pt-8">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Zap className="mx-auto h-5 w-5 text-primary" />
          <p className="mt-1 text-xl font-bold text-foreground">{userProgress.xp}</p>
          <p className="text-[10px] text-muted-foreground">Total XP</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Flame className="mx-auto h-5 w-5 text-streak" />
          <p className="mt-1 text-xl font-bold text-foreground">{userProgress.megaStreak}</p>
          <p className="text-[10px] text-muted-foreground">Streak</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <CheckCircle2 className="mx-auto h-5 w-5 text-quest" />
          <p className="mt-1 text-xl font-bold text-foreground">{totalTasksDone}</p>
          <p className="text-[10px] text-muted-foreground">Tasks Done</p>
        </div>
      </div>

      {/* GitHub-style Heatmap */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contributions</h2>
        <ActivityHeatmap />
      </section>

      {/* Life Radar + Weekly Progress side-by-side on desktop */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Life Radar</h2>
          <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-6">
            <RadarDiagram
              characteristics={userProgress.characteristics}
              size={280}
              animated
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weekly Progress</h2>
          <RelativeProgressCard characteristics={userProgress.characteristics} />
        </section>
      </div>

      {/* Weekly Bar Chart */}
      <section className="pb-2">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">This Week</h2>
        <div className="flex items-end justify-between gap-2 rounded-xl border border-border bg-card p-4">
          {userProgress.weekActivity.map((active, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className={`h-10 w-full rounded-lg transition-colors ${active ? "bg-primary" : "bg-secondary"}`} />
              <span className="text-[10px] font-medium text-muted-foreground">{DAY_LABELS[i]}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

/* ---------- tab: social ---------- */

function SocialTab() {
  const { userProgress, jointQuests, setCurrentJointQuest, setScreen } = useApp()
  const { user } = useAuth()
  const meId = user?.userId ?? ""
  const [activeSection, setActiveSection] = useState<"feed" | "friends">("feed")

  return (
    <div className="flex flex-col gap-6 px-6 pt-6 lg:px-10 lg:pt-8">
      {/* Section Toggle */}
      <div className="flex gap-2 rounded-xl bg-secondary p-1 lg:max-w-sm">
        <button
          onClick={() => setActiveSection("feed")}
          className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
            activeSection === "feed" ? "bg-card text-foreground" : "text-muted-foreground"
          }`}
        >
          Activity Feed
        </button>
        <button
          onClick={() => setActiveSection("friends")}
          className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
            activeSection === "friends" ? "bg-card text-foreground" : "text-muted-foreground"
          }`}
        >
          Friends
        </button>
      </div>

      {activeSection === "feed" ? (
        <>
          {/* Joint Quests */}
          {jointQuests.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-accent" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Joint Quests</h2>
              </div>
              <div className="flex flex-col gap-3">
                {jointQuests.map((jq) => {
                  const me = findPlayerByUserId(jq, meId) ?? jq.players[0]
                  const opp = findOpponent(jq, meId) ?? jq.players[1]
                  if (!me || !opp) return null
                  const meLeading = me.rankPoints >= opp.rankPoints
                  const daysLeft = daysLeftFromDeadline(jq.deadline)
                  const meName = me.name || "You"
                  const oppName = opp.name || "Friend"
                  return (
                    <button
                      key={jq.id}
                      onClick={() => {
                        setCurrentJointQuest(jq)
                        setScreen("collab-friend-status")
                      }}
                      className="group w-full rounded-2xl border border-accent/20 bg-card p-5 text-left transition-all hover:bg-accent/5 active:scale-[0.98]"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                            <Users className="h-5 w-5 text-accent" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{jq.title}</h3>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-accent">Joint</span>
                              <div className="flex items-center gap-1">
                                <Timer className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">{Math.max(0, daysLeft)}d left</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </div>

                      <div className="flex gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                              {me.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={me.avatarUrl} alt={meName} className="h-full w-full object-cover" />
                              ) : (
                                getInitial(meName)
                              )}
                            </div>
                            <span className="text-[10px] text-foreground">{meName}</span>
                            {meLeading && <Crown className="h-3 w-3 text-accent" />}
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${me.totalTasks > 0 ? (me.progress / me.totalTasks) * 100 : 0}%` }} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-accent/10 text-[9px] font-bold text-accent">
                              {opp.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={opp.avatarUrl} alt={oppName} className="h-full w-full object-cover" />
                              ) : (
                                getInitial(oppName)
                              )}
                            </div>
                            <span className="text-[10px] text-foreground">{oppName}</span>
                            {!meLeading && <Crown className="h-3 w-3 text-accent" />}
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${opp.totalTasks > 0 ? (opp.progress / opp.totalTasks) * 100 : 0}%` }} />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 rounded-xl bg-secondary/50 px-3 py-2">
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-primary" />
                          <span className="text-[10px] font-bold text-foreground">{me.rankPoints}</span>
                          <span className="text-[10px] text-muted-foreground">pts</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Flame className="h-3 w-3 text-streak" />
                          <span className="text-[10px] font-bold text-streak">{me.longestStreak}d</span>
                        </div>
                        <div className="mx-auto text-[10px] text-muted-foreground">vs</div>
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-accent" />
                          <span className="text-[10px] font-bold text-foreground">{opp.rankPoints}</span>
                          <span className="text-[10px] text-muted-foreground">pts</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Flame className="h-3 w-3 text-streak" />
                          <span className="text-[10px] font-bold text-streak">{opp.longestStreak}d</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {/* Friend Activity Feed */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Friend Activity</h2>
            {userProgress.friends.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {userProgress.friends.map((friend) => (
                  <SocialFeedCard key={friend.id} friend={friend} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No friend activity yet</p>
                <p className="mt-1 text-xs text-muted-foreground/70">Start a joint quest to see your friends here</p>
              </div>
            )}
          </section>
        </>
      ) : (
        <section>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {userProgress.friends.map((friend) => (
              <div key={friend.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-sm font-bold text-accent">
                  {friend.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={friend.avatarUrl} alt={friend.name} className="h-full w-full object-cover" />
                  ) : (
                    getInitial(friend.name)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{friend.name}</p>
                  <p className="text-xs text-muted-foreground">{friend.questLabel ?? formatFriendAction(friend)}</p>
                </div>
                <button className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-1.5 text-[10px] font-semibold text-accent transition-colors hover:bg-accent/10">
                  Challenge
                </button>
              </div>
            ))}
          </div>

          {/* Start Joint Quest */}
          <button
            onClick={() => setScreen("collab-quest-settings")}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-accent/30 bg-accent/5 p-5 text-accent transition-all hover:border-accent/50 hover:bg-accent/10 active:scale-[0.98]"
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm font-semibold">Start Joint Quest</span>
          </button>
        </section>
      )}
    </div>
  )
}

/* ---------- tab: home ---------- */

function HomeTab() {
  const {
    quests,
    userProgress,
    setCurrentQuest,
    setScreen,
    setQuests,
    setActiveCampaignId,
    isPaused,
    togglePause,
    habits,
    toggleTaskStatus,
    toggleHabit,
    refreshHabitsFromApi,
    setEditingHabit,
  } = useApp()
  const [showScheduleSheet, setShowScheduleSheet] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const { campaigns } = await listCampaigns()
        if (cancelled || !campaigns?.length) return
        const allQuests: Quest[] = []
        for (const raw of campaigns) {
          const rec = asRecord(raw)
          const id = str(rec?.campaign_id, str(rec?.id, ""))
          if (!id) continue
          const bundle = await getCampaign(id)
          if (cancelled) return
          allQuests.push(...mapGetCampaignResponse(bundle))
        }
        if (!cancelled && allQuests.length > 0) setQuests(allQuests)
      } catch {
        /* сеть / неавторизован */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [setQuests])

  useEffect(() => {
    refreshHabitsFromApi()
  }, [refreshHabitsFromApi])

  const openQuestRoadmap = (quest: (typeof quests)[number]) => {
    if (quest.campaignId) setActiveCampaignId(quest.campaignId)
    setCurrentQuest(quest)
    setScreen("quest-roadmap")
  }

  const todaysTasks = quests.flatMap((q) =>
    q.tasks
      .filter((t) => t.status === "active" || t.status === "pending" || t.status === "transferred" || t.status === "failed" || t.status === "done")
      .slice(0, 3)
      .map((t, idx) => ({ ...t, questTitle: q.title, questMode: q.mode, colorIdx: idx }))
  )

  return (
    <div className="flex flex-col gap-0">
      <div className="grid grid-cols-1 gap-6 px-6 pt-6 lg:grid-cols-2 lg:items-start lg:gap-x-8 lg:px-10 lg:pt-8">
        {/* Main Campaign */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Main Campaign</h2>
          <div className="flex flex-col gap-3">
            {quests.length > 0 ? (
              quests.map((quest) => {
                const questPaused = isPaused || quest.paused

                if (questPaused) {
                  return (
                    <div key={quest.id} className="w-full rounded-2xl border border-muted-foreground/15 bg-secondary/40 p-5 opacity-60">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                            <Sword className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-muted-foreground">{quest.title}</h3>
                            <span className="mt-0.5 inline-block rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">On Pause</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{quest.progress}/{quest.totalTasks} tasks</span>
                          <span>{Math.round((quest.progress / quest.totalTasks) * 100)}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-muted-foreground/30 transition-all" style={{ width: `${(quest.progress / quest.totalTasks) * 100}%` }} />
                        </div>
                      </div>
                      <button
                        onClick={() => togglePause()}
                        className="mt-3 w-full rounded-xl border border-primary/30 bg-primary/5 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                      >
                        Resume Quest
                      </button>
                    </div>
                  )
                }

                return (
                  <button
                    key={quest.id}
                    onClick={() => openQuestRoadmap(quest)}
                    className="group w-full rounded-2xl border border-border bg-card p-5 text-left transition-all hover:bg-secondary/30 active:scale-[0.98]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                          <Sword className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{quest.title}</h3>
                          <span className="mt-0.5 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-primary">{quest.mode}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{quest.progress}/{quest.totalTasks} tasks</span>
                        <span>{Math.round((quest.progress / quest.totalTasks) * 100)}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(quest.progress / quest.totalTasks) * 100}%` }} />
                      </div>
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="rounded-xl border border-dashed border-border/50 bg-card/50 p-6 text-center">
                <p className="text-sm text-muted-foreground">No active quests yet</p>
              </div>
            )}
          </div>
        </section>

        {/* Daily Habits */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daily Habits</h2>
            <button
              onClick={() => setScreen("add-habit-entry")}
              className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/80"
            >
              <Plus className="h-3 w-3" />
              Add Habit
            </button>
          </div>
          {habits.length > 0 ? (
            <div className="flex flex-col gap-2">
              {habits.map((habit) => {
                const HabitIcon = getTaskIcon(habit.title, habit.characteristic || "")
                return (
                  <div key={habit.id} className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${habit.completed ? "border-primary/20 bg-primary/5" : "border-border bg-card"}`}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${habit.completed ? "bg-primary/15" : "bg-secondary"}`}>
                      {habit.emoji ? (
                        <span className="text-lg leading-none" role="img" aria-hidden>
                          {habit.emoji}
                        </span>
                      ) : (
                        <HabitIcon className={`h-4 w-4 ${habit.completed ? "text-primary" : "text-muted-foreground"}`} />
                      )}
                    </div>
                    <button
                      onClick={() => { setEditingHabit(habit); setScreen("create-habit-manual") }}
                      className="min-w-0 flex-1 text-left"
                      aria-label={`Edit ${habit.title}`}
                    >
                      <p className={`truncate text-sm font-medium ${habit.completed ? "text-primary/70 line-through" : "text-foreground"}`}>{habit.title}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Flame className="h-3 w-3 text-streak" />
                        <span className="text-[10px] font-bold text-streak">{habit.streak}d</span>
                      </div>
                    </button>
                    <button
                      onClick={() => toggleHabit(habit.id)}
                      className="group flex h-7 w-7 shrink-0 items-center justify-center"
                      aria-label={habit.completed ? "Mark as incomplete" : "Mark as complete"}
                    >
                      {habit.completed ? (
                        <CheckCircle2 className="h-6 w-6 text-primary transition-transform group-active:scale-90" />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground/50 transition-colors group-hover:text-primary/60 group-active:scale-90" />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <button
              onClick={() => setScreen("add-habit-entry")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card/50 p-5 text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-semibold">Create your first habit</span>
            </button>
          )}
        </section>

        {/* Today's Tasks */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{"Today's Tasks"}</h2>
            <button onClick={() => setScreen("day-summary")} className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/80">
              <ClipboardList className="h-3 w-3" />
              Day Summary
            </button>
          </div>
          {todaysTasks.length > 0 ? (
            <div className="flex flex-col gap-2">
              {todaysTasks.map((task, idx) => (
                <TaskCard key={task.id} task={task} idx={idx} questTitle={task.questTitle} questMode={task.questMode} onToggle={toggleTaskStatus} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border/50 bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">All caught up for today!</p>
            </div>
          )}
        </section>

        {/* Create New Quest */}
        <section className="flex flex-col gap-3 pb-2">
          <button
            onClick={() => setScreen("goal-input")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card/50 p-5 text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary active:scale-[0.98]"
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm font-semibold">Create New Quest</span>
          </button>
        </section>
      </div>

      {showScheduleSheet && <ScheduleSheet onClose={() => setShowScheduleSheet(false)} onConfirm={() => setShowScheduleSheet(false)} />}
    </div>
  )
}

/* ---------- tab: profile ---------- */

function profileInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0]?.[0] ?? "?").toUpperCase()
}

function ProfileTab() {
  const { user } = useAuth()
  const { userProgress, quests, habits, setScreen } = useApp()
  const totalTasksDone = quests.reduce((acc, q) => acc + q.tasks.filter((t) => t.status === "done").length, 0)
  const totalQuests = quests.length
  const streak = userProgress.megaStreak
  const charName = user?.character.name?.trim() || "Adventurer"
  const levelPct = userProgress.levelProgressPercent
  const avatarUrl = userProgress.avatarUrl
  const bio = userProgress.bio?.trim() ?? ""

  return (
    <div className="flex flex-col gap-6 px-6 pt-6 lg:px-10 lg:pt-8">
      {/* Streak + Level Header */}
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-streak/15">
          <Flame className="h-8 w-8 text-streak" />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-foreground">{streak}</span>
            <span className="text-sm text-muted-foreground">day streak</span>
          </div>
          <div className="mt-1 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-accent" />
                <span className="text-xs text-muted-foreground">
                  Level {userProgress.level}
                  {userProgress.currentLevelName ? ` · ${userProgress.currentLevelName}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">{userProgress.xp} XP</span>
              </div>
            </div>
            {levelPct != null && Number.isFinite(levelPct) && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, levelPct))}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avatar + Name */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-xl font-bold text-accent">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={charName} className="h-full w-full object-cover" />
          ) : (
            profileInitials(charName)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold text-foreground">{charName}</h2>
          <p className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</p>
          {bio && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/80">{bio}</p>}
        </div>
        <button
          type="button"
          onClick={() => setScreen("edit-profile")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
          aria-label="Edit profile"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Trophy className="mx-auto h-5 w-5 text-accent" />
          <p className="mt-1 text-xl font-bold text-foreground">{totalQuests}</p>
          <p className="text-[10px] text-muted-foreground">Quests</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <CheckCircle2 className="mx-auto h-5 w-5 text-primary" />
          <p className="mt-1 text-xl font-bold text-foreground">{totalTasksDone}</p>
          <p className="text-[10px] text-muted-foreground">Completed</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Calendar className="mx-auto h-5 w-5 text-quest" />
          <p className="mt-1 text-xl font-bold text-foreground">{userProgress.activeDaysCount ?? 0}</p>
          <p className="text-[10px] text-muted-foreground">Active Days</p>
        </div>
      </div>

      {/* Life Radar + Habits side-by-side on desktop */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
        {/* Life Radar Mini */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Life Radar</h2>
          <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-4">
            <RadarDiagram
              characteristics={userProgress.characteristics}
              size={220}
              showLabels
            />
          </div>
        </section>

        {/* Habits */}
        {habits.length > 0 && (
          <section className="pb-2">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Habits</h2>
          <div className="flex flex-col gap-2">
            {habits.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                <span className="text-sm text-foreground">{h.title}</span>
                <div className="flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-streak" />
                  <span className="text-xs font-bold text-streak">{h.streak}d</span>
                </div>
              </div>
            ))}
          </div>
        </section>
        )}
      </div>
    </div>
  )
}

/* ---------- navigation ---------- */

const NAV_TABS = [
  { id: "home", label: "Home", icon: Home },
  { id: "social", label: "Social", icon: MessageCircle },
  { id: "progress", label: "Progress", icon: BarChart3 },
  { id: "profile", label: "Profile", icon: User },
]

/* Desktop: persistent left sidebar (brand · nav · user + sign out). */
function SidebarNav({ active, onNavigate }: { active: string; onNavigate: (tab: string) => void }) {
  const { user, signOut } = useAuth()
  const charName = user?.character.name?.trim() || "Adventurer"

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/60 bg-card/40 backdrop-blur-xl lg:flex">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
          <Sword className="h-5 w-5 text-primary" />
        </div>
        <span className="font-display text-lg font-bold tracking-tight text-foreground">QuestForge</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {tab.label}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-border/60 p-3">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
            {profileInitials(charName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{charName}</p>
            <p className="truncate text-[11px] text-muted-foreground">{user?.email ?? ""}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          Выйти
        </button>
      </div>
    </aside>
  )
}

/* Mobile: bottom tab bar. */
function BottomNav({ active, onNavigate }: { active: string; onNavigate: (tab: string) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 pb-6 pt-2 backdrop-blur-lg lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
              aria-label={tab.label}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

/* ---------- main export ---------- */

function greetingForHour(hour: number): string {
  if (hour < 5) return "Late night"
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

export function HomeScreen() {
  const [activeTab, setActiveTab] = useState("home")
  const { refreshCharacterFromApi } = useApp()
  const [greeting, setGreeting] = useState("Welcome back")

  useEffect(() => {
    setGreeting(greetingForHour(new Date().getHours()))
  }, [])

  useEffect(() => {
    refreshCharacterFromApi()
  }, [refreshCharacterFromApi])

  const title =
    activeTab === "home" ? greeting : activeTab === "social" ? "Social" : activeTab === "progress" ? "Progress" : "Profile"

  return (
    <div className="min-h-dvh lg:pl-64">
      <SidebarNav active={activeTab} onNavigate={setActiveTab} />

      <div className="mx-auto w-full max-w-5xl">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-background/70 px-6 py-4 backdrop-blur-xl lg:px-10 lg:py-6">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground lg:text-3xl">{title}</h1>
          <button
            onClick={() => setActiveTab("profile")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary lg:hidden"
            aria-label="Profile"
          >
            <User className="h-5 w-5 text-foreground" />
          </button>
        </header>

        <div className="pb-28 lg:pb-12">
          {activeTab === "home" && <HomeTab />}
          {activeTab === "social" && <SocialTab />}
          {activeTab === "progress" && <ProgressTab />}
          {activeTab === "profile" && <ProfileTab />}
        </div>
      </div>

      <BottomNav active={activeTab} onNavigate={setActiveTab} />
    </div>
  )
}
