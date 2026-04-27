import type { ChatMessage } from "@/lib/types"

/** Убирает options у последнего AI-сообщения (после ответа пользователя чипы не должны оставаться активными). */
export function stripLastAiOptions(msgs: ChatMessage[]): ChatMessage[] {
  const next = [...msgs]
  for (let i = next.length - 1; i >= 0; i--) {
    if (next[i].role === "ai" && next[i].options?.length) {
      next[i] = { ...next[i], options: undefined }
      break
    }
  }
  return next
}
