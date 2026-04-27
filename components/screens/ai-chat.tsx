"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useApp } from "@/lib/store"
import {
  generateOnboardingQuests,
  getOnboardingConversation,
  sendOnboardingMessage,
  waitForOnboardingGeneration,
} from "@/lib/api/onboarding"
import { ApiError } from "@/lib/api/errors"
import { conversationToChatMessages, newUserMessage, questionToAiMessage } from "@/lib/onboarding-messages"
import { getOptionKey, getOptionLabel, getOptionSubmitValue, getLastAiWithOptions } from "@/lib/chat-options"
import { stripLastAiOptions } from "@/lib/strip-ai-options"
import { hydrateCampaignState } from "@/lib/hydrate-campaign"
import { Bot, Loader2, Send } from "lucide-react"

export function AiChatScreen() {
  const {
    goal,
    onboardingCampaignId,
    chatMessages,
    addChatMessage,
    setChatMessages,
    setQuests,
    setCurrentQuest,
    setCurrentTask,
    setActiveCampaignId,
    setOnboardingCampaignId,
    setScreen,
  } = useApp()

  const [isTyping, setIsTyping] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [canGenerate, setCanGenerate] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [inputFocused, setInputFocused] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const conversationSyncedRef = useRef(false)

  useEffect(() => {
    if (!onboardingCampaignId) {
      setScreen("goal-input")
    }
  }, [onboardingCampaignId, setScreen])

  useEffect(() => {
    const id = onboardingCampaignId
    if (!id || conversationSyncedRef.current) return
    conversationSyncedRef.current = true
    void (async () => {
      try {
        const conv = await getOnboardingConversation(id)
        const mapped = conversationToChatMessages(conv.messages)
        if (mapped.length > 0) setChatMessages(mapped)
      } catch {
        conversationSyncedRef.current = false
      }
    })()
  }, [onboardingCampaignId, setChatMessages])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [chatMessages, isTyping, isGenerating])

  const sendUserText = useCallback(
    async (text: string) => {
      const id = onboardingCampaignId
      if (!id || !text.trim() || isTyping || isGenerating) return

      setError(null)
      const trimmed = text.trim()
      setChatMessages((prev) => [...stripLastAiOptions(prev), newUserMessage(trimmed)])
      setIsTyping(true)
      setCanGenerate(false)

      try {
        const data = await sendOnboardingMessage(id, trimmed)
        setCanGenerate(data.can_generate)
        if (data.question) {
          addChatMessage(
            questionToAiMessage(data.question, `ai-${id}-${Date.now()}`),
          )
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Не удалось отправить сообщение")
      } finally {
        setIsTyping(false)
      }
    },
    [onboardingCampaignId, addChatMessage, setChatMessages, isTyping, isGenerating],
  )

  async function onGenerateQuests() {
    const id = onboardingCampaignId
    if (!id || isGenerating) return
    setError(null)
    setIsGenerating(true)
    addChatMessage({
      id: `ai-building-${Date.now()}`,
      role: "ai",
      content: "Генерирую персональные квесты…",
    })
    try {
      await generateOnboardingQuests(id)
      await waitForOnboardingGeneration(id)
      const hydrated = await hydrateCampaignState(id)
      setQuests(hydrated.quests)
      setCurrentQuest(hydrated.currentQuest)
      setCurrentTask(hydrated.currentTask)
      setActiveCampaignId(id)
      setOnboardingCampaignId(null)
      setChatMessages([])
      setScreen("loading")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Генерация не удалась")
    } finally {
      setIsGenerating(false)
    }
  }

  const lastAiWithOptions = getLastAiWithOptions(chatMessages)
  const showChips =
    !isTyping && !isGenerating && lastAiWithOptions?.options?.length

  if (!onboardingCampaignId) {
    return null
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-5 py-4 backdrop-blur-lg">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-4.5 w-4.5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">QuestForge AI</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {goal ? goal : "online"}
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-4 pt-5">
        <div className="mx-auto flex max-w-sm flex-col gap-4">
          {chatMessages.map((msg, i) => (
            <div
              key={msg.id}
              className="animate-float-up"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              {msg.role === "ai" ? (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-secondary px-4 py-3 text-sm leading-relaxed text-foreground">
                    {msg.content}
                    {msg.id.startsWith("ai-building") && (
                      <Loader2 className="ml-2 inline-block h-4 w-4 animate-spin text-primary" />
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground">
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 animate-float-up">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md bg-secondary px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur-lg">
        {error && <p className="px-4 pt-3 text-center text-sm text-destructive">{error}</p>}

        {canGenerate && !isGenerating && (
          <div className="px-4 pt-3">
            <button
              type="button"
              onClick={() => void onGenerateQuests()}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Сгенерировать квесты
            </button>
          </div>
        )}

        {showChips && lastAiWithOptions?.options && (
          <div className="flex gap-2 overflow-x-auto px-4 pb-2 pt-3 scrollbar-hide">
            {lastAiWithOptions.options.map((opt, idx) => (
              <button
                key={getOptionKey(opt, idx)}
                type="button"
                disabled={isTyping || isGenerating}
                onClick={() => void sendUserText(getOptionSubmitValue(opt))}
                className="shrink-0 rounded-full border border-primary/25 bg-primary/5 px-4 py-2 text-[13px] font-medium text-primary transition-all hover:bg-primary/10 active:scale-95 disabled:opacity-50"
              >
                {getOptionLabel(opt)}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 px-4 pb-6 pt-2">
          <div
            className={`flex flex-1 items-center rounded-2xl border bg-secondary px-4 py-3 transition-all ${
              inputFocused ? "border-primary/50 ring-2 ring-primary/20" : "border-border"
            }`}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void sendUserText(inputValue)
                  setInputValue("")
                }
              }}
              placeholder="Ответьте текстом…"
              disabled={isTyping || isGenerating}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-40"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              void sendUserText(inputValue)
              setInputValue("")
            }}
            disabled={!inputValue.trim() || isTyping || isGenerating}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:brightness-110 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
