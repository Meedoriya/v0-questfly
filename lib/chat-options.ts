import type { ChatMessage, ChatOptionEntry } from "@/lib/types"

export type { ChatOptionEntry }

export function getOptionKey(opt: ChatOptionEntry, index: number): string {
  return typeof opt === "string" ? opt : `${opt.value}:${index}`
}

export function getOptionLabel(opt: ChatOptionEntry): string {
  return typeof opt === "string" ? opt : opt.label
}

export function getOptionSubmitValue(opt: ChatOptionEntry): string {
  return typeof opt === "string" ? opt : opt.value
}

export function normalizeApiOptions(options?: { value: string; label: string }[]): ChatOptionEntry[] | undefined {
  if (!options?.length) return undefined
  return options.map((o) => ({ value: o.value, label: o.label }))
}

/** Сообщения с опциями для UI (последний AI с options). */
export function getLastAiWithOptions(messages: ChatMessage[]): ChatMessage | undefined {
  return [...messages].reverse().find((m) => m.role === "ai" && m.options?.length)
}
