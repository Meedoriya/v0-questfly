import type { OnboardingConversationMessage, OnboardingQuestion } from "@/lib/api/onboarding"
import type { ChatMessage } from "@/lib/types"
import { normalizeApiOptions } from "@/lib/chat-options"

function mapApiRole(role: string): "ai" | "user" {
  const r = role.toLowerCase()
  if (r === "user") return "user"
  return "ai"
}

export function questionToAiMessage(question: OnboardingQuestion, id: string): ChatMessage {
  return {
    id,
    role: "ai",
    content: question.content,
    options: normalizeApiOptions(question.options),
  }
}

export function conversationToChatMessages(rows: OnboardingConversationMessage[]): ChatMessage[] {
  return rows.map((m, i) => ({
    id: `conv-${i}-${mapApiRole(m.role)}`,
    role: mapApiRole(m.role),
    content: m.content,
    options: normalizeApiOptions(m.options),
  }))
}

export function newUserMessage(content: string): ChatMessage {
  return {
    id: `user-${crypto.randomUUID?.() ?? Date.now()}`,
    role: "user",
    content,
  }
}
